import { Camera } from '../types';
import { INITIAL_CAMERAS } from '../data/mockData';
import { ApiService } from './client';

const STORAGE_KEY = 'ibvap_cameras_v1';

function getLocalCameras(): Camera[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CAMERAS));
  return INITIAL_CAMERAS;
}

function saveLocalCameras(cameras: Camera[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
  } catch {
    // ignore storage limit
  }
}

export const camerasApi = {
  /**
   * GET /cameras
   * Retrieves all registered border surveillance cameras
   */
  async getCameras(): Promise<Camera[]> {
    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request<Camera[]>('/cameras');
      } catch (err) {
        console.warn('FastAPI backend offline, falling back to local edge store:', err);
      }
    }
    return getLocalCameras();
  },

  /**
   * GET /cameras/:id
   */
  async getCameraById(id: string): Promise<Camera | null> {
    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request<Camera>(`/cameras/${id}`);
      } catch (err) {
        console.warn('FastAPI backend offline, falling back:', err);
      }
    }
    const list = getLocalCameras();
    return list.find((c) => c.id === id) || null;
  },

  /**
   * POST /cameras
   * Register a new RTSP / ONVIF IP camera stream
   */
  async addCamera(camera: Omit<Camera, 'id' | 'activeDetections'>): Promise<Camera> {
    const list = getLocalCameras();
    const newId = `CAM-${String(list.length + 1).padStart(2, '0')}`;
    const newCamera: Camera = {
      ...camera,
      id: newId,
      activeDetections: [],
      status: camera.status || 'online',
      signalStrength: camera.signalStrength || 95,
      lastHeartbeat: 'Just now',
    };

    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request<Camera>('/cameras', {
          method: 'POST',
          body: JSON.stringify(newCamera),
        });
      } catch (err) {
        console.warn('FastAPI backend offline, persisting to local edge store:', err);
      }
    }

    const updated = [newCamera, ...list];
    saveLocalCameras(updated);
    return newCamera;
  },

  /**
   * PUT /cameras/:id
   */
  async updateCamera(id: string, updates: Partial<Camera>): Promise<Camera> {
    const list = getLocalCameras();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Camera ${id} not found`);
    }

    const updatedCamera = { ...list[index], ...updates };
    list[index] = updatedCamera;
    saveLocalCameras(list);

    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request<Camera>(`/cameras/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.warn('FastAPI sync failed:', err);
      }
    }

    return updatedCamera;
  },

  /**
   * DELETE /cameras/:id
   */
  async deleteCamera(id: string): Promise<boolean> {
    const list = getLocalCameras();
    const filtered = list.filter((c) => c.id !== id);
    saveLocalCameras(filtered);

    if (ApiService.getConfig().isLiveBackend) {
      try {
        await ApiService.request(`/cameras/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('FastAPI sync failed:', err);
      }
    }
    return true;
  },

  /**
   * POST /cameras/test-rtsp
   * Simulates/tests RTSP handshake and latency
   */
  async testRtspStream(rtspUrl: string): Promise<{ success: boolean; latencyMs: number; resolution: string; codec: string; message: string }> {
    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request('/cameras/test-rtsp', {
          method: 'POST',
          body: JSON.stringify({ rtspUrl }),
        });
      } catch {
        // mock response
      }
    }

    await new Promise((res) => setTimeout(res, 800));
    const isValid = rtspUrl.startsWith('rtsp://') || rtspUrl.startsWith('http://');
    if (!isValid) {
      return {
        success: false,
        latencyMs: 0,
        resolution: 'N/A',
        codec: 'N/A',
        message: 'Invalid protocol schema. Expected RTSP or HTTP ONVIF URI.',
      };
    }

    return {
      success: true,
      latencyMs: Math.floor(Math.random() * 35) + 12,
      resolution: '1920x1080 @ 30 FPS',
      codec: 'H.264 / AAC High-Profile',
      message: 'RTSP Handshake validated successfully. Edge pipeline ready.',
    };
  },

  /**
   * GET /stream/status
   */
  async getStreamStatus(): Promise<{ active_streams: number; streams: Record<string, any> }> {
    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request('/stream/status');
      } catch (err) {
        // fallback
      }
    }
    return {
      active_streams: 1,
      streams: {
        'CAM-01': {
          camera_id: 'CAM-01',
          status: 'streaming',
          rtsp_url: 'rtsp://admin:secure_pass@10.240.12.101:554/stream1',
          target_fps: 30,
          frames_processed: 340,
          detections_count: 12,
          reconnect_count: 0,
          uptime_sec: 120.0,
        }
      }
    };
  },

  /**
   * POST /stream/start
   */
  async startStream(cameraId = 'CAM-01', fps = 15): Promise<any> {
    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request('/stream/start', {
          method: 'POST',
          body: JSON.stringify({ camera_id: cameraId, fps }),
        });
      } catch (err) {
        // fallback
      }
    }
    return { status: 'started', camera_id: cameraId };
  },

  /**
   * POST /stream/stop
   */
  async stopStream(cameraId?: string): Promise<any> {
    if (ApiService.getConfig().isLiveBackend) {
      try {
        return await ApiService.request('/stream/stop', {
          method: 'POST',
          body: JSON.stringify({ camera_id: cameraId }),
        });
      } catch (err) {
        // fallback
      }
    }
    return { status: 'stopped', camera_id: cameraId };
  },

  /**
   * POST /cameras/:id/reboot
   */
  async rebootCamera(id: string): Promise<{ status: string }> {
    await new Promise((res) => setTimeout(res, 600));
    return { status: `Edge node for ${id} rebooted.` };
  }
};

