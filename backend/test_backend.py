"""
Automated Integration Test for IBVAP FastAPI Defense Backend
"""

import sys
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.init_db import init_db

def run_tests():
    print("[1] Initializing SQLite database...")
    init_db()

    print("[2] Creating FastAPI TestClient...")
    client = TestClient(app)

    # Test 1: Health Endpoint
    print("[3] Testing GET /health...")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    health_data = resp.json()
    print(f"    -> Status: {health_data['status']}, Active Cameras: {health_data['activeCameras']}, Alerts: {health_data['activeAlerts']}")

    # Test 2: GET /api/cameras
    print("[4] Testing GET /api/cameras...")
    resp = client.get("/api/cameras")
    assert resp.status_code == 200, f"Cameras endpoint failed: {resp.text}"
    cameras = resp.json()
    assert len(cameras) >= 8, f"Expected 8 cameras, got {len(cameras)}"
    print(f"    -> Retrieved {len(cameras)} cameras. Sample: {cameras[0]['id']} - {cameras[0]['name']}")

    # Test 3: GET /api/alerts
    print("[5] Testing GET /api/alerts...")
    resp = client.get("/api/alerts")
    assert resp.status_code == 200, f"Alerts endpoint failed: {resp.text}"
    alerts = resp.json()
    assert len(alerts) >= 6, f"Expected at least 6 alerts, got {len(alerts)}"
    print(f"    -> Retrieved {len(alerts)} alerts. Sample: {alerts[0]['id']} ({alerts[0]['severity']}) - {alerts[0]['description'][:40]}...")

    # Test 4: GET /api/events
    print("[6] Testing GET /api/events...")
    resp = client.get("/api/events")
    assert resp.status_code == 200, f"Events endpoint failed: {resp.text}"
    events = resp.json()
    assert len(events) >= 6, f"Expected at least 6 events, got {len(events)}"
    print(f"    -> Retrieved {len(events)} events. Sample: {events[0]['id']} - {events[0]['eventType']}")

    # Test 5: POST /api/cameras/test-rtsp
    print("[7] Testing POST /api/cameras/test-rtsp...")
    resp = client.post("/api/cameras/test-rtsp", json={"rtspUrl": "rtsp://admin:pass@10.240.12.101:554/live"})
    assert resp.status_code == 200, f"RTSP test failed: {resp.text}"
    rtsp_res = resp.json()
    assert rtsp_res["success"] is True, f"RTSP handshake failed: {rtsp_res}"
    print(f"    -> RTSP Handshake: {rtsp_res['message']} (Latency: {rtsp_res['latencyMs']}ms)")

    # Test 6: POST /api/alerts/ALT-8901/acknowledge
    print("[8] Testing POST /api/alerts/ALT-8901/acknowledge...")
    resp = client.post("/api/alerts/ALT-8901/acknowledge", json={"operatorName": "Major Vikram Rathore"})
    assert resp.status_code == 200, f"Acknowledge alert failed: {resp.text}"
    ack_res = resp.json()
    assert ack_res["status"] == "acknowledged", f"Expected acknowledged, got {ack_res['status']}"
    print(f"    -> Alert ALT-8901 status: {ack_res['status']}, Acknowledged by: {ack_res['acknowledgedBy']}")

    # Test 7: GET /api/system/stats
    print("[9] Testing GET /api/system/stats...")
    resp = client.get("/api/system/stats")
    assert resp.status_code == 200, f"System stats failed: {resp.text}"
    stats_data = resp.json()
    print(f"    -> System Stats: {stats_data['totalCameras']} Total Cameras, {stats_data['activeCameras']} Active, {stats_data['intrusionAlertsToday']} Alerts Today")

    # Test 8: /api/v1/ prefix aliases
    print("[10] Testing /api/v1/ prefix aliases...")
    resp = client.get("/api/v1/cameras")
    assert resp.status_code == 200, f"/api/v1/cameras failed: {resp.text}"
    resp = client.get("/api/v1/alerts")
    assert resp.status_code == 200, f"/api/v1/alerts failed: {resp.text}"
    resp = client.get("/api/v1/events")
    assert resp.status_code == 200, f"/api/v1/events failed: {resp.text}"

    # Test 9: POST /api/ai/detect with OpenCV image
    print("[11] Testing POST /api/ai/detect (YOLOv11 Deep Vision Detection on Sample Bus & Person image)...")
    import cv2
    import os
    import ultralytics

    bus_img_path = os.path.join(os.path.dirname(ultralytics.__file__), "assets", "bus.jpg")
    assert os.path.exists(bus_img_path), f"Asset image not found at {bus_img_path}"

    with open(bus_img_path, "rb") as f:
        img_bytes = f.read()

    resp = client.post(
        "/api/ai/detect?conf=0.25",
        files={"file": ("bus.jpg", img_bytes, "image/jpeg")}
    )
    assert resp.status_code == 200, f"/api/ai/detect failed: {resp.text}"
    ai_result = resp.json()
    assert "detections" in ai_result, f"Expected 'detections' in response: {ai_result}"
    detections = ai_result["detections"]
    assert len(detections) > 0, "Expected at least 1 detection on bus.jpg"

    # Verify detection structure and categories
    detected_classes = [d["class"] for d in detections]
    print(f"    -> Detected categories: {detected_classes}")
    print(f"    -> Sample Detection Item: {detections[0]}")

    assert "person" in detected_classes or "vehicle" in detected_classes, f"Expected person/vehicle in {detected_classes}"
    first_det = detections[0]
    assert "class" in first_det
    assert "confidence" in first_det
    assert "bbox" in first_det
    assert "x" in first_det["bbox"] and "y" in first_det["bbox"] and "w" in first_det["bbox"] and "h" in first_det["bbox"]

    # Also test /api/v1/ai/detect alias
    resp_v1 = client.post(
        "/api/v1/ai/detect?conf=0.25",
        files={"file": ("bus.jpg", img_bytes, "image/jpeg")}
    )
    assert resp_v1.status_code == 200, f"/api/v1/ai/detect failed: {resp_v1.text}"

    # Test 10: POST /api/stream/start (Live RTSP & YOLOv11 Streaming)
    print("[12] Testing POST /api/stream/start...")
    resp_start = client.post("/api/stream/start", json={
        "camera_id": "CAM-01",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.101:554/stream1",
        "fps": 20,
        "camera_name": "North Sector Fence Alpha",
        "sector": "Sector-1 (North Perimeter)"
    })
    assert resp_start.status_code == 200, f"Stream start failed: {resp_start.text}"
    start_data = resp_start.json()
    assert start_data["status"] == "started", f"Expected started, got {start_data}"
    print(f"    -> Stream Started: {start_data['message']}")

    # Let stream worker process frames for a brief moment
    import time
    time.sleep(0.5)

    # Test 11: GET /api/stream/status
    print("[13] Testing GET /api/stream/status...")
    resp_status = client.get("/api/stream/status")
    assert resp_status.status_code == 200, f"Stream status failed: {resp_status.text}"
    status_data = resp_status.json()
    assert status_data["active_streams"] >= 1, f"Expected at least 1 active stream, got {status_data}"
    cam01_status = status_data["streams"].get("CAM-01")
    assert cam01_status is not None, "CAM-01 stream status missing"
    print(f"    -> Active Streams: {status_data['active_streams']}, CAM-01 Status: {cam01_status['status']}, Frames: {cam01_status['frames_processed']}")

    # Test 12: WebSocket /ws/alerts connection
    print("[14] Testing WebSocket /ws/alerts handshake...")
    with client.websocket_connect("/ws/alerts") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "CONNECTION_ESTABLISHED"
        print(f"    -> WebSocket Handshake OK: {msg['message']}")
        ws.send_json({"type": "PING"})

    # Test 13: POST /api/stream/stop
    print("[15] Testing POST /api/stream/stop...")
    resp_stop = client.post("/api/stream/stop", json={"camera_id": "CAM-01"})
    assert resp_stop.status_code == 200, f"Stream stop failed: {resp_stop.text}"
    stop_data = resp_stop.json()
    assert stop_data["status"] == "stopped", f"Expected stopped, got {stop_data}"
    print(f"    -> Stream Stopped: {stop_data['message']}")

    # Verify stream status is now 0 active streams
    resp_status_after = client.get("/api/stream/status")
    assert resp_status_after.json()["active_streams"] == 0
    print("    -> Confirmed 0 active streams after stop.")

    print("\n" + "="*60)
    print("ALL FASTAPI BACKEND, YOLOv11 AI & RTSP STREAM TESTS PASSED (100% SUCCESS)")
    print("="*60)

if __name__ == "__main__":
    run_tests()

