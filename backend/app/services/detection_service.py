from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np
from ultralytics import YOLO

from app.config import settings
from app.services.quality_service import (
    QualityResult,
    check_blurriness,
    check_quality_with_bbox,
    is_centered,
)


@dataclass(frozen=True)
class DetectionResult:
    detected_species: Optional[str]
    detected_part: Optional[str]
    freshness: Optional[str]
    confidence: Optional[float]
    is_blurry: bool
    is_centered: bool
    is_good_size: bool
    blurriness_score: float
    size_ratio: float
    ready_for_capture: bool
    reason: Optional[str] = None


def _parse_class_name(class_name: str) -> tuple[str, str, str]:
    """
    Parse class name in format: Species_Part_Freshness
    Example: Roughear_scad_eye_fresh -> (Roughear_scad, eye, fresh)
    """
    parts = class_name.rsplit("_", 1)
    if len(parts) < 2:
        return class_name, "", ""
    
    freshness = parts[1].lower()  # fresh or spoiled
    remaining = parts[0]
    
    remaining_lower = remaining.lower()
    
    if remaining_lower.endswith("_eye"):
        species = remaining[:-4]
        part = "eye"
    elif remaining_lower.endswith("_skin"):
        species = remaining[:-5]
        part = "skin"
    else:
        sub_parts = remaining.split("_", maxsplit=1)
        species = sub_parts[0] if sub_parts else remaining
        part = sub_parts[1] if len(sub_parts) > 1 else ""
    
    return species, part, freshness


def _best_detection(model: YOLO, image_rgb: np.ndarray) -> Optional[tuple[str, float, tuple[float, float, float, float]]]:
    results = model.predict(source=image_rgb, conf=settings.confidence_threshold, verbose=False)
    if not results:
        return None

    boxes = results[0].boxes
    if boxes is None or len(boxes) == 0:
        return None

    best_idx = int(np.argmax(boxes.conf.cpu().numpy()))
    conf = float(boxes.conf[best_idx].item())
    cls_id = int(boxes.cls[best_idx].item())
    class_name = results[0].names.get(cls_id, str(cls_id))
    bbox = boxes.xyxy[best_idx].cpu().numpy().tolist()
    bbox_xyxy = (float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3]))
    return class_name, conf, bbox_xyxy


def detect_fish(
    model: YOLO,
    image_rgb: np.ndarray,
    target_species: Optional[str],
    expected_part: Optional[str],
) -> DetectionResult:
    """Run detection and quality checks, returning a response-ready result."""

    # Basic blurriness check first
    quality = check_blurriness(image_rgb)
    
    detection = _best_detection(model, image_rgb)
    if detection is None:
        return DetectionResult(
            detected_species=None,
            detected_part=None,
            freshness=None,
            confidence=None,
            is_blurry=quality.is_blurry,
            is_centered=False,
            is_good_size=False,
            blurriness_score=quality.blurriness_score,
            size_ratio=0.0,
            ready_for_capture=False,
            reason="No fish detected",
        )

    class_name, conf, bbox_xyxy = detection
    species, part, freshness = _parse_class_name(class_name)
    centered = is_centered(image_rgb.shape[:2], bbox_xyxy)
    
    # Enhanced quality check with bbox for size validation
    quality_with_bbox = check_quality_with_bbox(image_rgb, bbox_xyxy)

    target_ok = True
    if target_species:
        target_ok = species.lower() == target_species.lower()

    part_ok = True
    if expected_part:
        part_ok = part.lower() == expected_part.lower()

    # Strict auto-capture conditions:
    # 1. Species must match (if provided)
    # 2. Part must match (eye/skin)
    # 3. Confidence must be high (>= 0.8)
    # 4. Image must not be blurry
    # 5. Fish must be centered
    # 6. Fish must be at good distance (15-60% of frame)
    ready = (
        target_ok
        and part_ok
        and conf >= 0.8
        and (not quality.is_blurry)
        and centered
        and quality_with_bbox.is_good_size
    )

    # Detailed reason if not ready
    reason = None
    if not ready:
        reasons = []
        if not target_ok:
            reasons.append("Species mismatch")
        if not part_ok:
            reasons.append("Part mismatch")
        if conf < 0.8:
            reasons.append(f"Low confidence ({conf:.0%})")
        if quality.is_blurry:
            reasons.append("Image is blurry")
        if not centered:
            reasons.append("Not centered")
        if not quality_with_bbox.is_good_size:
            if quality_with_bbox.size_ratio < 0.15:
                reasons.append("Too far away")
            else:
                reasons.append("Too close")
        reason = "; ".join(reasons) if reasons else "Not ready"

    return DetectionResult(
        detected_species=species,
        detected_part=part,
        freshness=freshness,
        confidence=conf,
        is_blurry=quality.is_blurry,
        is_centered=centered,
        is_good_size=quality_with_bbox.is_good_size,
        blurriness_score=quality.blurriness_score,
        size_ratio=quality_with_bbox.size_ratio,
        ready_for_capture=ready,
        reason=reason,
    )