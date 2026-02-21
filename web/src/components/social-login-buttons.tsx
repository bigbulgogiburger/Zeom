'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { API_BASE } from './api';
import { setTokens } from './auth-client';
import { useAuth } from './auth-context';
import { useToast } from './toast';

interface SocialLoginButtonsProps {
  mode: 'login' | 'signup';
}

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshMe } = useAuth();
  const { toast } = useToast();
  const t = useTranslations(mode === 'login' ? 'login' : 'signup');
  const tc = useTranslations('common');

  async function handleSocialLogin(provider: 'kakao' | 'naver') {
    setSocialLoading(provider);
    setError('');
    try {
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
      toast(
        mode === 'login' ? t('loginSuccess') : t('signupSuccess'),
        'success',
      );
      router.push('/counselors');
    } catch {
      setError(t('serverError'));
    } finally {
      setSocialLoading(null);
    }
  }

  const kakaoLabel =
    mode === 'login' ? t('kakaoLogin') : t('kakaoSignup');
  const naverLabel =
    mode === 'login' ? t('naverLogin') : t('naverSignup');
  const kakaoLoadingLabel =
    mode === 'login' ? t('kakaoLoading') : t('kakaoLoading');
  const naverLoadingLabel =
    mode === 'login' ? t('naverLoading') : t('naverLoading');

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[rgba(201,162,39,0.15)]" />
        <span className="text-xs text-[#a49484]">{tc('or')}</span>
        <div className="flex-1 h-px bg-[rgba(201,162,39,0.15)]" />
      </div>

      {error && (
        <p className="text-sm text-destructive mb-3 text-center">{error}</p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('kakao')}
          disabled={socialLoading !== null}
          className="w-full min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#FEE500', color: '#191919' }}
        >
          {socialLoading === 'kakao' ? kakaoLoadingLabel : kakaoLabel}
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin('naver')}
          disabled={socialLoading !== null}
          className="w-full min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#03C75A', color: '#ffffff' }}
        >
          {socialLoading === 'naver' ? naverLoadingLabel : naverLabel}
        </button>
      </div>
    </div>
  );
}
