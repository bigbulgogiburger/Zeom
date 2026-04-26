import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CashBuyPage from '@/app/cash/buy/page';

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/components/api-client', () => ({
  chargeCash: jest.fn(),
  getWallet: jest.fn(),
}));

jest.mock('@/components/route-guard', () => ({
  RequireLogin: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/design', () => {
  const React = require('react');
  return {
    RadioCard: ({ value, label, selected, onSelect }: {
      value: string; label: string; selected: boolean; onSelect: (v: string) => void;
    }) => (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => onSelect(value)}
        data-value={value}
      >
        {label}
      </button>
    ),
    SuccessState: ({ title, subtitle, autoNavigateMs, onComplete }: {
      title: string; subtitle?: string; autoNavigateMs?: number; onComplete?: () => void;
    }) => {
      React.useEffect(() => {
        if (autoNavigateMs && onComplete) {
          const id = setTimeout(onComplete, autoNavigateMs);
          return () => clearTimeout(id);
        }
      }, [autoNavigateMs, onComplete]);
      return (
        <div>
          <div>{title}</div>
          {subtitle && <div>{subtitle}</div>}
        </div>
      );
    },
    WalletChip: () => <div data-testid="wallet-chip" />,
  };
});

import { chargeCash, getWallet } from '@/components/api-client';

const mockChargeCash = chargeCash as jest.MockedFunction<typeof chargeCash>;
const mockGetWallet = getWallet as jest.MockedFunction<typeof getWallet>;

describe('CashBuyPage (ZEOM-17)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // 기본: returnTo 없음
    mockSearchParams.delete('return');
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders 4 cash packages', () => {
    render(<CashBuyPage />);
    expect(screen.getByText('60분 1회')).toBeInTheDocument();
    expect(screen.getByText('60분 2회')).toBeInTheDocument();
    expect(screen.getByText('60분 5회')).toBeInTheDocument();
    expect(screen.getByText('60분 10회')).toBeInTheDocument();
    // '인기'는 popular 뱃지 + 패키지 타이틀로 중복 등장 — 존재만 확인
    expect(screen.getAllByText('인기').length).toBeGreaterThan(0);
  });

  it('renders payment method radios (4종)', () => {
    render(<CashBuyPage />);
    expect(screen.getByText('신용/체크 카드')).toBeInTheDocument();
    expect(screen.getByText('계좌이체')).toBeInTheDocument();
    expect(screen.getByText('카카오페이')).toBeInTheDocument();
    expect(screen.getByText('토스페이')).toBeInTheDocument();
  });

  it('disables 결제 button until terms agreed', () => {
    render(<CashBuyPage />);
    const payButton = screen.getByRole('button', { name: /결제하기/ });
    expect(payButton).toBeDisabled();
  });

  it('enables 결제 button after agreement', () => {
    render(<CashBuyPage />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    const payButton = screen.getByRole('button', { name: /결제하기/ });
    expect(payButton).not.toBeDisabled();
  });

  it('handles successful payment with auto-navigate to home', async () => {
    mockChargeCash.mockResolvedValueOnce({});
    mockGetWallet.mockResolvedValueOnce({ id: 1, userId: 100, balance: 120000 });

    render(<CashBuyPage />);

    fireEvent.click(screen.getByRole('checkbox'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /결제하기/ }));
    });
    // chargeCash + getWallet promise 마이크로태스크 flush
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    // dots 1.4초 → success 화면
    await act(async () => {
      jest.advanceTimersByTime(1400);
    });

    await waitFor(() => {
      expect(screen.getByText('충전이 완료되었습니다')).toBeInTheDocument();
    });

    // SuccessState 자동 복귀
    await act(async () => {
      jest.advanceTimersByTime(1400);
    });
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates back to /booking/confirm when return=confirm', async () => {
    mockSearchParams.set('return', 'confirm');
    mockChargeCash.mockResolvedValueOnce({});
    mockGetWallet.mockResolvedValueOnce({ id: 1, userId: 100, balance: 120000 });

    render(<CashBuyPage />);
    fireEvent.click(screen.getByRole('checkbox'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /결제하기/ }));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(1400);
    });
    await waitFor(() => {
      expect(screen.getByText('충전이 완료되었습니다')).toBeInTheDocument();
    });
    await act(async () => {
      jest.advanceTimersByTime(1400);
    });
    expect(mockPush).toHaveBeenCalledWith('/booking/confirm');
  });

  it('shows error message on payment failure', async () => {
    mockChargeCash.mockRejectedValueOnce(new Error('결제 취소'));

    render(<CashBuyPage />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /결제하기/ }));

    await waitFor(() => {
      expect(screen.getByText('결제 취소')).toBeInTheDocument();
    });
  });

  it('selecting different package updates summary amount', () => {
    render(<CashBuyPage />);
    // 기본 p2 선택 — cashAmount 110,000원 결제하기 버튼
    expect(screen.getAllByText(/110,000/).length).toBeGreaterThan(0);
    // p3 인기 패키지 선택 (cashAmount 300,000)
    fireEvent.click(screen.getByText('60분 5회'));
    expect(screen.getAllByText(/300,000/).length).toBeGreaterThan(0);
  });
});
