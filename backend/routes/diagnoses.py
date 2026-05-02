"""
Diagnoses API Routes
POST /api/diagnoses/predict  — upload fundus image, get AI prediction
GET  /api/diagnoses/          — get current user's diagnoses
GET  /api/diagnoses/{id}      — get single diagnosis
"""
import uuid
import base64
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime

from middleware.auth import get_current_user
from services.model_service import predict
from services.supabase_service import get_supabase

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class DiagnosisResult(BaseModel):
    id: str
    label: str
    confidence: float
    gradcam_b64: str | None
    image_url: str | None
    created_at: str


@router.post("/predict", response_model=DiagnosisResult)
async def predict_diagnosis(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a fundus image → AI predicts GON+ / GON− with confidence and Grad-CAM.
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG/PNG images are accepted.")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, "File size exceeds 10 MB limit.")

    # Run AI inference
    result = predict(image_bytes)

    supabase = get_supabase()

    # Upload original image to Supabase Storage
    file_key = f"{current_user['id']}/{uuid.uuid4()}.jpg"
    try:
        supabase.storage.from_("fundus-images").upload(
            path=file_key,
            file=image_bytes,
            file_options={"content-type": "image/jpeg"},
        )
        image_url = supabase.storage.from_("fundus-images").get_public_url(file_key)
    except Exception:
        image_url = None

    # Upload Grad-CAM to storage if available
    gradcam_url = None
    if result["gradcam_b64"]:
        gradcam_key = f"{current_user['id']}/gradcam_{uuid.uuid4()}.png"
        try:
            gradcam_bytes = base64.b64decode(result["gradcam_b64"])
            supabase.storage.from_("fundus-images").upload(
                path=gradcam_key,
                file=gradcam_bytes,
                file_options={"content-type": "image/png"},
            )
            gradcam_url = supabase.storage.from_("fundus-images").get_public_url(gradcam_key)
        except Exception:
            gradcam_url = None

    # Save diagnosis record
    record = {
        "patient_id": current_user["id"],
        "prediction": result["label"],
        "confidence": result["confidence"],
        "image_url": image_url,
        "gradcam_url": gradcam_url,
    }
    saved = supabase.table("diagnoses").insert(record).execute()
    diagnosis_id = saved.data[0]["id"]

    return DiagnosisResult(
        id=diagnosis_id,
        label=result["label"],
        confidence=result["confidence"],
        gradcam_b64=result["gradcam_b64"],
        image_url=image_url,
        created_at=saved.data[0]["created_at"],
    )


@router.get("/")
async def get_my_diagnoses(current_user: dict = Depends(get_current_user)):
    """Get all diagnoses for the current user."""
    supabase = get_supabase()
    data = (
        supabase.table("diagnoses")
        .select("*")
        .eq("patient_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return {"diagnoses": data.data}


@router.get("/{diagnosis_id}")
async def get_diagnosis(
    diagnosis_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific diagnosis (patient can only see their own)."""
    supabase = get_supabase()
    query = supabase.table("diagnoses").select("*").eq("id", diagnosis_id)

    if current_user["role"] == "patient":
        query = query.eq("patient_id", current_user["id"])

    result = query.single().execute()
    if not result.data:
        raise HTTPException(404, "Diagnosis not found")
    return result.data
