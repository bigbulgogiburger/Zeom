'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { apiFetch } from './api-client';

type FortuneCategory = {
  label: string;
  score: number;
  icon: string;
};

type FortuneData = {
  overallScore: number;
  summary: string;
  categories: FortuneCategory[];
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
};

const MOCK_FORTUNE: FortuneData = {
  overallScore: 78,
  summary: '새로운 만남과 기회가 찾아오는 날입니다. 긍정적인 에너지를 유지하세요.',
  categories: [
    { label: '총운', score: 78, icon: '\u2728' },
    { label: '재물', score: 65, icon: '\uD83D\uDCB0' },
    { label: '애정', score: 82, icon: '\u2764\uFE0F' },
    { label: '건강', score: 71, icon: '\uD83C\uDF3F' },
  ],
  luckyColor: '금색',
  luckyNumber: 7,
  luckyDirection: '남동쪽',
};

const MOCK_SUMMARY: FortuneData = {
  overallScore: 78,
  summary: '오늘의 운세가 궁금하시다면 로그인해주세요!',
  categories: [
    { label: '총운', score: 78, icon: '\u2728' },
    { label: '재물', score: 65, icon: '\uD83D\uDCB0' },
    { label: '애정', score: 82, icon: '\u2764\uFE0F' },
    { label: '건강', score: 71, icon: '\uD83C\uDF3F' },
  ],
  luckyColor: '금색',
  luckyNumber: 7,
  luckyDirection: '남동쪽',
};

function ScoreBar({ score }: { score: number }) {
  const getBarColor = (s: number) => {
    if (s >= 80) return 'from-[#C9A227] to-[#D4A843]';
    if (s >= 60) return 'from-[#C9A227] to-[#b08d1f]';
    if (s >= 40) return 'from-[#b08d1f] to-[#8B6914]';
    return 'from-[#8B0000] to-[#b08d1f]';
  };

  return (
    <div className="w-full h-2 rounded-full bg-[rgba(201,162,39,0.1)] overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${getBarColor(score)} transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function FortuneCard() {
  const { me, loading: authLoading } = useAuth();
  const [fortune, setFortune] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function fetchFortune() {
      setLoading(true);
      try {
        const endpoint = me
          ? '/api/v1/fortune/today'
          : '/api/v1/fortune/summary';
        const res = await apiFetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setFortune(data);
        } else {
          setFortune(me ? MOCK_FORTUNE : MOCK_SUMMARY);
        }
      } catch {
        setFortune(me ? MOCK_FORTUNE : MOCK_SUMMARY);
      } finally {
        setLoading(false);
      }
    }

    fetchFortune();
  }, [me, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="glass-card p-6 mx-auto max-w-[800px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="skeleton h-6 w-32 rounded" />
        </div>
        <div className="skeleton h-4 w-full rounded mb-2" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    );
  }

  if (!fortune) return null;

  const today = new Date();
  const dateStr = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}.`;

  return (
    <div className="glass-card p-6 mx-auto max-w-[800px] transition-all duration-300">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">\uD83D\uDD2E</span>
          <div>
            <h3 className="text-lg font-heading font-bold text-[#C9A227] m-0">
              오늘의 운세
            </h3>
            <p className="text-xs text-[#a49484] m-0">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-heading font-black bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent">
              {fortune.overallScore}
            </span>
            <span className="text-sm text-[#a49484] ml-1">/ 100</span>
          </div>
          <span className={`text-[#a49484] text-sm transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            &#9662;
          </span>
        </div>
      </button>

      {/* Summary */}
      <p className="text-sm text-[#a49484] mt-3 mb-0 leading-relaxed">
        {fortune.summary}
      </p>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-5 pt-4 border-t border-[rgba(201,162,39,0.15)]">
          {me ? (
            <>
              {/* Category scores */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {fortune.categories.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground font-medium">
                        {cat.icon} {cat.label}
                      </span>
                      <span className="text-sm font-bold text-[#C9A227]">
                        {cat.score}
                      </span>
                    </div>
                    <ScoreBar score={cat.score} />
                  </div>
                ))}
              </div>

              {/* Lucky items */}
              <div className="flex flex-wrap gap-3 mb-5">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[rgba(201,162,39,0.1)] text-sm text-[#C9A227]">
                  \uD83C\uDFA8 {fortune.luckyColor}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[rgba(201,162,39,0.1)] text-sm text-[#C9A227]">
                  \uD83D\uDD22 {fortune.luckyNumber}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[rgba(201,162,39,0.1)] text-sm text-[#C9A227]">
                  \uD83E\uDDED {fortune.luckyDirection}
                </span>
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <Link
                  href="/fortune"
                  className="btn-ghost text-sm px-5 py-2 min-h-0"
                >
                  자세히 보기
                </Link>
                <Link
                  href="/counselors"
                  className="btn-primary-lg text-sm px-5 py-2 min-h-0"
                >
                  상담 받기
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-[#a49484] text-sm mb-4">
                로그인하시면 맞춤 운세와 상세 분석을 확인할 수 있습니다.
              </p>
              <Link
                href="/login"
                className="btn-primary-lg text-sm px-8 py-2 min-h-0"
              >
                로그인하여 상세 보기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
