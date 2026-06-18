import os
import faiss
import numpy as np
import torch
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer 


# Auto-detect best hardware acceleration backend
device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", device=device)

INDEX_PATH = "index.faiss" 

splitter = RecursiveCharacterTextSplitter(
    chunk_size=200,
    chunk_overlap=40
)

def chunk_text(text: str):
    return splitter.split_text(text)

def embed_chunks(chunks: list):
    embeddings = model.encode(chunks, show_progress_bar=False)
    return np.array(embeddings).astype('float32')

def create_or_update_index(embeddings: np.ndarray, chunk_ids: list, existing_index=None):
    if embeddings.size == 0:
        return existing_index
        
    faiss.normalize_L2(embeddings)
    ids_array = np.array(chunk_ids).astype('int64')
    
    if existing_index is None:
        dimension = embeddings.shape[1]
        sub_index = faiss.IndexFlatIP(dimension)
        index = faiss.IndexIDMap(sub_index)
    else:
        index = existing_index
        
    index.add_with_ids(embeddings, ids_array)
    return index
    
def search_index(index, question: str, k: int = 3):
    if index is None or index.ntotal == 0:
        return []
        
    question_embedding = model.encode([question]).astype('float32')
    faiss.normalize_L2(question_embedding)
    
    scores, indices = index.search(question_embedding, k=k)
    
    # Filter out empty/padding matches (-1) safely
    return [int(idx) for idx in indices[0] if idx != -1]

def save_index(index):
    faiss.write_index(index, INDEX_PATH)

def load_index():   
    if os.path.exists(INDEX_PATH):
        try:
            return faiss.read_index(INDEX_PATH)
        except Exception as e:
            print(f"⚠️ Failed to read FAISS index: {e}")
            return None
    return None