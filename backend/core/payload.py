"""Assemble the shared ImagePayload (base64 + stats + histogram + matrix)."""

import numpy as np

from core import encode, matrix
from operations.histogram import compute_histogram
from schemas import Channel, ImagePayload

DEFAULT_N = 10  # default top-left N×N matrix region (FR-2.1)


def build_payload(
    image_id: str,
    img: np.ndarray,
    n: int = DEFAULT_N,
    channel: Channel = "gray",
) -> ImagePayload:
    return ImagePayload(
        image_id=image_id,
        image_base64=encode.encode_png_base64(img),
        width=img.shape[1],
        height=img.shape[0],
        channels=1 if img.ndim == 2 else img.shape[2],
        stats=matrix.compute_stats(img),
        histogram=compute_histogram(img),
        matrix=matrix.extract_matrix(img, 0, 0, n, n, channel),
    )
