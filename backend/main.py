"""
GlaucomaAI — FastAPI Backend
Entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes import auth, diagnoses, chat, dashboard
from services.model_service import load_model
from services.rag_service import init_rag


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load AI model and RAG on startup."""
    print("🚀 Starting GlaucomaAI backend...")
    load_model()
    init_rag()
    print("✅ Model and RAG ready.")
    yield
    print("👋 Shutting down.")


app = FastAPI(
    title="GlaucomaAI API",
    description="Glaucoma detection + explainability + RAG chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/auth",      tags=["Auth"])
app.include_router(diagnoses.router,  prefix="/api/diagnoses", tags=["Diagnoses"])
app.include_router(chat.router,       prefix="/api/chat",      tags=["Chat"])
app.include_router(dashboard.router,  prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/")
def root():
    return {"status": "ok", "service": "GlaucomaAI API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
