from __future__ import annotations

import logging
from functools import lru_cache

from ultralytics import YOLO

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_model() -> YOLO:
    """Load the YOLO model once and cache it."""

    logger.info("Loading YOLO model from %s", settings.model_path)
    model = YOLO(settings.model_path)
    return model


@lru_cache(maxsize=1)
def get_segmentation_model() -> YOLO:
    """Load the YOLO segmentation model once and cache it."""

    logger.info("Loading segmentation model from %s", settings.segmentation_model_path)
    model = YOLO(settings.segmentation_model_path)
    return model


@lru_cache(maxsize=1)
def get_classification_model() -> YOLO:
    """Load the classification model once and cache it."""

    logger.info("Loading classification model from %s", settings.classification_model_path)
    model = YOLO(settings.classification_model_path)
    return model
