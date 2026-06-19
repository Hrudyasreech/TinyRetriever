import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import openai

from extract import extract_text_from_pdf, extract_doi, get_metadata_from_crossref, get_metadata_from_llm 
from retrieval import chunk_text, embed_chunks, create_or_update_index, search_index, load_index, save_index
from section_parser import split_sections, classify_question

from db.database import engine, SessionLocal
from db.models import Base, Project, Document, Chunk, ChatSession, ChatMessage

# 1. Initialize environment properties
load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY is not defined in your .env configuration file.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Loads the global vector matrix search state on startup
    app.state.index = load_index()
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

# ─── PYDANTIC VALIDATION MODELS ─────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: str = None

class QuestionRequest(BaseModel):
    question: str
    project_id: int
    chat_id: int  # incoming unique dynamic browser tracking UUID string

# ─── 1. NEW: PROJECT ARCHITECTURE WORKSPACE ENDPOINTS ─────────────────

@app.post("/projects/")
async def create_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
    try:
        project = Project(name=project_data.name, description=project_data.description)
        db.add(project)
        db.commit()
        db.refresh(project)
        return project
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate project record: {str(e)}")

@app.get("/projects/")
async def list_projects(db: Session = Depends(get_db)):
    try:
        return db.query(Project).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workspace dashboard cards: {str(e)}")

# ─── 2. RECONSTRUCTED UPLOAD ROUTE (SCOPED TO PROJECT) ────────────────

@app.post("/upload/")
async def upload_pdf(project_id: int = Query(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verify target project workspace container physically exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Target project workspace context not found.")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
            
        os.makedirs("uploads", exist_ok=True)
        saved_path = f"uploads/{file.filename}"
        with open(saved_path, "wb") as f:
            f.write(contents)
            
        # Bind the incoming file directly to the active project_id
        document = Document(filename=file.filename, filepath=saved_path, project_id=project_id)
        db.add(document)
        db.commit()
        db.refresh(document)
        
        text, first_page = extract_text_from_pdf(contents)
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
        all_chunk_text = []

        for section_name, section_text in sections.items():
            chunks = chunk_text(section_text)
            for idx, chunk_text_val in enumerate(chunks):
                chunk = Chunk(chunk_text=chunk_text_val, document_id=document.id, section=section_name, chunk_index=idx)
                db.add(chunk)
                db.flush() 
                stored_chunks_ids.append(chunk.id)
                all_chunk_text.append(chunk_text_val)
        db.commit()

        print(db.query(Chunk).filter(Chunk.document_id == document.id).count())
        embeddings = embed_chunks(all_chunk_text)
             
        # Update the memory index pool and write safely to local binary tree storage
        app.state.index = create_or_update_index(embeddings, stored_chunks_ids, app.state.index)
        save_index(app.state.index)
        
        return JSONResponse(content={"message": "PDF uploaded and appended to workspace index."})

    except Exception as e:
        db.rollback()
        print(f"⚠️ Error uploading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backend processing failure: {str(e)}")

# ─── 3. RECONSTRUCTED INTERACTION COMPONENT (WITH HISTORY CONTEXTS) ──

@app.post("/ask/")
async def ask_question(request: QuestionRequest, db: Session = Depends(get_db)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key missing from environment.")
        
    question = request.question
    project_id = request.project_id
    chat_id = request.chat_id
    index = app.state.index
    
    if index is None or index.ntotal == 0:
        return {"answer": "No documents found in index storage.", "sources": []}

    # ─── GET OR CREATE CHAT SESSION WORKSPACE ───
    chat_session = db.query(ChatSession).filter(
        ChatSession.id == chat_id
    ).first()

    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    
    if chat_session.project_id != project_id:
        raise HTTPException(status_code=404, detail="Chat session does not belong to this project.")

    # Log incoming user question message directly into database table
    user_message_record = ChatMessage(role="user", message=question, session_id=chat_session.id)
    db.add(user_message_record)
    db.commit()
    print("User message saved")
    print("Question:", question)

    target_section = classify_question(question)
    print("Target section:", target_section)

    # ─── 1. FETCH STRUCURED METADATA IF APPLICABLE ───
    metadata_context = ""
    if target_section == "metadata" or "metadata" in question.lower() or any(kw in question.lower() for kw in ["author", "doi", "publisher", "journal", "published year", "title"]):
        project_docs = db.query(Document).filter(Document.project_id == project_id).all()
        if project_docs:
            meta_blocks = []
            for doc in project_docs:
                meta_blocks.append(
                    f"[DOCUMENT METADATA FOR: {doc.filename}]\n"
                    f"Title: {doc.title or 'Unknown'}\n"
                    f"Authors: {doc.authors or 'Unknown'}\n"
                    f"DOI: {doc.doi or 'None'}\n"
                    f"Publisher: {doc.publisher or 'Unknown'}\n"
                    f"Journal: {doc.journal or 'Unknown'}\n"
                    f"Published Year: {doc.published_year or 'Unknown'}"
                )
            metadata_context = "\n\n".join(meta_blocks)

    # Query vector mapping index space
    ranked_chunk_ids = search_index(index, question, k=15)
    print("Ranked IDs:", ranked_chunk_ids[:5])
    
    if not ranked_chunk_ids and not metadata_context:
        print("No chunks or metadata found in index.")
        fallback_msg = "I cannot find specific details regarding that query in the currently retrieved document sections."
        assistant_record = ChatMessage(role="assistant", message=fallback_msg, session_id=chat_session.id)
        db.add(assistant_record)
        db.commit()
        return {"answer": fallback_msg, "sources": []}
    
    # ─── 2. RETRIEVE CHUNKS FROM DATABASE ───
    query = db.query(Chunk).join(Document).filter(
        Chunk.id.in_(ranked_chunk_ids),
        Document.project_id == project_id 
    )
    
    # Avoid filtering out chunks if it's a general metadata request
    if target_section and target_section != "metadata":
        query = query.filter(Chunk.section == target_section)
    raw_chunks = query.all()

    used_fallback = False

    if target_section and not raw_chunks and target_section != "metadata":
        raw_chunks = db.query(Chunk).join(Document).filter(
            Document.project_id == project_id,
            Chunk.section == target_section
        ).all()
        used_fallback = True

    if used_fallback:
        ordered_chunks = raw_chunks
    else:
        chunk_dict = {c.id: c for c in raw_chunks}
        ordered_chunks = [chunk_dict[cid] for cid in ranked_chunk_ids if cid in chunk_dict]

    print("Ordered Chunks:", len(ordered_chunks))
        
    if not ordered_chunks and not metadata_context:
         fallback_msg = "I cannot find specific details regarding that query."
         db.add(ChatMessage(role="assistant", message=fallback_msg, session_id=chat_session.id))
         db.commit()
         return {"answer": fallback_msg, "sources": []} 

    # ─── 3. RECONSTRUCT THE FULL DATA PAYLOAD ───
    context_blocks = [f"[SOURCE_DOC: {c.document.filename}]\nContent:\n{c.chunk_text}" for c in ordered_chunks]
    
    if metadata_context:
        context_text = metadata_context + "\n\n---\n\n" + "\n\n---\n\n".join(context_blocks)
    else:
        context_text = "\n\n---\n\n".join(context_blocks)

    # ─── 4. LLM INFERENCE STAGE ───
    try:
        client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",  
            messages=[
            {
                "role": "system", 
                "content": (
                    "You are a helpful, clear, and friendly AI assistant reading from a user's uploaded documents.\n\n"
                    "Core Rules:\n"
                    "1. Answer the question using the facts provided in the context blocks (metadata records and raw text chunks).\n"
                    "2. If the user asks for the 'objective', 'aim', or 'purpose' of the paper and it is not explicitly labeled, look closely at the Abstract, Introduction, or Methodology sections in the provided context. Formulate the objective based on what the authors state they are testing, developing, or investigating. Do not say you cannot find it if the goals are clearly implied by their methods or abstract summary.\n"
                    "3. Speak in a normal, simple, everyday conversational tone. Avoid robotic jargon.\n"
                    "4. If the provided context genuinely lacks any information, clues, or context to answer the question, only then state exactly: 'I cannot find specific details regarding that in the currently retrieved document sections.' Do not invent completely new facts outside the text."
                )
            },
            {"role": "user", "content": f"Provided Context Data Blocks:\n{context_text}\n\nUser Question: {question}"}
        ],
            temperature=0.3
        )
        
        answer = completion.choices[0].message.content
        
        # Save assistant text generation directly down into SQLite chat logs array
        try:
            print("Chat id:", chat_session.id)
            print("answer length", len(answer))
            assistant_message_record = ChatMessage(
                role="assistant",
                message=answer,
                session_id=chat_session.id
            )

            db.add(assistant_message_record)
            db.commit() 
            print("Chat assistant message saved")

        except Exception as e:
            db.rollback()
            print("CHAT SAVE ERROR:", e)
        
        fallback_string = "I cannot find specific details regarding that in the currently retrieved document sections."
        if fallback_string.lower() in answer.lower():
            return {"answer": fallback_string, "sources": []}
            
        source_documents = list(set([c.document.filename for c in ordered_chunks if c.document.filename in context_text]))
        
        # Include metadata-only source titles if no chunks were matched but context was fed
        if metadata_context:
            for doc in project_docs:
                if doc.filename in context_text and doc.filename not in source_documents:
                    source_documents.append(doc.filename)
                    
        print(answer)
        print(source_documents)
        return {"answer": answer, "sources": source_documents}

    except Exception as e:
        print(f"Groq Integration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pipeline inference failure: {str(e)}")
# ─── 4. SYNC FILE AND HISTORICAL CHAT LISTS FOR INDIVIDUAL PROJECTS ───

@app.get("/documents")
async def get_documents(project_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        # Filter documents exclusively belonging to the active project context
        documents = db.query(Document).filter(Document.project_id == project_id).all()
        return [{"id": d.id, "filename": d.filename} for d in documents]
    except Exception as e:
        print(f"⚠️ Error fetching documents: {str(e)}")
        return []

@app.get("/projects/{project_id}/chats/{chat_id}")
async def get_chat_history(project_id: int, chat_id: int, db: Session = Depends(get_db)):
    try:
        history = db.query(ChatMessage).filter(
            ChatMessage.session_id == chat_id
        ).order_by(ChatMessage.timestamp.asc()).all()
        
        return [{"role": m.role, "message": m.message} for m in history]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed loading log matrices: {str(e)}")
    
@app.post("/projects/{project_id}/chats")
async def create_chat(project_id: int,db: Session = Depends(get_db)):
    chat = ChatSession(project_id=project_id, title="New Chat" )
    db.add(chat)
    db.commit()
    db.refresh(chat)

    return {
        "chat_id": chat.id
    }
