"""Fetch the pixel matrix of a region (GET /matrix/{image_id}).

Lets the frontend re-request the matrix when N or the channel changes, without
resending the whole image (PRD §8 — transmit only the viewed region).
"""

from fastapi import APIRouter, HTTPException

from core import matrix, store
from schemas import Channel, PixelMatrix

router = APIRouter()


@router.get("/matrix/{image_id}", response_model=PixelMatrix)
def get_matrix(
    image_id: str,
    x: int = 0,
    y: int = 0,
    n: int = 10,
    channel: Channel = "gray",
) -> PixelMatrix:
    img = store.get(image_id)
    if img is None:
        raise HTTPException(404, "image_id not found.")
    return matrix.extract_matrix(img, x, y, n, n, channel)
