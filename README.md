# TinyRetriever

> A Retrieval-Augmented Generation (RAG) workspace for semantic search, conversational question answering, and literature review over research papers.

![Architecture](docs/architecture.png)

---

## Overview

TinyRetriever is a backend-focused Retrieval-Augmented Generation (RAG) application designed to help users interact with research papers using natural language.

Instead of manually searching through lengthy documents, users can upload research papers, perform semantic search, ask context-aware questions, generate literature reviews, and manage conversations through a single workspace.

The project focuses on improving retrieval quality using section-aware retrieval, metadata filtering, and vector search powered by PostgreSQL and pgvector.

---

## Features

- 📄 Upload and manage multiple research papers
- 🔍 Semantic search over uploaded documents
- 💬 Conversational question answering
- 📝 Literature review generation
- 📂 Persistent chat sessions
- 🏷️ Automatic metadata extraction
- 📑 Section-aware retrieval
- 🧩 Semantic chunking
- ⚡ FastAPI REST backend
- 🗄️ PostgreSQL + pgvector vector database
- 📊 Project statistics dashboard

---

## System Architecture

TinyRetriever follows a modular Retrieval-Augmented Generation pipeline.

1. Users upload research papers through the React frontend.
2. The backend extracts text from PDFs.
3. Documents are divided into logical sections.
4. Metadata and semantic chunks are generated.
5. Chunks are converted into embeddings and stored in PostgreSQL with pgvector.
6. User questions are classified to identify the most relevant document sections.
7. The retriever performs semantic similarity search.
8. Retrieved context is provided to the LLM to generate grounded responses.

The overall architecture is shown below.

![System Architecture](docs/architecture.png)

---

## Evaluation

To evaluate retrieval performance, I created a benchmark consisting of **35 manually prepared evaluation questions**.

The evaluation focused on:

- Retrieval Quality
- Response Quality
- Retrieval Latency

This benchmark helped compare different retrieval strategies and guided improvements to the retrieval pipeline.

---

## Tech Stack

### Frontend

- React
- TypeScript

### Backend

- FastAPI
- Python

### Database

- PostgreSQL
- pgvector

### AI & NLP

- Sentence Transformers
- Groq API
- Gemini API (supported)
- Semantic Embeddings

### Other Tools

- SQLAlchemy
- Uvicorn
- Crossref API

---

## Project Structure

```text
TinyRetriever
│
├── backend/
│   ├── api/
│   ├── retrieval/
│   ├── evaluation/
│   └── database/
│
├── frontend/
│
├── docs/
│   └── architecture.png
│
└── README.md
```

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/Hrudyasreech/TinyRetriever.git
cd TinyRetriever
```

### Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## Future Improvements

- Hybrid retrieval with reranking
- Citation highlighting
- Multi-document reasoning
- User authentication
- Streaming responses
- Cloud deployment
- Automatic evaluation dashboard

---

## Why TinyRetriever?

Many research assistants retrieve information from an entire document without considering its structure.

TinyRetriever improves this by combining:

- Section-aware retrieval
- Metadata filtering
- Semantic vector search
- Context-aware question answering

This leads to more relevant retrieval and better grounded responses.

---

## Author

**Hrudyasree Ch**

Computer and Communication Engineering Student

Backend Development • AI Applications • Retrieval-Augmented Generation
