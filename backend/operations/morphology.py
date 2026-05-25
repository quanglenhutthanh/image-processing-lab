"""Morphology (L8): dilate/erode/open/close with a chosen structuring element,
plus binary thresholding to prepare an image for morphology (FR-6.4).
"""

import cv2
import numpy as np

# shape id -> (cv2 morph constant, dims(k), constant name for the snippet)
_SHAPES = {
    "square": (cv2.MORPH_RECT, lambda k: (k, k), "cv2.MORPH_RECT"),
    "rect": (cv2.MORPH_RECT, lambda k: (k, max(1, k // 2)), "cv2.MORPH_RECT"),
    "ellipse": (cv2.MORPH_ELLIPSE, lambda k: (k, k), "cv2.MORPH_ELLIPSE"),
    "cross": (cv2.MORPH_CROSS, lambda k: (k, k), "cv2.MORPH_CROSS"),
}


def _meta(fn: str, snippet: str) -> dict:
    return {"lecture": "L8", "opencv_function": fn, "code_snippet": snippet}


def _kernel(params: dict) -> tuple[np.ndarray, str]:
    """Build the structuring element (T5.2) and the snippet line that makes it."""
    shape = params.get("shape", "square")
    k = max(1, int(params.get("ksize", 3)))
    morph, dims, const = _SHAPES.get(shape, _SHAPES["square"])
    w, h = dims(k)
    kernel = cv2.getStructuringElement(morph, (w, h))
    return kernel, f"se = cv2.getStructuringElement({const}, ({w}, {h}))"


def dilate(img, params):
    kernel, se = _kernel(params)
    return cv2.dilate(img, kernel), _meta("cv2.dilate", f"{se}\nout = cv2.dilate(img, se)")


def erode(img, params):
    kernel, se = _kernel(params)
    return cv2.erode(img, kernel), _meta("cv2.erode", f"{se}\nout = cv2.erode(img, se)")


def opening(img, params):
    kernel, se = _kernel(params)
    result = cv2.morphologyEx(img, cv2.MORPH_OPEN, kernel)
    return result, _meta("cv2.morphologyEx", f"{se}\nout = cv2.morphologyEx(img, cv2.MORPH_OPEN, se)")


def closing(img, params):
    kernel, se = _kernel(params)
    result = cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)
    return result, _meta("cv2.morphologyEx", f"{se}\nout = cv2.morphologyEx(img, cv2.MORPH_CLOSE, se)")


def threshold(img, params):
    """Binarize the image (T5.3, FR-6.4). Optional Otsu auto-threshold."""
    t = int(params.get("thresh", 127))
    use_otsu = bool(params.get("otsu", False))
    gray = img if img.ndim == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    flags = cv2.THRESH_BINARY | (cv2.THRESH_OTSU if use_otsu else 0)
    used_t, result = cv2.threshold(gray, t, 255, flags)
    pre = "gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n" if img.ndim == 3 else ""
    if use_otsu:
        snippet = pre + f"t, out = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)  # t={int(used_t)}"
    else:
        snippet = pre + f"_, out = cv2.threshold(gray, {t}, 255, cv2.THRESH_BINARY)"
    return result, _meta("cv2.threshold", snippet)
