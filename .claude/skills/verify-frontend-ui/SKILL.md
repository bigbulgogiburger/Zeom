---
name: verify-frontend-ui
description: 프론트엔드 UI/디자인 시스템 품질 검증. UI 컴포넌트 변경 후 사용.
---

## Purpose

1. Tailwind v4 + @theme inline 블록의 디자인 토큰 일관성 검증
2. CSS 변수 네이밍 규칙과 사용 패턴 검증
3. shadcn/ui 컴포넌트 import 경로 일관성 검증
4. 한국어 UI 텍스트 및 접근성 확인
5. 반응형 레이아웃 패턴 검증

## When to Run

- `web/src/app/globals.css` (디자인 토큰) 변경 시
- `web/src/components/ui/` (shadcn/ui 컴포넌트) 변경 시
- `web/src/app/**/*.tsx` 페이지 컴포넌트 변경 시
- `web/src/components/ui.tsx` (커스텀 UI 컴포넌트) 변경 시
- `web/components.json` (shadcn/ui 설정) 변경 시

## Related Files

| File | Purpose |
|------|---------|
| `web/src/app/globals.css` | Tailwind v4 @theme inline + CSS 변수 정의 |
| `web/src/app/layout.tsx` | 루트 레이아웃 (폰트, 전역 래퍼) |
| `web/src/components/ui.tsx` | 커스텀 UI 컴포넌트 (Card, FormField, ActionButton) |
| `web/src/components/ui/button.tsx` | shadcn/ui Button |
| `web/src/components/ui/input.tsx` | shadcn/ui Input |
| `web/src/components/ui/badge.tsx` | shadcn/ui Badge |
| `web/src/components/ui/alert.tsx` | shadcn/ui Alert |
| `web/src/components/ui/dialog.tsx` | shadcn/ui Dialog |
| `web/src/components/ui/sheet.tsx` | shadcn/ui Sheet |
| `web/src/components/ui/separator.tsx` | shadcn/ui Separator |
| `web/src/lib/utils.ts` | cn() 유틸리티 (clsx + tailwind-merge) |
| `web/components.json` | shadcn/ui 설정 |
| `web/postcss.config.mjs` | PostCSS + Tailwind CSS v4 설정 |
| `web/src/app/page.tsx` | 홈페이지 |
| `web/src/app/HomeContent.tsx` | 홈페이지 콘텐츠 |
| `web/src/app/login/page.tsx` | 로그인 페이지 |
| `web/src/app/counselors/page.tsx` | 상담사 목록 |
| `web/src/app/counselor/layout.tsx` | 상담사 포털 레이아웃 |

## Workflow

### Step 1: Tailwind v4 설정 확인

**도구:** Grep

```bash
grep -n '@import "tailwindcss"\|@theme inline' web/src/app/globals.css
```

**PASS:** `@import "tailwindcss"` + `@theme inline` 블록 존재 (NOT `@tailwind` directives)
**FAIL:** 구버전 `@tailwind base/components/utilities` 사용
**수정:** Tailwind v4 형식으로 변환

### Step 2: CSS 변수 네이밍 일관성

**도구:** Grep

```bash
grep -n '\-\-color-' web/src/app/globals.css | head -30
```

**PASS:** CSS 변수가 `--color-{category}-{name}` 형식 (예: `--color-bg-primary`, `--color-text-on-dark`, `--color-gold`)
**FAIL:** 일관되지 않은 네이밍 (예: `--primary`, `--bg1`)
**수정:** 프로젝트 네이밍 규칙에 맞게 변경

### Step 3: CSS 변수 사용 패턴 확인

**도구:** Grep

프론트엔드에서 CSS 변수 직접 참조 확인:
```bash
grep -rn 'var(--color-' web/src/app/ web/src/components/ | head -20
```

**PASS:** `var(--color-...)` 형식으로 CSS 변수 사용 (하드코딩된 색상값 없음)
**FAIL:** 하드코딩된 색상값 (`#C9A227`, `#2b2219` 등) 직접 사용
**수정:** CSS 변수 참조로 변경

### Step 4: shadcn/ui Import 경로 일관성

**도구:** Grep

```bash
grep -rn "from '@/components/ui/" web/src/app/ | head -20
grep -rn "from '../../components/ui'" web/src/app/ | head -10
```

**PASS:** `@/components/ui/` 또는 `../../components/ui` 중 하나의 패턴으로 일관됨
**FAIL:** 같은 파일에서 두 가지 import 패턴 혼용
**수정:** 하나의 패턴으로 통일 (권장: `@/components/ui/`)

### Step 5: 한국어 텍스트 존재 확인

**도구:** Grep

주요 페이지에서 한국어 UI 텍스트 확인:
```bash
grep -c '[\uAC00-\uD7AF]' web/src/app/login/page.tsx web/src/app/counselors/page.tsx web/src/app/page.tsx
```

**PASS:** 모든 사용자 대면 페이지에 한국어 텍스트 존재
**FAIL:** 영어 텍스트가 사용자에게 노출
**수정:** 한국어로 번역

### Step 6: 빌드 검증

**도구:** Bash

```bash
cd web && npm run build 2>&1 | tail -5
```

**PASS:** 빌드 성공 (exit code 0)
**FAIL:** 빌드 에러 발생
**수정:** 에러 메시지에 따라 수정

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| Tailwind v4 설정 | PASS/FAIL | 형식: ... |
| CSS 변수 네이밍 | PASS/FAIL | 위반: ... |
| CSS 변수 사용 | PASS/FAIL | 하드코딩: ... |
| Import 경로 | PASS/FAIL | 혼용: ... |
| 한국어 텍스트 | PASS/FAIL | 누락: ... |
| 빌드 | PASS/FAIL | 에러: ... |

## Exceptions

1. **tailwind-merge + clsx**: `cn()` 유틸리티 내부에서의 클래스 병합은 정상 패턴
2. **shadcn/ui 기본 스타일**: shadcn/ui 컴포넌트 내부의 HSL 기반 기본 색상은 globals.css에서 오버라이드하는 것이 정상
3. **외부 라이브러리 스타일**: sendbird-calls 등 외부 라이브러리의 CSS는 프로젝트 디자인 토큰 미적용이 허용됨
