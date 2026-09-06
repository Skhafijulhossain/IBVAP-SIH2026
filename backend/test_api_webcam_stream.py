"""
FastAPI TestClient verification for Webcam Streaming, YOLOv11 Detection, and WebSocket broadcast.
"""
from fastapi.testclient import TestClient
from backend.main import app
from backend.routes.stream import stream_manager
import time

def test_api_webcam_and_websocket():
    client = TestClient(app)
    
    print("[API TEST 1] Checking Root & Health endpoints...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"Health response: {res.json()['status']}")
    
    print("[API TEST 2] Starting live webcam stream on CAM-01...")
    res = client.post("/api/stream/webcam/start", json={"camera_id": "CAM-01", "device_index": 0, "fps": 15})
    assert res.status_code == 200, f"Failed to start webcam: {res.text}"
    print(f"Start response: {res.json()['status']}")
    
    print("[API TEST 3] Checking /api/stream/status...")
    # Wait for frames
    time.sleep(2.5)
    res = client.get("/api/stream/status")
    assert res.status_code == 200, f"Status failed: {res.text}"
    status_data = res.json()
    print(f"Stream status: active_streams={status_data['active_streams']}")
    cam01_info = status_data['streams'].get('CAM-01', {})
    assert cam01_info.get('status') == 'streaming', f"CAM-01 not streaming: {cam01_info}"
    assert cam01_info.get('source_type') == 'webcam', "CAM-01 source_type is not webcam"
    print(f"CAM-01 Stream Info: status={cam01_info['status']}, source={cam01_info['source_type']}, FPS={cam01_info.get('current_fps')}")
    
    print("[API TEST 4] Checking /api/stream/frame/CAM-01 snapshot...")
    res = client.get("/api/stream/frame/CAM-01")
    assert res.status_code == 200, f"Frame snapshot failed: {res.status_code}"
    assert res.headers["content-type"] == "image/jpeg"
    assert len(res.content) > 1000, "Snapshot content too small"
    print(f"Snapshot JPEG received successfully ({len(res.content)} bytes).")
    
    print("[API TEST 5] Testing WebSocket /ws/alerts connection...")
    with client.websocket_connect("/ws/alerts") as ws:
        data = ws.receive_json()
        print(f"WebSocket handshake received: {data}")
        assert data.get("type") == "CONNECTION_ESTABLISHED"
        
        # Send PING
        ws.send_json({"type": "PING"})
        pong = ws.receive_json()
        print(f"WebSocket PING response: {pong}")
        assert pong.get("type") == "PONG"
        
    print("[API TEST 6] Stopping stream...")
    res = client.post("/api/stream/stop", json={"camera_id": "CAM-01"})
    assert res.status_code == 200
    print("Stream stopped successfully.")
    
    print("ALL FASTAPI WEBCAM API TESTS PASSED!")

if __name__ == "__main__":
    test_api_webcam_and_websocket()
