import json
from sqlalchemy.orm import Session
from .session import engine, SessionLocal
from ..models.db_models import Base, CameraModel, AlertModel, EventModel, AiConfigModel

INITIAL_CAMERAS_DATA = [
    {
        "id": "CAM-01",
        "name": "North Sector Fence Alpha",
        "sector": "Sector-1 (North Perimeter)",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.101:554/stream1",
        "ip_address": "10.240.12.101",
        "port": 554,
        "resolution": "4K UltraHD (3840x2160)",
        "fps": 30,
        "bitrate": "5.8 Mbps",
        "status": "online",
        "signal_strength": 98,
        "last_heartbeat": "2s ago",
        "onvif_profile": "Profile S / Profile T",
        "ptz_capable": True,
        "thermal_capable": True,
        "fov_angle": 75.0,
        "scene_type": "fence",
        "location": {"lat": 34.0837, "lng": 74.7973, "elevation": "1,840m", "heading": 350},
        "wire_coordinates": {"x1": 5, "y1": 70, "x2": 95, "y2": 65},
        "active_detections": [
            {
                "id": "det-101",
                "type": "person",
                "label": "Suspicious Individual",
                "confidence": 0.94,
                "box": {"x": 42, "y": 38, "width": 14, "height": 32},
                "trackId": 1042,
                "speed": "1.4 m/s",
                "direction": "South-Bound (Towards Fence)",
                "zone": "Buffer Zone B",
                "threatLevel": "critical",
            },
            {
                "id": "det-102",
                "type": "line_crossing",
                "label": "Virtual Tripwire Breach Imminent",
                "confidence": 0.89,
                "box": {"x": 38, "y": 35, "width": 22, "height": 40},
                "trackId": 1042,
                "speed": "1.4 m/s",
                "zone": "Critical Perimeter Line",
                "threatLevel": "critical",
            }
        ]
    },
    {
        "id": "CAM-02",
        "name": "Western Ravine Gap Beta",
        "sector": "Sector-2 (West Gorge)",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.102:554/stream1",
        "ip_address": "10.240.12.102",
        "port": 554,
        "resolution": "1080p Full HD (1920x1080)",
        "fps": 25,
        "bitrate": "3.4 Mbps",
        "status": "online",
        "signal_strength": 86,
        "last_heartbeat": "1s ago",
        "onvif_profile": "Profile S",
        "ptz_capable": True,
        "thermal_capable": True,
        "fov_angle": 60.0,
        "scene_type": "ravine",
        "location": {"lat": 34.0912, "lng": 74.7821, "elevation": "2,110m", "heading": 275},
        "wire_coordinates": {"x1": 10, "y1": 80, "x2": 90, "y2": 72},
        "active_detections": [
            {
                "id": "det-201",
                "type": "vehicle",
                "label": "Unregistered 4x4 Vehicle",
                "confidence": 0.91,
                "box": {"x": 62, "y": 48, "width": 26, "height": 28},
                "trackId": 2088,
                "speed": "34 km/h",
                "direction": "East-Bound along Unpaved Trail",
                "zone": "No-Vehicle Buffer Zone",
                "threatLevel": "warning",
            }
        ]
    },
    {
        "id": "CAM-03",
        "name": "Checkpoint Alpha Highway Gate",
        "sector": "Sector-3 (Transit Outpost)",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.103:554/stream1",
        "ip_address": "10.240.12.103",
        "port": 554,
        "resolution": "4K UltraHD (3840x2160)",
        "fps": 30,
        "bitrate": "6.2 Mbps",
        "status": "online",
        "signal_strength": 95,
        "last_heartbeat": "4s ago",
        "onvif_profile": "Profile T / G",
        "ptz_capable": False,
        "thermal_capable": False,
        "fov_angle": 85.0,
        "scene_type": "checkpoint",
        "location": {"lat": 34.0754, "lng": 74.8105, "elevation": "1,720m", "heading": 180},
        "wire_coordinates": {"x1": 0, "y1": 60, "x2": 100, "y2": 60},
        "active_detections": [
            {
                "id": "det-301",
                "type": "person",
                "label": "Personnel Check Validated",
                "confidence": 0.97,
                "box": {"x": 22, "y": 45, "width": 12, "height": 28},
                "trackId": 3012,
                "speed": "0.8 m/s",
                "zone": "Inspection Bay 1",
                "threatLevel": "info",
            }
        ]
    },
    {
        "id": "CAM-04",
        "name": "Perimeter River Bed Delta",
        "sector": "Sector-4 (Riverine Boundary)",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.104:554/stream1",
        "ip_address": "10.240.12.104",
        "port": 554,
        "resolution": "1080p Full HD (1920x1080)",
        "fps": 28,
        "bitrate": "4.1 Mbps",
        "status": "online",
        "signal_strength": 78,
        "last_heartbeat": "3s ago",
        "onvif_profile": "Profile S",
        "ptz_capable": True,
        "thermal_capable": True,
        "fov_angle": 70.0,
        "scene_type": "river",
        "location": {"lat": 34.0689, "lng": 74.8290, "elevation": "1,650m", "heading": 120},
        "wire_coordinates": {"x1": 5, "y1": 50, "x2": 95, "y2": 55},
        "active_detections": [
            {
                "id": "det-401",
                "type": "intrusion",
                "label": "Watercraft / Swimmer Heat Signature",
                "confidence": 0.88,
                "box": {"x": 50, "y": 52, "width": 18, "height": 20},
                "trackId": 4099,
                "speed": "2.1 m/s",
                "direction": "Crossing Sandbank",
                "zone": "Restricted Waterway",
                "threatLevel": "critical",
            }
        ]
    },
    {
        "id": "CAM-05",
        "name": "Dense Forest Outpost Echo",
        "sector": "Sector-5 (Alpine Forest)",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.105:554/stream1",
        "ip_address": "10.240.12.105",
        "port": 554,
        "resolution": "1080p Full HD (1920x1080)",
        "fps": 20,
        "bitrate": "2.9 Mbps",
        "status": "degraded",
        "signal_strength": 48,
        "last_heartbeat": "18s ago",
        "onvif_profile": "Profile S",
        "ptz_capable": False,
        "thermal_capable": True,
        "fov_angle": 55.0,
        "scene_type": "dense_forest",
        "location": {"lat": 34.0991, "lng": 74.8450, "elevation": "2,350m", "heading": 45},
        "wire_coordinates": None,
        "active_detections": []
    },
    {
        "id": "CAM-06",
        "name": "Mountain Pass Foxtrot",
        "sector": "Sector-6 (High Altitude Ridgeline)",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.106:554/stream1",
        "ip_address": "10.240.12.106",
        "port": 554,
        "resolution": "4K UltraHD (3840x2160)",
        "fps": 30,
        "bitrate": "5.2 Mbps",
        "status": "online",
        "signal_strength": 92,
        "last_heartbeat": "2s ago",
        "onvif_profile": "Profile S / T",
        "ptz_capable": True,
        "thermal_capable": True,
        "fov_angle": 65.0,
        "scene_type": "ravine",
        "location": {"lat": 34.1150, "lng": 74.8620, "elevation": "2,900m", "heading": 15},
        "wire_coordinates": None,
        "active_detections": []
    },
    {
        "id": "CAM-07",
        "name": "Eastern Desert Perimeter 07",
        "sector": "Sector-7 (Eastern Dunes)",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.107:554/stream1",
        "ip_address": "10.240.12.107",
        "port": 554,
        "resolution": "1080p Full HD (1920x1080)",
        "fps": 0,
        "bitrate": "0.0 Mbps",
        "status": "offline",
        "signal_strength": 0,
        "last_heartbeat": "14 mins ago",
        "onvif_profile": "Profile S",
        "ptz_capable": False,
        "thermal_capable": False,
        "fov_angle": 60.0,
        "scene_type": "desert_outpost",
        "location": {"lat": 34.0520, "lng": 74.8810, "elevation": "1,490m", "heading": 90},
        "wire_coordinates": None,
        "active_detections": []
    },
    {
        "id": "CAM-08",
        "name": "Radar Watchtower 08",
        "sector": "Sector-8 (Command Perimeter)",
        "rtsp_url": "rtsp://admin:secure_pass@10.240.12.108:554/stream1",
        "ip_address": "10.240.12.108",
        "port": 554,
        "resolution": "4K UltraHD (3840x2160)",
        "fps": 30,
        "bitrate": "6.0 Mbps",
        "status": "online",
        "signal_strength": 99,
        "last_heartbeat": "1s ago",
        "onvif_profile": "Profile S / Profile T",
        "ptz_capable": True,
        "thermal_capable": True,
        "fov_angle": 90.0,
        "scene_type": "checkpoint",
        "location": {"lat": 34.0710, "lng": 74.7650, "elevation": "1,950m", "heading": 210},
        "wire_coordinates": None,
        "active_detections": []
    }
]

INITIAL_ALERTS_DATA = [
    {
        "id": "ALT-8901",
        "timestamp": "Just now",
        "camera_id": "CAM-01",
        "camera_name": "North Sector Fence Alpha",
        "sector": "Sector-1 (North Perimeter)",
        "event_type": "intrusion",
        "severity": "critical",
        "confidence": 0.94,
        "status": "new",
        "thumbnail_url": "/snapshots/intrusion-fence-01.jpg",
        "description": "Unauthorized human movement detected within 15 meters of primary fence line. Approaching south-bound.",
        "coordinates": {"lat": 34.0837, "lng": 74.7973},
        "qrf_dispatched": True,
        "assigned_unit": "QRF Delta-3 (ETA 3 mins)"
    },
    {
        "id": "ALT-8902",
        "timestamp": "2 mins ago",
        "camera_id": "CAM-04",
        "camera_name": "Perimeter River Bed Delta",
        "sector": "Sector-4 (Riverine Boundary)",
        "event_type": "line_crossing",
        "severity": "critical",
        "confidence": 0.88,
        "status": "new",
        "thumbnail_url": "/snapshots/river-crossing.jpg",
        "description": "Tripwire Line Crossing Event: Suspicious heat signature crossing demarcated sandbank zone.",
        "coordinates": {"lat": 34.0689, "lng": 74.8290},
        "qrf_dispatched": False
    },
    {
        "id": "ALT-8903",
        "timestamp": "7 mins ago",
        "camera_id": "CAM-02",
        "camera_name": "Western Ravine Gap Beta",
        "sector": "Sector-2 (West Gorge)",
        "event_type": "vehicle",
        "severity": "warning",
        "confidence": 0.91,
        "status": "acknowledged",
        "thumbnail_url": "/snapshots/unregistered-vehicle.jpg",
        "description": "Unregistered 4x4 pickup truck navigating unpaved perimeter track without transponder broadcast.",
        "coordinates": {"lat": 34.0912, "lng": 74.7821},
        "qrf_dispatched": False,
        "acknowledged_by": "Officer Rathore"
    },
    {
        "id": "ALT-8904",
        "timestamp": "14 mins ago",
        "camera_id": "CAM-07",
        "camera_name": "Eastern Desert Perimeter 07",
        "sector": "Sector-7 (Eastern Dunes)",
        "event_type": "camera_offline",
        "severity": "warning",
        "confidence": 1.0,
        "status": "acknowledged",
        "thumbnail_url": "/snapshots/camera-offline.jpg",
        "description": "RTSP Signal Timeout: Edge gateway lost RTSP feed connectivity. Possible hardware fault or wire cut.",
        "coordinates": {"lat": 34.0520, "lng": 74.8810},
        "qrf_dispatched": False,
        "acknowledged_by": "Eng. Rahul Verma"
    },
    {
        "id": "ALT-8905",
        "timestamp": "28 mins ago",
        "camera_id": "CAM-03",
        "camera_name": "Checkpoint Alpha Highway Gate",
        "sector": "Sector-3 (Transit Outpost)",
        "event_type": "person",
        "severity": "info",
        "confidence": 0.97,
        "status": "resolved",
        "thumbnail_url": "/snapshots/checkpoint-person.jpg",
        "description": "Routine Border Guard Shift Change verification completed by YOLOv11 Face/ID pipeline.",
        "coordinates": {"lat": 34.0754, "lng": 74.8105},
        "qrf_dispatched": False,
        "operator_notes": "Routine patrol verified. Cleared by Watch Commander."
    },
    {
        "id": "ALT-8906",
        "timestamp": "42 mins ago",
        "camera_id": "CAM-05",
        "camera_name": "Dense Forest Outpost Echo",
        "sector": "Sector-5 (Alpine Forest)",
        "event_type": "loitering",
        "severity": "info",
        "confidence": 0.82,
        "status": "resolved",
        "thumbnail_url": "/snapshots/wildlife-forest.jpg",
        "description": "Thermal blob loitering near trees classified as stag/wild boar. Threat level negated.",
        "coordinates": {"lat": 34.0991, "lng": 74.8450},
        "qrf_dispatched": False,
        "operator_notes": "Natural wildlife movement."
    }
]

INITIAL_EVENTS_DATA = [
    {
        "id": "EVT-5049",
        "timestamp": "2026-09-02 01:44:12 IST",
        "camera_id": "CAM-01",
        "camera_name": "North Sector Fence Alpha",
        "sector": "Sector-1 (North Perimeter)",
        "event_type": "person",
        "confidence": 0.94,
        "duration_sec": 18,
        "threat_level": "critical",
        "snapshot_url": "/snapshots/evt-person-fence.jpg",
        "description": "Individual spotted walking in low-crawl stance towards perimeter sensor fence.",
        "resolved_by": "Pending Triage"
    },
    {
        "id": "EVT-5048",
        "timestamp": "2026-09-02 01:38:05 IST",
        "camera_id": "CAM-04",
        "camera_name": "Perimeter River Bed Delta",
        "sector": "Sector-4 (Riverine Boundary)",
        "event_type": "line_crossing",
        "confidence": 0.88,
        "duration_sec": 42,
        "threat_level": "critical",
        "snapshot_url": "/snapshots/evt-river-cross.jpg",
        "description": "Crossing event triggered across demarcated waterway boundary line.",
        "resolved_by": "QRF Alpha En-route"
    },
    {
        "id": "EVT-5047",
        "timestamp": "2026-09-02 01:25:50 IST",
        "camera_id": "CAM-02",
        "camera_name": "Western Ravine Gap Beta",
        "sector": "Sector-2 (West Gorge)",
        "event_type": "vehicle",
        "confidence": 0.91,
        "duration_sec": 65,
        "threat_level": "warning",
        "snapshot_url": "/snapshots/evt-vehicle.jpg",
        "description": "High-speed vehicle moving without headlights in restricted ravine zone.",
        "resolved_by": "Capt. Ananya Sharma"
    },
    {
        "id": "EVT-5046",
        "timestamp": "2026-09-02 01:12:00 IST",
        "camera_id": "CAM-07",
        "camera_name": "Eastern Desert Perimeter 07",
        "sector": "Sector-7 (Eastern Dunes)",
        "event_type": "camera_offline",
        "confidence": 1.0,
        "duration_sec": 0,
        "threat_level": "warning",
        "snapshot_url": "/snapshots/evt-offline.jpg",
        "description": "Ping packet loss reached 100% on switch port 07. Camera node marked offline.",
        "resolved_by": "Eng. Rahul Verma"
    },
    {
        "id": "EVT-5045",
        "timestamp": "2026-09-02 00:54:19 IST",
        "camera_id": "CAM-03",
        "camera_name": "Checkpoint Alpha Highway Gate",
        "sector": "Sector-3 (Transit Outpost)",
        "event_type": "vehicle",
        "confidence": 0.96,
        "duration_sec": 120,
        "threat_level": "info",
        "snapshot_url": "/snapshots/evt-convoy.jpg",
        "description": "Authorized logistics convoy cleared through ANPR license recognition gate.",
        "resolved_by": "Automated Gateway"
    },
    {
        "id": "EVT-5044",
        "timestamp": "2026-09-02 00:33:41 IST",
        "camera_id": "CAM-05",
        "camera_name": "Dense Forest Outpost Echo",
        "sector": "Sector-5 (Alpine Forest)",
        "event_type": "loitering",
        "confidence": 0.84,
        "duration_sec": 110,
        "threat_level": "info",
        "snapshot_url": "/snapshots/evt-wildlife.jpg",
        "description": "Forest thermal motion filtered out by Edge AI wildlife classifier.",
        "resolved_by": "AI Engine Auto-Filter"
    }
]

DEFAULT_AI_CONFIG_DATA = {
    "modelName": "YOLOv11-BorderSurveillance-v2.4",
    "version": "2.4.1-DefenseEdition",
    "framework": "PyTorch / TensorRT 10.2 / ONNX",
    "confidenceThreshold": 0.75,
    "iouThreshold": 0.45,
    "inputResolution": "1280x1280",
    "targetFps": 30,
    "enableThermalFusion": True,
    "enableTripwire": True,
    "enableWeaponDetection": True,
    "enableLoiteringDetection": True,
    "edgeNodeId": "EDGE-NODE-NORTH-04",
    "backendApiUrl": "http://localhost:8000/api/v1",
    "websocketUrl": "ws://localhost:8000/ws/alerts",
    "soundAlertsEnabled": True,
    "autoAcknowledgeLowConfidence": False,
    "qrfDispatchChannel": "SECURE_TAC_MESH_CH7"
}


def init_db():
    """Initializes tables and seeds initial realistic mock dataset."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # Seed Cameras
        if db.query(CameraModel).count() == 0:
            for cam in INITIAL_CAMERAS_DATA:
                db_cam = CameraModel(
                    id=cam["id"],
                    name=cam["name"],
                    sector=cam["sector"],
                    rtsp_url=cam["rtsp_url"],
                    ip_address=cam["ip_address"],
                    port=cam["port"],
                    resolution=cam["resolution"],
                    fps=cam["fps"],
                    bitrate=cam["bitrate"],
                    status=cam["status"],
                    signal_strength=cam["signal_strength"],
                    last_heartbeat=cam["last_heartbeat"],
                    onvif_profile=cam["onvif_profile"],
                    ptz_capable=cam["ptz_capable"],
                    thermal_capable=cam["thermal_capable"],
                    fov_angle=cam["fov_angle"],
                    scene_type=cam["scene_type"],
                    location_json=json.dumps(cam["location"]),
                    wire_coordinates_json=json.dumps(cam["wire_coordinates"]) if cam.get("wire_coordinates") else None,
                    active_detections_json=json.dumps(cam.get("active_detections", [])),
                )
                db.add(db_cam)

        # Seed Alerts
        if db.query(AlertModel).count() == 0:
            for alt in INITIAL_ALERTS_DATA:
                db_alt = AlertModel(
                    id=alt["id"],
                    timestamp=alt["timestamp"],
                    camera_id=alt["camera_id"],
                    camera_name=alt["camera_name"],
                    sector=alt["sector"],
                    event_type=alt["event_type"],
                    severity=alt["severity"],
                    confidence=alt["confidence"],
                    status=alt["status"],
                    thumbnail_url=alt["thumbnail_url"],
                    description=alt["description"],
                    coordinates_json=json.dumps(alt["coordinates"]),
                    qrf_dispatched=alt["qrf_dispatched"],
                    assigned_unit=alt.get("assigned_unit"),
                    operator_notes=alt.get("operator_notes"),
                    acknowledged_by=alt.get("acknowledged_by"),
                )
                db.add(db_alt)

        # Seed Events
        if db.query(EventModel).count() == 0:
            for evt in INITIAL_EVENTS_DATA:
                db_evt = EventModel(
                    id=evt["id"],
                    timestamp=evt["timestamp"],
                    camera_id=evt["camera_id"],
                    camera_name=evt["camera_name"],
                    sector=evt["sector"],
                    event_type=evt["event_type"],
                    confidence=evt["confidence"],
                    duration_sec=evt["duration_sec"],
                    threat_level=evt["threat_level"],
                    snapshot_url=evt["snapshot_url"],
                    description=evt["description"],
                    resolved_by=evt.get("resolved_by"),
                )
                db.add(db_evt)

        # Seed AI Config
        if db.query(AiConfigModel).count() == 0:
            db_cfg = AiConfigModel(id=1, config_json=json.dumps(DEFAULT_AI_CONFIG_DATA))
            db.add(db_cfg)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[InitDB Error] Failed to seed database: {e}")
    finally:
        db.close()
