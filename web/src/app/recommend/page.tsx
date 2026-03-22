'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/components/api-client';
import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

type RecommendedCounselor = {
  counselorId: number;
  name: string;
  specialty: string;
  intro: string;
  ratingAvg: number;
  totalSessions: number;
  matchScore: number;
  matchReason: string;
};

const CONCERN_OPTIONS = [
  { value: '사주', label: '사주' },
  { value: '타로', label: '타로' },
  { value: '꿈해몽', label: '꿈해몽' },
  { value: '연애운', label: '연애운' },
  { value: '재물운', label: '재물운' },
  { value: '건강운', label: '건강운' },
  { value: '직장운', label: '직장운' },
  { value: '학업운', label: '학업운' },
] as const;

const STYLE_OPTIONS = [
  { value: 'warm', label: '따뜻하고 공감적인', desc: '편안한 분위기에서 위로받고 싶어요' },
  { value: 'direct', label: '직설적이고 명쾌한', desc: '핵심을 바로 알고 싶어요' },
  { value: 'any', label: '상관없어요', desc: '스타일보다 실력이 중요해요' },
] as const;

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-gold">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          className="w-4 h-4"
          fill={i < full ? 'hsl(var(--gold))' : i === full && hasHalf ? 'url(#half)' : 'hsl(var(--border-subtle))'}
        >
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="hsl(var(--gold))" />
              <stop offset="50%" stopColor="hsl(var(--border-subtle))" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs ml-1 text-text-secondary">{rating.toFixed(1)}</span>
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <span className="inline-flex items-center gap-1 bg-gold/15 text-gold text-xs font-bold font-heading rounded-full px-3 py-1">
      {pct}% 매칭
    </span>
  );
}

export default function RecommendPage() {
  const { me } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [results, setResults] = useState<RecommendedCounselor[]>([]);
  const [loading, setLoading] = useState(false);
  const [personalized, setPersonalized] = useState<RecommendedCounselor[]>([]);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);

  // Fetch personalized recommendations if logged in
  useEffect(() => {
    if (!me) return;
    setPersonalizedLoading(true);
    apiFetch('/api/v1/recommendations/personalized', { cache: 'no-store' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setPersonalized(data);
        }
      })
      .catch(() => {})
      .finally(() => setPersonalizedLoading(false));
  }, [me]);

  const toggleConcern = useCallback((value: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }, []);

  async function handleMatch() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/recommendations/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concerns: selectedConcerns,
          preferredStyle: selectedStyle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setStep(3);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  function resetQuiz() {
    setStep(1);
    setSelectedConcerns([]);
    setSelectedStyle(null);
    setResults([]);
  }

  return (
    <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Page Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-text-primary font-heading">
          나에게 맞는 상담사 찾기
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed mt-3">
          몇 가지 질문에 답하면 맞춤 상담사를 추천해드려요
        </p>
      </div>

      {/* Personalized Section (if logged in) */}
      {me && step === 1 && (
        <section className="mb-12">
          <h2 className="font-heading font-bold text-xl text-text-primary mb-6 text-center">
            나를 위한 추천
          </h2>
          {personalizedLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[260px] bg-black/30 border border-[hsl(var(--gold)/0.1)] rounded-2xl p-6 animate-pulse">
                  <div className="h-5 w-2/3 bg-surface rounded mb-3" />
                  <div className="h-4 w-1/2 bg-surface rounded mb-3" />
                  <div className="h-3 w-full bg-surface rounded" />
                </div>
              ))}
            </div>
          ) : personalized.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {personalized.map((c) => (
                <div
                  key={c.counselorId}
                  className="min-w-[280px] max-w-[320px] snap-start bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.15)] rounded-2xl p-6 flex-shrink-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-bold text-lg text-text-primary">{c.name}</h3>
                    <ScoreBadge score={c.matchScore} />
                  </div>
                  <Badge variant="secondary" className="font-heading font-bold text-xs rounded-full px-3 py-1 mb-3">
                    {c.specialty}
                  </Badge>
                  <StarRating rating={c.ratingAvg} />
                  <p className="text-text-secondary text-sm mt-3 leading-relaxed">{c.matchReason}</p>
                  <Link
                    href={`/counselors/${c.counselorId}`}
                    className="mt-4 inline-flex items-center justify-center w-full rounded-full px-6 py-2.5 bg-gradient-to-r from-gold to-gold-soft text-background font-bold font-heading text-sm transition-all hover:shadow-[0_4px_20px_hsl(var(--gold)/0.15)]"
                  >
                    상담 예약
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-black/20 border border-[hsl(var(--gold)/0.1)] rounded-2xl p-6 text-center">
              <p className="text-text-secondary">아직 상담 이력이 없어 맞춤 추천을 준비 중이에요</p>
            </div>
          )}
        </section>
      )}

      {/* Not logged in prompt */}
      {!me && step === 1 && (
        <div className="mb-10 bg-black/20 border border-[hsl(var(--gold)/0.1)] rounded-2xl p-6 text-center">
          <p className="text-text-secondary">
            <Link href="/login" className="text-gold font-bold hover:underline">로그인</Link>
            하면 맞춤 추천을 받을 수 있어요
          </p>
        </div>
      )}

      {/* Step Progress Indicator */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-heading transition-all',
                  step >= s
                    ? 'bg-gradient-to-r from-gold to-gold-soft text-background'
                    : 'border border-[hsl(var(--gold)/0.2)] text-text-secondary'
                )}
              >
                {s}
              </div>
              {s < 2 && (
                <div className={cn('w-16 h-0.5 transition-all', step > s ? 'bg-gold' : 'bg-[hsl(var(--gold)/0.15)]')} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Concern Selection */}
      {step === 1 && (
        <section>
          <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-8 sm:p-10">
            <h2 className="font-heading font-bold text-2xl text-text-primary text-center mb-2">
              어떤 고민이 있으신가요?
            </h2>
            <p className="text-text-secondary text-center mb-8">
              관심 분야를 선택해주세요 (복수 선택 가능)
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {CONCERN_OPTIONS.map((opt) => {
                const isSelected = selectedConcerns.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleConcern(opt.value)}
                    className={cn(
                      'rounded-full px-6 py-3 text-sm font-medium font-heading transition-all duration-300',
                      isSelected
                        ? 'border-2 border-gold bg-gold/10 text-gold shadow-[0_0_12px_hsl(var(--gold)/0.15)]'
                        : 'border border-[hsl(var(--gold)/0.2)] text-text-secondary bg-transparent hover:bg-gold/5 hover:text-gold hover:border-[hsl(var(--gold)/0.3)]'
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                disabled={selectedConcerns.length === 0}
                className={cn(
                  'rounded-full px-10 py-3.5 font-bold font-heading text-base transition-all',
                  selectedConcerns.length > 0
                    ? 'bg-gradient-to-r from-gold to-gold-soft text-background hover:shadow-[0_4px_20px_hsl(var(--gold)/0.15)]'
                    : 'bg-surface text-text-secondary/50 cursor-not-allowed'
                )}
              >
                다음으로
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Step 2: Style Selection */}
      {step === 2 && (
        <section>
          <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-8 sm:p-10">
            <h2 className="font-heading font-bold text-2xl text-text-primary text-center mb-2">
              어떤 스타일의 상담을 원하시나요?
            </h2>
            <p className="text-text-secondary text-center mb-8">
              선호하는 상담 스타일을 선택해주세요
            </p>

            <div className="grid gap-4 max-w-[500px] mx-auto mb-10">
              {STYLE_OPTIONS.map((opt) => {
                const isSelected = selectedStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedStyle(opt.value)}
                    className={cn(
                      'text-left rounded-xl p-5 transition-all duration-300',
                      isSelected
                        ? 'border-2 border-gold bg-gold/10 shadow-[0_0_12px_hsl(var(--gold)/0.15)]'
                        : 'border border-[hsl(var(--gold)/0.15)] bg-surface hover:border-[hsl(var(--gold)/0.3)]'
                    )}
                  >
                    <span className={cn(
                      'block font-heading font-bold text-base mb-1',
                      isSelected ? 'text-gold' : 'text-text-primary'
                    )}>
                      {opt.label}
                    </span>
                    <span className="text-text-secondary text-sm">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="rounded-full px-8 py-3 border-2 border-gold/30 text-gold font-heading font-bold bg-transparent hover:bg-gold/10 transition-all"
              >
                이전
              </button>
              <button
                onClick={handleMatch}
                disabled={!selectedStyle || loading}
                className={cn(
                  'rounded-full px-10 py-3 font-bold font-heading text-base transition-all',
                  selectedStyle
                    ? 'bg-gradient-to-r from-gold to-gold-soft text-background hover:shadow-[0_4px_20px_hsl(var(--gold)/0.15)]'
                    : 'bg-surface text-text-secondary/50 cursor-not-allowed'
                )}
              >
                {loading ? '매칭 중...' : '상담사 찾기'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <section>
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-2xl text-text-primary mb-2">
              추천 상담사
            </h2>
            <p className="text-text-secondary">
              {selectedConcerns.join(', ')} 분야에 맞는 상담사를 찾았어요
            </p>
          </div>

          {results.length === 0 ? (
            <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-10 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="font-heading font-bold text-xl text-text-primary mb-2">
                매칭되는 상담사가 없습니다
              </p>
              <p className="text-text-secondary text-sm mb-6">
                다른 분야나 스타일로 다시 시도해보세요
              </p>
              <button
                onClick={resetQuiz}
                className="rounded-full px-8 py-3 bg-gradient-to-r from-gold to-gold-soft text-background font-bold font-heading transition-all hover:shadow-[0_4px_20px_hsl(var(--gold)/0.15)]"
              >
                다시 찾기
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {results.map((c, idx) => (
                  <Card
                    key={c.counselorId}
                    className={cn(
                      'p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1',
                      idx === 0 && 'border-2 border-gold/40 shadow-[0_0_20px_hsl(var(--gold)/0.1)]'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-heading font-bold text-xl m-0 text-card-foreground">
                            {c.name}
                          </h3>
                          <ScoreBadge score={c.matchScore} />
                          {idx === 0 && (
                            <Badge className="bg-gold text-background font-heading font-bold text-xs rounded-full px-3 py-0.5">
                              BEST
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <Badge variant="secondary" className="font-heading font-bold text-xs rounded-full px-3 py-1">
                            {c.specialty}
                          </Badge>
                          <StarRating rating={c.ratingAvg} />
                          <span className="text-xs text-text-secondary">
                            상담 {c.totalSessions}회
                          </span>
                        </div>

                        <p className="text-muted-foreground text-sm leading-relaxed mb-1">
                          {c.intro}
                        </p>
                        <p className="text-gold/80 text-sm font-medium">
                          {c.matchReason}
                        </p>
                      </div>

                      <div className="sm:flex-shrink-0 sm:self-center">
                        <Link
                          href={`/counselors/${c.counselorId}`}
                          className="inline-flex items-center justify-center w-full sm:w-auto rounded-full px-8 py-3 bg-gradient-to-r from-gold to-gold-soft text-background font-bold font-heading text-sm transition-all hover:shadow-[0_4px_20px_hsl(var(--gold)/0.15)] no-underline"
                        >
                          예약하기
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={resetQuiz}
                  className="rounded-full px-8 py-3 border-2 border-gold/30 text-gold font-heading font-bold bg-transparent hover:bg-gold/10 transition-all"
                >
                  다시 찾기
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
