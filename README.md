# Career Copilot

AI career-assistant agent that answers questions about your study notes, resume, and career prep using **Retrieval-Augmented Generation (RAG)** with source citations and cosine-similarity scores.

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | NestJS 11 (`POST /ask` RAG endpoint) |
| RAG pipeline (Python) | `ingest.py` → chunk → embed → Qdrant; `query.py` CLI |
| Vector DB | Qdrant (Docker, `:6333` REST / `:6334` gRPC) |
| LLM / Embeddings | Gemini via OmniRoute gateway (`gemini/gemini-flash-latest`, `gemini-embedding-001`), opencode fallback |

## Features

- **RAG chat** over your ingested notes/resume — model answers from your sources, not its own memory.
- **Expandable source citations** per answer (source filename, chunk index, cosine-similarity score).
- **Deterministic ingestion** — re-ingesting the same file/chunk overwrites instead of duplicating points.
- **Milestone-tracked roadmap** (M1–M7) in `structure_design/ai_agent_stack_tracker.md`.
- **Modular architecture** — RAG logic isolated in `RagService`, not in route controllers.

## Architecture

```mermaid
flowchart TD
    User((User)) -->|asks question| UI[React UI<br>localhost:5173]
    UI -->|POST /ask {question}| API[NestJS Backend<br>:3000]
    API -->|embed question| LLM[OmniRoute LLM Gateway<br>embeddings + chat]
    LLM -->|query vector| VDB[(Qdrant Vector DB<br>:6333)]
    VDB -->|top-K chunks| API
    API -->|build prompt| LLM
    LLM -->|answer + sources| API
    API -->|JSON response| UI
    UI -->|show answer + source chips| User
    subgraph Ingest [Offline ingestion]
    Docs[docs/*.md *.txt *.pdf] -->|ingest.py| VDB
    end
```

## Project Structure

```
career-copilot/
├── README.md                      # this file
├── docker-compose.yml             # Qdrant vector DB (ports 6333/6334)
├── notes.txt                      # dev notes / curl snippets (git-ignored)
├── .env                           # local secrets (git-ignored)
├── .gitignore
├── rag/                           # M1 RAG pipeline (Python CLI)
│   ├── ingest.py                  # chunk + embed docs → Qdrant
│   └── query.py                   # CLI: question → Qdrant → answer
├── docs/                          # your resume + study notes (.md/.txt/.pdf)
├── backend/                       # NestJS API
│   ├── src/
│   │   ├── app.module.ts          # ConfigModule + AskModule
│   │   ├── main.ts                # CORS origin localhost:5173, port 3000
│   │   ├── ask/
│   │   │   ├── ask.controller.ts  # POST /ask
│   │   │   ├── ask.module.ts
│   │   │   ├── rag.service.ts     # embed → Qdrant → LLM → AskResult
│   │   │   └── rag.service.spec.ts
│   │   └── package.json
└── frontend/                      # React chat UI (Vite)
    ├── src/
    │   ├── App.tsx                # sidebar tabs + ChatWindow
    │   ├── components/chat.tsx    # message list + source citations
    │   ├── components/layout.tsx  # sidebar + header
    │   ├── hooks/useChat.ts       # sendMessage / message state
    │   ├── services/api.ts        # fetch POST /ask (VITE_API_URL)
    │   └── types/chat.ts          # Message, SourceChunk, AskResponse
    └── package.json
```

## Prerequisites

- **Docker** (to run Qdrant)
- **Node.js** (frontend + backend)
- **Python** in the repo virtual environment (`.venv`)
- An **OmniRoute API key** — sign up at your OmniRoute dashboard and note your endpoint key.

## Configuration

Copy `.env.example` to `.env` and fill in your values. Secrets live only in `.env` (git-ignored) — do not commit them.

| Variable | Example / Default | Description |
|---|---|---|
| `OMNIROUTE_BASE_URL` | `http://localhost:20128/v1` | OmniRoute gateway base URL |
| `OMNIROUTE_API_KEY` | _(your key)_ | OmniRoute endpoint key |
| `EMBEDDING_MODEL` | `gemini/gemini-embedding-001` | Must match between `ingest.py` and `query.py`/backend |
| `CHAT_MODEL` | `gemini/gemini-flash-latest` | LLM used to answer |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant REST endpoint |
| `COLLECTION_NAME` | `career_copilot_docs` | Qdrant collection name |
| `TOP_K` | `3` | Chunks retrieved per question |
| `DOCS_DIR` | `docs` | Folder containing `.md/.txt/.pdf` sources |
| `VITE_API_URL` | `http://localhost:3000` | Frontend API base URL |

## Getting Started

### 1. Start Qdrant
```bash
docker compose up -d
```

### 2. Ingest your docs (RAG pipeline)
Place your `.md` / `.txt` / `.pdf` files in `docs/`, then:

```bash
# in .venv
pip install qdrant-client openai pypdf python-dotenv
python rag/ingest.py
```

This chunks each file (~300 words with 50-word overlap), embeds via OmniRoute, and upserts into Qdrant with deterministic IDs.

Optional — test from the CLI:
```bash
python rag/query.py "What are my key study notes on system design?"
```

### 3. Start the backend
```bash
cd backend
npm install
npm run start:dev        # http://localhost:3000
```

### 4. Start the frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Open `http://localhost:5173`, switch to the **AI Assistant** tab, and ask a question about your notes.
