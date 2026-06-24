from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from ultralytics import YOLO

from app.models.model_loader import get_model
from app.services.detection_service import DetectionResult, detect_fish
from app.utils.image_utils import load_image_from_bytes, load_raw_frame_to_rgb, nv21_to_bgr

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
    """
    WebSocket endpoint for real-time fish detection streaming.

    Protocol (from react-native-vision-camera frame processor):
      - First message:  0x00 prefix + JSON metadata
        {"type":"metadata","width":N,"height":N,"pixelFormat":"rgba"|"nv21"}
      - Frame messages: 0x01 prefix + raw pixel data
        • rgba: width * height * 4 bytes
        • nv21: width * height * 3 // 2 bytes

    Also supports legacy JPEG binary messages (no prefix) for backward compatibility.
    """
    await websocket.accept()
    model = get_model()
    logger.info(
        "[WS] Client connected — species=%s part=%s", target_species, expected_part
    )

    # Frame metadata state (set by first metadata message)
    frame_width: Optional[int] = None
    frame_height: Optional[int] = None
    pixel_format: str = "rgba"

    try:
        while True:
            raw_data = await websocket.receive_bytes()

            if not raw_data or len(raw_data) < 1:
                continue

            # Check protocol flag byte
            flag = raw_data[0]
            payload = raw_data[1:]

            if flag == 0x00:
                # Metadata message — extract frame dimensions
                try:
                    meta = json.loads(payload.decode("utf-8"))
                    frame_width = meta.get("width")
                    frame_height = meta.get("height")
                    pixel_format = meta.get("pixelFormat", "rgba")
                    logger.info(
                        "[WS] Frame metadata received: %sx%s format=%s",
                        frame_width, frame_height, pixel_format,
                    )
                except Exception as exc:
                    logger.warning("[WS] Failed to parse metadata: %s", exc)
                    await websocket.send_text(
                        json.dumps({"error": "Invalid metadata", "detail": str(exc)})
                    )
                continue

            if flag == 0x01:
                # Raw frame data message
                if frame_width is None or frame_height is None:
                    logger.warning("[WS] Received frame data before metadata")
                    await websocket.send_text(
                        json.dumps({"error": "No metadata", "detail": "Send metadata before frame data"})
                    )
                    continue

                try:
                    image_rgb = load_raw_frame_to_rgb(
                        payload, frame_width, frame_height, pixel_format
                    )
                except Exception as exc:
                    logger.warning("[WS] Failed to decode raw frame: %s", exc)
                    await websocket.send_text(
                        json.dumps({"error": "Invalid frame", "detail": str(exc)})
                    )
                    continue
            else:
                # Legacy mode: treat entire message as JPEG/PNG bytes (no prefix flag)
                try:
                    image_rgb = load_image_from_bytes(raw_data)
                except Exception as exc:
                    logger.warning("[WS] Failed to decode image: %s", exc)
                    await websocket.send_text(
                        json.dumps({"error": "Invalid image", "detail": str(exc)})
                    )
                    continue

            # Run YOLO detection
            try:
                result: DetectionResult = detect_fish(
                    model, image_rgb, target_species, expected_part
                )
            except Exception as exc:
                logger.exception("[WS] Detection failed: %s", exc)
                await websocket.send_text(
                    json.dumps({"error": "Detection failed", "detail": str(exc)})
                )
                continue

            await websocket.send_text(json.dumps(result.__dict__))

    except WebSocketDisconnect:
        logger.info("[WS] Client disconnected")
    except Exception as exc:
        logger.exception("[WS] Unexpected error: %s", exc)
