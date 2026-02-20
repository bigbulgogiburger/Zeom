#!/bin/bash

# k6 Load Test Runner
# Runs all load test scenarios sequentially and prints a summary.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${BASE_URL:-http://localhost:8080}"

echo "============================================"
echo "  천지연꽃신당 부하 테스트"
echo "  Base URL: $BASE_URL"
echo "============================================"
echo ""

SCENARIOS=(
  "login-load"
  "counselor-browse"
  "booking-contention"
  "payment-flow"
)

RESULTS=()

for scenario in "${SCENARIOS[@]}"; do
  echo "--------------------------------------------"
  echo "  Running: $scenario"
  echo "--------------------------------------------"

  if k6 run --env BASE_URL="$BASE_URL" "$SCRIPT_DIR/scenarios/$scenario.js" 2>&1; then
    RESULTS+=("PASS: $scenario")
  else
    RESULTS+=("FAIL: $scenario")
  fi

  echo ""
done

echo "============================================"
echo "  Summary"
echo "============================================"
for result in "${RESULTS[@]}"; do
  echo "  $result"
done
echo "============================================"
