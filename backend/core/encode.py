"""Image decode / encode / resize helpers."""

import base64

import cv2
import numpy as np

MAX_EDGE = 1024  # long-edge cap for processing (FR-1.3)


def decode_image(data: bytes) -> np.ndarray | None:
    """Decode uploaded bytes into a uint8 grayscale (2-D) or BGR (3-D) array.

    Returns ``None`` if the bytes are not a decodable image.
    """
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        return None
    if img.ndim == 3 and img.shape[2] == 4:  # drop alpha
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    if img.dtype != np.uint8:  # e.g. 16-bit TIFF → 8-bit
        img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return img


def resize_max(img: np.ndarray, max_edge: int = MAX_EDGE) -> tuple[np.ndarray, bool]:
    """Downscale so the long edge is <= ``max_edge``, keeping aspect ratio.

    Returns ``(image, was_resized)``.
    """
    h, w = img.shape[:2]
    long_edge = max(h, w)
    if long_edge <= max_edge:
        return img, False
    scale = max_edge / long_edge
    resized = cv2.resize(
        img, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA
    )
    return resized, True


def encode_png_base64(img: np.ndarray) -> str:
    """Encode an image as a base64 PNG string (no ``data:`` prefix)."""
    ok, buf = cv2.imencode(".png", img)
    if not ok:
        raise ValueError("PNG encoding failed")
    return base64.b64encode(buf.tobytes()).decode("ascii")
