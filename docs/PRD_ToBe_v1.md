# PRD: 천지연꽃신당 To-Be 로드맵 v1.0

> **Product**: 천지연꽃신당 — 온라인 점사/상담 예약 플랫폼
> **Author**: Product Planning Team
> **Created**: 2026-02-18
> **Status**: Draft
> **Version**: 1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [As-Is 현황 분석](#2-as-is-현황-분석)
3. [Gap Analysis — 영역별 부족 사항](#3-gap-analysis--영역별-부족-사항)
4. [To-Be 요구사항 (Epics)](#4-to-be-요구사항-epics)
5. [Epic 상세 — User Stories & Acceptance Criteria](#5-epic-상세--user-stories--acceptance-criteria)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Priority Matrix & Sprint Roadmap](#7-priority-matrix--sprint-roadmap)
8. [Success Metrics (KPIs)](#8-success-metrics-kpis)
9. [Risks & Mitigations](#9-risks--mitigations)
10. [Out of Scope](#10-out-of-scope)

---

## 1. Executive Summary

천지연꽃신당은 한국 전통 점사/상담 플랫폼으로, 고객이 상담사를 탐색하고 예약·결제·화상상담·리뷰를 수행하는 풀스택 서비스이다.

**현재 상태**: 핵심 비즈니스 로직(예약→결제→화상상담→정산)이 구현되어 있으나, **프로덕션 런칭에 필수적인 UX 완성도, 운영 안정성, 사업 확장성 측면에서 상당한 개선이 필요**하다.

**이 PRD의 목적**: As-Is를 정밀 분석하고, 프로덕션 런칭 및 이후 성장 단계까지의 To-Be 요구사항을 Epic 단위로 정의한다.

### As-Is 점수표

| 영역 | 완성도 | 평가 |
|------|--------|------|
| 인증/회원 | 70% | 로그인/회원가입 있으나 비밀번호 찾기, 소셜 로그인, 프로필 편집 없음 |
| 예약/결제 | 85% | 핵심 플로우 완성, 결제 실패 복구·영수증 없음 |
| 화상상담 | 80% | Sendbird 기반 동작, 대기실·녹화·품질 모니터링 없음 |
| 상담사 포털 | 75% | 기본 관리 가능, 수익 분석·캘린더 연동 없음 |
| 어드민 | 55% | 대시보드·감사로그만, 유저관리·분쟁처리·환불승인 없음 |
| 알림 | 20% | 결제 알림 1종만, 나머지 전무 |
| 정산 | 60% | 계산 로직 완성, 실제 지급 메커니즘 없음 |
| SEO/마케팅 | 10% | 메타 태그 기본만, OG/스키마/사이트맵 없음 |
| 모니터링/분석 | 15% | 감사 로그만, GA·퍼널·성능 메트릭 없음 |
| 접근성(a11y) | 25% | lang="ko" 설정, ARIA/키보드 내비게이션 미흡 |

---

## 2. As-Is 현황 분석

### 2.1 기술 스택

| Layer | Technology | Status |
|-------|-----------|--------|
| Backend | Spring Boot 3.5, Java 21, Gradle | Stable |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind v4, shadcn/ui | Stable |
| Mobile | Flutter (iOS/Android) | Feature Complete |
| Database | H2 (dev) / MySQL (prod), Flyway | 30 migrations |
| Cache/Lock | Redis | 설정만 존재, 캐싱 미적용 |
| Video/Chat | Sendbird Calls SDK + Chat SDK | Direct Call 모델 |
| Payment | PortOne (구 아임포트) | 카드 결제 지원 |
| CI/CD | GitHub Actions | 테스트→빌드→배포 파이프라인 |

### 2.2 구현된 핵심 기능 (46개 페이지, 58+ API 엔드포인트)

**고객 플로우**:
- 회원가입 (3단계 폼) → 로그인 → 상담사 탐색 → 슬롯 선택 → 결제 → 화상상담 → 리뷰

**상담사 포털**:
- 프로필 관리, 스케줄 관리, 예약 확인, 고객 관리, 상담 기록/메모, 리뷰 확인/답글, 정산 조회

**어드민**:
- 대시보드 (KPI), 감사 로그, 타임라인, 정산 관리

### 2.3 테스트 커버리지

| Type | Count | Status |
|------|-------|--------|
| Backend Integration | 19 classes | @SpringBootTest + H2 |
| Frontend Unit | 48+ tests | Jest + RTL |
| E2E | 14 specs | Playwright (Chromium) |
| Flutter | Widget + Unit | 기본 커버리지 |
| Load Test | 0 | 미구현 |

---

## 3. Gap Analysis — 영역별 부족 사항

### 3.1 🔴 CRITICAL (런칭 차단)

| # | 영역 | Gap | 영향도 |
|---|------|-----|--------|
| C-1 | 인증 | **비밀번호 찾기/재설정 플로우 없음** | 비밀번호 분실 시 계정 접근 불가, CS 폭주 |
| C-2 | 알림 | **알림 시스템 미비** (1종만 존재) | 예약 확인, 상담 리마인더, 환불 결과 등 필수 알림 전무 |
| C-3 | 정산 | **실제 지급 메커니즘 없음** | 상담사에게 수익 정산 불가 → 사업 운영 불가 |
| C-4 | 스케줄러 | **PaymentRetryScheduler 미구현** (스텁) | 결제 후 채팅방 생성 실패 시 자동 재시도 없음 → 예약 교착 |
| C-5 | 분쟁 | **분쟁 처리 워크플로우 없음** (CRUD만) | 고객 분쟁 해결 불가, 법적 리스크 |
| C-6 | 어드민 | **유저/상담사 관리 기능 없음** | 문제 계정 차단, 신규 상담사 승인 불가 |
| C-7 | 결제 | **결제 실패 복구 경로 없음** | 결제 실패 후 사용자가 재시도할 UI 경로 없음 |

### 3.2 🟠 HIGH (런칭 후 1개월 내 필수)

| # | 영역 | Gap | 영향도 |
|---|------|-----|--------|
| H-1 | 프로필 | **사용자 프로필 편집 없음** | 이름/전화번호/비밀번호 변경 불가 |
| H-2 | 리뷰 | **리뷰 모더레이션 없음** | 부적절 리뷰 관리 불가 |
| H-3 | 환불 | **환불-정산 상호작용 미구현** | 환불 승인 후 상담사 정산에 반영 안 됨 → 이중 지급 위험 |
| H-4 | 캐싱 | **캐싱 전략 미적용** | Redis 설정만 있고 @Cacheable 없음 → 불필요한 DB 부하 |
| H-5 | 검색 | **상담사 목록 페이지네이션 없음** | 상담사 증가 시 성능 저하 |
| H-6 | SEO | **OG 태그, 사이트맵, robots.txt 없음** | 검색 유입 불가, 소셜 공유 시 미리보기 없음 |
| H-7 | 보안 | **이메일 인증 없음** | 가짜 계정 대량 생성 가능 |
| H-8 | 결제 | **영수증/거래명세서 없음** | 세금계산서, 결제 증빙 제공 불가 |
| H-9 | 상담사 | **상담사 검증/승인 워크플로우 없음** | 무자격 상담사 등록 가능 |
| H-10 | 화상상담 | **모바일 웹 화상통화 최적화 없음** | 모바일 사용자 경험 저하 |

### 3.3 🟡 MEDIUM (런칭 후 3개월 내)

| # | 영역 | Gap |
|---|------|-----|
| M-1 | 소셜 로그인 | 카카오/네이버/구글 OAuth 미지원 |
| M-2 | 실시간 알림 | WebSocket/SSE 없음 (폴링만) |
| M-3 | 예약 변경 | 예약 일정 변경/취소 사유 수집 없음 |
| M-4 | 대기실 | 화상상담 진입 전 대기실 UX 없음 |
| M-5 | 분석/GA | Google Analytics, 퍼널 분석, 이벤트 트래킹 없음 |
| M-6 | 접근성 | WCAG 2.1 AA 미준수 (ARIA, 키보드 내비게이션, 포커스 관리) |
| M-7 | 쿠폰/프로모션 | 할인 쿠폰, 첫 상담 무료 등 마케팅 도구 없음 |
| M-8 | 관심 상담사 | 즐겨찾기/찜 기능 없음 |
| M-9 | 추가 결제수단 | 카카오페이, 네이버페이, 토스페이, 계좌이체 미지원 |
| M-10 | 부하 테스트 | 동시 접속 시나리오 테스트 없음 |

### 3.4 🟢 LOW (런칭 후 6개월 내)

| # | 영역 | Gap |
|---|------|-----|
| L-1 | 다국어(i18n) | 한국어 전용, 영어/중국어/일본어 미지원 |
| L-2 | 상담 녹화 | 상담 녹화/녹음 기능 없음 |
| L-3 | AI 상담 보조 | AI 기반 상담 요약, 키워드 추출 없음 |
| L-4 | 캘린더 연동 | Google Calendar, 네이버 캘린더 연동 없음 |
| L-5 | 앱 푸시 알림 | Flutter 앱 FCM/APNs 미구현 |
| L-6 | 세금 서류 | 사업자용 세금계산서 자동 발행 없음 |
| L-7 | A/B 테스트 | 기능 플래그, 실험 인프라 없음 |
| L-8 | 추천 시스템 | 사용자 기반 상담사 추천 없음 |

---

## 4. To-Be 요구사항 (Epics)

총 **12개 Epic**, 우선순위 기반 4개 Sprint으로 구성.

| Epic | 명칭 | Priority | Sprint |
|------|------|----------|--------|
| E-01 | 인증 고도화 | 🔴 CRITICAL | Sprint 1 |
| E-02 | 통합 알림 시스템 | 🔴 CRITICAL | Sprint 1 |
| E-03 | 정산 지급 시스템 | 🔴 CRITICAL | Sprint 1 |
| E-04 | 어드민 운영 도구 | 🔴 CRITICAL | Sprint 1 |
| E-05 | 사용자 경험 완성 | 🟠 HIGH | Sprint 2 |
| E-06 | 결제 고도화 | 🟠 HIGH | Sprint 2 |
| E-07 | SEO & 마케팅 인프라 | 🟠 HIGH | Sprint 2 |
| E-08 | 화상상담 고도화 | 🟡 MEDIUM | Sprint 3 |
| E-09 | 분석 & 모니터링 | 🟡 MEDIUM | Sprint 3 |
| E-10 | 마케팅 도구 | 🟡 MEDIUM | Sprint 3 |
| E-11 | 플랫폼 확장 | 🟢 LOW | Sprint 4 |
| E-12 | 성능 & 안정성 | 🟢 LOW | Sprint 4 |

---

## 5. Epic 상세 — User Stories & Acceptance Criteria

---

### Epic E-01: 인증 고도화

**목적**: 사용자 계정 보안을 강화하고, 가입·로그인 편의성을 높여 전환율을 개선한다.

#### US-01-01: 비밀번호 찾기/재설정

> **As a** 비밀번호를 잊은 사용자
> **I want** 이메일을 통해 비밀번호를 재설정할 수 있기를
> **So that** 계정 접근 권한을 다시 얻을 수 있다

**Acceptance Criteria**:
1. 로그인 페이지에 "비밀번호를 잊으셨나요?" 링크 노출
2. 이메일 입력 → 재설정 링크 발송 (유효기간: 30분)
3. 재설정 링크 클릭 → 새 비밀번호 입력 폼 표시
4. 비밀번호 변경 완료 시 기존 모든 세션 무효화
5. 등록되지 않은 이메일 입력 시에도 "발송했습니다" 응답 (이메일 열거 방지)
6. 재설정 링크는 1회 사용 후 만료

**Technical Notes**:
- Backend: `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
- 이메일 발송: SMTP 또는 AWS SES 연동 필요
- Token: UUID + SHA-256 해시 저장, 30분 TTL
- DB: `password_reset_tokens` 테이블 신규 생성

#### US-01-02: 이메일 인증

> **As a** 플랫폼 운영자
> **I want** 가입 시 이메일 소유권을 확인하기를
> **So that** 가짜 계정 생성을 방지하고 알림 전달을 보장할 수 있다

**Acceptance Criteria**:
1. 회원가입 완료 시 인증 이메일 발송
2. "이메일을 확인해주세요" 화면 표시 (재발송 버튼 포함)
3. 인증 완료 전까지 예약/결제 기능 제한
4. 인증 링크 유효기간: 24시간
5. 인증 완료 시 자동 로그인 처리

**Technical Notes**:
- DB: `users` 테이블에 `email_verified BOOLEAN DEFAULT FALSE`, `email_verification_token VARCHAR(255)` 추가
- Flyway migration: V31

#### US-01-03: 소셜 로그인 (카카오/네이버)

> **As a** 신규 가입자
> **I want** 카카오 또는 네이버 계정으로 바로 가입/로그인하기를
> **So that** 비밀번호를 새로 만들지 않아도 된다

**Acceptance Criteria**:
1. 로그인/회원가입 페이지에 "카카오로 시작하기", "네이버로 시작하기" 버튼 노출
2. OAuth 2.0 플로우 → 소셜 계정 이메일로 자동 매핑
3. 기존 이메일 계정과 소셜 계정 연동 지원
4. 소셜 로그인 사용자도 프로필 정보(이름, 전화번호) 최초 1회 입력 필요
5. 소셜 계정 연동 해제 시 비밀번호 설정 필수

**Technical Notes**:
- Spring Security OAuth2 Client 활용
- DB: `social_accounts` 테이블 (user_id, provider, provider_user_id, access_token)
- Kakao Dev Console + Naver Developers 앱 등록 필요

#### US-01-04: 사용자 프로필 관리

> **As a** 등록된 사용자
> **I want** 내 프로필(이름, 전화번호, 비밀번호)을 편집하기를
> **So that** 최신 정보를 유지하고 보안을 관리할 수 있다

**Acceptance Criteria**:
1. 메인 네비게이션에 "마이페이지" 메뉴 추가
2. 프로필 편집: 이름, 전화번호, 생년월일 변경
3. 비밀번호 변경: 현재 비밀번호 확인 후 새 비밀번호 설정
4. 프로필 이미지 업로드 (5MB 이하, JPG/PNG)
5. 계정 탈퇴: 사유 선택 → 확인 → 30일 유예기간 후 영구 삭제

**Technical Notes**:
- Frontend: `/mypage`, `/mypage/edit`, `/mypage/password`, `/mypage/delete`
- Backend: `PUT /api/v1/users/me`, `PUT /api/v1/auth/change-password`, `DELETE /api/v1/users/me`
- 이미지 저장: S3 또는 Cloudflare R2

---

### Epic E-02: 통합 알림 시스템

**목적**: 사용자·상담사에게 핵심 이벤트를 실시간으로 전달하여 노쇼율을 줄이고 플랫폼 신뢰를 높인다.

#### US-02-01: 이메일 알림

> **As a** 예약한 고객
> **I want** 예약 확인, 상담 리마인더, 환불 결과를 이메일로 받기를
> **So that** 중요한 일정과 처리 결과를 놓치지 않는다

**Acceptance Criteria**:

| 이벤트 | 수신자 | 발송 시점 |
|--------|--------|-----------|
| 예약 확인 | 고객 + 상담사 | 결제 완료 즉시 |
| 상담 리마인더 | 고객 + 상담사 | 상담 시작 1시간 전, 10분 전 |
| 상담 완료 | 고객 | 상담 종료 즉시 (리뷰 요청 포함) |
| 환불 요청 접수 | 고객 | 환불 요청 즉시 |
| 환불 처리 완료 | 고객 | 승인/거절 시 |
| 정산 완료 | 상담사 | 정산 지급 시 |
| 리뷰 알림 | 상담사 | 새 리뷰 등록 시 |
| 신규 예약 | 상담사 | 예약 생성 시 |

1. 이메일 템플릿: 브랜드 디자인 (금색+크림) 반영
2. 사용자별 알림 설정(Opt-in/Opt-out) 페이지 제공
3. 발송 실패 시 3회 재시도 (지수 백오프)
4. 발송 이력 저장 (status: SENT, FAILED, BOUNCED)

**Technical Notes**:
- 이메일 서비스: AWS SES 또는 Mailgun
- DB: `notification_logs` 테이블 (user_id, type, channel, status, sent_at)
- DB: `notification_preferences` 테이블 (user_id, type, email_enabled, sms_enabled, push_enabled)
- 리마인더: Scheduler cron job (1시간 전, 10분 전 발송)

#### US-02-02: SMS 알림

> **As a** 예약한 고객
> **I want** 상담 리마인더를 SMS로 받기를
> **So that** 이메일을 확인하지 못해도 일정을 잊지 않는다

**Acceptance Criteria**:
1. SMS 발송: 예약 확인, 상담 리마인더 (10분 전)
2. 알리고(Aligo) 또는 NHN Cloud SMS API 연동
3. 발송 비용: 건당 추적, 월별 집계
4. Opt-in 전용 (사용자 동의 필수, 개인정보보호법 준수)

#### US-02-03: 인앱 알림 센터

> **As a** 사용자
> **I want** 앱 내에서 모든 알림을 한곳에서 확인하기를
> **So that** 이메일/SMS 없이도 중요 이벤트를 확인할 수 있다

**Acceptance Criteria**:
1. 헤더에 벨 아이콘 + 읽지 않은 알림 개수 뱃지
2. 알림 목록: 최신순, 읽음/미읽음 구분
3. 알림 클릭 시 해당 페이지로 이동 (예: 예약 상세, 환불 상태)
4. "모두 읽음" 처리 기능
5. 알림 보관 기간: 90일

**Technical Notes**:
- Backend: `GET /api/v1/notifications`, `PUT /api/v1/notifications/{id}/read`, `PUT /api/v1/notifications/read-all`
- DB: `notifications` 테이블 (id, user_id, type, title, body, link, is_read, created_at)
- 실시간 업데이트: Server-Sent Events (SSE) — `/api/v1/notifications/stream`

---

### Epic E-03: 정산 지급 시스템

**목적**: 상담사에게 실제 수익을 지급하는 체계를 구축하여 사업 운영의 핵심 루프를 완성한다.

#### US-03-01: 상담사 계좌 등록

> **As a** 상담사
> **I want** 정산 수령 계좌를 등록하기를
> **So that** 수익금을 은행 계좌로 받을 수 있다

**Acceptance Criteria**:
1. 상담사 포털 > 정산 페이지에 "계좌 등록" 섹션
2. 은행 선택, 계좌번호, 예금주명 입력
3. 계좌 실명 확인 API 연동 (선택사항, 오픈뱅킹 또는 FinPay)
4. 등록된 계좌 마스킹 표시 (예: 신한 ***-***-1234)
5. 계좌 변경 시 기존 계좌 이력 보관

**Technical Notes**:
- DB: `counselor_bank_accounts` 테이블 (counselor_id, bank_code, account_number_encrypted, holder_name, is_primary, created_at)
- 계좌번호 암호화: AES-256
- Flyway migration: V32

#### US-03-02: 정산 승인 및 지급 워크플로우

> **As a** 어드민
> **I want** 상담사의 정산 요청을 검토하고 실제 지급 처리하기를
> **So that** 정확한 금액이 적시에 지급된다

**Acceptance Criteria**:
1. 어드민 > 정산 관리에서 REQUESTED 상태 건 목록 표시
2. 개별/일괄 승인(CONFIRMED) 처리
3. 지급 실행(PAID): 은행 이체 API 연동 또는 수동 확인 후 상태 변경
4. 지급 완료 시 상담사에게 이메일/인앱 알림 발송
5. 정산 명세서 PDF 다운로드
6. 월별 정산 집계 리포트

**Technical Notes**:
- 은행 이체: Toss Payments 자동이체 API 또는 수동 처리 + 상태 변경
- PDF: 서버사이드 PDF 생성 (iText 또는 Flying Saucer)
- 정산 주기: 월 2회 (1일, 16일) 자동 정산 Batch

#### US-03-03: 환불-정산 상호작용

> **As a** 시스템
> **I want** 환불 승인 시 해당 세션의 정산 금액을 자동 조정하기를
> **So that** 상담사에게 이중 지급되지 않는다

**Acceptance Criteria**:
1. 환불 승인 시 관련 `settlement_transactions`의 `counselor_earning` 차감
2. 이미 지급된 정산은 다음 정산에서 상계 처리
3. 환불 사유별 정산 처리 규칙:
   - 고객 귀책 취소: 정산 유지 (수수료 차감)
   - 상담사 귀책 취소: 전액 환수
   - 네트워크 장애: 비례 환산
4. 감사 로그에 정산 조정 내역 기록

---

### Epic E-04: 어드민 운영 도구

**목적**: 플랫폼 운영에 필요한 관리 기능을 제공하여 자율 운영이 가능하게 한다.

#### US-04-01: 사용자 관리

> **As a** 어드민
> **I want** 전체 사용자 목록을 조회하고 계정을 관리하기를
> **So that** 문제 계정을 차단하고 고객 지원을 제공할 수 있다

**Acceptance Criteria**:
1. 사용자 목록: 이름, 이메일, 가입일, 상태, 최근 로그인
2. 검색: 이름 또는 이메일로 검색
3. 필터: 상태(활성/정지/탈퇴), 역할(USER/COUNSELOR/ADMIN)
4. 계정 정지: 사유 입력 → 즉시 모든 세션 무효화
5. 계정 정지 해제
6. 강제 비밀번호 재설정 트리거
7. 페이지네이션: 20건/페이지

**Technical Notes**:
- Frontend: `/admin/users`, `/admin/users/[id]`
- Backend: `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}/suspend`, `PUT /api/v1/admin/users/{id}/unsuspend`

#### US-04-02: 상담사 승인 워크플로우

> **As a** 어드민
> **I want** 신규 상담사 등록 시 서류를 검토하고 승인/거절하기를
> **So that** 검증된 상담사만 플랫폼에서 활동할 수 있다

**Acceptance Criteria**:
1. 상담사 등록 신청 폼: 자기소개, 전문 분야, 경력, 자격증 사본 업로드
2. 어드민 > 상담사 승인 대기 목록
3. 서류 검토 후 승인/거절 (거절 시 사유 필수)
4. 승인 완료 시 상담사 포털 접근 활성화 + 알림 발송
5. 승인 상태: PENDING → APPROVED / REJECTED

**Technical Notes**:
- DB: `counselor_applications` 테이블 (user_id, specialty, experience, intro, certificates_url, status, admin_note, reviewed_at)
- 파일 업로드: S3 Presigned URL

#### US-04-03: 분쟁 처리 워크플로우

> **As a** 어드민
> **I want** 고객의 분쟁을 검토하고 중재 결정을 내리기를
> **So that** 공정한 분쟁 해결이 이루어진다

**Acceptance Criteria**:
1. 분쟁 목록: 상태(OPEN, IN_REVIEW, RESOLVED, CLOSED), 카테고리, 접수일
2. 분쟁 상세: 고객 주장, 상담사 측 입장, 관련 예약/결제 정보 한눈에 표시
3. 상태 전이: OPEN → IN_REVIEW → RESOLVED/CLOSED
4. 중재 결정: 환불, 크레딧 보상, 상담사 경고, 기각 중 선택
5. 결정 시 양 당사자에게 알림 발송
6. 분쟁 이력 감사 로그 기록

**Technical Notes**:
- Frontend: `/admin/disputes`, `/admin/disputes/[id]`
- Backend: `GET /api/v1/admin/disputes`, `PUT /api/v1/admin/disputes/{id}/review`, `PUT /api/v1/admin/disputes/{id}/resolve`
- DB: `disputes` 테이블에 `resolution_type`, `resolution_note`, `resolved_by`, `resolved_at` 컬럼 추가

#### US-04-04: 환불 승인 관리

> **As a** 어드민
> **I want** 환불 요청을 검토하고 승인/거절하기를
> **So that** 정당한 환불을 신속히 처리하고 부당 요청을 거절할 수 있다

**Acceptance Criteria**:
1. 환불 대기 목록: 요청일, 금액, 사유, 관련 예약 정보
2. 환불 상세: 결제 정보, 상담 기록, 리뷰 여부 표시
3. 승인: 지갑 크레딧 즉시 복원 + 알림 발송
4. 거절: 사유 필수 입력 + 알림 발송
5. SLA 표시: 접수 후 경과 시간 (3영업일 초과 시 적색 하이라이트)

**Technical Notes**:
- Frontend: `/admin/refunds`
- 기존 Backend API 활용: `POST /api/v1/admin/refunds/{id}/approve`, `POST /api/v1/admin/refunds/{id}/reject`

#### US-04-05: 리뷰 모더레이션

> **As a** 어드민
> **I want** 부적절한 리뷰를 신고받아 검토하고 숨김/삭제하기를
> **So that** 건전한 리뷰 생태계를 유지한다

**Acceptance Criteria**:
1. 신고된 리뷰 목록 표시
2. 리뷰 상세: 원문, 신고 사유, 신고자 정보
3. 액션: 유지, 숨김, 삭제 선택
4. 삭제 시 리뷰어에게 알림 + 상담사 평점 재계산

**Technical Notes**:
- DB: `reviews` 테이블에 `moderation_status` (ACTIVE, HIDDEN, DELETED), `reported_count` 추가
- Backend: `POST /api/v1/reviews/{id}/report`, `PUT /api/v1/admin/reviews/{id}/moderate`

---

### Epic E-05: 사용자 경험 완성

**목적**: 기존 플로우의 UX 빈틈을 메워 전환율과 만족도를 높인다.

#### US-05-01: 결제 실패 복구

> **As a** 결제가 실패한 고객
> **I want** 결제를 다시 시도하거나 다른 결제 수단을 선택하기를
> **So that** 예약을 포기하지 않아도 된다

**Acceptance Criteria**:
1. 결제 실패 시 "다시 시도" 버튼 + "다른 결제 수단" 옵션 표시
2. 실패 사유 표시 (카드 한도 초과, 카드사 거절 등)
3. 3회 실패 시 "고객센터 문의" 안내
4. 실패한 예약은 30분간 슬롯 유지 후 자동 취소

#### US-05-02: 예약 변경/취소 개선

> **As a** 예약한 고객
> **I want** 예약 일정을 변경하거나 취소 사유를 선택하기를
> **So that** 유연하게 일정을 조정할 수 있다

**Acceptance Criteria**:
1. 예약 변경: 같은 상담사의 다른 가용 슬롯으로 변경 (상담 24시간 전까지)
2. 취소 사유 수집: 드롭다운 (일정 변경, 개인 사정, 다른 상담사, 기타)
3. 취소 정책 안내: 24시간 전 무료, 12시간 전 50%, 당일 환불 불가
4. 변경/취소 확인 모달 표시

#### US-05-03: 즐겨찾기 상담사

> **As a** 고객
> **I want** 마음에 드는 상담사를 즐겨찾기에 저장하기를
> **So that** 다음 예약 시 빠르게 찾을 수 있다

**Acceptance Criteria**:
1. 상담사 카드/상세 페이지에 하트 아이콘
2. 마이페이지 > "즐겨찾기 상담사" 목록
3. 즐겨찾기 상담사의 새 슬롯 오픈 시 알림 (선택적)

**Technical Notes**:
- DB: `favorite_counselors` 테이블 (user_id, counselor_id, created_at)

#### US-05-04: 빈 상태/에러 상태 통일

> **As a** 사용자
> **I want** 데이터가 없거나 오류가 발생했을 때 명확한 안내와 액션을 보기를
> **So that** 무엇을 해야 할지 혼란스럽지 않다

**Acceptance Criteria**:
1. 모든 목록 페이지에 일관된 빈 상태 (Empty State) 컴포넌트:
   - 일러스트 또는 이모지
   - 설명 메시지
   - CTA 버튼 (예: "상담사 둘러보기", "첫 충전하기")
2. 에러 상태에 "다시 시도" 버튼 일관 적용
3. 네트워크 오류 시 "인터넷 연결을 확인해주세요" 메시지
4. 로딩 스켈레톤 패턴 통일 (현재 페이지마다 다름)

---

### Epic E-06: 결제 고도화

**목적**: 결제 전환율을 높이고 거래의 투명성과 신뢰를 강화한다.

#### US-06-01: 추가 결제 수단

> **As a** 고객
> **I want** 카카오페이, 토스페이, 계좌이체로도 결제하기를
> **So that** 선호하는 결제 수단을 사용할 수 있다

**Acceptance Criteria**:
1. PortOne V2 다중 PG 연동: 카카오페이, 토스페이, 네이버페이
2. 계좌이체 (가상계좌) 지원
3. 결제 수단 선택 UI: 아이콘 + 이름 리스트
4. 각 PG별 결제 상태 매핑

#### US-06-02: 영수증 및 거래명세서

> **As a** 결제한 고객
> **I want** 결제 영수증을 확인하고 다운로드하기를
> **So that** 지출 증빙으로 사용할 수 있다

**Acceptance Criteria**:
1. 결제 완료 시 영수증 이메일 자동 발송
2. 지갑 > 거래내역에서 영수증 PDF 다운로드
3. 영수증 내용: 결제일, 금액, 결제수단, 상품명, 사업자 정보
4. 사업자: 세금계산서 발행 요청 버튼 (이메일로 요청)

#### US-06-03: 거래 필터링

> **As a** 고객
> **I want** 지갑 거래내역을 유형별, 기간별로 필터링하기를
> **So that** 원하는 거래를 쉽게 찾을 수 있다

**Acceptance Criteria**:
1. 유형 필터: 전체, 충전, 사용, 환불
2. 기간 필터: 1주, 1개월, 3개월, 직접입력
3. 필터 적용 시 합계 금액 표시
4. CSV 내보내기

---

### Epic E-07: SEO & 마케팅 인프라

**목적**: 검색 엔진 유입을 확보하고 소셜 공유 시 브랜드 노출을 극대화한다.

#### US-07-01: 기술적 SEO

> **As a** 플랫폼 운영자
> **I want** 검색엔진이 사이트를 효과적으로 크롤링하기를
> **So that** 네이버/구글 검색 결과에 노출된다

**Acceptance Criteria**:
1. `robots.txt`: 크롤링 허용 범위 정의 (auth 페이지 제외)
2. `sitemap.xml`: 정적 페이지 + 상담사 프로필 동적 생성
3. 페이지별 고유 `<title>`, `<meta description>`
4. Open Graph 태그: 페이지별 og:title, og:description, og:image
5. JSON-LD 스키마: Organization, ProfessionalService (상담사별)
6. 상담사 상세 페이지: 이름, 전문 분야, 별점이 검색 결과에 표시되도록 구조화 데이터
7. `next/head`의 `canonical` 태그

**Technical Notes**:
- Next.js `generateMetadata()` 활용
- 상담사 페이지 SSG/ISR 적용 (revalidate: 3600)

#### US-07-02: 블로그/콘텐츠 허브

> **As a** 잠재 고객
> **I want** 운세, 타로, 사주 관련 콘텐츠를 읽기를
> **So that** 플랫폼의 전문성을 확인하고 상담을 결정할 수 있다

**Acceptance Criteria**:
1. `/blog` 페이지: 카테고리별 콘텐츠 목록 (사주, 타로, 꿈해몽 등)
2. 마크다운 기반 콘텐츠 관리 (또는 Headless CMS 연동)
3. 각 글에 관련 상담사 프로필 링크 (상담 전환 유도)
4. SEO 최적화된 URL 구조: `/blog/{category}/{slug}`

---

### Epic E-08: 화상상담 고도화

**목적**: 상담 품질과 안정성을 높여 고객 만족도와 재예약률을 개선한다.

#### US-08-01: 대기실 (Waiting Room)

> **As a** 상담 시작을 기다리는 고객
> **I want** 상담사가 준비될 때까지 대기실에서 기다리기를
> **So that** 상담 진입 전 준비할 수 있다

**Acceptance Criteria**:
1. 상담 시작 5분 전부터 "입장" 버튼 활성화
2. 대기실 화면: 상담사 프로필, 상담 유형, 남은 시간 카운트다운
3. 상담사가 방에 입장하면 "상담사가 준비되었습니다" 알림
4. 카메라/마이크 사전 확인 (Preflight와 통합)
5. 대기 중 간단한 안내 메시지 (상담 에티켓 등)

#### US-08-02: 상담 후 요약

> **As a** 상담을 마친 고객
> **I want** 상담 결과를 요약해서 보기를
> **So that** 상담 내용을 복습하고 다음 액션을 알 수 있다

**Acceptance Criteria**:
1. 상담 종료 후 요약 화면 자동 표시
2. 표시 정보: 상담 시간, 소모 크레딧, 상담사 이름
3. "리뷰 작성하기", "다시 예약하기", "홈으로" CTA 버튼
4. 상담사 메모가 있으면 함께 표시 (상담사가 작성 시)

#### US-08-03: 연결 안정성 강화

> **As a** 화상상담 중인 고객
> **I want** 네트워크 문제 시 자동으로 재연결되기를
> **So that** 상담이 중단되지 않는다

**Acceptance Criteria**:
1. 네트워크 끊김 감지 시 자동 재연결 (최대 3회, 30초 간격)
2. 재연결 중 "연결 중..." 상태 표시 + 카운트다운
3. 3회 실패 시 "연결할 수 없습니다" + "다시 시도" 버튼
4. 비디오 끊김 시 자동으로 오디오 전용 모드 전환 옵션
5. 연결 품질 인디케이터 (상/중/하) 상시 표시

---

### Epic E-09: 분석 & 모니터링

**목적**: 데이터 기반 의사결정을 위한 분석 인프라를 구축하고, 시스템 상태를 실시간 모니터링한다.

#### US-09-01: Google Analytics 4 연동

> **As a** 제품 매니저
> **I want** 사용자 행동 데이터를 GA4로 수집하기를
> **So that** 퍼널 분석, 이탈률, 전환률을 추적할 수 있다

**Acceptance Criteria**:
1. GA4 추적 코드 전역 삽입
2. 핵심 이벤트 트래킹:

| 이벤트 | 트리거 |
|--------|--------|
| `sign_up` | 회원가입 완료 |
| `login` | 로그인 성공 |
| `view_counselor` | 상담사 상세 페이지 진입 |
| `begin_booking` | 슬롯 선택 시작 |
| `add_payment_info` | 결제 수단 입력 |
| `purchase` | 결제 완료 (금액 포함) |
| `begin_consultation` | 상담 시작 |
| `submit_review` | 리뷰 작성 완료 |
| `refund_request` | 환불 요청 |

3. 전환 퍼널 설정: 가입 → 첫 충전 → 첫 예약 → 첫 상담 → 리뷰

#### US-09-02: 어드민 비즈니스 대시보드

> **As a** 사업 운영자
> **I want** 매출, 예약, 상담 핵심 KPI를 한눈에 보기를
> **So that** 비즈니스 상황을 실시간으로 파악할 수 있다

**Acceptance Criteria**:
1. 일별/주별/월별 KPI 카드:
   - 매출 (총 결제액, 순수익)
   - 신규 가입자 수
   - 예약 건수 (완료/취소 비율)
   - 상담 완료 건수, 평균 상담 시간
   - 환불 건수, 환불률
   - 상담사별 수익 랭킹
2. 차트: 매출 추이 (Line), 예약 분포 (Bar), 분야별 비중 (Pie)
3. 기간 필터: 7일, 30일, 90일, 커스텀
4. CSV/Excel 다운로드

**Technical Notes**:
- Backend: `GET /api/v1/admin/analytics/kpi`, `GET /api/v1/admin/analytics/revenue`
- 집계 쿼리 최적화: Materialized View 또는 별도 aggregation 테이블

#### US-09-03: 시스템 헬스 모니터링

> **As a** 엔지니어
> **I want** 시스템 상태를 실시간으로 모니터링하기를
> **So that** 장애를 조기에 감지하고 대응할 수 있다

**Acceptance Criteria**:
1. Spring Boot Actuator `/health`, `/metrics`, `/info` 엔드포인트 활성화
2. Prometheus 메트릭 수집 (`/actuator/prometheus`)
3. 핵심 메트릭: API 응답 시간 (P50/P95/P99), 에러율, DB 커넥션 풀, Redis 연결 상태
4. Grafana 대시보드 (또는 Datadog 연동)
5. 알림 규칙: 에러율 5% 초과, 응답 시간 P95 > 3초, DB 커넥션 90% 초과

---

### Epic E-10: 마케팅 도구

**목적**: 사용자 유치와 재방문을 위한 마케팅 인프라를 제공한다.

#### US-10-01: 쿠폰/할인 시스템

> **As a** 마케팅 담당자
> **I want** 할인 쿠폰을 생성하고 배포하기를
> **So that** 신규 가입과 재결제를 유도할 수 있다

**Acceptance Criteria**:
1. 쿠폰 유형: 정액(₩5,000), 정률(10%), 첫 상담 무료
2. 쿠폰 속성: 코드, 유효기간, 최소 결제금액, 사용 횟수 제한
3. 어드민 > 쿠폰 관리: 생성, 비활성화, 사용 통계
4. 결제 페이지에서 쿠폰 코드 입력 → 할인 적용
5. 회원가입 시 자동 지급 (웰컴 쿠폰)

**Technical Notes**:
- DB: `coupons`, `coupon_usages` 테이블
- Backend: `POST /api/v1/coupons/validate`, `POST /api/v1/coupons/apply`

#### US-10-02: 추천인/초대 시스템

> **As a** 기존 사용자
> **I want** 친구를 초대하고 보상을 받기를
> **So that** 서비스를 공유할 동기가 생긴다

**Acceptance Criteria**:
1. 고유 초대 코드 발급
2. 초대된 친구 가입 시 양쪽에 크레딧 보상 (예: 2,000원)
3. 초대 현황 조회: 초대 수, 가입 수, 첫 결제 수
4. 초대 링크 공유 (카카오톡, URL 복사)

---

### Epic E-11: 플랫폼 확장

**목적**: 장기적 성장을 위한 플랫폼 확장 기반을 마련한다.

#### US-11-01: 다국어(i18n) 지원

> **As a** 해외 거주 한국인 또는 외국인 사용자
> **I want** 영어 또는 다른 언어로 서비스를 이용하기를
> **So that** 언어 장벽 없이 상담을 받을 수 있다

**Acceptance Criteria**:
1. next-intl 기반 i18n 프레임워크 도입
2. Phase 1: 한국어 + 영어
3. 언어 전환 토글 (헤더 드롭다운)
4. 번역 키 기반 텍스트 관리 (JSON 파일)
5. 상담사 프로필 다국어 지원 (선택적)

#### US-11-02: 채팅 상담 모드

> **As a** 화상통화가 부담스러운 고객
> **I want** 텍스트 채팅으로만 상담받기를
> **So that** 편한 방식으로 상담을 이용할 수 있다

**Acceptance Criteria**:
1. 예약 시 상담 유형 선택: 화상상담 / 채팅상담
2. 채팅 상담: Sendbird Chat 기반 1:1 메시지
3. 상담사가 채팅/화상 모두 지원 가능 여부 프로필에 표시
4. 채팅 상담 별도 요금 체계 (화상보다 저렴)

#### US-11-03: 추천 시스템

> **As a** 고객
> **I want** 나에게 맞는 상담사를 추천받기를
> **So that** 선택의 어려움 없이 좋은 상담사를 만날 수 있다

**Acceptance Criteria**:
1. 간단한 질문 (고민 분야, 선호 스타일) → 상담사 추천
2. 추천 알고리즘: 별점, 완료율, 전문 분야 매칭
3. "오늘의 추천 상담사" 랜딩 섹션
4. 이전 상담 기록 기반 재추천

---

### Epic E-12: 성능 & 안정성

**목적**: 서비스 안정성과 확장성을 확보한다.

#### US-12-01: Redis 캐싱 적용

> **As a** 시스템
> **I want** 빈번히 조회되는 데이터를 캐싱하기를
> **So that** DB 부하를 줄이고 응답 시간을 개선한다

**Acceptance Criteria**:
1. 캐싱 대상:
   - 상담사 목록: TTL 5분
   - 상담사 상세 + 리뷰: TTL 5분
   - 상품 목록: TTL 1시간
   - 상담사 별점/리뷰수: TTL 10분
2. 캐시 무효화: 프로필 변경, 리뷰 등록 시 해당 캐시 제거
3. Cache-Aside 패턴 적용

**Technical Notes**:
- Spring `@Cacheable`, `@CacheEvict` 어노테이션
- Redis Serializer: Jackson JSON

#### US-12-02: 부하 테스트

> **As a** 엔지니어
> **I want** 동시 접속 시나리오를 테스트하기를
> **So that** 트래픽 급증 시 시스템이 버티는지 확인할 수 있다

**Acceptance Criteria**:
1. k6 또는 JMeter 기반 부하 테스트 스크립트
2. 시나리오:
   - 동시 100명 로그인
   - 동시 50명 상담사 목록 조회
   - 동시 20명 동일 슬롯 예약 시도 (경합 테스트)
   - 동시 10명 결제 처리
3. 목표: P95 응답시간 < 500ms, 에러율 < 1%
4. CI 파이프라인에 부하 테스트 단계 추가 (선택적)

#### US-12-03: PaymentRetryScheduler 구현

> **As a** 시스템
> **I want** 결제 후 실패한 후속 작업(채팅방 생성, 알림)을 자동 재시도하기를
> **So that** 수동 개입 없이 예약이 정상 완료된다

**Acceptance Criteria**:
1. 5분 간격으로 `payment_status_logs`에서 `*_retry_needed` 플래그 조회
2. 채팅방 생성 재시도 (최대 3회)
3. 알림 발송 재시도 (최대 3회)
4. 3회 실패 시 Slack 웹훅 알림 + 어드민 대시보드에 경고 표시
5. 재시도 성공 시 플래그 제거

---

## 6. Non-Functional Requirements

### 6.1 성능

| 항목 | 목표 |
|------|------|
| API 응답 시간 (P95) | < 500ms |
| 페이지 로드 (LCP) | < 2.5초 |
| Time to Interactive | < 3.5초 |
| 동시 접속 | 500+ users |
| DB 쿼리 | 단일 쿼리 < 100ms |

### 6.2 가용성

| 항목 | 목표 |
|------|------|
| 서비스 가용률 | 99.9% (월 43분 이하 다운타임) |
| 백업 | DB 일일 백업, 7일 보관 |
| 장애 탐지 | 5분 이내 알림 |
| 장애 복구 (RTO) | 30분 이내 |
| 데이터 손실 허용 (RPO) | 1시간 |

### 6.3 보안

| 항목 | 요구사항 |
|------|---------|
| 인증 | JWT + Refresh Token Rotation |
| 비밀번호 | BCrypt (strength 12+) |
| 민감 데이터 | AES-256 암호화 (계좌번호, 카드정보) |
| 통신 | TLS 1.3 필수 |
| OWASP | Top 10 대응 (XSS, CSRF, SQLi, IDOR) |
| 개인정보 | 개인정보보호법 준수, 3년 보관 후 파기 |
| 접근 제어 | RBAC (USER, COUNSELOR, ADMIN) |
| 감사 | 전 관리 행위 감사 로그 기록 |

### 6.4 접근성 (Accessibility)

| 항목 | 목표 |
|------|------|
| WCAG | 2.1 AA 준수 |
| 키보드 | 전 기능 키보드 단독 조작 가능 |
| 스크린 리더 | ARIA 레이블 전체 적용 |
| 색상 대비 | 최소 4.5:1 비율 |
| 포커스 관리 | 모달/다이얼로그 포커스 트래핑 |

---

## 7. Priority Matrix & Sprint Roadmap

### 7.1 Sprint 계획

```
Sprint 1 (런칭 차단 해소)
├── E-01: 인증 고도화
│   ├── US-01-01: 비밀번호 찾기/재설정
│   ├── US-01-02: 이메일 인증
│   └── US-01-04: 프로필 관리
├── E-02: 통합 알림 시스템
│   ├── US-02-01: 이메일 알림 (8종)
│   └── US-02-03: 인앱 알림 센터
├── E-03: 정산 지급 시스템
│   ├── US-03-01: 상담사 계좌 등록
│   ├── US-03-02: 정산 승인/지급 워크플로우
│   └── US-03-03: 환불-정산 상호작용
├── E-04: 어드민 운영 도구
│   ├── US-04-01: 사용자 관리
│   ├── US-04-02: 상담사 승인 워크플로우
│   ├── US-04-03: 분쟁 처리 워크플로우
│   └── US-04-04: 환불 승인 관리
└── E-12: 성능 & 안정성 (일부)
    └── US-12-03: PaymentRetryScheduler 구현

Sprint 2 (사용성 & 전환율 개선)
├── E-05: 사용자 경험 완성
│   ├── US-05-01: 결제 실패 복구
│   ├── US-05-02: 예약 변경/취소 개선
│   ├── US-05-03: 즐겨찾기 상담사
│   └── US-05-04: 빈/에러 상태 통일
├── E-06: 결제 고도화
│   ├── US-06-01: 추가 결제 수단
│   ├── US-06-02: 영수증/거래명세서
│   └── US-06-03: 거래 필터링
├── E-07: SEO & 마케팅 인프라
│   ├── US-07-01: 기술적 SEO
│   └── US-07-02: 블로그/콘텐츠 허브
└── E-04: 어드민 운영 도구 (나머지)
    └── US-04-05: 리뷰 모더레이션

Sprint 3 (경험 고도화 & 데이터)
├── E-08: 화상상담 고도화
│   ├── US-08-01: 대기실
│   ├── US-08-02: 상담 후 요약
│   └── US-08-03: 연결 안정성 강화
├── E-09: 분석 & 모니터링
│   ├── US-09-01: GA4 연동
│   ├── US-09-02: 어드민 비즈니스 대시보드
│   └── US-09-03: 시스템 헬스 모니터링
├── E-10: 마케팅 도구
│   ├── US-10-01: 쿠폰/할인 시스템
│   └── US-10-02: 추천인/초대 시스템
└── E-01: 인증 고도화 (나머지)
    └── US-01-03: 소셜 로그인

Sprint 4 (확장 & 안정성)
├── E-11: 플랫폼 확장
│   ├── US-11-01: 다국어(i18n) 지원
│   ├── US-11-02: 채팅 상담 모드
│   └── US-11-03: 추천 시스템
├── E-12: 성능 & 안정성
│   ├── US-12-01: Redis 캐싱 적용
│   └── US-12-02: 부하 테스트
└── E-02: 통합 알림 시스템 (나머지)
    └── US-02-02: SMS 알림
```

### 7.2 Impact/Effort Matrix

```
                   High Impact
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    │  Quick Wins     │  Major Projects │
    │                 │                 │
    │  · 비밀번호찾기  │  · 통합 알림    │
    │  · 결제실패복구  │  · 정산 지급    │
    │  · SEO 메타태그  │  · 어드민 도구  │
    │  · 빈상태 통일   │  · 분석 대시보드│
    │  · 이메일 인증   │  · 소셜 로그인  │
    │  · 거래 필터링   │  · 쿠폰 시스템  │
Low ├─────────────────┼─────────────────┤ High
Effort│                │                 │ Effort
    │  Fill-ins       │  Strategic      │
    │                 │                 │
    │  · 에러메시지통일│  · 다국어       │
    │  · ARIA 레이블  │  · 채팅상담모드 │
    │  · 캐싱 적용    │  · AI 요약      │
    │  · robots.txt   │  · 추천 시스템  │
    │                 │  · 부하 테스트  │
    └─────────────────┼─────────────────┘
                      │
                   Low Impact
```

---

## 8. Success Metrics (KPIs)

### 8.1 비즈니스 KPI

| 메트릭 | 현재 (추정) | Sprint 2 목표 | Sprint 4 목표 |
|--------|------------|---------------|---------------|
| 회원가입 전환율 | - | 15% | 25% |
| 첫 예약 전환율 | - | 10% | 20% |
| 결제 완료율 | - | 70% | 85% |
| 상담 완료율 | - | 80% | 90% |
| 리뷰 작성률 | - | 20% | 40% |
| 재방문율 (30일) | - | 25% | 40% |
| 환불률 | - | < 15% | < 10% |
| NPS (Net Promoter Score) | - | 30+ | 50+ |

### 8.2 기술 KPI

| 메트릭 | 현재 | 목표 |
|--------|------|------|
| API P95 응답시간 | 미측정 | < 500ms |
| 프론트엔드 LCP | 미측정 | < 2.5s |
| 테스트 커버리지 (Backend) | ~60% | 80%+ |
| 테스트 커버리지 (Frontend) | ~40% | 70%+ |
| 빌드 시간 | ~3분 | < 2분 |
| 에러율 (5xx) | 미측정 | < 0.1% |
| 서비스 가용률 | 미측정 | 99.9% |

---

## 9. Risks & Mitigations

| # | 리스크 | 확률 | 영향 | 완화 전략 |
|---|--------|------|------|-----------|
| R-1 | 이메일 발송 서비스 장애 | 중 | 고 | 이메일 큐잉 + 대체 서비스(Mailgun ↔ SES) 이중화 |
| R-2 | PortOne API 변경/중단 | 저 | 고 | Provider 추상화 패턴 유지, 모의 테스트 커버리지 확보 |
| R-3 | Sendbird 서비스 장애 | 저 | 최고 | 오디오 전용 fallback, 장애 시 고객 안내 자동화 |
| R-4 | 개인정보 유출 | 저 | 최고 | 데이터 암호화, 접근 로그 감사, 정기 보안 점검 |
| R-5 | 상담사 공급 부족 | 중 | 고 | 승인 프로세스 간소화, 상담사 마케팅, 수수료 정책 유연화 |
| R-6 | 정산 금액 분쟁 | 중 | 중 | 명확한 정산 정책 문서화, 상담사별 상세 명세서 제공 |
| R-7 | 동시 접속 급증 (바이럴) | 저 | 고 | 오토 스케일링 설정, CDN 활용, Redis 캐싱 |
| R-8 | 법규 변경 (전자상거래법, 정보통신법) | 중 | 중 | 분기별 법규 검토, 약관 업데이트 프로세스 |

---

## 10. Out of Scope

이 PRD에서 **다루지 않는** 항목:

1. **네이티브 앱 리디자인** — Flutter 앱은 기존 기능을 유지하며, 웹 우선 개선
2. **AI 상담 자동화** — 상담사를 AI로 대체하는 것은 범위 외 (보조 도구만 고려)
3. **해외 결제** — 국내 결제 수단만 대상 (Stripe 등 해외 PG 미포함)
4. **그룹 상담** — 1:1 상담만 대상
5. **상담사 직접 모집** — 플랫폼 외부 마케팅은 범위 외
6. **인프라 마이그레이션** — K8s/ECS 변경은 별도 기술 PRD로 관리

---

## Appendix

### A. 데이터 모델 변경 요약

| Migration | 테이블 | 변경 내용 |
|-----------|--------|-----------|
| V31 | `users` | `email_verified`, `email_verification_token` 추가 |
| V32 | `counselor_bank_accounts` | 신규 (계좌 정보 암호화 저장) |
| V33 | `password_reset_tokens` | 신규 (비밀번호 재설정 토큰) |
| V34 | `social_accounts` | 신규 (소셜 로그인 연동) |
| V35 | `notifications` | 신규 (인앱 알림) |
| V36 | `notification_preferences` | 신규 (알림 설정) |
| V37 | `notification_logs` | 신규 (발송 이력) |
| V38 | `favorite_counselors` | 신규 (즐겨찾기) |
| V39 | `reviews` | `moderation_status`, `reported_count` 추가 |
| V40 | `disputes` | `resolution_type`, `resolution_note`, `resolved_by`, `resolved_at` 추가 |
| V41 | `counselor_applications` | 신규 (상담사 승인 워크플로우) |
| V42 | `coupons`, `coupon_usages` | 신규 (쿠폰 시스템) |
| V43 | `referral_codes`, `referral_rewards` | 신규 (추천인 시스템) |

### B. 신규 API 엔드포인트 요약

| Epic | Method | Endpoint | 설명 |
|------|--------|----------|------|
| E-01 | POST | `/api/v1/auth/forgot-password` | 비밀번호 재설정 이메일 발송 |
| E-01 | POST | `/api/v1/auth/reset-password` | 비밀번호 재설정 |
| E-01 | POST | `/api/v1/auth/verify-email` | 이메일 인증 |
| E-01 | PUT | `/api/v1/auth/change-password` | 비밀번호 변경 |
| E-01 | PUT | `/api/v1/users/me` | 프로필 수정 |
| E-01 | DELETE | `/api/v1/users/me` | 계정 탈퇴 |
| E-01 | POST | `/api/v1/auth/oauth/kakao` | 카카오 로그인 |
| E-01 | POST | `/api/v1/auth/oauth/naver` | 네이버 로그인 |
| E-02 | GET | `/api/v1/notifications` | 알림 목록 |
| E-02 | PUT | `/api/v1/notifications/{id}/read` | 알림 읽음 처리 |
| E-02 | PUT | `/api/v1/notifications/read-all` | 전체 읽음 |
| E-02 | GET | `/api/v1/notifications/stream` | SSE 실시간 알림 |
| E-02 | GET/PUT | `/api/v1/notification-preferences` | 알림 설정 |
| E-03 | POST | `/api/v1/counselor/bank-account` | 계좌 등록 |
| E-03 | POST | `/api/v1/admin/settlements/{id}/pay` | 정산 지급 |
| E-04 | GET | `/api/v1/admin/users` | 사용자 목록 |
| E-04 | PUT | `/api/v1/admin/users/{id}/suspend` | 계정 정지 |
| E-04 | GET | `/api/v1/admin/disputes` | 분쟁 목록 |
| E-04 | PUT | `/api/v1/admin/disputes/{id}/resolve` | 분쟁 해결 |
| E-04 | GET | `/api/v1/admin/counselor-applications` | 승인 대기 목록 |
| E-04 | PUT | `/api/v1/admin/counselor-applications/{id}/approve` | 상담사 승인 |
| E-04 | PUT | `/api/v1/admin/reviews/{id}/moderate` | 리뷰 모더레이션 |
| E-05 | POST | `/api/v1/favorites/{counselorId}` | 즐겨찾기 추가 |
| E-05 | DELETE | `/api/v1/favorites/{counselorId}` | 즐겨찾기 제거 |
| E-05 | GET | `/api/v1/favorites` | 즐겨찾기 목록 |
| E-06 | POST | `/api/v1/coupons/validate` | 쿠폰 유효성 확인 |
| E-06 | POST | `/api/v1/coupons/apply` | 쿠폰 적용 |
| E-09 | GET | `/api/v1/admin/analytics/kpi` | KPI 데이터 |
| E-09 | GET | `/api/v1/admin/analytics/revenue` | 매출 분석 |

### C. 신규 프론트엔드 페이지

| Epic | Route | 설명 |
|------|-------|------|
| E-01 | `/forgot-password` | 비밀번호 찾기 |
| E-01 | `/reset-password` | 비밀번호 재설정 |
| E-01 | `/verify-email` | 이메일 인증 |
| E-01 | `/mypage` | 마이페이지 |
| E-01 | `/mypage/edit` | 프로필 편집 |
| E-01 | `/mypage/password` | 비밀번호 변경 |
| E-04 | `/admin/users` | 사용자 관리 |
| E-04 | `/admin/users/[id]` | 사용자 상세 |
| E-04 | `/admin/disputes` | 분쟁 관리 |
| E-04 | `/admin/disputes/[id]` | 분쟁 상세 |
| E-04 | `/admin/refunds` | 환불 관리 |
| E-04 | `/admin/counselor-applications` | 상담사 승인 |
| E-04 | `/admin/reviews` | 리뷰 모더레이션 |
| E-05 | `/favorites` | 즐겨찾기 상담사 |
| E-07 | `/blog` | 블로그 |
| E-07 | `/blog/[category]/[slug]` | 블로그 글 |
| E-09 | `/admin/analytics` | 비즈니스 대시보드 |
| E-10 | `/admin/coupons` | 쿠폰 관리 |
| E-10 | `/referral` | 추천인 현황 |

---

> **Document History**
>
> | Version | Date | Author | Changes |
> |---------|------|--------|---------|
> | 1.0 | 2026-02-18 | Product Planning Team | Initial draft |
