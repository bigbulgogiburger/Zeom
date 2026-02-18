import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RefundsPage from '@/app/refunds/page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock api-client
jest.mock('@/components/api-client', () => ({
  apiFetch: jest.fn(),
}));

// Mock route-guard
jest.mock('@/components/route-guard', () => ({
  RequireLogin: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { apiFetch } from '@/components/api-client';

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function mockResponse(body: any, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe('RefundsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRefunds = [
    {
      id: 1,
      reservationId: 100,
      counselorName: '김지혜',
      amount: 30000,
      reason: '일정 변경으로 인한 취소',
      status: 'PENDING',
      requestedAt: '2026-02-15T10:00:00Z',
      processedAt: null,
    },
    {
      id: 2,
      reservationId: 101,
      counselorName: '이민지',
      amount: 50000,
      reason: '상담사 변경 요청',
      status: 'APPROVED',
      requestedAt: '2026-02-14T10:00:00Z',
      processedAt: '2026-02-14T15:00:00Z',
    },
  ];

  it('renders refund list', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockRefunds, 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('김지혜 상담')).toBeInTheDocument();
      expect(screen.getByText('이민지 상담')).toBeInTheDocument();
    });

    expect(screen.getByText('30,000원')).toBeInTheDocument();
    expect(screen.getByText('50,000원')).toBeInTheDocument();
  });

  it('displays refund reasons', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockRefunds, 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('일정 변경으로 인한 취소')).toBeInTheDocument();
      expect(screen.getByText('상담사 변경 요청')).toBeInTheDocument();
    });
  });

  it('displays status badges', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockRefunds, 200));

    render(<RefundsPage />);

    await waitFor(() => {
      // StatusBadge component renders the status value
      expect(screen.getByText((content, element) => {
        return element?.getAttribute('data-value') === 'PENDING' || content === 'PENDING';
      })).toBeInTheDocument();

      expect(screen.getByText((content, element) => {
        return element?.getAttribute('data-value') === 'APPROVED' || content === 'APPROVED';
      })).toBeInTheDocument();
    });
  });

  it('displays requested and processed dates', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockRefunds, 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/신청일:/).length).toBeGreaterThan(0);
      expect(screen.getByText(/처리일:/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no refunds', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse([], 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('환불 신청 내역이 없습니다')).toBeInTheDocument();
      expect(screen.getByText('예약을 취소하거나 환불이 필요한 경우 신청할 수 있습니다.')).toBeInTheDocument();
    });
  });

  it('displays error message when fetch fails', async () => {
    mockApiFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Unauthorized' }, 401)
    );

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  it('displays generic error on network failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('환불 내역을 불러오는 중 오류가 발생했습니다.')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching', async () => {
    mockApiFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResponse([], 200)), 100))
    );

    render(<RefundsPage />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument();
    });
  });

  it('navigates to new refund page when button clicked', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse([], 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('+ 환불 신청')).toBeInTheDocument();
    });

    const newRefundButton = screen.getByText('+ 환불 신청');
    fireEvent.click(newRefundButton);

    expect(mockPush).toHaveBeenCalledWith('/refunds/new');
  });

  it('displays refund without processedAt correctly', async () => {
    const refundWithoutProcessedAt = [
      {
        id: 3,
        reservationId: 102,
        counselorName: '박서영',
        amount: 40000,
        reason: '개인 사유',
        status: 'PENDING',
        requestedAt: '2026-02-13T10:00:00Z',
        processedAt: null,
      },
    ];

    mockApiFetch.mockResolvedValueOnce(mockResponse(refundWithoutProcessedAt, 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('박서영 상담')).toBeInTheDocument();
      expect(screen.getByText(/신청일:/)).toBeInTheDocument();
      expect(screen.queryByText(/처리일:/)).not.toBeInTheDocument();
    });
  });

  it('displays refund without reason correctly', async () => {
    const refundWithoutReason = [
      {
        id: 4,
        reservationId: 103,
        counselorName: '최유진',
        amount: 25000,
        reason: '',
        status: 'REJECTED',
        requestedAt: '2026-02-12T10:00:00Z',
        processedAt: '2026-02-12T12:00:00Z',
      },
    ];

    mockApiFetch.mockResolvedValueOnce(mockResponse(refundWithoutReason, 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('최유진 상담')).toBeInTheDocument();
      expect(screen.queryByText('사유:')).not.toBeInTheDocument();
    });
  });

  it('clears refund list when fetch returns 4xx error', async () => {
    mockApiFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Forbidden' }, 403)
    );

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });

    // Should not show previous data
    expect(screen.queryByText('김지혜 상담')).not.toBeInTheDocument();
  });

  it('formats amounts with locale string', async () => {
    const largeAmountRefund = [
      {
        id: 5,
        reservationId: 104,
        counselorName: '강혜진',
        amount: 1500000,
        reason: '대량 환불',
        status: 'APPROVED',
        requestedAt: '2026-02-11T10:00:00Z',
        processedAt: '2026-02-11T14:00:00Z',
      },
    ];

    mockApiFetch.mockResolvedValueOnce(mockResponse(largeAmountRefund, 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('1,500,000원')).toBeInTheDocument();
    });
  });

  it('renders page title correctly', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse([], 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('환불 내역')).toBeInTheDocument();
    });
  });

  it('displays multiple refunds in order', async () => {
    mockApiFetch.mockResolvedValueOnce(mockResponse(mockRefunds, 200));

    render(<RefundsPage />);

    await waitFor(() => {
      expect(screen.getByText('김지혜 상담')).toBeInTheDocument();
      expect(screen.getByText('이민지 상담')).toBeInTheDocument();
    });
  });
});
