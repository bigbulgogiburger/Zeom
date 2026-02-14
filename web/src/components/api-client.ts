import { API_BASE } from './api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth-client';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh, deviceId: 'web-main', deviceName: navigator.userAgent.slice(0, 120) }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      setTokens(json.accessToken, json.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && retry) {
    const ok = await refreshToken();
    if (!ok) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      return res;
    }
    return apiFetch(path, init, false);
  }

  return res;
}
