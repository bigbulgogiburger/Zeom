# Step4 Provider 운영 런북

## 1) Provider 전환
- 기본: `fake`
- 실연동: `http`

```bash
PAYMENT_PROVIDER=http
CHAT_PROVIDER=http
NOTIFICATION_PROVIDER=http
```

## 2) 필수 환경변수
- 결제: `PAYMENT_HTTP_BASE_URL`, `PAYMENT_HTTP_API_KEY`, `PAYMENT_WEBHOOK_SECRET`
- 채팅: `CHAT_HTTP_BASE_URL`, `CHAT_HTTP_API_KEY`
- 알림: `NOTIFICATION_HTTP_BASE_URL`, `NOTIFICATION_HTTP_API_KEY`

## 3) 안정화 파라미터 (권장)
- `*_HTTP_CONNECT_TIMEOUT_MS=2000`
- `*_HTTP_READ_TIMEOUT_MS=4000`
- `*_HTTP_RETRY_ATTEMPTS=3`
- `*_HTTP_RETRY_BACKOFF_MS=200`

## 4) 결제 웹훅
- 엔드포인트: `POST /api/v1/payments/webhooks/provider`
- 헤더: `X-Webhook-Secret: ${PAYMENT_WEBHOOK_SECRET}`
- Body:
```json
{ "providerTxId": "tx_...", "eventType": "PAID|FAILED|CANCELED" }
```

## 5) 보상(Compensation) 정책
- 결제 확정(`PAID`)은 우선 저장.
- 이후 채팅방/알림 실패는 결제 롤백 없이 로그 사유 기록:
  - `chat_open_retry_needed`
  - `notification_retry_needed`
- 운영 알림은 `ALERTS_WEBHOOK_URL`로 전송.

## 6) 운영 점검
1. `GET /api/v1/payments/{id}` 상태 확인
2. `GET /api/v1/payments/{id}/logs` 전이 사유 확인
3. 운영 타임라인(`/admin/timeline`)에서 `재처리 필요` 표시 확인
4. 필요 시 `POST /api/v1/payments/{id}/retry-post-actions` 실행 (관리자)
5. 알림 웹훅 채널에서 실패 이벤트 확인
6. 외부 provider에서 재시도 후 웹훅 재전송
