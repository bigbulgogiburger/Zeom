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
  // Saju-based extended fields
  dailyPillar?: {
    gan: string;
    ji: string;
    ganHanja?: string;
    jiHanja?: string;
    ohaeng?: string;
  };
  myDayGan?: string;
  myDayGanHanja?: string;
  relationship?: string;
  twelveUnseong?: string;
  luckyTime?: string;
  warningTime?: string;
  sajuInsight?: string;
  ohaengBalance?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  counselorCta?: {
    show: boolean;
    message: string;
    category?: string;
  };
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

const OHAENG_COLORS: Record<string, string> = {
  wood: '#2E8B57',
  fire: '#DC143C',
  earth: '#DAA520',
  metal: '#C0C0C0',
  water: '#191970',
};

const OHAENG_LABELS: Record<string, string> = {
  wood: '\u6728',
  fire: '\u706B',
  earth: '\u571F',
  metal: '\u91D1',
  water: '\u6C34',
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

function OhaengBar({ element, value, maxValue }: { element: string; value: number; maxValue: number }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const color = OHAENG_COLORS[element] || '#C9A227';
  const label = OHAENG_LABELS[element] || element;

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
      <div className="flex-1 h-3 rounded-full bg-[rgba(201,162,39,0.1)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold text-[#C9A227] w-6 text-right">{value}</span>
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
  const dateStr = `${today.getFullYear()}\uB144 ${today.getMonth() + 1}\uC6D4 ${today.getDate()}\uC77C`;
  const dayNames = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];
  const dayStr = dayNames[today.getDay()];

  const hasSajuData = !!(fortune.dailyPillar && fortune.myDayGan);
  const ohaeng = fortune.ohaengBalance;
  const maxOhaeng = ohaeng ? Math.max(ohaeng.wood, ohaeng.fire, ohaeng.earth, ohaeng.metal, ohaeng.water, 1) : 1;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-heading font-black text-[#C9A227] m-0">
          \uC624\uB298\uC758 \uC6B4\uC138
        </h1>
        <p className="text-[#a49484] text-sm mt-2 m-0">
          {dateStr} ({dayStr}\uC694\uC77C)
          {hasSajuData && fortune.dailyPillar && (
            <span className="ml-2 text-[#C9A227]">
              {fortune.dailyPillar.ganHanja || ''}{fortune.dailyPillar.jiHanja || ''}\uC77C
            </span>
          )}
        </p>
      </div>

      {/* Daily Pillar Card (saju-based) */}
      {hasSajuData && fortune.dailyPillar && (
        <div className="glass-card p-6">
          <h3 className="text-base font-heading font-bold text-[#C9A227] m-0 mb-4 text-center">
            \uC624\uB298\uC758 \uC77C\uC9C4
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-[#a49484] m-0 mb-1">\uC624\uB298\uC758 \uC77C\uC9C4</p>
              <p className="text-2xl font-heading font-black text-foreground m-0">
                {fortune.dailyPillar.ganHanja || fortune.dailyPillar.gan}{fortune.dailyPillar.jiHanja || fortune.dailyPillar.ji}
              </p>
              <p className="text-sm text-[#a49484] m-0">
                ({fortune.dailyPillar.gan}{fortune.dailyPillar.ji})
              </p>
            </div>
            <div>
              <p className="text-xs text-[#a49484] m-0 mb-1">\uB2F9\uC2E0\uC758 \uC77C\uAC04</p>
              <p className="text-2xl font-heading font-black text-foreground m-0">
                {fortune.myDayGanHanja || fortune.myDayGan}
              </p>
              <p className="text-sm text-[#a49484] m-0">
                ({fortune.myDayGan})
              </p>
            </div>
          </div>
          {fortune.relationship && (
            <div className="mt-4 pt-3 border-t border-[rgba(201,162,39,0.15)] text-center">
              <span className="text-sm text-[#a49484]">\uAD00\uACC4: </span>
              <span className="text-sm font-bold text-[#C9A227]">{fortune.relationship}</span>
              {fortune.twelveUnseong && (
                <>
                  <span className="text-sm text-[#a49484] mx-2">|</span>
                  <span className="text-sm font-bold text-[#C9A227]">{fortune.twelveUnseong}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Overall Score */}
      <div className="glass-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <ScoreGauge score={fortune.overallScore} />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground m-0 mb-3">
          \uCD1D\uC6B4 \uC810\uC218
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

      {/* Ohaeng Balance */}
      {ohaeng && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-4 text-center">
            \uC624\uD589 \uADE0\uD615
          </h3>
          <div className="grid gap-3">
            <OhaengBar element="wood" value={ohaeng.wood} maxValue={maxOhaeng} />
            <OhaengBar element="fire" value={ohaeng.fire} maxValue={maxOhaeng} />
            <OhaengBar element="earth" value={ohaeng.earth} maxValue={maxOhaeng} />
            <OhaengBar element="metal" value={ohaeng.metal} maxValue={maxOhaeng} />
            <OhaengBar element="water" value={ohaeng.water} maxValue={maxOhaeng} />
          </div>
        </div>
      )}

      {/* Lucky Items + Times */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-4 text-center">
          \uD589\uC6B4\uC758 \uC544\uC774\uD15C
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl mb-2">\uD83C\uDFA8</div>
            <p className="text-xs text-[#a49484] m-0">\uD589\uC6B4\uC758 \uC0C9</p>
            <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">
              {fortune.luckyColor}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">\uD83D\uDD22</div>
            <p className="text-xs text-[#a49484] m-0">\uD589\uC6B4\uC758 \uC22B\uC790</p>
            <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">
              {fortune.luckyNumber}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">\uD83E\uDDED</div>
            <p className="text-xs text-[#a49484] m-0">\uD589\uC6B4\uC758 \uBC29\uD5A5</p>
            <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">
              {fortune.luckyDirection}
            </p>
          </div>
        </div>
        {(fortune.luckyTime || fortune.warningTime) && (
          <div className="border-t border-[rgba(201,162,39,0.15)] pt-4 grid grid-cols-2 gap-4">
            {fortune.luckyTime && (
              <div className="text-center">
                <p className="text-xs text-[#a49484] m-0 mb-1">\uD589\uC6B4\uC758 \uC2DC\uAC04</p>
                <p className="text-sm font-bold text-[#2E8B57] m-0">{fortune.luckyTime}</p>
              </div>
            )}
            {fortune.warningTime && (
              <div className="text-center">
                <p className="text-xs text-[#a49484] m-0 mb-1">\uC8FC\uC758 \uC2DC\uAC04</p>
                <p className="text-sm font-bold text-[#8B0000] m-0">{fortune.warningTime}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saju Insight */}
      {fortune.sajuInsight && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-3">
            \uC0AC\uC8FC \uC778\uC0AC\uC774\uD2B8
          </h3>
          <p className="text-sm text-[#a49484] leading-relaxed m-0">
            {fortune.sajuInsight}
          </p>
        </div>
      )}

      {/* Counselor CTA */}
      {fortune.counselorCta?.show ? (
        <div className="glass-card p-6 border-[rgba(201,162,39,0.3)]">
          <p className="text-sm text-foreground leading-relaxed mb-4 m-0">
            {fortune.counselorCta.message}
          </p>
          <div className="text-center">
            <Link
              href="/counselors"
              className="btn-primary-lg text-base px-10 py-3"
            >
              \uC0C1\uB2F4 \uC608\uC57D\uD558\uAE30
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[#a49484] text-sm mb-4">
            \uC6B4\uC138\uB97C \uBC14\uD0D5\uC73C\uB85C \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC640 \uC0C1\uB2F4\uD574\uBCF4\uC138\uC694
          </p>
          <Link
            href="/counselors"
            className="btn-primary-lg text-base px-10 py-3"
          >
            \uC0C1\uB2F4 \uBC1B\uAE30
          </Link>
        </div>
      )}
    </div>
  );
}
