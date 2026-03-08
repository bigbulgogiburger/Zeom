'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { apiFetch } from '@/components/api-client';

// === Types ===

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

type ZodiacFortune = {
  animal: string;
  emoji: string;
  jiji: string;
  hanja: string;
  fortuneDate: string;
  overallScore: number;
  overallText: string;
  wealthScore: number;
  wealthText: string;
  loveScore: number;
  loveText: string;
  healthScore: number;
  healthText: string;
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
};

type CompatibilityResult = {
  score: number;
  summary: string;
  love: { score: number; description: string };
  work: { score: number; description: string };
  friendship: { score: number; description: string };
  animal1: string;
  animal2: string;
  emoji1: string;
  emoji2: string;
};

type TabType = 'today' | 'zodiac' | 'compatibility';

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

// === Shared Components ===

function ScoreGauge({ score, size = 'lg', hidden = false }: { score: number; size?: 'sm' | 'lg'; hidden?: boolean }) {
  const radius = size === 'lg' ? 60 : 36;
  const stroke = size === 'lg' ? 8 : 5;
  const circumference = 2 * Math.PI * radius;
  const displayScore = hidden ? 65 : score;
  const dashOffset = circumference - (displayScore / 100) * circumference;
  const dim = (radius + stroke) * 2;

  const getColor = (s: number) => {
    if (hidden) return 'rgba(201,162,39,0.3)';
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
        stroke={getColor(displayScore)}
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
        fill={hidden ? 'rgba(201,162,39,0.5)' : '#C9A227'}
        fontSize={size === 'lg' ? 28 : 16}
        fontWeight="900"
        fontFamily="var(--font-heading)"
      >
        {hidden ? '?' : score}
      </text>
    </svg>
  );
}

function ScoreBar({ score, hidden = false }: { score: number; hidden?: boolean }) {
  const getBarColor = (s: number) => {
    if (hidden) return 'from-[rgba(201,162,39,0.2)] to-[rgba(201,162,39,0.3)]';
    if (s >= 80) return 'from-[#C9A227] to-[#D4A843]';
    if (s >= 60) return 'from-[#C9A227] to-[#b08d1f]';
    if (s >= 40) return 'from-[#b08d1f] to-[#8B6914]';
    return 'from-[#8B0000] to-[#b08d1f]';
  };

  const displayScore = hidden ? 60 : score;

  return (
    <div className="w-full h-3 rounded-full bg-[rgba(201,162,39,0.1)] overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${getBarColor(score)} transition-all duration-700`}
        style={{ width: `${displayScore}%` }}
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

// === Tab Navigation ===

function TabBar({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (tab: TabType) => void }) {
  const tabs: { key: TabType; label: string }[] = [
    { key: 'today', label: '오늘의 운세' },
    { key: 'zodiac', label: '띠별 운세' },
    { key: 'compatibility', label: '궁합 테스트' },
  ];

  return (
    <div className="flex rounded-xl overflow-hidden border border-[rgba(201,162,39,0.2)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 py-3 px-2 text-sm font-bold transition-all ${
            activeTab === tab.key
              ? 'bg-[#C9A227] text-[#0f0d0a]'
              : 'bg-transparent text-[#a49484] hover:text-[#C9A227]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// === Today's Fortune Tab ===

function TodayFortuneTab({ fortune, isLoggedIn }: { fortune: FortuneDetail; isLoggedIn: boolean }) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}\uB144 ${today.getMonth() + 1}\uC6D4 ${today.getDate()}\uC77C`;
  const dayNames = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];
  const dayStr = dayNames[today.getDay()];

  const hasSajuData = !!(fortune.dailyPillar && fortune.myDayGan);
  const ohaeng = fortune.ohaengBalance;
  const maxOhaeng = ohaeng ? Math.max(ohaeng.wood, ohaeng.fire, ohaeng.earth, ohaeng.metal, ohaeng.water, 1) : 1;

  return (
    <>
      {!isLoggedIn && (
        <div className="glass-card p-5 border-[rgba(201,162,39,0.3)] text-center">
          <p className="text-sm text-foreground m-0 mb-3">
            로그인하고 <span className="font-bold text-[#C9A227]">나만의 사주 운세</span>를 확인하세요
          </p>
          <Link href="/login" className="btn-primary text-sm px-6 py-2">
            로그인하기
          </Link>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-heading font-black text-[#C9A227] m-0">
          오늘의 운세
        </h2>
        <p className="text-[#a49484] text-sm mt-2 m-0">
          {dateStr} ({dayStr}요일)
          {hasSajuData && fortune.dailyPillar && (
            <span className="ml-2 text-[#C9A227]">
              {fortune.dailyPillar.ganHanja || ''}{fortune.dailyPillar.jiHanja || ''}일
            </span>
          )}
        </p>
      </div>

      {hasSajuData && fortune.dailyPillar && (
        <div className="glass-card p-6">
          <h3 className="text-base font-heading font-bold text-[#C9A227] m-0 mb-4 text-center">
            오늘의 일진
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-[#a49484] m-0 mb-1">오늘의 일진</p>
              <p className="text-2xl font-heading font-black text-foreground m-0">
                {fortune.dailyPillar.ganHanja || fortune.dailyPillar.gan}{fortune.dailyPillar.jiHanja || fortune.dailyPillar.ji}
              </p>
              <p className="text-sm text-[#a49484] m-0">
                ({fortune.dailyPillar.gan}{fortune.dailyPillar.ji})
              </p>
            </div>
            <div>
              <p className="text-xs text-[#a49484] m-0 mb-1">당신의 일간</p>
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
              <span className="text-sm text-[#a49484]">관계: </span>
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

      <div className="glass-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <ScoreGauge score={fortune.overallScore} hidden={!isLoggedIn} />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground m-0 mb-3">
          총운 점수
        </h2>
        <p className={`text-sm leading-relaxed max-w-[480px] mx-auto ${!isLoggedIn ? 'text-[#a49484]/50 blur-[3px] select-none' : 'text-[#a49484]'}`}>
          {fortune.summary}
        </p>
      </div>

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
                {isLoggedIn ? cat.score : '?'}
              </span>
            </div>
            <ScoreBar score={cat.score} hidden={!isLoggedIn} />
            <p className={`text-sm mt-3 mb-0 leading-relaxed ${!isLoggedIn ? 'text-[#a49484]/50 blur-[3px] select-none' : 'text-[#a49484]'}`}>
              {cat.description}
            </p>
          </div>
        ))}
      </div>

      {ohaeng && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-4 text-center">
            오행 균형
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

      <div className="glass-card p-6">
        <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-4 text-center">
          행운의 아이템
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl mb-2">{'\uD83C\uDFA8'}</div>
            <p className="text-xs text-[#a49484] m-0">행운의 색</p>
            <p className={`text-base font-heading font-bold m-0 mt-1 ${!isLoggedIn ? 'text-[#C9A227]/40 blur-[2px] select-none' : 'text-[#C9A227]'}`}>
              {isLoggedIn ? fortune.luckyColor : '???'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">{'\uD83D\uDD22'}</div>
            <p className="text-xs text-[#a49484] m-0">행운의 숫자</p>
            <p className={`text-base font-heading font-bold m-0 mt-1 ${!isLoggedIn ? 'text-[#C9A227]/40 blur-[2px] select-none' : 'text-[#C9A227]'}`}>
              {isLoggedIn ? fortune.luckyNumber : '?'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">{'\uD83E\uDDED'}</div>
            <p className="text-xs text-[#a49484] m-0">행운의 방향</p>
            <p className={`text-base font-heading font-bold m-0 mt-1 ${!isLoggedIn ? 'text-[#C9A227]/40 blur-[2px] select-none' : 'text-[#C9A227]'}`}>
              {isLoggedIn ? fortune.luckyDirection : '???'}
            </p>
          </div>
        </div>
        {(fortune.luckyTime || fortune.warningTime) && (
          <div className="border-t border-[rgba(201,162,39,0.15)] pt-4 grid grid-cols-2 gap-4">
            {fortune.luckyTime && (
              <div className="text-center">
                <p className="text-xs text-[#a49484] m-0 mb-1">행운의 시간</p>
                <p className="text-sm font-bold text-[#2E8B57] m-0">{fortune.luckyTime}</p>
              </div>
            )}
            {fortune.warningTime && (
              <div className="text-center">
                <p className="text-xs text-[#a49484] m-0 mb-1">주의 시간</p>
                <p className="text-sm font-bold text-[#8B0000] m-0">{fortune.warningTime}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {fortune.sajuInsight && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-3">
            사주 인사이트
          </h3>
          <p className="text-sm text-[#a49484] leading-relaxed m-0">
            {fortune.sajuInsight}
          </p>
        </div>
      )}

      {!isLoggedIn ? (
        <div className="glass-card p-8 border-[rgba(201,162,39,0.3)] text-center">
          <p className="text-lg font-heading font-bold text-foreground m-0 mb-2">
            나의 운세 점수가 궁금하신가요?
          </p>
          <p className="text-sm text-[#a49484] m-0 mb-5">
            로그인하면 사주팔자 기반 맞춤형 운세를 확인할 수 있습니다
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="btn-primary-lg text-base px-8 py-3">
              로그인
            </Link>
            <Link href="/signup" className="btn-secondary text-base px-8 py-3">
              회원가입
            </Link>
          </div>
        </div>
      ) : fortune.counselorCta?.show ? (
        <div className="glass-card p-6 border-[rgba(201,162,39,0.3)]">
          <p className="text-sm text-foreground leading-relaxed mb-4 m-0">
            {fortune.counselorCta.message}
          </p>
          <div className="text-center">
            <Link href="/counselors" className="btn-primary-lg text-base px-10 py-3">
              상담 예약하기
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[#a49484] text-sm mb-4">
            운세를 바탕으로 전문 상담사와 상담해보세요
          </p>
          <Link href="/counselors" className="btn-primary-lg text-base px-10 py-3">
            상담 받기
          </Link>
        </div>
      )}
    </>
  );
}

// === Zodiac Fortune Tab ===

function ZodiacFortuneTab() {
  const [zodiacList, setZodiacList] = useState<ZodiacFortune[]>([]);
  const [selected, setSelected] = useState<ZodiacFortune | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchZodiac() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/v1/fortune/zodiac');
        if (res.ok) {
          const data = await res.json();
          setZodiacList(data.zodiacFortunes);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchZodiac();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <>
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-[#C9A227] hover:underline mb-2"
        >
          &larr; 전체 띠 보기
        </button>

        <div className="glass-card p-6 text-center">
          <div className="text-5xl mb-3">{selected.emoji}</div>
          <h2 className="text-2xl font-heading font-black text-[#C9A227] m-0">
            {selected.animal}띠 오늘의 운세
          </h2>
          <p className="text-sm text-[#a49484] mt-1 m-0">
            {selected.jiji}({selected.hanja})
          </p>
        </div>

        <div className="glass-card p-8 text-center">
          <div className="flex justify-center mb-4">
            <ScoreGauge score={selected.overallScore} />
          </div>
          <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-3">총운</h3>
          <p className="text-sm text-[#a49484] leading-relaxed m-0">{selected.overallText}</p>
        </div>

        {[
          { label: '재물운', icon: '\uD83D\uDCB0', score: selected.wealthScore, text: selected.wealthText },
          { label: '연애운', icon: '\u2764\uFE0F', score: selected.loveScore, text: selected.loveText },
          { label: '건강운', icon: '\uD83C\uDF3F', score: selected.healthScore, text: selected.healthText },
        ].map((cat) => (
          <div key={cat.label} className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="text-lg font-heading font-bold text-foreground m-0">{cat.label}</h3>
              </div>
              <span className="text-xl font-heading font-black text-[#C9A227]">{cat.score}</span>
            </div>
            <ScoreBar score={cat.score} />
            <p className="text-sm mt-3 mb-0 leading-relaxed text-[#a49484]">{cat.text}</p>
          </div>
        ))}

        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-4 text-center">
            행운의 아이템
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">{'\uD83C\uDFA8'}</div>
              <p className="text-xs text-[#a49484] m-0">행운의 색</p>
              <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">{selected.luckyColor}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{'\uD83D\uDD22'}</div>
              <p className="text-xs text-[#a49484] m-0">행운의 숫자</p>
              <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">{selected.luckyNumber}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{'\uD83E\uDDED'}</div>
              <p className="text-xs text-[#a49484] m-0">행운의 방향</p>
              <p className="text-base font-heading font-bold text-[#C9A227] m-0 mt-1">{selected.luckyDirection}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[#a49484] text-sm mb-4">
            더 자세한 운세 상담을 원하시나요?
          </p>
          <Link href="/counselors" className="btn-primary-lg text-base px-10 py-3">
            상담사에게 문의하기
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <h2 className="text-2xl font-heading font-black text-[#C9A227] m-0">
          띠별 운세
        </h2>
        <p className="text-sm text-[#a49484] mt-2 m-0">
          나의 띠를 선택하고 오늘의 운세를 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {zodiacList.map((zodiac) => (
          <button
            key={zodiac.animal}
            onClick={() => setSelected(zodiac)}
            className="glass-card p-4 text-center hover:border-[rgba(201,162,39,0.5)] transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              {zodiac.emoji}
            </div>
            <p className="text-sm font-bold text-foreground m-0">{zodiac.animal}</p>
            <p className="text-xs text-[#a49484] m-0 mt-1">
              {zodiac.jiji}({zodiac.hanja})
            </p>
            <div className="mt-2">
              <span className="text-sm font-heading font-black text-[#C9A227]">
                {zodiac.overallScore}
              </span>
              <span className="text-xs text-[#a49484]">점</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// === Compatibility Tab ===

function CompatibilityTab() {
  const [birthDate1, setBirthDate1] = useState('');
  const [birthDate2, setBirthDate2] = useState('');
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!birthDate1 || !birthDate2) {
      setError('두 사람의 생년월일을 모두 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await apiFetch('/api/v1/fortune/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate1, birthDate2 }),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || '궁합 분석 중 오류가 발생했습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#C9A227';
    if (score >= 60) return '#b08d1f';
    if (score >= 40) return '#8B6914';
    return '#8B0000';
  };

  return (
    <>
      <div className="text-center">
        <h2 className="text-2xl font-heading font-black text-[#C9A227] m-0">
          궁합 테스트
        </h2>
        <p className="text-sm text-[#a49484] mt-2 m-0">
          두 사람의 생년월일로 궁합을 확인해보세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6">
        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-bold text-[#C9A227] mb-2">
              첫 번째 사람 생년월일
            </label>
            <input
              type="date"
              value={birthDate1}
              onChange={(e) => setBirthDate1(e.target.value)}
              className="w-full p-3 rounded-xl bg-[rgba(201,162,39,0.05)] border border-[rgba(201,162,39,0.2)] text-foreground focus:border-[#C9A227] focus:outline-none transition-colors"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#C9A227] mb-2">
              두 번째 사람 생년월일
            </label>
            <input
              type="date"
              value={birthDate2}
              onChange={(e) => setBirthDate2(e.target.value)}
              className="w-full p-3 rounded-xl bg-[rgba(201,162,39,0.05)] border border-[rgba(201,162,39,0.2)] text-foreground focus:border-[#C9A227] focus:outline-none transition-colors"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          {error && (
            <p className="text-sm text-[#8B0000] m-0">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-lg w-full py-3 text-base disabled:opacity-50"
          >
            {loading ? '분석 중...' : '궁합 보기'}
          </button>
        </div>
      </form>

      {result && (
        <>
          <div className="glass-card p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-4xl mb-1">{result.emoji1}</div>
                <p className="text-sm font-bold text-foreground m-0">{result.animal1}띠</p>
              </div>
              <div className="text-3xl text-[#C9A227]">&hearts;</div>
              <div className="text-center">
                <div className="text-4xl mb-1">{result.emoji2}</div>
                <p className="text-sm font-bold text-foreground m-0">{result.animal2}띠</p>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <ScoreGauge score={result.score} />
            </div>
            <h3 className="text-xl font-heading font-bold m-0 mb-3" style={{ color: getScoreColor(result.score) }}>
              궁합 점수
            </h3>
            <p className="text-sm text-[#a49484] leading-relaxed m-0 max-w-[480px] mx-auto">
              {result.summary}
            </p>
          </div>

          {[
            { label: '연애 궁합', icon: '\u2764\uFE0F', data: result.love },
            { label: '업무 궁합', icon: '\uD83D\uDCBC', data: result.work },
            { label: '우정 궁합', icon: '\uD83E\uDD1D', data: result.friendship },
          ].map((cat) => (
            <div key={cat.label} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="text-lg font-heading font-bold text-foreground m-0">{cat.label}</h3>
                </div>
                <span className="text-xl font-heading font-black" style={{ color: getScoreColor(cat.data.score) }}>
                  {cat.data.score}
                </span>
              </div>
              <ScoreBar score={cat.data.score} />
              <p className="text-sm mt-3 mb-0 leading-relaxed text-[#a49484]">{cat.data.description}</p>
            </div>
          ))}

          <div className="glass-card p-6 border-[rgba(201,162,39,0.3)] text-center">
            <p className="text-sm text-foreground m-0 mb-4">
              상담사에게 자세한 궁합 분석을 받아보세요
            </p>
            <Link href="/counselors" className="btn-primary-lg text-base px-10 py-3">
              상담 예약하기
            </Link>
          </div>
        </>
      )}
    </>
  );
}

// === Main Page ===

export default function FortunePage() {
  const { me, loading: authLoading } = useAuth();
  const [fortune, setFortune] = useState<FortuneDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('today');

  const isLoggedIn = !!me;

  useEffect(() => {
    if (authLoading) return;

    if (!me) {
      setFortune(MOCK_FORTUNE);
      setLoading(false);
      return;
    }

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

    fetchFortune();
  }, [me, authLoading]);

  if ((loading || authLoading) && activeTab === 'today') {
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

  return (
    <div className="page-container">
      <h1 className="text-3xl font-heading font-black text-[#C9A227] m-0 text-center">
        운세
      </h1>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'today' && fortune && (
        <TodayFortuneTab fortune={fortune} isLoggedIn={isLoggedIn} />
      )}

      {activeTab === 'zodiac' && <ZodiacFortuneTab />}

      {activeTab === 'compatibility' && <CompatibilityTab />}
    </div>
  );
}
