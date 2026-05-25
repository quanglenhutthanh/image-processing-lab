# Image Processing Lab

Web app for learning image processing with real OpenCV. Upload an image (or pick
a sample), apply an operation, and see the result, the pixel matrix, the
histogram, and the exact OpenCV code side by side. Python/FastAPI backend +
React/Vite frontend. See [`prd.md`](./prd.md) for scope and roadmap.

## Features

Every operation runs real OpenCV on the backend and maps to a lecture (L#):

- **Representation (L2):** grayscale ↔ RGB, channel split, N×N pixel matrix
  (heatmap, before/after), min/max/mean/std stats.
- **Arithmetic & logic (L5):** scalar add/subtract/multiply/divide with
  **truncate vs normalize** overflow, two-image add/subtract/absdiff, AND/OR/XOR,
  negative.
- **Histogram (L6):** per-channel histograms, global equalization, CLAHE.
- **Restoration (L7):** Gaussian & salt-and-pepper noise; mean/Gaussian/median,
  min/max/midpoint filters; Wiener deblur.
- **Morphology (L8):** dilate/erode/opening/closing with a chosen structuring
  element (square/rect/ellipse/cross); binary threshold (+ Otsu).
- **Edges (L9):** Sobel (x/y/magnitude), Prewitt, Roberts, Canny, Laplacian, LoG.

Plus: undo/history, download the result, and a copy-able OpenCV code snippet for
the operation just applied.

## Run locally

### Backend (port 8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Check it: `curl http://localhost:8000/health` → `{"status":"ok","version":"1.0.0"}`

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the header shows `backend: connected` once it
reaches the API. The API base URL defaults to `http://localhost:8000` and can be
overridden with `VITE_API_BASE`.

## Layout

```
backend/    FastAPI app (main.py), schemas.py, routes/ operations/ core/ samples/
frontend/   Vite + React + TS + Tailwind (src/api.ts, src/types.ts, src/App.tsx)
```

The API contract lives in `backend/schemas.py` and is mirrored 1:1 in
`frontend/src/types.ts` — keep them in sync.
