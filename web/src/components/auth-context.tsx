'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api-client';

type Me = { id: number; email: string; name: string; role: 'USER' | 'ADMIN' } | null;

type AuthContextValue = {
  me: Me;
  loading: boolean;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  me: null,
  loading: true,
  refreshMe: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/v1/auth/me', { cache: 'no-store' });
      if (!r.ok) {
        setMe(null);
      } else {
        setMe(await r.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const value = useMemo(() => ({ me, loading, refreshMe }), [me, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
