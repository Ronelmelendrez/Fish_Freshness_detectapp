from __future__ import annotations

from io import BytesIO

import numpy as np
from PIL import Image


def load_image_from_bytes(content: bytes) -> np.ndarray:
    """Load an RGB image from JPEG/PNG bytes (used by gallery scan)."""

    image = Image.open(BytesIO(content)).convert("RGB")
    return np.array(image)


def load_raw_frame_to_rgb(
    raw_bytes: bytes,
    width: int,
    height: int,
    pixel_format: str = "rgba",
) -> np.ndarray:
    """
    Convert raw pixel data from react-native-vision-camera's frame.toArrayBuffer()
    into an RGB numpy array suitable for YOLO inference.

    Parameters:
        raw_bytes: Raw pixel data (RGBA bytes from frame processor).
        width: Frame width in pixels.
        height: Frame height in pixels.
        pixel_format: Pixel format string. Currently supports "rgba".

    Returns:
        RGB numpy array of shape (height, width, 3).
    """
    expected_len = width * height * 4  # RGBA = 4 bytes per pixel

    if len(raw_bytes) != expected_len:
        raise ValueError(
            f"Raw frame size mismatch: expected {expected_len} bytes "
            f"({width}x{height}x4 RGBA), got {len(raw_bytes)}"
        )

    # Reshape raw bytes into (height, width, 4) RGBA array
    rgba = np.frombuffer(raw_bytes, dtype=np.uint8).reshape((height, width, 4))

    # Extract RGB channels (drop alpha)
    rgb = rgba[:, :, :3].copy()

    return rgb
