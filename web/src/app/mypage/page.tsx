'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../components/api-client';
import { useAuth } from '../../components/auth-context';
import { toast } from 'sonner';
import { Card, ActionButton } from '../../components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  emailVerified: boolean;
  deletionRequestedAt: string | null;
  createdAt?: string | null;
}

interface UserStats {
  consultations: number;
  cashBalance: number;
  reviews: number;
}

export default function MypagePage() {
  useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats] = useState<UserStats>({ consultations: 0, cashBalance: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/v1/users/me', { cache: 'no-store' });
        if (res.ok) {
          setProfile(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function resendVerification() {
    setResending(true);
    try {
      const res = await apiFetch('/api/v1/auth/resend-verification', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        toast.success('인증 이메일이 발송되었습니다');
      } else {
        toast.error(json.message ?? '발송에 실패했습니다');
      }
    } catch {
      toast.error('서버에 연결할 수 없습니다');
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-[hsl(var(--surface))] rounded" />
          <div className="h-4 w-48 bg-[hsl(var(--surface))] rounded" />
          <div className="h-4 w-40 bg-[hsl(var(--surface))] rounded" />
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertDescription>프로필 정보를 불러올 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  const roleLabel = { USER: '일반 회원', ADMIN: '관리자', COUNSELOR: '상담사' }[profile.role] ?? profile.role;
  const genderLabel = profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : null;
  const nameInitial = profile.name ? profile.name.charAt(0) : '?';
  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
    : null;

  return (
    <div className="space-y-6">
      {profile.deletionRequestedAt && (
        <Alert variant="destructive">
          <AlertDescription>
            계정 탈퇴가 요청되었습니다. 30일 후 완전히 삭제됩니다.
          </AlertDescription>
        </Alert>
      )}

      {!profile.emailVerified && (
        <div className="p-4 rounded-xl bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.2)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle aria-hidden="true" className="size-5 text-[hsl(var(--gold))] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-[hsl(var(--gold))]">이메일 인증이 필요합니다</p>
                <p className="text-xs text-[hsl(var(--text-secondary))] mt-1">인증 이메일을 확인해주세요.</p>
              </div>
            </div>
            <ActionButton
              onClick={resendVerification}
              loading={resending}
              className="text-xs !min-h-[36px] !px-4 !py-1"
            >
              인증 메일 재발송
            </ActionButton>
          </div>
        </div>
      )}

      {/* Hero — 80px avatar + name + 가입일 */}
      <header className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-[hsl(var(--gold)/0.18)] to-[hsl(var(--dancheong)/0.1)] border border-[hsl(var(--gold)/0.2)]">
        <div className="size-20 rounded-full bg-[hsl(var(--gold)/0.2)] border-2 border-[hsl(var(--gold)/0.3)] flex items-center justify-center shrink-0">
          <span className="font-heading text-3xl font-bold text-[hsl(var(--gold))]">{nameInitial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl font-bold text-[hsl(var(--text-primary))]">{profile.name}</h1>
            <span className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] text-xs rounded-full px-3 py-1 font-bold">
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm text-[hsl(var(--text-secondary))] truncate">{profile.email}</span>
            {profile.emailVerified && (
              <CheckCircle aria-hidden="true" className="size-4 text-[hsl(var(--success))] shrink-0" />
            )}
          </div>
          {joinDate && (
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">가입일: {joinDate}</p>
          )}
        </div>
      </header>

      {/* Stats — 3 cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="이용 상담" value={stats.consultations} unit="회" />
        <StatCard label="캐시 잔액" value={stats.cashBalance} unit="원" />
        <StatCard label="작성 리뷰" value={stats.reviews} unit="건" />
      </div>

      {/* Account info */}
      <Card>
        <h2 className="text-sm font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider mb-4">계정 정보</h2>
        <div className="space-y-5">
          <InfoRow label="이메일" value={profile.email}>
            {profile.emailVerified && (
              <CheckCircle aria-hidden="true" className="size-4 text-[hsl(var(--success))] ml-2" />
            )}
          </InfoRow>
          <InfoRow label="이름" value={profile.name} />
          <InfoRow label="회원 등급" value={roleLabel} />
          <InfoRow label="전화번호" value={profile.phone ?? '미등록'} />
        </div>
      </Card>

      {/* Saju info */}
      <Card>
        <h2 className="text-sm font-bold text-[hsl(var(--text-secondary))] uppercase tracking-wider mb-4">사주 정보</h2>
        <div className="space-y-5">
          <InfoRow label="생년월일" value={profile.birthDate ?? '미등록'} />
          {genderLabel && <InfoRow label="성별" value={genderLabel} />}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] p-4">
      <p className="text-xs text-[hsl(var(--text-secondary))] mb-2">{label}</p>
      <p className="font-heading text-2xl font-bold text-[hsl(var(--gold))] tabular">
        {value.toLocaleString('ko-KR')}
        <span className="text-sm text-[hsl(var(--text-secondary))] ml-1 font-normal">{unit}</span>
      </p>
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[hsl(var(--border-subtle))] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[hsl(var(--text-secondary))] font-medium">{label}</span>
      <span className="text-sm font-bold text-[hsl(var(--text-primary))] flex items-center">
        {value}
        {children}
      </span>
    </div>
  );
}
