# AI Agent Stack Build — Progress Tracker

**Project:** Career Copilot (RAG + MCP agent)
**Cadence:** Parallel track, ~1–2 sessions/week (does not block the Study/System Design sprint)
**Started:** _fill in_
**Status legend:** ⬜ Not started · 🔶 In progress · ✅ Done

---

## Architecture

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript chat UI |
| Backend | NestJS |
| RAG pipeline | chunk → embed → vector store (Qdrant / Chroma) |
| Embeddings | Gemini embedding API or local `nomic-embed` via Ollama |
| LLM | Gemini 2.5 Flash / Groq Llama 3.3 (free tier) |
| MCP | `@modelcontextprotocol/sdk` server exposing `log_application()`, `query_study_notes()`, `search_job_postings()` |
| Data | Postgres (applications) + vector store (notes) |

---

## Milestones

### M1 — RAG core ✅
Ingest notes/resume, chunk + embed, store in a vector DB, query from CLI.
- [x] Chunk study notes + resume into passages
- [x] Embed with Gemini embeddings or local nomic-embed via Ollama
- [x] Store vectors in Qdrant or Chroma (free/local)
- [x] CLI script: ask a question → retrieve top-k chunks → answer via Gemini/Groq

**Notes:**
`ingest.py` + `query.py` verified end-to-end. Qdrant in Docker, `gemini/gemini-embedding-001` (3072-dim) via OmniRoute for embeddings, `gemini/gemini-flash-latest` for the answer call. Deterministic point IDs (`uuid.uuid5` on `source::chunk_index`) so re-ingesting doesn't duplicate points. Tool-calling separately verified working on `gemini/gemini-flash-latest` (primary) and `oc/big-pickle` (fallback via opencode free pool) for use starting M3.

---

### M2 — Wrap RAG in a service ⬜
Turn the CLI into a backend API with a minimal chat UI.
- [ ] NestJS endpoint: `POST /ask`
- [ ] Minimal React chat UI hitting the endpoint

**Notes:**
_—_

---

### M3 — First MCP server ⬜
Expose 2-3 real tools over MCP instead of hardcoded routes.
- [ ] Set up `@modelcontextprotocol/sdk` server
- [ ] Tool: `log_application(company, role, status)`
- [ ] Tool: `query_study_notes(question)`

**Notes:**
_—_

---

### M4 — Connect an MCP client ⬜
Prove tools work end-to-end from a real client.
- [ ] Test tools via Claude Desktop MCP connection
- [ ] Or write your own minimal MCP client loop

**Notes:**
_—_

---

### M5 — Combine into one agent ⬜
LLM decides: retrieve via RAG, call a tool, or answer directly.
- [ ] Basic routing / tool-choice prompting
- [ ] Handle multi-step flows (e.g. "log the OA I just described")

**Notes:**
_—_

---

### M6 — Add a live tool ⬜
Give the agent a tool that reaches outside your own data.
- [ ] Tool: `search_job_postings` via a free API (RemoteOK / Arbeitnow)

**Notes:**
_—_

---

### M7 — Polish & publish ⬜
Deploy, document, write it up — the resume differentiator.
- [ ] Deploy backend + frontend
- [ ] README with architecture diagram
- [ ] Short write-up / LinkedIn post

**Notes:**
_—_

---

## Weekly Log

| Week of | Milestone worked on | What got done | Blockers | Next up |
|---|---|---|---|---|
| 2026-08-09 | M1 | Qdrant in Docker, OmniRoute LLM/embedding access sorted (Gemini + opencode verified for tool-calling), `ingest.py` and `query.py` written and tested end-to-end, deterministic point IDs added to fix duplicate-on-reingest issue | None currently | M2 — NestJS `POST /ask` + React chat UI |

---

## Overall Progress

`[x] M1  [ ] M2  [ ] M3  [ ] M4  [ ] M5  [ ] M6  [ ] M7`
