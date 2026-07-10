import os
import faiss
import numpy as np
import torch
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer 
from sqlalchemy.orm import Session
from db.models import Chunk, Document


# Auto-detect best hardware acceleration backend
print("Loading SentenceTransformer...")
device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device=device, local_files_only=True)
print("SentenceTransformer loaded.")
#INDEX_PATH = "index.faiss" 

splitter = RecursiveCharacterTextSplitter(
    chunk_size=780,
    chunk_overlap=40
)

def chunk_text(text: str):
    return splitter.split_text(text)

def embed_chunks(chunks: list):
    embeddings = model.encode(chunks, show_progress_bar=False)
    embeddings = np.array(embeddings).astype('float32')
    embeddings /= np.linalg.norm(embeddings, axis=1, keepdims=True)  # Normalize embeddings
    return np.array(embeddings).astype('float32')


    
def search_index(db, question: str, document_filter, k: int = 3):    
    question_embedding = model.encode([question]).astype("float32")
    question_embedding /= np.linalg.norm(question_embedding, axis=1, keepdims=True)
    question_embedding = question_embedding[0].tolist()
    results = (
        db.query(Chunk).join(Document)
        .filter(Chunk.embedding != None, document_filter)
        .order_by(Chunk.embedding.cosine_distance(question_embedding).asc())
        .limit(k)
        .all()
    )
    
    # Filter out empty/padding matches (-1) safely
    return [chunk.id for chunk in results if chunk.id != -1]

def search_filtered_index(db, question: str, document_filter, allowed_chunk_ids: list, k: int = 15):
    if not allowed_chunk_ids:
        return []
    question_embedding = model.encode([question])[0].astype("float32").tolist()
    results = (
        db.query(Chunk).join(Document)
        .filter(Chunk.embedding != None)
        .filter(Chunk.id.in_(allowed_chunk_ids))
        .filter(document_filter)
        .order_by(Chunk.embedding.cosine_distance(question_embedding).asc())
        .limit(k)
        .all()
    )

    return [chunk.id for chunk in results]
