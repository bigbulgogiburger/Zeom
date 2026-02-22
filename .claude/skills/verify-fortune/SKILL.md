---
name: verify-fortune
description: 운세 엔진 도메인 무결성 검증. fortune 패키지 또는 운세 UI 변경 후 사용.
---

## Purpose

1. 운세 생성 알고리즘 (SHA-256 해시 기반 결정론적 점수) 무결성 검증
2. 백엔드-프론트엔드-Flutter 운세 API 매칭 검증
3. FortuneTexts 풀 완전성 (카테고리별 텍스트 누락 없음) 검증
4. 운세 데이터 모델 (점수 범위 1-100, 4개 카테고리) 일관성 검증

## When to Run

- `backend/.../fortune/` 패키지 파일 추가/변경 시
- `web/src/app/fortune/page.tsx` 또는 `web/src/components/fortune-card.tsx` 변경 시
- `app_flutter/lib/features/fortune/fortune_screen.dart` 변경 시
- 운세 관련 API 엔드포인트 변경 시
- FortuneTexts 메시지 풀 수정 시

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneController.java` | 운세 REST 엔드포인트 (/today, /summary, /history) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneService.java` | 운세 생성 로직 (SHA-256 해시, 결정론적 알고리즘) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneEntity.java` | 운세 엔티티 (fortunes 테이블) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneRepository.java` | 운세 JPA 레포지토리 |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneDtos.java` | 운세 DTO (FortuneResponse, FortuneSummaryResponse, FortuneHistoryResponse) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneTexts.java` | 운세 텍스트 풀 (100개 한국어 메시지, 럭키 아이템) |
| `backend/src/main/resources/db/migration/V53__fortune_tables.sql` | fortunes 테이블 마이그레이션 |
| `backend/src/test/java/com/cheonjiyeon/api/FortuneIntegrationTest.java` | 운세 통합 테스트 |
| `web/src/app/fortune/page.tsx` | 운세 상세 페이지 (SVG 게이지, 카테고리 카드) |
| `web/src/components/fortune-card.tsx` | 홈 화면 운세 카드 컴포넌트 (접이식) |
| `web/src/app/HomeContent.tsx` | 홈 화면 (FortuneCard 포함) |
| `app_flutter/lib/features/fortune/fortune_screen.dart` | Flutter 운세 화면 (커스텀 게이지 페인터) |
| `app_flutter/lib/features/home/home_screen.dart` | Flutter 홈 화면 (운세 카드 포함) |
| `app_flutter/lib/core/api_client.dart` | Flutter API 클라이언트 (getTodayFortune, getFortuneSummary) |

## Workflow

### Step 1: 운세 API 엔드포인트 존재 확인

**도구:** Grep

```bash
grep -n '@GetMapping' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneController.java
```

**PASS:** `/today`, `/summary`, `/history` 3개 엔드포인트 존재
**FAIL:** 엔드포인트 누락
**수정:** 누락된 엔드포인트 추가

### Step 2: 결정론적 알고리즘 검증

**도구:** Grep

```bash
grep -n 'SHA-256\|MessageDigest\|computeHash\|scoreFromHash' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneService.java
```

**PASS:** SHA-256 해시 사용, `userId + date` 시드로 결정론적 점수 생성
**FAIL:** 랜덤 함수 사용 (Math.random, Random 등)으로 비결정론적
**수정:** SHA-256 해시 기반 결정론적 알고리즘으로 변경

### Step 3: 점수 범위 검증

**도구:** Grep

```bash
grep -n 'scoreFromHash\|% 100\|+ 1' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneService.java
```

**PASS:** `(Math.abs(value) % 100) + 1` — 1~100 범위
**FAIL:** 0을 포함하거나 100을 초과하는 범위
**수정:** 범위 수식 수정

### Step 4: FortuneTexts 카테고리 완전성 확인

**도구:** Grep

```bash
grep -n 'case "overall"\|case "wealth"\|case "love"\|case "health"' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneTexts.java
grep -c 'LUCKY_COLORS\|LUCKY_NUMBERS\|LUCKY_DIRECTIONS' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneTexts.java
```

**PASS:** 4개 카테고리 (overall, wealth, love, health) + 3개 럭키 아이템 배열 존재
**FAIL:** 카테고리 또는 럭키 아이템 배열 누락
**수정:** 누락된 카테고리/배열 추가

### Step 5: 프론트엔드-백엔드 API 필드 매칭

**도구:** Grep

백엔드 DTO 필드:
```bash
grep -n 'overallScore\|wealthScore\|loveScore\|healthScore\|luckyColor\|luckyNumber\|luckyDirection' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneDtos.java
```

웹 프론트엔드 필드:
```bash
grep -n 'overallScore\|wealthScore\|loveScore\|healthScore\|luckyColor\|luckyNumber\|luckyDirection' web/src/app/fortune/page.tsx web/src/components/fortune-card.tsx
```

**PASS:** 백엔드 DTO 필드와 프론트엔드 사용 필드 일치
**FAIL:** 필드명 불일치
**수정:** 프론트엔드 필드명을 백엔드 DTO에 맞춤

### Step 6: Flutter 운세 API 매칭

**도구:** Grep

```bash
grep -n 'fortune\|Fortune' app_flutter/lib/core/api_client.dart
grep -n 'overallScore\|wealthScore\|loveScore\|healthScore' app_flutter/lib/features/fortune/fortune_screen.dart app_flutter/lib/features/home/home_screen.dart
```

**PASS:** Flutter API 메서드와 필드명이 백엔드와 일치
**FAIL:** Flutter에서 다른 필드명 사용
**수정:** 필드명 동기화

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| API 엔드포인트 | PASS/FAIL | 엔드포인트 수: ... |
| 결정론적 알고리즘 | PASS/FAIL | 해시 방식: ... |
| 점수 범위 | PASS/FAIL | 범위: ... |
| 텍스트 풀 완전성 | PASS/FAIL | 카테고리: ... |
| Web API 필드 매칭 | PASS/FAIL | 불일치: ... |
| Flutter API 매칭 | PASS/FAIL | 불일치: ... |

## Exceptions

1. **Mock 데이터 fallback**: 웹/Flutter에서 API 호출 실패 시 Mock 데이터로 fallback하는 것은 정상 (API 미구동 시 UI 테스트용)
2. **비로그인 운세 조회**: FortuneController에서 Authorization이 required=false인 것은 의도적 — 로그인하지 않은 사용자에게도 요약 운세 제공 가능
3. **럭키 아이템 종류 차이**: 프론트엔드에서 표시하는 럭키 아이템이 백엔드보다 적은 것은 허용 (UI 공간 제약)
