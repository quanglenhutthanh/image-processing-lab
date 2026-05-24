"""Histogram computation (cv2.calcHist).

Used by the upload/process payload so the frontend always has a histogram to
render. Equalization / CLAHE are added in Phase 2.
"""

import cv2
import numpy as np

from schemas import Histogram


def _hist(img: np.ndarray, channel: int) -> list[int]:
    counts = cv2.calcHist([img], [channel], None, [256], [0, 256])
    return counts.flatten().astype(int).tolist()


def compute_histogram(img: np.ndarray) -> Histogram:
    if img.ndim == 2:
        return Histogram(gray=_hist(img, 0))
    return Histogram(b=_hist(img, 0), g=_hist(img, 1), r=_hist(img, 2))


def equalize(img: np.ndarray, params: dict) -> tuple[np.ndarray, dict]:
    """Global histogram equalization (L6, FR-4.3).

    Color images are equalized on the Y (luminance) channel so colors are kept.
    """
    if img.ndim == 2:
        result = cv2.equalizeHist(img)
        snippet = "out = cv2.equalizeHist(img)"
    else:
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
        result = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
        snippet = (
            "ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)\n"
            "ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])\n"
            "out = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)"
        )
    meta = {"lecture": "L6", "opencv_function": "cv2.equalizeHist", "code_snippet": snippet}
    return result, meta


def clahe(img: np.ndarray, params: dict) -> tuple[np.ndarray, dict]:
    """CLAHE — local adaptive equalization (L6, FR-4.4). Param: ``tile_size``."""
    clip = float(params.get("clip_limit", 2.0))
    tile = int(params.get("tile_size", 8))
    op = cv2.createCLAHE(clipLimit=clip, tileGridSize=(tile, tile))
    if img.ndim == 2:
        result = op.apply(img)
        snippet = (
            f"clahe = cv2.createCLAHE(clipLimit={clip}, tileGridSize=({tile}, {tile}))\n"
            "out = clahe.apply(img)"
        )
    else:
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        ycrcb[:, :, 0] = op.apply(ycrcb[:, :, 0])
        result = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
        snippet = (
            f"clahe = cv2.createCLAHE(clipLimit={clip}, tileGridSize=({tile}, {tile}))\n"
            "ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)\n"
            "ycrcb[:, :, 0] = clahe.apply(ycrcb[:, :, 0])\n"
            "out = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)"
        )
    meta = {"lecture": "L6", "opencv_function": "cv2.createCLAHE", "code_snippet": snippet}
    return result, meta
