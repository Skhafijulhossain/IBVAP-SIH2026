import { Alert, DetectionTelemetry } from '../types';

export type { DetectionTelemetry };
export type AlertCallback = (alert: Alert) => void;
export type ConnectionStateCallback = (isConnected: boolean) => void;
export type DetectionCallback = (telemetry: DetectionTelemetry) => void;

function getDefaultWebSocketUrl(): string {
  const envWsBase = (
    import.meta.env?.VITE_WS_BASE_URL ||
    import.meta.env?.VITE_WS_URL ||
    'ws://localhost:8000/ws'
  ) as string;

  const trimmed = envWsBase.replace(/\/+$/, '');
  if (trimmed.endsWith('/alerts')) {
    return trimmed;
  }
  return `${trimmed}/alerts`;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private subscribers: Set<AlertCallback> = new Set();
  private stateSubscribers: Set<ConnectionStateCallback> = new Set();
  private detectionSubscribers: Set<DetectionCallback> = new Set();
  private isConnected = false;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private isSimulationEnabled = true;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastManualAlertTime = 0;
  private lastManualAlert: Alert | null = null;

  constructor() {
    this.connect();
    this.startSimulation();
    this.setupVisibilityListener();
  }

  private setupVisibilityListener() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Pause simulation timer when tab is hidden to save CPU/battery
          this.pauseSimulation();
        } else if (this.isSimulationEnabled && !this.isConnected) {
          // Resume simulation when tab becomes active
          this.startSimulation();
        }
      });
    }
  }

  public connect(url = getDefaultWebSocketUrl()) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.notifyState(true);
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CAMERA_DETECTIONS') {
            this.broadcastDetections(data as DetectionTelemetry);
          } else if (data.type === 'NEW_ALERT' && data.data) {
            this.broadcastAlert(data.data as Alert);
          } else if (data.type === 'ALERT' || data.severity) {
            this.broadcastAlert(data as Alert);
          }
        } catch {
          // Malformed packet, ignore
        }
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        this.notifyState(false);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.notifyState(false);
        this.scheduleReconnect(url);
      };
    } catch {
      this.isConnected = false;
      this.notifyState(false);
      this.scheduleReconnect(url);
    }
  }

  private scheduleReconnect(url: string) {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(url);
    }, 6000);
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyState(false);
  }

  public subscribe(callback: AlertCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public subscribeState(callback: ConnectionStateCallback): () => void {
    this.stateSubscribers.add(callback);
    callback(this.isConnected);
    return () => {
      this.stateSubscribers.delete(callback);
    };
  }

  public subscribeDetections(callback: DetectionCallback): () => void {
    this.detectionSubscribers.add(callback);
    return () => {
      this.detectionSubscribers.delete(callback);
    };
  }

  private notifyState(connected: boolean) {
    this.stateSubscribers.forEach((cb) => {
      try {
        cb(connected);
      } catch {
        // Safe callback execution
      }
    });
  }

  private broadcastAlert(alert: Alert) {
    this.subscribers.forEach((cb) => {
      try {
        cb(alert);
      } catch {
        // Safe subscriber notification
      }
    });
  }

  private broadcastDetections(telemetry: DetectionTelemetry) {
    this.detectionSubscribers.forEach((cb) => {
      try {
        cb(telemetry);
      } catch {
        // Safe subscriber notification
      }
    });
  }

  public setSimulationEnabled(enabled: boolean) {
    this.isSimulationEnabled = enabled;
    if (enabled && !this.simulationInterval) {
      this.startSimulation();
    } else if (!enabled && this.simulationInterval) {
      this.pauseSimulation();
    }
  }

  public isSimulating(): boolean {
    return this.isSimulationEnabled;
  }

  /**
   * Manually trigger a mock alert (perfect for live jury demo!)
   * Includes a 5-second cooldown to prevent notification flooding.
   */
  public triggerManualMockAlert(customType?: 'intrusion' | 'line_crossing' | 'vehicle' | 'person'): Alert | null {
    const now = Date.now();
    // 5-second cooldown for manual trigger
    if (now - this.lastManualAlertTime < 5000 && this.lastManualAlert) {
      return this.lastManualAlert;
    }
    this.lastManualAlertTime = now;

    const types: Array<{
      type: 'intrusion' | 'line_crossing' | 'vehicle' | 'person';
      severity: 'critical' | 'warning' | 'info';
      label: string;
    }> = [
      { type: 'intrusion', severity: 'critical', label: 'Breach Attempt: Thermal signature advancing across barbed fence' },
      { type: 'line_crossing', severity: 'critical', label: 'Tripwire Alert: Cross-border trajectory verified by YOLOv11' },
      { type: 'vehicle', severity: 'warning', label: 'Suspicious vehicle stopped at Sector-2 Perimeter Gap' },
      { type: 'person', severity: 'info', label: 'Border Guard Patrol unit check-in acknowledged' },
    ];

    const selected = customType
      ? types.find((t) => t.type === customType) || types[0]
      : types[Math.floor(Math.random() * types.length)];
    const camIndex = Math.floor(Math.random() * 4) + 1;
    const camId = `CAM-0${camIndex}`;
    const camNames: Record<string, string> = {
      'CAM-01': 'North Sector Fence Alpha',
      'CAM-02': 'Western Ravine Gap Beta',
      'CAM-03': 'Checkpoint Alpha Highway Gate',
      'CAM-04': 'Perimeter River Bed Delta',
    };

    const mockAlert: Alert = {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      cameraId: camId,
      cameraName: camNames[camId] || 'Border Perimeter Camera',
      sector: `Sector-${camIndex} Tactical Zone`,
      eventType: selected.type,
      severity: selected.severity,
      confidence: parseFloat((0.82 + Math.random() * 0.14).toFixed(2)),
      status: 'new',
      thumbnailUrl: `/snapshots/cam-0${camIndex}-live.jpg`,
      description: selected.label,
      coordinates: {
        lat: 34.0837 + (Math.random() - 0.5) * 0.04,
        lng: 74.7973 + (Math.random() - 0.5) * 0.04,
      },
      qrfDispatched: selected.severity === 'critical',
      assignedUnit: selected.severity === 'critical' ? 'QRF Alpha Fast Response Unit' : undefined,
    };

    this.lastManualAlert = mockAlert;
    this.broadcastAlert(mockAlert);
    return mockAlert;
  }

  private pauseSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private startSimulation() {
    this.pauseSimulation();
    // Periodically simulate an event every 40-50 seconds in background (only when tab is visible)
    this.simulationInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (this.isSimulationEnabled && !this.isConnected) {
        if (Math.random() > 0.45) {
          this.triggerManualMockAlert();
        }
      }
    }, 45000);
  }
}

export const wsService = new WebSocketService();
