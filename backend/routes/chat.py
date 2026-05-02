"""
Chat API Routes — RAG-powered chatbot
POST /api/chat/message   — send a message, get AI response
GET  /api/chat/history   — get chat history for current user
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from middleware.auth import get_current_user
from services.rag_service import ask
from services.supabase_service import get_supabase

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


@router.post("/message", response_model=ChatResponse)
async def send_message(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send a message to the RAG chatbot and get a response."""
    if not body.message.strip():
        raise HTTPException(400, "Message cannot be empty.")

    supabase = get_supabase()

    # Fetch recent chat history for this user (last 6 exchanges)
    history_data = (
        supabase.table("chat_messages")
        .select("role, content")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .limit(12)
        .execute()
    )

    # Build LangChain-format history: list of (human, ai) tuples
    messages = list(reversed(history_data.data or []))
    chat_history = []
    i = 0
    while i < len(messages) - 1:
        if messages[i]["role"] == "user" and messages[i + 1]["role"] == "assistant":
            chat_history.append((messages[i]["content"], messages[i + 1]["content"]))
            i += 2
        else:
            i += 1

    # Get RAG response
    result = ask(body.message, chat_history)

    # Persist user message
    supabase.table("chat_messages").insert({
        "user_id": current_user["id"],
        "role": "user",
        "content": body.message,
    }).execute()

    # Persist assistant response
    supabase.table("chat_messages").insert({
        "user_id": current_user["id"],
        "role": "assistant",
        "content": result["answer"],
        "sources": result["sources"],
    }).execute()

    return ChatResponse(answer=result["answer"], sources=result["sources"])


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    """Get chat history for the current user."""
    supabase = get_supabase()
    data = (
        supabase.table("chat_messages")
        .select("id, role, content, sources, created_at")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=False)
        .limit(100)
        .execute()
    )
    return {"messages": data.data}


@router.delete("/history")
async def clear_history(current_user: dict = Depends(get_current_user)):
    """Clear chat history for current user."""
    supabase = get_supabase()
    supabase.table("chat_messages").delete().eq("user_id", current_user["id"]).execute()
    return {"message": "Chat history cleared."}
