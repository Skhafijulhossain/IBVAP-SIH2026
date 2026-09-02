import asyncio
from typing import Dict, Optional, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse

from ..ai.rtsp_stream import RTSPStreamIngestor

router = APIRouter(prefix="/stream", tags=["Live RTSP Stream & YOLOv11"])


class StreamStartRequest(BaseModel):
    camera_id: Optional[str] = "CAM-01"
    rtsp_url: Optional[str] = "rtsp://127.0.0.1:8554/cam1"
    fps: Optional[int] = 15
    camera_name: Optional[str] = "North Sector Fence Alpha"
    sector: Optional[str] = "Sector-1 (North Perimeter)"


class StreamStopRequest(BaseModel):
    camera_id: Optional[str] = None  # None or "all" stops all active streams


class StreamManager:
    """Singleton managing active RTSP ingestors across all border CCTV nodes."""

    def __init__(self):
        self.active_streams: Dict[str, RTSPStreamIngestor] = {}

    def get_stream(self, camera_id: str = "CAM-01") -> Optional[RTSPStreamIngestor]:
        """Returns the active stream ingestor or auto-starts default CAM-01."""
        if camera_id in self.active_streams:
            return self.active_streams[camera_id]
        if camera_id == "CAM-01":
            self.start_stream(camera_id="CAM-01")
            return self.active_streams.get("CAM-01")
        return None

    def start_stream(
        self,
        camera_id: str = "CAM-01",
        rtsp_url: Optional[str] = None,
        fps: int = 15,
        camera_name: str = "North Sector Fence Alpha",
        sector: str = "Sector-1 (North Perimeter)",
    ) -> Dict[str, Any]:
        if camera_id in self.active_streams:
            self.active_streams[camera_id].stop()

        ingestor = RTSPStreamIngestor(
            camera_id=camera_id,
            rtsp_url=rtsp_url,
            target_fps=fps,
            camera_name=camera_name,
            sector=sector,
        )
        ingestor.start()
        self.active_streams[camera_id] = ingestor

        return {
            "status": "started",
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
def start_rtsp_stream(
    payload: Optional[StreamStartRequest] = None,
    camera_id: Optional[str] = Query(None),
    rtsp_url: Optional[str] = Query(None),
    fps: Optional[int] = Query(None),
):
    """
    POST /api/stream/start & POST /api/v1/stream/start
    Starts live RTSP stream frame ingestion with real-time YOLOv11 threat detection,
    virtual tripwire calculation, and WebSocket alert broadcasting.
    """
    req_camera_id = (payload.camera_id if payload else None) or camera_id or "CAM-01"
    req_rtsp_url = (payload.rtsp_url if payload else None) or rtsp_url or ("rtsp://127.0.0.1:8554/cam1" if req_camera_id == "CAM-01" else "rtsp://admin:secure_pass@10.240.12.101:554/stream1")
    req_fps = (payload.fps if payload else None) or fps or 15
    req_name = (payload.camera_name if payload else None) or "North Sector Fence Alpha"
    req_sector = (payload.sector if payload else None) or "Sector-1 (North Perimeter)"

    return stream_manager.start_stream(
        camera_id=req_camera_id,
        rtsp_url=req_rtsp_url,
        fps=req_fps,
        camera_name=req_name,
        sector=req_sector,
    )


@router.post("/stop", status_code=status.HTTP_200_OK)
def stop_rtsp_stream(
    payload: Optional[StreamStopRequest] = None,
    camera_id: Optional[str] = Query(None),
):
    """
    POST /api/stream/stop & POST /api/v1/stream/stop
    Gracefully stops the active RTSP frame worker for a given camera or all cameras.
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
    directly from the active OpenCV RTSP ingestor.
    """
    ingestor = stream_manager.get_stream(camera_id)
    if not ingestor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active stream ingestor configured for {camera_id}"
        )

    # Check if stream is active and has captured at least one frame
    if ingestor.status != "streaming" or ingestor.get_latest_jpeg() is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Camera {camera_id} is currently {ingestor.status}. Waiting for live RTSP signal."
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
        }
    )


@router.get("/frame/{camera_id}")
def get_snapshot_frame(camera_id: str):
    """
    GET /api/stream/frame/{camera_id}
    Returns a single JPEG frame snapshot from the active RTSP ingestor.
    """
    ingestor = stream_manager.get_stream(camera_id)
    if not ingestor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No stream for {camera_id}")
    frame_bytes = ingestor.get_latest_jpeg()
    if not frame_bytes or ingestor.status != "streaming":
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Camera {camera_id} is {ingestor.status}")
    return Response(content=frame_bytes, media_type="image/jpeg")
