# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An educational image-processing web app: a Python/FastAPI backend running **real
OpenCV**, and a React/Vite/TS/Tailwind frontend. Each operation is tied to a
course lecture (L2–L9) and exposes its OpenCV code. `prd.md` is the spec;
`PROGRESS.md` tracks phase status. All 7 phases are complete.

## Commands

Backend (port 8000):
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend (port 5173):
```bash
cd frontend
npm install
npm run dev        # dev server
npm run build      # tsc -b && vite build — this is the type-check gate
npm run lint       # eslint
```

There is **no automated test suite**. Verify the backend with FastAPI's
`TestClient` (run from `backend/` with the venv; `httpx` is already installed):
```bash
./.venv/bin/python -c "from fastapi.testclient import TestClient; from main import app; \
c=TestClient(app); print(c.post('/samples/cameraman').json()['image_id'])"
```
Verify the frontend by running `npm run build` (it type-checks).

## Architecture

### The operation registry — the core pattern
Almost every image feature is a single operation dispatched through
**`POST /process`** (`backend/routes/process.py`). To add a feature:

1. Write a handler in `backend/operations/<group>.py` with the signature
   `(img: np.ndarray, params: dict) -> (result: np.ndarray, meta: dict)`, where
   `meta = {"lecture", "opencv_function", "code_snippet"}`. The snippet is built
   **inline with the actual params** (there is no static snippets module).
2. Register it in the `OPERATIONS` dict in `routes/process.py`.
3. Add a control in `frontend/src/components/OperationPanel.tsx` that calls
   `onApply("<op>", { ...params })`.

Operation groups: `color.py` (L2), `arithmetic.py` (L5), `histogram.py` (L6),
`restoration.py` (L7), `morphology.py` (L8), `edges.py` (L9).

### `/process` is mutate-by-new-id
A handler reads the stored image, computes a result, and the route stores the
result under a **new** `image_id` and returns it. The original id stays valid,
which is what powers before/after comparison and undo. The frontend chains ops
from `current.image_id`; **undo works because every intermediate result persists**
in the in-memory store (`core/store.py`, process-lifetime only, no eviction).

Two-image ops (add_images, absdiff, bitwise_*) receive a second image: the route
pops `params["image_id2"]`, resolves it from the store, and injects
`params["second"]`. Handlers raise `ValueError` (the route maps it to HTTP 400)
when it's missing.

### The API contract must stay in sync
`backend/schemas.py` (Pydantic) and `frontend/src/types.ts` are mirrored **1:1**.
Change one → change the other. `core/payload.py::build_payload` assembles the
shared `ImagePayload` (base64 PNG + stats + histogram + default N×N matrix) used
by both `/upload` and `/process`.

### Image conventions
Images are stored as OpenCV arrays: grayscale = 2-D, color = **BGR** 3-D, uint8.
The `channels` field is 1 or 3. `image_base64` is a PNG **without** the
`data:` prefix — the frontend adds it via `api.ts::pngDataUrl`. Channel indexing
for the matrix/split: BGR order, mapped to r/g/b in `core/matrix.py`.

### Other endpoints
`/upload` (validate ext + ≤10MB, resize long edge ≤1024px), `/samples` +
`/samples/{id}` (sample images come from **scikit-image** `data.*`, not bundled
files — see `core/samples.py`), `/matrix/{id}` (re-fetch a region with different
N/channel without resending the image), `/channels/{id}` (cv2.split for the
ChannelView). CORS in `main.py` is restricted to the Vite dev origin.

## Conventions
- Operation handlers stay pure (NumPy/OpenCV only) — no FastAPI imports; the
  route translates errors and resolves the store.
- Color equalization/CLAHE operate on the YCrCb luminance channel to avoid color
  shifts; edges convert to grayscale first.
- Keep changes surgical and match existing style; the codebase favors small
  explicit functions over abstraction.
