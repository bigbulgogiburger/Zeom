import { getAccessToken, getRefreshToken, setTokens, clearTokens, getDeviceId } from '../components/auth-client';

// Mock crypto.randomUUID
const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => mockUUID },
});

describe('auth-client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getDeviceId', () => {
    it('generates and stores a UUID on first call', () => {
      const id = getDeviceId();
      expect(id).toBe(mockUUID);
      expect(localStorage.getItem('device_id')).toBe(mockUUID);
    });

    it('returns same UUID on subsequent calls', () => {
      const first = getDeviceId();
      const second = getDeviceId();
      expect(first).toBe(second);
    });

    it('reuses existing device_id from localStorage', () => {
      localStorage.setItem('device_id', 'existing-id');
      expect(getDeviceId()).toBe('existing-id');
    });
  });

  describe('deprecated token functions (no-ops)', () => {
    it('getAccessToken returns null (httpOnly cookie)', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('getRefreshToken returns null (httpOnly cookie)', () => {
      expect(getRefreshToken()).toBeNull();
    });

    it('setTokens is a no-op', () => {
      setTokens('access', 'refresh');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('clearTokens does not throw', () => {
      expect(() => clearTokens()).not.toThrow();
    });
  });
});
