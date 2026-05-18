#!/usr/bin/env node
// ZEOM-9 Phase 7 — Lighthouse 측정 스크립트
// 사용: cd web && npm run qa:lighthouse
// 전제: production build (npm run build && npm run start) + backend docker 가동

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../../docs/qa/lighthouse');

const PAGES = [
  { name: 'home', url: 'http://localhost:3000/' },
  { name: 'login', url: 'http://localhost:3000/login' },
  { name: 'counselors', url: 'http://localhost:3000/counselors' },
  { name: 'counselors-id', url: 'http://localhost:3000/counselors/1' },
  { name: 'cash-buy', url: 'http://localhost:3000/cash/buy' },
  { name: 'bookings-me', url: 'http://localhost:3000/bookings/me' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'consultation-room', url: 'http://localhost:3000/consultation/e2e-session/room' },
  { name: 'consultation-review', url: 'http://localhost:3000/consultation/e2e-session/review' },
];

async function run() {
  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');

  await mkdir(OUT_DIR, { recursive: true });
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });

  const opts = {
    port: chrome.port,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 2,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    emulatedUserAgent: false,
  };

  const summary = [];

  for (const p of PAGES) {
    process.stdout.write(`▶ ${p.name} (${p.url}) ... `);
    try {
      const r = await lighthouse(p.url, opts);
      await writeFile(resolve(OUT_DIR, `${p.name}.json`), r.report);
      const scores = {
        performance: Math.round((r.lhr.categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((r.lhr.categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((r.lhr.categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((r.lhr.categories.seo?.score ?? 0) * 100),
        lcp: r.lhr.audits['largest-contentful-paint']?.numericValue ?? 0,
        cls: r.lhr.audits['cumulative-layout-shift']?.numericValue ?? 0,
      };
      summary.push({ page: p.name, url: p.url, ...scores });
      console.log(
        `Perf=${scores.performance} A11y=${scores.accessibility} BP=${scores.bestPractices} SEO=${scores.seo} LCP=${Math.round(scores.lcp)}ms CLS=${scores.cls.toFixed(3)}`,
      );
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      summary.push({ page: p.name, url: p.url, error: String(err) });
    }
  }

  await writeFile(resolve(OUT_DIR, '_summary.json'), JSON.stringify(summary, null, 2));
  await chrome.kill();

  // 합격 기준 점검
  const failed = summary.filter(
    (s) =>
      s.error ||
      s.performance < 90 ||
      s.accessibility < 90 ||
      s.bestPractices < 90 ||
      s.seo < 90 ||
      s.lcp > 2500 ||
      s.cls > 0.05,
  );

  console.log('\n=== Lighthouse 종합 ===');
  console.log(`총 ${summary.length} 페이지 / 합격 기준 미달 ${failed.length}건`);
  if (failed.length > 0) {
    for (const f of failed) {
      console.log(`  ⚠️ ${f.page}: ${f.error ?? JSON.stringify(f)}`);
    }
    process.exit(1);
  } else {
    console.log('  ✅ 9 P0 페이지 모두 합격 기준 통과');
  }
}

run().catch((err) => {
  console.error('Lighthouse 실행 실패:', err);
  process.exit(2);
});
