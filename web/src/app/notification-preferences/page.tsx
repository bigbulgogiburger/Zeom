'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';

type Preferences = {
  bookingConfirmedEmail: boolean;
  consultationReminderEmail: boolean;
  consultationCompletedEmail: boolean;
  refundStatusEmail: boolean;
  settlementPaidEmail: boolean;
  reviewReceivedEmail: boolean;
  newBookingEmail: boolean;
};

const PREFERENCE_LABELS: { key: keyof Preferences; label: string; description: string }[] = [
  { key: 'bookingConfirmedEmail', label: '예약 확정', description: '예약이 확정되었을 때 이메일 알림' },
  { key: 'consultationReminderEmail', label: '상담 리마인더', description: '상담 시작 전 리마인더 이메일' },
  { key: 'consultationCompletedEmail', label: '상담 완료', description: '상담이 완료되었을 때 이메일 알림' },
  { key: 'refundStatusEmail', label: '환불 상태', description: '환불 요청 및 처리 결과 이메일 알림' },
  { key: 'settlementPaidEmail', label: '정산 완료', description: '정산이 완료되었을 때 이메일 알림' },
  { key: 'reviewReceivedEmail', label: '리뷰 알림', description: '새 리뷰가 등록되었을 때 이메일 알림' },
  { key: 'newBookingEmail', label: '새 예약', description: '새 예약이 접수되었을 때 이메일 알림' },
];

export default function NotificationPreferencesPage() {
  const { me, loading: authLoading } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !me) {
      router.push('/login');
      return;
    }
    if (me) {
      fetchPreferences();
    }
  }, [me, authLoading, router]);

  async function fetchPreferences() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/notification-preferences', { cache: 'no-store' });
      if (res.ok) {
        setPreferences(await res.json());
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(key: keyof Preferences) {
    if (!preferences) return;
    setSaved(false);
    setPreferences(prev => prev ? { ...prev, [key]: !prev[key] } : null);
  }

  async function handleSave() {
    if (!preferences) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/v1/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="max-w-[600px] mx-auto px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 bg-[#1a1612] rounded-lg" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-[#1a1612] rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[600px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/notifications')}
          className="text-sm text-[#a49484] hover:text-[#C9A227] transition-colors mb-4 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          알림으로 돌아가기
        </button>
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-text-on-dark)] font-heading">
          알림 설정
        </h1>
        <p className="text-[#a49484] text-sm mt-2">
          이메일 알림 수신 여부를 설정합니다.
        </p>
      </div>

      {/* Preference toggles */}
      {preferences && (
        <div className="space-y-2">
          {PREFERENCE_LABELS.map(({ key, label, description }) => (
            <div
              key={key}
              className="bg-black/20 border border-[rgba(201,162,39,0.08)] rounded-xl px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-on-dark)]">
                  {label}
                </p>
                <p className="text-xs text-[#6b5c4d] mt-0.5">
                  {description}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => handleToggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 ${
                  preferences[key]
                    ? 'bg-[#C9A227]'
                    : 'bg-[#3a3530]'
                }`}
                role="switch"
                aria-checked={preferences[key]}
                aria-label={label}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    preferences[key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}

          {/* Save button */}
          <div className="pt-6 flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading px-8 py-2.5 hover:shadow-[0_4px_20px_rgba(201,162,39,0.15)] transition-all"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
            {saved && (
              <span className="text-sm text-[#C9A227] font-medium">
                저장되었습니다
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
