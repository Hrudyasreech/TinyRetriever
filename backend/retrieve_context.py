from collections import defaultdict

from db.models import Document, Chunk
from sqlalchemy import and_
from sqlalchemy.orm import joinedload
from bm25_retrieval import search_bm25_index
from retrieval import search_index, search_filtered_index
from section_parser import classify_question
import uuid
from uuid import UUID

def retrieve_context(question: str, project_id: UUID, selected_paper_ids: list[UUID], db, index):
    if selected_paper_ids:
        document_filter = and_(
            Document.project_id == project_id,
            Document.id.in_(selected_paper_ids)
        )
    else:
        document_filter = (
            Document.project_id == project_id
        )
    
    target_section = classify_question(question)
    print("Target section:", target_section)

    bm25_chunk_ids = search_bm25_index(question, k=15)
    print("BM25 IDs:", bm25_chunk_ids[:10])

    metadata_context = ""
    project_docs = []
    
    if target_section == "metadata" or "metadata" in question.lower() or any(kw in question.lower() for kw in ["author", "doi", "publisher", "journal", "published year", "title"]):
        project_docs = db.query(Document).filter(document_filter).all()
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
    if target_section and target_section != "metadata":
        allowed_chunk_ids = [
            row[0]
            for row in (db.query(Chunk.id).join(Document)
                .filter(
                    document_filter,
                    Chunk.section_group == target_section
                )
                .all())]

        print(f"Section Group: {target_section} | Candidate Chunks: {len(allowed_chunk_ids)}")
        
        ranked_chunk_ids = search_filtered_index(db=db, question=question,document_filter=document_filter, allowed_chunk_ids=allowed_chunk_ids, k=15)
        bm25_chunk_ids = [cid for cid in bm25_chunk_ids if cid in allowed_chunk_ids]
        print(f"Retrieved {len(ranked_chunk_ids)} ranked chunks")
    else:
        ranked_chunk_ids = search_index(db=db, question=question, document_filter=document_filter, k=15)

    print("Ranked IDs:", ranked_chunk_ids[:10])
    print("FAISS IDs:", len(ranked_chunk_ids))
    print("BM25 IDs:", len(bm25_chunk_ids))
    
    for cid in bm25_chunk_ids:
        if cid not in ranked_chunk_ids:
            ranked_chunk_ids.append(cid)
    
    if not ranked_chunk_ids and not metadata_context:
        print("No chunks or metadata found in index.")
        fallback_msg = "I cannot find specific details regarding that query in the currently retrieved document sections."

        return {"context_text": fallback_msg, "sources": [], "fallback": True}
    
    
    raw_chunks = (db.query(Chunk).options(joinedload(Chunk.document)).join(Document)
    .filter(
        Chunk.id.in_(ranked_chunk_ids),
        document_filter
    ).all())

    used_fallback = False

    if target_section and not raw_chunks and target_section != "metadata":
        raw_chunks = db.query(Chunk).options(joinedload(Chunk.document)).join(Document).filter(
            document_filter,
            Chunk.section_group == target_section
        ).limit(20).all()
        used_fallback = True

    if used_fallback:
        ordered_chunks = raw_chunks
    else:
        chunk_dict = {c.id: c for c in raw_chunks}
        ordered_chunks = [chunk_dict[cid] for cid in ranked_chunk_ids if cid in chunk_dict]

    print("Ordered Chunks:", len(ordered_chunks))

    if not ordered_chunks and not metadata_context:
        fallback_msg = "I cannot find specific details regarding that query."

        return {
            "context_text": fallback_msg,
            "sources": [],
            "fallback": True
        }

    context_blocks = [
        f"""
    [PAPER: {c.document.filename}]
    [SECTION: {c.section_group}]

    {c.chunk_text}
    """
        for c in ordered_chunks
    ]

    if metadata_context:
        context_text = (
            metadata_context
            + "\n\n---\n\n"
            + "\n\n---\n\n".join(context_blocks)
        )
    else:
        context_text = "\n\n---\n\n".join(context_blocks)

    return {
        "context_text": context_text,
        "sources": list(set([c.document.filename for c in ordered_chunks])),
        "ordered_chunks": ordered_chunks,
        "project_docs": project_docs,
        "metadata_context": metadata_context,
        "target_section": target_section,
        "fallback" : False
    }

def retrieve_document_sections( project_id: UUID, selected_paper_ids: list[UUID], db, section_groups: list[str]):
    MAX_CHUNKS_PER_SECTION = 2
    if selected_paper_ids:
        document_filter = and_(
            Document.project_id == project_id,
            Document.id.in_(selected_paper_ids)
        )
    else:
        document_filter = (
            Document.project_id == project_id
        )
    chunks = db.query(Chunk).options(joinedload(Chunk.document)).join(Document).filter(
        document_filter,
        Chunk.section_group.in_(section_groups)
    ).all()
    if not chunks:
        return {
            "context_text": "No comparision chunks found in index.",
            "sources": [],
            "fallback": True
        }
    
    paper_sections = defaultdict(lambda: defaultdict(list))
    for chunk in chunks:
        paper = chunk.document.filename
        section = chunk.section_group
        if len(paper_sections[paper][section]) < MAX_CHUNKS_PER_SECTION:
            paper_sections[paper][section].append(chunk.chunk_text)
    
    context_blocks = []
    for paper in sorted(paper_sections):
        sections = paper_sections[paper]
        block = ["="*60,f"# PAPER: {paper}\n", "="*60]

        for section in section_groups:
            if section not in sections:
                continue

            block.append(f"\n## {section.replace('_', ' ').title()}\n")
            block.append("\n\n".join(sections[section]))

        context_blocks.append("\n\n".join(block))
    context_text = "\n\n---\n\n".join(context_blocks)
    return {
        "context_text": context_text,
        "sources": list(set([c.document.filename for c in chunks])),
        "ordered_chunks": chunks,
        "fallback" : False
    }



    