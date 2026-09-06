/**
 * API Client Configuration
 * Supports connecting to live Render Defense Backend Gateway or Localhost via environment variables,
 * with graceful offline-first fallback.
 */

export interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  isLiveBackend: boolean;
  timeoutMs: number;
}

// Read API Base URL from environment variables (VITE_API_URL or VITE_API_BASE_URL)
const envApiUrl = (
  import.meta.env?.VITE_API_URL ||
  import.meta.env?.VITE_API_BASE_URL ||
  'https://ibvap-backend-22xy.onrender.com'
) as string;

// Read WebSocket Base URL from environment variables (VITE_WS_URL or VITE_WS_BASE_URL)
const envWsUrl = (
  import.meta.env?.VITE_WS_URL ||
  import.meta.env?.VITE_WS_BASE_URL ||
  envApiUrl.replace(/^http/, 'ws') + '/ws'
) as string;

export const API_CONFIG: ApiConfig = {
  baseUrl: envApiUrl.replace(/\/+$/, ''),
  wsUrl: envWsUrl.replace(/\/+$/, ''),
  isLiveBackend: true, // Connect to live FastAPI backend by default
  timeoutMs: 15000, // 15s timeout to gracefully accommodate Render cold-starts
};

export class ApiService {
  private static config: ApiConfig = { ...API_CONFIG };

  public static setLiveMode(isLive: boolean, baseUrl?: string, wsUrl?: string) {
    this.config.isLiveBackend = isLive;
    if (baseUrl) {
      this.config.baseUrl = baseUrl.replace(/\/+$/, '');
    }
    if (wsUrl) {
      this.config.wsUrl = wsUrl.replace(/\/+$/, '');
    }
  }

  public static getConfig(): ApiConfig {
    return { ...this.config };
  }

  public static getWsUrl(endpoint = '/alerts'): string {
    const base = this.config.wsUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (base.endsWith('/alerts') && cleanEndpoint === '/alerts') {
      return base;
    }
    return `${base}${cleanEndpoint}`;
  }

  /**
   * Resolves endpoint URLs cleanly.
   * Handles root endpoints (/health), explicit API endpoints (/api/*),
   * and short paths (/cameras -> /api/cameras).
   */
  public static resolveUrl(endpoint: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Root-level health check or already prefixed with /api
    if (cleanEndpoint === '/health' || cleanEndpoint.startsWith('/api/') || cleanEndpoint === '/api') {
      return `${base}${cleanEndpoint}`;
    }

    // If base URL already ends with /api, avoid duplicating
    if (base.endsWith('/api')) {
      return `${base}${cleanEndpoint}`;
    }

    return `${base}/api${cleanEndpoint}`;
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config.isLiveBackend) {
      throw new Error('MOCK_MODE_ACTIVE');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs || 15000);

    const url = this.resolveUrl(endpoint);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'IBVAP-SIH2026',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Attach Authorization Bearer token from Supabase session if available
    try {
      const token = localStorage.getItem('ibvap_access_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Ignore in environments without localStorage
    }

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
