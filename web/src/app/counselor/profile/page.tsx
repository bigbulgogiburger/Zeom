'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/components/api-client';
import { Card, PageTitle, InlineError, StatCard, ActionButton, FormField } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

type Profile = {
  id: number;
  name: string;
  specialty: string;
  intro: string;
  ratingAvg: number;
  reviewCount: number;
  isActive: boolean;
};

const INTRO_MAX_LENGTH = 400;

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

export default function CounselorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [intro, setIntro] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/v1/counselor/me');
      if (!res.ok) throw new Error('프로필을 불러올 수 없습니다.');
      const data: Profile = await res.json();
      setProfile(data);
      setName(data.name || '');
      setSpecialty(data.specialty || '');
      setIntro(data.intro || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '프로필을 불러올 수 없습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (!specialty.trim()) {
      setError('전문분야를 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/api/v1/counselor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          specialty: specialty.trim(),
          intro: intro.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || '프로필 저장에 실패했습니다.');
      }
      const data: Profile = await res.json();
      setProfile(data);
      setName(data.name || '');
      setSpecialty(data.specialty || '');
      setIntro(data.intro || '');
      setSuccess('프로필이 저장되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '프로필 저장에 실패했습니다.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle>프로필 설정</PageTitle>
        <Card>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 w-1/4 bg-[var(--color-bg-secondary)] rounded mb-2" />
                <div className="h-10 w-full bg-[var(--color-bg-secondary)] rounded" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>프로필 설정</PageTitle>

      {/* Stats */}
      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="평균 평점"
            value={profile.ratingAvg > 0 ? `${profile.ratingAvg.toFixed(1)} ${renderStars(Math.round(profile.ratingAvg))}` : '-'}
          />
          <StatCard title="리뷰 수" value={`${profile.reviewCount}건`} />
          <StatCard
            title="상태"
            value={profile.isActive ? '활성' : '비활성'}
            hint={profile.isActive ? '현재 상담 가능' : '현재 상담 불가'}
          />
        </div>
      )}

      {/* Edit form */}
      <Card>
        <h3 className="font-heading font-bold text-lg text-[var(--color-accent-primary)] mb-4">
          기본 정보
        </h3>

        <FormField label="이름" required>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="상담사 이름"
            className="bg-white border-[var(--color-border-card)]"
          />
        </FormField>

        <FormField label="전문분야" required>
          <Input
            value={specialty}
            onChange={e => setSpecialty(e.target.value)}
            placeholder="예: 사주, 타로, 궁합"
            className="bg-white border-[var(--color-border-card)]"
          />
        </FormField>

        <FormField
          label="소개글"
          hint={`${intro.length}/${INTRO_MAX_LENGTH}자`}
        >
          <Textarea
            value={intro}
            onChange={e => {
              if (e.target.value.length <= INTRO_MAX_LENGTH) {
                setIntro(e.target.value);
              }
            }}
            placeholder="상담사 소개를 작성해 주세요..."
            rows={5}
            maxLength={INTRO_MAX_LENGTH}
            className="bg-white border-[var(--color-border-card)]"
          />
        </FormField>

        <Separator className="my-4 bg-[var(--color-border-card)]" />

        <InlineError message={error} />
        {success && (
          <div role="status" className="text-[var(--color-success)] text-sm font-medium mb-3">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <ActionButton loading={saving} onClick={handleSave}>
            프로필 저장
          </ActionButton>
        </div>
      </Card>
    </div>
  );
}
