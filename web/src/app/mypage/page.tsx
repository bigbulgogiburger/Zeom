'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../components/api-client';
import { useAuth } from '../../components/auth-context';
import { useToast } from '../../components/toast';
import { Card, ActionButton } from '../../components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
}

export default function MypagePage() {
  const { me } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
        toast('인증 이메일이 발송되었습니다', 'success');
      } else {
        toast(json.message ?? '발송에 실패했습니다', 'error');
      }
    } catch {
      toast('서버에 연결할 수 없습니다', 'error');
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-[#1a1612] rounded" />
          <div className="h-4 w-48 bg-[#1a1612] rounded" />
          <div className="h-4 w-40 bg-[#1a1612] rounded" />
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
        <div className="p-4 rounded-xl bg-[#1a1612] border border-[rgba(201,162,39,0.3)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#C9A227]">이메일 인증이 필요합니다</p>
              <p className="text-xs text-[#a49484] mt-1">인증 이메일을 확인해주세요.</p>
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

      <Card>
        <div className="space-y-5">
          <InfoRow label="이메일" value={profile.email}>
            {profile.emailVerified && (
              <span className="text-xs bg-[#C9A227]/20 text-[#C9A227] px-2 py-0.5 rounded-full font-bold ml-2">
                인증됨
              </span>
            )}
          </InfoRow>
          <InfoRow label="이름" value={profile.name} />
          <InfoRow label="회원 등급" value={roleLabel} />
          <InfoRow label="전화번호" value={profile.phone ?? '미등록'} />
          <InfoRow label="생년월일" value={profile.birthDate ?? '미등록'} />
          {genderLabel && <InfoRow label="성별" value={genderLabel} />}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[rgba(201,162,39,0.08)] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[#a49484] font-medium">{label}</span>
      <span className="text-sm font-bold text-foreground flex items-center">
        {value}
        {children}
      </span>
    </div>
  );
}
