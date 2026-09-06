export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'new' | 'acknowledged' | 'escalated_to_qrf' | 'resolved' | 'dismissed';
export type CameraStatus = 'online' | 'offline' | 'degraded';
export type DetectionType = 'person' | 'vehicle' | 'intrusion' | 'line_crossing' | 'loitering' | 'weapon' | 'animal' | 'camera_offline';
export type VisionMode = 'optical' | 'thermal' | 'night_vision' | 'edge_ai';

export interface BoundingBox {
  x: number;      // % from left (0 - 100)
  y: number;      // % from top (0 - 100)
  width: number;  // % width (0 - 100)
  height: number; // % height (0 - 100)
}

export interface Detection {
  id: string;
  type: DetectionType;
  label: string;
  confidence: number;
  box: BoundingBox;
  trackId: number;
  speed?: string;
  direction?: string;
  zone?: string;
  threatLevel: AlertSeverity;
}

export interface Camera {
  id: string;
  name: string;
  sector: string;
  rtspUrl: string;
  ipAddress: string;
  port: number;
  resolution: string;
  fps: number;
  bitrate: string;
  status: CameraStatus;
  signalStrength: number; // 0 - 100%
  lastHeartbeat: string;
  onvifProfile: string;
  ptzCapable: boolean;
  thermalCapable: boolean;
  location: {
    lat: number;
    lng: number;
    elevation: string;
    heading: number; // degrees 0-360
  };
  fovAngle: number; // e.g. 65 degrees
  activeDetections: Detection[];
  sceneType: 'fence' | 'ravine' | 'checkpoint' | 'river' | 'desert_outpost' | 'dense_forest';
  wireCoordinates?: { x1: number; y1: number; x2: number; y2: number };
}

export interface Alert {
  id: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  sector: string;
  eventType: DetectionType;
  severity: AlertSeverity;
  confidence: number;
  status: AlertStatus;
  thumbnailUrl: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  qrfDispatched: boolean;
  assignedUnit?: string;
  operatorNotes?: string;
  acknowledgedBy?: string;
}

export interface SurveillanceEvent {
  id: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  sector: string;
  eventType: DetectionType;
  confidence: number;
  durationSec: number;
  threatLevel: AlertSeverity;
  snapshotUrl: string;
  description: string;
  resolvedBy?: string;
}

export interface AiWorkflowStep {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  techSpec: string;
  status: 'active' | 'standby' | 'processing';
  metrics: string;
  color: string;
}

export type UserRole = 'Commander' | 'Analyst' | 'Admin';

export interface User {
  id: string;
  badgeId?: string;
  name: string;
  email?: string;
  role: UserRole | string;
  clearanceLevel?: string;
  team?: string;
  unit?: string;
  avatar?: string;
}

export interface SystemStats {
  totalCameras: number;
  activeCameras: number;
  offlineCameras: number;
  degradedCameras: number;
  intrusionAlertsToday: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  qrfUnitsDeployed: number;
  edgeAiInferenceFps: number;
  systemUptime: string;
  networkBandwidth: string;
}

export interface AiModelConfig {
  modelName: string;
  version: string;
  framework: string;
  confidenceThreshold: number;
  iouThreshold: number;
  inputResolution: string;
  targetFps: number;
  enableThermalFusion: boolean;
  enableTripwire: boolean;
  enableWeaponDetection: boolean;
  enableLoiteringDetection: boolean;
  edgeNodeId: string;
  backendApiUrl: string;
  websocketUrl: string;
  soundAlertsEnabled: boolean;
  autoAcknowledgeLowConfidence: boolean;
  qrfDispatchChannel: string;
}
