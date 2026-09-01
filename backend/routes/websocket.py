import json
import asyncio
from typing import List, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..models.schemas import Alert

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """
    Manages active WebSocket connections for live border alert broadcasting.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"[WebSocket Manager] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        print(f"[WebSocket Manager] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast_alert(self, alert_data: dict):
        """Broadcasts a structured alert payload to all connected frontend clients."""
        dead_connections = []
        payload = json.dumps(alert_data)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()


@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket Gateway /ws/alerts
    Real-time alert streaming channel for frontend Command HUD.
    """
    await manager.connect(websocket)
    try:
        # Send initial welcome connection handshake
        await websocket.send_text(json.dumps({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to IBVAP Live Alert Defense Gateway",
            "status": "online"
        }))

        while True:
            # Keep listening for incoming client messages (e.g. ping/heartbeat or manual trigger)
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                if parsed.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WebSocket Error] {e}")
        manager.disconnect(websocket)
