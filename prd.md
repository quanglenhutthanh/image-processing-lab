# PRD — Image Processing Lab (Web app simulating image processing with OpenCV)

> **Version:** 1.0  
> **Architecture:** Option A — Python Backend + FastAPI + real OpenCV, React/Vite Frontend  
> **Context:** Digital Image & Video Processing course project (International University, VNU-HCMC)  
> **Date:** 2026

---

## 1. Overview & Goals

### 1.1 Problem
Students learning image processing usually only see MATLAB code in lecture slides without being able to "touch" how each operation affects the actual pixel matrix. We need a visual web tool to upload an image, apply OpenCV processing operations, and **simultaneously see** the result image + pixel matrix + how the histogram changes.

### 1.2 Product goals
- Allow uploading an image and **displaying the pixel matrix** (values 0–255).
- Perform **arithmetic operations** (add/subtract/multiply/divide, logic) on the image matrix, with overflow/underflow handling.
- Provide **advanced operations**: denoise, deblur, dilation, erosion, opening, closing, edge detection.
- **Histogram** before/after each operation, including histogram equalization.
- **Split & display the 3 RGB channels separately** along with per-channel histograms.
- Every operation uses **real OpenCV** on the backend → maps 1-to-1 with the MATLAB IPT functions taught in lectures.

### 1.3 Out of scope (Non-goals — version 1.0)
- Video processing (Part II) — reserved for v2.
- User accounts, saving history to the cloud.
- Processing very high-resolution images (capped at ~1024px on the long edge for smooth demos).
- Production deployment with scaling — local run / demo is sufficient.

### 1.4 Target users
Students and instructors of the image processing course. Educational clarity is prioritized over speed.

---

## 2. Feature ↔ lecture ↔ OpenCV function mapping

| Group | Feature | Lecture | OpenCV / NumPy function | MATLAB equivalent |
|---|---|---|---|---|
| Representation | Display pixel matrix | L2, L11 | `np.array` slicing | — |
| Representation | Grayscale / RGB, split 3 channels | L2, L11 | `cv2.cvtColor`, `cv2.split` | `rgb2gray` |
| Arithmetic | Image & scalar add/subtract | L5 | `cv2.add`, `cv2.subtract`, `cv2.absdiff` | `imadd`, `imsubtract`, `imabsdiff` |
| Arithmetic | Scalar multiply/divide (brightness) | L5 | `cv2.multiply`, `cv2.divide`, `cv2.convertScaleAbs` | `immultiply`, `imdivide` |
| Arithmetic | Overflow: truncate vs normalize | L5 | `np.clip` / `cv2.normalize` | — |
| Logic | AND/OR/XOR/NOT | L5 | `cv2.bitwise_and/or/xor/not` | `bitand`, `bitor`, `bitxor`, `bitcmp` |
| Histogram | Compute & plot histogram | L6 | `cv2.calcHist` | `imhist` |
| Histogram | Equalization | L6 | `cv2.equalizeHist`, `cv2.createCLAHE` | `histeq`, `adapthisteq` |
| Histogram | Gray-level transform (log, gamma, negative, stretch) | L6 | `np.log`, power-law, `cv2.normalize` | — |
| Restoration | Add noise (Gaussian, S&P) | L7 | `np.random` + mask | `imnoise` |
| Restoration | Mean / Gaussian / Median filter | L7 | `cv2.blur`, `cv2.GaussianBlur`, `cv2.medianBlur` | `imfilter`, `medfilt2` |
| Restoration | Min/Max/Midpoint order-statistic | L7 | `cv2.erode/dilate` trick, `cv2.dilate` | `ordfilt2`, `nlfilter` |
| Restoration | Deblur (Wiener / constrained division) | L7 | `scikit-image restoration.wiener` | `deconvwnr` |
| Morphology | Dilate / Erode | L8 | `cv2.dilate`, `cv2.erode` | `imdilate`, `imerode` |
| Morphology | Opening / Closing | L8 | `cv2.morphologyEx` | `imopen`, `imclose` |
| Morphology | Structuring element (shape + size) | L8 | `cv2.getStructuringElement` | `strel` |
| Edge | Sobel / Prewitt / Roberts | L9 | `cv2.Sobel`, `filter2D` | `edge('sobel'/'prewitt'/'roberts')` |
| Edge | Canny | L9 | `cv2.Canny` | `edge('canny')` |
| Edge | Laplacian of Gaussian | L9 | `cv2.Laplacian` + Gaussian | `edge('log')` |

---

## 3. Functional Requirements

### FR-1 — Image management
- **FR-1.1** Upload an image (PNG/JPG/BMP/TIFF), max 10MB.
- **FR-1.2** Built-in sample images (cameraman, coins, blobs… or equivalents) for quick testing.
- **FR-1.3** Auto-resize oversized images to a long edge ≤ 1024px (keep aspect ratio), notify the user.
- **FR-1.4** Convert Grayscale ↔ RGB.
- **FR-1.5** Reset to the original image at any time.

### FR-2 — Pixel matrix display
- **FR-2.1** Display the 0–255 value matrix for an image region (default top-left N×N, N configurable).
- **FR-2.2** Color cell backgrounds by brightness (heatmap) for readability.
- **FR-2.3** For RGB: allow viewing the matrix of the R, G, B channel, or grayscale.
- **FR-2.4** Show statistics: min, max, mean, std of the current image.
- **FR-2.5** (Nice to have) allow panning/selecting an image region to view its matrix.

### FR-3 — Arithmetic & logic operations (L5)
- **FR-3.1** Add/subtract a constant (additive offset) via slider.
- **FR-3.2** Multiply/divide by a constant (multiplicative scaling).
- **FR-3.3** Add/subtract/absdiff between two images (upload a second image).
- **FR-3.4** Choose overflow handling mode: **truncate** vs **normalize**, with a visible difference.
- **FR-3.5** Negative/complement.
- **FR-3.6** Logic operations AND/OR/XOR/NOT (especially with binary images / masks).

### FR-4 — Histogram (L6) ⭐ new feature
- **FR-4.1** Display the histogram of the current image (256 bins).
- **FR-4.2** For RGB: display **3 overlaid histograms** (R/G/B) or split separately.
- **FR-4.3** Histogram equalization (global) — compare before/after.
- **FR-4.4** CLAHE (local equalization) with a tile-size parameter.
- **FR-4.5** Gray-level transforms: negative, log, gamma (power-law), contrast stretching — with the transformation curve T(r) plotted.

### FR-5 — Denoise & restoration (L7)
- **FR-5.1** Add Gaussian noise (choose mean, variance).
- **FR-5.2** Add salt & pepper noise (choose density).
- **FR-5.3** Mean filter, Gaussian blur, Median filter — choose kernel size.
- **FR-5.4** Min/Max/Midpoint order-statistic filter.
- **FR-5.5** Deblur (Wiener) — for blurred images.

### FR-6 — Morphology (L8)
- **FR-6.1** Dilate, Erode.
- **FR-6.2** Opening, Closing.
- **FR-6.3** Choose structuring element: square, rectangle, ellipse/disk, cross — and its size.
- **FR-6.4** (Nice to have) threshold the image to binary before applying morphology.

### FR-7 — Edge detection (L9)
- **FR-7.1** Sobel (x, y, magnitude).
- **FR-7.2** Prewitt, Roberts.
- **FR-7.3** Canny — choose 2 thresholds (low/high) and sigma.
- **FR-7.4** Laplacian / LoG.

### FR-8 — Result UI
- **FR-8.1** Display the original image and the result image side by side.
- **FR-8.2** Lecture label + OpenCV function name for each operation (educational value).
- **FR-8.3** Display the OpenCV code corresponding to the operation just applied (snippet).
- **FR-8.4** Download the result image.
- **FR-8.5** (Nice to have) pipeline: apply multiple operations in sequence, with history & undo.

---

## 4. Non-Functional Requirements

- **NFR-1 Performance:** each processing operation responds in < 1.5s for images ≤ 1024px.
- **NFR-2 Educational:** prioritize clarity, always show the function name + lecture.
- **NFR-3 Local runnable:** one command to start the backend, one for the frontend; include a README.
- **NFR-4 Browsers:** recent Chrome/Edge/Firefox.
- **NFR-5 Security:** validate file format & size; CORS restricted to the frontend dev origin.
- **NFR-6 Maintainability:** each operation group is a separate backend module, easy to add new operations.

---

## 5. Technical architecture

### 5.1 Tech stack
- **Backend:** Python 3.11+, FastAPI, Uvicorn, `opencv-python`, `numpy`, `scikit-image`, `Pillow`, `python-multipart`.
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, Recharts (histogram), Canvas API (image + matrix), Axios.

### 5.2 Data flow
1. Frontend uploads an image → backend stores it temporarily, returns `image_id` + base64 image + pixel matrix + histogram + stats.
2. The user picks an operation + parameters → frontend calls `POST /process` with `image_id`, `operation`, `params`.
3. Backend applies `cv2`, returns the result image (base64), the viewed-region matrix, the new histogram, stats, and a code snippet.
4. Frontend renders before/after + matrix + histogram.

### 5.3 API endpoints (proposed)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload an image, return metadata + base64 + matrix + histogram |
| `GET` | `/samples` | List of sample images |
| `POST` | `/process` | Apply one processing operation to `image_id` |
| `POST` | `/process/chain` | (Nice to have) apply a sequence of operations |
| `GET` | `/matrix/{image_id}` | Get the matrix of a region (x,y,w,h) |
| `GET` | `/histogram/{image_id}` | Get the histogram (mode: gray/rgb) |
| `GET` | `/download/{image_id}` | Download the result image |

### 5.4 Directory structure
```
image-processing-lab/
├── backend/
│   ├── main.py
│   ├── routes/        upload.py, process.py, histogram.py
│   ├── operations/    arithmetic.py, histogram.py, restoration.py,
│   │                  morphology.py, edges.py, transforms.py
│   ├── core/          store.py (temp image store), encode.py, snippets.py
│   ├── samples/       sample images
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/ Uploader, PixelMatrix, Histogram, ChannelView,
    │   │               OperationPanel, ResultView, CodeSnippet
    │   ├── api.ts, types.ts, App.tsx
    └── package.json
```

---

## 6. Task breakdown (by sprint/phase)

### ✅ Phase 0 — Bootstrap (½ day) — **DONE**
- [x] **T0.1** Create repo + backend/frontend directory structure.
- [x] **T0.2** Backend: initialize FastAPI, install deps, `/health` route, enable CORS.
- [x] **T0.3** Frontend: scaffold Vite + React + TS + Tailwind, successfully call `/health`.
- [x] **T0.4** Agree on the request/response schema (`types.ts` ↔ Pydantic models).

### ✅ Phase 1 — Image & matrix (core, ~1.5 days) — **DONE**
- [x] **T1.1** BE: `/upload` — receive file, validate, resize, store temporarily (`store.py`), return base64.
- [x] **T1.2** BE: function to extract the N×N pixel matrix of a region (`core/matrix`).
- [x] **T1.3** BE: compute stats (min/max/mean/std).
- [x] **T1.4** BE: sample image set + `/samples`.
- [x] **T1.5** FE: Uploader component (drag & drop + sample picker).
- [x] **T1.6** FE: PixelMatrix component (heatmap grid, choose N).
- [x] **T1.7** FE: ResultView before/after (Canvas).
- [x] **T1.8** FE: Grayscale/RGB toggle → call BE `cv2.cvtColor`.

### ✅ Phase 2 — Histogram & RGB channels (~1 day) ⭐ — **DONE**
- [x] **T2.1** BE: `cv2.calcHist` for grayscale and each RGB channel (`operations/histogram.py`).
- [x] **T2.2** BE: `cv2.split` returns the 3 separate channel images (R/G/B).
- [x] **T2.3** BE: `cv2.equalizeHist` + CLAHE.
- [x] **T2.4** FE: Histogram component (Recharts) — grayscale + RGB overlay/split.
- [x] **T2.5** FE: ChannelView component — display the 3 channels side by side + per-channel histogram.
- [x] **T2.6** FE: equalize button + before/after histogram comparison.

### ✅ Phase 3 — Arithmetic & logic (L5, ~1 day) — **DONE**
- [x] **T3.1** BE: `operations/arithmetic.py` — scalar add/subtract/multiply/divide.
- [x] **T3.2** BE: truncate mode (`np.clip`) vs normalize mode (`cv2.normalize`).
- [x] **T3.3** BE: operations between 2 images (add/subtract/absdiff) — support second image upload.
- [x] **T3.4** BE: logic ops + negative.
- [x] **T3.5** FE: OperationPanel Arithmetic group (slider + overflow toggle).
- [x] **T3.6** FE: display before/after matrix to see the numbers change.

### ✅ Phase 4 — Denoise & restoration (L7, ~1.5 days) — **DONE**
- [x] **T4.1** BE: add Gaussian & S&P noise (`operations/restoration.py`).
- [x] **T4.2** BE: mean/Gaussian/median filter (choose kernel).
- [x] **T4.3** BE: min/max/midpoint order-statistic.
- [x] **T4.4** BE: Wiener deblur (scikit-image).
- [x] **T4.5** FE: Restoration panel (add-noise buttons, filter selector + kernel size slider).

### ✅ Phase 5 — Morphology (L8, ~1 day) — **DONE**
- [x] **T5.1** BE: `operations/morphology.py` — dilate/erode/open/close.
- [x] **T5.2** BE: `cv2.getStructuringElement` (square/rect/ellipse/cross + size).
- [x] **T5.3** BE: binary thresholding (`cv2.threshold`).
- [x] **T5.4** FE: Morphology panel (choose SE shape + size).

### ✅ Phase 6 — Edge detection (L9, ~1 day) — **DONE**
- [x] **T6.1** BE: `operations/edges.py` — Sobel/Prewitt/Roberts.
- [x] **T6.2** BE: Canny (low/high threshold + sigma).
- [x] **T6.3** BE: Laplacian / LoG.
- [x] **T6.4** FE: Edge panel (choose operator + parameters).

### 🟢 Phase 7 — Finishing (~1 day)
- [ ] **T7.1** BE: `snippets.py` — return the OpenCV code for each operation.
- [ ] **T7.2** FE: CodeSnippet component (show code + lecture label).
- [ ] **T7.3** FE: download the result image.
- [ ] **T7.4** (Nice to have) multi-operation pipeline + undo/history.
- [ ] **T7.5** Write README: how to run backend + frontend.
- [ ] **T7.6** Polish the UI, end-to-end test all operations.

---

## 7. Definition of Done

A feature is considered done when:
1. The backend returns the correct OpenCV result + matrix + histogram + stats.
2. The frontend shows the updated before/after + matrix + histogram.
3. It includes a lecture label + the corresponding OpenCV code snippet.
4. Error handling (wrong file format, out-of-range parameters) does not crash.

### Milestones
- **MVP (after Phases 1–3):** upload → matrix → RGB/channels → histogram → arithmetic. Enough to demo "matrix display + image add/subtract".
- **Full v1 (after Phase 6):** denoise/deblur/morphology/edge complete.
- **Polish (Phase 7):** snippets, download, README, testing.

---

## 8. Risks & notes
- **Large matrix performance:** only transmit the viewed region, not the whole image as numeric JSON.
- **Truncate vs normalize:** this is the most important academic point of L5 — it must be made clear in the UI.
- **Median vs mean for each noise type:** design the UI so the user can draw their own conclusion (matching the L7 tutorial question).
- **Wiener deblur** requires a PSF (point spread function) — the simple version uses an assumed PSF; note this clearly.
- **Prewitt/Roberts** have no single built-in OpenCV function → use `cv2.filter2D` with manual kernels.