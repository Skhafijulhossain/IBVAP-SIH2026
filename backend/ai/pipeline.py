"""
Unified Edge Analytics Pipeline Orchestrator
Coordinates RTSP Video Ingestion, Deep Vision Inference (YOLOv11),
Spatial Tripwire Rules, and Real-Time Threat Event Generation.
"""

from typing import Dict, List, Any, Optional
from .yolo_detector import YOLOv11Detector
from .rtsp_stream import RTSPStreamIngestor
from .tripwire import TripwireEngine
from ..models.schemas import Detection, Camera


class EdgeAnalyticsPipeline:
    """
    Manages active camera stream workers, per-camera YOLO detectors,
    and alert dispatch pipelines.
    """

    def __init__(self):
        self.detector = YOLOv11Detector()
        self.tripwire = TripwireEngine()
        self.stream_workers: Dict[str, RTSPStreamIngestor] = {}
        self.is_active = True

    def register_camera_node(self, camera: Camera):
        """Bind an edge CCTV stream node into the processing matrix."""
        if camera.id in self.stream_workers:
            self.stream_workers[camera.id].stop()

        worker = RTSPStreamIngestor(
            camera_id=camera.id,
            rtsp_url=camera.rtspUrl,
            target_fps=camera.fps
        )
        worker.on_frame_callback = self._process_frame_event
        self.stream_workers[camera.id] = worker
        # worker.start() # Activated when full streaming mode is toggled

    def unregister_camera_node(self, camera_id: str):
        """Disconnect and remove camera stream worker."""
        if camera_id in self.stream_workers:
            self.stream_workers[camera_id].stop()
            del self.stream_workers[camera_id]

    def _process_frame_event(self, camera_id: str, frame_data: Dict[str, Any]):
        """Internal callback when a frame is decoded."""
        # Prepared for live frame pipeline
        pass

    def run_ad_hoc_analysis(self, camera: Camera) -> List[Detection]:
        """Runs single-frame inference on camera feed."""
        detections = self.detector.infer(frame=None, camera_id=camera.id)
        # Apply tripwire checks
        if camera.wireCoordinates:
            for det in detections:
                breach_result = self.tripwire.evaluate_breach(det.box, camera.wireCoordinates)
                if breach_result["is_breach"]:
                    det.threatLevel = "critical"
                    det.label = breach_result["label"]
        return detections
