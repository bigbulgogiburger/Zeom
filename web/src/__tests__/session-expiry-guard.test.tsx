import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionExpiryGuard from '../components/session-expiry-guard';

// Mock auth-client
jest.mock('../components/auth-client', () => ({
  clearTokens: jest.fn(),
}));

import { clearTokens } from '../components/auth-client';

describe('SessionExpiryGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when session is active', () => {
    const { container } = render(<SessionExpiryGuard />);
    expect(container.innerHTML).toBe('');
  });

  it('shows modal when auth:expired event fires', () => {
    render(<SessionExpiryGuard />);

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    });

    expect(screen.getByText('세션이 만료되었습니다')).toBeInTheDocument();
    expect(screen.getByText(/보안을 위해 자동 로그아웃/)).toBeInTheDocument();
    expect(screen.getByText('로그인으로 이동')).toBeInTheDocument();
  });

  it('calls clearTokens on button click', () => {
    render(<SessionExpiryGuard />);

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    });

    act(() => {
      screen.getByText('로그인으로 이동').click();
    });

    expect(clearTokens).toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const removeListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<SessionExpiryGuard />);
    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith(
      'auth:expired',
      expect.any(Function)
    );

    removeListenerSpy.mockRestore();
  });
});
