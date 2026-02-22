'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { apiFetch } from '@/components/api-client';

type SajuPillar = {
  gan: string;
  ji: string;
  ganHanja: string;
  jiHanja: string;
  ganOhaeng: string;
  jiOhaeng: string;
  animal?: string;
};

type SajuChart = {
  yearPillar: SajuPillar;
  monthPillar: SajuPillar;
  dayPillar: SajuPillar;
  hourPillar: SajuPillar | null;
  ohaengBalance: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  dominantElement: string;
  weakElement: string;
  dayGanInterpretation?: string;
  yongsin?: string;
  yongsinDescription?: string;
};

const OHAENG_COLORS: Record<string, string> = {
  '\uBAA9': '#2E8B57',
  '\uD654': '#DC143C',
  '\uD1A0': '#DAA520',
  '\uAE08': '#C0C0C0',
  '\uC218': '#191970',
  wood: '#2E8B57',
  fire: '#DC143C',
  earth: '#DAA520',
  metal: '#C0C0C0',
  water: '#191970',
};

const OHAENG_KR: Record<string, string> = {
  wood: '\uBAA9(\u6728)',
  fire: '\uD654(\u706B)',
  earth: '\uD1A0(\u571F)',
  metal: '\uAE08(\u91D1)',
  water: '\uC218(\u6C34)',
};

const ANIMAL_MAP: Record<string, string> = {
  '\uC790': '\uC950',
  '\uCD95': '\uC18C',
  '\uC778': '\uD638\uB791\uC774',
  '\uBBD8': '\uD1A0\uB07C',
  '\uC9C4': '\uC6A9',
  '\uC0AC': '\uBF40',
  '\uC624': '\uB9D0',
  '\uBBF8': '\uC591',
  '\uC2E0': '\uC6D0\uC22D\uC774',
  '\uC720': '\uB2ED',
  '\uC220': '\uAC1C',
  '\uD574': '\uB3FC\uC9C0',
};

function getOhaengColor(ohaeng: string): string {
  return OHAENG_COLORS[ohaeng] || '#C9A227';
}

function PillarCell({ label, pillar }: { label: string; pillar: SajuPillar | null }) {
  if (!pillar) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-xs text-[#a49484] font-bold m-0 mb-2">{label}</p>
        <div className="rounded-xl border border-[rgba(201,162,39,0.15)] bg-[#1a1612] p-3 w-full text-center">
          <p className="text-2xl font-heading font-black text-[#a49484]/50 m-0">?</p>
          <p className="text-xs text-[#a49484]/50 m-0">\uBBF8\uC785\uB825</p>
        </div>
        <div className="mt-2 rounded-xl border border-[rgba(201,162,39,0.15)] bg-[#1a1612] p-3 w-full text-center">
          <p className="text-2xl font-heading font-black text-[#a49484]/50 m-0">?</p>
          <p className="text-xs text-[#a49484]/50 m-0">\uBBF8\uC785\uB825</p>
        </div>
      </div>
    );
  }

  const ganColor = getOhaengColor(pillar.ganOhaeng);
  const jiColor = getOhaengColor(pillar.jiOhaeng);
  const animal = ANIMAL_MAP[pillar.ji] || pillar.animal || '';

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-[#a49484] font-bold m-0 mb-2">{label}</p>
      {/* Cheongan (Heavenly Stem) */}
      <div
        className="rounded-xl border p-3 w-full text-center"
        style={{ borderColor: ganColor, backgroundColor: `${ganColor}15` }}
      >
        <p className="text-2xl font-heading font-black text-foreground m-0">
          {pillar.ganHanja}
        </p>
        <p className="text-xs text-[#a49484] m-0">{pillar.gan}</p>
      </div>
      {/* Jiji (Earthly Branch) */}
      <div
        className="mt-2 rounded-xl border p-3 w-full text-center"
        style={{ borderColor: jiColor, backgroundColor: `${jiColor}15` }}
      >
        <p className="text-2xl font-heading font-black text-foreground m-0">
          {pillar.jiHanja}
        </p>
        <p className="text-xs text-[#a49484] m-0">{pillar.ji}</p>
        {animal && (
          <p className="text-xs text-[#C9A227] m-0 mt-1">{animal}</p>
        )}
      </div>
    </div>
  );
}

function OhaengChart({ balance }: { balance: SajuChart['ohaengBalance'] }) {
  const total = balance.wood + balance.fire + balance.earth + balance.metal + balance.water;
  const maxVal = Math.max(balance.wood, balance.fire, balance.earth, balance.metal, balance.water, 1);

  const elements = [
    { key: 'wood', value: balance.wood },
    { key: 'fire', value: balance.fire },
    { key: 'earth', value: balance.earth },
    { key: 'metal', value: balance.metal },
    { key: 'water', value: balance.water },
  ];

  return (
    <div className="grid gap-3">
      {elements.map((el) => {
        const pct = maxVal > 0 ? (el.value / maxVal) * 100 : 0;
        const totalPct = total > 0 ? Math.round((el.value / total) * 100) : 0;
        const color = OHAENG_COLORS[el.key] || '#C9A227';
        const label = OHAENG_KR[el.key] || el.key;

        return (
          <div key={el.key} className="flex items-center gap-3">
            <span
              className="w-14 text-sm font-bold text-white text-center py-1 rounded-lg shrink-0"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>
            <div className="flex-1 h-4 rounded-full bg-[rgba(201,162,39,0.1)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-sm text-[#a49484] w-10 text-right shrink-0">{totalPct}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MySajuPage() {
  const { me, loading: authLoading } = useAuth();
  const [chart, setChart] = useState<SajuChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [noBirthInfo, setNoBirthInfo] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!me) {
      window.location.href = '/login';
      return;
    }

    async function fetchChart() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/v1/saju/my-chart');
        if (res.ok) {
          setChart(await res.json());
        } else if (res.status === 404 || res.status === 400) {
          setNoBirthInfo(true);
        }
      } catch {
        setNoBirthInfo(true);
      } finally {
        setLoading(false);
      }
    }

    fetchChart();
  }, [me, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="page-container">
        <div className="glass-card p-8">
          <div className="skeleton h-8 w-48 mx-auto rounded mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="skeleton h-20 rounded-xl" />
                <div className="skeleton h-20 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="skeleton h-4 w-full rounded mb-2" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      </div>
    );
  }

  if (noBirthInfo || !chart) {
    return (
      <div className="page-container">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-black text-[#C9A227] m-0">
            \uB098\uC758 \uC0AC\uC8FC \uBA85\uC2DD
          </h1>
        </div>
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">\uD83D\uDD2E</div>
          <h2 className="text-xl font-heading font-bold text-foreground m-0 mb-3">
            \uC0DD\uB144\uC6D4\uC77C\uC2DC \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4
          </h2>
          <p className="text-[#a49484] text-sm leading-relaxed mb-6 max-w-[400px] mx-auto">
            \uC815\uD655\uD55C \uC0AC\uC8FC \uBA85\uC2DD\uC744 \uC704\uD574 \uD504\uB85C\uD544\uC5D0\uC11C \uC0DD\uB144\uC6D4\uC77C \uC815\uBCF4\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.
          </p>
          <Link
            href="/mypage"
            className="btn-primary-lg text-base px-8 py-3"
          >
            \uD504\uB85C\uD544 \uC218\uC815\uD558\uAE30
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-heading font-black text-[#C9A227] m-0">
          \uB098\uC758 \uC0AC\uC8FC \uBA85\uC2DD
        </h1>
        <p className="text-[#a49484] text-sm mt-2 m-0">
          \uC0AC\uC8FC\uD314\uC790(\u56DB\u67F1\u516B\u5B57)
        </p>
      </div>

      {/* 4-Pillar Visualization (traditional right-to-left: hour | day | month | year) */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-4 gap-3">
          <PillarCell label="\uC2DC\uC8FC" pillar={chart.hourPillar} />
          <PillarCell label="\uC77C\uC8FC" pillar={chart.dayPillar} />
          <PillarCell label="\uC6D4\uC8FC" pillar={chart.monthPillar} />
          <PillarCell label="\uB144\uC8FC" pillar={chart.yearPillar} />
        </div>
      </div>

      {/* Ohaeng Distribution */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-4 text-center">
          \uC624\uD589 \uBD84\uD3EC
        </h3>
        <OhaengChart balance={chart.ohaengBalance} />
      </div>

      {/* Day Gan Interpretation */}
      {chart.dayGanInterpretation && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-bold text-foreground m-0 mb-3">
            \uC77C\uAC04 \uD574\uC11D
          </h3>
          <p className="text-sm text-[#a49484] leading-relaxed m-0">
            {chart.dayGanInterpretation}
          </p>
        </div>
      )}

      {/* Yongsin */}
      {chart.yongsin && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-bold text-[#C9A227] m-0 mb-3">
            \uC6A9\uC2E0(\u7528\u795E): {chart.yongsin}
          </h3>
          {chart.yongsinDescription && (
            <p className="text-sm text-[#a49484] leading-relaxed m-0">
              {chart.yongsinDescription}
            </p>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="text-center">
        <p className="text-[#a49484] text-sm mb-4">
          \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uC0AC\uC8FC \uD480\uC774 \uBC1B\uAE30
        </p>
        <Link
          href="/counselors"
          className="btn-primary-lg text-base px-10 py-3"
        >
          \uC804\uBB38 \uC0C1\uB2F4\uC0AC\uC5D0\uAC8C \uC0AC\uC8FC \uD480\uC774 \uBC1B\uAE30
        </Link>
      </div>
    </div>
  );
}
