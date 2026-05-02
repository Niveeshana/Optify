"""
RAG Service (modern LangChain - no deprecated chains)
- Loads glaucoma knowledge base into ChromaDB (once)
- Answers questions using retrieved context + Gemini
"""
import os
from pathlib import Path

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from config import settings

_vectorstore = None
_retriever   = None
_chain       = None

SYSTEM_PROMPT = """You are GlaucomaAI Assistant, a helpful medical support chatbot specializing in glaucoma and eye health.

Use the context below (retrieved from a glaucoma knowledge base) to answer the question.
If the context does not contain enough information, say so honestly.

Guidelines:
- Be empathetic and clear, especially with patients who may be anxious
- Always recommend consulting a qualified ophthalmologist for personal medical decisions
- Explain medical terms in simple language when possible
- Never provide specific dosage or prescription advice

Context:
{context}

Question: {question}

Answer:"""


def _format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def init_rag():
    """Initialize ChromaDB vector store and RAG chain."""
    global _vectorstore, _retriever, _chain

    embedding_fn = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
    )

    chroma_path = settings.chroma_persist_dir

    if os.path.exists(chroma_path) and os.listdir(chroma_path):
        print("Loading existing ChromaDB...")
        _vectorstore = Chroma(
            persist_directory=chroma_path,
            embedding_function=embedding_fn,
            collection_name="glaucoma_kb",
        )
    else:
        print("Seeding ChromaDB from knowledge base...")
        _vectorstore = _seed_chroma(embedding_fn, chroma_path)

    _retriever = _vectorstore.as_retriever(search_kwargs={"k": 4})

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.google_api_key,
        temperature=0.3,
        max_output_tokens=1024,
    )

    prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)

    _chain = (
        {"context": _retriever | _format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    print("✅ RAG chain ready (Gemini).")


def _seed_chroma(embedding_fn, chroma_path: str):
    """Load the knowledge base MD file and embed into ChromaDB."""
    kb_path = Path(settings.knowledge_base_path)
    if not kb_path.exists():
        kb_path = Path(__file__).parent.parent.parent / "docs" / "glaucoma_knowledge.md"

    loader = TextLoader(str(kb_path), encoding="utf-8")
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n## ", "\n### ", "\n\n", "\n", " "],
    )
    chunks = splitter.split_documents(docs)
    print(f"  Split into {len(chunks)} chunks.")

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_fn,
        persist_directory=chroma_path,
        collection_name="glaucoma_kb",
    )
    vectorstore.persist()
    print("  ChromaDB seeded and persisted.")
    return vectorstore


def ask(question: str, chat_history: list[tuple]) -> dict:
    if _chain is None:
        raise RuntimeError("RAG not initialized. Call init_rag() first.")

    answer = _chain.invoke(question)

    source_docs = _retriever.invoke(question)
    sources = [
        {
            "content": doc.page_content[:200] + "...",
            "source": doc.metadata.get("source", "Glaucoma Knowledge Base"),
        }
        for doc in source_docs
    ]

    return {
        "answer": answer,
        "sources": sources,
    }