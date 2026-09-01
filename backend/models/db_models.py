import json
from sqlalchemy import Column, String, Integer, Float, Boolean, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class CameraModel(Base):
    __tablename__ = "cameras"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    sector = Column(String(100), nullable=False)
    rtsp_url = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=False)
    port = Column(Integer, default=554)
    resolution = Column(String(50), default="1080p Full HD (1920x1080)")
    fps = Column(Integer, default=30)
    bitrate = Column(String(50), default="4.0 Mbps")
    status = Column(String(30), default="online")
    signal_strength = Column(Integer, default=95)
    last_heartbeat = Column(String(50), default="Just now")
    onvif_profile = Column(String(100), default="Profile S / Profile T")
    ptz_capable = Column(Boolean, default=True)
    thermal_capable = Column(Boolean, default=False)
    fov_angle = Column(Float, default=75.0)
    scene_type = Column(String(50), default="fence")
    location_json = Column(Text, default="{}")
    wire_coordinates_json = Column(Text, nullable=True)
    active_detections_json = Column(Text, default="[]")

    def to_dict(self):
        location = json.loads(self.location_json) if self.location_json else {
            "lat": 34.085,
            "lng": 74.802,
            "elevation": "1,820m",
            "heading": 0
        }
        wire_coordinates = json.loads(self.wire_coordinates_json) if self.wire_coordinates_json else None
        active_detections = json.loads(self.active_detections_json) if self.active_detections_json else []

        return {
            "id": self.id,
            "name": self.name,
            "sector": self.sector,
            "rtspUrl": self.rtsp_url,
            "ipAddress": self.ip_address,
            "port": self.port,
            "resolution": self.resolution,
            "fps": self.fps,
            "bitrate": self.bitrate,
            "status": self.status,
            "signalStrength": self.signal_strength,
            "lastHeartbeat": self.last_heartbeat,
            "onvifProfile": self.onvif_profile,
            "ptzCapable": self.ptz_capable,
            "thermalCapable": self.thermal_capable,
            "fovAngle": self.fov_angle,
            "sceneType": self.scene_type,
            "location": location,
            "wireCoordinates": wire_coordinates,
            "activeDetections": active_detections,
        }


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(String(100), nullable=False)
    camera_id = Column(String(50), nullable=False, index=True)
    camera_name = Column(String(150), nullable=False)
    sector = Column(String(100), nullable=False)
    event_type = Column(String(50), nullable=False)
    severity = Column(String(30), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    status = Column(String(50), default="new", index=True)
    thumbnail_url = Column(String(255), default="/snapshots/default-alert.jpg")
    description = Column(Text, nullable=False)
    coordinates_json = Column(Text, default="{}")
    qrf_dispatched = Column(Boolean, default=False)
    assigned_unit = Column(String(150), nullable=True)
    operator_notes = Column(Text, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)

    def to_dict(self):
        coordinates = json.loads(self.coordinates_json) if self.coordinates_json else {"lat": 34.08, "lng": 74.79}
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "cameraId": self.camera_id,
            "cameraName": self.camera_name,
            "sector": self.sector,
            "eventType": self.event_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "status": self.status,
            "thumbnailUrl": self.thumbnail_url,
            "description": self.description,
            "coordinates": coordinates,
            "qrfDispatched": self.qrf_dispatched,
            "assignedUnit": self.assigned_unit,
            "operatorNotes": self.operator_notes,
            "acknowledgedBy": self.acknowledged_by,
        }


class EventModel(Base):
    __tablename__ = "events"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(String(100), nullable=False)
    camera_id = Column(String(50), nullable=False, index=True)
    camera_name = Column(String(150), nullable=False)
    sector = Column(String(100), nullable=False)
    event_type = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    duration_sec = Column(Integer, default=0)
    threat_level = Column(String(30), nullable=False, index=True)
    snapshot_url = Column(String(255), default="/snapshots/default-event.jpg")
    description = Column(Text, nullable=False)
    resolved_by = Column(String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "cameraId": self.camera_id,
            "cameraName": self.camera_name,
            "sector": self.sector,
            "eventType": self.event_type,
            "confidence": self.confidence,
            "durationSec": self.duration_sec,
            "threatLevel": self.threat_level,
            "snapshotUrl": self.snapshot_url,
            "description": self.description,
            "resolvedBy": self.resolved_by,
        }


class AiConfigModel(Base):
    __tablename__ = "ai_config"

    id = Column(Integer, primary_key=True)
    config_json = Column(Text, nullable=False)

    def to_dict(self):
        return json.loads(self.config_json) if self.config_json else {}
