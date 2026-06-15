from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    title = Column(String, nullable=True)
    authors = Column(Text, nullable=True)
    abstract = Column(Text, nullable=True)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())

    # ORM Relationship: Clean cascading deletes
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    # Cascade delete ensures that deleting a Document cleans up its associated chunks automatically
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    section = Column(String, nullable=True)
    chunk_text = Column(Text, nullable=False)

    # ORM Relationship: Allows c.document.filename directly in code
    document = relationship("Document", back_populates="chunks")


class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)  # e.g., 'user', 'assistant', 'system'
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())