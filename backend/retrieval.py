from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer   
import faiss
import numpy as np

model = SentenceTransformer( "sentence-transformers/all-MiniLM-L6-v2")

def chunk_and_embed(text):
    splitter = RecursiveCharacterTextSplitter(chunk_size=250, chunk_overlap=30)
    chunks = splitter.split_text(text)
    embeddings = model.encode(chunks)

    return chunks, np.array(embeddings).astype('float32')

def create_index(embeddings):
    faiss.normalize_L2(embeddings)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)
    return index

def search_index(index, question, chunks, k=2):
    question_embedding = model.encode([question]).astype('float32')
    faiss.normalize_L2(question_embedding)
    scores, indices = index.search(question_embedding, k=k)
    print("Scores:", scores)
    return [chunks[idx] for idx in indices[0]]