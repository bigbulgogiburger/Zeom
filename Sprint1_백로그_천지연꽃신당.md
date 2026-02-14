# Sprint 1 백로그 (2주)

목표: 회원/상담사 조회/슬롯 예약의 뼈대를 완성한다.

## P0 (필수)
1. 프로젝트 모노레포 초기 세팅
   - backend(Spring Boot 3.5, Java21)
   - web(Next.js)
   - app(Flutter 기본 구조)

2. 인증/권한
   - 회원가입/로그인/JWT
   - USER/COUNSELOR/ADMIN role 기본 미들웨어

3. 상담사 도메인
   - 상담사 목록/상세 API
   - 검색/필터 기본(카테고리, 정렬)

4. 슬롯/예약 도메인
   - 슬롯 조회 API
   - 예약 생성 API(중복 예약 방지)
   - 예약 내역 조회 API

5. DB 스키마 v1
   - users, counselors, slots, reservations, wallets, cash_transactions, products
   - Flyway 마이그레이션

6. 기본 UI
   - 웹: 홈/상담사목록/상담사상세/예약
   - 앱: 동일 기능 최소 화면

## P1 (여유 시)
1. Redis 락으로 슬롯 경쟁 제어
2. 예약 취소 API
3. 관리자 조회(예약 리스트)

## 완료 기준(DoD)
- API 테스트 통과
- 예약 중복 생성 방지 검증 완료
- 웹에서 상담사 선택 후 예약 생성 가능
- 배포 가능한 dev 환경 문서화(.env.example 포함)

## 산출물
- ERD v1
- OpenAPI 초안
- Sprint1 데모 시나리오 1개
