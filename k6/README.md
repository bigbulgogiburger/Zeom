# k6 부하 테스트

천지연꽃신당 백엔드 API 부하 테스트 스크립트입니다.

## k6 설치

### macOS
```bash
brew install k6
```

### Linux
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Docker
```bash
docker pull grafana/k6
```

## 사전 조건

- 백엔드 서버가 실행 중이어야 합니다 (기본: `http://localhost:8080`)
- `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true` 설정 권장 (테스트 데이터 자동 생성)

## 개별 테스트 실행

```bash
# 로그인 부하 테스트 (100 VU)
k6 run k6/scenarios/login-load.js

# 상담사 브라우징 (50 VU)
k6 run k6/scenarios/counselor-browse.js

# 예약 동시성 (20 VU, 같은 슬롯 경합)
k6 run k6/scenarios/booking-contention.js

# 결제 플로우 (10 VU)
k6 run k6/scenarios/payment-flow.js
```

### 커스텀 서버 URL

```bash
k6 run --env BASE_URL=http://your-server:8080 k6/scenarios/login-load.js
```

## 전체 테스트 실행

```bash
chmod +x k6/run-all.sh
./k6/run-all.sh
```

커스텀 URL:
```bash
BASE_URL=http://your-server:8080 ./k6/run-all.sh
```

## 시나리오 요약

| 시나리오 | VU | 설명 | 성공 기준 |
|---------|-----|------|----------|
| login-load | 100 | 동시 로그인 | P95 < 500ms, 에러율 < 1% |
| counselor-browse | 50 | 상담사 목록/상세 조회 | P95 < 500ms |
| booking-contention | 20 | 동일 슬롯 예약 경합 | 1건만 성공, 나머지 적절한 에러 |
| payment-flow | 10 | 지갑 충전 및 조회 | P95 < 500ms |

## 결과 해석

k6 실행 후 출력되는 주요 지표:

- `http_req_duration`: 요청 응답 시간 (P50, P90, P95, P99)
- `http_req_failed`: 실패율
- `http_reqs`: 초당 처리량 (RPS)
- `vus`: 동시 가상 사용자 수

### 임계값 초과 시

P95가 500ms를 초과하거나 에러율이 1%를 넘으면:
1. 서버 리소스 (CPU, 메모리) 확인
2. DB 쿼리 성능 확인 (slow query log)
3. 커넥션 풀 설정 확인
4. Redis 캐시 적용 여부 확인
