import { render, screen } from '@testing-library/react';
import HomeContent from '@/app/HomeContent';
import type { PublicStats, FeaturedReview } from '@/app/page';

// JSDOM doesn't implement scrollBy on the slider; stub it.
beforeAll(() => {
  if (!Element.prototype.scrollBy) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Element.prototype as any).scrollBy = function () {};
  }
});

const counselors = [
  { id: 1, name: '김선생', specialty: '사주', intro: '20년 경력' },
  { id: 2, name: '이선생', specialty: '타로', intro: '10년 경력' },
  { id: 3, name: '박선생', specialty: '신점', intro: '15년 경력' },
];

const stats: PublicStats = {
  totalCounselors: 12,
  totalConsultations: 3400,
  averageRating: 4.8,
  totalReviews: 980,
};

const featuredReviews: FeaturedReview[] = [
  {
    id: 1,
    rating: 5,
    comment: '정말 도움이 되었습니다.',
    authorName: '홍**',
    counselorName: '김선생',
    createdAt: '2026-04-01',
  },
];

describe('HomeContent (ZEOM-19)', () => {
  it('renders hero h1 and CTA pointing to /counselors', () => {
    render(
      <HomeContent
        counselors={counselors}
        stats={stats}
        featuredReviews={featuredReviews}
      />,
    );

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('당신의 운명');

    const cta = screen.getByRole('link', { name: '지금 상담받기' });
    expect(cta).toHaveAttribute('href', '/counselors');
  });

  it('renders all 6 category tiles', () => {
    render(
      <HomeContent
        counselors={counselors}
        stats={stats}
        featuredReviews={featuredReviews}
      />,
    );

    for (const label of ['연애', '금전', '취업', '건강', '가족', '이별']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
