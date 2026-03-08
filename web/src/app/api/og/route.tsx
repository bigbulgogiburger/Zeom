import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const score = Number(searchParams.get('score') || '75');
  const date = searchParams.get('date') || '';
  const type = searchParams.get('type') || 'fortune';
  const name = searchParams.get('name') || '';

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#C9A227';
    if (s >= 60) return '#b08d1f';
    if (s >= 40) return '#8B6914';
    return '#8B0000';
  };

  if (type === 'counselor') {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f0d0a',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '60px',
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: '#a49484',
                marginBottom: 16,
              }}
            >
              천지연꽃신당
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#C9A227',
                marginBottom: 24,
              }}
            >
              {name || '전문 상담사'}
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#a49484',
              }}
            >
              사주 · 타로 · 신점 · 꿈해몽
            </div>
            <div
              style={{
                marginTop: 40,
                padding: '12px 40px',
                borderRadius: 8,
                backgroundColor: '#C9A227',
                color: '#0f0d0a',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              상담 예약하기
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Default: fortune type
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0d0a',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 20,
              color: '#a49484',
              marginBottom: 8,
            }}
          >
            천지연꽃신당
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#C9A227',
              marginBottom: 8,
            }}
          >
            오늘의 운세
          </div>
          {date && (
            <div
              style={{
                fontSize: 18,
                color: '#a49484',
                marginBottom: 40,
              }}
            >
              {date}
            </div>
          )}

          {/* Score Circle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 180,
              height: 180,
              borderRadius: '50%',
              border: `8px solid ${getScoreColor(score)}`,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: getScoreColor(score),
              }}
            >
              {score}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: 16,
              color: '#a49484',
            }}
          >
            cheonjiyeon.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
