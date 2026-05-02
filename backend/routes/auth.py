"""
Auth API Routes — thin wrapper around Supabase Auth
GET /api/auth/me — get current user profile
"""
from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter()


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user
