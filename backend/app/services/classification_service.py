from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np
from ultralytics import YOLO

from app.config import settings


@dataclass(frozen=True)
class ClassificationResult:
    label: str
    confidence: float


def classify_freshness(model: YOLO, image_rgb: np.ndarray) -> Optional[ClassificationResult]:
    """Run classification on a cropped/masked region."""

    results = model.predict(source=image_rgb, verbose=False)
    if not results:
        return None

    probs = results[0].probs
    if probs is None:
        return None

    top1 = int(probs.top1)
    conf = float(probs.top1conf.item())
    if conf < settings.classification_confidence_threshold:
        return None

    label = results[0].names.get(top1, str(top1))
    return ClassificationResult(label=label, confidence=conf)
