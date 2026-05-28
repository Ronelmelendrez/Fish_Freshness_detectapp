from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from app.config import settings


@dataclass(frozen=True)
class QualityResult:
    is_blurry: bool
    blurriness_score: float


def check_blurriness(image_rgb: np.ndarray) -> QualityResult:
    """Check image blurriness using Laplacian variance."""

    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = variance < settings.blur_threshold
    return QualityResult(is_blurry=is_blurry, blurriness_score=variance)


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
