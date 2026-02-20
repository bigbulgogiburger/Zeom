'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../components/api-client';
import { useToast } from '../../../components/toast';
import { ActionButton, Card, FormField } from '../../../components/ui';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  birthDate: string | null;
}

export default function EditProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/v1/users/me', { cache: 'no-store' });
        if (res.ok) {
          const data: UserProfile = await res.json();
          setName(data.name);
          setPhone(data.phone ?? '');
          setBirthDate(data.birthDate ?? '');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  const nameValid = name.trim().length >= 2;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/v1/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone || null,
          birthDate: birthDate || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast('프로필이 수정되었습니다', 'success');
      } else {
        setError(json.message ?? '프로필 수정에 실패했습니다');
      }
    } catch {
      setError('서버에 연결할 수 없습니다');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-[#1a1612] rounded" />
          <div className="h-10 w-full bg-[#1a1612] rounded" />
          <div className="h-10 w-full bg-[#1a1612] rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-bold font-heading mb-6">프로필 수정</h2>

      <FormField label="이름" required error={name && !nameValid ? '이름은 2자 이상이어야 합니다' : ''}>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
        />
      </FormField>

      <FormField label="전화번호" hint="선택 사항입니다">
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-0000-0000"
          className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
        />
      </FormField>

      <FormField label="생년월일" hint="선택 사항입니다 (YYYY-MM-DD)">
        <Input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
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
        onClick={handleSave}
        loading={saving}
        disabled={!nameValid}
        className="w-full mt-2"
      >
        저장
      </ActionButton>
    </Card>
  );
}
