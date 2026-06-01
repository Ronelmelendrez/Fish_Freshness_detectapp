from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np
from ultralytics import YOLO

from app.config import settings


@dataclass(frozen=True)
class SegmentationResult:
    mask: np.ndarray
    confidence: float


def segment_region(model: YOLO, image_rgb: np.ndarray) -> Optional[SegmentationResult]:
    """Run segmentation to obtain the highest-confidence mask."""

    results = model.predict(
        source=image_rgb,
        conf=settings.segmentation_confidence_threshold,
        verbose=False,
    )
    if not results:
        return None

    boxes = results[0].boxes
    masks = results[0].masks
    if boxes is None or masks is None or len(boxes) == 0:
        return None

    best_idx = int(np.argmax(boxes.conf.cpu().numpy()))
    conf = float(boxes.conf[best_idx].item())
    mask_tensor = masks.data[best_idx].cpu().numpy()
    mask = mask_tensor.astype(bool)

    return SegmentationResult(mask=mask, confidence=conf)
