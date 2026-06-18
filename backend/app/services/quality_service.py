from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from app.config import settings


@dataclass(frozen=True)
class QualityResult:
    is_blurry: bool
    blurriness_score: float
    is_good_size: bool
    size_ratio: float


def check_blurriness(image_rgb: np.ndarray) -> QualityResult:
    """Check image blurriness using Laplacian variance and size ratio."""

    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = variance < settings.blur_threshold
    return QualityResult(
        is_blurry=is_blurry,
        blurriness_score=variance,
        is_good_size=True,  # Will be updated with bbox
        size_ratio=0.0,
    )


def check_quality_with_bbox(
    image_rgb: np.ndarray,
    bbox_xyxy: tuple[float, float, float, float],
) -> QualityResult:
    """Check image quality including blurriness and bounding box size."""

    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = variance < settings.blur_threshold

    # Calculate size ratio (bbox area vs image area)
    height, width = image_shape = image_rgb.shape[:2]
    x1, y1, x2, y2 = bbox_xyxy
    bbox_area = max(0, x2 - x1) * max(0, y2 - y1)
    image_area = height * width
    size_ratio = bbox_area / image_area if image_area > 0 else 0

    # Good size: bbox should be 15-60% of image area (not too close, not too far)
    is_good_size = 0.15 <= size_ratio <= 0.60

    return QualityResult(
        is_blurry=is_blurry,
        blurriness_score=variance,
        is_good_size=is_good_size,
        size_ratio=size_ratio,
    )


def is_centered(
    image_shape: tuple[int, int],
    bbox_xyxy: tuple[float, float, float, float],
) -> bool:
    """Check whether a bounding box center lies within the central region."""

    height, width = image_shape
    x1, y1, x2, y2 = bbox_xyxy
    center_x = ((x1 + x2) / 2.0) / float(width)
    center_y = ((y1 + y2) / 2.0) / float(height)

    margin = settings.center_margin
    return (margin <= center_x <= 1.0 - margin) and (margin <= center_y <= 1.0 - margin)