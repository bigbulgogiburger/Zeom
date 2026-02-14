import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RequireLogin, RequireAdmin } from '../components/route-guard';

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock auth-context
const mockUseAuth = jest.fn();
jest.mock('../components/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('RequireLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows skeleton while auth is loading', () => {
    mockUseAuth.mockReturnValue({ me: null, loading: true });

    const { container } = render(
      <RequireLogin>
        <div data-testid="protected">Protected Content</div>
      </RequireLogin>
    );

    // AuthSkeleton renders a main element with skeleton divs
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ me: null, loading: false });

    render(
      <RequireLogin>
        <div data-testid="protected">Protected Content</div>
      </RequireLogin>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('renders children when authenticated as USER', () => {
    mockUseAuth.mockReturnValue({
      me: { id: 1, email: 'u@test.com', name: 'User', role: 'USER' },
      loading: false,
    });

    render(
      <RequireLogin>
        <div data-testid="protected">Protected Content</div>
      </RequireLogin>
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders children when authenticated as ADMIN', () => {
    mockUseAuth.mockReturnValue({
      me: { id: 2, email: 'a@test.com', name: 'Admin', role: 'ADMIN' },
      loading: false,
    });

    render(
      <RequireLogin>
        <div data-testid="protected">Protected Content</div>
      </RequireLogin>
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('shows skeleton when loading even with no user', () => {
    mockUseAuth.mockReturnValue({ me: null, loading: true });

    const { container } = render(
      <RequireLogin>
        <div>Content</div>
      </RequireLogin>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    // Does not redirect during loading
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('RequireAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows skeleton while auth is loading', () => {
    mockUseAuth.mockReturnValue({ me: null, loading: true });

    const { container } = render(
      <RequireAdmin>
        <div data-testid="admin-content">Admin Content</div>
      </RequireAdmin>
    );

    expect(container.querySelector('main')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('redirects to /admin/login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ me: null, loading: false });

    render(
      <RequireAdmin>
        <div data-testid="admin-content">Admin Content</div>
      </RequireAdmin>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('redirects to / when authenticated but not ADMIN', async () => {
    mockUseAuth.mockReturnValue({
      me: { id: 1, email: 'u@test.com', name: 'User', role: 'USER' },
      loading: false,
    });

    render(
      <RequireAdmin>
        <div data-testid="admin-content">Admin Content</div>
      </RequireAdmin>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated as ADMIN', () => {
    mockUseAuth.mockReturnValue({
      me: { id: 2, email: 'a@test.com', name: 'Admin', role: 'ADMIN' },
      loading: false,
    });

    render(
      <RequireAdmin>
        <div data-testid="admin-content">Admin Content</div>
      </RequireAdmin>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
