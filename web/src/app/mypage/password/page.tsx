'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '../../../components/api-client';
import { useToast } from '../../../components/toast';
import { ActionButton, Card, FormField } from '../../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newPasswordValid = newPassword.length >= 8;
  const confirmValid = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = currentPassword.length > 0 && newPasswordValid && confirmValid;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/v1/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (res.ok) {
        toast('비밀번호가 변경되었습니다', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(json.message ?? '비밀번호 변경에 실패했습니다');
      }
    } catch {
      setError('서버에 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold font-heading mb-6">비밀번호 변경</h2>

      <form onSubmit={onSubmit}>
        <FormField label="현재 비밀번호" required>
          <div className="relative w-full">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호"
              required
              autoComplete="current-password"
              className="min-h-[44px] pr-16 bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCurrent(!showCurrent)}
              tabIndex={-1}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[#a49484] text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent hover:text-[#C9A227]"
            >
              {showCurrent ? '숨기기' : '보기'}
            </Button>
          </div>
        </FormField>

        <FormField label="새 비밀번호" required hint="8자 이상 입력해주세요"
          error={newPassword && !newPasswordValid ? '비밀번호는 8자 이상이어야 합니다' : ''}
        >
          <div className="relative w-full">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호"
              required
              autoComplete="new-password"
              className="min-h-[44px] pr-16 bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[#a49484] text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent hover:text-[#C9A227]"
            >
              {showNew ? '숨기기' : '보기'}
            </Button>
          </div>
        </FormField>

        <FormField
          label="새 비밀번호 확인"
          required
          error={confirmPassword && !confirmValid ? '비밀번호가 일치하지 않습니다' : ''}
        >
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호 확인"
            required
            autoComplete="new-password"
            className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
          />
        </FormField>

        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <ActionButton
          type="submit"
          loading={loading}
          disabled={!canSubmit}
          className="w-full mt-2"
        >
          비밀번호 변경
        </ActionButton>
      </form>
    </Card>
  );
}
