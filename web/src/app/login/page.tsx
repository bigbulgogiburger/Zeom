'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { API_BASE } from '../../components/api';
import { setTokens } from '../../components/auth-client';
import { useAuth } from '../../components/auth-context';
import { useToast } from '../../components/toast';
import { ActionButton, Card, FormField } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SocialLoginButtons } from '../../components/social-login-buttons';
import { trackEvent } from '../../components/analytics';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshMe } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('login');
  const tc = useTranslations('common');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const body = {
      email,
      password,
      deviceId: 'web-main',
      deviceName: navigator.userAgent.slice(0, 120),
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.message ?? t('loginFailed'));
        return;
      }
      setTokens(json.accessToken, json.refreshToken);
      await refreshMe();
      trackEvent('login', { method: 'email' });
      toast(t('loginSuccess'), 'success');
      router.push('/counselors');
    } catch {
      setLoading(false);
      setError(t('serverError'));
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f0d0a]"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,162,39,0.05) 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-[420px]">
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent font-heading m-0 mb-2">
              {t('title')}
            </h1>
            <p className="text-sm text-[#a49484] m-0">
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
                className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
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
                  className="min-h-[44px] pr-16 bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[#a49484] text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent hover:text-[#C9A227]"
                >
                  {showPassword ? tc('hide') : tc('view')}
                </Button>
              </div>
            </FormField>

            {error && (
              <div className="mb-4">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <ActionButton
              type="submit"
              loading={loading}
              disabled={!email || !password}
              className="w-full mt-6"
            >
              {t('submit')}
            </ActionButton>
          </form>

          {/* Social Login */}
          <SocialLoginButtons mode="login" />
        </div>

        <div className="text-center mt-8 flex flex-col gap-3">
          <div className="text-sm text-[#a49484]">
            <Link href="/forgot-password" className="text-[#a49484] hover:text-[#C9A227] hover:underline transition-colors">
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="text-sm text-[#a49484]">
            {t('noAccount')}{' '}
            <Link href="/signup" className="text-[#C9A227] font-bold hover:underline hover:text-[#D4A843] transition-colors">
              {t('signupLink')}
            </Link>
          </div>
          <div>
            <Link
              href="/admin/login"
              className="text-[#a49484] text-xs font-normal hover:text-[#C9A227] hover:underline transition-colors"
            >
              {t('adminLogin')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
