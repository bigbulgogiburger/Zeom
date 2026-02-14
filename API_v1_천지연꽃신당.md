# API v1 초안 — 천지연꽃신당

## Auth
- POST `/api/v1/auth/signup`
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/logout`
- GET `/api/v1/me`

## Counselors
- GET `/api/v1/counselors` (필터/정렬)
- GET `/api/v1/counselors/{counselorId}`
- GET `/api/v1/counselors/{counselorId}/slots?from=&to=`

## Reservations
- POST `/api/v1/reservations`  
  - body: counselorId, slotId, channel
- GET `/api/v1/reservations/me`
- GET `/api/v1/reservations/{reservationId}`
- POST `/api/v1/reservations/{reservationId}/cancel`

## Session (Sendbird)
- POST `/api/v1/reservations/{reservationId}/session-token`
- POST `/api/v1/sessions/{sessionId}/start`
- POST `/api/v1/sessions/{sessionId}/end`

## Products/Cash
- GET `/api/v1/products/cash`
- GET `/api/v1/wallet`
- GET `/api/v1/wallet/transactions`

## Payments (PortOne/KG)
- POST `/api/v1/payments/prepare`
- POST `/api/v1/payments/confirm`
- POST `/api/v1/payments/webhook/portone`
- GET `/api/v1/payments/me`

## Refunds
- POST `/api/v1/refunds`
- GET `/api/v1/refunds/me`

## Reviews/Disputes
- POST `/api/v1/reservations/{reservationId}/reviews`
- GET `/api/v1/counselors/{counselorId}/reviews`
- POST `/api/v1/disputes`
- GET `/api/v1/disputes/me`

## Admin
- GET `/api/v1/admin/reservations`
- GET `/api/v1/admin/payments`
- POST `/api/v1/admin/refunds/{refundId}/approve`
- POST `/api/v1/admin/refunds/{refundId}/reject`
- POST `/api/v1/admin/cash/adjust`
