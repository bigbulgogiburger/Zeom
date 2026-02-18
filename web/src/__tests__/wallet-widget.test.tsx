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
const mockMe = { id: 1, email: 'test@test.com', name: 'Test User', role: 'USER' };
jest.mock('@/components/auth-context', () => ({
  useAuth: jest.fn(),
}));

import { getWallet } from '@/components/api-client';
import { useAuth } from '@/components/auth-context';

const mockGetWallet = getWallet as jest.MockedFunction<typeof getWallet>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

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
      expect(screen.getByText('50,000원')).toBeInTheDocument();
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

    expect(screen.getByText('...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('30,000원')).toBeInTheDocument();
    });
  });

  it('shows fallback text when balance is null', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockRejectedValueOnce(new Error('Network error'));

    render(<WalletWidget />);

    // Initially loading
    expect(screen.getByText('...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('지갑')).toBeInTheDocument();
    });
  });

  it('silently handles fetch errors without crashing', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockRejectedValueOnce(new Error('Server error'));

    render(<WalletWidget />);

    await waitFor(() => {
      expect(screen.getByText('지갑')).toBeInTheDocument();
    });

    // Should not throw or display error to user
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
      expect(screen.getByText('20,000원')).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: '내 지갑' });
    fireEvent.click(button);

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
      expect(screen.getByText('10,000원')).toBeInTheDocument();
    });

    expect(mockGetWallet).toHaveBeenCalledTimes(1);

    // Update mock to return new balance
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 15000,
    });

    // Simulate window focus event
    fireEvent.focus(window);

    await waitFor(() => {
      expect(screen.getByText('15,000원')).toBeInTheDocument();
    });

    expect(mockGetWallet).toHaveBeenCalledTimes(2);
  });

  it('does not load balance if user is null', () => {
    mockUseAuth.mockReturnValue({ me: null, loading: false, refreshMe: jest.fn() });

    render(<WalletWidget />);

    expect(mockGetWallet).not.toHaveBeenCalled();
  });

  it('reloads balance when user changes from null to logged in', async () => {
    const { rerender } = render(<WalletWidget />);

    mockUseAuth.mockReturnValue({ me: null, loading: false, refreshMe: jest.fn() });
    rerender(<WalletWidget />);

    expect(mockGetWallet).not.toHaveBeenCalled();

    // User logs in
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 40000,
    });

    rerender(<WalletWidget />);

    await waitFor(() => {
      expect(screen.getByText('40,000원')).toBeInTheDocument();
    });

    expect(mockGetWallet).toHaveBeenCalledTimes(1);
  });

  it('displays emoji icon', async () => {
    mockUseAuth.mockReturnValue({ me: mockMe, loading: false, refreshMe: jest.fn() });
    mockGetWallet.mockResolvedValueOnce({
      id: 1,
      userId: 1,
      balance: 5000,
    });

    render(<WalletWidget />);

    await waitFor(() => {
      expect(screen.getByText('💰')).toBeInTheDocument();
    });
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
      expect(screen.getByText('10,000원')).toBeInTheDocument();
    });

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
