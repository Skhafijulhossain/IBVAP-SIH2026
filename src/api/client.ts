/**
 * API Client Configuration
 * Supports connecting to live Render Defense Backend Gateway or Localhost via environment variables,
 * with graceful offline-first fallback.
 */

export interface ApiConfig {
  baseUrl: string;
  isLiveBackend: boolean;
  timeoutMs: number;
}

// Read API Base URL from environment variables with local fallback
const envApiUrl = (
  import.meta.env?.VITE_API_BASE_URL ||
  import.meta.env?.VITE_API_URL ||
  'http://localhost:8000'
) as string;

export const API_CONFIG: ApiConfig = {
  baseUrl: envApiUrl.replace(/\/+$/, ''),
  isLiveBackend: true, // Connect to live FastAPI backend by default
  timeoutMs: 15000, // 15s timeout to gracefully accommodate Render cold-starts
};

export class ApiService {
  private static config: ApiConfig = { ...API_CONFIG };

  public static setLiveMode(isLive: boolean, baseUrl?: string) {
    this.config.isLiveBackend = isLive;
    if (baseUrl) {
      this.config.baseUrl = baseUrl.replace(/\/+$/, '');
    }
  }

  public static getConfig(): ApiConfig {
    return { ...this.config };
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
