import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Load cameras & stream status
  const refreshCameras = useCallback(async () => {
    try {
      const data = await camerasApi.getCameras();
      setCameras(data);
      if (!selectedCamera && data.length > 0) {
        setSelectedCamera(data[0]);
      }
    } catch (err) {
      console.error('Failed to load cameras', err);
    }
  }, [selectedCamera]);

  const refreshStreamStatus = useCallback(async () => {
    try {
      const res = await camerasApi.getStreamStatus();
      if (res && res.streams) {
        setStreamStatus(res.streams);
      }
    } catch (err) {
      console.warn('Stream status fallback:', err);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      const data = await alertsApi.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events', err);
    }
  }, []);

  useEffect(() => {
    refreshCameras();
    refreshStreamStatus();
    refreshAlerts();
    refreshEvents();

    // Poll stream status every 6 seconds to track active FPS and frames processed
    const streamInterval = setInterval(() => {
      refreshStreamStatus();
    }, 6000);

    return () => clearInterval(streamInterval);
  }, [refreshCameras, refreshStreamStatus, refreshAlerts, refreshEvents]);

  // Handle incoming live alert from WebSocket (/ws/alerts)
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    let toastTimeout: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = wsService.subscribe((newAlert) => {
      // 1. Prepend to alerts list
      setAlerts((prev) => [newAlert, ...prev]);

      // 2. Trigger visual red alert notification toast
      setActiveToastAlert(newAlert);
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        setActiveToastAlert(null);
      }, 8000);

      // 3. Blink the affected camera card
      if (newAlert.cameraId) {
        setBlinkingCameraId(newAlert.cameraId);
        if (blinkTimeout) clearTimeout(blinkTimeout);
        blinkTimeout = setTimeout(() => {
          setBlinkingCameraId(null);
        }, 8000);
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
    });

    return () => {
      unsubscribe();
      if (blinkTimeout) clearTimeout(blinkTimeout);
      if (toastTimeout) clearTimeout(toastTimeout);
    };
  }, [soundEnabled]);

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
