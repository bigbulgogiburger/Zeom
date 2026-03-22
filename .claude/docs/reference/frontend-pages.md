# Frontend Pages Reference

> 참조 시점: 페이지 추가/수정, 라우팅, 컴포넌트 작업 시

## 기술 스택

- Next.js 15 (App Router)
- React 19, TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline`)
- shadcn/ui 컴포넌트
- next-intl (i18n, ko/en)
- lucide-react (아이콘)

## Page Map

### Public
| Route | 설명 |
|-------|------|
| `/` | 홈 (HomeContent.tsx — Bento/Spotlight/Stagger 레이아웃) |
| `/fortune` | 운세 (3탭: 오늘/띠별/궁합) |
| `/counselors` | 상담사 목록 (검색/필터/정렬) |
| `/counselors/[id]` | 상담사 상세 (Hero + 하단 CTA + 별점 분포) |
| `/login`, `/signup` | 인증 (3-스텝 위자드) |
| `/blog`, `/blog/[category]/[slug]` | 블로그 |
| `/terms`, `/privacy`, `/faq` | 정적 페이지 |

### Authenticated
| Route | 설명 |
|-------|------|
| `/bookings/me` | 예약 내역 (상태 탭 + 날짜 그룹 + 카운트다운) |
| `/wallet` | 지갑 (잔액 + 거래 내역 + 필터) |
| `/credits/*` | 상담권 (잔액/구매/이력) |
| `/sessions/*` | 상담 세션 (채팅) |
| `/consultation/*` | 상담 플로우 (대기실/프리플라이트/채팅/완료/리뷰/요약) |
| `/mypage/*` | 마이페이지 (프로필 허브 + 수정/비밀번호/탈퇴) |
| `/notifications` | 알림 (읽음/안읽음 구분 + 유형 아이콘) |
| `/favorites` | 즐겨찾기 |
| `/my-saju` | 사주 정보 |

### Counselor Portal (`/counselor/`)
사이드바 레이아웃. 9개 메뉴:
대시보드, 상담, 스케줄, 프로필, 리뷰, 정산, 통계, 알림, 설정

### Admin (`/admin/`, `/dashboard/`)
대시보드, 타임라인, 감사로그, 쿠폰, 사용자 관리

## Shared Components (`components/`)

| 컴포넌트 | 용도 |
|----------|------|
| `ui.tsx` | Card, ActionButton, StatusBadge, EmptyState, FormField, Pagination |
| `app-header.tsx` | 글로벌 헤더 (Tailwind 유틸리티, Lucide Menu) |
| `bottom-tab-bar.tsx` | 모바일 하단 탭 (dot 인디케이터 + bounce) |
| `auth-context.tsx` | 인증 상태 관리 |
| `api-client.ts` | API 호출 래퍼 |
| `fortune-card.tsx` | 홈페이지 운세 카드 |
| `consultation-chat.tsx` | 채팅 UI |
| `review-form.tsx` | 리뷰 작성 폼 |

## UX 개선 사항 (Sprint 2)

- 상담사 카드: 평점/리뷰/온라인 상태/가격/이니셜 아바타
- 상담사 상세: Hero 강화 + 모바일 하단 CTA + 별점 분포 + "더 보기"
- 예약 내역: 상태 탭 필터 + 날짜 그룹 + 카운트다운
- 마이페이지: 프로필 허브 + 그룹 카드 + 퀵 액션 메뉴
- 알림 센터: 읽음/안읽음 + 유형 아이콘 + 상대 시간
