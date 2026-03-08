import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionExpiryGuard from '../components/session-expiry-guard';

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

  it('redirects to login on button click', () => {
    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });

    render(<SessionExpiryGuard />);

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    });

    act(() => {
      screen.getByText('로그인으로 이동').click();
    });

    expect(window.location.href).toBe('/login');

    // Restore
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
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
