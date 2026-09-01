"""
IBVAP — Intelligent Border Video Analytics Platform (SIH 2026)
Production-Ready FastAPI Defense Backend
Team: BWU NEURAL NEXUS
"""

from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database.session import get_db
from .database.init_db import init_db
from .models.db_models import CameraModel, AlertModel
from .models.schemas import HealthResponse
from .routes.cameras import router as cameras_router
from .routes.alerts import router as alerts_router
from .routes.events import router as events_router
from .routes.system import router as system_router
from .routes.ai import router as ai_router
from .routes.stream import router as stream_router
from .routes.websocket import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and cleanup."""
    print("[IBVAP Backend] Initializing Defense Database & Seeding Edge Telemetry...")
    init_db()
    print("[IBVAP Backend] System Online. Edge AI Defense Grid Active on port 8000.")
    yield
    print("[IBVAP Backend] Shutting down Defense API Gateway...")


app = FastAPI(
    title="IBVAP — Intelligent Border Video Analytics Platform API",
    description=(
        "Production-Ready Defense API Gateway for AI-based border surveillance, "
        "CCTV RTSP stream ingestion, YOLOv11 threat inference, and automated QRF dispatch."
    ),
    version="2.4.0-Defense",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS) for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vite dev server (http://localhost:5173), production origins, and local network
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Health check diagnostic endpoint.
    Returns 200 OK with edge node telemetry count and platform metadata.
    """
    active_cams = db.query(CameraModel).filter(CameraModel.status == "online").count()
    active_alerts = db.query(AlertModel).filter(AlertModel.status == "new").count()

    return HealthResponse(
        status="ONLINE",
        version="2.4.0-Defense",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
        platform="IBVAP - Smart India Hackathon 2026",
        database="SQLite (Connected)",
        activeCameras=active_cams,
        activeAlerts=active_alerts,
    )


# Mount API routers under both /api and /api/v1 prefixes for maximum client compatibility
for prefix in ["/api", "/api/v1"]:
    app.include_router(cameras_router, prefix=prefix)
    app.include_router(alerts_router, prefix=prefix)
    app.include_router(events_router, prefix=prefix)
    app.include_router(system_router, prefix=prefix)
    app.include_router(ai_router, prefix=prefix)
    app.include_router(stream_router, prefix=prefix)

# Mount WebSocket Gateway
app.include_router(ws_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
