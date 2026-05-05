'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '../../../components/api-client';
import { toast } from 'sonner';
import { ActionButton, Card, FormField } from '../../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrengthMeter } from '@/components/design';

export default function ChangePasswordPage() {
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
        toast.success('비밀번호가 변경되었습니다');
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
    <Card className="max-w-[600px]">
      <h1 className="font-heading text-2xl font-bold mb-2 text-[hsl(var(--gold))]">비밀번호 변경</h1>
      <p className="text-sm text-[hsl(var(--text-secondary))] mb-8">계정 보안을 위해 주기적으로 변경하세요.</p>

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
              className="min-h-[44px] pr-16 rounded-xl"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCurrent(!showCurrent)}
              tabIndex={-1}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[hsl(var(--text-secondary))] text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent hover:text-[hsl(var(--gold))]"
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
              className="min-h-[44px] pr-16 rounded-xl"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[hsl(var(--text-secondary))] text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent hover:text-[hsl(var(--gold))]"
            >
              {showNew ? '숨기기' : '보기'}
            </Button>
          </div>
          {newPassword.length > 0 && (
            <div className="mt-2">
              <PasswordStrengthMeter password={newPassword} />
            </div>
          )}
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
            className="min-h-[44px] rounded-xl"
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
