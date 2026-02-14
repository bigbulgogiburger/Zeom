# Master Plan (Agile) v1 — 천지연꽃신당

작성 관점: Agile 프로젝트를 다수 성공시킨 IT PM 실행안  
기간: 16주 (2주 스프린트 x 8)
방법론: Scrum(경량) + Kanban 운영 보드 혼합

---

## 1) 제품 목표/성공 기준

## 제품 목표
- 신점 상담의 핵심 여정(탐색→예약→결제→상담→후기)을 웹/앱에서 끊김 없이 제공
- 1시간 캐시 단위 BM 안정화
- 운영/CS/환불 분쟁까지 관리 가능한 운영 시스템 구축

## 성공지표(KPI)
- 예약 전환율: 방문 대비 예약완료율
- 결제 성공률: 결제시도 대비 성공
- 상담 시작률: 예약 대비 실제 입장
- 상담 완료율: 시작 대비 60분 종료
- 환불/분쟁률: 완료건 대비 비율
- 30일 재구매율

---

## 2) 운영 프레임워크 (Agile)

## 스쿼드 구조
- PM 1
- Product Designer 1~2
- FE(Web) 2
- FE(App/Flutter) 2
- BE 2~3
- QA 1
- DevOps 0.5~1

## 의식(Ritual)
- Sprint Planning: 2시간
- Daily Standup: 15분
- Backlog Refinement: 주 1회
- Sprint Review: 1시간
- Retrospective: 45분

## 보드 컬럼
- Backlog → Ready → In Progress → PR → QA → Done

## Definition of Ready (DoR)
- 목적/가설/KPI 명시
- UX 와이어/정책 문구 포함
- API 계약 초안 존재
- 수용 기준(AC) 존재

## Definition of Done (DoD)
- 코드리뷰 완료
- 테스트 통과(Unit/Integration/E2E)
- 로그/모니터링 포인트 추가
- 릴리즈 노트 업데이트

---

## 3) 릴리즈 전략

- R1 (주8): Closed Beta (내부+지인)
- R2 (주12): Open Beta
- R3 (주16): GA 출시

Feature Flag 필수:
- 통화모드(voice/video)
- 환불정책 버전
- 쿠폰/프로모션

---

## 4) Sprint 상세 계획

---

## Sprint 1 (주1-2): Foundation & Discovery Core

### Sprint Goal
회원가입 + 상담사 탐색 + 슬롯 조회까지 UX 뼈대와 백엔드 기반 완성

### Design(UI/UX)
- IA 확정(웹/앱)
- 디자인 토큰 v1(컬러/타이포/스페이싱)
- 핵심 화면 와이어: 홈, 상담사 목록/상세, 예약 확인
- 정책 문구 초안(60분 규칙, 취소 전 안내)

### Frontend(Web/Next.js)
- 라우팅 골격 + 레이아웃
- 홈/목록/상세 화면 구현(목업 데이터)
- 필터/정렬 UI
- 상태 화면(로딩/빈값/에러)

### Frontend(App/Flutter)
- 하단탭 구조
- 홈/상담찾기/상세 와이어 구현
- 공통 컴포넌트(Button/Card/Chip)

### Backend(Spring Boot)
- 인증(JWT) 기초
- users, counselors, slots 도메인/API
- 상담사 목록/상세/슬롯 조회 API
- MySQL 마이그레이션 v1

### AC(수용기준)
- 웹/앱에서 상담사 상세 및 슬롯 조회 가능
- 인증 후 사용자 세션 유지
- API p95 500ms 이하(내부 dev 기준)

---

## Sprint 2 (주3-4): Reservation Core

### Sprint Goal
예약 생성/취소와 슬롯 동시성 제어 완성

### Design(UI/UX)
- 예약 확인 화면 상세화
- 예약 실패/슬롯 선점 충돌 UX
- 캘린더/슬롯 인터랙션 확정

### Frontend(Web)
- 예약 생성 플로우 구현
- 예약/일정 탭 기본 구현
- 슬롯 충돌 시 재선택 UX

### Frontend(App)
- 예약 확인/생성
- 예약 탭(예정/완료)

### Backend
- reservations API (create/get/cancel)
- Redis 락 or DB unique 제약 동시 적용
- 예약 상태 전이 로직
- 감사로그(예약 생성/취소)

### AC
- 동일 슬롯 중복 예약 0건
- 예약 취소 시 상태 일관성 보장

---

## Sprint 3 (주5-6): Payment & Wallet

### Sprint Goal
PortOne+KG 결제와 캐시 지갑 안정화

### Design(UI/UX)
- 캐시 상품 화면
- 결제 성공/실패/재시도 UX
- 환불 정책 노출 UI

### Frontend(Web)
- 캐시충전 페이지
- 결제 모달/리다이렉트 처리
- 지갑/거래내역 화면

### Frontend(App)
- 캐시충전 화면 + 웹뷰/딥링크 처리
- 결제 결과 후 예약 복귀

### Backend
- payments, wallet, cash_transactions 도메인
- 결제 prepare/confirm/webhook
- 웹훅 idempotency
- 캐시 적립/hold 로직

### AC
- 결제 성공 시 캐시 정확 적립
- 웹훅 중복에도 중복 적립 없음

---

## Sprint 4 (주7-8): Refund Policy & Beta Ready

### Sprint Goal
취소/환불 정책 자동화 + Closed Beta 가능 상태

### Design(UI/UX)
- 취소 시 환불 예상값 계산 노출
- 정책 문구 확정(24h/1h/노쇼)
- CS 접수 UX

### Frontend(Web/App)
- 취소/환불 요청 UI
- 환불 상태 추적 화면

### Backend
- refunds 도메인/API
- 정책 엔진(시간 기반 자동 계산)
- 관리자 환불 처리 기본 API

### AC
- 정책대로 환불 계산 정확
- 환불 프로세스 추적 가능

---

## Sprint 5 (주9-10): Sendbird Integration (Core)

### Sprint Goal
대기실→상담실→종료까지 60분 통화 E2E

### Design(UI/UX)
- 대기실(장치 체크) 상세
- 상담실 타이머/경고 UI
- 끊김/재입장 UX

### Frontend(Web)
- Sendbird 입장 토큰 연계
- 상담실 컨트롤(음소거/카메라)

### Frontend(App)
- 통화 화면 + 제어
- 백그라운드/복귀 UX

### Backend
- session token 발급
- start/end 이벤트 API
- consultation_sessions 저장

### AC
- 60분 세션 정상 종료
- 통화 이벤트 로그 정합성 확보

---

## Sprint 6 (주11-12): Review/History/Retention

### Sprint Goal
상담완료 후 후기·내역·재예약까지 완성 (Open Beta)

### Design(UI/UX)
- 후기 입력 UX
- 상담내역/영수증 UX
- 재예약 동선 최적화

### Frontend(Web/App)
- 후기 작성/수정
- 내역(상담/결제/환불) 탭

### Backend
- reviews 도메인/API
- 내역 통합 조회 API
- 기본 추천(최근 상담사 우선)

### AC
- 완료 상담의 후기 작성률 측정 가능
- 재예약 클릭→예약 완료 플로우 3단계 이내

---

## Sprint 7 (주13-14): Admin & Operations

### Sprint Goal
운영자용 관리기능(환불/분쟁/모니터링) 확보

### Design(UI/UX)
- 어드민 대시보드 IA
- 환불 승인/거절 UX
- 분쟁 처리 큐 UI

### Frontend(Web Admin)
- 예약/결제/환불/분쟁 조회
- 액션(승인/거절/메모)

### Backend
- admin API + RBAC 강화
- 분쟁 도메인/API
- 감사로그/이력추적

### AC
- 운영자가 분쟁/환불을 UI로 처리 가능
- 권한 없는 접근 차단

---

## Sprint 8 (주15-16): Hardening & GA Launch

### Sprint Goal
성능/보안/품질 고도화 후 정식 출시

### Design(UI/UX)
- 접근성/카피 미세 조정
- 핵심 전환 화면 A/B 후보 정리

### Frontend(Web/App)
- 성능 최적화(LCP/앱 cold start)
- 크래시/오류 트래킹 연결

### Backend
- 부하테스트
- 보안점검(PII, 인증, 웹훅 위변조)
- 운영대시보드(KPI/알람)

### AC
- 출시 체크리스트 100% 완료
- Sev1/Sev2 이슈 0

---

## 5) 교차 기능 (매 스프린트 공통)

- QA 회귀 테스트 스위트 유지
- 데이터 마이그레이션 검증
- 모니터링/알람 개선
- 문서 업데이트(PRD/API/Runbook)

---

## 6) 리스크 관리 트랙

- 결제/환불 트랙: 재무 정합성 최우선
- 통화 품질 트랙: 입장률/완료율 최우선
- CS 트랙: 노쇼/분쟁 SLA
- 보안 트랙: 토큰/개인정보/권한

---

## 7) 즉시 실행 액션 (이번 주)

1. Sprint 1 Planning (스토리 포인트 산정)
2. 디자인 토큰/컴포넌트 Freeze v1
3. API 계약서(OpenAPI) 초안 합의
4. 예약 동시성 기술선택 확정(Redis lock + unique)
5. KPI 대시보드 최소지표 정의
