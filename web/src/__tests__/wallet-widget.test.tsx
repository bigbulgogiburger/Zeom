import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletWidget from '@/components/wallet-widget';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock api-client
jest.mock('@/components/api-client', () => ({
  getWallet: jest.fn(),
}));

// Mock auth-context
const mockMe = { id: 1, email: 'test@test.com', name: 'Test User', role: 'USER' as const };
jest.mock('@/components/auth-context', () => ({
  useAuth: jest.fn(),
}));

import { getWallet } from '@/components/api-client';
import { useAuth } from '@/components/auth-context';

const mockGetWallet = getWallet as jest.MockedFunction<typeof getWallet>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Match split balance text: "50,000" + "원" rendered in separate spans
const balanceMatcher = (formatted: string) => (_: string, node: Element | null) => {
  if (!node) return false;
  const text = node.textContent ?? '';
  return text.includes(formatted) && text.includes('원');
};

describe('WalletWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ me: null, loading: false, refreshMe: jest.fn() });

    const { container } = render(<WalletWidget />);

    expect(container.firstChild).toBeNull();
  });

  it('loads and displays wallet balance', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 50000,
    });

    render(<WalletWidget />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: '내 지갑' });
      expect(button).toHaveTextContent('50,000');
      expect(button).toHaveTextContent('원');
    });

    expect(mockGetWallet).toHaveBeenCalledTimes(1);
  });

  it('shows loading state while fetching balance', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        id: 1,
        userId: 1,
        balance: 30000,
      }), 100))
    );

    render(<WalletWidget />);

    // Loading 상태에서 ellipsis(…)가 보여야 한다
    expect(screen.getByText('…')).toBeInTheDocument();

    await waitFor(() => {
      const button = screen.getByRole('button', { name: '내 지갑' });
      expect(button).toHaveTextContent('30,000');
    });
  });

  it('hides button when balance is null after fetch error', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<WalletWidget />);

    await waitFor(() => {
      // hideWhenAnonymous=true 기본값 — null balance + loading=false 시 hidden
      expect(container.querySelector('button')).toBeNull();
    });
  });

  it('silently handles fetch errors without crashing', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockRejectedValueOnce(new Error('Server error'));

    const { container } = render(<WalletWidget />);

    await waitFor(() => {
      expect(container.querySelector('button')).toBeNull();
    });

    expect(screen.queryByText('Server error')).not.toBeInTheDocument();
  });

  it('navigates to wallet page on click', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 20000,
    });

    render(<WalletWidget />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '내 지갑' })).toHaveTextContent('20,000');
    });

    fireEvent.click(screen.getByRole('button', { name: '내 지갑' }));

    expect(mockPush).toHaveBeenCalledWith('/wallet');
  });

  it('auto-refreshes balance on window focus', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockResolvedValue({
      id: 1,
      userId: 1,
      balance: 10000,
    });

    render(<WalletWidget />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '내 지갑' })).toHaveTextContent('10,000');
    });

    expect(mockGetWallet).toHaveBeenCalledTimes(1);

    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 15000,
    });

    fireEvent.focus(window);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '내 지갑' })).toHaveTextContent('15,000');
    });

    expect(mockGetWallet).toHaveBeenCalledTimes(2);
  });

  it('does not load balance if user is null', () => {
    mockUseAuth.mockReturnValue({ me: null, loading: false, refreshMe: jest.fn() });

    render(<WalletWidget />);

    expect(mockGetWallet).not.toHaveBeenCalled();
  });

  it('reloads balance when user changes from null to logged in', async () => {
    mockUseAuth.mockReturnValue({ me: null, loading: false, refreshMe: jest.fn() });
    const { rerender } = render(<WalletWidget />);

    expect(mockGetWallet).not.toHaveBeenCalled();

    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 40000,
    });

    rerender(<WalletWidget />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '내 지갑' })).toHaveTextContent('40,000');
    });

    expect(mockGetWallet).toHaveBeenCalledTimes(1);
  });

  it('renders wallet icon (lucide svg)', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 5000,
    });

    const { container } = render(<WalletWidget />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: '내 지갑' });
      expect(button.querySelector('svg')).not.toBeNull();
    });

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('cleans up focus event listener on unmount', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 10000,
    });

    const { unmount } = render(<WalletWidget />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '내 지갑' })).toHaveTextContent('10,000');
    });

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});

// Suppress unused warning for helper kept for future use
void balanceMatcher;
