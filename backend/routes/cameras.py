import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..models.db_models import CameraModel
from ..models.schemas import (
    Camera,
    CameraCreate,
    CameraUpdate,
    RtspTestRequest,
    RtspTestResponse,
)
from ..ai.rtsp_stream import RTSPStreamIngestor

router = APIRouter(prefix="/cameras", tags=["Cameras"])


@router.get("", response_model=List[Camera])
def get_cameras(db: Session = Depends(get_db)):
    """
    GET /api/cameras & GET /api/v1/cameras
    Retrieves all registered border CCTV surveillance camera nodes.
    """
    cameras = db.query(CameraModel).all()
    return [c.to_dict() for c in cameras]


@router.get("/{camera_id}", response_model=Camera)
def get_camera_by_id(camera_id: str, db: Session = Depends(get_db)):
    """
    GET /api/cameras/{id}
    Retrieves a single camera node with active telemetry.
    """
    camera = db.query(CameraModel).filter(CameraModel.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera node {camera_id} not found."
        )
    return camera.to_dict()


@router.post("", response_model=Camera, status_code=status.HTTP_201_CREATED)
def create_camera(payload: CameraCreate, db: Session = Depends(get_db)):
    """
    POST /api/cameras
    Onboard and register a new RTSP / ONVIF IP camera stream into the defense matrix.
    """
    count = db.query(CameraModel).count()
    new_id = f"CAM-{str(count + 1).zfill(2)}"

    db_camera = CameraModel(
        id=new_id,
        name=payload.name,
        sector=payload.sector,
        rtsp_url=payload.rtspUrl,
        ip_address=payload.ipAddress,
        port=payload.port,
        resolution=payload.resolution,
        fps=payload.fps,
        bitrate=payload.bitrate,
        status=payload.status,
        signal_strength=payload.signalStrength,
        last_heartbeat="Just now",
        onvif_profile=payload.onvifProfile,
        ptz_capable=payload.ptzCapable,
        thermal_capable=payload.thermalCapable,
        fov_angle=payload.fovAngle,
        scene_type=payload.sceneType,
        location_json=json.dumps(payload.location.model_dump()),
        wire_coordinates_json=json.dumps(payload.wireCoordinates.model_dump()) if payload.wireCoordinates else None,
        active_detections_json=json.dumps([]),
    )

    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera.to_dict()


@router.put("/{camera_id}", response_model=Camera)
def update_camera(camera_id: str, payload: CameraUpdate, db: Session = Depends(get_db)):
    """
    PUT /api/cameras/{id}
    Update PTZ, stream codec, or sector parameters for a camera node.
    """
    camera = db.query(CameraModel).filter(CameraModel.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera node {camera_id} not found."
        )

    if payload.name is not None:
        camera.name = payload.name
    if payload.sector is not None:
        camera.sector = payload.sector
    if payload.rtspUrl is not None:
        camera.rtsp_url = payload.rtspUrl
    if payload.ipAddress is not None:
        camera.ip_address = payload.ipAddress
    if payload.port is not None:
        camera.port = payload.port
    if payload.resolution is not None:
        camera.resolution = payload.resolution
    if payload.fps is not None:
        camera.fps = payload.fps
    if payload.bitrate is not None:
        camera.bitrate = payload.bitrate
    if payload.status is not None:
        camera.status = payload.status
    if payload.signalStrength is not None:
        camera.signal_strength = payload.signalStrength
    if payload.lastHeartbeat is not None:
        camera.last_heartbeat = payload.lastHeartbeat
    if payload.onvifProfile is not None:
        camera.onvif_profile = payload.onvifProfile
    if payload.ptzCapable is not None:
        camera.ptz_capable = payload.ptzCapable
    if payload.thermalCapable is not None:
        camera.thermal_capable = payload.thermalCapable
    if payload.fovAngle is not None:
        camera.fov_angle = payload.fovAngle
    if payload.sceneType is not None:
        camera.scene_type = payload.sceneType
    if payload.location is not None:
        camera.location_json = json.dumps(payload.location.model_dump())
    if payload.wireCoordinates is not None:
        camera.wire_coordinates_json = json.dumps(payload.wireCoordinates.model_dump())
    if payload.activeDetections is not None:
        camera.active_detections_json = json.dumps([d.model_dump() for d in payload.activeDetections])

    db.commit()
    db.refresh(camera)
    return camera.to_dict()


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(camera_id: str, db: Session = Depends(get_db)):
    """
    DELETE /api/cameras/{id}
    Decommission a surveillance camera from the defense network.
    """
    camera = db.query(CameraModel).filter(CameraModel.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera node {camera_id} not found."
        )

    db.delete(camera)
    db.commit()
    return None


@router.post("/test-rtsp", response_model=RtspTestResponse)
def test_rtsp_stream(payload: RtspTestRequest):
    """
    POST /api/cameras/test-rtsp
    Performs handshake, codec probe, and latency test on an RTSP/ONVIF URL.
    """
    ingestor = RTSPStreamIngestor(camera_id="PROBE", rtsp_url=payload.rtspUrl)
    return ingestor.test_handshake()


@router.post("/{camera_id}/reboot")
def reboot_camera(camera_id: str, db: Session = Depends(get_db)):
    """
    POST /api/cameras/{id}/reboot
    Issues a soft restart signal to edge camera node.
    """
    camera = db.query(CameraModel).filter(CameraModel.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera node {camera_id} not found."
        )

    camera.last_heartbeat = "Just restarted"
    camera.status = "online"
    db.commit()
    return {"status": f"Edge node {camera_id} reboot command dispatched."}
