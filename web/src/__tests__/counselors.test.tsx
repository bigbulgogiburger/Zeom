import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Next.js navigation
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/counselors',
}));

// next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      title: '상담사 목록',
      subtitle: '원하시는 분야의 상담사를 찾아보세요',
      searchPlaceholder: '상담사 이름 또는 분야 검색...',
      filterAll: '전체',
      filterSaju: '사주',
      filterTarot: '타로',
      filterSinjeom: '신점',
      filterDream: '꿈해몽',
      filterCompatibility: '궁합',
      loadError: '상담사 목록을 불러오지 못했습니다',
      loadErrorRetry: '잠시 후 다시 시도해주세요.',
      noResults: '검색 결과가 없습니다',
      noResultsHint: '다른 검색어 또는 필터를 사용해보세요.',
      viewAll: '전체 보기',
      viewProfile: '프로필 보기',
      addFavorite: '즐겨찾기 추가',
      removeFavorite: '즐겨찾기 해제',
    };
    return dict[key] ?? key;
  },
}));

// auth
jest.mock('../components/auth-context', () => ({
  useAuth: () => ({ me: null, refresh: jest.fn() }),
}));

// api
jest.mock('../components/api', () => ({
  API_BASE: 'http://localhost:8080',
}));

jest.mock('../components/api-client', () => ({
  apiFetch: jest.fn().mockResolvedValue({ ok: true, json: async () => [] }),
  getCreditBalance: jest.fn().mockResolvedValue({ remainingCredits: 0 }),
}));

import CounselorsPage from '@/app/counselors/page';

const SAMPLE_COUNSELORS = [
  {
    id: 1,
    name: '김도사',
    specialty: '사주',
    intro: '20년 경력의 사주 전문가',
    profileImageUrl: null,
    averageRating: 4.8,
    totalReviews: 120,
    pricePerSession: 30000,
    sessionMinutes: 30,
    careerYears: 20,
    isOnline: true,
  },
  {
    id: 2,
    name: '이무녀',
    specialty: '타로',
    intro: '타로카드로 풀어가는 인생',
    profileImageUrl: null,
    averageRating: 4.5,
    totalReviews: 80,
    pricePerSession: 25000,
    sessionMinutes: 30,
    careerYears: 10,
    isOnline: false,
  },
];

beforeEach(() => {
  mockReplace.mockClear();
  mockPush.mockClear();
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      content: SAMPLE_COUNSELORS,
      totalPages: 1,
      totalElements: SAMPLE_COUNSELORS.length,
    }),
  })) as unknown as typeof fetch;
  // Element scrollIntoView for any pagination scrolls
  Object.defineProperty(window, 'scrollTo', {
    value: jest.fn(),
    writable: true,
  });
});

describe('CounselorsPage', () => {
  it('renders the counselor list with rating and price', async () => {
    render(<CounselorsPage />);
    expect(await screen.findByText('김도사')).toBeInTheDocument();
    expect(screen.getByText('이무녀')).toBeInTheDocument();
    // rating numerals
    expect(await screen.findByText('4.8')).toBeInTheDocument();
    // price value formatted
    const grid = screen.getByTestId('counselor-grid');
    expect(within(grid).getAllByText(/30,000/).length).toBeGreaterThan(0);
  });

  it('renders specialty filter chips and toggles them via aria-pressed', async () => {
    render(<CounselorsPage />);
    await screen.findByText('김도사');
    const sajuChip = screen.getByRole('button', { name: '사주' });
    expect(sajuChip).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(sajuChip);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '사주' })).toHaveAttribute('aria-pressed', 'true'),
    );
  });

  it('navigates to detail page via the card link', async () => {
    render(<CounselorsPage />);
    await screen.findByText('김도사');
    const links = await screen.findAllByRole('link', { name: /예약하기/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('/counselors/'));
  });
});
