"""Arithmetic & logic operations (L5).

Scalar ops take ``value`` and an overflow ``mode`` (``truncate`` clips, the
default; ``normalize`` rescales) — the truncate-vs-normalize contrast is the key
academic point of L5 (PRD §8). Two-image and logic ops read the resolved second
image from ``params["second"]`` (the route resolves ``image_id2``).
"""

import cv2
import numpy as np


def _meta(fn: str, snippet: str) -> dict:
    return {"lecture": "L5", "opencv_function": fn, "code_snippet": snippet}


def _overflow(raw: np.ndarray, mode: str) -> np.ndarray:
    """Map an out-of-range result back to uint8 0-255 (FR-3.4)."""
    if mode == "normalize":
        return cv2.normalize(raw, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return np.clip(raw, 0, 255).astype(np.uint8)


# ---- scalar operations (params: value, mode) ----


def _scalar(img: np.ndarray, params: dict, symbol: str, cv_fn: str):
    value = float(params.get("value", 0))
    mode = params.get("mode", "truncate")
    a = img.astype(np.float64)
    raw = {
        "+": a + value,
        "-": a - value,
        "*": a * value,
        "/": a / (value if value != 0 else 1e-9),
    }[symbol]
    result = _overflow(raw, mode)
    if mode == "normalize":
        snippet = (
            f"raw = img.astype(np.float64) {symbol} {value}\n"
            "result = cv2.normalize(raw, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)"
        )
    else:
        snippet = f"result = {cv_fn}(img, {value})  # saturating (truncate)"
    return result, _meta(cv_fn, snippet)


def add(img, params):
    return _scalar(img, params, "+", "cv2.add")


def subtract(img, params):
    return _scalar(img, params, "-", "cv2.subtract")


def multiply(img, params):
    return _scalar(img, params, "*", "cv2.multiply")


def divide(img, params):
    return _scalar(img, params, "/", "cv2.divide")


def negative(img, params):
    """Complement / logical NOT (FR-3.5, FR-3.6)."""
    return cv2.bitwise_not(img), _meta("cv2.bitwise_not", "result = cv2.bitwise_not(img)  # 255 - img")


# ---- two-image operations (params: second) ----


def _second(params: dict) -> np.ndarray:
    b = params.get("second")
    if b is None:
        raise ValueError("This operation needs a second image (image_id2).")
    return b


def _match(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Resize/convert the second image to match the first's size and channels."""
    if b.shape[:2] != a.shape[:2]:
        b = cv2.resize(b, (a.shape[1], a.shape[0]))
    if a.ndim == 3 and b.ndim == 2:
        b = cv2.cvtColor(b, cv2.COLOR_GRAY2BGR)
    elif a.ndim == 2 and b.ndim == 3:
        b = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    return b


def _two_image(img, params, cv_call, fn: str):
    b = _match(img, _second(params))
    return cv_call(img, b), _meta(fn, f"result = {fn}(img, img2)")


def add_images(img, params):
    return _two_image(img, params, cv2.add, "cv2.add")


def subtract_images(img, params):
    return _two_image(img, params, cv2.subtract, "cv2.subtract")


def absdiff(img, params):
    return _two_image(img, params, cv2.absdiff, "cv2.absdiff")


def bitwise_and(img, params):
    return _two_image(img, params, cv2.bitwise_and, "cv2.bitwise_and")


def bitwise_or(img, params):
    return _two_image(img, params, cv2.bitwise_or, "cv2.bitwise_or")


def bitwise_xor(img, params):
    return _two_image(img, params, cv2.bitwise_xor, "cv2.bitwise_xor")
