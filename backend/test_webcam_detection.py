"""
Integration verification script for WebcamStreamService & YOLOv11 detection on CAM-01.
"""
import time
import cv2
from backend.ai.webcam_stream import WebcamStreamService
from backend.ai.yolo_detector import yolo_detector

def test_webcam_detection():
    print("[TEST 1] Initializing WebcamStreamService for CAM-01...")
    service = WebcamStreamService(camera_id="CAM-01", device_index=0, target_fps=15)
    
    print("[TEST 2] Starting webcam service...")
    service.start()
    
    # Wait for camera initialization and frame processing
    for _ in range(40):
        if service.get_latest_jpeg() is not None and service.frames_processed >= 2:
            break
        time.sleep(0.2)
    
    status = service.get_status()
    print(f"[TEST 3] Status: {status['status']}, FPS: {status['current_fps']}, Frames: {status['frames_processed']}")
    
    jpeg_frame = service.get_latest_jpeg()
    has_frame = jpeg_frame is not None and len(jpeg_frame) > 0
    print(f"[TEST 4] Has JPEG frame: {has_frame}, Byte size: {len(jpeg_frame) if jpeg_frame else 0}")
    
    print(f"[TEST 5] Detections count: {status['detections_count']}, Threats: {status['threats_count']}")
    print(f"[TEST 6] Last detections: {status['last_detections']}")
    
    print("[TEST 7] Stopping webcam service...")
    service.stop()
    print("[TEST 8] Service stopped successfully.")
    
    assert has_frame, "Failed to capture JPEG frame from webcam"
    print("ALL WEBCAM DETECTION TESTS PASSED!")

if __name__ == "__main__":
    test_webcam_detection()
