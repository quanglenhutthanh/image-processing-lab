"""Pixel-matrix extraction (T1.2) and image statistics (T1.3)."""

import cv2
import numpy as np

from schemas import Channel, ImageStats, PixelMatrix

_BGR_INDEX = {"b": 0, "g": 1, "r": 2}


def channel_data(img: np.ndarray, channel: Channel) -> np.ndarray:
    """Return the single-channel 2-D data for the requested channel.

    Grayscale images ignore ``channel``. For color images, ``"gray"`` is the
    luminance conversion and ``"r"``/``"g"``/``"b"`` pick that channel.
    """
    if img.ndim == 2:
        return img
    if channel == "gray":
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img[:, :, _BGR_INDEX[channel]]


def extract_matrix(
    img: np.ndarray, x: int, y: int, w: int, h: int, channel: Channel
) -> PixelMatrix:
    """Extract the 0-255 values of a region, clamped to image bounds."""
    effective: Channel = "gray" if img.ndim == 2 else channel
    data = channel_data(img, effective)
    H, W = data.shape[:2]
    x = max(0, min(x, W - 1))
    y = max(0, min(y, H - 1))
    w = max(1, min(w, W - x))
    h = max(1, min(h, H - y))
    region = data[y : y + h, x : x + w]
    return PixelMatrix(
        x=x,
        y=y,
        width=w,
        height=h,
        channel=effective,
        values=region.astype(int).tolist(),
    )


def compute_stats(img: np.ndarray) -> ImageStats:
    """Min/max/mean/std over all pixel values (FR-2.4)."""
    return ImageStats(
        min=float(img.min()),
        max=float(img.max()),
        mean=round(float(img.mean()), 2),
        std=round(float(img.std()), 2),
    )
