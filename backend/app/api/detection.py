from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from ultralytics import YOLO

from app.models.model_loader import get_model
from app.services.detection_service import DetectionResult, detect_fish
from app.utils.image_utils import load_image_from_bytes

logger = logging.getLogger(__name__)

router = APIRouter()


class DetectionResponse(BaseModel):
    detected_species: Optional[str] = Field(default=None)
    detected_part: Optional[str] = Field(default=None)
    confidence: Optional[float] = Field(default=None)
    is_blurry: bool
    is_centered: bool
    blurriness_score: float
    ready_for_capture: bool
    reason: Optional[str] = Field(default=None)


@router.post("/detect", response_model=DetectionResponse)
async def detect(
    image: UploadFile = File(...),
    target_species: Optional[str] = None,
    expected_part: Optional[str] = None,
    model: YOLO = Depends(get_model),
) -> DetectionResponse:
    """Detect fish species and part from an uploaded image."""

    try:
        content = await image.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty image file")
        image_rgb = load_image_from_bytes(content)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to decode image: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid image file") from exc

    result: DetectionResult
    try:
        result = detect_fish(model, image_rgb, target_species, expected_part)
    except Exception as exc:
        logger.exception("Detection failed: %s", exc)
        raise HTTPException(status_code=500, detail="Detection failed") from exc

    logger.info(
        "Detect request filename=%s size=%sx%s species=%s part=%s confidence=%s",
        image.filename,
        image_rgb.shape[1],
        image_rgb.shape[0],
        result.detected_species,
        result.detected_part,
        result.confidence,
    )

    return DetectionResponse(**result.__dict__)
