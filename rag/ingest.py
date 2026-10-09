import os
import sys
import uuid
import glob

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from pypdf import PdfReader
from dotenv import load_dotenv
load_dotenv()

#---config---
OMNIROUTE_BASE_URL = os.environ.get("OMNIROUTE_BASE_URL", "http://localhost:20128/v1")
OMNIROUTE_API_KEY = os.environ.get("OMNIROUTE_API_KEY")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL")
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = os.environ.get("COLLECTION_NAME", "career_copilot_docs")
DOCS_DIR = os.environ.get("DOCS_DIR", "docs")

CHUNK_WORDS = 300      # ~ 300 words ≈ 390-400 tokens, sits in the 200-400 token target
CHUNK_OVERLAP = 50     # words of overlap between consecutive chunks

# Fixed namespace for deterministic point IDs — do not change this value,
# changing it would make every existing point ID unrecoverable/mismatched.
POINT_ID_NAMESPACE = uuid.UUID("6f2b3f0e-6c1e-4a2e-9d3a-6b1f2a7e9c10")

if not OMNIROUTE_API_KEY:
    sys.exit("Set OMNIROUTE_API_KEY (your OmniRoute endpoint key from the dashboard).")
if not EMBEDDING_MODEL:
    sys.exit(
        "Set EMBEDDING_MODEL to the exact model string shown on your OmniRoute "
        "dashboard's Models page for the Gemini embedding model, "
        "e.g. EMBEDDING_MODEL=gemini/text-embedding-004"
    )

client = OpenAI(base_url=OMNIROUTE_BASE_URL, api_key=OMNIROUTE_API_KEY)
qdrant = QdrantClient(url=QDRANT_URL)

def chunk_text(text, chunk_words=CHUNK_WORDS, overlap=CHUNK_OVERLAP):
    """Naive word-based chunking with overlap. Good enough for M1."""
    words = text.split()
    if not words:
        return []
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_words
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end >= len(words):
            break
        start = end - overlap
    return chunks


def embed(text):
    resp = client.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return resp.data[0].embedding


def point_id_for(source, chunk_index):
    """Deterministic UUID derived from source filename + chunk index.

    Re-ingesting the same file/chunk always produces the same point ID,
    so Qdrant's upsert overwrites the existing point instead of adding
    a duplicate. Rename a source file and it'll be treated as new content
    (that's expected — the ID is tied to the filename you gave it).
    """
    key = f"{source}::{chunk_index}"
    return str(uuid.uuid5(POINT_ID_NAMESPACE, key))


def read_docs(docs_dir):
    paths = []
    for ext in ("*.md", "*.txt","*.pdf"):
        paths.extend(glob.glob(os.path.join(docs_dir, ext)))
    if not paths:
        sys.exit(f"No .md/.txt/.pdf files found in {docs_dir}/ — drop your resume + notes there first.")
    return sorted(paths)

def extract_text(path):
    """Return plain text for a .md/.txt/.pdf file."""
    if path.lower().endswith(".pdf"):
        reader = PdfReader(path)
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
        return "\n".join(pages)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def main():
    paths = read_docs(DOCS_DIR)
    print(f"Found {len(paths)} source file(s) in {DOCS_DIR}/")
 
    all_chunks = []  # list of (source_filename, chunk_index, text)
    for path in paths:
        content = extract_text(path)
        chunks = chunk_text(content)
        print(f"  {os.path.basename(path)} -> {len(chunks)} chunk(s)")
        for i, c in enumerate(chunks):
            all_chunks.append((os.path.basename(path), i, c))
 
    if not all_chunks:
        sys.exit("No chunks produced — check that your docs/ files aren't empty.")
 
    print(f"Embedding {len(all_chunks)} chunk(s) via OmniRoute ({EMBEDDING_MODEL})...")
    vectors = []
    for source, idx, text in all_chunks:
        vec = embed(text)
        vectors.append(vec)
        print(f"  embedded {source} chunk {idx} (dim={len(vec)})")
 
    vector_size = len(vectors[0])
 
    # Create collection if it doesn't exist yet
    existing = [c.name for c in qdrant.get_collections().collections]
    if COLLECTION_NAME not in existing:
        print(f"Creating Qdrant collection '{COLLECTION_NAME}' (size={vector_size})")
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
    else:
        print(f"Using existing Qdrant collection '{COLLECTION_NAME}'")
 
    points = [
        PointStruct(
            id=point_id_for(all_chunks[i][0], all_chunks[i][1]),
            vector=vectors[i],
            payload={
                "source": all_chunks[i][0],
                "chunk_index": all_chunks[i][1],
                "text": all_chunks[i][2],
            },
        )
        for i in range(len(all_chunks))
    ]
 
    qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"Upserted {len(points)} point(s) into '{COLLECTION_NAME}'.")
 
 
if __name__ == "__main__":
    main()