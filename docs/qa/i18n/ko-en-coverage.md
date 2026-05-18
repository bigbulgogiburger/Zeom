# i18n ko/en Coverage (ZEOM-9 P7-2)

> 측정일: 2026-05-17
> 도구: node `messages/{ko,en}.json` 직접 flatten 비교
> 정책: ko (기본) + en (보조). fallback OK — en 누락 시 ko 표시 허용

## 결과

| 항목 | 값 |
|------|---|
| ko 총 key | 162 |
| en 총 key | 162 |
| coverage | **100%** |
| en missing (ko-only) | **0** |
| en extra (en-only) | **0** |
| fallback 필요 페이지 | 없음 |

## 결론

`messages/ko.json` 과 `messages/en.json` 의 key set 이 **완전히 일치**. 본 라운드는 누락 카피 보강 작업이 불필요.

- ✅ DoD #9 (ko/en locale 모두 동작): PASS 후보
- ✅ Playwright `i18n-locale.spec.ts` 실측 보강 (Phase 5 후속 / 본 라운드 sample 실측 — production server 가동 필요)

## 후속 검증 명령

```bash
cd web
# locale 토글 스모크 (backend docker + npm run dev 가동 후)
npm run qa:i18n
```

## 분석 방법 (재현 가능)

```bash
cd web
node -e "
const ko = require('./messages/ko.json');
const en = require('./messages/en.json');
function flatKeys(obj, prefix='') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object') out.push(...flatKeys(v, key));
    else out.push(key);
  }
  return out;
}
const koKeys = new Set(flatKeys(ko));
const enKeys = new Set(flatKeys(en));
const missing = [...koKeys].filter(k => !enKeys.has(k));
console.log('ko keys:', koKeys.size, '/ en keys:', enKeys.size, '/ coverage:', Math.round(enKeys.size / koKeys.size * 100) + '%');
console.log('missing in en:', missing.length);
"
```
