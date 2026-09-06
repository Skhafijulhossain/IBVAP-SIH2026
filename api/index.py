"""
IBVAP — Vercel Python Serverless Gateway Entrypoint
Exports the defense FastAPI application from backend.main for Vercel Serverless deployment.
"""

import os
import sys

# Ensure repository root is in Python sys.path so 'backend' package and modules resolve cleanly
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# When executing in Vercel Serverless environment, project files are read-only (/var/task).
# SQLite database file must be placed in writable /tmp directory.
if "DATABASE_URL" not in os.environ:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        os.environ["DATABASE_URL"] = "sqlite:////tmp/ibvap.db"

# Import the configured FastAPI application from backend.main
from backend.main import app
from backend.database.init_db import init_db

# Idempotently seed and ensure database tables on serverless cold-start
try:
    init_db()
except Exception as exc:
    print(f"[Vercel Gateway] Cold-start database init note: {exc}")


# Root endpoint for service verification and interactive API discovery
@app.get("/", tags=["Root"])
def root():
    """
    Root status endpoint for Vercel deployment.
    Provides API documentation links and core endpoint routing information.
    """
    return {
        "service": "IBVAP — Intelligent Border Video Analytics Platform",
        "status": "ONLINE",
        "version": "2.4.0-Defense",
        "environment": "Vercel Python Serverless",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "endpoints": {
            "health": "/api/health",
            "cameras": "/api/cameras",
            "alerts": "/api/alerts",
            "events": "/api/events",
            "system_stats": "/api/system/stats",
            "system_config": "/api/system/config",
            "ai_config": "/api/ai/config",
            "threat_detect": "/api/ai/detect",
            "stream": "/api/stream",
            "websocket_alerts": "/ws/alerts",
        },
    }
