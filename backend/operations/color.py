"""Color-space conversion operations (L2/L11, FR-1.4, T1.8).

Each operation takes ``(img, params)`` and returns ``(result, meta)`` where
``meta`` carries the lecture label, OpenCV function name and code snippet for
the educational UI. This is the shape every ``/process`` operation follows.
"""

import cv2
import numpy as np


def to_gray(img: np.ndarray, params: dict) -> tuple[np.ndarray, dict]:
    result = img if img.ndim == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    meta = {
        "lecture": "L2",
        "opencv_function": "cv2.cvtColor",
        "code_snippet": "gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)",
    }
    return result, meta


def to_rgb(img: np.ndarray, params: dict) -> tuple[np.ndarray, dict]:
    result = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR) if img.ndim == 2 else img
    meta = {
        "lecture": "L2",
        "opencv_function": "cv2.cvtColor",
        "code_snippet": "rgb = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)",
    }
    return result, meta


def split_channels(img: np.ndarray) -> dict[str, np.ndarray]:
    """Split a BGR image into separate R/G/B single-channel arrays (T2.2)."""
    b, g, r = cv2.split(img)
    return {"r": r, "g": g, "b": b}
