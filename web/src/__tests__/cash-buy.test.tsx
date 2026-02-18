import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CashBuyPage from '@/app/cash/buy/page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock api-client
jest.mock('@/components/api-client', () => ({
  getCashProducts: jest.fn(),
  preparePayment: jest.fn(),
  confirmPayment: jest.fn(),
  getWallet: jest.fn(),
}));

// Mock PortOne SDK
jest.mock('@portone/browser-sdk/v2', () => ({
  requestPayment: jest.fn(),
}));

// Mock route-guard
jest.mock('@/components/route-guard', () => ({
  RequireLogin: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { getCashProducts, preparePayment, confirmPayment, getWallet } from '@/components/api-client';
import * as PortOne from '@portone/browser-sdk/v2';

const mockGetCashProducts = getCashProducts as jest.MockedFunction<typeof getCashProducts>;
const mockPreparePayment = preparePayment as jest.MockedFunction<typeof preparePayment>;
const mockConfirmPayment = confirmPayment as jest.MockedFunction<typeof confirmPayment>;
const mockGetWallet = getWallet as jest.MockedFunction<typeof getWallet>;
const mockRequestPayment = PortOne.requestPayment as jest.MockedFunction<typeof PortOne.requestPayment>;

describe('CashBuyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const mockProducts = [
    {
      id: 1,
      name: '30분 상담권',
      description: '30분 영상 상담',
      priceKrw: 30000,
      cashAmount: 30000,
      durationMinutes: 30,
      active: true,
    },
    {
      id: 2,
      name: '60분 상담권',
      description: '60분 영상 상담',
      priceKrw: 50000,
      cashAmount: 50000,
      durationMinutes: 60,
      active: true,
    },
  ];

  it('renders product list', async () => {
    mockGetCashProducts.mockResolvedValueOnce(mockProducts);

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('30분 상담권')).toBeInTheDocument();
      expect(screen.getByText('60분 상담권')).toBeInTheDocument();
    });

    expect(screen.getByText('30,000원', { selector: 'div' })).toBeInTheDocument();
  });

  it('filters out inactive products', async () => {
    const productsWithInactive = [
      ...mockProducts,
      {
        id: 3,
        name: 'Inactive Product',
        description: 'Should not show',
        priceKrw: 10000,
        cashAmount: 10000,
        durationMinutes: 15,
        active: false,
      },
    ];

    mockGetCashProducts.mockResolvedValueOnce(productsWithInactive);

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('30분 상담권')).toBeInTheDocument();
    });

    expect(screen.queryByText('Inactive Product')).not.toBeInTheDocument();
  });

  it('displays error when products fetch fails', async () => {
    mockGetCashProducts.mockRejectedValueOnce(new Error('Network error'));

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('상품 목록을 불러오지 못했습니다.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no products available', async () => {
    mockGetCashProducts.mockResolvedValueOnce([]);

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('이용 가능한 상품이 없습니다')).toBeInTheDocument();
    });
  });

  it('handles preparing state correctly', async () => {
    mockGetCashProducts.mockResolvedValueOnce(mockProducts);
    // Use a never-resolving promise so we stay in 'preparing' state
    mockPreparePayment.mockReturnValueOnce(new Promise(() => {}));

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('30분 상담권')).toBeInTheDocument();
    });

    const buyButton = screen.getAllByText('구매하기')[0];

    await act(async () => {
      fireEvent.click(buyButton);
    });

    // In 'preparing' state, the product cards are replaced with skeleton loading cards
    // showing "결제 준비 중..." text (3 skeleton cards)
    await waitFor(() => {
      expect(screen.getAllByText('결제 준비 중...').length).toBeGreaterThan(0);
    });
  });

  it('handles processing state correctly', async () => {
    mockGetCashProducts.mockResolvedValueOnce(mockProducts);
    mockPreparePayment.mockResolvedValueOnce({
      paymentId: 'pay-123',
      storeId: 'store-456',
    });
    mockRequestPayment.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        paymentId: 'portone-123',
        code: null,
      } as any), 100))
    );

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('30분 상담권')).toBeInTheDocument();
    });

    const buyButton = screen.getAllByText('구매하기')[0];
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText('결제 처리 중...')).toBeInTheDocument();
    });

    jest.runAllTimers();
  });

  it('handles payment failure correctly', async () => {
    mockGetCashProducts.mockResolvedValueOnce(mockProducts);
    mockPreparePayment.mockResolvedValueOnce({
      paymentId: 'pay-123',
      storeId: 'store-456',
    });
    mockRequestPayment.mockResolvedValueOnce({
      code: 'PG_PROVIDER_ERROR',
      message: 'Payment cancelled by user',
    } as any);

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('30분 상담권')).toBeInTheDocument();
    });

    const buyButton = screen.getAllByText('구매하기')[0];
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText('결제 실패')).toBeInTheDocument();
      expect(screen.getByText(/결제 실패: Payment cancelled by user/)).toBeInTheDocument();
    });
  });

  it('handles successful payment flow', async () => {
    mockGetCashProducts.mockResolvedValueOnce(mockProducts);
    mockPreparePayment.mockResolvedValueOnce({
      paymentId: 'pay-123',
      storeId: 'store-456',
    });
    mockRequestPayment.mockResolvedValueOnce({
      paymentId: 'portone-123',
      code: null,
    } as any);
    mockConfirmPayment.mockResolvedValueOnce({});
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 100,
      balance: 80000,
    });

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('30분 상담권')).toBeInTheDocument();
    });

    const buyButton = screen.getAllByText('구매하기')[0];
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText('충전 완료!')).toBeInTheDocument();
      expect(screen.getByText('80,000원')).toBeInTheDocument();
    });

    // Auto-redirect after 3 seconds
    jest.advanceTimersByTime(3000);
    expect(mockPush).toHaveBeenCalledWith('/wallet');
  });

  it('handles retry after failure', async () => {
    mockGetCashProducts.mockResolvedValueOnce(mockProducts);
    mockPreparePayment.mockResolvedValueOnce({
      paymentId: 'pay-123',
      storeId: 'store-456',
    });
    mockRequestPayment.mockResolvedValueOnce({
      code: 'ERROR',
      message: 'Failed',
    } as any);

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('30분 상담권')).toBeInTheDocument();
    });

    const buyButton = screen.getAllByText('구매하기')[0];
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText('결제 실패')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByText('결제 실패')).not.toBeInTheDocument();
    });
  });

  it('disables purchase during payment processing', async () => {
    mockGetCashProducts.mockResolvedValueOnce(mockProducts);
    mockPreparePayment.mockReturnValueOnce(new Promise(() => {})); // Never resolves

    render(<CashBuyPage />);

    await waitFor(() => {
      expect(screen.getByText('30분 상담권')).toBeInTheDocument();
    });

    const buyButtons = screen.getAllByText('구매하기');

    await act(async () => {
      fireEvent.click(buyButtons[0]);
    });

    // In 'preparing' state, skeleton loading cards replace the product cards,
    // showing "결제 준비 중..." text (3 skeleton cards), and the back button is disabled
    await waitFor(() => {
      expect(screen.getAllByText('결제 준비 중...').length).toBeGreaterThan(0);
    });

    // The back button should be disabled during preparing/processing
    const backButton = screen.getByText('← 지갑으로 돌아가기');
    expect(backButton).toBeDisabled();
  });
});
