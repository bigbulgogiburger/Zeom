'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { SocialLoginButtons } from '../../components/social-login-buttons';
import { trackEvent } from '../../components/analytics';

const YEARS = Array.from({ length: 71 }, (_, i) => 2010 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const TERMS_DETAIL: Record<string, string> = {
  terms: '제1조 (목적)\n이 약관은 천지연꽃신당(이하 "회사")이 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제2조 (정의)\n"서비스"란 회사가 제공하는 온라인 상담 예약 및 관련 부가서비스를 의미합니다.\n\n제3조 (약관의 효력)\n본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.',
  privacy: '1. 수집하는 개인정보 항목\n- 필수: 이메일, 이름, 비밀번호\n- 선택: 전화번호, 생년월일, 성별\n\n2. 개인정보의 수집 및 이용목적\n- 회원 가입 및 관리\n- 서비스 제공 및 상담 예약\n- 고지사항 전달\n\n3. 개인정보의 보유 및 이용기간\n- 회원 탈퇴 시까지 (법령에 의한 보존 의무 기간 제외)',
  marketing: '마케팅 정보 수신에 동의하시면 다음과 같은 혜택을 받으실 수 있습니다:\n- 신규 상담사 소개\n- 이벤트 및 할인 정보\n- 서비스 업데이트 안내\n\n수신 동의는 언제든지 철회하실 수 있습니다.',
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function ProgressIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const isCompleted = i < current;
        const isActive = i === current;
        const isPending = i > current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-heading transition-all',
                isActive && 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a]',
                isCompleted && 'bg-transparent border-2 border-[#C9A227] text-[#C9A227]',
                isPending && 'bg-transparent border-2 border-[#a49484]/40 text-[#a49484]',
              )}>
                {isCompleted ? '\u2713' : i + 1}
              </div>
              <span className={cn(
                'text-xs whitespace-nowrap tracking-wide',
                isPending ? 'text-[#a49484]/70' : 'text-foreground',
                isActive && 'font-bold text-[#C9A227]',
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-12 h-0.5 mx-3 mb-7 transition-colors',
                i < current ? 'bg-[#C9A227]' : 'bg-[#C9A227]/20',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshMe } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('signup');
  const tc = useTranslations('common');

  const STEPS = [t('steps.basicInfo'), t('steps.additionalInfo'), t('steps.terms')];

  // Step 1
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2
  const [phone, setPhone] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [gender, setGender] = useState('');

  // Step 3
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  // Step 1 validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const confirmValid = password === confirmPassword && confirmPassword.length > 0;
  const nameValid = name.trim().length >= 2;
  const step1Valid = emailValid && passwordValid && confirmValid && nameValid;

  // Step 1 errors (show only when field has been touched / has value)
  const emailError = email && !emailValid ? t('validation.emailInvalid') : '';
  const passwordError = password && !passwordValid ? t('validation.passwordMin') : '';
  const confirmError = confirmPassword && !confirmValid ? t('validation.passwordMismatch') : '';
  const nameError = name && !nameValid ? t('validation.nameMin') : '';

  // Step 3 validation
  const requiredTermsAgreed = termsAgreed && privacyAgreed;
  const allAgreed = termsAgreed && privacyAgreed && marketingAgreed;

  function handleAllTerms(checked: boolean) {
    setTermsAgreed(checked);
    setPrivacyAgreed(checked);
    setMarketingAgreed(checked);
  }

  function handlePhoneChange(value: string) {
    setPhone(formatPhone(value));
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    let birthDate: string | undefined;
    if (birthYear && birthMonth && birthDay) {
      birthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    }

    const body: Record<string, unknown> = {
      email,
      password,
      name: name.trim(),
      termsAgreed: true,
      deviceId: 'web-main',
      deviceName: navigator.userAgent.slice(0, 120),
    };
    if (phone) body.phone = phone;
    if (birthDate) body.birthDate = birthDate;
    if (gender && gender !== 'none') body.gender = gender;

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.message ?? t('signupFailed'));
        return;
      }
      setTokens(json.accessToken, json.refreshToken);
      await refreshMe();
      trackEvent('sign_up', { method: 'email' });
      toast(t('signupSuccessVerify'), 'success');
      router.push('/counselors');
    } catch {
      setLoading(false);
      setError(t('serverError'));
    }
  }

  const selectClass = "w-full min-h-[44px] rounded-xl border border-[rgba(201,162,39,0.15)] bg-[#1a1612] px-3 py-2 text-sm text-foreground appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20fill=%27%23a49484%27%20d=%27M6%208L1%203h10z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center py-24 px-6 bg-[#0f0d0a]"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,162,39,0.05) 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-[480px]">
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent font-heading m-0">
              {t('title')}
            </h1>
          </div>

          <ProgressIndicator current={step} steps={STEPS} />

          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div>
              <FormField label={t('email')} required error={emailError}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
                />
              </FormField>

              <FormField label={t('password')} required error={passwordError} hint={t('passwordHint')}>
                <div className="relative w-full">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    autoComplete="new-password"
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

              <FormField label={t('passwordConfirm')} required error={confirmError}>
                <div className="relative w-full">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('passwordConfirmPlaceholder')}
                    autoComplete="new-password"
                    className="min-h-[44px] pr-16 bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[#a49484] text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent hover:text-[#C9A227]"
                  >
                    {showConfirmPassword ? tc('hide') : tc('view')}
                  </Button>
                </div>
              </FormField>

              <FormField label={t('name')} required error={nameError}>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  autoComplete="name"
                  className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
                />
              </FormField>

              <ActionButton
                onClick={() => setStep(1)}
                disabled={!step1Valid}
                className="w-full mt-6"
              >
                {tc('next')}
              </ActionButton>
            </div>
          )}

          {/* Step 2: Additional Info */}
          {step === 1 && (
            <div>
              <FormField label={t('phone')} hint={t('phoneHint')}>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                  className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
                />
              </FormField>

              <FormField label={t('birthDate')} hint={t('birthDateHint')}>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t('year')}</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t('month')}</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t('day')}</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </FormField>

              <FormField label={t('gender')} hint={t('genderHint')}>
                <div className="flex gap-6 pt-1">
                  {([['male', t('male')], ['female', t('female')], ['none', t('noSelect')]] as const).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-1 cursor-pointer text-sm text-foreground">
                      <input
                        type="radio"
                        name="gender"
                        value={val}
                        checked={gender === val}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-[18px] h-[18px] cursor-pointer accent-[#C9A227]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </FormField>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1 min-h-[44px] font-bold font-heading rounded-full border-2 border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/10"
                >
                  {tc('previous')}
                </Button>
                <ActionButton
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  {tc('next')}
                </ActionButton>
              </div>
            </div>
          )}

          {/* Step 3: Terms */}
          {step === 2 && (
            <div>
              {/* Agree all */}
              <div className="border-b border-[rgba(201,162,39,0.15)] pb-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-base text-foreground py-2">
                  <Checkbox
                    checked={allAgreed}
                    onCheckedChange={(checked) => handleAllTerms(checked === true)}
                    className="w-5 h-5"
                  />
                  {t('agreeAll')}
                </label>
              </div>

              {/* Terms of service */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground py-2">
                    <Checkbox
                      checked={termsAgreed}
                      onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-destructive font-bold">{t('termsRequired')}</span> {t('termsOfService')}</span>
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setExpandedTerm(expandedTerm === 'terms' ? null : 'terms')}
                    className="text-[#a49484] text-xs underline min-h-0 h-auto px-1 hover:text-[#C9A227]"
                  >
                    {tc('view')}
                  </Button>
                </div>
                {expandedTerm === 'terms' && (
                  <div className="bg-[#1a1612] border border-[rgba(201,162,39,0.1)] rounded-xl p-3 text-xs text-[#a49484] leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
                    {TERMS_DETAIL.terms}
                  </div>
                )}
              </div>

              {/* Privacy policy */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground py-2">
                    <Checkbox
                      checked={privacyAgreed}
                      onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-destructive font-bold">{t('termsRequired')}</span> {t('privacyPolicy')}</span>
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setExpandedTerm(expandedTerm === 'privacy' ? null : 'privacy')}
                    className="text-[#a49484] text-xs underline min-h-0 h-auto px-1 hover:text-[#C9A227]"
                  >
                    {tc('view')}
                  </Button>
                </div>
                {expandedTerm === 'privacy' && (
                  <div className="bg-[#1a1612] border border-[rgba(201,162,39,0.1)] rounded-xl p-3 text-xs text-[#a49484] leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
                    {TERMS_DETAIL.privacy}
                  </div>
                )}
              </div>

              {/* Marketing consent */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground py-2">
                    <Checkbox
                      checked={marketingAgreed}
                      onCheckedChange={(checked) => setMarketingAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-[#a49484] font-bold">{t('termsOptional')}</span> {t('marketingConsent')}</span>
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setExpandedTerm(expandedTerm === 'marketing' ? null : 'marketing')}
                    className="text-[#a49484] text-xs underline min-h-0 h-auto px-1 hover:text-[#C9A227]"
                  >
                    {tc('view')}
                  </Button>
                </div>
                {expandedTerm === 'marketing' && (
                  <div className="bg-[#1a1612] border border-[rgba(201,162,39,0.1)] rounded-xl p-3 text-xs text-[#a49484] leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
                    {TERMS_DETAIL.marketing}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-3">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 min-h-[44px] font-bold font-heading rounded-full border-2 border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/10"
                >
                  {tc('previous')}
                </Button>
                <ActionButton
                  onClick={handleSubmit}
                  disabled={!requiredTermsAgreed}
                  loading={loading}
                  className="flex-1"
                >
                  {t('submit')}
                </ActionButton>
              </div>
            </div>
          )}

          {/* Social Login */}
          <SocialLoginButtons mode="signup" />
        </div>

        <div className="text-center mt-8 text-sm text-[#a49484]">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-[#C9A227] font-bold hover:underline hover:text-[#D4A843] transition-colors">
            {t('loginLink')}
          </Link>
        </div>
      </div>
    </main>
  );
}
