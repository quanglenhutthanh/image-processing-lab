"""Noise & restoration filters (L7).

All handlers follow the shared ``(img, params) -> (result, meta)`` contract.
Kernel sizes are forced odd. The Wiener deblur uses an *assumed* PSF (the true
PSF is unknown) — this is noted in the snippet (PRD §8).
"""

import cv2
import numpy as np
from skimage.restoration import wiener


def _meta(fn: str, snippet: str) -> dict:
    return {"lecture": "L7", "opencv_function": fn, "code_snippet": snippet}


def _odd(params: dict, default: int = 3) -> int:
    k = int(params.get("ksize", default))
    return k if k % 2 == 1 else k + 1


# ---- noise (T4.1) ----


def gaussian_noise(img, params):
    mean = float(params.get("mean", 0))
    sigma = float(params.get("sigma", 25))
    noise = np.random.normal(mean, sigma, img.shape)
    result = np.clip(img.astype(np.float64) + noise, 0, 255).astype(np.uint8)
    snippet = (
        f"noise = np.random.normal({mean}, {sigma}, img.shape)\n"
        "out = np.clip(img + noise, 0, 255).astype(np.uint8)"
    )
    return result, _meta("np.random.normal", snippet)


def salt_pepper_noise(img, params):
    amount = float(params.get("amount", 0.05))
    result = img.copy()
    rnd = np.random.random(img.shape[:2])
    result[rnd < amount / 2] = 0  # pepper
    result[rnd > 1 - amount / 2] = 255  # salt
    snippet = (
        "rnd = np.random.random(img.shape[:2])\n"
        f"img[rnd < {amount / 2}] = 0      # pepper\n"
        f"img[rnd > {1 - amount / 2}] = 255  # salt"
    )
    return result, _meta("np.random (mask)", snippet)


# ---- smoothing filters (T4.2) ----


def mean_filter(img, params):
    k = _odd(params)
    return cv2.blur(img, (k, k)), _meta("cv2.blur", f"out = cv2.blur(img, ({k}, {k}))")


def gaussian_blur(img, params):
    k = _odd(params)
    return cv2.GaussianBlur(img, (k, k), 0), _meta(
        "cv2.GaussianBlur", f"out = cv2.GaussianBlur(img, ({k}, {k}), 0)"
    )


def median_filter(img, params):
    k = _odd(params)
    return cv2.medianBlur(img, k), _meta("cv2.medianBlur", f"out = cv2.medianBlur(img, {k})")


# ---- order-statistic filters (T4.3) ----


def min_filter(img, params):
    k = _odd(params)
    kernel = np.ones((k, k), np.uint8)
    return cv2.erode(img, kernel), _meta(
        "cv2.erode", f"out = cv2.erode(img, np.ones(({k}, {k})))  # local min"
    )


def max_filter(img, params):
    k = _odd(params)
    kernel = np.ones((k, k), np.uint8)
    return cv2.dilate(img, kernel), _meta(
        "cv2.dilate", f"out = cv2.dilate(img, np.ones(({k}, {k})))  # local max"
    )


def midpoint_filter(img, params):
    k = _odd(params)
    kernel = np.ones((k, k), np.uint8)
    lo = cv2.erode(img, kernel).astype(np.float64)
    hi = cv2.dilate(img, kernel).astype(np.float64)
    result = ((lo + hi) / 2).astype(np.uint8)
    snippet = (
        f"lo = cv2.erode(img, np.ones(({k}, {k})))   # min\n"
        f"hi = cv2.dilate(img, np.ones(({k}, {k})))  # max\n"
        "out = ((lo + hi) / 2).astype(np.uint8)      # midpoint"
    )
    return result, _meta("cv2.erode + cv2.dilate", snippet)


# ---- Wiener deblur (T4.4) ----


def wiener_deblur(img, params):
    psf_size = int(params.get("psf_size", 5))
    balance = float(params.get("balance", 0.1))
    psf = np.ones((psf_size, psf_size)) / (psf_size**2)

    def deconv(channel: np.ndarray) -> np.ndarray:
        out = wiener(channel.astype(np.float64) / 255.0, psf, balance)
        return np.clip(out * 255, 0, 255).astype(np.uint8)

    if img.ndim == 2:
        result = deconv(img)
    else:
        result = cv2.merge([deconv(img[:, :, i]) for i in range(3)])
    snippet = (
        f"psf = np.ones(({psf_size}, {psf_size})) / {psf_size**2}  # assumed PSF\n"
        f"out = skimage.restoration.wiener(img / 255, psf, balance={balance})"
    )
    return result, _meta("skimage.restoration.wiener", snippet)
