import { SurveillanceEvent } from '../types';
import { INITIAL_EVENTS } from '../data/mockData';
import { ApiService } from './client';

const EVENTS_STORAGE_KEY = 'ibvap_events_v1';

function getLocalEvents(): SurveillanceEvent[] {
  try {
    const data = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
  return INITIAL_EVENTS;
}

export const eventsApi = {
  /**
   * GET /events
   */
  async getEvents(params?: {
    search?: string;
    eventType?: string;
    cameraId?: string;
    threatLevel?: string;
    minConfidence?: number;
  }): Promise<SurveillanceEvent[]> {
    if (ApiService.getConfig().isLiveBackend) {
      try {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.set('search', params.search);
        if (params?.eventType && params.eventType !== 'all') queryParams.set('eventType', params.eventType);
        if (params?.cameraId && params.cameraId !== 'all') queryParams.set('cameraId', params.cameraId);
        if (params?.threatLevel && params.threatLevel !== 'all') queryParams.set('threatLevel', params.threatLevel);
        if (params?.minConfidence !== undefined) queryParams.set('minConfidence', String(params.minConfidence));
        const query = queryParams.toString();
        return await ApiService.request<SurveillanceEvent[]>(`/events${query ? `?${query}` : ''}`);
      } catch (err) {
        console.warn('FastAPI events fallback:', err);
      }
    }

    let list = getLocalEvents();

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.cameraName.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.sector.toLowerCase().includes(q)
      );
    }

    if (params?.eventType && params.eventType !== 'all') {
      list = list.filter((e) => e.eventType === params.eventType);
    }

    if (params?.cameraId && params.cameraId !== 'all') {
      list = list.filter((e) => e.cameraId === params.cameraId);
    }

    if (params?.threatLevel && params.threatLevel !== 'all') {
      list = list.filter((e) => e.threatLevel === params.threatLevel);
    }

    if (params?.minConfidence) {
      list = list.filter((e) => e.confidence >= (params.minConfidence || 0));
    }

    return list;
  },

  /**
   * POST /events/log
   */
  async logEvent(event: Omit<SurveillanceEvent, 'id' | 'timestamp'>): Promise<SurveillanceEvent> {
    const list = getLocalEvents();
    const newEvent: SurveillanceEvent = {
      ...event,
      id: `EVT-${Math.floor(5050 + Math.random() * 4000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST',
    };

    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request<SurveillanceEvent>('/events/log', {
          method: 'POST',
          body: JSON.stringify(event),
        });
      } catch (err) {
        console.warn('FastAPI event log fallback:', err);
      }
    }

    const updated = [newEvent, ...list];
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return newEvent;
  }
};
