# Image Processing Lab

Web app for learning image processing with real OpenCV. Python/FastAPI backend +
React/Vite frontend. See [`prd.md`](./prd.md) for scope and roadmap.

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

Open http://localhost:5173 — it should show "Backend healthy". The API base URL
defaults to `http://localhost:8000` and can be overridden with `VITE_API_BASE`.

## Layout

```
backend/    FastAPI app (main.py), schemas.py, routes/ operations/ core/ samples/
frontend/   Vite + React + TS + Tailwind (src/api.ts, src/types.ts, src/App.tsx)
```

The API contract lives in `backend/schemas.py` and is mirrored 1:1 in
`frontend/src/types.ts` — keep them in sync.
