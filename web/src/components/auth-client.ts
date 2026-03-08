/**
 * Device ID management for multi-device session tracking.
 * JWT tokens are now managed via httpOnly cookies (not localStorage).
 */

const DEVICE_ID_KEY = 'device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * @deprecated Tokens are now managed via httpOnly cookies. These are no-ops for backwards compatibility.
 */
export function getAccessToken(): string | null {
  return null;
}

export function getRefreshToken(): string | null {
  return null;
}

export function setTokens(_accessToken: string, _refreshToken: string): void {
  // No-op: tokens are set via httpOnly cookies by the server
}

export function clearTokens(): void {
  // No-op: cookies are cleared by the server on logout
}
