# [ZEOM-24] [P4-C] Group C 정책/콘텐츠 6페이지 (1.5일) — 개발 가이드

> 생성일: 2026-05-03
> 스택: Next.js 15 + React 19 + Tailwind v4 + shadcn/ui
> 페르소나: React Expert (App Router/Server Components/디자인 토큰)
> 부모: ZEOM-6 (Phase 4 사용자 보조 34페이지) → ZEOM-1 (웹 리디자인 71 페이지 v2 에픽)
> 전제: ZEOM-22(chrome), ZEOM-23(인증 7페이지) 머지 완료, hex/entity 0건 baseline

## 1. 요구사항 요약

### 비즈니스 목표
정책/콘텐츠 6페이지(`/faq`, `/terms`, `/privacy`, `/blog`, `/blog/[category]`, `/blog/[category]/[slug]`)를 §4.3 처방으로 통일. ZEOM-21 baseline(hex/entity 0건, 토큰만 사용)을 동일하게 유지하며 prose 토큰·anchor nav·카드 stagger·shadcn Accordion 패턴을 도입.

### 인수조건 (이슈 AC 그대로)
- [ ] §4.3 처방 일치
- [ ] terms/privacy 좌측 anchor nav — 스크롤 위치 sync (IntersectionObserver)
- [ ] blog [slug] 본문 prose 토큰 (h1~h6, ul/ol, code, blockquote)
- [ ] keyboard nav (FAQ Enter/Space로 펼침)
- [ ] mobile (terms anchor nav drawer 또는 상단 select)
- [ ] reduced-motion (blog stagger 정적)
- [ ] 4 뷰포트 (360/768/1024/1440)
- [ ] empty (FAQ 검색 결과 없음, blog 카테고리 비어있음)

### 제약사항
- **hex 0 / HTML entity 0** 유지 (`grep -rEn '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;'` → 6 페이지 모두 0)
- **emoji 금지** (anti-slop) — 현재 `/blog/page.tsx:17–26`의 `categoryEmoji()` 제거 대상. CategoryDot 또는 텍스트 chip으로 대체
- **폰트**: Pretendard (본문) + Gowun Batang (`var(--font-heading)`) — Noto Serif KR 금지
- **컬러**: `hsl(var(--xxx))` 토큰만, 인라인 style 색상 금지 (`/terms/page.tsx:11–17`의 인라인 style 모두 className으로 이전)
- **Tailwind v4 prose plugin 미사용** — `.prose` 유틸은 globals.css `@layer base`에 직접 정의 (h1~h6/ul/ol/code/blockquote 토큰 매핑)

## 2. 영향 범위 분석

### 수정 대상 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `web/src/components/ui/accordion.tsx` | **신규** | shadcn Accordion (radix-ui/react-accordion). divider `--border-subtle`, hover `--surface-2`, keyboard nav 내장 |
| `web/src/components/design/anchor-nav.tsx` | **신규** | 좌측 240px sticky TOC. IntersectionObserver로 활성 섹션 sync. mobile `<NativeSelect>` fallback (`md:hidden`) |
| `web/src/components/design/index.ts` | 수정 | AnchorNav export 추가 |
| `web/src/app/globals.css` | 수정 | `@layer base`에 `.prose` 유틸 정의 (h1 52px serif, h2 24px, h3 20px, body 17px/1.75, ul/ol/code/blockquote 토큰 매핑) + `.stagger-grid` reduced-motion 가드 |
| `web/src/app/faq/page.tsx` | 전면 재작성 | shadcn Accordion + 검색 input(클라이언트 컴포넌트로 분할). 카테고리 그룹 유지. EmptyState 재사용 (검색 결과 0건) |
| `web/src/app/faq/faq-list.tsx` | **신규** | `'use client'` — 검색 + Accordion 렌더링 (page.tsx는 데이터만 전달) |
| `web/src/app/terms/page.tsx` | 전면 재작성 | max-w-720, 인라인 style 제거, `.prose` 적용, 좌측 `<AnchorNav>` (md+ sticky), 모바일 select |
| `web/src/app/privacy/page.tsx` | 전면 재작성 | terms와 동일 패턴 |
| `web/src/app/blog/page.tsx` | 수정 | `categoryEmoji()` 삭제 → `<CategoryDot>` 또는 텍스트 chip(`<Seg>` 재사용 검토). 카드 그리드 stagger 적용 (`.stagger-grid`) |
| `web/src/app/blog/[category]/page.tsx` | 수정 | 1줄 hero(h1 36px serif) + 카드 그리드 stagger. emoji 제거 |
| `web/src/app/blog/[category]/[slug]/page.tsx` | 수정 | 본문 max-w-720, h1 52px serif, `.prose` 적용. 코드/이미지를 GlowCard 또는 카드 컨테이너로 감싸기 |

### 연관 파일 (읽기 전용 — 이해 필요, 수정하지 않음)

| 파일 | 참조 이유 |
|------|----------|
| `web/src/app/blog/blog-data.ts` | BlogPost/Category 타입, 마크다운 변환 함수 — prose 적용 지점 파악 |
| `web/src/components/design/empty-state.tsx` | FAQ 검색 결과 없음에 재사용 |
| `web/src/components/design/dot.tsx` | blog 카테고리 chip 색상 인디케이터로 사용 가능 (CategoryDot 패턴) |
| `web/src/components/design/seg.tsx` | 텍스트 카테고리 chip 후보 |
| `web/src/components/design/auth-card.tsx` | AuthCard 패턴 — terms/privacy는 비적용(전체폭 + 좌측 nav) 단, breakpoint min-h 계산 참고 |
| `web/src/app/globals.css` (`@theme inline` 블록) | 토큰 팔레트, font-heading, font-pretendard 확인 |
| `.claude/docs/reference/design-system.md` | §4 처방 (Anti-slop, 폰트, prose 가이드) |

### 의존성 추가 (npm)

```bash
cd web && npx shadcn@latest add accordion
# → @radix-ui/react-accordion 설치 + components/ui/accordion.tsx 생성
```

`@radix-ui/react-accordion`은 shadcn 기본 의존성. 별도 추가 불필요(이미 다른 컴포넌트에서 radix 사용 중).

### DB 변경
없음 (정적 콘텐츠 페이지).

## 3. 구현 계획

### Phase 1: 토큰 + 신규 컴포넌트 기반
**목표**: 6 페이지가 사용할 prose 토큰과 공유 컴포넌트 확보. 페이지 작업 전 단단한 토대.

1. `web/src/app/globals.css` `@layer base` 끝에 추가:
   - `.prose { color: hsl(var(--text-primary)); line-height: 1.75; font-size: 17px; }`
   - `.prose h1 { font-family: var(--font-heading); font-size: 52px; line-height: 1.15; margin-block: 48px 24px; color: hsl(var(--gold)); }`
   - h2(24px serif mt-32), h3(20px), p(mb-16), ul/ol(list-disc/decimal pl-24 my-16), code(`hsl(var(--surface-2))` bg, padding 2/6, radius 4), pre(GlowCard-like card), blockquote(border-l-4 `hsl(var(--gold-soft))` pl-16 italic text-secondary)
   - `.stagger-grid > * { animation: fade-up .4s ease forwards; opacity: 0; }`
   - 인덱스별 delay (1~12까지 `:nth-child(n)` 50ms 단위)
   - `@media (prefers-reduced-motion: reduce) { .stagger-grid > * { animation: none; opacity: 1; } }`
2. `cd web && npx shadcn@latest add accordion` → `web/src/components/ui/accordion.tsx` 생성. 생성 후 토큰 정합 점검:
   - AccordionItem `border-b` → `border-b border-[hsl(var(--border-subtle))]`
   - AccordionTrigger hover → `hover:bg-[hsl(var(--surface-2))]`
   - 데이터 속성 기반 chevron rotate 유지 (motion-reduce 자동 처리)
3. `web/src/components/design/anchor-nav.tsx` 신규:
   - Props: `items: { id: string; label: string }[]`
   - 데스크탑: `<nav className="sticky top-24 hidden md:block w-60">` + `<a href="#${id}">` 리스트. 활성 섹션 `text-[hsl(var(--gold))]` + 좌측 1px gold border
   - 모바일: `<select className="md:hidden w-full">` — onChange로 `scrollIntoView({ block: 'start', behavior: 'smooth' })`. `prefers-reduced-motion` 시 `'auto'`
   - useEffect로 IntersectionObserver(`rootMargin: '-30% 0px -60% 0px'`) — 섹션 가시성 추적 → activeId state
4. `web/src/components/design/index.ts`에 `export { AnchorNav } from './anchor-nav';` 추가

**검증**: `cd web && npx tsc --noEmit` 0 errors. `npm run dev` → /login 회귀 없음(토큰 변경 영향 점검).

### Phase 2: /faq 마이그레이션
**목표**: shadcn Accordion + 검색 input + EmptyState. 키보드 nav.

1. `web/src/app/faq/page.tsx`를 Server Component로 유지 — `faqData` 정의만 담고 `<FaqList data={faqData} />` 렌더
2. `web/src/app/faq/faq-list.tsx` 신규 (`'use client'`):
   - `useState<string>('')`로 검색어
   - 카테고리 그룹별 `<Accordion type="single" collapsible>`
   - 검색어로 q+a 필터링 (소문자 비교, 한글 NFC 정규화) → 모든 카테고리 결과 0건이면 `<EmptyState>` (web/src/components/design/empty-state.tsx — 기존 props 확인 후 사용)
   - 검색 input: `<Input placeholder="질문 검색...">` + 좌측 lucide `Search` 아이콘 absolute (existing pattern 참고: `web/src/app/counselors/page.tsx`)
3. 페이지 컨테이너: `<main className="max-w-[840px] mx-auto px-6 py-16">` + h1 32px serif gold + 검색 input + 카테고리 섹션 (h2 18px gold-soft + Accordion)

**검증**: 
- 검색 input에 "결제" 입력 → "결제" 카테고리만 표시
- 검색 결과 0건 → EmptyState 노출
- Tab → AccordionTrigger 포커스 → Enter/Space로 확장 (radix 기본 동작)
- 4 뷰포트 (openchrome 후속 회차)

### Phase 3: /terms + /privacy 마이그레이션
**목표**: prose 토큰 + 좌측 anchor nav + 인라인 style 제거. 두 페이지 동일 패턴.

1. `web/src/app/terms/page.tsx` 전면 재작성 (Server Component 유지):
   ```tsx
   const sections = [
     { id: 'sec-1', title: '제1조 (목적)' },
     { id: 'sec-2', title: '제2조 (용어의 정의)' },
     // ... 9개 조항
   ];
   ```
   - 레이아웃: `<div className="max-w-[1200px] mx-auto px-6 py-16 grid md:grid-cols-[240px_1fr] gap-12">`
   - 좌측: `<AnchorNav items={sections} />`
   - 본문: `<article className="prose"><h1>이용약관</h1>... <section id="sec-1"><h2>...</h2><p>...</p></section> ...</article>`
   - 시행일: `<p className="text-[hsl(var(--text-secondary))] text-sm mb-8">시행일: 2026년 3월 1일</p>`
   - **Section 컴포넌트 제거** — `<section id>` + h2 직접 사용 (AnchorNav id 매칭)
   - 인라인 `style={{ ... }}` 제거 — 모두 `.prose` 또는 토큰 className으로
2. `web/src/app/privacy/page.tsx` 동일 패턴. 8개 조항 + 표(table)는 `.prose table` 추가 스타일 필요 (Phase 1 globals.css에 prose 정의 시 table border `--border-subtle` 추가)

**검증**:
- 좌측 nav 클릭 → 해당 섹션 스크롤 (smooth, motion-reduce는 instant)
- 스크롤 → IntersectionObserver로 nav 활성 항목 갱신
- mobile (~360px) → nav가 select로 전환
- `grep -rE '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;|style=' web/src/app/terms/ web/src/app/privacy/` → 0건

### Phase 4: /blog 메인 마이그레이션
**목표**: emoji 제거, 카드 그리드 stagger. 카테고리 chip을 텍스트 + Dot 색상으로.

1. `web/src/app/blog/page.tsx` 수정:
   - `categoryEmoji()` 함수 **삭제**
   - 카테고리 표시: `<Seg>` 또는 인라인 `<span className="inline-flex items-center gap-2"><Dot color="hsl(var(--gold))" />{post.category}</span>` (CATEGORY_COLORS 토큰 활용 — blog-data.ts:CATEGORY_COLORS 매핑 검토 후 토큰 변환 필요 시 별도 처리)
   - 카드 그리드: `<div className="stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`
   - 카드: GlowCard 패턴 또는 `border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] rounded-lg p-6 hover:bg-[hsl(var(--surface-2))]`
   - placeholder-img: 16:9 비율 div + `bg-[hsl(var(--surface-2))]` (실제 이미지 없으면 카테고리 첫 글자만 큰 글자로)

**검증**: 
- emoji grep 0건 (`grep -rE '🔮|🃏|🌙|⭐|📋' web/src/app/blog/`)
- prefers-reduced-motion 활성 시 stagger 애니메이션 비활성

### Phase 5: /blog/[category] 마이그레이션
**목표**: 1줄 hero(36px serif) + 카드 그리드 stagger.

1. `web/src/app/blog/[category]/page.tsx` 수정:
   - Hero 영역: `<h1 className="font-[var(--font-heading)] text-4xl text-[hsl(var(--gold))] mb-12">{categoryName}</h1>` + 부제(텍스트 secondary)
   - 카드 그리드: Phase 4와 동일 패턴 + emoji 제거
   - empty (해당 카테고리 글 0건) → `<EmptyState title="아직 작성된 글이 없어요" />`
2. `generateStaticParams` 유지

**검증**: 
- 5개 카테고리(`getCategorySlug` 매핑) 모두 빌드 성공
- 빈 카테고리 시 EmptyState 정상 노출 (테스트 데이터 조정 또는 임시 검증)

### Phase 6: /blog/[category]/[slug] 마이그레이션
**목표**: 본문 prose 토큰 적용. 코드/이미지 카드화.

1. `web/src/app/blog/[category]/[slug]/page.tsx` 수정:
   - 본문 컨테이너: `<article className="prose mx-auto max-w-[720px] px-6 py-16">`
   - 마크다운 변환 결과(`dangerouslySetInnerHTML` 추정 — blog-data.ts 검증 필요): prose 클래스 안에서 자동으로 h1~h6/ul/ol/code/blockquote 적용
   - 헤더(제목, 작성일, 카테고리 배지): article 위에 `<header className="max-w-[720px] mx-auto px-6">` 별도 — h1은 prose 시작 첫 헤딩(52px)
   - 코드 블록: prose pre 스타일이 카드 컨테이너 효과 (border + bg surface-2 + radius)
   - 이미지: prose img 스타일 (rounded-lg shadow-sm)
2. 관련 글 섹션이 있다면 카드 그리드 stagger 동일 적용

**검증**:
- h1 52px serif 렌더 (브라우저 inspect)
- 본문 17px line-height 1.75
- 코드 인라인/블록 토큰 색상 정상

### Phase 7: 통합 검증
1. `cd web && npx tsc --noEmit` → 0 errors
2. `cd web && npm run build` → routes 75 → ~동일 (페이지 수 변동 없음, 빌드 성공)
3. `cd web && npm test` → ZEOM-23 baseline 128/129 동일 또는 향상
4. **hex/entity 0건 audit**: 
   ```bash
   grep -rEn '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;' web/src/app/faq web/src/app/terms web/src/app/privacy web/src/app/blog
   # 0건 기대
   ```
5. **emoji audit** (anti-slop):
   ```bash
   grep -rE '[🔮🃏🌙⭐📋✨]' web/src/app/blog/ web/src/app/faq/
   # 0건 기대
   ```
6. **inline style audit** (terms/privacy):
   ```bash
   grep -rE 'style=\{' web/src/app/terms/ web/src/app/privacy/
   # 0건 기대 (className만 사용)
   ```

## 4. 기술 상세

### 핵심 로직

#### `.prose` 유틸 vs Tailwind Typography Plugin
프로젝트는 Tailwind v4 `@theme inline` 패턴이며 `@tailwindcss/typography` 미설치. 새로 설치하면 토큰 충돌 위험(plugin이 자체 색상 변수 도입). globals.css `@layer base`에 직접 `.prose` 정의 — 6 페이지 한정 사용이라 비용 < 토큰 일관성 이익.

#### IntersectionObserver — `rootMargin` 튜닝
- `'-30% 0px -60% 0px'`: 뷰포트 상단 30% 지점에 진입하면 활성. 섹션 진입 직후가 아닌 "읽기 시작" 시점이라 사용성 좋음
- `threshold: 0` (단순 cross 검출). 다중 섹션 가시성은 `entries.find(e => e.isIntersecting)`로 첫 매치만 사용
- cleanup: `observer.disconnect()` in useEffect return

#### 검색 input — Korean NFC + debounce
- 한글 IME 조합 중 `onChange`가 빠르게 발생 → 카테고리 전체 필터가 매 keystroke 실행. 6개 카테고리/30+ Q 정도라 debounce 없이도 OK이지만, 향후 데이터 증가 대비 `useDeferredValue` 적용 권장
- `q.toLocaleLowerCase('ko').includes(query.toLocaleLowerCase('ko'))`로 한글 비교

#### Accordion 키보드 접근성
shadcn Accordion(radix 기반)은 ARIA 속성 + 키보드 nav 내장. 추가 작업 불필요. 단 visual focus ring 토큰 정렬 필수: `focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))]`

### 위험 요소

| 위험 | 영향도 | 대응 방안 |
|------|--------|----------|
| `.prose` 토큰이 globals.css 비대화 | 낮음 | 6 페이지 한정. 추후 7개 이상 페이지가 prose 사용하면 별도 `prose.css` 추출 검토 |
| AnchorNav IntersectionObserver — 섹션 점프 시 활성 nav 깜빡임 | 중간 | `rootMargin` 튜닝 + `requestAnimationFrame` debounce. 클릭 후 500ms는 observer 무시(programmatic scroll 플래그) |
| Tailwind v4 `.stagger-grid` `:nth-child` `animation-delay` 정적 정의 — 12개 초과 카드 시 fallback | 낮음 | 12개 이후는 delay 0(즉시 페이드인). 블로그 글 ≤30 예상이라 영향 미미 |
| blog-data.ts CATEGORY_COLORS가 hex일 가능성 | 중간 | 발견 시 별도 hex→token 매핑 추가. dev-guide와 무관한 의존성 충돌이라 Phase 4에서 점검 필요 |
| /blog/[category]/[slug] 마크다운 렌더가 `dangerouslySetInnerHTML` 사용 | 낮음 | XSS 영향 — blog-data.ts는 빌드 타임 정적 데이터, 외부 입력 없음. prose 클래스만 적용하면 안전 |
| shadcn Accordion 신규 npm 의존성 충돌 | 낮음 | radix-ui 다른 컴포넌트 이미 사용 중 (peer ok). `npm install` 후 `npm run build` 통과 확인 |

### 외부 연동
없음. 정적 콘텐츠 페이지(SSG 우선).

## 5. 병렬 작업 가이드

> Phase 1 완료 후 Phase 4–6 (blog 3 페이지)은 파일 충돌 없이 병렬 가능. 단 단일 개발자 워크플로(harness-workflow inner loop)에서는 순차가 리뷰 단위 작아 더 안전하므로 **순차 진행 권장**.

병렬 적용 시:
- Team A: Phase 4 `/blog/page.tsx`
- Team B: Phase 5 `/blog/[category]/page.tsx`
- Team C: Phase 6 `/blog/[category]/[slug]/page.tsx`
- 공유 파일 globals.css는 Phase 1에서 확정, 이후 변경 없음

이번 워크플로는 단일 세션 진행이라 **5–7 Phase 모두 순차 처리**. Phase 5는 Phase 4 패턴 검증 후 진행하면 risk 작음.

## 6. 완료 기준 (Definition of Done)

- [ ] AC 7개 모두 충족
- [ ] hex/entity/emoji audit 0건
- [ ] tsc 0 errors / next build 성공 / jest baseline 유지
- [ ] harness-review verdict PASS (zeom-component-reviewer 등)
- [ ] CLAUDE.md "16 화면 + chrome 토큰 baseline" 표현이 22 화면(+6) 또는 별도 group으로 갱신 검토 (별도 PR 가능)
- [ ] Jira 코멘트로 변경 요약 + 커밋 SHA 기록
