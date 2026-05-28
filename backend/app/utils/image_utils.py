from __future__ import annotations

from io import BytesIO

import numpy as np
from PIL import Image


def load_image_from_bytes(content: bytes) -> np.ndarray:
    """Load an RGB image from raw bytes."""

    image = Image.open(BytesIO(content)).convert("RGB")
    return np.array(image)
