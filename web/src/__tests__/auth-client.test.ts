import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../components/auth-client';

describe('auth-client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAccessToken', () => {
    it('returns null when no token stored', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('returns stored access token', () => {
      localStorage.setItem('accessToken', 'test-access-token');
      expect(getAccessToken()).toBe('test-access-token');
    });
  });

  describe('getRefreshToken', () => {
    it('returns null when no token stored', () => {
      expect(getRefreshToken()).toBeNull();
    });

    it('returns stored refresh token', () => {
      localStorage.setItem('refreshToken', 'test-refresh-token');
      expect(getRefreshToken()).toBe('test-refresh-token');
    });
  });

  describe('setTokens', () => {
    it('stores both access and refresh tokens', () => {
      setTokens('my-access', 'my-refresh');
      expect(localStorage.getItem('accessToken')).toBe('my-access');
      expect(localStorage.getItem('refreshToken')).toBe('my-refresh');
    });

    it('overwrites existing tokens', () => {
      setTokens('old-access', 'old-refresh');
      setTokens('new-access', 'new-refresh');
      expect(localStorage.getItem('accessToken')).toBe('new-access');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    });
  });

  describe('clearTokens', () => {
    it('removes both tokens from storage', () => {
      setTokens('access', 'refresh');
      clearTokens();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('does not throw when tokens do not exist', () => {
      expect(() => clearTokens()).not.toThrow();
    });
  });
});
