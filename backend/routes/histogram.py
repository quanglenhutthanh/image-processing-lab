"""RGB channel split (GET /channels/{image_id}, T2.2 / T2.5).

The per-channel histograms are already part of the image payload; this endpoint
serves the three separate channel images for the ChannelView.
"""

from fastapi import APIRouter, HTTPException

from core import encode, store
from operations import color
from operations.histogram import compute_histogram
from schemas import ChannelImage, ChannelsResponse

router = APIRouter()


@router.get("/channels/{image_id}", response_model=ChannelsResponse)
def channels(image_id: str) -> ChannelsResponse:
    img = store.get(image_id)
    if img is None:
        raise HTTPException(404, "image_id not found.")
    if img.ndim != 3:
        raise HTTPException(400, "Channel split requires an RGB image.")
    parts = color.split_channels(img)
    return ChannelsResponse(
        channels=[
            ChannelImage(
                channel=c,
                image_base64=encode.encode_png_base64(parts[c]),
                histogram=compute_histogram(parts[c]),
            )
            for c in ("r", "g", "b")
        ]
    )
