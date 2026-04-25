'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { API_BASE } from '../../components/api';
import { getDeviceId } from '../../components/auth-client';
import { useAuth } from '../../components/auth-context';
import { toast } from 'sonner';
import { ActionButton, FormField } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { SocialLoginButtons } from '../../components/social-login-buttons';
import { trackEvent } from '../../components/analytics';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

const YEARS = Array.from({ length: 71 }, (_, i) => 2010 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const BIRTH_HOURS = [
  { value: '자시', label: '자시 (쥐) 23:30~01:30' },
  { value: '축시', label: '축시 (소) 01:30~03:30' },
  { value: '인시', label: '인시 (호랑이) 03:30~05:30' },
  { value: '묘시', label: '묘시 (토끼) 05:30~07:30' },
  { value: '진시', label: '진시 (용) 07:30~09:30' },
  { value: '사시', label: '사시 (뱀) 09:30~11:30' },
  { value: '오시', label: '오시 (말) 11:30~13:30' },
  { value: '미시', label: '미시 (양) 13:30~15:30' },
  { value: '신시', label: '신시 (원숭이) 15:30~17:30' },
  { value: '유시', label: '유시 (닭) 17:30~19:30' },
  { value: '술시', label: '술시 (개) 19:30~21:30' },
  { value: '해시', label: '해시 (돼지) 21:30~23:30' },
  { value: 'unknown', label: '모름' },
];

const TERMS_DETAIL: Record<string, string> = {
  terms: '제1조 (목적)\n이 약관은 천지연꽃신당(이하 "회사")이 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제2조 (정의)\n"서비스"란 회사가 제공하는 온라인 상담 예약 및 관련 부가서비스를 의미합니다.\n\n제3조 (약관의 효력)\n본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.',
  privacy: '1. 수집하는 개인정보 항목\n- 필수: 이메일, 이름, 비밀번호, 생년월일, 태어난 시간, 성별\n- 선택: 전화번호\n\n2. 개인정보의 수집 및 이용목적\n- 회원 가입 및 관리\n- 서비스 제공 및 상담 예약\n- 운세 서비스 제공\n- 고지사항 전달\n\n3. 개인정보의 보유 및 이용기간\n- 회원 탈퇴 시까지 (법령에 의한 보존 의무 기간 제외)',
  marketing: '마케팅 정보 수신에 동의하시면 다음과 같은 혜택을 받으실 수 있습니다:\n- 신규 상담사 소개\n- 이벤트 및 할인 정보\n- 서비스 업데이트 안내\n\n수신 동의는 언제든지 철회하실 수 있습니다.',
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function ProgressBar({ current, steps }: { current: number; steps: string[] }) {
  const progress = ((current + 1) / steps.length) * 100;
  return (
    <div className="mb-8">
      <div className="h-1 bg-[hsl(var(--border-subtle))] rounded-full overflow-hidden">
        <div
          className="h-full bg-[hsl(var(--gold))] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        {steps.map((label, i) => (
          <span
            key={label}
            className={cn(
              'text-xs transition-colors',
              i === current
                ? 'text-[hsl(var(--gold))] font-bold'
                : i < current
                  ? 'text-[hsl(var(--text-secondary))]'
                  : 'text-[hsl(var(--text-muted))]',
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshMe } = useAuth();
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
  const [birthHour, setBirthHour] = useState('');
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
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

  // Step 2 validation
  const birthDateFilled = birthYear && birthMonth && birthDay;
  const birthHourFilled = birthHour !== '';
  const genderFilled = gender === 'male' || gender === 'female';
  const step2Valid = !!birthDateFilled && birthHourFilled && genderFilled;

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
      deviceId: getDeviceId(),
      deviceName: navigator.userAgent.slice(0, 120),
    };
    if (phone) body.phone = phone;
    if (birthDate) body.birthDate = birthDate;
    if (birthHour) body.birthHour = birthHour;
    if (gender && gender !== 'none') body.gender = gender;
    body.calendarType = calendarType;
    if (calendarType === 'lunar') body.isLeapMonth = isLeapMonth;

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.message ?? t('signupFailed'));
        return;
      }
      await refreshMe();
      trackEvent('sign_up', { method: 'email' });
      toast.success(t('signupSuccessVerify'));
      router.push('/counselors');
    } catch {
      setLoading(false);
      setError(t('serverError'));
    }
  }

  const selectClass = cn(
    "w-full min-h-[48px] rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--text-primary))] appearance-none",
    "bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20fill=%27%23C9A227%27%20d=%27M6%208L1%203h10z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8",
    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))/0.3] focus:border-[hsl(var(--border-accent))]",
  );

  const inputClass = "min-h-[48px] bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl focus:ring-2 focus:ring-[hsl(var(--gold))/0.3] focus:border-[hsl(var(--border-accent))]";

  return (
    <main
      className="min-h-[100dvh] flex flex-col items-center justify-center py-24 px-6 bg-[hsl(var(--background))]"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, hsl(var(--gold) / 0.04) 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-[480px]">
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--gold))] font-heading m-0">
              {t('title')}
            </h1>
          </div>

          <ProgressBar current={step} steps={STEPS} />

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
                  className={inputClass}
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
                    className={cn(inputClass, 'pr-12')}
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

              <FormField label={t('passwordConfirm')} required error={confirmError}>
                <div className="relative w-full">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('passwordConfirmPlaceholder')}
                    autoComplete="new-password"
                    className={cn(inputClass, 'pr-12')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] min-h-0 h-auto p-2 hover:bg-transparent hover:text-[hsl(var(--gold))]"
                    aria-label={showConfirmPassword ? tc('hide') : tc('view')}
                  >
                    {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
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
                  className={inputClass}
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

          {/* Step 2: Saju Birth Info */}
          {step === 1 && (
            <div>
              <p className="text-sm text-[hsl(var(--gold))] text-center mb-6 leading-relaxed">
                {t('sajuInfoHeader')}
              </p>

              <FormField label={t('birthDate')} required hint={t('birthDateHint')}>
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

              <FormField label={t('calendarType')} required>
                <div className="flex items-center gap-3 pt-1">
                  <div className="inline-flex bg-[hsl(var(--background))] rounded-full p-1 border border-[hsl(var(--border-subtle))]">
                    <button
                      type="button"
                      onClick={() => { setCalendarType('solar'); setIsLeapMonth(false); }}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-sm transition-all',
                        calendarType === 'solar'
                          ? 'bg-[hsl(var(--gold))] text-[hsl(var(--background))] font-bold'
                          : 'text-[hsl(var(--text-secondary))]',
                      )}
                    >
                      {t('calendarSolar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarType('lunar')}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-sm transition-all',
                        calendarType === 'lunar'
                          ? 'bg-[hsl(var(--gold))] text-[hsl(var(--background))] font-bold'
                          : 'text-[hsl(var(--text-secondary))]',
                      )}
                    >
                      {t('calendarLunar')}
                    </button>
                  </div>
                  {calendarType === 'lunar' && (
                    <label className="flex items-center gap-1 cursor-pointer text-sm text-[hsl(var(--text-primary))]">
                      <Checkbox
                        checked={isLeapMonth}
                        onCheckedChange={(checked) => setIsLeapMonth(checked === true)}
                        className="w-[18px] h-[18px]"
                      />
                      {t('leapMonth')}
                    </label>
                  )}
                </div>
              </FormField>

              <FormField label={t('birthHour')} required hint={t('birthHourHint')}>
                <select
                  value={birthHour}
                  onChange={(e) => setBirthHour(e.target.value)}
                  className={selectClass}
                >
                  <option value="">-- {t('birthHour')} --</option>
                  {BIRTH_HOURS.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={t('gender')} required hint={t('genderHint')}>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {([['male', t('male')], ['female', t('female')]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGender(val)}
                      className={cn(
                        'flex-1 p-4 rounded-xl border-2 text-center cursor-pointer text-sm font-bold transition-all',
                        gender === val
                          ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))/0.08] text-[hsl(var(--gold))]'
                          : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--border-accent))/0.4]',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label={t('phone')} hint={t('phoneHint')}>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                  className={inputClass}
                />
              </FormField>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1 min-h-[48px] font-bold font-heading rounded-full border-2 border-[hsl(var(--border-accent))/0.3] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))/0.08] bg-transparent"
                >
                  {tc('previous')}
                </Button>
                <ActionButton
                  onClick={() => setStep(2)}
                  disabled={!step2Valid}
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
              <div className="border-b border-[hsl(var(--border-subtle))] pb-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-base text-[hsl(var(--text-primary))] py-2">
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
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[hsl(var(--text-primary))] py-2">
                    <Checkbox
                      checked={termsAgreed}
                      onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-[hsl(var(--destructive))] font-bold">{t('termsRequired')}</span> {t('termsOfService')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpandedTerm(expandedTerm === 'terms' ? null : 'terms')}
                    className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--gold))] transition-colors p-1"
                    aria-label={tc('view')}
                  >
                    <ChevronDown className={cn(
                      'size-4 transition-transform duration-200',
                      expandedTerm === 'terms' && 'rotate-180',
                    )} />
                  </button>
                </div>
                {expandedTerm === 'terms' && (
                  <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl p-3 text-xs text-[hsl(var(--text-secondary))] leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
                    {TERMS_DETAIL.terms}
                  </div>
                )}
              </div>

              {/* Privacy policy */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[hsl(var(--text-primary))] py-2">
                    <Checkbox
                      checked={privacyAgreed}
                      onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-[hsl(var(--destructive))] font-bold">{t('termsRequired')}</span> {t('privacyPolicy')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpandedTerm(expandedTerm === 'privacy' ? null : 'privacy')}
                    className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--gold))] transition-colors p-1"
                    aria-label={tc('view')}
                  >
                    <ChevronDown className={cn(
                      'size-4 transition-transform duration-200',
                      expandedTerm === 'privacy' && 'rotate-180',
                    )} />
                  </button>
                </div>
                {expandedTerm === 'privacy' && (
                  <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl p-3 text-xs text-[hsl(var(--text-secondary))] leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
                    {TERMS_DETAIL.privacy}
                  </div>
                )}
              </div>

              {/* Marketing consent */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[hsl(var(--text-primary))] py-2">
                    <Checkbox
                      checked={marketingAgreed}
                      onCheckedChange={(checked) => setMarketingAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-[hsl(var(--text-muted))] font-bold">{t('termsOptional')}</span> {t('marketingConsent')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpandedTerm(expandedTerm === 'marketing' ? null : 'marketing')}
                    className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--gold))] transition-colors p-1"
                    aria-label={tc('view')}
                  >
                    <ChevronDown className={cn(
                      'size-4 transition-transform duration-200',
                      expandedTerm === 'marketing' && 'rotate-180',
                    )} />
                  </button>
                </div>
                {expandedTerm === 'marketing' && (
                  <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl p-3 text-xs text-[hsl(var(--text-secondary))] leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
                    {TERMS_DETAIL.marketing}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-3">
                  <Alert variant="destructive" className="border-[hsl(var(--destructive))]">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 min-h-[48px] font-bold font-heading rounded-full border-2 border-[hsl(var(--border-accent))/0.3] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))/0.08] bg-transparent"
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

        <div className="text-center mt-8 text-sm text-[hsl(var(--text-secondary))]">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-[hsl(var(--gold))] font-bold hover:underline transition-colors">
            {t('loginLink')}
          </Link>
        </div>
      </div>
    </main>
  );
}
