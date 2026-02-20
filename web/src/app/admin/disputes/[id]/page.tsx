'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { RequireAdmin } from '@/components/route-guard';
import {
  Card,
  PageTitle,
  InlineError,
  InlineSuccess,
  StatusBadge,
  ActionButton,
  SkeletonCard,
} from '@/components/ui';

type DisputeDetail = {
  id: number;
  reservationId: number;
  userId: number;
  category: string;
  description: string;
  status: string;
  resolutionType: string;
  resolutionNote: string;
  resolvedBy: number;
  resolvedAt: string;
  createdAt: string;
  updatedAt: string;
};

type CustomerInfo = {
  id: number;
  name: string;
  email: string;
};

type BookingInfo = {
  id: number;
  status: string;
  creditsUsed: number;
  createdAt: string;
};

const RESOLUTION_TYPES = [
  { value: 'REFUND', label: '환불' },
  { value: 'CREDIT', label: '크레딧 보상' },
  { value: 'WARNING', label: '경고' },
  { value: 'DISMISS', label: '기각' },
];

export default function AdminDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  // Resolve form
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const loadDispute = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/v1/admin/disputes/${disputeId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? '분쟁 정보를 불러올 수 없습니다.');
        setLoading(false);
        return;
      }
      setDispute(json.dispute);
      setCustomer(json.customer?.id ? json.customer : null);
      setBooking(json.booking?.id ? json.booking : null);
    } catch {
      setError('분쟁 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    loadDispute();
  }, [loadDispute]);

  async function handleReview() {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/disputes/${disputeId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '검토 시작에 실패했습니다.');
      } else {
        setSuccess('검토가 시작되었습니다.');
        loadDispute();
      }
    } catch {
      setError('검토 시작 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleResolve() {
    if (!resolutionType) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/disputes/${disputeId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionType, note: resolutionNote }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '해결에 실패했습니다.');
      } else {
        setSuccess('분쟁이 해결되었습니다.');
        setShowResolveForm(false);
        loadDispute();
      }
    } catch {
      setError('해결 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>분쟁 상세</PageTitle>
          <SkeletonCard lines={8} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/disputes')}
            className="text-[#C9A227] font-heading font-bold text-sm hover:underline"
          >
            &larr; 목록으로
          </button>
          <PageTitle>분쟁 상세 #{disputeId}</PageTitle>
        </div>

        <InlineError message={error} />
        <InlineSuccess message={success} />

        {dispute && (
          <>
            {/* Dispute info */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge value={dispute.status} />
                  <span className="text-[#a49484] text-sm">카테고리: {dispute.category}</span>
                  <span className="text-[#a49484] text-sm">
                    접수일: {new Date(dispute.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-[#C9A227] mb-2">고객 주장</h4>
                  <p className="text-[#f9f5ed] text-sm leading-relaxed bg-[#1a1612] p-4 rounded-xl border border-[rgba(201,162,39,0.1)]">
                    {dispute.description || '내용 없음'}
                  </p>
                </div>

                {dispute.resolutionType && (
                  <div className="mt-4 p-4 bg-[rgba(201,162,39,0.05)] border border-[rgba(201,162,39,0.15)] rounded-xl">
                    <h4 className="font-heading font-bold text-sm text-[#C9A227] mb-2">중재 결과</h4>
                    <p className="text-sm"><strong>유형:</strong> {dispute.resolutionType}</p>
                    {dispute.resolutionNote && (
                      <p className="text-sm mt-1"><strong>메모:</strong> {dispute.resolutionNote}</p>
                    )}
                    {dispute.resolvedAt && (
                      <p className="text-[#a49484] text-xs mt-2">
                        해결일: {new Date(dispute.resolvedAt).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Customer info */}
            {customer && (
              <Card>
                <h4 className="font-heading font-bold text-sm text-[#C9A227] mb-3">고객 정보</h4>
                <p className="text-sm">이름: {customer.name}</p>
                <p className="text-sm text-[#a49484]">이메일: {customer.email}</p>
              </Card>
            )}

            {/* Booking info */}
            {booking && (
              <Card>
                <h4 className="font-heading font-bold text-sm text-[#C9A227] mb-3">관련 예약</h4>
                <p className="text-sm">예약 #{booking.id} - <StatusBadge value={booking.status} /></p>
                <p className="text-sm text-[#a49484]">크레딧: {booking.creditsUsed}</p>
                <p className="text-sm text-[#a49484]">
                  예약일: {new Date(booking.createdAt).toLocaleString('ko-KR')}
                </p>
              </Card>
            )}

            {/* Action buttons */}
            <Card>
              <div className="flex gap-3 flex-wrap">
                {dispute.status === 'OPEN' && (
                  <ActionButton onClick={handleReview} loading={processing}>
                    검토 시작
                  </ActionButton>
                )}
                {dispute.status === 'IN_REVIEW' && !showResolveForm && (
                  <ActionButton onClick={() => setShowResolveForm(true)}>
                    해결하기
                  </ActionButton>
                )}
              </div>

              {showResolveForm && dispute.status === 'IN_REVIEW' && (
                <div className="mt-4 p-4 border border-[rgba(201,162,39,0.15)] rounded-xl space-y-4">
                  <h4 className="font-heading font-bold text-sm">중재 결정</h4>
                  <div>
                    <label className="block mb-2 font-medium text-sm text-[#a49484]">유형 선택</label>
                    <div className="flex gap-2 flex-wrap">
                      {RESOLUTION_TYPES.map((rt) => (
                        <button
                          key={rt.value}
                          onClick={() => setResolutionType(rt.value)}
                          className={`rounded-full px-4 py-2 text-sm font-bold font-heading transition-colors border-2 ${
                            resolutionType === rt.value
                              ? 'bg-[#C9A227] text-[#0f0d0a] border-[#C9A227]'
                              : 'border-[rgba(201,162,39,0.3)] text-[#f9f5ed] hover:bg-[rgba(201,162,39,0.1)]'
                          }`}
                        >
                          {rt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="메모 (선택)"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[80px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none resize-none"
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => { setShowResolveForm(false); setResolutionType(''); setResolutionNote(''); }}
                      className="rounded-full border-2 border-[rgba(201,162,39,0.3)] text-[#f9f5ed] text-sm font-bold font-heading px-5 py-2 hover:bg-[rgba(201,162,39,0.1)] transition-colors"
                    >
                      취소
                    </button>
                    <ActionButton
                      onClick={handleResolve}
                      loading={processing}
                      disabled={!resolutionType}
                    >
                      해결 확인
                    </ActionButton>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </RequireAdmin>
  );
}
