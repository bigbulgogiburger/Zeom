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
  });

  it('makes a request to API_BASE + path', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse('{"ok":true}', 200));

    await apiFetch('/api/v1/test');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/v1/test');
  });

  it('attaches Authorization header when access token exists', async () => {
    localStorage.setItem('accessToken', 'my-token');
    mockFetch.mockResolvedValueOnce(mockResponse('{}', 200));

    await apiFetch('/api/v1/test');

    const [, init] = mockFetch.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('does not attach Authorization header when no token', async () => {
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
    localStorage.setItem('accessToken', 'token');
    mockFetch.mockResolvedValueOnce(mockResponse('forbidden', 403));

    const res = await apiFetch('/api/v1/admin');

    expect(res.status).toBe(403);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('attempts token refresh on 401 response', async () => {
    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('refreshToken', 'refresh-token');

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
    expect(JSON.parse(refreshInit.body)).toMatchObject({
      refreshToken: 'refresh-token',
      deviceId: 'web-main',
    });
    // Verify tokens were updated
    expect(localStorage.getItem('accessToken')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    // Verify retried request used new token
    const [, retryInit] = mockFetch.mock.calls[2];
    const retryHeaders = retryInit.headers as Headers;
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-access');
    expect(res.status).toBe(200);
  });

  it('dispatches auth:expired event when refresh fails', async () => {
    localStorage.setItem('accessToken', 'token');
    localStorage.setItem('refreshToken', 'refresh');

    const expiredHandler = jest.fn();
    window.addEventListener('auth:expired', expiredHandler);

    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse('unauthorized', 401));
    // Refresh fails
    mockFetch.mockResolvedValueOnce(mockResponse('bad', 401));

    await apiFetch('/api/v1/test');

    expect(expiredHandler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();

    window.removeEventListener('auth:expired', expiredHandler);
  });

  it('does not retry when retry=false', async () => {
    localStorage.setItem('accessToken', 'token');
    mockFetch.mockResolvedValueOnce(mockResponse('unauthorized', 401));

    const res = await apiFetch('/api/v1/test', {}, false);

    expect(res.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('clears tokens when no refresh token available on 401', async () => {
    localStorage.setItem('accessToken', 'token');
    // No refresh token set

    const expiredHandler = jest.fn();
    window.addEventListener('auth:expired', expiredHandler);

    mockFetch.mockResolvedValueOnce(mockResponse('unauthorized', 401));

    await apiFetch('/api/v1/test');

    expect(expiredHandler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('accessToken')).toBeNull();

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
