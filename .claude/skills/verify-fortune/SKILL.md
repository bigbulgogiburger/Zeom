---
name: verify-fortune
description: 운세 엔진 도메인 무결성 검증. fortune 패키지 또는 운세 UI 변경 후 사용.
---

## Purpose

1. 사주 기반 운세 엔진 (SajuCalculator, DailyFortuneCalculator) + SHA-256 폴백 무결성 검증
2. 사주팔자 산출 정확성 (년주/월주/일주/시주, 천간/지지/오행) 검증
3. 백엔드-프론트엔드-Flutter 운세/사주 API 매칭 검증
4. 운세 텍스트 풀 완전성 (6개 카테고리별 텍스트 누락 없음) 검증
5. 운세 데이터 모델 (점수 범위 1-100, 6개 카테고리, 사주 필드) 일관성 검증
6. 사주 명식(命式) 조회 API 및 UI 검증

## When to Run

- `backend/.../fortune/` 또는 `backend/.../fortune/saju/` 패키지 파일 추가/변경 시
- `web/src/app/fortune/page.tsx` 또는 `web/src/components/fortune-card.tsx` 변경 시
- `web/src/app/my-saju/` 페이지 변경 시
- `app_flutter/lib/features/fortune/` 파일 추가/변경 시
- 운세/사주 관련 API 엔드포인트 변경 시
- FortuneTexts 또는 SajuFortuneTexts 메시지 풀 수정 시

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneController.java` | 운세 REST 엔드포인트 (/today, /summary, /history) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneService.java` | 운세 생성 로직 (사주 기반 + SHA-256 폴백) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneEntity.java` | 운세 엔티티 (daily_fortunes 테이블, 사주 필드 포함) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneRepository.java` | 운세 JPA 레포지토리 |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneDtos.java` | 운세 DTO (FortuneResponse, SajuChartResponse, PillarDto 등) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneTexts.java` | 기존 운세 텍스트 풀 (SHA-256 폴백용) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/SajuController.java` | 사주 REST 엔드포인트 (/saju/my-chart, /saju/birth-info) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/SajuChartEntity.java` | 사주 명식 캐시 엔티티 (saju_charts 테이블) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/SajuChartRepository.java` | 사주 명식 JPA 레포지토리 |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/SajuCalculator.java` | 사주팔자 산출 엔진 (년주/월주/일주/시주) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/DailyFortuneCalculator.java` | 일일 운세 산출 (십성/12운성/합충 기반 점수) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/SajuFortuneTexts.java` | 사주 기반 운세 텍스트 템플릿 (200+개) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/CheonganEnum.java` | 천간 10개 Enum |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/JijiEnum.java` | 지지 12개 Enum |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/OhaengEnum.java` | 오행 5개 Enum |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/SipseongEnum.java` | 십성 10개 Enum |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/TwelveUnseongEnum.java` | 12운성 Enum |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/SajuPillar.java` | 기둥 1개 VO (천간+지지) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/SajuChart.java` | 사주 4기둥 VO |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/ManseryeokData.java` | 만세력 일주 조회 (60갑자 알고리즘) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/JeolgiData.java` | 24절기 경계 데이터 |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/saju/SolarLunarConverter.java` | 양력↔음력 변환 |
| `backend/src/main/resources/db/migration/V53__fortune_tables.sql` | daily_fortunes 테이블 생성 |
| `backend/src/main/resources/db/migration/V54__manseryeok_table.sql` | manseryeok 테이블 |
| `backend/src/main/resources/db/migration/V56__saju_charts_table.sql` | saju_charts 테이블 |
| `backend/src/main/resources/db/migration/V57__alter_daily_fortunes_add_saju_fields.sql` | daily_fortunes 사주 필드 확장 |
| `backend/src/test/java/com/cheonjiyeon/api/FortuneIntegrationTest.java` | 기존 운세 통합 테스트 |
| `backend/src/test/java/com/cheonjiyeon/api/SajuIntegrationTest.java` | 사주 엔진 통합 테스트 |
| `web/src/app/fortune/page.tsx` | 운세 상세 페이지 (사주 기반 + 오행 차트) |
| `web/src/components/fortune-card.tsx` | 홈 화면 운세 카드 컴포넌트 |
| `web/src/app/my-saju/page.tsx` | 사주 명식 조회 페이지 (4기둥 시각화) |
| `web/src/app/HomeContent.tsx` | 홈 화면 (FortuneCard 포함) |
| `app_flutter/lib/features/fortune/fortune_screen.dart` | Flutter 운세 화면 (사주 기반 + 오행 차트) |
| `app_flutter/lib/features/fortune/saju_chart_screen.dart` | Flutter 사주 명식 화면 |
| `app_flutter/lib/features/home/home_screen.dart` | Flutter 홈 화면 (운세 카드 포함) |
| `app_flutter/lib/core/api_client.dart` | Flutter API 클라이언트 (fortune + saju 메서드) |

## Workflow

### Step 1: 운세 API 엔드포인트 존재 확인

**도구:** Grep

```bash
grep -n '@GetMapping' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneController.java
```

**PASS:** `/today`, `/summary`, `/history` 3개 엔드포인트 존재
**FAIL:** 엔드포인트 누락
**수정:** 누락된 엔드포인트 추가

### Step 2: 사주 API 엔드포인트 존재 확인

**도구:** Grep

```bash
grep -n '@GetMapping\|@PutMapping' backend/src/main/java/com/cheonjiyeon/api/fortune/SajuController.java
```

**PASS:** `/api/v1/saju/my-chart` (GET), `/api/v1/saju/birth-info` (PUT) 존재
**FAIL:** 사주 엔드포인트 누락
**수정:** SajuController에 누락 엔드포인트 추가

### Step 3: 사주 엔진 핵심 컴포넌트 존재 확인

**도구:** Grep

```bash
grep -n 'calculateYearPillar\|calculateMonthPillar\|calculateDayPillar\|calculateHourPillar\|calculateChart' backend/src/main/java/com/cheonjiyeon/api/fortune/saju/SajuCalculator.java
```

**PASS:** 년주/월주/일주/시주 계산 메서드 + calculateChart 통합 메서드 존재
**FAIL:** 사주 산출 메서드 누락
**수정:** SajuCalculator에 누락 메서드 추가

### Step 4: 사주 Enum 완전성 확인

**도구:** Bash

```bash
ls backend/src/main/java/com/cheonjiyeon/api/fortune/saju/ | grep 'Enum.java'
```

**PASS:** CheonganEnum(10), JijiEnum(12), OhaengEnum(5), SipseongEnum(10), TwelveUnseongEnum(12) 5개 Enum 존재
**FAIL:** Enum 파일 누락
**수정:** 누락된 Enum 추가

### Step 5: 운세 폴백 로직 검증

**도구:** Grep

사주 정보 유무에 따른 분기 확인:
```bash
grep -n 'birthHour\|sajuChart\|fallback\|SHA-256\|computeHash' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneService.java
```

**PASS:** 사주 정보 있는 사용자 → DailyFortuneCalculator 사용, 없는 사용자 → SHA-256 폴백
**FAIL:** 폴백 분기 없이 단일 로직만 존재
**수정:** 사주 기반 + SHA-256 폴백 이중 로직 구현

### Step 6: DailyFortuneCalculator 점수 산출 검증

**도구:** Grep

```bash
grep -n 'sipseong\|unseong\|harmony\|clamp\|score' backend/src/main/java/com/cheonjiyeon/api/fortune/saju/DailyFortuneCalculator.java | head -20
```

**PASS:** 십성 관계 분석 + 12운성 가중치 + 합충 보정 + 1~100 범위 클램핑
**FAIL:** 점수 산출 로직 누락 또는 범위 초과
**수정:** PRD의 점수 공식 구현

### Step 7: 운세 텍스트 풀 완전성 확인 (6개 카테고리)

**도구:** Grep

기존 텍스트:
```bash
grep -n 'case "overall"\|case "wealth"\|case "love"\|case "health"' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneTexts.java
```

사주 텍스트:
```bash
grep -c 'overall\|wealth\|love\|health\|career\|study' backend/src/main/java/com/cheonjiyeon/api/fortune/saju/SajuFortuneTexts.java
```

**PASS:** 6개 카테고리 (overall, wealth, love, health, career, study) 텍스트 존재
**FAIL:** 카테고리 누락 (특히 신규 career/study)
**수정:** 누락된 카테고리 텍스트 추가

### Step 8: 프론트엔드-백엔드 API 필드 매칭

**도구:** Grep

백엔드 DTO 필드:
```bash
grep -n 'overallScore\|wealthScore\|loveScore\|healthScore\|careerScore\|studyScore\|luckyColor\|luckyNumber\|luckyDirection\|dailyPillar\|twelveUnseong\|sipseong' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneDtos.java
```

웹 프론트엔드 필드:
```bash
grep -n 'overallScore\|wealthScore\|loveScore\|healthScore\|careerScore\|studyScore\|dailyPillar\|counselorCta' web/src/app/fortune/page.tsx web/src/components/fortune-card.tsx
```

**PASS:** 백엔드 DTO 필드와 프론트엔드 사용 필드 일치 (기존 4개 + 신규 사주 필드)
**FAIL:** 필드명 불일치
**수정:** 프론트엔드 필드명을 백엔드 DTO에 맞춤

### Step 9: 사주 명식 페이지 존재 확인

**도구:** Bash

```bash
ls web/src/app/my-saju/page.tsx app_flutter/lib/features/fortune/saju_chart_screen.dart 2>/dev/null
```

**PASS:** 웹 `/my-saju` 페이지 + Flutter 사주 명식 화면 모두 존재
**FAIL:** 페이지 누락
**수정:** 누락된 페이지 생성

### Step 10: Flutter 운세/사주 API 매칭

**도구:** Grep

```bash
grep -n 'fortune\|Fortune\|saju\|Saju' app_flutter/lib/core/api_client.dart
grep -n 'overallScore\|wealthScore\|careerScore\|dailyPillar\|ohaeng' app_flutter/lib/features/fortune/fortune_screen.dart app_flutter/lib/features/fortune/saju_chart_screen.dart
```

**PASS:** Flutter API 메서드 (getTodayFortune, getSajuChart, updateBirthInfo)와 필드명이 백엔드와 일치
**FAIL:** Flutter에서 다른 필드명 사용 또는 API 메서드 누락
**수정:** 필드명/메서드 동기화

### Step 11: FortuneEntity 사주 필드 매칭

**도구:** Grep

Entity 필드:
```bash
grep -n 'dailyGanIndex\|dailyJiIndex\|twelveUnseong\|sipseong\|harmonyType\|careerScore\|careerText\|studyScore\|studyText\|luckyTime\|warningTime\|sajuInsight\|counselorCtaMessage' backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneEntity.java
```

마이그레이션 컬럼:
```bash
grep -n 'daily_gan_index\|daily_ji_index\|twelve_unseong\|sipseong\|harmony_type\|career_score\|career_text\|study_score\|study_text\|lucky_time\|warning_time\|saju_insight\|counselor_cta_message' backend/src/main/resources/db/migration/V57__alter_daily_fortunes_add_saju_fields.sql
```

**PASS:** Entity 필드와 마이그레이션 컬럼이 1:1 대응
**FAIL:** Entity에 있으나 마이그레이션에 없는 필드 (또는 그 반대)
**수정:** Entity↔마이그레이션 동기화

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| 운세 API 엔드포인트 | PASS/FAIL | 엔드포인트 수: ... |
| 사주 API 엔드포인트 | PASS/FAIL | 엔드포인트 수: ... |
| 사주 엔진 컴포넌트 | PASS/FAIL | 메서드: ... |
| 사주 Enum 완전성 | PASS/FAIL | Enum 수: ... |
| 폴백 로직 | PASS/FAIL | 분기: ... |
| 점수 산출 | PASS/FAIL | 공식: ... |
| 텍스트 풀 완전성 | PASS/FAIL | 카테고리: 6개 |
| Web API 필드 매칭 | PASS/FAIL | 불일치: ... |
| 사주 명식 페이지 | PASS/FAIL | 플랫폼: web/flutter |
| Flutter API 매칭 | PASS/FAIL | 불일치: ... |
| Entity-Migration 매칭 | PASS/FAIL | 사주 필드: ... |

## Exceptions

1. **Mock 데이터 fallback**: 웹/Flutter에서 API 호출 실패 시 Mock 데이터로 fallback하는 것은 정상 (API 미구동 시 UI 테스트용)
2. **비로그인 운세 조회**: FortuneController에서 Authorization이 required=false인 것은 의도적 — 로그인하지 않은 사용자에게도 요약 운세 제공 가능
3. **럭키 아이템 종류 차이**: 프론트엔드에서 표시하는 럭키 아이템이 백엔드보다 적은 것은 허용 (UI 공간 제약)
4. **SHA-256 폴백 모드**: 사주 정보 미입력 사용자에게 기존 SHA-256 해시 기반 운세 제공은 의도적 설계 (점진적 마이그레이션)
5. **시주 미입력**: birthHour="unknown"인 경우 시주 없이 삼주(三柱) 기반 해석은 정상 — "모름" 옵션 허용
6. **만세력 알고리즘 근사치**: ManseryeokData의 60갑자 순환 알고리즘은 DB 만세력과 미세한 차이가 있을 수 있으나, 일주 산출의 결정론적 일관성이 보장되면 허용
