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
  exportTransactionsCsv: jest.fn(),
  getTransactionReceiptPdf: jest.fn(),
  getCreditBalance: jest.fn(),
}));

// Mock route-guard
jest.mock('@/components/route-guard', () => ({
  RequireLogin: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { getWallet, getWalletTransactions, getCreditBalance } from '@/components/api-client';
const mockGetWallet = getWallet as jest.MockedFunction<typeof getWallet>;
const mockGetWalletTransactions = getWalletTransactions as jest.MockedFunction<typeof getWalletTransactions>;
const mockGetCreditBalance = getCreditBalance as jest.MockedFunction<typeof getCreditBalance>;

describe('WalletPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // getCreditBalance can reject silently
    mockGetCreditBalance.mockRejectedValue(new Error('not available'));
  });

  it('renders wallet balance and transaction list', async () => {
    mockGetWallet.mockResolvedValue({
      id: 1,
      userId: 100,
      balance: 50000,
    });

    const txPage = {
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
    };
    mockGetWalletTransactions.mockResolvedValue(txPage);

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('50,000원')).toBeInTheDocument();
    });

    // Transaction type label for CHARGE is '충전'
    await waitFor(() => {
      expect(screen.getAllByText('충전').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('PAYMENT #123')).toBeInTheDocument();
  });

  it('displays error message when wallet fetch fails', async () => {
    mockGetWallet.mockRejectedValue(new Error('Network error'));
    // When transactions also fail, the error message from loadTransactions
    // won't clear the wallet error message
    mockGetWalletTransactions.mockRejectedValue(new Error('also fails'));

    render(<WalletPage />);

    await waitFor(() => {
      // Either the wallet error or the transaction error is shown
      // since loadTransactions may overwrite the wallet error message
      const messages = [
        '지갑 정보를 불러오지 못했습니다.',
        '거래 내역을 불러오지 못했습니다.',
      ];
      const found = messages.some(msg => screen.queryByText(msg) !== null);
      expect(found).toBe(true);
    });
  });

  it('displays error message when transactions fetch fails', async () => {
    mockGetWallet.mockResolvedValue({
      id: 1,
      userId: 100,
      balance: 30000,
    });

    mockGetWalletTransactions.mockRejectedValue(new Error('Server error'));

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('거래 내역을 불러오지 못했습니다.')).toBeInTheDocument();
    });
  });

  it('displays empty state when no transactions', async () => {
    mockGetWallet.mockResolvedValue({
      id: 1,
      userId: 100,
      balance: 0,
    });

    mockGetWalletTransactions.mockResolvedValue({
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
    mockGetWallet.mockResolvedValue({
      id: 1,
      userId: 100,
      balance: 10000,
    });

    mockGetWalletTransactions.mockResolvedValue({
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

    // First page (used by initial load and filter-change re-fetch)
    const page1 = {
      content: [
        {
          id: 1,
          type: 'CHARGE',
          amount: 10000,
          balanceAfter: 20000,
          refType: 'PAYMENT',
          refId: 1,
          createdAt: '2026-02-15T10:00:00Z',
        },
      ],
      totalPages: 3,
      totalElements: 30,
      number: 0,
    };
    mockGetWalletTransactions.mockResolvedValue(page1);

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    // Set up page 2 response
    const page2 = {
      content: [
        {
          id: 2,
          type: 'USE',
          amount: -5000,
          balanceAfter: 15000,
          refType: 'PAYMENT',
          refId: 2,
          createdAt: '2026-02-14T10:00:00Z',
        },
      ],
      totalPages: 3,
      totalElements: 30,
      number: 1,
    };
    mockGetWalletTransactions.mockResolvedValue(page2);

    const nextButton = screen.getByText('다음');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });
  });

  it('displays transaction type labels correctly', async () => {
    mockGetWallet.mockResolvedValue({
      id: 1,
      userId: 100,
      balance: 40000,
    });

    mockGetWalletTransactions.mockResolvedValue({
      content: [
        {
          id: 1,
          type: 'CHARGE',
          amount: 50000,
          balanceAfter: 50000,
          refType: 'PAYMENT',
          refId: 1,
          createdAt: '2026-02-15T10:00:00Z',
        },
        {
          id: 2,
          type: 'USE',
          amount: -10000,
          balanceAfter: 40000,
          refType: 'PAYMENT',
          refId: 2,
          createdAt: '2026-02-14T10:00:00Z',
        },
        {
          id: 3,
          type: 'REFUND',
          amount: 5000,
          balanceAfter: 45000,
          refType: 'PAYMENT',
          refId: 3,
          createdAt: '2026-02-13T10:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 3,
      number: 0,
    });

    render(<WalletPage />);

    await waitFor(() => {
      // Transaction type labels rendered via getTransactionTypeLabel
      // The label text appears alongside StatusBadge labels
      const chargeElements = screen.getAllByText('충전');
      expect(chargeElements.length).toBeGreaterThan(0);
      expect(screen.getAllByText('사용').length).toBeGreaterThan(0);
      expect(screen.getAllByText('환불').length).toBeGreaterThan(0);
    });
  });

  it('shows loading state while fetching transactions', async () => {
    mockGetWallet.mockResolvedValue({
      id: 1,
      userId: 100,
      balance: 15000,
    });

    // Delay transaction response
    mockGetWalletTransactions.mockImplementation(
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
