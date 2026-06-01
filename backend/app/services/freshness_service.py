from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np
from ultralytics import YOLO

from app.services.classification_service import ClassificationResult, classify_freshness
from app.services.segmentation_service import SegmentationResult, segment_region


@dataclass(frozen=True)
class FreshnessResult:
    mask_area: int
    segmentation_confidence: float
    classification_label: Optional[str]
    classification_confidence: Optional[float]


def _apply_mask(image_rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
    masked = image_rgb.copy()
    masked[~mask] = 0

    ys, xs = np.where(mask)
    if len(xs) == 0 or len(ys) == 0:
        return masked

    x_min, x_max = xs.min(), xs.max()
    y_min, y_max = ys.min(), ys.max()
    cropped = masked[y_min : y_max + 1, x_min : x_max + 1]
    return cropped


def run_freshness_pipeline(
    segmentation_model: YOLO,
    classification_model: YOLO,
    image_rgb: np.ndarray,
) -> Optional[FreshnessResult]:
    """Segment region and classify freshness from the masked crop."""

    seg_result: Optional[SegmentationResult] = segment_region(segmentation_model, image_rgb)
    if seg_result is None:
        return None

    mask_area = int(seg_result.mask.sum())
    masked_crop = _apply_mask(image_rgb, seg_result.mask)
    if masked_crop.size == 0:
        return None

    class_result: Optional[ClassificationResult] = classify_freshness(
        classification_model, masked_crop
    )

    return FreshnessResult(
        mask_area=mask_area,
        segmentation_confidence=seg_result.confidence,
        classification_label=class_result.label if class_result else None,
        classification_confidence=class_result.confidence if class_result else None,
    )
