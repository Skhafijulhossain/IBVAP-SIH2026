/**
 * API Client Configuration
 * Supports switching between Mock (Offline-First) and Live FastAPI Backend (`http://localhost:8000/api/v1`)
 */

export interface ApiConfig {
  baseUrl: string;
  isLiveBackend: boolean;
  timeoutMs: number;
}

export const API_CONFIG: ApiConfig = {
  baseUrl: (import.meta.env?.VITE_API_URL as string) || 'http://localhost:8000/api',
  isLiveBackend: true, // Connect to live FastAPI backend by default
  timeoutMs: 3000,
};

export class ApiService {
  private static config: ApiConfig = { ...API_CONFIG };

  public static setLiveMode(isLive: boolean, baseUrl?: string) {
    this.config.isLiveBackend = isLive;
    if (baseUrl) {
      this.config.baseUrl = baseUrl;
    }
  }

  public static getConfig(): ApiConfig {
    return { ...this.config };
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config.isLiveBackend) {
      throw new Error('MOCK_MODE_ACTIVE');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs || 3000);

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'IBVAP-SIH2026',
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error [${response.status}]: ${errText || response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

