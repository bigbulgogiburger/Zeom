import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../components/auth-context';

// Mock api-client
jest.mock('../components/api-client', () => ({
  apiFetch: jest.fn(),
}));

import { apiFetch } from '../components/api-client';
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function mockResponse(body: string, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(JSON.parse(body)),
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

function AuthConsumer() {
  const { me, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="me">{me ? JSON.stringify(me) : 'null'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in loading state', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // Never resolves
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('me').textContent).toBe('null');
  });

  it('sets me after successful /auth/me call', async () => {
    const user = { id: 1, email: 'test@test.com', name: 'Test', role: 'USER' };
    mockApiFetch.mockResolvedValueOnce(mockResponse(JSON.stringify(user), 200));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('me').textContent).toBe(JSON.stringify(user));
  });

  it('sets me to null when /auth/me returns non-ok response', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse('{}', 401));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('me').textContent).toBe('null');
  });

  it('calls /api/v1/auth/me on mount', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse('{}', 200));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/auth/me', { cache: 'no-store' });
    });
  });

  it('handles non-ok response gracefully', async () => {
    // When the API returns a non-ok status, me should be null and loading false
    mockApiFetch.mockResolvedValueOnce(mockResponse('{"error":"forbidden"}', 403));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('me').textContent).toBe('null');
  });
});

describe('useAuth', () => {
  it('returns default context values when used outside provider', () => {
    function Standalone() {
      const { me, loading } = useAuth();
      return (
        <div>
          <span data-testid="me">{me ? 'user' : 'null'}</span>
          <span data-testid="loading">{String(loading)}</span>
        </div>
      );
    }

    render(<Standalone />);

    expect(screen.getByTestId('me').textContent).toBe('null');
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });
});

describe('AuthProvider refreshMe', () => {
  it('refreshMe re-fetches user data', async () => {
    const user = { id: 1, email: 'a@b.com', name: 'A', role: 'ADMIN' };
    // First call on mount - no user
    mockApiFetch.mockResolvedValueOnce(mockResponse('{}', 401));

    function RefreshTester() {
      const { me, loading, refreshMe } = useAuth();
      return (
        <div>
          <span data-testid="loading">{String(loading)}</span>
          <span data-testid="me">{me ? me.name : 'null'}</span>
          <button data-testid="refresh" onClick={refreshMe}>refresh</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <RefreshTester />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('me').textContent).toBe('null');

    // Now mock a successful refresh
    mockApiFetch.mockResolvedValueOnce(mockResponse(JSON.stringify(user), 200));

    await act(async () => {
      screen.getByTestId('refresh').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('me').textContent).toBe('A');
    });
  });
});
