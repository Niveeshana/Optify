"""
Dashboard API Routes (Doctor / Admin only)
GET /api/dashboard/stats          — overall stats
GET /api/dashboard/patients       — list all patients with their latest diagnosis
GET /api/dashboard/diagnoses      — all diagnoses with patient info
PATCH /api/dashboard/diagnoses/{id}/review — doctor adds review notes
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from middleware.auth import get_current_user, require_doctor_or_admin
from services.supabase_service import get_supabase

router = APIRouter()


@router.get("/stats")
async def get_stats(current_user: dict = Depends(require_doctor_or_admin)):
    """High-level statistics for the doctor dashboard."""
    supabase = get_supabase()

    patients = supabase.table("profiles").select("id", count="exact").eq("role", "patient").execute()
    total_diagnoses = supabase.table("diagnoses").select("id", count="exact").execute()
    gon_positive = supabase.table("diagnoses").select("id", count="exact").eq("prediction", "GON+").execute()
    gon_negative = supabase.table("diagnoses").select("id", count="exact").eq("prediction", "GON-").execute()
    pending_review = supabase.table("diagnoses").select("id", count="exact").is_("reviewed_by", "null").execute()

    return {
        "total_patients": patients.count or 0,
        "total_diagnoses": total_diagnoses.count or 0,
        "gon_positive": gon_positive.count or 0,
        "gon_negative": gon_negative.count or 0,
        "pending_review": pending_review.count or 0,
    }


@router.get("/patients")
async def get_patients(current_user: dict = Depends(require_doctor_or_admin)):
    """List all patients."""
    supabase = get_supabase()
    data = (
        supabase.table("profiles")
        .select("id, email, full_name, gender, date_of_birth, created_at")
        .eq("role", "patient")
        .order("created_at", desc=True)
        .execute()
    )
    return {"patients": data.data}


@router.get("/diagnoses")
async def get_all_diagnoses(current_user: dict = Depends(require_doctor_or_admin)):
    """List all diagnoses (with patient profiles joined)."""
    supabase = get_supabase()
    data = (
        supabase.table("diagnoses")
        .select("*, profiles!patient_id(full_name, email)")
        .order("created_at", desc=True)
        .execute()
    )
    return {"diagnoses": data.data}


class ReviewBody(BaseModel):
    notes: str


@router.patch("/diagnoses/{diagnosis_id}/review")
async def review_diagnosis(
    diagnosis_id: str,
    body: ReviewBody,
    current_user: dict = Depends(require_doctor_or_admin),
):
    """Doctor adds review notes to a diagnosis."""
    from datetime import datetime, timezone
    supabase = get_supabase()

    result = (
        supabase.table("diagnoses")
        .update({
            "notes": body.notes,
            "reviewed_by": current_user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", diagnosis_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(404, "Diagnosis not found")

    return {"message": "Review saved.", "diagnosis": result.data[0]}
