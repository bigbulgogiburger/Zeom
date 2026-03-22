import type { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ score?: string; date?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const score = params.score || '75';
  const date = params.date || '오늘';

  const title = `천지연꽃신당 - 오늘의 운세 (${score}점)`;
  const description = `${date} 운세 점수: ${score}점. 나만의 사주팔자 운세를 확인해보세요!`;
  const ogImageUrl = `/api/og?score=${score}&date=${encodeURIComponent(date)}`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      siteName: '천지연꽃신당',
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  const score = Number(params.score || '75');
  const date = params.date || '오늘';

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'hsl(var(--gold))';
    if (s >= 60) return 'hsl(var(--gold)/0.85)';
    if (s >= 40) return '#8B6914';
    return 'hsl(var(--dancheong))';
  };

  return (
    <div className="page-container">
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-[hsl(var(--text-secondary))] m-0 mb-2">{date}</p>
        <h1 className="text-2xl font-heading font-black text-[hsl(var(--gold))] m-0 mb-6">
          오늘의 운세
        </h1>

        <div className="flex justify-center mb-6">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center border-4"
            style={{ borderColor: getScoreColor(score) }}
          >
            <span
              className="text-4xl font-heading font-black"
              style={{ color: getScoreColor(score) }}
            >
              {score}
            </span>
          </div>
        </div>

        <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed m-0 mb-6">
          나만의 사주팔자 기반 맞춤형 운세를 확인해보세요.
        </p>

        <a href="/fortune" className="btn-primary-lg text-base px-10 py-3 inline-block">
          내 운세 확인하기
        </a>

        <p className="text-xs text-[hsl(var(--text-secondary))]/50 m-0 mt-6">
          천지연꽃신당 | cheonjiyeon.com
        </p>
      </div>
    </div>
  );
}
