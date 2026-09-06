import { Alert } from '../types';
import { INITIAL_ALERTS } from '../data/mockData';
import { ApiService } from './client';

const ALERTS_STORAGE_KEY = 'ibvap_alerts_v1';

function getLocalAlerts(): Alert[] {
  try {
    const data = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(INITIAL_ALERTS));
  return INITIAL_ALERTS;
}

function saveLocalAlerts(alerts: Alert[]) {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // ignore
  }
}

export const alertsApi = {
  /**
   * GET /alerts
   */
  async getAlerts(filter?: { severity?: string; status?: string }): Promise<Alert[]> {
    if (ApiService.getConfig().isLiveBackend) {
      try {
        const query = new URLSearchParams(filter as Record<string, string>).toString();
        return await ApiService.request<Alert[]>(`/alerts${query ? `?${query}` : ''}`);
      } catch (err) {
        console.warn('FastAPI backend alerts fallback:', err);
      }
    }

    let alerts = getLocalAlerts();
    if (filter?.severity && filter.severity !== 'all') {
      alerts = alerts.filter((a) => a.severity === filter.severity);
    }
    if (filter?.status && filter.status !== 'all') {
      alerts = alerts.filter((a) => a.status === filter.status);
    }
    return alerts;
  },

  /**
   * POST /alerts/:id/acknowledge
   */
  async acknowledgeAlert(id: string, operatorName: string): Promise<Alert> {
    const list = getLocalAlerts();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Alert not found');

    list[index] = {
      ...list[index],
      status: 'acknowledged',
      acknowledgedBy: operatorName,
    };
    saveLocalAlerts(list);

    if (ApiService.getConfig().isLiveBackend) {
      try {
        await ApiService.request(`/alerts/${id}/acknowledge`, {
          method: 'POST',
          body: JSON.stringify({ operatorName }),
        });
      } catch (err) {
        console.warn('FastAPI sync failed:', err);
      }
    }

    return list[index];
  },

  /**
   * POST /alerts/:id/escalate
   * Dispatches Quick Reaction Force (QRF) unit to coordinates
   */
  async escalateToQrf(id: string, assignedUnit: string, notes?: string): Promise<Alert> {
    const list = getLocalAlerts();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Alert not found');

    list[index] = {
      ...list[index],
      status: 'escalated_to_qrf',
      qrfDispatched: true,
      assignedUnit: assignedUnit || 'QRF Rapid Response Unit 1',
      operatorNotes: notes || 'QRF Dispatched by Command Station',
    };
    saveLocalAlerts(list);

    if (ApiService.getConfig().isLiveBackend) {
      try {
        await ApiService.request(`/alerts/${id}/escalate`, {
          method: 'POST',
          body: JSON.stringify({ assignedUnit, notes }),
        });
      } catch (err) {
        console.warn('FastAPI sync failed:', err);
      }
    }

    return list[index];
  },

  /**
   * POST /alerts/:id/dismiss
   */
  async dismissAlert(id: string, reason?: string): Promise<Alert> {
    const list = getLocalAlerts();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Alert not found');

    list[index] = {
      ...list[index],
      status: 'dismissed',
      operatorNotes: reason || 'Marked as false alarm',
    };
    saveLocalAlerts(list);

    if (ApiService.getConfig().isLiveBackend) {
      try {
        await ApiService.request(`/alerts/${id}/dismiss`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
      } catch (err) {
        console.warn('FastAPI sync failed:', err);
      }
    }

    return list[index];
  },

  /**
   * POST /alerts/:id/resolve
   */
  async resolveAlert(id: string, notes?: string): Promise<Alert> {
    const list = getLocalAlerts();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Alert not found');

    list[index] = {
      ...list[index],
      status: 'resolved',
      operatorNotes: notes || 'Incident resolved and secured',
    };
    saveLocalAlerts(list);

    if (ApiService.getConfig().isLiveBackend) {
      try {
        await ApiService.request(`/alerts/${id}/resolve`, {
          method: 'POST',
          body: JSON.stringify({ notes }),
        });
      } catch (err) {
        console.warn('FastAPI sync failed:', err);
      }
    }

    return list[index];
  },

  /**
   * POST /alerts
   */
  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'status'>): Promise<Alert> {
    const list = getLocalAlerts();
    const newAlert: Alert = {
      ...alert,
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      status: 'new',
    };
    const updated = [newAlert, ...list];
    saveLocalAlerts(updated);

    if (ApiService.getConfig().isLiveBackend) {
      try {
        await ApiService.request('/alerts', {
          method: 'POST',
          body: JSON.stringify(newAlert),
        });
      } catch (err) {
        console.warn('FastAPI sync failed:', err);
      }
    }

    return newAlert;
  }
};
