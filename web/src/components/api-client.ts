import { API_BASE } from './api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth-client';
import { reportApiError, reportError } from './error-reporter';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh, deviceId: 'web-main', deviceName: navigator.userAgent.slice(0, 120) }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      setTokens(json.accessToken, json.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (err) {
    reportError(err, 'high', { path, method: init.method ?? 'GET', source: 'apiFetch' });
    throw err;
  }

  if (res.status === 401 && retry) {
    const hadTokens = !!(token || getRefreshToken());
    const ok = await refreshToken();
    if (!ok) {
      clearTokens();
      if (hadTokens) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return res;
    }
    return apiFetch(path, init, false);
  }

  if (!res.ok && res.status !== 401) {
    reportApiError(path, res.status, undefined);
  }

  return res;
}

// Wallet API methods
export async function getWallet() {
  const res = await apiFetch('/api/v1/wallet', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch wallet');
  return res.json();
}

export async function getWalletTransactions(page = 0, size = 20) {
  const res = await apiFetch(`/api/v1/wallet/transactions?page=${page}&size=${size}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function getCashProducts() {
  const res = await apiFetch('/api/v1/products/cash', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch cash products');
  return res.json();
}

// Payment API methods
export async function preparePayment(productId: number) {
  const res = await apiFetch('/api/v1/payments/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) throw new Error('Failed to prepare payment');
  return res.json();
}

export async function confirmPayment(paymentId: string, portonePaymentId: string) {
  const res = await apiFetch(`/api/v1/payments/${paymentId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portonePaymentId }),
  });
  if (!res.ok) throw new Error('Failed to confirm payment');
  return res.json();
}

// Session API methods
export async function getSessionToken(reservationId: string) {
  const res = await apiFetch(`/api/v1/sessions/${reservationId}/token`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to get session token');
  return res.json();
}

export async function endSession(sessionId: string) {
  const res = await apiFetch(`/api/v1/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endReason: 'COMPLETED' }),
  });
  if (!res.ok) throw new Error('Failed to end session');
  return res.json();
}

// Counselor API methods
export async function getCounselorTodayBookings() {
  const res = await apiFetch('/api/v1/sessions/counselor/bookings/today', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch today bookings');
  return res.json();
}

export async function getCounselorAuthToken() {
  const res = await apiFetch('/api/v1/sessions/counselor-auth', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to get counselor auth token');
  return res.json();
}

export async function getCounselorSessionToken(reservationId: string) {
  const res = await apiFetch(`/api/v1/sessions/${reservationId}/counselor-token`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to get counselor session token');
  return res.json();
}

export async function startSession(bookingId: string) {
  const res = await apiFetch(`/api/v1/sessions/${bookingId}/start`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to start session');
  return res.json();
}

// Credit API methods
export async function getCreditBalance() {
  const res = await apiFetch('/api/v1/credits/my', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch credit balance');
  return res.json();
}

export async function getCreditHistory() {
  const res = await apiFetch('/api/v1/credits/history', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch credit history');
  return res.json();
}

export async function purchaseCredit(productId: number) {
  const res = await apiFetch('/api/v1/credits/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '상담권 구매에 실패했습니다.');
  }
  return res.json();
}

// Counselor Portal API methods
export async function getCounselorBookings(params?: { date?: string; status?: string; page?: number; size?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set('date', params.date);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page !== undefined) searchParams.set('page', String(params.page));
  if (params?.size !== undefined) searchParams.set('size', String(params.size));
  const query = searchParams.toString();
  const res = await apiFetch(`/api/v1/counselor/bookings${query ? `?${query}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('예약 목록을 불러올 수 없습니다.');
  return res.json();
}

// Settlement API methods
export async function getMySettlements() {
  const res = await apiFetch('/api/v1/settlements/my', { cache: 'no-store' });
  if (!res.ok) throw new Error('정산 내역을 불러올 수 없습니다.');
  return res.json();
}

export async function getSettlementBySession(sessionId: string) {
  const res = await apiFetch(`/api/v1/settlements/session/${sessionId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('정산 정보를 불러올 수 없습니다.');
  return res.json();
}

export async function getCounselorSettlements() {
  const res = await apiFetch('/api/v1/counselor/settlements', { cache: 'no-store' });
  if (!res.ok) throw new Error('정산 내역을 불러올 수 없습니다.');
  return res.json();
}

export async function getCounselorSettlementDetail(id: number) {
  const res = await apiFetch(`/api/v1/counselor/settlements/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('정산 상세를 불러올 수 없습니다.');
  return res.json();
}

// Counselor Memo API
export async function saveCounselorMemo(sessionId: number, content: string) {
  const res = await apiFetch(`/api/v1/counselor/records/${sessionId}/memo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '메모 저장에 실패했습니다.');
  }
  return res.json();
}

// Counselor Customers API
export async function getCounselorCustomers() {
  const res = await apiFetch('/api/v1/counselor/customers', { cache: 'no-store' });
  if (!res.ok) throw new Error('고객 목록을 불러올 수 없습니다.');
  return res.json();
}

// Counselor Dashboard API
export async function getCounselorDashboard() {
  const res = await apiFetch('/api/v1/counselor/dashboard', { cache: 'no-store' });
  if (!res.ok) throw new Error('대시보드를 불러올 수 없습니다.');
  return res.json();
}

// Counselor Settlement Portal API
export async function getCounselorPortalSettlement(page = 0, size = 20) {
  const res = await apiFetch(`/api/v1/counselor/settlement?page=${page}&size=${size}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('정산 내역을 불러올 수 없습니다.');
  return res.json();
}

export async function requestCounselorSettlement() {
  const res = await apiFetch('/api/v1/counselor/settlement/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || '출금 요청에 실패했습니다.');
  return body;
}

// Admin Settlement API
export async function getAdminSettlements() {
  const res = await apiFetch('/api/v1/admin/settlements', { cache: 'no-store' });
  if (!res.ok) throw new Error('정산 목록을 불러올 수 없습니다.');
  return res.json();
}

export async function confirmAdminSettlement(id: number) {
  const res = await apiFetch(`/api/v1/admin/settlements/${id}/confirm`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '정산 확정에 실패했습니다.');
  }
  return res.json();
}

export async function payAdminSettlement(id: number) {
  const res = await apiFetch(`/api/v1/admin/settlements/${id}/pay`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '정산 지급에 실패했습니다.');
  }
  return res.json();
}

// Admin Session Monitoring API
export async function getActiveSessions() {
  const res = await apiFetch('/api/v1/admin/sessions/active', { cache: 'no-store' });
  if (!res.ok) throw new Error('활성 세션을 불러올 수 없습니다.');
  return res.json();
}

export async function getSessionStats() {
  const res = await apiFetch('/api/v1/admin/sessions/stats', { cache: 'no-store' });
  if (!res.ok) throw new Error('세션 통계를 불러올 수 없습니다.');
  return res.json();
}

export async function forceEndSession(sessionId: number) {
  const res = await apiFetch(`/api/v1/admin/sessions/${sessionId}/force-end`, {
    method: 'POST',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '세션 강제 종료에 실패했습니다.');
  }
  return res.json();
}

// Admin Settlements with filters
export async function getAllSettlements(filters?: {
  status?: string;
  counselorId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.counselorId) params.set('counselorId', String(filters.counselorId));
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.page !== undefined) params.set('page', String(filters.page));
  if (filters?.size !== undefined) params.set('size', String(filters.size));
  const query = params.toString();
  const res = await apiFetch(`/api/v1/admin/settlements${query ? `?${query}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('정산 목록을 불러올 수 없습니다.');
  return res.json();
}
