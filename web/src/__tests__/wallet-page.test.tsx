import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletPage from '@/app/wallet/page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock api-client
jest.mock('@/components/api-client', () => ({
  getWallet: jest.fn(),
  getWalletTransactions: jest.fn(),
}));

// Mock route-guard
jest.mock('@/components/route-guard', () => ({
  RequireLogin: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { getWallet, getWalletTransactions } from '@/components/api-client';
const mockGetWallet = getWallet as jest.MockedFunction<typeof getWallet>;
const mockGetWalletTransactions = getWalletTransactions as jest.MockedFunction<typeof getWalletTransactions>;

describe('WalletPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders wallet balance and transaction list', async () => {
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 100,
      balance: 50000,
    });

    mockGetWalletTransactions.mockResolvedValueOnce({
      content: [
        {
          id: 1,
          type: 'CHARGE',
          amount: 50000,
          balanceAfter: 50000,
          refType: 'PAYMENT',
          refId: 123,
          createdAt: '2026-02-15T10:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
    });

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('50,000원')).toBeInTheDocument();
    });

    expect(screen.getByText('충전')).toBeInTheDocument();
    expect(screen.getByText('PAYMENT #123')).toBeInTheDocument();
  });

  it('displays error message when wallet fetch fails', async () => {
    mockGetWallet.mockRejectedValueOnce(new Error('Network error'));
    mockGetWalletTransactions.mockResolvedValueOnce({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
    });

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('지갑 정보를 불러오지 못했습니다.')).toBeInTheDocument();
    });
  });

  it('displays error message when transactions fetch fails', async () => {
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 100,
      balance: 30000,
    });

    mockGetWalletTransactions.mockRejectedValueOnce(new Error('Server error'));

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('거래 내역을 불러오지 못했습니다.')).toBeInTheDocument();
    });
  });

  it('displays empty state when no transactions', async () => {
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 100,
      balance: 0,
    });

    mockGetWalletTransactions.mockResolvedValueOnce({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
    });

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('거래 내역이 없습니다')).toBeInTheDocument();
    });
  });

  it('navigates to cash buy page when charge button clicked', async () => {
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 100,
      balance: 10000,
    });

    mockGetWalletTransactions.mockResolvedValueOnce({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
    });

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('10,000원')).toBeInTheDocument();
    });

    const chargeButton = screen.getByText('충전하기');
    fireEvent.click(chargeButton);

    expect(mockPush).toHaveBeenCalledWith('/cash/buy');
  });

  it('handles pagination correctly', async () => {
    mockGetWallet.mockResolvedValue({
      id: 1,
      userId: 100,
      balance: 20000,
    });

    // First page
    mockGetWalletTransactions.mockResolvedValueOnce({
      content: [
        {
          id: 1,
          type: 'CHARGE',
          amount: 10000,
          balanceAfter: 20000,
          reference: 'Page-1',
          createdAt: '2026-02-15T10:00:00Z',
        },
      ],
      totalPages: 3,
      totalElements: 30,
      number: 0,
    });

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    // Second page
    mockGetWalletTransactions.mockResolvedValueOnce({
      content: [
        {
          id: 2,
          type: 'USE',
          amount: -5000,
          balanceAfter: 15000,
          reference: 'Page-2',
          createdAt: '2026-02-14T10:00:00Z',
        },
      ],
      totalPages: 3,
      totalElements: 30,
      number: 1,
    });

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    expect(mockGetWalletTransactions).toHaveBeenCalledTimes(2);
    expect(mockGetWalletTransactions).toHaveBeenLastCalledWith(1);
  });

  it('displays transaction type labels correctly', async () => {
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 100,
      balance: 40000,
    });

    mockGetWalletTransactions.mockResolvedValueOnce({
      content: [
        {
          id: 1,
          type: 'CHARGE',
          amount: 50000,
          balanceAfter: 50000,
          reference: 'Charge-1',
          createdAt: '2026-02-15T10:00:00Z',
        },
        {
          id: 2,
          type: 'USE',
          amount: -10000,
          balanceAfter: 40000,
          reference: 'Use-1',
          createdAt: '2026-02-14T10:00:00Z',
        },
        {
          id: 3,
          type: 'REFUND',
          amount: 5000,
          balanceAfter: 45000,
          reference: 'Refund-1',
          createdAt: '2026-02-13T10:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 3,
      number: 0,
    });

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('충전')).toBeInTheDocument();
      expect(screen.getByText('사용')).toBeInTheDocument();
      expect(screen.getByText('환불')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching transactions', async () => {
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 100,
      balance: 15000,
    });

    // Delay transaction response
    mockGetWalletTransactions.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
      }), 100))
    );

    render(<WalletPage />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument();
    });
  });
});
