import uuid

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    avatar_url = Column(String, nullable=True)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    chatsessions = relationship("ChatSession", back_populates="project", cascade="all, delete-orphan")
    user = relationship("User", back_populates="projects")

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)

    filename = Column(String, nullable=False)

    title = Column(String, nullable=True)
    authors = Column(Text, nullable=True)
    affiliations = Column(Text, nullable=True) 
    abstract = Column(Text, nullable=True)

    doi = Column(String, nullable=True)
    publisher = Column(String, nullable=True)
    journal = Column(String, nullable=True)
    published_year = Column(Integer, nullable=True)
    status = Column(String, nullable=True)  # e.g., 'processed', 'pending', 'failed'

    upload_date = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    # Cascade delete ensures that deleting a Document cleans up its associated chunks automatically
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    section = Column(String, nullable=True)
    section_group = Column(String, nullable=True)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=True)
    page_number = Column(Integer, nullable=True)
    embedding = Column(Vector(384), nullable=True)  # Assuming 384-dimensional embedding space

    # ORM Relationship: Allows c.document.filename directly in code
    document = relationship("Document", back_populates="chunks")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)  # e.g., 'user', 'assistant', 'system'
    message_type = Column(String, nullable=False)  
    message = Column(JSON, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(),index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    session = relationship("ChatSession", back_populates="messages")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project= relationship("Project", back_populates="chatsessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")