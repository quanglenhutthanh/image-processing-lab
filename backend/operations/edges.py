"""Edge detection (L9).

Edges are computed on grayscale (color is converted first). Prewitt and Roberts
have no single OpenCV function, so they use ``cv2.filter2D`` with manual kernels
(PRD §8). Gradient results are normalized to 0-255 for display; Canny is already
binary.
"""

import cv2
import numpy as np

_PREWITT_X = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], np.float32)
_PREWITT_Y = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], np.float32)
_ROBERTS_X = np.array([[1, 0], [0, -1]], np.float32)
_ROBERTS_Y = np.array([[0, 1], [-1, 0]], np.float32)


def _meta(fn: str, snippet: str) -> dict:
    return {"lecture": "L9", "opencv_function": fn, "code_snippet": snippet}


def _gray(img: np.ndarray) -> np.ndarray:
    return img if img.ndim == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def _norm(arr: np.ndarray) -> np.ndarray:
    """|arr| normalized to 0-255 uint8."""
    return cv2.normalize(np.abs(arr), None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)


def _odd(params: dict, default: int = 3) -> int:
    k = int(params.get("ksize", default))
    return k if k % 2 == 1 else k + 1


def sobel(img, params):
    direction = params.get("direction", "magnitude")
    k = _odd(params)
    g = _gray(img)
    if direction == "x":
        out = cv2.Sobel(g, cv2.CV_64F, 1, 0, ksize=k)
        snippet = f"out = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize={k})"
    elif direction == "y":
        out = cv2.Sobel(g, cv2.CV_64F, 0, 1, ksize=k)
        snippet = f"out = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize={k})"
    else:
        gx = cv2.Sobel(g, cv2.CV_64F, 1, 0, ksize=k)
        gy = cv2.Sobel(g, cv2.CV_64F, 0, 1, ksize=k)
        out = cv2.magnitude(gx, gy)
        snippet = (
            f"gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize={k})\n"
            f"gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize={k})\n"
            "out = cv2.magnitude(gx, gy)"
        )
    return _norm(out), _meta("cv2.Sobel", snippet)


def prewitt(img, params):
    g = _gray(img).astype(np.float64)
    gx = cv2.filter2D(g, -1, _PREWITT_X)
    gy = cv2.filter2D(g, -1, _PREWITT_Y)
    snippet = (
        "kx = [[-1,0,1],[-1,0,1],[-1,0,1]]; ky = kx.T\n"
        "gx = cv2.filter2D(gray, -1, kx); gy = cv2.filter2D(gray, -1, ky)\n"
        "out = cv2.magnitude(gx, gy)"
    )
    return _norm(cv2.magnitude(gx, gy)), _meta("cv2.filter2D", snippet)


def roberts(img, params):
    g = _gray(img).astype(np.float64)
    gx = cv2.filter2D(g, -1, _ROBERTS_X)
    gy = cv2.filter2D(g, -1, _ROBERTS_Y)
    snippet = (
        "kx = [[1,0],[0,-1]]; ky = [[0,1],[-1,0]]\n"
        "gx = cv2.filter2D(gray, -1, kx); gy = cv2.filter2D(gray, -1, ky)\n"
        "out = cv2.magnitude(gx, gy)"
    )
    return _norm(cv2.magnitude(gx, gy)), _meta("cv2.filter2D", snippet)


def canny(img, params):
    low = int(params.get("low", 50))
    high = int(params.get("high", 150))
    sigma = float(params.get("sigma", 1.0))
    g = _gray(img)
    pre = ""
    if sigma > 0:
        g = cv2.GaussianBlur(g, (0, 0), sigma)
        pre = f"gray = cv2.GaussianBlur(gray, (0, 0), {sigma})\n"
    out = cv2.Canny(g, low, high)
    return out, _meta("cv2.Canny", pre + f"out = cv2.Canny(gray, {low}, {high})")


def laplacian(img, params):
    k = _odd(params)
    g = _gray(img)
    out = cv2.Laplacian(g, cv2.CV_64F, ksize=k)
    return _norm(out), _meta("cv2.Laplacian", f"out = cv2.Laplacian(gray, cv2.CV_64F, ksize={k})")


def log(img, params):
    sigma = float(params.get("sigma", 2.0))
    k = _odd(params)
    g = _gray(img)
    blurred = cv2.GaussianBlur(g, (0, 0), sigma)
    out = cv2.Laplacian(blurred, cv2.CV_64F, ksize=k)
    snippet = (
        f"blur = cv2.GaussianBlur(gray, (0, 0), {sigma})\n"
        f"out = cv2.Laplacian(blur, cv2.CV_64F, ksize={k})"
    )
    return _norm(out), _meta("cv2.Laplacian", snippet)
