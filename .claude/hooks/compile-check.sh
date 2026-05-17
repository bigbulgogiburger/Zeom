#!/usr/bin/env bash
# zeom monorepo compile-check — backend Entity 변경 시 compileJava, 모든 변경 파일 추적
HARNESS_MODE="${HARNESS_MODE:-suggest}"
[[ "$HARNESS_MODE" == "off" ]] && exit 0
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)".*/\1/' 2>/dev/null || echo "")
[[ -z "$FILE_PATH" ]] && exit 0

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Backend Entity 변경 감지 — 패키지 구조가 package-by-feature이므로 파일명/내용 기반
if echo "$FILE_PATH" | grep -qE "backend/.*\.java$"; then
  BASENAME=$(basename "$FILE_PATH")
  if echo "$BASENAME" | grep -qE "Entity\.java$" || \
     ([[ -f "$FILE_PATH" ]] && grep -qE "^\s*@Entity\b" "$FILE_PATH" 2>/dev/null); then
    echo "[Harness] Entity 수정 감지. compileJava 실행..." >&2
    (cd "$REPO_ROOT/backend" && ./gradlew compileJava -q 2>&1) || true
  fi
fi

# 모든 관련 파일 추적
if echo "$FILE_PATH" | grep -qE "\.(java|kt|ts|tsx|jsx|dart|sql)$"; then
  mkdir -p "$REPO_ROOT/.claude/runtime"
  echo "$FILE_PATH" >> "$REPO_ROOT/.claude/runtime/changed-files.txt"
  sort -u "$REPO_ROOT/.claude/runtime/changed-files.txt" -o "$REPO_ROOT/.claude/runtime/changed-files.txt"
fi
exit 0
