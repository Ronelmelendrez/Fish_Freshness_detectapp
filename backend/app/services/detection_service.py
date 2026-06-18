from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np
from ultralytics import YOLO

from app.config import settings
from app.services.quality_service import QualityResult, check_blurriness, is_centered


@dataclass(frozen=True)
class DetectionResult:
    detected_species: Optional[str]
    detected_part: Optional[str]
    freshness: Optional[str]
    confidence: Optional[float]
    is_blurry: bool
    is_centered: bool
    blurriness_score: float
    ready_for_capture: bool
    reason: Optional[str] = None


def _parse_class_name(class_name: str) -> tuple[str, str, str]:
    """
    Parse class name in format: Species_Part_Freshness
    Example: Roughear_scad_eye_fresh -> (Roughear_scad, eye, fresh)
    """
    # Split from the right to get freshness first
    parts = class_name.rsplit("_", 1)
    if len(parts) < 2:
        return class_name, "", ""
    
    freshness = parts[1].lower()  # fresh or spoiled
    remaining = parts[0]
    
    # Now split remaining to get species and part
    # Known parts: eye, skin
    remaining_lower = remaining.lower()
    
    if remaining_lower.endswith("_eye"):
        species = remaining[:-4]  # Remove "_eye"
        part = "eye"
    elif remaining_lower.endswith("_skin"):
        species = remaining[:-5]  # Remove "_skin"
        part = "skin"
    else:
        # Try to split by underscore
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
            blurriness_score=quality.blurriness_score,
            ready_for_capture=False,
            reason="No fish detected",
        )

    class_name, conf, bbox_xyxy = detection
    species, part, freshness = _parse_class_name(class_name)
    centered = is_centered(image_rgb.shape[:2], bbox_xyxy)

    target_ok = True
    if target_species:
        target_ok = species.lower() == target_species.lower()

    part_ok = True
    if expected_part:
        part_ok = part.lower() == expected_part.lower()

    ready = (
        target_ok
        and part_ok
        and conf >= 0.8
        and (not quality.is_blurry)
        and centered
    )

    # Determine reason if not ready
    reason = None
    if not ready:
        reasons = []
        if not target_ok:
            reasons.append("Species mismatch")
        if not part_ok:
            reasons.append("Part mismatch")
        if conf < 0.8:
            reasons.append("Low confidence")
        if quality.is_blurry:
            reasons.append("Image is blurry")
        if not centered:
            reasons.append("Not centered")
        reason = "; ".join(reasons) if reasons else "Not ready"

    return DetectionResult(
        detected_species=species,
        detected_part=part,
        freshness=freshness,
        confidence=conf,
        is_blurry=quality.is_blurry,
        is_centered=centered,
        blurriness_score=quality.blurriness_score,
        ready_for_capture=ready,
        reason=reason,
    )