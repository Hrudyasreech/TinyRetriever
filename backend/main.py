import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import openai  # We use the standard OpenAI wrapper for Groq's compatible engine

from extract import extract_text_from_pdf
from retrieval import chunk_and_embed, create_or_update_index, search_index, load_index, save_index

from db.database import engine, SessionLocal
from db.models import Base, Document, Chunk

# 1. Load the secret keys on application start
load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY is not defined in your .env configuration file.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index = load_index()
    print("🚀 FAISS Index initialized successfully.")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
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

class QuestionRequest(BaseModel):
    question: str

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
            
        os.makedirs("uploads", exist_ok=True)
        saved_path = f"uploads/{file.filename}"
        with open(saved_path, "wb") as f:
            f.write(contents)
            
        document = Document(filename=file.filename, filepath=saved_path)
        db.add(document)
        db.commit()
        db.refresh(document)
        
        text = extract_text_from_pdf(contents)
        if not text or not text.strip():
            text = "Empty document context placeholder text."
        
        chunks, embeddings = chunk_and_embed(text)
        if not chunks:
            raise HTTPException(status_code=400, detail="Text splitting generated zero segments.")
        
        stored_chunks_ids = []
        for chunk_text in chunks:
            chunk = Chunk(chunk_text=chunk_text, document_id=document.id)
            db.add(chunk)
            db.flush()
            stored_chunks_ids.append(chunk.id)
        db.commit()

        app.state.index = create_or_update_index(embeddings, stored_chunks_ids, app.state.index)
        save_index(app.state.index)
        
        return JSONResponse(content={"message": "PDF uploaded and processed successfully."})

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Backend processing failure: {str(e)}")


@app.post("/ask/")
async def ask_question(request: QuestionRequest, db: Session = Depends(get_db)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Backend configuration error: Groq API key missing from environment.")
        
    question = request.question
    index = app.state.index
    
    if index is None or index.ntotal == 0:
        return {"answer": "No documents found in index storage.", "sources": []}
   
    ranked_chunk_ids = search_index(index, question, k=3)
    if not ranked_chunk_ids:
        return {"answer": "I cannot find specific details regarding that query in the currently retrieved document sections.", "sources": []}
        
    raw_chunks = db.query(Chunk).filter(Chunk.id.in_(ranked_chunk_ids)).all()
    chunk_dict = {c.id: c for c in raw_chunks}
    ordered_chunks = [chunk_dict[cid] for cid in ranked_chunk_ids if cid in chunk_dict]
    
    if not ordered_chunks:
         return {"answer": "I cannot find specific details regarding that query.", "sources": []}

    # Inject explicit context markers so the model can filter the matching list down
    context_blocks = []
    for c in ordered_chunks:
        context_blocks.append(f"[SOURCE_DOC: {c.document.filename}]\nContent:\n{c.chunk_text}")
    
    context_text = "\n\n---\n\n".join(context_blocks)

    try:
        # Route standard OpenAI client definitions natively into Groq's high-speed pipelines
        client = openai.OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Best fallback balance for free-tier quotas
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "You are a strict verification RAG assistant.\n"
                        "Task: Answer the user's question using ONLY the explicit factual data present within the provided source blocks.\n"
                        "Constraints:\n"
                        "1. If the provided context text segments do not contain the answer, you MUST state exactly: 'I cannot find specific details regarding that in the currently retrieved document sections.'\n"
                        "2. Do not use outside data, guess, or extrapolate.\n"
                        "3. Your response must implicitly prove which sources were utilized. If the question cannot be answered from a source, that source is invalid."
                    )
                },
                {"role": "user", "content": f"Provided Context Data Blocks:\n{context_text}\n\nUser Question: {question}"}
            ],
            temperature=0.0
        )
        
        answer = completion.choices[0].message.content
        
        # Guard clause: Check if the model hit the fallback string
        fallback_string = "I cannot find specific details regarding that in the currently retrieved document sections."
        if fallback_string.lower() in answer.lower():
            return {"answer": fallback_string, "sources": []}
            
        # Strict parsing condition: Only return file metrics if they match an active piece of data used in the response
        source_documents = list(set([
            c.document.filename for c in ordered_chunks 
            if c.document.filename in context_text
        ]))
        
        return {"answer": answer, "sources": source_documents}

    except openai.RateLimitError:
        raise HTTPException(status_code=429, detail="Groq free tier per-minute token threshold reached. Wait 60 seconds before retrying.")
    except Exception as e:
        print(f"Groq Integration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pipeline inference failure: {str(e)}")
    
@app.get("/documents")
async def get_documents(db: Session = Depends(get_db)):
    try:
        documents = db.query(Document).all()
        return [{"id": d.id, "filename": d.filename} for d in documents]
    except Exception as e:
        print(f"⚠️ Error fetching documents: {str(e)}")
        return []