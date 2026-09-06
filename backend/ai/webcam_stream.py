"""
Live Physical Webcam Stream Ingestion & YOLOv11 Deep Vision Analytics Engine
Integrates OpenCV VideoCapture(0), YOLOv11 Object Detection (Person, Vehicle, Animal),
Direct Tactical Bounding Box & HUD Rendering on Video Frames,
Virtual Fence Tripwire Evaluation, and Real-Time WebSocket Alert Broadcasting.
"""

import os
import time
import random
import threading
import asyncio
from typing import Optional, Dict, Any, List, Tuple
import cv2
import numpy as np

from .yolo_detector import yolo_detector
from .tripwire import TripwireEngine
from ..models.schemas import BoundingBox, WireCoordinates


class WebcamStreamService:
    """
    Manages live physical webcam ingestion (cv2.VideoCapture(0)),
    real-time YOLOv11 inference for Person, Vehicle, and Animal categories,
    military-grade bounding box rendering on OpenCV frames,
    virtual tripwire calculation, MJPEG frame caching, and WebSocket alert broadcasts.
    """

    # Tactical color taxonomy (BGR format for OpenCV)
    CATEGORY_COLORS = {
        "person": (20, 30, 235),     # Alert Red/Crimson
        "vehicle": (0, 165, 255),    # Tactical Amber/Orange
        "animal": (240, 210, 0),     # Tactical Cyan/Yellow
        "default": (0, 220, 255),    # Tactical Yellow
    }

    def __init__(
        self,
        camera_id: str = "CAM-01",
        device_index: int = 0,
        camera_name: str = "North Sector Fence Alpha",
        sector: str = "Sector-1 (North Perimeter)",
        target_fps: int = 15,
        wire_coordinates: Optional[Dict[str, float]] = None,
        conf_threshold: float = 0.25,
    ):
        self.camera_id = camera_id
        self.device_index = device_index
        self.camera_name = camera_name
        self.sector = sector
        self.target_fps = max(5, min(30, target_fps))
        self.wire_coordinates = wire_coordinates or {"x1": 5, "y1": 70, "x2": 95, "y2": 65}
        self.conf_threshold = conf_threshold

        # Runtime State
        self.is_running = False
        self._thread: Optional[threading.Thread] = None
        self.status = "stopped"  # "streaming", "reconnecting", "stopped", "error"
        self.source_type = "webcam"
        self.is_webcam = True
        self.frames_processed = 0
        self.detections_count = 0
        self.threats_count = 0
        self.start_time: Optional[float] = None
        self.last_frame_time: Optional[float] = None
        self.last_detections: List[Dict[str, Any]] = []

        # Live telemetry & MJPEG frame cache
        self.current_fps: float = 0.0
        self.bitrate: str = "0.0 Mbps"
        self.latest_jpeg_frame: Optional[bytes] = None
        self._frame_lock = threading.Lock()
        self._fps_counter: int = 0
        self._fps_timer: float = time.time()

        # Alert Cooldown State (prevents WebSocket flooding)
        self._last_alert_time: Dict[str, float] = {}
        self._alert_cooldown_sec = 3.5

    def start(self):
        """Starts the background webcam capture and YOLOv11 inference worker thread."""
        if self.is_running:
            return
        self.is_running = True
        self.status = "reconnecting"
        self.start_time = time.time()
        self._fps_timer = time.time()
        self._fps_counter = 0
        self._thread = threading.Thread(target=self._worker_loop, daemon=True)
        self._thread.start()
        print(f"[Webcam Service] Started capture & YOLOv11 worker for {self.camera_id} on device index {self.device_index}")

    def stop(self):
        """Stops the webcam worker and releases all resources."""
        self.is_running = False
        self.status = "stopped"
        with self._frame_lock:
            self.latest_jpeg_frame = None
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
            self._thread = None
        print(f"[Webcam Service] Stopped worker for {self.camera_id}")

    def get_latest_jpeg(self) -> Optional[bytes]:
        """Returns the most recent annotated JPEG frame for HTTP MJPEG streaming."""
        with self._frame_lock:
            return self.latest_jpeg_frame

    def get_status(self) -> Dict[str, Any]:
        """Returns runtime performance telemetry."""
        uptime = round(time.time() - self.start_time, 1) if self.start_time and self.is_running else 0.0
        return {
            "camera_id": self.camera_id,
            "camera_name": self.camera_name,
            "sector": self.sector,
            "source_type": "webcam",
            "device_index": self.device_index,
            "is_webcam": True,
            "status": self.status,
            "target_fps": self.target_fps,
            "current_fps": self.current_fps,
            "bitrate": self.bitrate,
            "frames_processed": self.frames_processed,
            "detections_count": self.detections_count,
            "threats_count": self.threats_count,
            "reconnect_count": getattr(self, "reconnect_count", 0),
            "uptime_sec": uptime,
            "last_detections": self.last_detections,
        }

    def _open_camera(self) -> Optional[cv2.VideoCapture]:
        """Attempts to open system webcam via DirectShow (Windows) or default backend."""
        cap = None
        # Try DirectShow on Windows for fastest hardware initialization
        try:
            cap = cv2.VideoCapture(self.device_index, cv2.CAP_DSHOW)
            if cap and cap.isOpened():
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                return cap
            if cap:
                cap.release()
        except Exception:
            pass

        # Fallback to standard VideoCapture
        try:
            cap = cv2.VideoCapture(self.device_index)
            if cap and cap.isOpened():
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                return cap
            if cap:
                cap.release()
        except Exception as e:
            print(f"[Webcam Service] VideoCapture({self.device_index}) failed: {e}")

        return None

    def _worker_loop(self):
        """Main webcam capture and YOLOv11 inference loop."""
        backoff_sec = 1.0
        max_backoff = 4.0
        frame_interval = 1.0 / self.target_fps

        while self.is_running:
            cap = self._open_camera()

            if cap and cap.isOpened():
                self.status = "streaming"
                backoff_sec = 1.0
                print(f"[Webcam Service] Connected to hardware webcam ({self.device_index}) for {self.camera_id}")

                while self.is_running:
                    t0 = time.time()
                    ret, frame = cap.read()

                    if not ret or frame is None:
                        print(f"[Webcam Service] Frame drop or disconnect for {self.camera_id}. Re-opening...")
                        self.status = "reconnecting"
                        with self._frame_lock:
                            self.latest_jpeg_frame = None
                        self.current_fps = 0.0
                        break

                    # 1. Run YOLOv11 inference & draw tactical defense overlays on frame
                    annotated_frame = self._process_and_annotate(frame)

                    # 2. Encode to JPEG for low-latency MJPEG streaming
                    ok, jpeg_buf = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                    if ok:
                        frame_bytes = jpeg_buf.tobytes()
                        with self._frame_lock:
                            self.latest_jpeg_frame = frame_bytes

                    # 3. Update FPS and bitrate metrics
                    self._fps_counter += 1
                    now = time.time()
                    dt = now - self._fps_timer
                    if dt >= 1.0:
                        self.current_fps = round(self._fps_counter / dt, 1)
                        self._fps_counter = 0
                        self._fps_timer = now
                        if ok and self.current_fps > 0:
                            approx_kbps = len(frame_bytes) * 8 * self.current_fps / 1000.0
                            if approx_kbps >= 1000.0:
                                self.bitrate = f"{round(approx_kbps / 1000.0, 1)} Mbps"
                            else:
                                self.bitrate = f"{int(approx_kbps)} Kbps"

                    # 4. Regulate FPS pace
                    elapsed = time.time() - t0
                    sleep_time = max(0.001, frame_interval - elapsed)
                    time.sleep(sleep_time)

                if cap:
                    cap.release()
            else:
                self.status = "reconnecting"
                self.current_fps = 0.0
                with self._frame_lock:
                    self.latest_jpeg_frame = None
                print(f"[Webcam Service] Hardware webcam device #{self.device_index} busy/unavailable. Retrying in {backoff_sec}s...")

            if self.is_running:
                time.sleep(backoff_sec)
                backoff_sec = min(max_backoff, backoff_sec * 1.5)

    def _process_and_annotate(self, frame: np.ndarray) -> np.ndarray:
        """
        Runs YOLOv11 inference, draws tactical bounding boxes, labels,
        virtual tripwire, and dispatches WebSocket alerts.
        """
        self.frames_processed += 1
        self.last_frame_time = time.time()
        img_h, img_w = frame.shape[:2]

        # 1. Run YOLOv11 inference (detects Person, Vehicle, Animal)
        detections = yolo_detector.detect_categories(frame, conf_threshold=self.conf_threshold)

        det_dicts = []
        has_tripwire_breach = False
        tripwire_label = None

        # Check virtual tripwire coordinates
        wire_obj = None
        if self.wire_coordinates:
            wire_obj = WireCoordinates(
                x1=self.wire_coordinates["x1"],
                y1=self.wire_coordinates["y1"],
                x2=self.wire_coordinates["x2"],
                y2=self.wire_coordinates["y2"],
            )

        # Draw detections
        for det in detections:
            bbox_dict = {"x": det.bbox.x, "y": det.bbox.y, "w": det.bbox.w, "h": det.bbox.h}
            det_dicts.append({
                "class": det.class_name,
                "confidence": det.confidence,
                "bbox": bbox_dict
            })
            self.detections_count += 1

            # Pixel bounding coordinates
            x1 = max(0, min(img_w - 1, int(det.bbox.x * img_w)))
            y1 = max(0, min(img_h - 1, int(det.bbox.y * img_h)))
            x2 = max(0, min(img_w - 1, int((det.bbox.x + det.bbox.w) * img_w)))
            y2 = max(0, min(img_h - 1, int((det.bbox.y + det.bbox.h) * img_h)))

            # Evaluate Tripwire breach
            if wire_obj:
                box_pct = BoundingBox(
                    x=det.bbox.x * 100.0,
                    y=det.bbox.y * 100.0,
                    width=det.bbox.w * 100.0,
                    height=det.bbox.h * 100.0,
                )
                breach_eval = TripwireEngine.evaluate_breach(box_pct, wire_obj)
                if breach_eval["is_breach"]:
                    has_tripwire_breach = True
                    tripwire_label = breach_eval.get("label", "Virtual Tripwire Breach Detected")
                    self.threats_count += 1

            # Pick tactical color
            box_color = self.CATEGORY_COLORS.get(det.class_name, self.CATEGORY_COLORS["default"])
            if has_tripwire_breach and det.class_name == "person":
                box_color = (0, 0, 255)  # Flash red on breach

            # Draw Main Bounding Box
            cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)

            # Draw Tactical Corner Brackets
            corner_len = max(8, min(24, int((x2 - x1) * 0.15)))
            thick = 3
            # Top-Left
            cv2.line(frame, (x1, y1), (x1 + corner_len, y1), box_color, thick)
            cv2.line(frame, (x1, y1), (x1, y1 + corner_len), box_color, thick)
            # Top-Right
            cv2.line(frame, (x2, y1), (x2 - corner_len, y1), box_color, thick)
            cv2.line(frame, (x2, y1), (x2 - corner_len, y1), box_color, thick)
            # Bottom-Left
            cv2.line(frame, (x1, y2), (x1 + corner_len, y2), box_color, thick)
            cv2.line(frame, (x1, y2), (x1, y2 - corner_len), box_color, thick)
            # Bottom-Right
            cv2.line(frame, (x2, y2), (x2 - corner_len, y2), box_color, thick)
            cv2.line(frame, (x2, y2), (x2, y2 - corner_len), box_color, thick)

            # Draw Label Tag Header
            conf_pct = int(round(det.confidence * 100))
            tag_text = f"{det.class_name.upper()} {conf_pct}%"
            (tw, th), _ = cv2.getTextSize(tag_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)

            tag_y1 = max(0, y1 - th - 7)
            tag_y2 = y1
            cv2.rectangle(frame, (x1, tag_y1), (x1 + tw + 10, tag_y2), box_color, -1)
            cv2.putText(
                frame,
                tag_text,
                (x1 + 5, tag_y2 - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 255) if det.class_name == "person" else (10, 10, 10),
                1,
                cv2.LINE_AA,
            )

        # 2. Draw Virtual Tripwire Line on Frame
        if self.wire_coordinates:
            wx1 = int(self.wire_coordinates["x1"] * img_w / 100.0)
            wy1 = int(self.wire_coordinates["y1"] * img_h / 100.0)
            wx2 = int(self.wire_coordinates["x2"] * img_w / 100.0)
            wy2 = int(self.wire_coordinates["y2"] * img_h / 100.0)

            wire_color = (0, 0, 255) if has_tripwire_breach else (255, 200, 0)
            wire_thick = 3 if has_tripwire_breach else 2
            cv2.line(frame, (wx1, wy1), (wx2, wy2), wire_color, wire_thick)

            wire_tag = "TRIPWIRE BREACH!" if has_tripwire_breach else "VIRTUAL TRIPWIRE"
            mcx = (wx1 + wx2) // 2
            mcy = (wy1 + wy2) // 2 - 6
            cv2.putText(
                frame,
                wire_tag,
                (mcx - 45, mcy),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.35,
                wire_color,
                1,
                cv2.LINE_AA,
            )

        # 3. Draw Tactical Defense HUD Overlay Banner
        hud_bg_color = (12, 16, 24)
        cv2.rectangle(frame, (0, 0), (img_w, 24), hud_bg_color, -1)
        cv2.line(frame, (0, 24), (img_w, 24), (45, 60, 80), 1)

        hud_text_left = f"{self.camera_id} [LIVE CAMERA] | {self.sector}"
        hud_text_right = f"FPS: {self.current_fps} | DETECTIONS: {len(detections)}"

        cv2.putText(frame, hud_text_left, (8, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, hud_text_right, (img_w - 200, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, cv2.LINE_AA)

        self.last_detections = det_dicts

        # 4. Broadcast live detections & alerts via WebSocket
        self._dispatch_detection_updates(detections, det_dicts, has_tripwire_breach, tripwire_label)

        return frame

    def _dispatch_detection_updates(
        self,
        detections: list,
        det_dicts: list,
        has_tripwire_breach: bool,
        tripwire_label: Optional[str],
    ):
        """Sends live detections and alerts to WebSocket subscribers."""
        now = time.time()

        # Always broadcast low-latency detection telemetry for real-time HUD rendering
        if det_dicts or (self.frames_processed % 15 == 0):
            self._broadcast_async({
                "type": "CAMERA_DETECTIONS",
                "cameraId": self.camera_id,
                "cameraName": self.camera_name,
                "sector": self.sector,
                "detections": det_dicts,
                "fps": self.current_fps,
                "status": "streaming",
                "isLive": True,
                "sourceType": "webcam",
            })

        # Check if an alert should be dispatched (with cooldown to prevent flooding)
        if det_dicts or has_tripwire_breach:
            primary_class = detections[0].class_name if detections else "intrusion"
            event_type = "line_crossing" if has_tripwire_breach else primary_class
            severity = "critical" if (has_tripwire_breach or primary_class == "person") else "warning"

            last_alert = self._last_alert_time.get(event_type, 0.0)
            if (now - last_alert) >= self._alert_cooldown_sec:
                self._last_alert_time[event_type] = now

                alert_payload = {
                    "type": "NEW_ALERT",
                    "data": {
                        "id": f"ALT-{random.randint(9000, 9999)}",
                        "timestamp": "Just now",
                        "cameraId": self.camera_id,
                        "cameraName": self.camera_name,
                        "sector": self.sector,
                        "eventType": event_type,
                        "severity": severity,
                        "confidence": detections[0].confidence if detections else 0.94,
                        "status": "new",
                        "thumbnailUrl": "/snapshots/cam-01-live.jpg",
                        "description": tripwire_label or f"YOLOv11 live webcam detected {primary_class} in active defense zone.",
                        "coordinates": {"lat": 34.0837, "lng": 74.7973},
                        "detections": det_dicts,
                        "qrfDispatched": has_tripwire_breach or primary_class == "person",
                        "assignedUnit": "QRF Alpha Unit" if (has_tripwire_breach or primary_class == "person") else None,
                    }
                }

                self._broadcast_async(alert_payload)

                # Persist alert into SQLite defense database
                self._persist_alert_to_db(alert_payload["data"])

    def _persist_alert_to_db(self, alert_data: Dict[str, Any]):
        """Persists detected alert to local SQLite ibvap.db database."""
        try:
            from ..database.session import SessionLocal
            from ..models.db_models import AlertModel
            import json

            db = SessionLocal()
            try:
                db_alert = AlertModel(
                    id=alert_data["id"],
                    timestamp=alert_data.get("timestamp", "Just now"),
                    camera_id=alert_data.get("cameraId", self.camera_id),
                    camera_name=alert_data.get("cameraName", self.camera_name),
                    sector=alert_data.get("sector", self.sector),
                    event_type=alert_data.get("eventType", "person"),
                    severity=alert_data.get("severity", "critical"),
                    confidence=float(alert_data.get("confidence", 0.9)),
                    status="new",
                    thumbnail_url=alert_data.get("thumbnailUrl", "/snapshots/default-alert.jpg"),
                    description=alert_data.get("description", "YOLOv11 Live Detection"),
                    coordinates_json=json.dumps(alert_data.get("coordinates", {"lat": 34.0837, "lng": 74.7973})),
                    qrf_dispatched=alert_data.get("qrfDispatched", False),
                    assigned_unit=alert_data.get("assignedUnit"),
                    operator_notes="Automatically registered by live YOLOv11 Webcam Engine.",
                    acknowledged_by=None,
                )
                db.add(db_alert)
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[Webcam Service DB Record Note] {e}")

    def _broadcast_async(self, alert_payload: Dict[str, Any]):
        """Dispatches alert payload to active WebSocket connections."""
        try:
            from ..routes.websocket import manager as ws_manager
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(ws_manager.broadcast_alert(alert_payload), loop)
            else:
                loop.run_until_complete(ws_manager.broadcast_alert(alert_payload))
        except RuntimeError:
            try:
                from ..routes.websocket import manager as ws_manager
                new_loop = asyncio.new_event_loop()
                new_loop.run_until_complete(ws_manager.broadcast_alert(alert_payload))
                new_loop.close()
            except Exception as e:
                print(f"[Webcam WebSocket Broadcast Error] {e}")


# Global singleton instance for CAM-01 webcam service
webcam_service = WebcamStreamService(camera_id="CAM-01", device_index=0)
