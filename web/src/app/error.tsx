'use client';

import { useEffect } from 'react';
import { Card } from '../components/ui';
import { reportError } from '../components/error-reporter';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, 'critical', { digest: error.digest, source: 'error.tsx' });
  }, [error]);

  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <Card>
        <h3 style={{ marginTop: 0, color: '#fca5a5' }}>오류가 발생했습니다</h3>
        <p style={{ color: '#94a3b8' }}>
          예상치 못한 문제가 발생했습니다. 다시 시도하거나 홈으로 이동해주세요.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre style={{ fontSize: 12, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error.message}
          </pre>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={reset} style={{ minHeight: 40, padding: '0 12px' }}>
            다시 시도
          </button>
          <button onClick={() => window.location.href = '/'} style={{ minHeight: 40, padding: '0 12px' }}>
            홈으로
          </button>
        </div>
      </Card>
    </main>
  );
}
