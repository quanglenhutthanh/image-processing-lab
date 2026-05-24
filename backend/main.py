"""Image Processing Lab API — FastAPI entry point.

Run locally:
    uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import histogram, matrix, process, upload
from schemas import HealthResponse

app = FastAPI(title="Image Processing Lab API", version="1.0.0")

# CORS restricted to the Vite dev origin (NFR-5).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", version=app.version)


app.include_router(upload.router)
app.include_router(process.router)
app.include_router(matrix.router)
app.include_router(histogram.router)
