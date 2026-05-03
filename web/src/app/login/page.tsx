'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { API_BASE } from '../../components/api';
import { getDeviceId } from '../../components/auth-client';
import { useAuth } from '../../components/auth-context';
import { toast } from 'sonner';
import { FormField } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SocialLoginButtons } from '../../components/social-login-buttons';
import { trackEvent } from '../../components/analytics';
import { Eye, EyeOff } from 'lucide-react';
import { AuthCard } from '@/components/design';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshMe } = useAuth();
  const t = useTranslations('login');
  const tc = useTranslations('common');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const body = {
      email,
      password,
      deviceId: getDeviceId(),
      deviceName: navigator.userAgent.slice(0, 120),
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.message ?? t('loginFailed'));
        return;
      }
      await refreshMe();
      trackEvent('login', { method: 'email' });
      toast.success(t('loginSuccess'));
      router.push('/counselors');
    } catch {
      setLoading(false);
      setError(t('serverError'));
    }
  }

  return (
    <AuthCard>
      <div className="text-center mb-6">
        <p className="text-sm text-[hsl(var(--text-secondary))] m-0">
          {t('subtitle')}
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <FormField label={t('email')} required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="min-h-[48px] bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl focus:ring-2 focus:ring-[hsl(var(--gold))/0.3] focus:border-[hsl(var(--border-accent))]"
          />
        </FormField>

        <FormField label={t('password')} required>
          <div className="relative w-full">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              required
              autoComplete="current-password"
              className="min-h-[48px] pr-12 bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl focus:ring-2 focus:ring-[hsl(var(--gold))/0.3] focus:border-[hsl(var(--border-accent))]"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] min-h-0 h-auto p-2 hover:bg-transparent hover:text-[hsl(var(--gold))]"
              aria-label={showPassword ? tc('hide') : tc('view')}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </Button>
          </div>
        </FormField>

        {error && (
          <div className="mb-4">
            <Alert variant="destructive" className="border-[hsl(var(--destructive))]">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <Button
          type="submit"
          variant="gold-grad"
          size="lg"
          disabled={loading || !email || !password}
          className="w-full mt-6"
        >
          {loading ? '로그인 중...' : t('submit')}
        </Button>
      </form>

      <SocialLoginButtons mode="login" />

      <div className="text-center mt-8 flex flex-col gap-3">
        <div className="text-sm">
          <Link href="/forgot-password" className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--gold))] hover:underline transition-colors">
            {t('forgotPassword')}
          </Link>
        </div>
        <div className="text-sm text-[hsl(var(--text-secondary))]">
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-[hsl(var(--gold))] font-bold hover:underline transition-colors">
            {t('signupLink')}
          </Link>
        </div>
        <div>
          <Link
            href="/admin/login"
            className="text-[hsl(var(--text-muted))] text-xs font-normal opacity-60 hover:opacity-100 hover:text-[hsl(var(--gold))] hover:underline transition-all"
          >
            {t('adminLogin')}
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
