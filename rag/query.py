"""
query.py — M1 query CLI script for Career Copilot RAG pipeline.

Takes a question as a CLI arg, embeds it with the same embedding model used
in ingest.py, retrieves the top-k most similar chunks from Qdrant, stuffs
them into a prompt, and calls a chat model via OmniRoute for the answer.

Throwaway scaffolding for M1 — matches ingest.py's style, hardens later
once this gets wrapped in the NestJS backend (M2).

Env vars (same defaults/names as ingest.py, plus two new ones):
  OMNIROUTE_BASE_URL   default: http://localhost:20128/v1
  OMNIROUTE_API_KEY    your OmniRoute dashboard endpoint key
  EMBEDDING_MODEL      must match what you used in ingest.py exactly,
                        e.g. "gemini/gemini-embedding-001"
  CHAT_MODEL           default: gemini/gemini-flash-latest
  QDRANT_URL           default: http://localhost:6333
  COLLECTION_NAME      default: career_copilot_docs
  TOP_K                default: 3

Install deps first (same as ingest.py):
  pip install qdrant-client openai

Usage:
  python rag/query.py "What is a rate limiter?"
"""

import os
import sys

from openai import OpenAI
from qdrant_client import QdrantClient
from dotenv import load_dotenv
load_dotenv()

# ---- config ----
OMNIROUTE_BASE_URL = os.environ.get("OMNIROUTE_BASE_URL", "http://localhost:20128/v1")
OMNIROUTE_API_KEY = os.environ.get("OMNIROUTE_API_KEY")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL")
CHAT_MODEL = os.environ.get("CHAT_MODEL")
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = os.environ.get("COLLECTION_NAME", "career_copilot_docs")
TOP_K = int(os.environ.get("TOP_K", "3"))

if not OMNIROUTE_API_KEY:
    sys.exit("Set OMNIROUTE_API_KEY (your OmniRoute endpoint key from the dashboard).")
if not EMBEDDING_MODEL:
    sys.exit(
        "Set EMBEDDING_MODEL to the SAME model string you used in ingest.py, "
        "e.g. EMBEDDING_MODEL=gemini/gemini-embedding-001 — "
        "query and stored vectors must use the same embedding model."
    )

client = OpenAI(base_url=OMNIROUTE_BASE_URL, api_key=OMNIROUTE_API_KEY)
qdrant = QdrantClient(url=QDRANT_URL)


def embed(text):
    resp = client.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return resp.data[0].embedding


def retrieve(question, top_k=TOP_K):
    """Embed the question and search Qdrant for the top-k most similar chunks."""
    query_vector = embed(question)
    hits = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=top_k,
    ).points
    return hits


def build_prompt(question, hits):
    context_blocks = []
    for h in hits:
        source = h.payload.get("source", "unknown")
        chunk_index = h.payload.get("chunk_index", "?")
        text = h.payload.get("text", "")
        context_blocks.append(f"[{source} chunk {chunk_index}]\n{text}")
    context = "\n\n---\n\n".join(context_blocks)

    return (
        "Answer the question using ONLY the context below. "
        "If the context doesn't contain the answer, say you don't know.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}"
    )


def answer(question, hits):
    prompt = build_prompt(question, hits)
    resp = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content


def main():
    if len(sys.argv) < 2:
        sys.exit('Usage: python rag/query.py "your question here"')
    question = " ".join(sys.argv[1:])

    print(f"Embedding question via {EMBEDDING_MODEL}...")
    hits = retrieve(question)

    if not hits:
        print("No matching chunks found — did you run ingest.py first?")
        return

    print(f"Retrieved {len(hits)} chunk(s):")
    for h in hits:
        source = h.payload.get("source", "unknown")
        chunk_index = h.payload.get("chunk_index", "?")
        print(f"  {source} chunk {chunk_index} (score={h.score:.4f})")

    print(f"Asking {CHAT_MODEL}...")
    result = answer(question, hits)

    print("\n--- Answer ---")
    print(result)


if __name__ == "__main__":
    main()