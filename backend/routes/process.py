"""Apply one processing operation to a stored image (POST /process).

The operation registry grows each phase. Each handler has the signature
``(img, params) -> (result, meta)``. Two-image ops (L5) read the resolved second
image from ``params["second"]`` — the route resolves ``image_id2`` for them.
The result is stored under a new id so the matrix / channel views reflect it.
"""

from fastapi import APIRouter, HTTPException

from core import store
from core.payload import build_payload
from operations import arithmetic, color, histogram
from schemas import ProcessRequest, ProcessResponse

router = APIRouter()

OPERATIONS = {
    "to_gray": color.to_gray,
    "to_rgb": color.to_rgb,
    "equalize": histogram.equalize,
    "clahe": histogram.clahe,
    "add": arithmetic.add,
    "subtract": arithmetic.subtract,
    "multiply": arithmetic.multiply,
    "divide": arithmetic.divide,
    "negative": arithmetic.negative,
    "add_images": arithmetic.add_images,
    "subtract_images": arithmetic.subtract_images,
    "absdiff": arithmetic.absdiff,
    "bitwise_and": arithmetic.bitwise_and,
    "bitwise_or": arithmetic.bitwise_or,
    "bitwise_xor": arithmetic.bitwise_xor,
}


@router.post("/process", response_model=ProcessResponse)
def process(req: ProcessRequest) -> ProcessResponse:
    img = store.get(req.image_id)
    if img is None:
        raise HTTPException(404, "image_id not found.")
    handler = OPERATIONS.get(req.operation)
    if handler is None:
        raise HTTPException(400, f"Unknown operation '{req.operation}'.")

    params = dict(req.params)
    image_id2 = params.pop("image_id2", None)
    if image_id2 is not None:
        img2 = store.get(image_id2)
        if img2 is None:
            raise HTTPException(404, "Second image_id not found.")
        params["second"] = img2

    try:
        result, meta = handler(img, params)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    new_id = store.put(result)
    payload = build_payload(new_id, result)
    return ProcessResponse(
        **payload.model_dump(),
        operation=req.operation,
        lecture=meta["lecture"],
        opencv_function=meta["opencv_function"],
        code_snippet=meta["code_snippet"],
    )
