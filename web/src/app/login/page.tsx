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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const router = useRouter();
  const { refreshMe } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('login');
  const tc = useTranslations('common');

  async function handleSocialLogin(provider: 'kakao' | 'naver') {
    setSocialLoading(provider);
    setError('');
    try {
      // Dev mode: use mock token
      const mockToken = `mock_${provider}_token_${Date.now()}`;
      const res = await fetch(`${API_BASE}/api/v1/auth/oauth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: mockToken,
          deviceId: 'web-main',
          deviceName: navigator.userAgent.slice(0, 120),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? t('socialLoginFailed'));
        return;
      }
      setTokens(json.accessToken, json.refreshToken);
      await refreshMe();
      toast(t('loginSuccess'), 'success');
      router.push('/counselors');
    } catch {
      setError(t('serverError'));
    } finally {
      setSocialLoading(null);
    }
  }

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
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[rgba(201,162,39,0.15)]" />
              <span className="text-xs text-[#a49484]">{tc('or')}</span>
              <div className="flex-1 h-px bg-[rgba(201,162,39,0.15)]" />
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('kakao')}
                disabled={socialLoading !== null}
                className="w-full min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#FEE500', color: '#191919' }}
              >
                {socialLoading === 'kakao' ? t('kakaoLoading') : t('kakaoLogin')}
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('naver')}
                disabled={socialLoading !== null}
                className="w-full min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#03C75A', color: '#ffffff' }}
              >
                {socialLoading === 'naver' ? t('naverLoading') : t('naverLogin')}
              </button>
            </div>
          </div>
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
