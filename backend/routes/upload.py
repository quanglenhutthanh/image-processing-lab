"""Image input: upload a file or load a built-in sample (FR-1, T1.1, T1.4)."""

import os

from fastapi import APIRouter, File, HTTPException, UploadFile

from core import encode, samples, store
from core.payload import build_payload
from schemas import SampleInfo, UploadResponse

router = APIRouter()

ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
MAX_BYTES = 10 * 1024 * 1024  # 10MB (FR-1.1)
THUMB_EDGE = 128


def _store_and_build(img) -> UploadResponse:
    original_h, original_w = img.shape[:2]
    img, resized = encode.resize_max(img)
    image_id = store.put(img)
    payload = build_payload(image_id, img)
    return UploadResponse(
        **payload.model_dump(),
        resized=resized,
        original_width=original_w,
        original_height=original_h,
    )


@router.post("/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...)) -> UploadResponse:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Unsupported format '{ext}'. Allowed: PNG, JPG, BMP, TIFF.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "File too large (max 10MB).")
    img = encode.decode_image(data)
    if img is None:
        raise HTTPException(400, "Could not decode image.")
    return _store_and_build(img)


@router.get("/samples", response_model=list[SampleInfo])
def get_samples() -> list[SampleInfo]:
    out = []
    for sid, name, img in samples.list_samples():
        thumb, _ = encode.resize_max(img, THUMB_EDGE)
        out.append(
            SampleInfo(id=sid, name=name, thumbnail_base64=encode.encode_png_base64(thumb))
        )
    return out


@router.post("/samples/{sample_id}", response_model=UploadResponse)
def load_sample(sample_id: str) -> UploadResponse:
    img = samples.load_sample(sample_id)
    if img is None:
        raise HTTPException(404, "Sample not found.")
    return _store_and_build(img)
