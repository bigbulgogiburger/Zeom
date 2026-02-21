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

// OAuth login
export async function oauthLogin(provider: string, code: string, redirectUri: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/oauth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, code, redirectUri }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '소셜 로그인에 실패했습니다.');
  }
  return res.json();
}

// Wallet API methods
export async function getWallet() {
  const res = await apiFetch('/api/v1/wallet', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch wallet');
  return res.json();
}

export async function getWalletTransactions(page = 0, size = 20, filters?: { type?: string; from?: string; to?: string }) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (filters?.type) params.set('type', filters.type);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const res = await apiFetch(`/api/v1/wallet/transactions?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function getTransactionReceipt(txId: number) {
  const res = await apiFetch(`/api/v1/cash/transactions/${txId}/receipt`, { cache: 'no-store' });
  if (!res.ok) throw new Error('영수증을 불러올 수 없습니다.');
  return res.json();
}

export async function getTransactionReceiptHtml(txId: number) {
  const res = await apiFetch(`/api/v1/cash/transactions/${txId}/receipt/html`, { cache: 'no-store' });
  if (!res.ok) throw new Error('영수증을 불러올 수 없습니다.');
  return res.blob();
}

export async function getTransactionReceiptPdf(txId: number) {
  const res = await apiFetch(`/api/v1/receipts/transactions/${txId}/pdf`, { cache: 'no-store' });
  if (!res.ok) throw new Error('영수증 PDF를 불러올 수 없습니다.');
  return res.blob();
}

export async function exportTransactionsCsv(filters?: { type?: string; from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const res = await apiFetch(`/api/v1/cash/transactions/csv?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('CSV 내보내기에 실패했습니다.');
  return res.blob();
}

// Counselor Bank Account API
export async function getCounselorBankAccount() {
  const res = await apiFetch('/api/v1/counselor/bank-account', { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('계좌 정보를 불러올 수 없습니다.');
  return res.json();
}

export async function registerCounselorBankAccount(data: { bankCode: string; accountNumber: string; holderName: string }) {
  const res = await apiFetch('/api/v1/counselor/bank-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '계좌 등록에 실패했습니다.');
  }
  return res.json();
}

export async function updateCounselorBankAccount(data: { bankCode: string; accountNumber: string; holderName: string }) {
  const res = await apiFetch('/api/v1/counselor/bank-account', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '계좌 수정에 실패했습니다.');
  }
  return res.json();
}

export async function getCashProducts() {
  const res = await apiFetch('/api/v1/products/cash', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch cash products');
  const data = await res.json();
  return data.products;
}

export async function chargeCash(amount: number, paymentMethod: string = 'TEST') {
  const res = await apiFetch('/api/v1/cash/charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, paymentMethod }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || '캐시 충전에 실패했습니다.');
  }
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

// Consultation waiting room / summary API methods
export async function checkCanEnter(reservationId: string) {
  const res = await apiFetch(`/api/v1/sessions/${reservationId}/can-enter`, { cache: 'no-store' });
  if (!res.ok) throw new Error('입장 가능 여부를 확인할 수 없습니다.');
  return res.json();
}

export async function getSessionSummary(reservationId: string) {
  const res = await apiFetch(`/api/v1/sessions/${reservationId}/summary`, { cache: 'no-store' });
  if (!res.ok) throw new Error('상담 요약을 불러올 수 없습니다.');
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

// Session realtime API methods
export async function getNextConsecutive(sessionId: string) {
  const res = await apiFetch(`/api/v1/sessions/${sessionId}/next-consecutive`, { cache: 'no-store' });
  if (!res.ok) return { hasNext: false };
  return res.json();
}

export async function continueNextSession(sessionId: string, nextBookingId: number) {
  const res = await apiFetch(`/api/v1/sessions/${sessionId}/continue-next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nextBookingId }),
  });
  if (!res.ok) throw new Error('연속 상담 연장에 실패했습니다.');
  return res.json();
}

export async function consumeSessionCredit(sessionId: string) {
  const res = await apiFetch(`/api/v1/sessions/${sessionId}/consume-credit`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('크레딧 소모에 실패했습니다.');
  return res.json();
}

export async function markCounselorReady(sessionId: string) {
  const res = await apiFetch(`/api/v1/sessions/${sessionId}/counselor-ready`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('상담사 준비 상태 변경에 실패했습니다.');
  return res.json();
}

export async function getSessionStatus(sessionId: string) {
  const res = await apiFetch(`/api/v1/sessions/${sessionId}/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error('세션 상태를 확인할 수 없습니다.');
  return res.json();
}

// Credit API methods
export async function getCreditBalance() {
  const res = await apiFetch('/api/v1/credits/my', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch credit balance');
  const data = await res.json();
  return {
    totalCredits: data.totalUnits ?? data.totalCredits ?? 0,
    usedCredits: data.usedUnits ?? data.usedCredits ?? 0,
    remainingCredits: data.remainingUnits ?? data.remainingCredits ?? 0,
  };
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
