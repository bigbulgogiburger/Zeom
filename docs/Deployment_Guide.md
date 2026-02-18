# Deployment Guide — 천지연꽃신당

작성일: 2026-02-15

---

## 1. 시스템 요구사항

### Backend
- **Runtime**: Java 21 (OpenJDK 21+)
- **Framework**: Spring Boot 3.5.0
- **Build Tool**: Gradle 8.x (Gradle Wrapper 포함)
- **Database**: MySQL 8.0+ (개발: H2 in-memory, MODE=MySQL)
- **Cache/Lock**: Redis 6.0+ (프로덕션 필수, distributed locks)
- **Schema Migration**: Flyway

### Web Frontend
- **Runtime**: Node.js 18+ (LTS 권장)
- **Framework**: Next.js 15.1.6 / React 19.0.0
- **Package Manager**: npm

### App (Flutter)
- **SDK**: Flutter SDK 3.16+ (stable)
- **상태**: Feature complete (auth, counselor, booking, payment, wallet, consultation, review)
- **빌드**: Android APK / iOS IPA

---

## 2. 환경변수 전체 목록

### 2.1 Backend (Spring Boot)

#### 필수 (프로덕션)

| 변수 | 설명 | 예시 |
|---|---|---|
| `DB_URL` | MySQL JDBC URL | `jdbc:mysql://db-host:3306/cheonjiyeon?useSSL=true&serverTimezone=Asia/Seoul` |
| `DB_USER` | DB 사용자명 | `cheonjiyeon_app` |
| `DB_PASSWORD` | DB 비밀번호 | (Secrets Manager에서 주입) |
| `JWT_SECRET` | JWT 서명 키 (32자 이상) | (Secrets Manager에서 주입) |
| `REDIS_HOST` | Redis 호스트 | `redis.example.com` |
| `REDIS_PORT` | Redis 포트 | `6379` |
| `REDIS_PASSWORD` | Redis 비밀번호 | (Secrets Manager에서 주입) |
| `SERVER_PORT` | 서버 포트 | `8080` |

#### Provider 설정 (프로덕션)

**Payment Provider (PortOne)**

| 변수 | 기본값 | 설명 |
|---|---|---|
| `PAYMENT_PROVIDER` | `fake` | 결제 provider (`fake` / `portone`) |
| `PORTONE_API_KEY` | (빈값) | PortOne REST API 키 |
| `PORTONE_API_SECRET` | (빈값) | PortOne API 시크릿 |
| `PORTONE_STORE_ID` | (빈값) | PortOne 가맹점 ID (imp_code) |
| `PORTONE_WEBHOOK_SECRET` | (빈값) | 웹훅 서명 검증 시크릿 |
| `PORTONE_BASE_URL` | `https://api.iamport.kr` | PortOne API base URL |

**Chat Provider (Sendbird)**

| 변수 | 기본값 | 설명 |
|---|---|---|
| `CHAT_PROVIDER` | `fake` | 채팅 provider (`fake` / `sendbird`) |
| `SENDBIRD_APP_ID` | (빈값) | Sendbird 애플리케이션 ID |
| `SENDBIRD_API_TOKEN` | (빈값) | Sendbird Platform API 토큰 |
| `SENDBIRD_BASE_URL` | `https://api-{app_id}.sendbird.com` | Sendbird API URL |

**Notification Provider**

| 변수 | 기본값 | 설명 |
|---|---|---|
| `NOTIFICATION_PROVIDER` | `fake` | 알림 provider (`fake` / `http`) |
| `NOTIFICATION_HTTP_BASE_URL` | (빈값) | 알림 provider API URL |
| `NOTIFICATION_HTTP_API_KEY` | (빈값) | 알림 provider API 키 |
| `NOTIFICATION_HTTP_CONNECT_TIMEOUT_MS` | `2000` | 알림 연결 타임아웃 |
| `NOTIFICATION_HTTP_READ_TIMEOUT_MS` | `4000` | 알림 읽기 타임아웃 |
| `NOTIFICATION_HTTP_RETRY_ATTEMPTS` | `3` | 알림 재시도 횟수 |
| `NOTIFICATION_HTTP_RETRY_BACKOFF_MS` | `200` | 알림 재시도 간격 |

#### 운영 알림

| 변수 | 기본값 | 설명 |
|---|---|---|
| `ALERTS_WEBHOOK_URL` | (빈값) | Slack/Teams 웹훅 URL (장애 알림용) |

#### E2E 테스트

| 변수 | 기본값 | 설명 |
|---|---|---|
| `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP` | `false` | E2E 테스트용 admin 시딩 활성화 (Playwright 필수) |

---

### 2.2 Web Frontend (Next.js)

| 변수 | 설명 | 예시 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | 백엔드 API base URL | `https://api.cheonjiyeon.com` |

### 2.3 Flutter App

| 변수 | 설명 | 예시 |
|---|---|---|
| `API_BASE_URL` | 백엔드 API base URL | `https://api.cheonjiyeon.com` (빌드 시 하드코딩) |

---

## 3. 로컬 개발 환경 설정

### 3.1 Backend

```bash
cd backend

# H2 in-memory DB로 자동 실행 (추가 설정 불필요)
./gradlew bootRun
```

기본 동작:
- H2 in-memory DB (MySQL 호환 모드)
- Flyway 마이그레이션 V1~V9 자동 적용
- 시드 데이터 포함 (상담사 2명, 슬롯 3개)
- 포트: `8080`
- 모든 provider: `fake` (외부 연동 없이 동작)

### 3.2 Web Frontend

```bash
cd web

npm install
npm run dev
```

기본 동작:
- 포트: `3000`
- API 요청: `http://localhost:8080` (api-client.ts 참조)

### 3.3 Flutter App

```bash
cd app_flutter

flutter pub get
flutter run
```

---

## 4. 빌드

### 4.1 Backend JAR 빌드

```bash
cd backend

./gradlew clean build

# 테스트 포함 빌드
./gradlew clean build

# 테스트 건너뛰기 (CI에서는 비권장)
./gradlew clean build -x test

# 빌드 결과물
ls build/libs/api-0.0.1-SNAPSHOT.jar
```

### 4.2 Web Frontend 빌드

```bash
cd web

npm install
npm run build

# 프로덕션 서버 시작
npm run start
```

---

## 5. 프로덕션 배포

### 5.1 Backend 배포 (Docker)

**Dockerfile 예시:**

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY backend/build/libs/api-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**실행:**

```bash
docker build -t cheonjiyeon-api:latest .

docker run -d \
  --name cheonjiyeon-api \
  -p 8080:8080 \
  -e DB_URL="jdbc:mysql://db-host:3306/cheonjiyeon?useSSL=true&serverTimezone=Asia/Seoul" \
  -e DB_USER="cheonjiyeon_app" \
  -e DB_PASSWORD="<secret>" \
  -e JWT_SECRET="<secret-32chars-or-more>" \
  -e REDIS_HOST="redis.example.com" \
  -e REDIS_PORT="6379" \
  -e REDIS_PASSWORD="<redis-secret>" \
  -e PAYMENT_PROVIDER=portone \
  -e PORTONE_API_KEY="<portone-api-key>" \
  -e PORTONE_API_SECRET="<portone-api-secret>" \
  -e PORTONE_STORE_ID="imp12345678" \
  -e PORTONE_WEBHOOK_SECRET="<portone-webhook-secret>" \
  -e CHAT_PROVIDER=sendbird \
  -e SENDBIRD_APP_ID="<sendbird-app-id>" \
  -e SENDBIRD_API_TOKEN="<sendbird-api-token>" \
  -e NOTIFICATION_PROVIDER=http \
  -e NOTIFICATION_HTTP_BASE_URL="https://notification-provider.example.com" \
  -e NOTIFICATION_HTTP_API_KEY="<key>" \
  -e ALERTS_WEBHOOK_URL="https://hooks.slack.com/services/xxx/yyy/zzz" \
  cheonjiyeon-api:latest
```

### 5.2 Web Frontend 배포

**옵션 A: Vercel (권장)**

```bash
cd web
npx vercel --prod
```

환경변수를 Vercel 대시보드에서 설정:
- `NEXT_PUBLIC_API_URL=https://api.cheonjiyeon.com`

**옵션 B: Docker / 자체 호스팅**

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY web/package*.json ./
RUN npm ci --production
COPY web/ ./
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### 5.3 Flutter App 배포

**Android:**

```bash
cd app_flutter

# 빌드 전 API URL 설정 (lib/core/config.dart 등)
flutter build apk --release

# 빌드 결과물
ls build/app/outputs/flutter-apk/app-release.apk
```

Google Play Console에 APK 업로드.

**iOS:**

```bash
cd app_flutter

flutter build ios --release

# Xcode에서 서명 후 App Store Connect 업로드
open ios/Runner.xcworkspace
```

### 5.4 DB 마이그레이션

Flyway는 Spring Boot 시작 시 자동 실행됩니다. 수동 실행이 필요한 경우:

```bash
# Gradle로 실행 (flyway 플러그인 추가 필요)
./gradlew flywayMigrate

# 또는 애플리케이션 시작 시 자동 적용 (기본 동작)
# spring.flyway.enabled=true (application.yml)
```

마이그레이션 파일 위치: `backend/src/main/resources/db/migration/`

| 파일 | 내용 |
|---|---|
| `V1__init.sql` | users, counselors, counselor_slots + 시드 데이터 |
| `V2__bookings.sql` | bookings 테이블 |
| `V3__audit_logs.sql` | audit_logs 테이블 |
| `V4__user_role.sql` | user role 컬럼 |
| `V5__refresh_tokens.sql` | refresh_tokens 테이블 |
| `V6__refresh_token_hash_and_device.sql` | 토큰 해시 + 디바이스 정보 |
| `V7__payments.sql` | payments 테이블 |
| `V8__chat_rooms.sql` | chat_rooms 테이블 |
| `V9__payment_status_logs.sql` | payment_status_logs 테이블 |
| `V10__wallets.sql` | wallets 테이블 |
| `V11__cash_transactions.sql` | cash_transactions 테이블 |
| `V12__products.sql` | products 테이블 |
| `V13__consultation_sessions.sql` | consultation_sessions 테이블 |
| `V14__reviews.sql` | reviews 테이블 |
| `V15__refunds.sql` | refunds 테이블 |
| `V16__disputes.sql` | disputes 테이블 |
| `V17__alter_users_add_phone_status.sql` | users 테이블 phone/status 컬럼 추가 |
| `V18__alter_counselors_add_user_id.sql` | counselors 테이블 user_id FK 추가 |
| `V19__alter_bookings_add_channel.sql` | bookings 테이블 channel 컬럼 추가 |

### 5.5 Redis 설정

프로덕션에서 Redis는 **필수**입니다. 분산 락(wallet 충전/차감) 및 세션 캐시에 사용됩니다.

**Docker로 Redis 실행 (테스트용):**

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass "<redis-password>"
```

**프로덕션 권장:**
- AWS ElastiCache for Redis
- Azure Cache for Redis
- Google Cloud Memorystore

**연결 확인:**

```bash
redis-cli -h <REDIS_HOST> -p 6379 -a <REDIS_PASSWORD>
> PING
PONG
```

---

## 6. 환경별 설정 가이드

### 6.1 개발 (Development)

```
DB_URL=jdbc:h2:mem:cheonjiyeon;MODE=MySQL;DB_CLOSE_DELAY=-1
DB_USER=sa
DB_PASSWORD=
JWT_SECRET=dev-secret-dev-secret-dev-secret-32chars
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PAYMENT_PROVIDER=fake
CHAT_PROVIDER=fake
NOTIFICATION_PROVIDER=fake
AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true  # E2E 테스트 시에만
```

### 6.2 스테이징 (Staging)

```
DB_URL=jdbc:mysql://staging-db:3306/cheonjiyeon_stg?useSSL=true
DB_USER=cheonjiyeon_stg
DB_PASSWORD=<staging-password>
JWT_SECRET=<staging-secret>
REDIS_HOST=staging-redis
REDIS_PORT=6379
REDIS_PASSWORD=<staging-redis-password>
PAYMENT_PROVIDER=portone     # PortOne 테스트 모드
PORTONE_API_KEY=<staging-api-key>
PORTONE_API_SECRET=<staging-api-secret>
PORTONE_STORE_ID=<staging-store-id>
PORTONE_WEBHOOK_SECRET=<staging-webhook-secret>
CHAT_PROVIDER=sendbird       # Sendbird 테스트 앱
SENDBIRD_APP_ID=<staging-app-id>
SENDBIRD_API_TOKEN=<staging-api-token>
NOTIFICATION_PROVIDER=fake
ALERTS_WEBHOOK_URL=https://hooks.slack.com/services/staging-channel
```

### 6.3 프로덕션 (Production)

```
DB_URL=jdbc:mysql://prod-db:3306/cheonjiyeon?useSSL=true&serverTimezone=Asia/Seoul
DB_USER=cheonjiyeon_prod
DB_PASSWORD=<from-secrets-manager>
JWT_SECRET=<from-secrets-manager>
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<from-secrets-manager>
PAYMENT_PROVIDER=portone
PORTONE_API_KEY=<from-secrets-manager>
PORTONE_API_SECRET=<from-secrets-manager>
PORTONE_STORE_ID=<production-store-id>
PORTONE_WEBHOOK_SECRET=<from-secrets-manager>
CHAT_PROVIDER=sendbird
SENDBIRD_APP_ID=<production-app-id>
SENDBIRD_API_TOKEN=<from-secrets-manager>
NOTIFICATION_PROVIDER=http
NOTIFICATION_HTTP_BASE_URL=https://notification-provider.example.com
NOTIFICATION_HTTP_API_KEY=<from-secrets-manager>
ALERTS_WEBHOOK_URL=https://hooks.slack.com/services/prod-alerts
AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=false  # 프로덕션에서 반드시 false
```

---

## 7. CORS 설정

현재 `CorsConfig.java`는 `http://localhost:3000`만 허용합니다.

프로덕션 배포 시 반드시 변경:

```java
// CorsConfig.java
registry.addMapping("/api/**")
    .allowedOrigins(
        "https://cheonjiyeon.com",
        "https://www.cheonjiyeon.com"
    )
    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    .allowedHeaders("*");
```

환경변수로 분리 권장:

```yaml
# application.yml
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
```

---

## 7. Health Check

프로덕션 배포 후 health check 엔드포인트로 상태 확인:

```bash
# Backend actuator endpoint
curl http://localhost:8080/actuator/health

# 기대 응답:
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "redis": {"status": "UP"},
    "diskSpace": {"status": "UP"}
  }
}

# 애플리케이션 endpoints
curl http://localhost:8080/api/v1/counselors  # 상담사 목록
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/wallets/my  # 인증 확인
```

---

## 8. 환경변수 체크리스트

배포 전 반드시 확인:

- [ ] `JWT_SECRET` — 32자 이상, 프로덕션 고유값
- [ ] `DB_URL`, `DB_USER`, `DB_PASSWORD` — MySQL 연결 정보
- [ ] `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — Redis 연결 정보
- [ ] `PORTONE_API_KEY`, `PORTONE_API_SECRET`, `PORTONE_STORE_ID` — PortOne 계정 정보
- [ ] `PORTONE_WEBHOOK_SECRET` — 웹훅 검증 시크릿 (PortOne 대시보드에서 설정)
- [ ] `SENDBIRD_APP_ID`, `SENDBIRD_API_TOKEN` — Sendbird 앱 정보
- [ ] `ALERTS_WEBHOOK_URL` — Slack 웹훅 URL 유효성 확인
- [ ] `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=false` — 프로덕션에서 반드시 false
- [ ] CORS 설정 — `CorsConfig.java`에 프론트엔드 도메인 추가

---

## 9. Troubleshooting

### 8.1 Flyway 마이그레이션 실패

**증상**: 서버 시작 시 `FlywayException: Validate failed`

**해결**:
1. `flyway_schema_history` 테이블 확인
2. 실패한 마이그레이션 확인: `SELECT * FROM flyway_schema_history WHERE success = 0`
3. 필요 시 실패 레코드 삭제 후 재시도: `DELETE FROM flyway_schema_history WHERE success = 0`
4. 마이그레이션 파일 수정 후 `./gradlew bootRun`

### 8.2 DB 커넥션 거부

**증상**: `Communications link failure` 또는 `Connection refused`

**해결**:
1. `DB_URL` 호스트/포트 확인
2. MySQL 서비스 실행 상태 확인
3. 보안 그룹/방화벽에서 3306 포트 허용 확인
4. `DB_USER`/`DB_PASSWORD` 올바른지 확인
5. SSL 설정 필요 시 `useSSL=true` URL 파라미터 확인

### 8.3 JWT 인증 실패

**증상**: 모든 API에서 `401 로그인이 필요합니다` 반환

**해결**:
1. `JWT_SECRET`이 토큰 발급 시와 검증 시 동일한지 확인
2. 배포 시 환경변수가 올바르게 주입되었는지 확인
3. 토큰 만료 확인 (access: 6시간, refresh: 14일)
4. `Authorization: Bearer <token>` 헤더 형식 확인

### 8.4 결제 Provider 연결 실패

**증상**: `502 채팅방 재시도에 실패했습니다` 또는 결제 확정 실패

**해결**:
1. `*_PROVIDER=http`인지 확인
2. `*_HTTP_BASE_URL`이 올바른지 확인
3. `*_HTTP_API_KEY`가 유효한지 확인
4. 네트워크 연결 확인 (provider URL에 접근 가능한지)
5. `payment_status_logs` 테이블에서 사유 확인: `GET /api/v1/payments/{id}/logs`
6. 운영 타임라인에서 `postActionRetryNeeded` 확인
7. 필요 시 수동 재처리: `POST /api/v1/payments/{id}/retry-post-actions`

### 8.5 웹훅 수신 안 됨

**증상**: 결제 provider에서 웹훅을 보냈으나 상태 미변경

**해결**:
1. 웹훅 URL 확인: `POST /api/v1/payments/webhooks/provider`
2. `PAYMENT_WEBHOOK_SECRET` 일치 확인
3. 요청 헤더에 `X-Webhook-Secret` 포함 확인
4. 서버 로그에서 `payment webhook ignored` 메시지 확인 (이미 terminal 상태)
5. 방화벽/보안 그룹에서 provider IP 허용 확인

### 8.6 CORS 에러

**증상**: 브라우저에서 `Access-Control-Allow-Origin` 에러

**해결**:
1. `CorsConfig.java`의 `allowedOrigins`에 프론트엔드 도메인 추가
2. 프로토콜 포함 확인 (`https://` 필수)
3. 배포 후 서버 재시작

### 8.7 Next.js 빌드 실패

**증상**: `npm run build` 에러

**해결**:
1. Node.js 버전 확인 (18+ 필요)
2. `npm install` 재실행
3. TypeScript 에러 확인: `npx tsc --noEmit`
4. `node_modules` 삭제 후 재설치: `rm -rf node_modules && npm install`

### 9.8 알림 웹훅 미동작

**증상**: 장애 발생해도 Slack 알림 안 옴

**해결**:
1. `ALERTS_WEBHOOK_URL` 환경변수 설정 확인
2. URL이 유효한 Slack/Teams 웹훅 URL인지 확인
3. `AlertWebhookService`에서 예외를 무시하므로 (`catch (Exception ignored)`) 서버 로그에 표시되지 않음
4. 웹훅 URL을 curl로 직접 테스트: `curl -X POST -H "Content-Type: application/json" -d '{"text":"test"}' $ALERTS_WEBHOOK_URL`

### 9.9 Redis 연결 실패

**증상**: 서버 시작 시 `RedisConnectionFailureException`

**해결**:
1. `REDIS_HOST`, `REDIS_PORT` 확인
2. Redis 서비스 실행 상태 확인: `redis-cli -h <host> -p <port> PING`
3. `REDIS_PASSWORD` 올바른지 확인
4. 보안 그룹/방화벽에서 6379 포트 허용 확인
5. Redis 메모리 확인 (`INFO memory`)

### 9.10 PortOne 결제 실패

**증상**: 결제 검증 실패 또는 웹훅 수신 안 됨

**해결**:
1. `PORTONE_API_KEY`, `PORTONE_API_SECRET`, `PORTONE_STORE_ID` 올바른지 확인
2. PortOne 대시보드에서 가맹점 ID (imp_code) 확인
3. 웹훅 URL 등록 확인: `https://your-domain.com/api/v1/payments/portone/webhooks`
4. `PORTONE_WEBHOOK_SECRET`과 PortOne 대시보드 설정 일치 확인
5. 테스트 모드/프로덕션 모드 확인 (PortOne 대시보드 설정)

### 9.11 Sendbird 채팅방 생성 실패

**증상**: 결제 완료 후 채팅방 미생성

**해결**:
1. `SENDBIRD_APP_ID`, `SENDBIRD_API_TOKEN` 올바른지 확인
2. Sendbird 대시보드에서 API 토큰 유효성 확인
3. `payment_status_logs` 테이블에서 `chat_retry_needed` 확인
4. 수동 재처리: `POST /api/v1/payments/{id}/retry-post-actions`
5. Sendbird API 요청 로그 확인 (서버 로그에 `SendbirdChatProvider` 메시지)

### 9.12 분산 락 동시성 문제

**증상**: 지갑 잔액 불일치 또는 중복 차감

**해결**:
1. Redis 연결 확인 (분산 락은 Redis 필수)
2. `WalletService`에서 `@Transactional` + `LockService` 사용 확인
3. 락 타임아웃 설정 확인 (`LockService.acquire` 타임아웃: 5초)
4. Redis 메모리 부족 확인 (`INFO memory`)
5. 락 해제 실패 시 Redis에서 수동 삭제: `DEL lock:wallet:{walletId}`
