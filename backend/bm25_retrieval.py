import bm25s
from db.models import Chunk
import pickle, os 

BM25_PATH = "storage/bm25_index"
MAPPING_PATH = "storage/bm25_mapping.pkl"

retrievr = None
chunk_id_mapping = []

def build_bm25_index(chunks):
    global retrievr
    global chunk_id_mapping

    chunk_texts = [chunk.chunk_text for chunk in chunks]
    chunk_id_mapping = [chunk.id for chunk in chunks]

    corpus = bm25s.tokenize(chunk_texts)
    retrievr = bm25s.BM25()
    retrievr.index(corpus)
    retrievr.save(BM25_PATH)
    print("BM25 built from", len(chunk_texts), "chunks") 

def search_bm25_index(question: str, k):
    global retrievr
    global chunk_id_mapping
    print("Retriever:", retrievr)
    
    if retrievr is None:
        return []
    print("Question:", question)
    query_tokens = bm25s.tokenize([question])
    print("Query tokens:", query_tokens)
    results, scores = retrievr.retrieve(query_tokens, k=k)
    print("Results:", results)

    chunk_ids = []
    for position in results[0]:
        chunk_ids.append(chunk_id_mapping[int(position)])
        
    return chunk_ids

def rebuild_bm25(db):
    all_chunks = db.query(Chunk).all()
    build_bm25_index(all_chunks)
    save_bm25()

def save_bm25():
    global retrievr
    global chunk_id_mapping

    if retrievr is None:
        return
    retrievr.save(BM25_PATH)
    with open(MAPPING_PATH, "wb") as f:
        pickle.dump(chunk_id_mapping, f)

def load_bm25():
    global retrievr
    global chunk_id_mapping

    if not os.path.exists(BM25_PATH):
        print("No BM25 index found")
        return None

    retrievr = bm25s.BM25.load(BM25_PATH)

    with open(MAPPING_PATH, "rb") as f:
        chunk_id_mapping = pickle.load(f)

    print("BM25 loaded")