# 천지연꽃신당 Monorepo

## 구조
- backend: Spring Boot 3.5 / Java 21
- web: Next.js (React)
- app_flutter: Flutter
- docs: 기획 문서
- infra: 인프라

## Quick Start

### backend
```bash
cd backend
./gradlew bootRun
```

### web
```bash
cd web
npm install
npm run dev
```

### app_flutter
Flutter SDK 설치 후:
```bash
cd app_flutter
flutter pub get
flutter run
```

## 운영 런북 (Step3)

### 관리자 운영 API
- 요약 지표: `GET /api/v1/ops/summary`
- 통합 타임라인: `GET /api/v1/ops/timeline`
  - 필터: `bookingId`, `bookingStatus`, `paymentStatus`, `chatStatus`, `from`, `to`
  - 웹 운영화면: `/admin/timeline` (결제 상태 전이 드릴다운 포함)
- 결제 상태 전이 로그: `GET /api/v1/payments/{id}/logs` (관리자)
- 감사로그: `GET /api/v1/admin/audit`
- 감사로그 CSV: `GET /api/v1/admin/audit/csv`

### 상태 점검 순서
1. `/api/v1/ops/summary`로 auth/booking 이상 징후 확인
2. `/api/v1/ops/timeline`에서 문제 booking/payment/chat 라인 추적
3. `/api/v1/payments/{id}/logs`로 상태 전이 이유 확인
4. 필요 시 `/api/v1/admin/audit` 필터로 관련 auth/payment/chat 이벤트 확인

### 환경변수(가짜 provider 기본)
- `PAYMENT_PROVIDER=fake`
- `CHAT_PROVIDER=fake`
- `NOTIFICATION_PROVIDER=fake`
- `ALERTS_WEBHOOK_URL=` (선택)
