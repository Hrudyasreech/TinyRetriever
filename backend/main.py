from fastapi import FastAPI, File, UploadFile, HTTPException
from extract import extract_text_from_pdf
from retrieval import chunk_and_embed, create_index, search_index
from ollama import chat
import time
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
DOCUMENT_STORE = {
    "index": None,
    "chunks": None
}
class QuestionRequest (BaseModel):
    question: str
    
@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    contents = await file.read()
    text = extract_text_from_pdf(contents)
    chunks, embeddings = chunk_and_embed(text)
    index = create_index(embeddings)
    DOCUMENT_STORE['index'] = index
    DOCUMENT_STORE['chunks'] = chunks
    return {"message": "PDF uploaded and processed successfully."}

@app.post("/ask/")
async def ask_question(request: QuestionRequest):
    question = request.question
    if DOCUMENT_STORE['index'] is None:
        raise HTTPException(status_code=400, detail="No Document Uploaded yet.")
    relevant_chunks = search_index(DOCUMENT_STORE['index'], question, DOCUMENT_STORE['chunks'])
    context = "\n\n".join(relevant_chunks)
    prompt = f"""
Use ONLY the provided context to answer.

Context:
{context}

Question:
{question}

If the answer cannot be found in the context,
reply exactly:
'I could not find the answer in the document.'
"""
    start = time.time()
    response = chat(
    model="qwen3.5:4b",
    messages=[
        {
            "role": "system",
            "content": """
            Answer using only the context.
            Maximum 2 sentences.
            Be concise.
            """
        },
        {
            "role": "user",
            "content": prompt
        }
    ], think = False

)
    print("LLM Time:",time.time() - start)
    return {"answer": response.message.content, "sources": relevant_chunks}