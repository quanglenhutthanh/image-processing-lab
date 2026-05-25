# Progress

Tracking against the phases in [`prd.md`](./prd.md).

| Phase | Scope | Status |
|---|---|---|
| 0 | Bootstrap | ✅ Done — 2026-05-24 |
| 1 | Image & matrix (core) | ✅ Done — 2026-05-24 |
| 2 | Histogram & RGB channels | ✅ Done — 2026-05-24 |
| 3 | Arithmetic & logic (L5) | ✅ Done — 2026-05-24 |
| 4 | Denoise & restoration (L7) | ✅ Done — 2026-05-24 |
| 5 | Morphology (L8) | ⬜ Not started |
| 6 | Edge detection (L9) | ⬜ Not started |
| 7 | Finishing | ⬜ Not started |

---

## Phase 0 — Bootstrap ✅ (2026-05-24)

- [x] **T0.1** Repo + directory structure (`git init`, `.gitignore`, layout per PRD §5.4)
- [x] **T0.2** Backend: FastAPI app, `GET /health`, CORS limited to the Vite origin, deps installed in `backend/.venv`
- [x] **T0.3** Frontend: Vite + React + TS + Tailwind v4, `App.tsx` calls `/health` on mount
- [x] **T0.4** API contract: `backend/schemas.py` (Pydantic) ↔ `frontend/src/types.ts`, mirrored 1:1

**Verified**
- `curl /health` → `200 {"status":"ok","version":"1.0.0"}`
- CORS preflight returns `access-control-allow-origin: http://localhost:5173`
- `npm run build` passes (tsc + vite); dev server serves HTTP 200

**Notes**
- First git commit not yet made (commit when ready):
  `git commit -m "Phase 0: bootstrap backend + frontend"`
- Point the editor's Python interpreter at `backend/.venv/bin/python` to clear
  Pylance import warnings on `main.py`.

## Phase 1 — Image & matrix ✅ (2026-05-24)

- [x] **T1.1** BE `/upload` — validate format/size (PNG/JPG/BMP/TIFF, ≤10MB), resize long edge ≤1024px, temp `store.py`, base64 PNG
- [x] **T1.2** BE N×N matrix extraction with channel selection (`core/matrix.py`) + `GET /matrix/{id}`
- [x] **T1.3** BE stats min/max/mean/std (`core/matrix.py`)
- [x] **T1.4** BE sample set from scikit-image (cameraman, coins, blobs, astronaut) + `GET /samples`, `POST /samples/{id}`
- [x] **T1.5** FE Uploader (drag & drop + sample picker with thumbnails)
- [x] **T1.6** FE PixelMatrix (heatmap grid, choose N, per-channel view for RGB)
- [x] **T1.7** FE ResultView before/after on Canvas
- [x] **T1.8** FE Grayscale/RGB toggle → `POST /process` (`cv2.cvtColor`)

**Endpoints added:** `POST /upload`, `GET /samples`, `POST /samples/{id}`,
`POST /process` (ops: `to_gray`, `to_rgb`), `GET /matrix/{id}`.

**Verified**
- TestClient e2e: upload (resize 800×1200→683×1024), bad-format→400, samples +
  thumbnails, sample load (coins=1ch), `to_gray`/`to_rgb` channel changes,
  unknown op→400, bad id→404, matrix channel selection (R/G/B), bad channel→422
- Frontend `npm run build` passes (tsc + vite)
- CORS verified for `/samples`, `/process` preflight, `/matrix` from the Vite origin

**Notes**
- Histogram is computed on upload (cv2.calcHist) to satisfy the payload contract.
- `httpx` was added to the venv for TestClient (test-only, not in requirements).
- (Updated in Phase 2) `/process` now stores its result under a **new** image_id
  and returns it, so the matrix/channel views reflect the processed image.

## Phase 2 — Histogram & RGB channels ✅ (2026-05-24)

- [x] **T2.1** BE histogram via `cv2.calcHist` (gray + each RGB channel) — `operations/histogram.py`
- [x] **T2.2** BE `cv2.split` → 3 channel images (`operations/color.split_channels`) + `GET /channels/{id}`
- [x] **T2.3** BE `cv2.equalizeHist` (global) + CLAHE (`tile_size` param); color images equalize the YCrCb Y channel
- [x] **T2.4** FE Histogram component (Recharts) — grayscale line / RGB overlay
- [x] **T2.5** FE ChannelView — R/G/B images side by side + per-channel histogram
- [x] **T2.6** FE Equalize/CLAHE buttons + before/after histogram comparison

**Endpoints added:** `GET /channels/{id}`. **Process ops added:** `equalize`, `clahe`.

**Verified**
- TestClient: channel split (r/g/b images + histograms), 400 on grayscale split,
  404 on bad id, equalize stores a new id, matrix of the equalized result differs
  from the original, CLAHE `tile_size` honored in snippet, gray/color paths
- Frontend `npm run build` passes (632 modules incl. Recharts)
- CORS verified for `/channels` from the Vite origin

**Decisions**
- `/process` now mutates-by-new-id; the frontend **chains** ops from the current
  image and offers **Reset** (current ← original) and **New image**.
- Color equalize/CLAHE operate on luminance (YCrCb Y) to avoid color shifts.
- Recharts pushes the bundle to ~571 kB; acceptable for a local demo tool.

## Phase 3 — Arithmetic & logic (L5) ✅ (2026-05-24)

- [x] **T3.1** BE scalar add/subtract/multiply/divide (`operations/arithmetic.py`)
- [x] **T3.2** BE overflow modes: `truncate` (np.clip) vs `normalize` (cv2.normalize)
- [x] **T3.3** BE two-image add/subtract/absdiff (second image via `image_id2`)
- [x] **T3.4** BE logic AND/OR/XOR + negative (`cv2.bitwise_*`)
- [x] **T3.5** FE OperationPanel — scalar op buttons + value slider + truncate/normalize toggle
- [x] **T3.6** FE before/after pixel-matrix comparison (shared N/channel controls)

**Process ops added:** `add`, `subtract`, `multiply`, `divide`, `negative`,
`add_images`, `subtract_images`, `absdiff`, `bitwise_and`, `bitwise_or`, `bitwise_xor`.

**Verified**
- TestClient: truncate vs normalize visibly differ (add+100 → `[100..105]` clipped
  vs rescaled), sub/mul/div, negative, two-image add (saturates to 255) + absdiff,
  logic ops, errors (no second→400, bad id2→404)
- HTTP+CORS: two-image absdiff of two samples, scalar normalize snippet
- Frontend `npm run build` passes (633 modules)

**Decisions**
- The temporary toolbar from Phase 1/2 was consolidated into a proper
  **OperationPanel** (PRD component) grouped by lecture (Representation/L2,
  Point arithmetic/L5, Histogram/L6, Two-image/L5). New image + Reset stay in a
  slim toolbar.
- Second image is resolved server-side: the route pops `image_id2` from params,
  fetches it from the store, and injects `params["second"]`; operations raise
  `ValueError` (→ 400) when it's missing.
- Two-image ops auto-match the second image's size/channels to the first.

## MVP milestone reached ✅
Upload → matrix → RGB/channels → histogram → arithmetic (PRD §7). Remaining:
Phase 4 (restoration), 5 (morphology), 6 (edges), 7 (snippets/download/README).

## Phase 4 — Denoise & restoration (L7) ✅ (2026-05-24)

- [x] **T4.1** BE Gaussian noise (mean/sigma) + salt & pepper (density) — `operations/restoration.py`
- [x] **T4.2** BE mean (`cv2.blur`), Gaussian (`cv2.GaussianBlur`), median (`cv2.medianBlur`); odd kernel enforced
- [x] **T4.3** BE min (`cv2.erode`), max (`cv2.dilate`), midpoint order-statistic filters
- [x] **T4.4** BE Wiener deblur (`skimage.restoration.wiener`, assumed PSF; per-channel for color)
- [x] **T4.5** FE Restoration + Filters sections in OperationPanel (noise sliders, filter selector + kernel slider, Wiener)

**Process ops added:** `gaussian_noise`, `salt_pepper_noise`, `mean_filter`,
`gaussian_blur`, `median_filter`, `min_filter`, `max_filter`, `midpoint_filter`, `wiener_deblur`.

**Verified (TestClient)**
- Gaussian noise std 0→30 (matches sigma); S&P injects 0/255
- L7 point: on S&P, **median std 1.4 vs mean 13.39** (median wins); Gaussian
  blur cuts Gaussian-noise std 30→8
- min/max/midpoint map to erode/dilate; even kernel (4) forced to 5
- Wiener works on grayscale (1ch) and color (3ch); "assumed PSF" noted in snippet
- Frontend `npm run build` passes

**Notes**
- Wiener uses an assumed flat PSF (true PSF unknown) — flagged in the snippet and
  with an "(assumed PSF)" hint in the UI (PRD §8).
- Noise is freshly randomized each click (no seed) so repeated clicks differ.

## Next up — Phase 5 (Morphology, L8)
- BE: dilate/erode/open/close, structuring element (square/rect/ellipse/cross +
  size), binary threshold (`operations/morphology.py`)
- FE: Morphology panel (SE shape + size)
