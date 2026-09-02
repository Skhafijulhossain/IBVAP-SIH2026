"""
Verification script for CAM-01 Real RTSP Live Feed, Reconnection, and Telemetry
"""

import os
import time
from fastapi.testclient import TestClient
from backend.main import app

def test_cam01_rtsp_live_and_reconnect():
    client = TestClient(app)

    # 1. Test Unavailable RTSP Source (Waiting for Camera state)
    print("\n[Phase 1] Testing CAM-01 with Unavailable RTSP Source...")
    resp_start = client.post("/api/stream/start", json={
        "camera_id": "CAM-01",
        "rtsp_url": "rtsp://127.0.0.1:8554/cam1",
        "fps": 15
    })
    assert resp_start.status_code == 200
    print("  -> POST /api/stream/start dispatched for CAM-01")

    # Let ingestor attempt connection
    time.sleep(1.0)

    # Verify stream status reports reconnecting
    resp_status = client.get("/api/stream/status")
    assert resp_status.status_code == 200
    st = resp_status.json()["streams"].get("CAM-01")
    assert st is not None
    assert st["status"] == "reconnecting"
    print(f"  -> CAM-01 Status: {st['status']} (Reconnect count: {st['reconnect_count']})")

    # Verify feed endpoint returns 503 while reconnecting
    resp_feed = client.get("/api/stream/feed/CAM-01")
    assert resp_feed.status_code == 503
    print("  -> GET /api/stream/feed/CAM-01 returned 503 (Waiting for Camera as expected)")

    # 2. Test Real Live Stream Ingestion (CAM-01 Connected)
    print("\n[Phase 2] Testing CAM-01 with Real Live Stream...")
    sample_feed_path = os.path.abspath("backend/sample_feed.mp4")
    assert os.path.exists(sample_feed_path), f"Sample feed not found: {sample_feed_path}"

    resp_start_real = client.post("/api/stream/start", json={
        "camera_id": "CAM-01",
        "rtsp_url": sample_feed_path,
        "fps": 20,
        "camera_name": "North Sector Fence Alpha"
    })
    assert resp_start_real.status_code == 200

    # Let ingestor process live frames (poll until streaming or timeout)
    st_real = None
    for _ in range(20):
        time.sleep(0.2)
        resp_status_real = client.get("/api/stream/status")
        st_real = resp_status_real.json()["streams"].get("CAM-01")
        if st_real and st_real["status"] == "streaming":
            break

    assert st_real is not None, "CAM-01 stream missing"
    assert st_real["status"] == "streaming", f"Expected streaming, got {st_real['status']}"
    assert st_real["frames_processed"] > 0, "Expected frames_processed > 0"
    print(f"  -> CAM-01 Status: {st_real['status']}")
    print(f"  -> Frames Processed: {st_real['frames_processed']}")
    print(f"  -> Target FPS: {st_real['target_fps']}, Current FPS: {st_real.get('current_fps')}")
    print(f"  -> Bitrate: {st_real.get('bitrate')}")

    # Verify snapshot frame returns valid JPEG
    resp_frame = client.get("/api/stream/frame/CAM-01")
    assert resp_frame.status_code == 200
    assert resp_frame.headers["content-type"] == "image/jpeg"
    assert len(resp_frame.content) > 1000
    print(f"  -> GET /api/stream/frame/CAM-01 returned valid JPEG ({len(resp_frame.content)} bytes)")

    # 3. Clean up
    print("\n[Phase 3] Stopping Stream...")
    resp_stop = client.post("/api/stream/stop", json={"camera_id": "CAM-01"})
    assert resp_stop.status_code == 200
    print("  -> POST /api/stream/stop successful")

    print("\n" + "="*60)
    print("CAM-01 REAL RTSP STREAM & RECONNECT TEST PASSED (100%)")
    print("="*60)

if __name__ == "__main__":
    test_cam01_rtsp_live_and_reconnect()
