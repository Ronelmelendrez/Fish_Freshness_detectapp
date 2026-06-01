from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from ultralytics import YOLO

from app.models.model_loader import get_classification_model, get_segmentation_model
from app.services.freshness_service import FreshnessResult, run_freshness_pipeline
from app.utils.image_utils import load_image_from_bytes

logger = logging.getLogger(__name__)

router = APIRouter()


class FreshnessResponse(BaseModel):
    freshness_label: Optional[str] = Field(default=None)
    freshness_confidence: Optional[float] = Field(default=None)
    segmentation_confidence: float
    mask_area: int
    reason: Optional[str] = Field(default=None)


@router.post("/freshness", response_model=FreshnessResponse)
async def freshness(
    image: UploadFile = File(...),
    segmentation_model: YOLO = Depends(get_segmentation_model),
    classification_model: YOLO = Depends(get_classification_model),
) -> FreshnessResponse:
    """Run backend segmentation + freshness classification."""

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

    try:
        result: Optional[FreshnessResult] = run_freshness_pipeline(
            segmentation_model, classification_model, image_rgb
        )
    except Exception as exc:
        logger.exception("Freshness pipeline failed: %s", exc)
        raise HTTPException(status_code=500, detail="Freshness pipeline failed") from exc

    if result is None:
        return FreshnessResponse(
            freshness_label=None,
            freshness_confidence=None,
            segmentation_confidence=0.0,
            mask_area=0,
            reason="No region detected",
        )

    return FreshnessResponse(
        freshness_label=result.classification_label,
        freshness_confidence=result.classification_confidence,
        segmentation_confidence=result.segmentation_confidence,
        mask_area=result.mask_area,
        reason=None,
    )
