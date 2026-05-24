"""Shared request/response schema (T0.4).

These Pydantic models are the API contract. They are mirrored 1:1 by
`frontend/src/types.ts`; keep the two files in sync when either changes.
"""

from typing import Literal

from pydantic import BaseModel, Field

Channel = Literal["gray", "r", "g", "b"]


class HealthResponse(BaseModel):
    status: str
    version: str


class ImageStats(BaseModel):
    min: float
    max: float
    mean: float
    std: float


class Histogram(BaseModel):
    """256-bin counts. `gray` is set for grayscale images; `r`/`g`/`b` for RGB."""

    bins: int = 256
    gray: list[int] | None = None
    r: list[int] | None = None
    g: list[int] | None = None
    b: list[int] | None = None


class PixelMatrix(BaseModel):
    """The 0-255 values of a viewed region, top-left origin at (x, y)."""

    x: int
    y: int
    width: int
    height: int
    channel: Channel
    values: list[list[int]]


class ImagePayload(BaseModel):
    """Everything the frontend needs to render an image and its analysis."""

    image_id: str
    image_base64: str  # PNG bytes, base64-encoded (no `data:` prefix)
    width: int
    height: int
    channels: int  # 1 = grayscale, 3 = RGB
    stats: ImageStats
    histogram: Histogram
    matrix: PixelMatrix


class UploadResponse(ImagePayload):
    resized: bool  # True if downscaled to a long edge <= 1024px (FR-1.3)
    original_width: int
    original_height: int


class ProcessRequest(BaseModel):
    image_id: str
    operation: str
    params: dict = Field(default_factory=dict)


class ProcessResponse(ImagePayload):
    operation: str
    lecture: str  # e.g. "L5"
    opencv_function: str  # e.g. "cv2.add"
    code_snippet: str


class SampleInfo(BaseModel):
    id: str
    name: str
    thumbnail_base64: str


class ChannelImage(BaseModel):
    channel: Literal["r", "g", "b"]
    image_base64: str  # the single channel as a grayscale PNG
    histogram: Histogram


class ChannelsResponse(BaseModel):
    channels: list[ChannelImage]
