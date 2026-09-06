"""
Verification test suite for Vercel Python Serverless Gateway entrypoint (api/index.py).
Tests route availability, status responses, and environment resilience.
"""

import os
import sys

# Ensure repository root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)


def test_root_endpoint():
    print("[TEST] Testing GET / (Vercel Root Endpoint)...")
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "ONLINE"
    assert "IBVAP" in data["service"]
    assert data["environment"] == "Vercel Python Serverless"
    assert "endpoints" in data
    print("  --> PASS: Root endpoint verified.")


def test_health_endpoints():
    print("[TEST] Testing Health Endpoints (/health, /api/health)...")
    for path in ["/health", "/api/health", "/api/v1/health"]:
        res = client.get(path)
        assert res.status_code == 200, f"Expected 200 on {path}, got {res.status_code}"
        data = res.json()
        assert data["status"] == "ONLINE"
        assert "SIH 2026" in data["platform"] or "Smart India Hackathon 2026" in data["platform"]
        print(f"  --> PASS: {path} returned ONLINE (Active cams: {data.get('activeCameras')}).")


def test_core_api_routes():
    print("[TEST] Testing Core Defense API Endpoints (/api/cameras, /api/alerts, /api/events)...")
    
    # Cameras
    res_cams = client.get("/api/cameras")
    assert res_cams.status_code == 200
    cams = res_cams.json()
    assert isinstance(cams, list) and len(cams) >= 4
    print(f"  --> PASS: /api/cameras returned {len(cams)} edge cameras.")

    # Alerts
    res_alerts = client.get("/api/alerts")
    assert res_alerts.status_code == 200
    alerts = res_alerts.json()
    assert isinstance(alerts, list) and len(alerts) >= 1
    print(f"  --> PASS: /api/alerts returned {len(alerts)} alerts.")

    # Events
    res_events = client.get("/api/events")
    assert res_events.status_code == 200
    events = res_events.json()
    assert isinstance(events, list) and len(events) >= 1
    print(f"  --> PASS: /api/events returned {len(events)} events.")

    # System Stats
    res_sys = client.get("/api/system/stats")
    assert res_sys.status_code == 200
    sys_data = res_sys.json()
    assert "totalCameras" in sys_data and sys_data["totalCameras"] >= 4
    print(f"  --> PASS: /api/system/stats returned system stats (Total cameras: {sys_data['totalCameras']}).")

    # System Config
    res_cfg = client.get("/api/system/config")
    assert res_cfg.status_code == 200
    cfg_data = res_cfg.json()
    assert "modelName" in cfg_data
    print(f"  --> PASS: /api/system/config returned model: {cfg_data['modelName']}.")


def test_docs_endpoints():
    print("[TEST] Testing Documentation Endpoints (/docs, /redoc, /openapi.json)...")
    for path in ["/docs", "/redoc", "/openapi.json"]:
        res = client.get(path)
        assert res.status_code == 200, f"Expected 200 on {path}, got {res.status_code}"
        print(f"  --> PASS: {path} returned 200 OK.")


def test_websocket_route_registered():
    print("[TEST] Verifying WebSocket Gateway Route Registration (/ws/alerts)...")
    all_paths = []
    for route in app.routes:
        if hasattr(route, "path") and route.path:
            all_paths.append(route.path)
        if hasattr(route, "original_router") and hasattr(route.original_router, "routes"):
            for sub_r in route.original_router.routes:
                if hasattr(sub_r, "path") and sub_r.path:
                    all_paths.append(sub_r.path)
    assert "/ws/alerts" in all_paths, f"Route /ws/alerts must be registered on FastAPI app. Found: {all_paths}"
    print(f"  --> PASS: /ws/alerts is registered on the FastAPI application.")


if __name__ == "__main__":
    print("=" * 60)
    print("IBVAP VERCEL SERVERLESS GATEWAY VERIFICATION SUITE")
    print("=" * 60)
    try:
        test_root_endpoint()
        test_health_endpoints()
        test_core_api_routes()
        test_docs_endpoints()
        test_websocket_route_registered()
        print("=" * 60)
        print("ALL VERCEL SERVERLESS TESTS PASSED SUCCESSFULLY! (5/5)")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n[FAIL] Test assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        sys.exit(1)
