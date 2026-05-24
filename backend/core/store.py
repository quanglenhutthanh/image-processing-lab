"""In-memory temporary image store (T1.1).

Maps an ``image_id`` to the working image (a NumPy array, grayscale 2-D or
BGR 3-D). Lives for the process lifetime only — no persistence (out of scope,
PRD §1.3).
"""

import uuid

import numpy as np

_images: dict[str, np.ndarray] = {}


def put(img: np.ndarray) -> str:
    image_id = uuid.uuid4().hex
    _images[image_id] = img
    return image_id


def get(image_id: str) -> np.ndarray | None:
    return _images.get(image_id)
