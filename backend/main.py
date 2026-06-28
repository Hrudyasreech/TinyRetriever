import os
from uuid import UUID
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_
from dotenv import load_dotenv
from retrieve_context import retrieve_context, retrieve_document_sections
from llm_service import get_chat_response, get_compare_response, get_summary_response, get_literature_review_response

from extract import extract_text_from_pdf, extract_doi, get_metadata_from_crossref, get_metadata_from_llm 
from retrieval import chunk_text, embed_chunks, create_or_update_index, search_index, load_index, save_index, search_filtered_index, rebuild_faiss
from section_parser import split_sections, classify_question, get_allowed_sections, get_section_group
from bm25_retrieval import build_bm25_index, search_bm25_index, rebuild_bm25, save_bm25, load_bm25
from markdown_builder import comparison_to_markdown
from retrieval_config import COMPARE_SECTIONS, SUMMARY_SECTIONS, LITERATURE_REVIEW_SECTIONS

from db.database import engine, SessionLocal
from db.models import Base, Project, Document, Chunk, ChatSession, ChatMessage, User

# 1. Initialize environment properties
load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY is not defined in your .env configuration file.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Loads the global vector matrix search state on startup
    app.state.index = load_index()
    app.state.bm25 = load_bm25()
    print("🚀 FAISS Global Vector Index initialized successfully.")
    yield

app = FastAPI(lifespan=lifespan)

# Match your exact local workspace testing port
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_origin_regex=r"http://(127\.0\.0\.1|localhost):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def validate_chat_session(chat_id: UUID, project_id: UUID, db: Session = Depends(get_db)):
    chat_session = db.query(ChatSession).filter(ChatSession.id == chat_id).first()
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    if chat_session.project_id != project_id:
        raise HTTPException(status_code=404, detail="Chat session does not belong to this project")
   
# ─── PYDANTIC VALIDATION MODELS ─────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: str = None

class QuestionRequest(BaseModel):
    question: str
    project_id: UUID
    chat_id: UUID  # incoming unique dynamic browser tracking UUID string
    selected_paper_ids: list[UUID] = []
    instructions: str | None = None

class AnalysisRequest(BaseModel):
    chat_id: UUID  # incoming unique dynamic browser tracking UUID string
    selected_paper_ids: list[UUID]
    instructions: str | None = None
    question: str 


# ─── 1. NEW: PROJECT ARCHITECTURE WORKSPACE ENDPOINTS ─────────────────

@app.post("/projects/")
async def create_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
    try:
        user = db.query(User).first()

        if not user:
                user = User(
                email="developer@example.com",
                name="Developer"
            )

        db.add(user)
        db.commit()
        db.refresh(user)

        project = Project(
            name=project_data.name,
            description=project_data.description,
            user_id=user.id
        )

        db.add(project)
        db.commit()
        db.refresh(project)
        
        chat = ChatSession(project_id=project.id, title="New Chat")
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return {
            "id": str(project.id),
            "name": project.name,
            "description": project.description or "",
            "emoji": "📁",
            "papers": [],
            "chats": [
                {
                    "id": str(chat.id),
                    "title": chat.title,
                    "updated": "Just now",
                    "messages": []
                }
            ]}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate project record: {str(e)}")

@app.get("/projects/")
async def list_projects(db: Session = Depends(get_db)):
    try:
        projects = db.query(Project).all()

        return [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description or "",
                "emoji": "📁",
                "papers": [
                    {
                        "id": str(d.id),
                        "title": d.title or d.filename,
                        "authors": d.authors.split(", ") if d.authors else ["Unknown Author"],
                        "year": d.published_year or 0,
                        "venue": d.journal or "Unknown Venue",
                        "doi": d.doi or "Unknown",
                        "keywords": [],
                        "abstract": d.abstract or "",
                        "citations": 0,
                        "pages": 0,
                        "status": "processed",
                        "color": "oklch(0.62 0.13 220)",
                    }
                    for d in p.documents
                ],

                "chats": [
                    {
                        "id": str(c.id),
                        "title": c.title or "New Chat",
                        "messages": []
                    }
                    for c in p.chatsessions
                ]
            }
            for p in projects 
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch workspace dashboard cards: {str(e)}"
        )

@app.delete("/projects/{project_id}")
async def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    project = db.query(Project).filter(
    Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(404)

    db.delete(project)
    db.commit()

# ─── 2. RECONSTRUCTED UPLOAD ROUTE (SCOPED TO PROJECT) ────────────────

@app.post("/upload/")
async def upload_pdf(project_id: UUID = Query(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verify target project workspace container physically exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Target project workspace context not found.")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
            
        # Bind the incoming file directly to the active project_id
        document = Document(filename=file.filename, project_id=project_id)
        db.add(document)
        db.commit()
        db.refresh(document)
        
        text, first_page = extract_text_from_pdf(contents)
        text = text.replace("\x00", "")  # Remove null characters if present
        first_page = first_page.replace("\x00", "")  # Remove null characters if present
        if not text or not text.strip():
            text = "Empty document context placeholder text."

        sections = split_sections(text)
        doi = extract_doi(first_page)

        metadata = None
        if doi:
            metadata = get_metadata_from_crossref(doi)
        if not metadata:
            metadata = get_metadata_from_llm(sections.get("metadata", "")) 
        
        if metadata:
            document.title = metadata["title"]
            document.authors = ", ".join(metadata["authors"])
            document.affiliations = ", ".join(metadata["affiliations"])
            document.doi = metadata["doi"]
            document.publisher = metadata["publisher"]
            document.journal = metadata["journal"]
            document.published_year = metadata["published_year"]

            db.commit()

        
        stored_chunks_ids = []
        stored_chunks = []
        all_chunk_text = []

        for section_name, section_text in sections.items():
            if "\x00" in section_text:
                print(f"⚠️ Null character detected in section '{section_name}' of document '{file.filename}'. Cleaning up.")
            chunks = chunk_text(section_text)
            for idx, chunk_text_val in enumerate(chunks):
                chunk = Chunk(chunk_text=chunk_text_val, document_id=document.id, section=section_name, section_group=get_section_group(section_name), chunk_index=idx)
                db.add(chunk)
                db.flush() 
                stored_chunks_ids.append(chunk.id)
                stored_chunks.append(chunk)
                all_chunk_text.append(chunk_text_val)
        print(db.query(Chunk).count())
        db.commit()

        embeddings = embed_chunks(all_chunk_text)
        
        for chunk, embedding in zip(stored_chunks, embeddings):
            chunk.embedding = embedding.tolist()
        db.commit()

        all_chunks = db.query(Chunk).all()
        build_bm25_index(all_chunks)
             
        # Update the memory index pool and write safely to local binary tree storage
        app.state.index = create_or_update_index(embeddings, stored_chunks_ids, app.state.index)
        save_index(app.state.index)
        rebuild_bm25(db)
        print("Building BM25 from", len(all_chunks), "chunks")
        
        return JSONResponse(content={"message": "PDF uploaded and appended to workspace index."})

    except Exception as e:
        db.rollback()
        print(f"⚠️ Error uploading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backend processing failure: {str(e)}")

# ─── 3. RECONSTRUCTED INTERACTION COMPONENT (WITH HISTORY CONTEXTS) ──
@app.post("/ask/")
async def ask_question(request: QuestionRequest, db: Session = Depends(get_db)):
    question = request.question
    project_id = request.project_id
    chat_id = request.chat_id
    selected_paper_ids = request.selected_paper_ids
    instructions = request.instructions

    validate_chat_session(chat_id=chat_id, project_id=project_id, db=db)

    # Save User Message
    db.add(ChatMessage(role="user",message_type="chat", message=question, session_id=chat_id))
    db.commit()

    retrieval_data = retrieve_context(
        question=question,
        project_id=project_id,
        selected_paper_ids=selected_paper_ids,
        db=db,
        index=app.state.index
    )
    context_text = retrieval_data["context_text"]
    sources = retrieval_data["sources"]

    answer = get_chat_response(context_text=context_text, question=question, instructions=instructions)

    # Save Assistant Message
    db.add(ChatMessage(role="assistant", message_type="chat", message=answer, session_id=chat_id))
    db.commit()

    return {"answer": answer, "sources": sources}
    
# ─── 4. SYNC FILE AND HISTORICAL CHAT LISTS FOR INDIVIDUAL PROJECTS ───

@app.get("/documents")
async def get_documents(project_id: UUID = Query(...), db: Session = Depends(get_db)):
    try:
        # Filter documents exclusively belonging to the active project context
        documents = db.query(Document).filter(Document.project_id == project_id).all()
        return [{"id": d.id, "filename": d.filename} for d in documents]
    except Exception as e:
        print(f"⚠️ Error fetching documents: {str(e)}")
        return []

@app.get("/projects/{project_id}/chats/{chat_id}")
async def get_chat_history(project_id: UUID, chat_id: UUID, db: Session = Depends(get_db)):
    try:
        history = db.query(ChatMessage).filter(
            ChatMessage.session_id == chat_id
        ).order_by(ChatMessage.timestamp.asc()).all()
        
        return [{"id": str(m.id), "role": m.role, "message_type": m.message_type, "content": m.message, "timestamp": m.timestamp} for m in history]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed loading log matrices: {str(e)}")
    
@app.post("/projects/{project_id}/chats")
async def create_chat(project_id: UUID, db: Session = Depends(get_db)):
    chat = ChatSession(
        project_id=project_id,
        title="New Chat"
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)

    return {
        "id": str(chat.id),
        "title": chat.title,
        "updated": "Just now",
        "messages": []
    }

@app.delete("/projects/{project_id}/chats/{chat_id}")
async def delete_chat(
    project_id: UUID,
    chat_id: UUID,
    db: Session = Depends(get_db)
):
    chat = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == chat_id,
            ChatSession.project_id == project_id
        )
        .first()
    )

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    db.delete(chat)
    db.commit()

    return {"message": "Chat deleted"}

@app.delete("/projects/{project_id}/documents/{document_id}")
async def delete_document(project_id: UUID, document_id: UUID, db: Session = Depends(get_db)):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.project_id == project_id).first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = db.query(Chunk).filter(Chunk.document_id == document_id).all()
    for chunk in chunks:
        db.delete(chunk)

    db.delete(document)
    db.commit()

    rebuild_bm25(db)
    app.state.index = rebuild_faiss(db)
    if app.state.index is not None:
        save_index(app.state.index)

    return {"message": "Document deleted"}

@app.post("/projects/{project_id}/compare")
async def compare_documents(project_id: UUID, request: AnalysisRequest, db: Session = Depends(get_db)):
    validate_chat_session(chat_id=request.chat_id, project_id=project_id, db=db)

    retrieval_data = retrieve_document_sections(
        project_id=project_id,
        selected_paper_ids=request.selected_paper_ids,
        db=db,
        section_groups=COMPARE_SECTIONS
    )
    context_text = retrieval_data["context_text"]
    sources = retrieval_data["sources"]

    if retrieval_data["fallback"]:
        db.add(ChatMessage(
            role="user",
            message_type="compare",
            message=request.question,
            session_id=request.chat_id
        ))

        db.add(ChatMessage(
            role="assistant",
            message_type="compare",
            message=context_text,
            session_id=request.chat_id
        ))

        db.commit()

        return {
            "message": context_text,
            "sources": []
        }
    db.add(ChatMessage(role="user", message_type="compare", message=request.question, session_id=request.chat_id))
    db.commit()

    comparison_result = get_compare_response(context_text=context_text, question=request.question, instructions=request.instructions)
    print("Comparison Result:", comparison_result)
    if "error" in comparison_result:
        raise HTTPException(status_code=500, detail=f"Failed to generate comparison: {comparison_result['error']}")

    markdown = comparison_to_markdown(comparison_result)
    db.add(ChatMessage(role="assistant", message_type="compare", message=comparison_result, session_id=request.chat_id))
    db.commit()
    return {"message_type":"compare","message": comparison_result, "sources": sources}

@app.post("/projects/{project_id}/summary")
def summarize_documents(project_id: UUID, request: AnalysisRequest, db: Session = Depends(get_db)):
    validate_chat_session(chat_id=request.chat_id, project_id=project_id, db=db)
    retrieval_data = retrieve_document_sections(
        project_id=project_id,
        selected_paper_ids=request.selected_paper_ids,
        db=db,
        section_groups=SUMMARY_SECTIONS
    )
    context_text = retrieval_data["context_text"]
    print("Context Text for Summary:", context_text)
    sources = retrieval_data["sources"]
    paper = db.query(Document).filter(Document.id.in_(request.selected_paper_ids)).first()

    if retrieval_data["fallback"]:
        db.add(ChatMessage(
            role="user",
            message_type="summary",
            message=request.question,
            session_id=request.chat_id
        ))
        db.add(ChatMessage(
            role="assistant",
            message_type="summary",
            message=context_text,
            session_id=request.chat_id
        ))
        db.commit()
        return {
            "message_type": "summary",
            "message": context_text,
            "sources": []
        }
    db.add(ChatMessage(role="user", message_type="summary", message=request.question, session_id=request.chat_id))
    db.commit()
    summary_result = get_summary_response(context_text=context_text, question=request.question, instructions=request.instructions)
    response = {
        "title": paper.title,
        "authors": paper.authors.split(", ") if paper.authors else ["Unknown Author"],
        "year": paper.published_year or 0,
        **summary_result,
    }
    print("Summary Result:", response)
    if "error" in summary_result:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {summary_result['error']}")    
    db.add(ChatMessage(role="assistant", message_type="summary", message=response, session_id=request.chat_id))
    db.commit()
    return {"message_type":"summary","message": response, "sources": sources}

@app.post("/projects/{project_id}/literature-review")
def literature_review_documents(project_id: UUID, request: AnalysisRequest, db: Session = Depends(get_db)):
    validate_chat_session(chat_id=request.chat_id, project_id=project_id, db=db)
    retrieval_data = retrieve_document_sections(
        project_id=project_id,
        selected_paper_ids=request.selected_paper_ids,
        db=db,
        section_groups=LITERATURE_REVIEW_SECTIONS
    )
    context_text = retrieval_data["context_text"]
    sources = retrieval_data["sources"]

    if retrieval_data["fallback"]:
        db.add(ChatMessage(
            role="user",
            message_type="literature_review",
            message=request.question,
            session_id=request.chat_id
        ))
        db.add(ChatMessage(
            role="assistant",
            message_type="literature_review",
            message=context_text,
            session_id=request.chat_id
        ))
        db.commit()
        return {
            "message_type": "literature-review",
            "message": context_text,
            "sources": []
        }
    db.add(ChatMessage(role="user", message_type="literature-review", message=request.question, session_id=request.chat_id))
    db.commit()
    literature_review_result = get_literature_review_response(context_text=context_text, question=request.question, instructions=request.instructions)
    print("Literature Review Result:", literature_review_result)
    if "error" in literature_review_result:
        raise HTTPException(status_code=500, detail=f"Failed to generate literature review: {literature_review_result['error']}")
    
    db.add(ChatMessage(role="assistant", message_type="literature-review", message=literature_review_result, session_id=request.chat_id))
    db.commit()
    return {"message_type":"literature-review","message": literature_review_result, "sources": sources}




