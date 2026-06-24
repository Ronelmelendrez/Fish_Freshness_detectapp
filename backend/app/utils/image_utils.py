from __future__ import annotations

from io import BytesIO

import cv2
import numpy as np
from PIL import Image


def load_image_from_bytes(content: bytes) -> np.ndarray:
    """Load an RGB image from JPEG/PNG bytes (used by gallery scan)."""

    image = Image.open(BytesIO(content)).convert("RGB")
    return np.array(image)


def nv21_to_bgr(nv21_bytes: bytes, width: int, height: int) -> np.ndarray:
    """
    Convert raw NV21 YUV bytes into a BGR numpy array suitable for OpenCV / YOLO.

    NV21 layout: Y plane (width * height) + interleaved VU plane (width * height / 2).

    Parameters:
        nv21_bytes: Raw NV21 YUV420 semi-planar data.
        width: Frame width in pixels.
        height: Frame height in pixels.

    Returns:
        BGR numpy array of shape (height, width, 3).
    """
    expected_len = width * height * 3 // 2  # NV21 = 12 bits per pixel

    if len(nv21_bytes) != expected_len:
        raise ValueError(
            f"NV21 frame size mismatch: expected {expected_len} bytes "
            f"({width}x{height} NV21), got {len(nv21_bytes)}"
        )

    nv21 = np.frombuffer(nv21_bytes, dtype=np.uint8).reshape(
        (height * 3 // 2, width)
    )
    return cv2.cvtColor(nv21, cv2.COLOR_YUV2BGR_NV21)


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
        raw_bytes: Raw pixel data (RGBA bytes or NV21 bytes from frame processor).
        width: Frame width in pixels.
        height: Frame height in pixels.
        pixel_format: Pixel format string — "rgba" or "nv21".

    Returns:
        RGB numpy array of shape (height, width, 3).
    """
    if pixel_format == "nv21":
        bgr = nv21_to_bgr(raw_bytes, width, height)
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    # Default: RGBA
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
