from .cameras import router as cameras_router
from .alerts import router as alerts_router
from .events import router as events_router
from .system import router as system_router
from .ai import router as ai_router
from .stream import router as stream_router
from .websocket import router as ws_router

__all__ = [
    "cameras_router",
    "alerts_router",
    "events_router",
    "system_router",
    "ai_router",
    "stream_router",
    "ws_router",
]


