from __future__ import annotations

import logging
from functools import lru_cache

from ultralytics import YOLO

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_model() -> YOLO:
    """Load the YOLO segmentation model once and cache it."""

    logger.info("Loading YOLO model from %s", settings.model_path)
    model = YOLO(settings.model_path)
    return model