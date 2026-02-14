'use client';

import { useEffect, useState } from 'react';
import { clearTokens } from './auth-client';

export default function SessionExpiryGuard() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onExpired = () => setOpen(true);
    window.addEventListener('auth:expired', onExpired as EventListener);
    return () => window.removeEventListener('auth:expired', onExpired as EventListener);
  }, []);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
      <div style={{ background: '#111827', border: '1px solid #334155', borderRadius: 12, padding: 20, width: 320 }}>
        <h3>세션이 만료되었습니다</h3>
        <p>보안을 위해 자동 로그아웃 되었습니다. 다시 로그인해주세요.</p>
        <button onClick={() => { clearTokens(); window.location.href = '/login'; }}>로그인으로 이동</button>
      </div>
    </div>
  );
}
