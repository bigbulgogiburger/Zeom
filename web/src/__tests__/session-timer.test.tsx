import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionTimer from '@/components/session-timer';

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    frequency: { value: 0 },
    type: 'sine',
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 0, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
  })),
  destination: {},
  currentTime: 0,
};
(window as any).AudioContext = jest.fn(() => mockAudioContext);

// Helper: find the timer display text within the component
function getTimerText(container: HTMLElement): string {
  // The timer div has font-size: var(--font-size-3xl)
  const timerDisplay = container.querySelector('div > div:nth-child(2)');
  return timerDisplay?.textContent?.replace(/\s/g, '') || '';
}

describe('SessionTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('displays remaining time correctly', () => {
    const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
    const durationMinutes = 60;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(screen.getByText('남은 시간')).toBeInTheDocument();
    expect(getTimerText(container)).toBe('50:00');
  });

  it('updates countdown every second', () => {
    const startTime = new Date(Date.now() - 10 * 1000).toISOString(); // 10 seconds ago
    const durationMinutes = 1;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(getTimerText(container)).toBe('00:50');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getTimerText(container)).toBe('00:49');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(getTimerText(container)).toBe('00:44');
  });

  it('shows warning state when less than 5 minutes remaining', () => {
    const startTime = new Date(Date.now() - 56 * 60 * 1000).toISOString(); // 56 minutes ago
    const durationMinutes = 60;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(getTimerText(container)).toBe('04:00');
    expect(screen.getByText('곧 종료됩니다')).toBeInTheDocument();

    // Check background color change (warning5 state uses gold-soft)
    const timerDiv = container.querySelector('div');
    expect(timerDiv).toHaveStyle({ background: 'hsl(var(--gold-soft))' });
  });

  it('does not show warning when more than 5 minutes remaining', () => {
    const startTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
    const durationMinutes = 60;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(getTimerText(container)).toBe('50:00');
    expect(screen.queryByText('곧 종료됩니다')).not.toBeInTheDocument();

    const timerDiv = container.querySelector('div');
    expect(timerDiv).toHaveStyle({ background: 'hsl(var(--card))' });
  });

  it('calls onTimeUp callback when timer reaches 0', () => {
    const onTimeUp = jest.fn();
    const startTime = new Date(Date.now() - 59 * 1000).toISOString(); // 59 seconds ago
    const durationMinutes = 1;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} onTimeUp={onTimeUp} />);

    expect(getTimerText(container)).toBe('00:01');
    expect(onTimeUp).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('shows expired/grace state when timer has expired', () => {
    const startTime = new Date(Date.now() - 61 * 1000).toISOString(); // 61 seconds ago
    const durationMinutes = 1;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    // Timer has already expired. On initial render, remaining=0 but phase is still 'normal'
    // because setPhase('expired') only happens inside the interval callback.
    // The timer shows 00:00.
    const timerText = getTimerText(container);
    expect(timerText).toBe('00:00');

    // Advance to first interval tick to trigger phase change
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Now the phase should be 'expired' and then transition to 'grace'
    // Background changes to dancheong for expired/grace states
    const timerDiv = container.querySelector('div');
    expect(timerDiv).toHaveStyle({ background: 'hsl(var(--dancheong))' });
  });

  it('does not go below 0 - shows expired or grace state', () => {
    const startTime = new Date(Date.now() - 90 * 1000).toISOString(); // 90 seconds ago
    const durationMinutes = 1;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    // Timer expired well past 0. Verify it shows a valid time format.
    const timerText = getTimerText(container);
    expect(timerText).toMatch(/^\d{2}:\d{2}$/);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should still show a valid time format (not negative)
    const afterText = getTimerText(container);
    expect(afterText).toMatch(/^\d{2}:\d{2}$/);
  });

  it('formats time with leading zeros', () => {
    const startTime = new Date(Date.now() - 5 * 1000).toISOString(); // 5 seconds ago
    const durationMinutes = 1;

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(getTimerText(container)).toBe('00:55');

    act(() => {
      jest.advanceTimersByTime(50 * 1000);
    });

    expect(getTimerText(container)).toBe('00:05');
  });

  it('handles long duration correctly', () => {
    const startTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
    const durationMinutes = 120; // 2 hours

    const { container } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    expect(getTimerText(container)).toBe('90:00');
  });

  it('cleans up interval on unmount', () => {
    const startTime = new Date().toISOString();
    const durationMinutes = 60;

    const { unmount } = render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} />);

    const activeTimersBefore = jest.getTimerCount();
    expect(activeTimersBefore).toBeGreaterThan(0);

    unmount();

    expect(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
    }).not.toThrow();
  });

  it('calls onTimeUp when timer reaches 0', () => {
    const onTimeUp = jest.fn();
    const startTime = new Date(Date.now() - 59000).toISOString(); // 59 seconds ago
    const durationMinutes = 1;

    render(<SessionTimer startTime={startTime} durationMinutes={durationMinutes} onTimeUp={onTimeUp} />);

    expect(onTimeUp).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTimeUp).toHaveBeenCalled();
  });
});
