# GA Launch Checklist — 천지연꽃신당

작성일: 2026-02-15
대상 릴리즈: R3 (Sprint 8 / 주15-16) — GA 정식 출시
상태: **DRAFT**

---

## 사용법

각 항목을 점검 후 `[ ]` → `[x]`로 변경합니다.
**BLOCKER** 표시 항목은 미완료 시 출시 불가입니다.

---

## 1. 인프라 준비

### 1.1 데이터베이스 (MySQL)
- [ ] **BLOCKER** 프로덕션 MySQL 인스턴스 프로비저닝 완료 (RDS 또는 동등)
- [ ] Flyway 마이그레이션 V1~V9 프로덕션 적용 검증
- [ ] DB 캐릭터셋 `utf8mb4` / 콜레이션 `utf8mb4_unicode_ci` 설정
- [ ] `DB_URL`, `DB_USER`, `DB_PASSWORD` 환경변수 안전 주입 (Secrets Manager 등)
- [ ] 커넥션 풀 설정 확인 (HikariCP `maximumPoolSize`, `connectionTimeout`)
- [ ] 슬로우 쿼리 로그 활성화 (threshold: 1초)
- [ ] 인덱스 적용 확인: `idx_payment_status`, `idx_audit_action_created_at`, `idx_payment_status_log_payment_id`
- [ ] `counselor_slots.slot_id` UNIQUE 제약, `bookings.slot_id` UNIQUE 제약 확인 (동시 예약 방지)

### 1.2 Redis (세션/락/캐시)
- [ ] 프로덕션 Redis 인스턴스 구성 (ElastiCache 또는 동등)
- [ ] 예약 슬롯 분산락 동작 검증
- [ ] Redis 인증(AUTH) 및 TLS 설정

### 1.3 네트워크 / DNS / SSL
- [ ] **BLOCKER** 도메인 구매 및 DNS A/CNAME 레코드 설정
- [ ] **BLOCKER** SSL/TLS 인증서 발급 (ACM 또는 Let's Encrypt)
- [ ] HTTPS 리다이렉트 설정 (HTTP → HTTPS 강제)
- [ ] CDN 설정 (CloudFront 또는 동등) — 정적 자산 서빙
- [ ] Next.js 프론트엔드 배포 URL 확정 (Vercel / 자체 호스팅)
- [ ] 백엔드 API 도메인 확정 (예: `api.cheonjiyeon.com`)
- [ ] CORS `allowedOrigins` 프로덕션 도메인으로 변경 (현재 `localhost:3000`만 허용)

### 1.4 서버 / 컨테이너
- [ ] 백엔드 배포 환경 구성 (ECS/EKS/EC2 + Docker)
- [ ] 프론트엔드 배포 환경 구성 (Vercel / Nginx + Node)
- [ ] 오토스케일링 정책 설정 (CPU/메모리 기준)
- [ ] Health check 엔드포인트 구성 (`/actuator/health`)
- [ ] Java 21 런타임 확인
- [ ] `SERVER_PORT` 환경변수 설정

### 1.5 백업 & 복구
- [ ] **BLOCKER** DB 자동 백업 설정 (일 1회 이상, 보관 30일)
- [ ] DB 복원 테스트 완료 (RTO < 1시간, RPO < 1시간)
- [ ] Flyway 마이그레이션 롤백 스크립트 준비
- [ ] 결제/예약 데이터 무결성 복구 절차 문서화

---

## 2. 보안 점검

### 2.1 인증 & 인가
- [ ] **BLOCKER** `JWT_SECRET` 프로덕션 전용 강력한 시크릿 (32자 이상) 설정
  - 현재 dev 기본값: `dev-secret-dev-secret-dev-secret-32chars` — 절대 프로덕션 사용 금지
- [ ] JWT 액세스 토큰 만료 시간 적절성 검증 (현재 6시간)
- [ ] 리프레시 토큰 만료 시간 적절성 검증 (현재 14일)
- [ ] 리프레시 토큰 순환(rotation) + 재사용 감지 동작 확인 (`AUTH_REFRESH_REUSE_DETECTED`)
- [ ] 로그아웃 시 리프레시 토큰 무효화 확인
- [ ] 관리자 로그인 분리 (`/api/v1/auth/admin/login`) — ADMIN 역할 검증 확인
- [ ] 관리자 API 접근 제어: `requireAdmin()` 호출 확인 (ops, audit, timeline, retry-post-actions)
- [ ] 비밀번호 해싱: BCrypt 사용 확인

### 2.2 OWASP Top 10
- [ ] **SQL Injection**: JPA 파라미터 바인딩 사용 확인 (raw query 금지)
- [ ] **XSS**: Next.js 자동 이스케이핑 + 사용자 입력 렌더링 검토
- [ ] **CSRF**: API가 Bearer 토큰 기반이므로 쿠키 미사용 확인
- [ ] **IDOR**: 예약/결제 조회 시 소유자 검증 (`user_id` 매칭)
- [ ] **Mass Assignment**: DTO 기반 요청 바인딩 확인 (엔티티 직접 바인딩 금지)
- [ ] **Security Misconfiguration**: 프로덕션에서 H2 콘솔/디버그 엔드포인트 비활성화
- [ ] **Sensitive Data Exposure**: API 응답에 `password_hash` 등 민감 필드 미포함 확인

### 2.3 PII (개인정보)
- [ ] **BLOCKER** 사용자 이메일/이름/전화번호 저장 범위 최소화
- [ ] DB 접근 로그 활성화 (감사 추적)
- [ ] 개인정보 처리방침 페이지 게시
- [ ] 약관 동의 이력 보관 구현 확인

### 2.4 웹훅 보안
- [ ] **BLOCKER** `PAYMENT_WEBHOOK_SECRET` 프로덕션 값 설정
- [ ] 웹훅 `X-Webhook-Secret` 헤더 검증 로직 확인 (`PaymentWebhookController`)
- [ ] 웹훅 재전송 시 idempotency 확인 (이미 `PAID`/`CANCELED` 상태면 무시)
- [ ] 웹훅 엔드포인트 IP 화이트리스트 검토 (가능한 경우)

### 2.5 API 보안
- [ ] Rate limiting 구현 (로그인 시도 제한: 5회/분)
- [ ] 요청 본문 크기 제한 설정
- [ ] 보안 헤더 설정: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`
- [ ] `@Valid` 어노테이션 전 엔드포인트 적용 확인
- [ ] 에러 응답에서 스택트레이스/내부 정보 미노출 (`GlobalExceptionHandler`)

---

## 3. 성능 벤치마크

### 3.1 백엔드 API
- [ ] **BLOCKER** 핵심 API p95 응답 시간 < 500ms
  - `POST /api/v1/bookings` (예약 생성)
  - `POST /api/v1/payments/{id}/confirm` (결제 확정)
  - `GET /api/v1/counselors` (상담사 목록)
  - `POST /api/v1/auth/login` (로그인)
- [ ] 동시 사용자 50명 부하 테스트 통과
- [ ] 결제 확정 → 채팅방 생성 → 알림 발송 전체 플로우 < 3초
- [ ] DB 커넥션 풀 고갈 없음 확인 (부하 테스트 시)

### 3.2 프론트엔드 (Next.js)
- [ ] **BLOCKER** LCP (Largest Contentful Paint) < 2.5초
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] 번들 사이즈 분석 (`next build` 출력 확인)
- [ ] 이미지 최적화 (Next.js `<Image>` 컴포넌트 사용)
- [ ] `reactStrictMode: true` 유지

### 3.3 외부 Provider 타임아웃
- [ ] 결제 provider: connect 2000ms / read 4000ms 적절성 확인
- [ ] 채팅 provider: connect 2000ms / read 4000ms 적절성 확인
- [ ] 알림 provider: connect 2000ms / read 4000ms 적절성 확인
- [ ] 재시도 정책: 3회 / backoff 200ms 적절성 확인

---

## 4. 모니터링 & 알림

### 4.1 애플리케이션 모니터링
- [ ] **BLOCKER** 에러 트래킹 도구 연동 (Sentry / Datadog / 동등)
- [ ] 프론트엔드 에러 트래킹 연동 (Sentry Browser SDK)
- [ ] 로그 수집 설정 (CloudWatch Logs / ELK / 동등)
- [ ] 구조화 로깅(Structured Logging) 적용

### 4.2 인프라 모니터링
- [ ] CPU/메모리/디스크 사용률 모니터링
- [ ] DB 커넥션 수/쿼리 실행 시간 모니터링
- [ ] Redis 메모리/커넥션 모니터링

### 4.3 비즈니스 알림
- [ ] **BLOCKER** `ALERTS_WEBHOOK_URL` 설정 (Slack / 이메일 / PagerDuty)
- [ ] 결제 실패 알림 동작 확인 (`PAYMENT_CONFIRM_FAIL`, `PAYMENT_WEBHOOK_FAILED`)
- [ ] 채팅방 생성 실패 알림 확인 (`CHAT_OPEN_FAIL`)
- [ ] 알림 발송 실패 알림 확인 (`NOTIFICATION_FAIL`)
- [ ] 리프레시 토큰 재사용 감지 알림 확인 (`AUTH_REFRESH_REUSE_DETECTED`)
- [ ] 로그인 실패 알림 확인 (`AUTH_LOGIN_FAIL`)

### 4.4 SLA / 알림 임계값
- [ ] API 응답시간 p95 > 1초 시 경고
- [ ] API 5xx 오류율 > 1% 시 긴급 알림
- [ ] DB 커넥션 사용률 > 80% 시 경고
- [ ] 결제 실패율 > 5% 시 긴급 알림

---

## 5. 운영 대시보드 & 도구

### 5.1 관리자 기능 확인
- [ ] 운영 요약 지표 (`GET /api/v1/ops/summary`) 동작 확인
- [ ] 통합 타임라인 (`GET /api/v1/ops/timeline`) 필터 동작 확인
- [ ] 결제 상태 전이 로그 (`GET /api/v1/payments/{id}/logs`) 확인
- [ ] 감사로그 조회 (`GET /api/v1/admin/audit`) 확인
- [ ] 감사로그 CSV 다운로드 (`GET /api/v1/admin/audit/csv`) 확인
- [ ] 결제 후속 재처리 (`POST /api/v1/payments/{id}/retry-post-actions`) 확인

### 5.2 웹 관리자 화면
- [ ] `/admin/timeline` 페이지 정상 동작
- [ ] `/admin/audit` 페이지 필터 + CSV 다운로드
- [ ] `/dashboard` 요약 지표 표시
- [ ] 결제 로그 드릴다운 동작

---

## 6. 롤백 계획

### 6.1 배포 롤백
- [ ] **BLOCKER** 롤백 절차 문서화 및 팀 공유
- [ ] 이전 버전 컨테이너 이미지 보관 확인
- [ ] 블루-그린 또는 카나리 배포 전략 구성
- [ ] 롤백 소요 시간 < 5분 확인

### 6.2 DB 롤백
- [ ] Flyway 마이그레이션 롤백 스크립트 테스트
- [ ] 데이터 정합성 검증 쿼리 준비 (결제/예약 불일치 탐지)

### 6.3 롤백 트리거 조건
다음 중 하나 발생 시 즉시 롤백:
- API 5xx 오류율 > 10% (5분간)
- 결제 성공률 < 80% (10분간)
- 핵심 API 응답시간 p95 > 3초 (5분간)
- 데이터 정합성 오류 발생 (결제 금액 불일치 등)

---

## 7. Feature Flag 상태

MasterPlan에 정의된 Feature Flag 필수 항목:

| Feature Flag | 기본값 | GA 상태 | 비고 |
|---|---|---|---|
| 통화모드 (voice/video) | `voice` | [ ] 확정 | Sendbird Calls 연동 |
| 환불정책 버전 | `v1` | [ ] 확정 | 24h/1h/노쇼 정책 |
| 쿠폰/프로모션 | `off` | [ ] 확정 | GA에서는 OFF 권장 |

### Provider 설정
| Provider | 기본값 | GA 값 | 환경변수 |
|---|---|---|---|
| 결제 | `fake` | `http` | `PAYMENT_PROVIDER` |
| 채팅 | `fake` | `http` | `CHAT_PROVIDER` |
| 알림 | `fake` | `http` | `NOTIFICATION_PROVIDER` |

- [ ] **BLOCKER** 모든 provider를 `http`로 전환
- [ ] 각 provider 필수 환경변수 설정 완료 (base URL, API key)
- [ ] `PAYMENT_WEBHOOK_SECRET` 설정

---

## 8. 데이터 / 마이그레이션

### 8.1 스키마 현황 (Flyway V1~V9)
| 버전 | 내용 | 확인 |
|---|---|---|
| V1 | users, counselors, counselor_slots 초기화 + 시드 데이터 | [ ] |
| V2 | bookings 테이블 | [ ] |
| V3 | audit_logs 테이블 | [ ] |
| V4 | user_role 컬럼 | [ ] |
| V5 | refresh_tokens 테이블 | [ ] |
| V6 | refresh_token 해시/디바이스 컬럼 변경 | [ ] |
| V7 | payments 테이블 | [ ] |
| V8 | chat_rooms 테이블 | [ ] |
| V9 | payment_status_logs 테이블 | [ ] |

- [ ] 프로덕션 DB에 모든 마이그레이션 순서대로 적용 확인
- [ ] V1의 시드 데이터(테스트 상담사) 프로덕션 적절성 검토
- [ ] 추가 상담사 데이터 투입 준비

---

## 9. 법률 / 컴플라이언스

### 9.1 필수 문서
- [ ] **BLOCKER** 개인정보 처리방침 페이지 게시
- [ ] **BLOCKER** 이용약관 페이지 게시
- [ ] 취소/환불 정책 명시 (24시간 전: 100%, 24~1시간: 50%, 1시간 이내/노쇼: 불가)
- [ ] 결제/PG사 관련 고지 사항

### 9.2 개인정보보호
- [ ] 수집 항목 명시: 이메일, 이름, 비밀번호(해시), 결제정보
- [ ] 보관 기간 정책 수립
- [ ] 개인정보 삭제 요청 처리 절차
- [ ] 상담 내용 저장 범위 확정 (PRD 리스크 #5)

### 9.3 PG사/결제
- [ ] PortOne + KG이니시스 상용 계약 체결
- [ ] PG사 프로덕션 MID/KEY 발급
- [ ] 전자영수증/결제내역 표시 구현

---

## 10. 팀 준비 & 운영 체계

### 10.1 온콜 / 에스컬레이션
- [ ] **BLOCKER** 온콜 당번 로테이션 편성
- [ ] 에스컬레이션 경로 정의 (Sev1 → 15분 내 대응, Sev2 → 1시간 내 대응)
- [ ] 온콜 알림 채널 설정 (Slack / PagerDuty)

### 10.2 CS (고객 지원)
- [ ] CS 담당자 운영 도구 교육 (관리자 화면 사용법)
- [ ] FAQ 초안 작성
- [ ] 분쟁 처리 SLA 정의 (접수 → 1영업일 내 초기 대응)
- [ ] 수동 환불/캐시 조정 절차 확립 (`POST /api/v1/admin/cash/adjust`)

### 10.3 운영 문서
- [ ] 운영 런북 최종 업데이트 (docs/Step4_Provider_운영런북.md)
- [ ] 장애 대응 플레이북 작성
- [ ] 상태 점검 순서 팀 공유 (README.md 참조)

### 10.4 리허설
- [ ] 장애 시뮬레이션 (결제 provider 장애 시나리오)
- [ ] 롤백 드릴 실행
- [ ] 온콜 호출 테스트

---

## 11. QA / 테스트

### 11.1 자동화 테스트
- [ ] **BLOCKER** `./gradlew test` 전체 통과
- [ ] **BLOCKER** `npm run build` (web) 통과
- [ ] 백엔드 통합 테스트 커버리지 확인
- [ ] 프론트엔드 단위 테스트 통과

### 11.2 E2E 시나리오
- [ ] **BLOCKER** 회원가입 → 로그인 → 상담사 조회 → 예약 → 결제 → 상담방 입장
- [ ] 예약 취소 → 환불 플로우
- [ ] 관리자 로그인 → 대시보드 → 타임라인 → 감사로그
- [ ] 웹훅 수신 → 결제 상태 전이 → 채팅방 생성
- [ ] 세션 만료 → 리프레시 → 재인증

### 11.3 UI QA (docs/QA_Checklist_UI_v1.md)
- [ ] 공통 컴포넌트 적용 확인 (PageTitle, InlineError, InlineSuccess, ActionButton)
- [ ] 모바일 반응형 확인 (390px 기준)
- [ ] 인증 UX 확인 (실패/성공 메시지, 리다이렉트)
- [ ] 관리자 화면 필터/정렬/페이지네이션
- [ ] 권한 없는 접근 차단 확인

### 11.4 Sev1/Sev2 이슈
- [ ] **BLOCKER** Sev1 이슈 0건 (MasterPlan Sprint 8 AC)
- [ ] **BLOCKER** Sev2 이슈 0건

---

## 12. 출시 당일 체크리스트

### D-1 (출시 전날)
- [ ] 프로덕션 환경 최종 점검
- [ ] 모든 환경변수 설정 재확인
- [ ] DB 백업 실행
- [ ] 팀 출시 브리핑

### D-Day
- [ ] 백엔드 배포
- [ ] 프론트엔드 배포
- [ ] DNS 전환 (필요 시)
- [ ] Smoke 테스트: 회원가입 → 로그인 → 상담사 조회
- [ ] Smoke 테스트: 결제 → 웹훅 → 채팅방 생성
- [ ] 모니터링 대시보드 실시간 감시 시작
- [ ] CS 채널 오픈

### D+1 (출시 다음날)
- [ ] 야간 에러 로그 확인
- [ ] 결제 정합성 검증 (결제 건수 vs 예약 건수)
- [ ] 사용자 피드백 수집 시작
- [ ] 성능 지표 리뷰 (API p95, LCP)

---

## 요약: BLOCKER 항목 (미완료 시 출시 불가)

| # | 항목 | 섹션 |
|---|---|---|
| 1 | 프로덕션 MySQL 인스턴스 | 1.1 |
| 2 | SSL/TLS 인증서 | 1.3 |
| 3 | 도메인/DNS 설정 | 1.3 |
| 4 | DB 자동 백업 | 1.5 |
| 5 | JWT_SECRET 프로덕션 값 | 2.1 |
| 6 | PAYMENT_WEBHOOK_SECRET 설정 | 2.4 |
| 7 | PII 최소 수집 확인 | 2.3 |
| 8 | API p95 < 500ms | 3.1 |
| 9 | LCP < 2.5s | 3.2 |
| 10 | 에러 트래킹 연동 | 4.1 |
| 11 | ALERTS_WEBHOOK_URL 설정 | 4.3 |
| 12 | 롤백 절차 문서화 | 6.1 |
| 13 | Provider http 전환 | 7 |
| 14 | 개인정보 처리방침 | 9.1 |
| 15 | 이용약관 | 9.1 |
| 16 | 온콜 편성 | 10.1 |
| 17 | gradlew test 통과 | 11.1 |
| 18 | npm run build 통과 | 11.1 |
| 19 | 핵심 E2E 시나리오 통과 | 11.2 |
| 20 | Sev1/Sev2 이슈 0건 | 11.4 |
