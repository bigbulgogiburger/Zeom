'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../components/api-client';
import { clearTokens } from '../../../components/auth-client';
import { useToast } from '../../../components/toast';
import { Card, ActionButton, ConfirmDialog } from '../../../components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setShowConfirm(false);
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/v1/users/me', { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        toast('계정 탈퇴가 요청되었습니다', 'info');
        clearTokens();
        router.push('/login');
      } else {
        setError(json.message ?? '계정 탈퇴에 실패했습니다');
      }
    } catch {
      setError('서버에 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <h2 className="text-xl font-bold font-heading mb-4 text-[var(--color-danger)]">계정 탈퇴</h2>

        <div className="space-y-4 text-sm text-[#a49484] leading-relaxed">
          <p>
            계정 탈퇴를 요청하시면 <span className="text-foreground font-bold">30일의 유예 기간</span> 후에 계정이 완전히 삭제됩니다.
          </p>
          <div className="p-4 rounded-xl bg-[#1a1612] border border-[rgba(201,162,39,0.15)]">
            <p className="font-bold text-foreground mb-2">탈퇴 시 삭제되는 정보:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>계정 정보 (이메일, 이름, 전화번호)</li>
              <li>예약 및 상담 이력</li>
              <li>결제 및 캐시 잔액</li>
              <li>리뷰 및 작성 내용</li>
            </ul>
          </div>
          <p className="text-xs">
            유예 기간 내에 다시 로그인하시면 탈퇴 요청이 취소됩니다.
          </p>
        </div>

        {error && (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <ActionButton
          onClick={() => setShowConfirm(true)}
          loading={loading}
          className="w-full mt-6 !bg-[var(--color-danger)] !from-transparent !to-transparent hover:!bg-[var(--color-danger)]/80"
        >
          계정 탈퇴 요청
        </ActionButton>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        title="계정 탈퇴"
        message="정말로 계정을 탈퇴하시겠습니까? 30일 후 모든 데이터가 삭제됩니다."
        confirmLabel="탈퇴하기"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
