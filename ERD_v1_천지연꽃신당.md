# ERD v1 — 천지연꽃신당

## 1) 핵심 엔티티

### users
- id (PK)
- email (unique)
- password_hash
- name
- phone
- role (USER/COUNSELOR/ADMIN)
- status (ACTIVE/INACTIVE/BLOCKED)
- created_at, updated_at

### counselors
- id (PK)
- user_id (FK -> users.id)
- display_name
- intro
- specialties (json)
- rating_avg
- review_count
- is_active
- created_at, updated_at

### counselor_schedule_slots
- id (PK)
- counselor_id (FK)
- slot_start_at
- slot_end_at
- status (OPEN/BOOKED/BLOCKED)
- created_at, updated_at
- unique(counselor_id, slot_start_at)

### reservations
- id (PK)
- user_id (FK)
- counselor_id (FK)
- slot_id (FK)
- channel (VIDEO/VOICE)
- status (RESERVED/CANCELED/COMPLETED/NO_SHOW)
- cash_hold_tx_id (FK -> cash_transactions.id)
- cancel_reason
- created_at, updated_at

### consultation_sessions
- id (PK)
- reservation_id (FK)
- sendbird_room_id
- started_at
- ended_at
- duration_sec
- end_reason (NORMAL/TIMEOUT/NETWORK/ADMIN)
- created_at, updated_at

### wallets
- id (PK)
- user_id (FK unique)
- balance_cash
- updated_at

### cash_transactions
- id (PK)
- user_id (FK)
- type (CHARGE/HOLD/CONFIRM/REFUND/ADJUST)
- amount
- balance_after
- ref_type (PAYMENT/RESERVATION/ADMIN)
- ref_id
- idempotency_key (unique nullable)
- created_at

### products
- id (PK)
- name
- minutes (기본 60)
- cash_amount
- price_krw
- is_active
- created_at, updated_at

### payments
- id (PK)
- user_id (FK)
- product_id (FK)
- portone_payment_id
- pg_provider (KG_INICIS)
- status (READY/PAID/FAILED/CANCELED)
- amount_krw
- paid_at
- created_at, updated_at

### payment_webhooks
- id (PK)
- payment_id (FK)
- provider_event_id (unique)
- raw_payload (json)
- processed_at
- result

### refunds
- id (PK)
- payment_id (FK)
- reservation_id (FK nullable)
- reason
- refund_amount_krw
- status (REQUESTED/APPROVED/REJECTED/DONE)
- requested_by
- processed_by
- created_at, updated_at

### reviews
- id (PK)
- reservation_id (FK unique)
- user_id (FK)
- counselor_id (FK)
- rating (1~5)
- comment
- created_at, updated_at

### disputes
- id (PK)
- reservation_id (FK)
- user_id (FK)
- type
- detail
- status (OPEN/IN_PROGRESS/RESOLVED/CLOSED)
- created_at, updated_at

---

## 2) 관계 요약
- users 1:N reservations
- users 1:1 wallets
- users 1:N payments
- users 1:N cash_transactions
- counselors 1:N counselor_schedule_slots
- counselors 1:N reservations
- reservations 1:1 consultation_sessions
- reservations 1:0..1 reviews
- payments 1:N payment_webhooks
- payments 1:N refunds

---

## 3) 인덱스 권장
- reservations(user_id, created_at desc)
- reservations(counselor_id, created_at desc)
- counselor_schedule_slots(counselor_id, slot_start_at)
- consultation_sessions(reservation_id)
- cash_transactions(user_id, created_at desc)
- payments(user_id, created_at desc)
- payments(portone_payment_id unique)
