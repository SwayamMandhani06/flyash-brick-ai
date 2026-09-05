/**
 * FlyAsh Intel — API Client Abstraction
 * 
 * Provides a standardized HTTP fetch client configured via environment variables.
 * In development / demo mode, gracefully switches to local simulation services
 * when VITE_USE_MOCK_API is enabled (default).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

export interface ApiClientConfig {
  baseUrl: string;
  useMock: boolean;
  timeoutMs: number;
}

export const apiClientConfig: ApiClientConfig = {
  baseUrl: API_BASE_URL,
  useMock: USE_MOCK_API,
  timeoutMs: 15000,
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public isMockEnabled(): boolean {
    return apiClientConfig.useMock;
  }

  public async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined) searchParams.append(key, String(val));
      });
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API GET request failed with status ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  public async post<TReq, TRes>(endpoint: string, body: TReq): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API POST request failed with status ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(apiClientConfig.baseUrl);
