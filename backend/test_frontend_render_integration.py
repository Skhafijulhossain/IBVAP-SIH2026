"""
Full Integration Verification Suite: React Frontend (Vercel) <-> Live Render Backend.
Validates environment configurations, REST endpoints, and WebSocket channels.
"""

import os
import sys
import asyncio
import httpx
import websockets

RENDER_API_BASE = "https://ibvap-backend-22xy.onrender.com"
RENDER_WS_URL = "wss://ibvap-backend-22xy.onrender.com/ws/alerts"


def test_env_files():
    print("[TEST 1/6] Verifying .env and .env.production configurations...")
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for filename in [".env", ".env.production"]:
        path = os.path.join(root_dir, filename)
        assert os.path.exists(path), f"File {filename} does not exist"
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        assert "VITE_API_BASE_URL=https://ibvap-backend-22xy.onrender.com" in content
        assert "VITE_WS_BASE_URL=wss://ibvap-backend-22xy.onrender.com/ws" in content
        print(f"  --> PASS: {filename} correctly defines VITE_API_BASE_URL and VITE_WS_BASE_URL.")


def test_health_endpoint():
    print(f"[TEST 2/6] Connecting to {RENDER_API_BASE}/health...")
    with httpx.Client(timeout=30.0) as client:
        res = client.get(f"{RENDER_API_BASE}/health")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert data.get("status") == "ONLINE"
        print(f"  --> PASS: /health is ONLINE (Active cameras: {data.get('activeCameras')}, Alerts: {data.get('activeAlerts')}).")


def test_cameras_endpoint():
    print(f"[TEST 3/6] Connecting to {RENDER_API_BASE}/api/cameras...")
    with httpx.Client(timeout=30.0) as client:
        res = client.get(f"{RENDER_API_BASE}/api/cameras")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        cameras = res.json()
        assert isinstance(cameras, list) and len(cameras) >= 4
        print(f"  --> PASS: /api/cameras returned {len(cameras)} live edge cameras. (First: {cameras[0].get('id')} - {cameras[0].get('name')})")


def test_alerts_endpoint():
    print(f"[TEST 4/6] Connecting to {RENDER_API_BASE}/api/alerts...")
    with httpx.Client(timeout=30.0) as client:
        res = client.get(f"{RENDER_API_BASE}/api/alerts")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        alerts = res.json()
        assert isinstance(alerts, list) and len(alerts) >= 1
        print(f"  --> PASS: /api/alerts returned {len(alerts)} alerts. (First: {alerts[0].get('id')} - {alerts[0].get('severity')})")


def test_events_endpoint():
    print(f"[TEST 5/6] Connecting to {RENDER_API_BASE}/api/events...")
    with httpx.Client(timeout=30.0) as client:
        res = client.get(f"{RENDER_API_BASE}/api/events")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        events = res.json()
        assert isinstance(events, list) and len(events) >= 1
        print(f"  --> PASS: /api/events returned {len(events)} surveillance events.")


def test_websocket_channel():
    print(f"[TEST 6/6] Connecting to live WebSocket channel: {RENDER_WS_URL}...")
    async def connect_ws():
        async with websockets.connect(RENDER_WS_URL) as ws:
            # Successfully opened handshake
            return True

    success = asyncio.run(asyncio.wait_for(connect_ws(), timeout=15.0))
    assert success is True
    print(f"  --> PASS: Live WebSocket handshake succeeded on {RENDER_WS_URL}.")


if __name__ == "__main__":
    print("=" * 65)
    print("IBVAP FRONTEND <-> RENDER BACKEND INTEGRATION TEST SUITE")
    print("=" * 65)
    try:
        test_env_files()
        test_health_endpoint()
        test_cameras_endpoint()
        test_alerts_endpoint()
        test_events_endpoint()
        test_websocket_channel()
        print("=" * 65)
        print("ALL 6 INTEGRATION TESTS PASSED (100% SUCCESS)!")
        print("=" * 65)
    except Exception as e:
        print(f"\n[FAIL] Integration test failed: {e}")
        sys.exit(1)
