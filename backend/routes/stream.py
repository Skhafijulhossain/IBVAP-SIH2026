import asyncio
from typing import Dict, Optional, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse

from ..ai.rtsp_stream import RTSPStreamIngestor
from ..ai.webcam_stream import WebcamStreamService

router = APIRouter(prefix="/stream", tags=["Live RTSP & Webcam YOLOv11 Stream"])


class StreamStartRequest(BaseModel):
    camera_id: Optional[str] = "CAM-01"
    rtsp_url: Optional[str] = None
    fps: Optional[int] = 15
    camera_name: Optional[str] = "North Sector Fence Alpha"
    sector: Optional[str] = "Sector-1 (North Perimeter)"
    source_type: Optional[str] = None  # None, "webcam" or "rtsp"
    device_index: Optional[int] = 0


class StreamStopRequest(BaseModel):
    camera_id: Optional[str] = None  # None or "all" stops all active streams


class WebcamStartRequest(BaseModel):
    camera_id: Optional[str] = "CAM-01"
    device_index: Optional[int] = 0
    fps: Optional[int] = 15
    camera_name: Optional[str] = "North Sector Fence Alpha"
    sector: Optional[str] = "Sector-1 (North Perimeter)"


class StreamManager:
    """Singleton managing active webcam and RTSP ingestors across all border CCTV nodes."""

    def __init__(self):
        self.active_streams: Dict[str, Any] = {}

    def get_stream(self, camera_id: str = "CAM-01") -> Optional[Any]:
        """Returns the active stream ingestor or auto-starts default CAM-01 on webcam."""
        if camera_id in self.active_streams:
            return self.active_streams[camera_id]
        if camera_id == "CAM-01":
            self.start_stream(camera_id="CAM-01", source_type="webcam")
            return self.active_streams.get("CAM-01")
        return None

    def start_stream(
        self,
        camera_id: str = "CAM-01",
        rtsp_url: Optional[str] = None,
        fps: int = 15,
        camera_name: str = "North Sector Fence Alpha",
        sector: str = "Sector-1 (North Perimeter)",
        source_type: Optional[str] = None,
        device_index: int = 0,
    ) -> Dict[str, Any]:
        if camera_id in self.active_streams:
            self.active_streams[camera_id].stop()

        # Decide whether to launch WebcamStreamService or RTSPStreamIngestor
        if rtsp_url and rtsp_url not in ("webcam", "0", 0):
            use_webcam = False
        elif source_type == "webcam" or rtsp_url in ("webcam", "0", 0):
            use_webcam = True
        elif camera_id == "CAM-01":
            use_webcam = True
        else:
            use_webcam = False

        if use_webcam:
            ingestor = WebcamStreamService(
                camera_id=camera_id,
                device_index=device_index,
                camera_name=camera_name,
                sector=sector,
                target_fps=fps,
            )
            ingestor.start()
            self.active_streams[camera_id] = ingestor

            return {
                "status": "started",
                "source_type": "webcam",
                "message": f"Live webcam stream and YOLOv11 analytics started for {camera_id}",
                "stream_info": ingestor.get_status()
            }
        else:
            effective_url = rtsp_url or ("rtsp://127.0.0.1:8554/cam1" if camera_id == "CAM-01" else "rtsp://admin:secure_pass@10.240.12.101:554/stream1")
            ingestor = RTSPStreamIngestor(
                camera_id=camera_id,
                rtsp_url=effective_url,
                target_fps=fps,
                camera_name=camera_name,
                sector=sector,
            )
            ingestor.start()
            self.active_streams[camera_id] = ingestor

            return {
                "status": "started",
                "source_type": "rtsp",
                "message": f"Live RTSP stream and YOLOv11 analytics started for {camera_id}",
                "stream_info": ingestor.get_status()
            }

    def stop_stream(self, camera_id: Optional[str] = None) -> Dict[str, Any]:
        if not camera_id or camera_id.lower() == "all":
            stopped = []
            for cid, ingestor in list(self.active_streams.items()):
                ingestor.stop()
                stopped.append(cid)
            self.active_streams.clear()
            return {
                "status": "stopped",
                "message": f"Stopped all active streams ({len(stopped)} cameras)",
                "stopped_cameras": stopped
            }

        if camera_id in self.active_streams:
            self.active_streams[camera_id].stop()
            del self.active_streams[camera_id]
            return {
                "status": "stopped",
                "message": f"Stopped stream for {camera_id}",
                "camera_id": camera_id
            }

        return {
            "status": "not_found",
            "message": f"No active stream found for camera {camera_id}",
            "camera_id": camera_id
        }

    def get_all_status(self) -> Dict[str, Any]:
        statuses = {cid: ingestor.get_status() for cid, ingestor in self.active_streams.items()}
        return {
            "active_streams": len(statuses),
            "streams": statuses
        }


stream_manager = StreamManager()


@router.post("/start", status_code=status.HTTP_200_OK)
def start_stream_endpoint(
    payload: Optional[StreamStartRequest] = None,
    camera_id: Optional[str] = Query(None),
    rtsp_url: Optional[str] = Query(None),
    fps: Optional[int] = Query(None),
    source_type: Optional[str] = Query(None),
):
    """
    POST /api/stream/start & POST /api/v1/stream/start
    Starts live camera frame ingestion (Webcam or RTSP) with real-time YOLOv11 detection,
    virtual tripwire calculation, and WebSocket alert broadcasting.
    """
    req_camera_id = (payload.camera_id if payload else None) or camera_id or "CAM-01"
    req_rtsp_url = (payload.rtsp_url if payload else None) or rtsp_url
    req_fps = (payload.fps if payload else None) or fps or 15
    req_name = (payload.camera_name if payload else None) or "North Sector Fence Alpha"
    req_sector = (payload.sector if payload else None) or "Sector-1 (North Perimeter)"
    req_source = (payload.source_type if payload else None) or source_type
    req_device_index = (payload.device_index if payload else 0) or 0

    return stream_manager.start_stream(
        camera_id=req_camera_id,
        rtsp_url=req_rtsp_url,
        fps=req_fps,
        camera_name=req_name,
        sector=req_sector,
        source_type=req_source,
        device_index=req_device_index,
    )


@router.post("/webcam/start", status_code=status.HTTP_200_OK)
def start_webcam_endpoint(payload: Optional[WebcamStartRequest] = None):
    """
    POST /api/stream/webcam/start
    Explicitly starts the live physical webcam stream for CAM-01 or specified camera.
    """
    camera_id = (payload.camera_id if payload else None) or "CAM-01"
    device_index = (payload.device_index if payload else 0) or 0
    fps = (payload.fps if payload else 15) or 15
    camera_name = (payload.camera_name if payload else None) or "North Sector Fence Alpha"
    sector = (payload.sector if payload else None) or "Sector-1 (North Perimeter)"

    return stream_manager.start_stream(
        camera_id=camera_id,
        fps=fps,
        camera_name=camera_name,
        sector=sector,
        source_type="webcam",
        device_index=device_index,
    )


@router.post("/webcam/stop", status_code=status.HTTP_200_OK)
def stop_webcam_endpoint(camera_id: str = "CAM-01"):
    """
    POST /api/stream/webcam/stop
    Stops the active physical webcam stream for CAM-01.
    """
    return stream_manager.stop_stream(camera_id=camera_id)


@router.post("/stop", status_code=status.HTTP_200_OK)
def stop_stream_endpoint(
    payload: Optional[StreamStopRequest] = None,
    camera_id: Optional[str] = Query(None),
):
    """
    POST /api/stream/stop & POST /api/v1/stream/stop
    Gracefully stops the active stream worker for a given camera or all cameras.
    """
    req_camera_id = (payload.camera_id if payload else None) or camera_id
    return stream_manager.stop_stream(camera_id=req_camera_id)


@router.get("/status", status_code=status.HTTP_200_OK)
def get_stream_status():
    """
    GET /api/stream/status & GET /api/v1/stream/status
    Retrieves live telemetry, frame processing metrics, detection counts, and reconnection states.
    """
    return stream_manager.get_all_status()


@router.get("/feed/{camera_id}")
async def stream_live_feed(camera_id: str):
    """
    GET /api/stream/feed/{camera_id} & GET /api/v1/stream/feed/{camera_id}
    Returns real-time low-latency multipart/x-mixed-replace MJPEG video stream
    directly from the active OpenCV webcam or RTSP ingestor.
    """
    ingestor = stream_manager.get_stream(camera_id)
    if not ingestor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active stream ingestor configured for {camera_id}"
        )

    # Check if stream is active and has captured at least one frame
    if ingestor.status != "streaming" or ingestor.get_latest_jpeg() is None:
        source_desc = "physical webcam" if getattr(ingestor, "is_webcam", False) else "live RTSP signal"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Camera {camera_id} is currently {ingestor.status}. Waiting for {source_desc}."
        )

    async def mjpeg_generator():
        consecutive_misses = 0
        frame_interval = 1.0 / max(1, ingestor.target_fps)

        while ingestor.is_running:
            frame_bytes = ingestor.get_latest_jpeg()
            if frame_bytes:
                consecutive_misses = 0
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(frame_bytes)).encode() + b"\r\n\r\n"
                    + frame_bytes + b"\r\n"
                )
            else:
                consecutive_misses += 1
                if ingestor.status != "streaming" and consecutive_misses > 15:
                    break

            await asyncio.sleep(frame_interval)

    return StreamingResponse(
        mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Camera-ID": camera_id,
            "X-Stream-Status": ingestor.status,
            "X-Source-Type": getattr(ingestor, "source_type", "rtsp"),
        }
    )


@router.get("/frame/{camera_id}")
def get_snapshot_frame(camera_id: str):
    """
    GET /api/stream/frame/{camera_id}
    Returns a single JPEG frame snapshot from the active stream ingestor.
    """
    ingestor = stream_manager.get_stream(camera_id)
    if not ingestor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No stream for {camera_id}")
    frame_bytes = ingestor.get_latest_jpeg()
    if not frame_bytes or ingestor.status != "streaming":
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Camera {camera_id} is {ingestor.status}")
    return Response(content=frame_bytes, media_type="image/jpeg")
