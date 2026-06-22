from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, WebSocket, WebSocketDisconnect
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
    freshness: Optional[str] = Field(default=None)
    confidence: Optional[float] = Field(default=None)
    is_blurry: bool
    is_centered: bool
    is_good_size: bool
    blurriness_score: float
    size_ratio: float
    ready_for_capture: bool
    reason: Optional[str] = Field(default=None)
    mask_polygon: Optional[list[list[float]]] = Field(default=None)


@router.post("/api/v1/detect", response_model=DetectionResponse)
async def detect(
    image: UploadFile = File(...),
    target_species: Optional[str] = None,
    expected_part: Optional[str] = None,
    model: YOLO = Depends(get_model),
) -> DetectionResponse:
    """Detect fish species, part, and freshness from an uploaded image."""
    logger.info(
        "[CONNECTION AUDIT] Detection request from client — species=%s part=%s filename=%s",
        target_species, expected_part, image.filename,
    )

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
        "Detect request filename=%s size=%sx%s species=%s part=%s freshness=%s confidence=%s ready=%s reason=%s",
        image.filename,
        image_rgb.shape[1],
        image_rgb.shape[0],
        result.detected_species,
        result.detected_part,
        result.freshness,
        result.confidence,
        result.ready_for_capture,
        result.reason,
    )

    return DetectionResponse(**result.__dict__)


@router.websocket("/ws/detect")
async def detect_stream(
    websocket: WebSocket,
    target_species: Optional[str] = Query(default=None),
    expected_part: Optional[str] = Query(default=None),
):
    """WebSocket endpoint for real-time fish detection streaming."""
    await websocket.accept()
    model = get_model()
    logger.info(
        "[WS] Client connected — species=%s part=%s", target_species, expected_part
    )

    try:
        while True:
            image_bytes = await websocket.receive_bytes()

            if not image_bytes:
                continue

            try:
                image_rgb = load_image_from_bytes(image_bytes)
            except Exception as exc:
                logger.warning("[WS] Failed to decode image: %s", exc)
                await websocket.send_text(
                    json.dumps(
                        {
                            "error": "Invalid image",
                            "detail": str(exc),
                        }
                    )
                )
                continue

            try:
                result: DetectionResult = detect_fish(
                    model,
                    image_rgb,
                    target_species,
                    expected_part,
                )
            except Exception as exc:
                logger.exception("[WS] Detection failed: %s", exc)
                await websocket.send_text(
                    json.dumps(
                        {
                            "error": "Detection failed",
                            "detail": str(exc),
                        }
                    )
                )
                continue

            await websocket.send_text(json.dumps(result.__dict__))

    except WebSocketDisconnect:
        logger.info("[WS] Client disconnected")
    except Exception as exc:
        logger.exception("[WS] Unexpected error: %s", exc)
