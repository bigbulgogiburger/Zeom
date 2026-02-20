'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/components/api-client';
import { RequireAdmin } from '@/components/route-guard';
import {
  Card,
  PageTitle,
  InlineError,
  InlineSuccess,
  EmptyState,
  StatusBadge,
  ActionButton,
  SkeletonCard,
  Pagination,
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

type CouponItem = {
  id: number;
  code: string;
  couponType: string;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
};

const PAGE_SIZE = 20;

const COUPON_TYPE_LABELS: Record<string, string> = {
  FIXED: '정액 할인',
  PERCENT: '정률 할인',
  FREE_FIRST: '첫 상담 무료',
};

function formatDiscount(type: string, value: number): string {
  if (type === 'PERCENT') return `${value}%`;
  if (type === 'FREE_FIRST') return '무료';
  return `${value.toLocaleString()}원`;
}

function formatDate(dateStr: string): string {
  return dateStr.replace('T', ' ').slice(0, 16);
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createType, setCreateType] = useState('FIXED');
  const [createValue, setCreateValue] = useState('');
  const [createMinOrder, setCreateMinOrder] = useState('');
  const [createMaxUses, setCreateMaxUses] = useState('');
  const [createValidFrom, setCreateValidFrom] = useState('');
  const [createValidUntil, setCreateValidUntil] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter) params.set('filter', filter);
      params.set('page', String(page - 1));
      params.set('size', String(PAGE_SIZE));
      const res = await apiFetch(`/api/v1/admin/coupons?${params.toString()}`);
      if (!res.ok) throw new Error('쿠폰 목록을 불러올 수 없습니다.');
      const data = await res.json();
      setCoupons(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  async function handleCreate() {
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const body: Record<string, unknown> = {
        code: createCode.toUpperCase(),
        couponType: createType,
        discountValue: Number(createValue),
        validFrom: createValidFrom,
        validUntil: createValidUntil,
      };
      if (createMinOrder) body.minOrderAmount = Number(createMinOrder);
      if (createMaxUses) body.maxUses = Number(createMaxUses);

      const res = await apiFetch('/api/v1/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || '쿠폰 생성에 실패했습니다.');
      }
      setSuccess('쿠폰이 생성되었습니다.');
      setShowCreate(false);
      resetCreateForm();
      fetchCoupons();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: number) {
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/coupons/${id}/deactivate`, { method: 'PUT' });
      if (!res.ok) throw new Error('비활성화에 실패했습니다.');
      setSuccess('쿠폰이 비활성화되었습니다.');
      fetchCoupons();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }

  function resetCreateForm() {
    setCreateCode('');
    setCreateType('FIXED');
    setCreateValue('');
    setCreateMinOrder('');
    setCreateMaxUses('');
    setCreateValidFrom('');
    setCreateValidUntil('');
  }

  function isExpired(validUntil: string): boolean {
    return new Date(validUntil) < new Date();
  }

  const selectClass =
    "w-full min-h-[44px] rounded-xl border border-[rgba(201,162,39,0.15)] bg-[#1a1612] px-3 py-2 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40";

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-[#0f0d0a] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <PageTitle>쿠폰 관리</PageTitle>
            <ActionButton onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? '취소' : '쿠폰 생성'}
            </ActionButton>
          </div>

          {error && <InlineError message={error} />}
          {success && <InlineSuccess message={success} />}

          {/* Create Form */}
          {showCreate && (
            <Card className="mb-6">
              <h3 className="text-lg font-bold text-[#C9A227] mb-4">새 쿠폰 생성</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="쿠폰 코드" required>
                  <Input
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    placeholder="WELCOME2026"
                    className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl"
                  />
                </FormField>
                <FormField label="쿠폰 유형" required>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value)}
                    className={selectClass}
                  >
                    <option value="FIXED">정액 할인</option>
                    <option value="PERCENT">정률 할인 (%)</option>
                    <option value="FREE_FIRST">첫 상담 무료</option>
                  </select>
                </FormField>
                <FormField label="할인 값" required hint={createType === 'PERCENT' ? '퍼센트 (%)' : '원 단위'}>
                  <Input
                    type="number"
                    value={createValue}
                    onChange={(e) => setCreateValue(e.target.value)}
                    placeholder={createType === 'PERCENT' ? '10' : '5000'}
                    className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl"
                  />
                </FormField>
                <FormField label="최소 주문 금액" hint="선택 사항">
                  <Input
                    type="number"
                    value={createMinOrder}
                    onChange={(e) => setCreateMinOrder(e.target.value)}
                    placeholder="10000"
                    className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl"
                  />
                </FormField>
                <FormField label="최대 사용 횟수" hint="비워두면 무제한">
                  <Input
                    type="number"
                    value={createMaxUses}
                    onChange={(e) => setCreateMaxUses(e.target.value)}
                    placeholder="100"
                    className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl"
                  />
                </FormField>
                <div />
                <FormField label="시작일" required>
                  <Input
                    type="datetime-local"
                    value={createValidFrom}
                    onChange={(e) => setCreateValidFrom(e.target.value)}
                    className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl"
                  />
                </FormField>
                <FormField label="종료일" required>
                  <Input
                    type="datetime-local"
                    value={createValidUntil}
                    onChange={(e) => setCreateValidUntil(e.target.value)}
                    className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl"
                  />
                </FormField>
              </div>
              <div className="mt-4 flex justify-end">
                <ActionButton
                  onClick={handleCreate}
                  loading={creating}
                  disabled={!createCode || !createValue || !createValidFrom || !createValidUntil}
                >
                  생성하기
                </ActionButton>
              </div>
            </Card>
          )}

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {[
              { label: '전체', value: '' },
              { label: '활성', value: 'active' },
              { label: '비활성', value: 'inactive' },
            ].map(({ label, value }) => (
              <Button
                key={value}
                variant={filter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setFilter(value); setPage(1); }}
                className={
                  filter === value
                    ? 'bg-[#C9A227] text-[#0f0d0a] hover:bg-[#D4A843]'
                    : 'border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/10'
                }
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Coupon Table */}
          {loading ? (
            <SkeletonCard lines={5} />
          ) : coupons.length === 0 ? (
            <EmptyState title="쿠폰이 없습니다" desc="새 쿠폰을 생성해보세요." />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>코드</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>할인</TableHead>
                      <TableHead>사용/제한</TableHead>
                      <TableHead>유효기간</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-bold text-[#C9A227]">
                          {coupon.code}
                        </TableCell>
                        <TableCell>{COUPON_TYPE_LABELS[coupon.couponType] || coupon.couponType}</TableCell>
                        <TableCell>{formatDiscount(coupon.couponType, coupon.discountValue)}</TableCell>
                        <TableCell>
                          {coupon.usedCount} / {coupon.maxUses === -1 ? '무제한' : coupon.maxUses}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(coupon.validFrom)}<br />~ {formatDate(coupon.validUntil)}
                        </TableCell>
                        <TableCell>
                          {!coupon.isActive ? (
                            <Badge variant="secondary">비활성</Badge>
                          ) : isExpired(coupon.validUntil) ? (
                            <Badge variant="destructive">만료</Badge>
                          ) : (
                            <Badge className="bg-green-900/50 text-green-300 border-green-700">활성</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(coupon.id)}
                              className="text-xs border-red-900/50 text-red-400 hover:bg-red-900/20"
                            >
                              비활성화
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </main>
    </RequireAdmin>
  );
}
