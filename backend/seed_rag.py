"""
seed_rag.py — Run once to populate ChromaDB from all docs in /docs folder.
Usage: python seed_rag.py
"""
import shutil
import os
from pathlib import Path
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from config import settings

if __name__ == "__main__":
    # Wipe existing DB
    if os.path.exists(settings.chroma_persist_dir):
        shutil.rmtree(settings.chroma_persist_dir)
        print("Wiped existing ChromaDB.")

    embedding_fn = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
    )

    # Load ALL .md and .txt files from docs/ folder
    docs_path = Path(__file__).parent.parent / "docs"
    all_docs = []

    for file in docs_path.glob("*.md"):
        print(f"  Loading: {file.name}")
        loader = TextLoader(str(file), encoding="utf-8")
        all_docs.extend(loader.load())

    for file in docs_path.glob("*.txt"):
        print(f"  Loading: {file.name}")
        loader = TextLoader(str(file), encoding="utf-8")
        all_docs.extend(loader.load())

    print(f"  Total documents loaded: {len(all_docs)}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n## ", "\n### ", "\n\n", "\n", " "],
    )
    chunks = splitter.split_documents(all_docs)
    print(f"  Split into {len(chunks)} chunks.")

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_fn,
        persist_directory=settings.chroma_persist_dir,
        collection_name="glaucoma_kb",
    )
    vectorstore.persist()
    print("✅ ChromaDB seeded successfully from all docs.")