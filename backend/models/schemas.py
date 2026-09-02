from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

# Type Aliases matching TypeScript definitions
AlertSeverity = Literal['critical', 'warning', 'info']
AlertStatus = Literal['new', 'acknowledged', 'escalated_to_qrf', 'resolved', 'dismissed']
CameraStatus = Literal['online', 'offline', 'degraded']
DetectionType = Literal[
    'person',
    'vehicle',
    'intrusion',
    'line_crossing',
    'loitering',
    'weapon',
    'animal',
    'camera_offline',
]
VisionMode = Literal['optical', 'thermal', 'night_vision', 'edge_ai']
SceneType = Literal[
    'fence',
    'ravine',
    'checkpoint',
    'river',
    'desert_outpost',
    'dense_forest',
]


class BoundingBox(BaseModel):
    x: float = Field(..., description="% from left (0 - 100)")
    y: float = Field(..., description="% from top (0 - 100)")
    width: float = Field(..., description="% width (0 - 100)")
    height: float = Field(..., description="% height (0 - 100)")


class Detection(BaseModel):
    id: str
    type: DetectionType
    label: str
    confidence: float
    box: BoundingBox
    trackId: int
    speed: Optional[str] = None
    direction: Optional[str] = None
    zone: Optional[str] = None
    threatLevel: AlertSeverity


class LocationCoordinates(BaseModel):
    lat: float
    lng: float
    elevation: str
    heading: float = 0


class WireCoordinates(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class Camera(BaseModel):
    id: str
    name: str
    sector: str
    rtspUrl: str
    ipAddress: str
    port: int = 554
    resolution: str = "1080p Full HD (1920x1080)"
    fps: int = 30
    bitrate: str = "4.0 Mbps"
    status: CameraStatus = "online"
    signalStrength: int = 95
    lastHeartbeat: str = "Just now"
    onvifProfile: str = "Profile S / Profile T"
    ptzCapable: bool = True
    thermalCapable: bool = False
    location: LocationCoordinates
    fovAngle: float = 75
    activeDetections: List[Detection] = []
    sceneType: SceneType = "fence"
    wireCoordinates: Optional[WireCoordinates] = None


class CameraCreate(BaseModel):
    name: str
    sector: str = "Sector-1 (North Perimeter)"
    rtspUrl: str
    ipAddress: str
    port: int = 554
    resolution: str = "4K UltraHD (3840x2160)"
    fps: int = 30
    bitrate: str = "5.0 Mbps"
    status: CameraStatus = "online"
    signalStrength: int = 95
    lastHeartbeat: str = "Just now"
    onvifProfile: str = "Profile S / T"
    ptzCapable: bool = True
    thermalCapable: bool = False
    fovAngle: float = 75
    sceneType: SceneType = "fence"
    location: LocationCoordinates = LocationCoordinates(lat=34.085, lng=74.802, elevation="1,820m", heading=0)
    wireCoordinates: Optional[WireCoordinates] = None


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    rtspUrl: Optional[str] = None
    ipAddress: Optional[str] = None
    port: Optional[int] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    bitrate: Optional[str] = None
    status: Optional[CameraStatus] = None
    signalStrength: Optional[int] = None
    lastHeartbeat: Optional[str] = None
    onvifProfile: Optional[str] = None
    ptzCapable: Optional[bool] = None
    thermalCapable: Optional[bool] = None
    fovAngle: Optional[float] = None
    sceneType: Optional[SceneType] = None
    location: Optional[LocationCoordinates] = None
    wireCoordinates: Optional[WireCoordinates] = None
    activeDetections: Optional[List[Detection]] = None


class AlertCoordinates(BaseModel):
    lat: float
    lng: float


class Alert(BaseModel):
    id: str
    timestamp: str
    cameraId: str
    cameraName: str
    sector: str
    eventType: DetectionType
    severity: AlertSeverity
    confidence: float
    status: AlertStatus = "new"
    thumbnailUrl: str = "/snapshots/default-alert.jpg"
    description: str
    coordinates: AlertCoordinates
    qrfDispatched: bool = False
    assignedUnit: Optional[str] = None
    operatorNotes: Optional[str] = None
    acknowledgedBy: Optional[str] = None


class AlertCreate(BaseModel):
    cameraId: str
    cameraName: str
    sector: str
    eventType: DetectionType
    severity: AlertSeverity
    confidence: float
    thumbnailUrl: Optional[str] = "/snapshots/default-alert.jpg"
    description: str
    coordinates: AlertCoordinates
    qrfDispatched: Optional[bool] = False
    assignedUnit: Optional[str] = None
    operatorNotes: Optional[str] = None


class AlertActionRequest(BaseModel):
    operatorName: Optional[str] = None
    assignedUnit: Optional[str] = None
    notes: Optional[str] = None
    reason: Optional[str] = None


class SurveillanceEvent(BaseModel):
    id: str
    timestamp: str
    cameraId: str
    cameraName: str
    sector: str
    eventType: DetectionType
    confidence: float
    durationSec: int = 0
    threatLevel: AlertSeverity
    snapshotUrl: str = "/snapshots/default-event.jpg"
    description: str
    resolvedBy: Optional[str] = "Pending Triage"


class SurveillanceEventCreate(BaseModel):
    cameraId: str
    cameraName: str
    sector: str
    eventType: DetectionType
    confidence: float
    durationSec: int = 0
    threatLevel: AlertSeverity
    snapshotUrl: Optional[str] = "/snapshots/default-event.jpg"
    description: str
    resolvedBy: Optional[str] = None


class AiWorkflowStep(BaseModel):
    id: int
    title: str
    subtitle: str
    icon: str
    description: str
    techSpec: str
    status: Literal['active', 'standby', 'processing']
    metrics: str
    color: str


class User(BaseModel):
    id: str
    badgeId: str
    name: str
    role: str
    clearanceLevel: str
    team: str
    unit: str
    avatar: str


class SystemStats(BaseModel):
    totalCameras: int
    activeCameras: int
    offlineCameras: int
    degradedCameras: int
    intrusionAlertsToday: int
    criticalAlerts: int
    warningAlerts: int
    infoAlerts: int
    qrfUnitsDeployed: int
    edgeAiInferenceFps: int
    systemUptime: str
    networkBandwidth: str


class AiModelConfig(BaseModel):
    modelName: str = "YOLOv11-BorderSurveillance-v2.4"
    version: str = "2.4.1-DefenseEdition"
    framework: str = "PyTorch / TensorRT 10.2 / ONNX"
    confidenceThreshold: float = 0.75
    iouThreshold: float = 0.45
    inputResolution: str = "1280x1280"
    targetFps: int = 30
    enableThermalFusion: bool = True
    enableTripwire: bool = True
    enableWeaponDetection: bool = True
    enableLoiteringDetection: bool = True
    edgeNodeId: str = "EDGE-NODE-NORTH-04"
    backendApiUrl: str = "http://localhost:8000/api/v1"
    websocketUrl: str = "ws://localhost:8000/ws/alerts"
    soundAlertsEnabled: bool = True
    autoAcknowledgeLowConfidence: bool = False
    qrfDispatchChannel: str = "SECURE_TAC_MESH_CH7"


class RtspTestRequest(BaseModel):
    rtspUrl: str


class RtspTestResponse(BaseModel):
    success: bool
    latencyMs: int
    resolution: str
    codec: str
    message: str
    fps: Optional[float] = None
    bitrate: Optional[str] = None
    status: Optional[str] = None
    hints: Optional[List[str]] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    platform: str
    database: str
    activeCameras: int
    activeAlerts: int


class NormalizedBBox(BaseModel):
    x: float
    y: float
    w: float
    h: float


class AiDetectionItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    class_name: str = Field(..., serialization_alias="class", alias="class")
    confidence: float
    bbox: NormalizedBBox


class AiDetectionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    detections: List[AiDetectionItem]
    model: Optional[str] = "yolo11n.pt"
    inference_time_ms: Optional[float] = None
    total_detections: Optional[int] = None


