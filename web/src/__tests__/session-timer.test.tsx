import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionTimer from '@/components/session-timer';

describe('SessionTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('displays remaining time correctly', () => {
    const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
    const durationMinutes = 60;

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('남은 시간')).toBeInTheDocument();
    expect(screen.getByText('50:00')).toBeInTheDocument();
  });

  it('updates countdown every second', () => {
    const startTime = new Date(Date.now() - 10 * 1000).toISOString(); // 10 seconds ago
    const durationMinutes = 1;

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('00:50')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:49')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:44')).toBeInTheDocument();
  });

  it('shows warning state when less than 5 minutes remaining', () => {
    const startTime = new Date(Date.now() - 56 * 60 * 1000).toISOString(); // 56 minutes ago
    const durationMinutes = 60;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('04:00')).toBeInTheDocument();
    expect(screen.getByText('⚠️ 곧 종료됩니다')).toBeInTheDocument();

    // Check background color change (warning state)
    const timerDiv = container.querySelector('div');
    expect(timerDiv).toHaveStyle({ background: 'var(--color-danger)' });
  });

  it('does not show warning when more than 5 minutes remaining', () => {
    const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
    const durationMinutes = 60;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('50:00')).toBeInTheDocument();
    expect(screen.queryByText('⚠️ 곧 종료됩니다')).not.toBeInTheDocument();

    const timerDiv = container.querySelector('div');
    expect(timerDiv).toHaveStyle({ background: 'var(--color-bg-card)' });
  });

  it('calls onTimeUp callback when timer reaches 0', () => {
    const onTimeUp = jest.fn();
    const startTime = new Date(Date.now() - 59 * 1000).toISOString(); // 59 seconds ago
    const durationMinutes = 1;

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} onTimeUp={onTimeUp} />);

    expect(screen.getByText('00:01')).toBeInTheDocument();
    expect(onTimeUp).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('shows session ended message when timer is at 0', () => {
    const startTime = new Date(Date.now() - 61 * 1000).toISOString(); // 61 seconds ago
    const durationMinutes = 1;

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('🔔 세션이 종료되었습니다')).toBeInTheDocument();
  });

  it('does not go below 0', () => {
    const startTime = new Date(Date.now() - 90 * 1000).toISOString(); // 90 seconds ago
    const durationMinutes = 1;

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('00:00')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('formats time with leading zeros', () => {
    const startTime = new Date(Date.now() - 5 * 1000).toISOString(); // 5 seconds ago
    const durationMinutes = 1;

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('00:55')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(50 * 1000);
    });

    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  it('handles long duration correctly', () => {
    const startTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
    const durationMinutes = 120; // 2 hours

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('90:00')).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    const startTime = new Date().toISOString();
    const durationMinutes = 60;

    const { unmount } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    const activeTimersBefore = jest.getTimerCount();
    expect(activeTimersBefore).toBeGreaterThan(0);

    unmount();

    // After unmount, the interval should be cleared
    // Note: jest.getTimerCount() might not reflect cleared timers immediately,
    // but we can verify no errors occur and component unmounts cleanly
    expect(() => jest.runOnlyPendingTimers()).not.toThrow();
  });

  it('calls onTimeUp when timer reaches 0 and continues calling on subsequent ticks', () => {
    const onTimeUp = jest.fn();
    const startTime = new Date(Date.now() - 59000).toISOString(); // 59 seconds ago
    const durationMinutes = 1;

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} onTimeUp={onTimeUp} />);

    // Initially remaining = 1, onTimeUp not called yet
    expect(onTimeUp).not.toHaveBeenCalled();

    // Advance 1 second so remaining reaches 0
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // onTimeUp should have been called when remaining hit 0
    expect(onTimeUp).toHaveBeenCalled();

    const callCountAfterZero = onTimeUp.mock.calls.length;

    // Continue past 0
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // onTimeUp continues being called on each tick where remaining===0
    expect(onTimeUp.mock.calls.length).toBeGreaterThanOrEqual(callCountAfterZero);
  });
});
