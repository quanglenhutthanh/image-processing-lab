"""Built-in sample images (T1.4), sourced from scikit-image's bundled data.

These map onto the classics from the lectures (cameraman, coins, blobs) plus a
color image for the RGB-channel features.
"""

import cv2
import numpy as np
from skimage import data


def _cameraman() -> np.ndarray:
    return data.camera()


def _coins() -> np.ndarray:
    return data.coins()


def _blobs() -> np.ndarray:
    return (data.binary_blobs(length=256) * 255).astype(np.uint8)


def _astronaut() -> np.ndarray:
    return cv2.cvtColor(data.astronaut(), cv2.COLOR_RGB2BGR)


# id -> (display name, loader)
_SAMPLES = {
    "cameraman": ("Cameraman", _cameraman),
    "coins": ("Coins", _coins),
    "blobs": ("Blobs (binary)", _blobs),
    "astronaut": ("Astronaut (RGB)", _astronaut),
}


def list_samples() -> list[tuple[str, str, np.ndarray]]:
    return [(sid, name, loader()) for sid, (name, loader) in _SAMPLES.items()]


def load_sample(sample_id: str) -> np.ndarray | None:
    entry = _SAMPLES.get(sample_id)
    return entry[1]() if entry else None
