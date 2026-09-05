import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Alert, SystemStats, AiModelConfig, SurveillanceEvent } from '../types';
import { camerasApi } from '../api/camerasApi';
import { alertsApi } from '../api/alertsApi';
import { eventsApi } from '../api/eventsApi';
import { wsService } from '../api/websocketService';
import { tacticalAudio } from '../utils/audioAlarm';
import { INITIAL_SYSTEM_STATS, DEFAULT_AI_CONFIG, INITIAL_EVENTS } from '../data/mockData';

interface AppContextType {
  cameras: Camera[];
  alerts: Alert[];
  stats: SystemStats;
  aiConfig: AiModelConfig;
  events: SurveillanceEvent[];
  streamStatus: Record<string, any>;
  selectedCamera: Camera | null;
  selectedAlert: Alert | null;
  soundEnabled: boolean;
  isSimulatingAlerts: boolean;
  isEmergencyLockdown: boolean;
  blinkingCameraId: string | null;
  activeToastAlert: Alert | null;
  setSelectedCamera: (camera: Camera | null) => void;
  setSelectedAlert: (alert: Alert | null) => void;
  dismissToastAlert: () => void;
  toggleSound: () => void;
  toggleSimulation: () => void;
  toggleEmergencyLockdown: () => void;
  triggerManualAlert: (type?: 'intrusion' | 'line_crossing' | 'vehicle' | 'person') => void;
  dispatchConfirmedAlert: (alert: Alert) => void;
  refreshCameras: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshStreamStatus: () => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  escalateAlert: (id: string, unitName: string, notes?: string) => Promise<void>;
  dismissAlert: (id: string, reason?: string) => Promise<void>;
  updateAiConfig: (newConfig: Partial<AiModelConfig>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<SurveillanceEvent[]>(INITIAL_EVENTS);
  const [streamStatus, setStreamStatus] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<SystemStats>(INITIAL_SYSTEM_STATS);
  const [aiConfig, setAiConfig] = useState<AiModelConfig>(() => {
    try {
      const saved = localStorage.getItem('ibvap_ai_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_AI_CONFIG;
  });
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSimulatingAlerts, setIsSimulatingAlerts] = useState<boolean>(true);
  const [isEmergencyLockdown, setIsEmergencyLockdown] = useState<boolean>(false);
  const [blinkingCameraId, setBlinkingCameraId] = useState<string | null>(null);
  const [activeToastAlert, setActiveToastAlert] = useState<Alert | null>(null);

  // Cooldown and deduplication refs to prevent alert spam
  const alertCooldownMapRef = useRef<Map<string, number>>(new Map());
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cameras & stream status
  const refreshCameras = useCallback(async () => {
    try {
      const data = await camerasApi.getCameras();
      setCameras(data);
      if (!selectedCamera && data.length > 0) {
        setSelectedCamera(data[0]);
      }
    } catch {
      // Offline fallback already populated
    }
  }, [selectedCamera]);

  const refreshStreamStatus = useCallback(async () => {
    try {
      const res = await camerasApi.getStreamStatus();
      if (res && res.streams) {
        setStreamStatus(res.streams);
      }
    } catch {
      // Expected when backend is offline on Vercel
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      const data = await alertsApi.getAlerts();
      setAlerts(data);
    } catch {
      // Fallback
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents(data);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    refreshCameras();
    refreshStreamStatus();
    refreshAlerts();
    refreshEvents();

    // Poll stream status every 6 seconds, paused when tab is hidden
    const streamInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      refreshStreamStatus();
    }, 6000);

    return () => clearInterval(streamInterval);
  }, [refreshCameras, refreshStreamStatus, refreshAlerts, refreshEvents]);

  /**
   * Unified alert processor with 5-second cooldown and duplicate detection merging
   */
  const processIncomingAlert = useCallback(
    (newAlert: Alert) => {
      const alertKey = `${newAlert.cameraId}_${newAlert.eventType}`;
      const now = Date.now();
      const lastAlertTime = alertCooldownMapRef.current.get(alertKey) || 0;

      // 5-second cooldown: Merge repeated detections into existing active alert
      if (now - lastAlertTime < 5000) {
        setAlerts((prev) => {
          const existingIdx = prev.findIndex(
            (a) => a.cameraId === newAlert.cameraId && a.eventType === newAlert.eventType && a.status === 'new'
          );
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              confidence: Math.max(updated[existingIdx].confidence, newAlert.confidence),
              timestamp: 'Just now',
              description: `${newAlert.description} [Continuous Tracking]`,
            };
            return updated;
          }
          return prev;
        });
        return;
      }

      // New confirmed alert past cooldown window
      alertCooldownMapRef.current.set(alertKey, now);

      // 1. Prepend to alerts list
      setAlerts((prev) => [newAlert, ...prev]);

      // 2. Trigger visual red alert notification toast
      setActiveToastAlert(newAlert);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToastAlert(null);
      }, 6000);

      // 3. Blink the affected camera card
      if (newAlert.cameraId) {
        setBlinkingCameraId(newAlert.cameraId);
        if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
        blinkTimeoutRef.current = setTimeout(() => {
          setBlinkingCameraId(null);
        }, 6000);
      }

      // 4. Update Event Timeline by appending a new forensic event
      const newEvt: SurveillanceEvent = {
        id: `EVT-${Math.floor(5050 + Math.random() * 4000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST',
        cameraId: newAlert.cameraId,
        cameraName: newAlert.cameraName,
        sector: newAlert.sector,
        eventType: newAlert.eventType,
        confidence: newAlert.confidence,
        durationSec: 15,
        threatLevel: newAlert.severity,
        snapshotUrl: newAlert.thumbnailUrl || '/snapshots/default-event.jpg',
        description: newAlert.description,
        resolvedBy: 'Pending Triage',
      };
      setEvents((prev) => [newEvt, ...prev]);

      // 5. Increase Critical / Intrusion Alert Counter
      setStats((prev) => ({
        ...prev,
        intrusionAlertsToday: prev.intrusionAlertsToday + 1,
        criticalAlerts: newAlert.severity === 'critical' ? prev.criticalAlerts + 1 : prev.criticalAlerts,
        warningAlerts: newAlert.severity === 'warning' ? prev.warningAlerts + 1 : prev.warningAlerts,
      }));

      // 6. Play tactical audio
      if (soundEnabled) {
        if (newAlert.severity === 'critical') {
          tacticalAudio.playCriticalAlarm();
        } else if (newAlert.severity === 'warning') {
          tacticalAudio.playWarningChirp();
        } else {
          tacticalAudio.playRadioBeep();
        }
      }
    },
    [soundEnabled]
  );

  // Connect WebSocket / wsService to unified alert processor
  useEffect(() => {
    const unsubscribe = wsService.subscribe(processIncomingAlert);

    return () => {
      unsubscribe();
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [processIncomingAlert]);

  const dispatchConfirmedAlert = useCallback(
    (alert: Alert) => {
      processIncomingAlert(alert);
    },
    [processIncomingAlert]
  );

  const dismissToastAlert = () => {
    setActiveToastAlert(null);
  };

  // Alert Actions
  const acknowledgeAlert = async (id: string) => {
    await alertsApi.acknowledgeAlert(id, 'Command Operator');
    await refreshAlerts();
  };

  const escalateAlert = async (id: string, unitName: string, notes?: string) => {
    await alertsApi.escalateToQrf(id, unitName, notes);
    tacticalAudio.playRadioBeep();
    setStats((prev) => ({
      ...prev,
      qrfUnitsDeployed: prev.qrfUnitsDeployed + 1,
    }));
    await refreshAlerts();
  };

  const dismissAlert = async (id: string, reason?: string) => {
    await alertsApi.dismissAlert(id, reason);
    await refreshAlerts();
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    tacticalAudio.setSoundEnabled(next);
  };

  const toggleSimulation = () => {
    const next = !isSimulatingAlerts;
    setIsSimulatingAlerts(next);
    wsService.setSimulationEnabled(next);
  };

  const toggleEmergencyLockdown = () => {
    setIsEmergencyLockdown((prev) => {
      const next = !prev;
      if (next && soundEnabled) {
        tacticalAudio.playCriticalAlarm();
      }
      return next;
    });
  };

  const triggerManualAlert = (type?: 'intrusion' | 'line_crossing' | 'vehicle' | 'person') => {
    wsService.triggerManualMockAlert(type);
  };

  const updateAiConfig = (newConfig: Partial<AiModelConfig>) => {
    const updated = { ...aiConfig, ...newConfig };
    setAiConfig(updated);
    try {
      localStorage.setItem('ibvap_ai_config', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        cameras,
        alerts,
        stats,
        aiConfig,
        events,
        streamStatus,
        selectedCamera,
        selectedAlert,
        soundEnabled,
        isSimulatingAlerts,
        isEmergencyLockdown,
        blinkingCameraId,
        activeToastAlert,
        setSelectedCamera,
        setSelectedAlert,
        dismissToastAlert,
        toggleSound,
        toggleSimulation,
        toggleEmergencyLockdown,
        triggerManualAlert,
        dispatchConfirmedAlert,
        refreshCameras,
        refreshAlerts,
        refreshEvents,
        refreshStreamStatus,
        acknowledgeAlert,
        escalateAlert,
        dismissAlert,
        updateAiConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
