# Progress

Tracking against the phases in [`prd.md`](./prd.md).

| Phase | Scope | Status |
|---|---|---|
| 0 | Bootstrap | ✅ Done — 2026-05-24 |
| 1 | Image & matrix (core) | ✅ Done — 2026-05-24 |
| 2 | Histogram & RGB channels | ✅ Done — 2026-05-24 |
| 3 | Arithmetic & logic (L5) | ✅ Done — 2026-05-24 |
| 4 | Denoise & restoration (L7) | ✅ Done — 2026-05-24 |
| 5 | Morphology (L8) | ✅ Done — 2026-05-25 |
| 6 | Edge detection (L9) | ✅ Done — 2026-05-25 |
| 7 | Finishing | ✅ Done — 2026-05-25 |

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

## Phase 5 — Morphology (L8) ✅ (2026-05-25)

- [x] **T5.1** BE dilate/erode/opening/closing (`operations/morphology.py`)
- [x] **T5.2** BE `cv2.getStructuringElement` — square/rect/ellipse/cross + size
- [x] **T5.3** BE binary threshold (`cv2.threshold`, optional Otsu)
- [x] **T5.4** FE Morphology section (SE shape + size + 4 ops) and Threshold section (slider + Otsu)

**Process ops added:** `dilate`, `erode`, `opening`, `closing`, `threshold`.

**Verified (TestClient)**
- Dilate grows white px (397→493), erode shrinks (→308); open/close via `morphologyEx`
- SE shapes give distinct kernels: square (5×5), rect (5×2), ellipse/cross use
  `MORPH_ELLIPSE`/`MORPH_CROSS`
- Threshold → binary {0,255}; Otsu on a color image auto-picks t=100 (and grays first)
- Frontend `npm run build` passes

**Notes**
- `rect` is intentionally non-square (w × w⁄2) so the anisotropic SE is visible
  next to `square`.
- Morphology ops keep separate keys from restoration's min/max (which also use
  erode/dilate but with a plain box kernel) — different semantics, different ops.
- The `blobs` sample (binary) is the natural image for demoing morphology.

## Phase 6 — Edge detection (L9) ✅ (2026-05-25)

- [x] **T6.1** BE Sobel (x/y/magnitude); Prewitt & Roberts via `cv2.filter2D` manual kernels
- [x] **T6.2** BE Canny (low/high thresholds + optional Gaussian pre-blur by σ)
- [x] **T6.3** BE Laplacian and LoG (Gaussian → Laplacian) — `operations/edges.py`
- [x] **T6.4** FE Edges section (Sobel direction + Prewitt/Roberts/Laplacian/LoG) and Canny section (low/high/σ)

**Process ops added:** `sobel`, `prewitt`, `roberts`, `canny`, `laplacian`, `log`.
**Total registered ops: 35.**

**Verified**
- TestClient: all operators return single-channel L9 results; color input
  auto-grays; Canny output strictly {0,255}; Prewitt/Roberts snippets use `filter2D`
- HTTP+CORS (urllib): canny + sobel return 200 with ACAO header
- Frontend `npm run build` passes

**Notes**
- Edges run on grayscale (color converted first); gradient magnitudes are
  normalized to 0-255 for display, Canny is already binary.
- Prewitt/Roberts use manual kernels (no single OpenCV function) per PRD §8.

## Full v1 milestone reached ✅
All feature phases (1-6) complete: representation, arithmetic/logic, histogram/
channels, restoration, morphology, edges. Remaining: **Phase 7 (finishing)** —
code-snippet UI, result download, README, end-to-end polish.

## Phase 7 — Finishing ✅ (2026-05-25)

- [x] **T7.1** OpenCV code per op — kept **inline/dynamic** (real params), not a
  static `core/snippets.py` (a static module would duplicate and lose accuracy)
- [x] **T7.2** FE CodeSnippet component (lecture badge + fn name + copy button)
- [x] **T7.3** FE Download result (data-URL `<a download>`)
- [x] **T7.4** FE undo/history (past-state stack + operation trail) — nice-to-have
- [x] **T7.5** README features + run instructions
- [x] **T7.6** End-to-end test of all operations + UI polish

**Verified**
- E2E: all **35 ops × {color, grayscale} = 70 calls** return 200; no crashes
- Error handling (DoD #4): unknown op→400, bad id→404, missing 2nd image→400,
  bad upload ext→400, channels-on-gray→400, bad matrix channel→422
- Full stack: backend `/health` 200, frontend `/` 200, `/samples` = 4
- Frontend `npm run build` passes

**Decision**
- T7.1: no `core/snippets.py`. Each operation already returns a `code_snippet`
  built with the actual parameter values used (e.g. `cv2.GaussianBlur(img, (5, 5), 0)`),
  which is more accurate than a static template. The PRD §5.4 file is "proposed".

## 🎉 Project complete — all phases (0-7) done
Definition of Done (PRD §7) met: backend returns correct OpenCV result + matrix +
histogram + stats; frontend shows before/after + matrix + histogram; lecture
label + OpenCV snippet shown; bad inputs handled without crashing.
