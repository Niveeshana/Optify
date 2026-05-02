"""
Auth middleware — verifies Supabase JWT and injects user into request
"""
from fastapi import HTTPException, Depends, Header
from services.supabase_service import get_supabase


async def get_current_user(authorization: str = Header(...)):
    """Extract and verify the Supabase JWT from the Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate token")

    # Fetch role from profiles table
    profile = (
        supabase.table("profiles")
        .select("id, email, full_name, role")
        .eq("id", user.id)
        .single()
        .execute()
    )

    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile.data


async def require_doctor_or_admin(current_user=Depends(get_current_user)):
    if current_user["role"] not in ("doctor", "admin"):
        raise HTTPException(status_code=403, detail="Doctor or Admin access required")
    return current_user
