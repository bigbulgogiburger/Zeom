'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { apiFetch } from '@/components/api-client';

type FortuneCategory = {
  label: string;
  score: number;
  icon: string;
  description: string;
};

type FortuneDetail = {
  overallScore: number;
  summary: string;
  categories: FortuneCategory[];
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
};

const MOCK_FORTUNE: FortuneDetail = {
  overallScore: 78,
  summary: '새로운 만남과 기회가 찾아오는 날입니다. 긍정적인 에너지를 유지하세요.',
  categories: [
    {
      label: '총운',
      score: 78,
      icon: '\u2728',
      description:
        '전반적으로 안정적인 하루가 예상됩니다. 오전에는 집중력이 높아 중요한 업무를 처리하기 좋고, 오후에는 주변 사람들과의 소통에서 좋은 에너지를 받을 수 있습니다.',
    },
    {
      label: '재물',
      score: 65,
      icon: '\uD83D\uDCB0',
      description:
        '큰 지출은 자제하는 것이 좋습니다. 예상치 못한 소비가 발생할 수 있으니 충동구매에 주의하세요. 저축이나 투자에 대한 새로운 정보를 얻을 수 있는 날입니다.',
    },
    {
      label: '애정',
      score: 82,
      icon: '\u2764\uFE0F',
      description:
        '연인과의 관계에서 따뜻한 대화가 이어질 수 있습니다. 솔로라면 새로운 인연을 만날 가능성이 높습니다. 첫인상이 좋은 만남이 기대됩니다.',
    },
    {
      label: '건강',
      score: 71,
      icon: '\uD83C\uDF3F',
      description:
        '가벼운 산책이나 스트레칭으로 몸을 풀어주세요. 과도한 운동보다는 휴식과 균형 잡힌 식사가 중요한 날입니다. 충분한 수면을 취하세요.',
    },
  ],
  luckyColor: '금색',
  luckyNumber: 7,
  luckyDirection: '남동쪽',
};

function ScoreGauge({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const radius = size === 'lg' ? 60 : 36;
  const stroke = size === 'lg' ? 8 : 5;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const dim = (radius + stroke) * 2;

  const getColor = (s: number) => {
    if (s >= 80) return '#C9A227';
    if (s >= 60) return '#b08d1f';
    if (s >= 40) return '#8B6914';
    return '#8B0000';
  };

  return (
    <svg width={dim} height={dim} className="block">
      <circle
        cx={radius + stroke}
        cy={radius + stroke}
        r={radius}
        fill="none"
        stroke="rgba(201,162,39,0.1)"
        strokeWidth={stroke}
      />
      <circle
        cx={radius + stroke}
        cy={radius + stroke}
        r={radius}
        fill="none"
        stroke={getColor(score)}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
        className="transition-all duration-1000"
      />
      <text
        x={radius + stroke}
        y={radius + stroke}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#C9A227"
        fontSize={size === 'lg' ? 28 : 16}
        fontWeight="900"
        fontFamily="var(--font-heading)"
      >
        {score}
      </text>
    </svg>
  );
}

function ScoreBar({ score }: { score: number }) {
  const getBarColor = (s: number) => {
    if (s >= 80) return 'from-[#C9A227] to-[#D4A843]';
    if (s >= 60) return 'from-[#C9A227] to-[#b08d1f]';
    if (s >= 40) return 'from-[#b08d1f] to-[#8B6914]';
    return 'from-[#8B0000] to-[#b08d1f]';
  };

  return (
    <div className="w-full h-3 rounded-full bg-[rgba(201,162,39,0.1)] overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${getBarColor(score)} transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function FortunePage() {
  const { me, loading: authLoading } = useAuth();
  const [fortune, setFortune] = useState<FortuneDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function fetchFortune() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/v1/fortune/today');
        if (res.ok) {
          setFortune(await res.json());
        } else {
          setFortune(MOCK_FORTUNE);
        }
      } catch {
        setFortune(MOCK_FORTUNE);
      } finally {
        setLoading(false);
      }
    }

    if (!me) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    fetchFortune();
  }, [me, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="page-container">
        <div className="glass-card p-8">
          <div className="flex justify-center mb-6">
            <div className="skeleton w-36 h-36 rounded-full" />
          </div>
          <div className="skeleton h-6 w-48 mx-auto rounded mb-4" />
          <div className="skeleton h-4 w-full rounded mb-2" />
          <div className="skeleton h-4 w-3/4 mx-auto rounded" />
        </div>
      </div>
    );
  }

  if (!fortune) return null;

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayStr = dayNames[today.getDay()];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-heading font-black text-[#C9A227] m-0">
          오늘의 운세
        </h1>
        <p className="text-[#a49484] text-sm mt-2 m-0">
          {dateStr} ({dayStr}요일)
        </p>
      </div>

      {/* Overall Score */}
      <div className="glass-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <ScoreGauge score={fortune.overallScore} />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground m-0 mb-3">
          총운 점수
        </h2>
        <p className="text-[#a49484] text-sm leading-relaxed max-w-[480px] mx-auto">
          {fortune.summary}
        </p>
      </div>

      {/* Category Details */}
      <div className="grid gap-4">
        {fortune.categories.map((cat) => (
          <div key={cat.label} className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="text-lg font-heading font-bold text-foreground m-0">
                  {cat.label}
                </h3>
              </div>
              <span className="text-xl font-heading font-black text-[#C9A227]">
                {cat.score}
              </span>
            </div>
            <ScoreBar score={cat.score} />
            <p className="text-sm text-[#a49484] mt-3 mb-0 leading-relaxed">
              {cat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Lucky Items */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-4 text-center">
          행운의 아이템
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">\uD83C\uDFA8</div>
            <p className="text-xs text-[#a49484] m-0">행운의 색</p>
            <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">
              {fortune.luckyColor}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">\uD83D\uDD22</div>
            <p className="text-xs text-[#a49484] m-0">행운의 숫자</p>
            <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">
              {fortune.luckyNumber}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">\uD83E\uDDED</div>
            <p className="text-xs text-[#a49484] m-0">행운의 방향</p>
            <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">
              {fortune.luckyDirection}
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-[#a49484] text-sm mb-4">
          운세를 바탕으로 전문 상담사와 상담해보세요
        </p>
        <Link
          href="/counselors"
          className="btn-primary-lg text-base px-10 py-3"
        >
          상담 받기
        </Link>
      </div>
    </div>
  );
}
