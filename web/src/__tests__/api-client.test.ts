import { apiFetch } from '../components/api-client';

// Helper to create mock Response-like objects
function mockResponse(body: string, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(JSON.parse(body)),
    text: () => Promise.resolve(body),
    headers: new Headers(),
    clone: function () { return { ...this }; },
  };
}

const mockFetch = jest.fn();
global.fetch = mockFetch;

Object.defineProperty(navigator, 'userAgent', {
  value: 'test-user-agent',
  writable: true,
});

describe('apiFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = '';
  });

  it('makes a request to API_BASE + path', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('{"ok":true}', 200));

    await apiFetch('/api/v1/test');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/v1/test');
  });

  it('sends request with credentials include (cookie-based auth)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('{}', 200));

    await apiFetch('/api/v1/test');

    const [, init] = mockFetch.mock.calls[0];
    expect(init.credentials).toBe('include');
  });

  it('does not attach Authorization header (tokens are in cookies)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('{}', 200));

    await apiFetch('/api/v1/test');

    const [, init] = mockFetch.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });

  it('returns response directly for non-401 status', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('{"data":"test"}', 200));

    const res = await apiFetch('/api/v1/test');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBe('test');
  });

  it('returns 403 response without attempting refresh', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('forbidden', 403));

    const res = await apiFetch('/api/v1/admin');

    expect(res.status).toBe(403);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('attempts token refresh on 401 response', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse('unauthorized', 401));
    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce(
      mockResponse(JSON.stringify({ accessToken: 'new-access', refreshToken: 'new-refresh' }), 200)
    );
    // Retry call succeeds
    mockFetch.mockResolvedValueOnce(mockResponse('{"retried":true}', 200));

    const res = await apiFetch('/api/v1/test');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    // Verify refresh was called
    const [refreshUrl, refreshInit] = mockFetch.mock.calls[1];
    expect(refreshUrl).toBe('http://localhost:8080/api/v1/auth/refresh');
    // Refresh now sends refreshToken as empty string and a UUID deviceId
    const refreshBody = JSON.parse(refreshInit.body);
    expect(refreshBody).toHaveProperty('refreshToken', '');
    expect(refreshBody).toHaveProperty('deviceId');
    expect(refreshBody.deviceId).toBeTruthy();
    // Verify retried request was made
    expect(res.status).toBe(200);
  });

  it('dispatches auth:expired event when refresh fails', async () => {
    const expiredHandler = jest.fn();
    window.addEventListener('auth:expired', expiredHandler);

    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse('unauthorized', 401));
    // Refresh fails
    mockFetch.mockResolvedValueOnce(mockResponse('bad', 401));

    await apiFetch('/api/v1/test');

    expect(expiredHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener('auth:expired', expiredHandler);
  });

  it('does not retry when retry=false', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('unauthorized', 401));

    const res = await apiFetch('/api/v1/test', {}, false);

    expect(res.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('clears tokens and dispatches expired event when no refresh token on 401', async () => {
    const expiredHandler = jest.fn();
    window.addEventListener('auth:expired', expiredHandler);

    // The refresh endpoint will be called (refreshToken is sent as empty string)
    // but the server will reject it
    mockFetch.mockResolvedValueOnce(mockResponse('unauthorized', 401));
    // Refresh call fails
    mockFetch.mockResolvedValueOnce(mockResponse('bad', 401));

    await apiFetch('/api/v1/test');

    expect(expiredHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener('auth:expired', expiredHandler);
  });

  it('passes through custom init options', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('{}', 200));

    await apiFetch('/api/v1/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"test"}');
  });
});
