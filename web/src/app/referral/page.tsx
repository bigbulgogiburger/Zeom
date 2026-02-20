'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import {
  Card,
  PageTitle,
  InlineError,
  InlineSuccess,
  EmptyState,
  ActionButton,
  SkeletonCard,
  FormField,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ReferralReward = {
  refereeId: number;
  rewardAmount: number;
  referrerRewarded: boolean;
  createdAt: string;
};

type ReferralStats = {
  myCode: string;
  totalReferrals: number;
  rewardedCount: number;
  totalRewardAmount: number;
  rewards: ReferralReward[];
};

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Apply referral code
  const [applyCode, setApplyCode] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // First ensure code exists
      await apiFetch('/api/v1/referral/my-code');
      const res = await apiFetch('/api/v1/referral/stats');
      if (!res.ok) throw new Error('추천 통계를 불러올 수 없습니다.');
      const data = await res.json();
      setStats(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleCopyCode() {
    if (!stats?.myCode) return;
    try {
      await navigator.clipboard.writeText(stats.myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = stats.myCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCopyShareLink() {
    if (!stats?.myCode) return;
    const shareUrl = `${window.location.origin}/signup?ref=${stats.myCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleApplyCode() {
    setApplying(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/v1/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: applyCode.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '추천 코드 적용에 실패했습니다.');
      setSuccess(data.message || '추천 코드가 적용되었습니다!');
      setApplyCode('');
      fetchStats();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  }

  function handleKakaoShare() {
    if (!stats?.myCode) return;
    const shareUrl = `${window.location.origin}/signup?ref=${stats.myCode}`;
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('천지연꽃신당에서 상담받고 2,000원 보상 받으세요!')}`;
    window.open(kakaoUrl, '_blank', 'width=600,height=400');
  }

  return (
    <RequireLogin>
      <main className="min-h-screen bg-[#0f0d0a] p-6">
        <div className="max-w-3xl mx-auto">
          <PageTitle>친구 초대</PageTitle>

          {error && <InlineError message={error} />}
          {success && <InlineSuccess message={success} />}

          {loading ? (
            <SkeletonCard lines={5} />
          ) : (
            <>
              {/* My Referral Code */}
              <Card className="mb-6">
                <h3 className="text-lg font-bold text-[#C9A227] mb-4">내 추천 코드</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 bg-[#1a1612] border border-[rgba(201,162,39,0.2)] rounded-xl px-4 py-3 text-center">
                    <span className="text-2xl font-mono font-bold tracking-widest text-[#C9A227]">
                      {stats?.myCode || '-'}
                    </span>
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    className="bg-[#C9A227] text-[#0f0d0a] hover:bg-[#D4A843] min-h-[44px] font-bold"
                  >
                    {copied ? '복사됨!' : '복사'}
                  </Button>
                </div>
                <p className="text-sm text-[#a49484] mb-4">
                  친구가 추천 코드를 입력하고 가입하면, 양쪽 모두 2,000원 보상을 받습니다.
                </p>

                {/* Share Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleKakaoShare}
                    className="flex-1 min-h-[44px] font-bold rounded-xl"
                    style={{ backgroundColor: '#FEE500', color: '#191919' }}
                  >
                    카카오톡 공유
                  </Button>
                  <Button
                    onClick={handleCopyShareLink}
                    variant="outline"
                    className="flex-1 min-h-[44px] font-bold rounded-xl border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/10"
                  >
                    URL 복사
                  </Button>
                </div>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="text-center">
                  <p className="text-sm text-[#a49484] mb-1">초대 수</p>
                  <p className="text-2xl font-bold text-[#C9A227]">{stats?.totalReferrals || 0}</p>
                </Card>
                <Card className="text-center">
                  <p className="text-sm text-[#a49484] mb-1">가입 완료</p>
                  <p className="text-2xl font-bold text-[#C9A227]">{stats?.rewardedCount || 0}</p>
                </Card>
                <Card className="text-center">
                  <p className="text-sm text-[#a49484] mb-1">받은 보상</p>
                  <p className="text-2xl font-bold text-[#C9A227]">
                    {(stats?.totalRewardAmount || 0).toLocaleString()}원
                  </p>
                </Card>
              </div>

              {/* Apply Referral Code */}
              <Card className="mb-6">
                <h3 className="text-lg font-bold text-[#C9A227] mb-4">추천 코드 입력</h3>
                <div className="flex gap-3">
                  <Input
                    value={applyCode}
                    onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                    placeholder="추천 코드 입력"
                    className="flex-1 min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl font-mono tracking-wider"
                  />
                  <ActionButton
                    onClick={handleApplyCode}
                    loading={applying}
                    disabled={!applyCode}
                  >
                    적용
                  </ActionButton>
                </div>
              </Card>

              {/* Reward History */}
              <Card>
                <h3 className="text-lg font-bold text-[#C9A227] mb-4">보상 내역</h3>
                {(!stats?.rewards || stats.rewards.length === 0) ? (
                  <EmptyState title="보상 내역이 없습니다" desc="친구를 초대하면 보상 내역이 여기에 표시됩니다." />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>초대된 사용자</TableHead>
                          <TableHead>보상 금액</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>일시</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.rewards.map((reward, idx) => (
                          <TableRow key={idx}>
                            <TableCell>사용자 #{reward.refereeId}</TableCell>
                            <TableCell className="font-bold">
                              {reward.rewardAmount.toLocaleString()}원
                            </TableCell>
                            <TableCell>
                              {reward.referrerRewarded ? (
                                <Badge className="bg-green-900/50 text-green-300 border-green-700">지급 완료</Badge>
                              ) : (
                                <Badge variant="secondary">대기 중</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-[#a49484]">
                              {reward.createdAt.replace('T', ' ').slice(0, 16)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </main>
    </RequireLogin>
  );
}
