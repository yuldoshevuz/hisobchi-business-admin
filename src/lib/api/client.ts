import axios, {
  type AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/auth.store';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipAuth?: boolean;
}

export const client = axios.create({
  baseURL: `${env.BACKEND_BASE_URL}/api/admin`,
  // Admin queries can be heavier than tenant ones (cross-tenant aggregations,
  // big tables); give them more headroom than the user app's 15s.
  timeout: 30_000,
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const cfg = config as RetriableConfig;
  if (cfg._skipAuth) return config;
  const token = useAuthStore.getState().accessToken;
  if (token) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

let refreshInflight: Promise<string | null> | null = null;

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const res = await axios.post<RefreshResponse>(
      `${env.BACKEND_BASE_URL}/api/admin/auth/refresh`,
      { refreshToken },
      { timeout: 15_000 },
    );
    useAuthStore.getState().setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

client.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original._skipAuth) {
      original._retry = true;
      refreshInflight ??= performRefresh().finally(() => {
        refreshInflight = null;
      });
      const newToken = await refreshInflight;
      if (newToken) {
        const headers =
          original.headers instanceof AxiosHeaders
            ? original.headers
            : new AxiosHeaders(original.headers);
        headers.set('Authorization', `Bearer ${newToken}`);
        original.headers = headers;
        return client.request(original);
      }
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

export function publicConfig(): AxiosRequestConfig {
  return { _skipAuth: true } as AxiosRequestConfig;
}
