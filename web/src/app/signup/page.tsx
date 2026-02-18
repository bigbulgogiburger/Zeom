'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

const STEPS = ['기본 정보', '추가 정보', '약관 동의'] as const;

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

function ProgressIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const isCompleted = i < current;
        const isActive = i === current;
        const isPending = i > current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-heading transition-all',
                isActive && 'bg-primary text-primary-foreground',
                isCompleted && 'bg-transparent border-2 border-primary text-primary',
                isPending && 'bg-transparent border-2 border-muted-foreground text-muted-foreground',
              )}>
                {isCompleted ? '\u2713' : i + 1}
              </div>
              <span className={cn(
                'text-xs whitespace-nowrap',
                isPending ? 'text-muted-foreground' : 'text-card-foreground',
                isActive && 'font-bold',
              )}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'w-12 h-0.5 mx-2 mb-6 transition-colors',
                i < current ? 'bg-primary' : 'bg-muted-foreground/30',
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
  const emailError = email && !emailValid ? '올바른 이메일 형식을 입력해주세요' : '';
  const passwordError = password && !passwordValid ? '비밀번호는 8자 이상이어야 합니다' : '';
  const confirmError = confirmPassword && !confirmValid ? '비밀번호가 일치하지 않습니다' : '';
  const nameError = name && !nameValid ? '이름은 2자 이상 입력해주세요' : '';

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
        setError(json.message ?? '회원가입에 실패했습니다');
        return;
      }
      setTokens(json.accessToken, json.refreshToken);
      await refreshMe();
      toast('회원가입이 완료되었습니다!', 'success');
      router.push('/counselors');
    } catch {
      setLoading(false);
      setError('서버에 연결할 수 없습니다');
    }
  }

  const selectClass = "w-full min-h-[44px] rounded-md border-2 border-input bg-background px-3 py-2 text-sm text-card-foreground appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20fill=%27%236b6157%27%20d=%27M6%208L1%203h10z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] pr-8";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px]">
        <Card>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary font-heading m-0">
              천지연꽃신당
            </h1>
          </div>

          <ProgressIndicator current={step} />

          {/* Step 1: 기본 정보 */}
          {step === 0 && (
            <div>
              <FormField label="이메일" required error={emailError}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="min-h-[44px]"
                />
              </FormField>

              <FormField label="비밀번호" required error={passwordError} hint="8자 이상 입력해주세요">
                <div className="relative w-full">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    autoComplete="new-password"
                    className="min-h-[44px] pr-16"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent"
                  >
                    {showPassword ? '숨기기' : '보기'}
                  </Button>
                </div>
              </FormField>

              <FormField label="비밀번호 확인" required error={confirmError}>
                <div className="relative w-full">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 확인"
                    autoComplete="new-password"
                    className="min-h-[44px] pr-16"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent"
                  >
                    {showConfirmPassword ? '숨기기' : '보기'}
                  </Button>
                </div>
              </FormField>

              <FormField label="이름" required error={nameError}>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름"
                  autoComplete="name"
                  className="min-h-[44px]"
                />
              </FormField>

              <ActionButton
                onClick={() => setStep(1)}
                disabled={!step1Valid}
                className="w-full mt-2"
              >
                다음
              </ActionButton>
            </div>
          )}

          {/* Step 2: 추가 정보 */}
          {step === 1 && (
            <div>
              <FormField label="전화번호" hint="선택 사항입니다">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                  className="min-h-[44px]"
                />
              </FormField>

              <FormField label="생년월일" hint="선택 사항입니다">
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">년</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">월</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">일</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}일</option>
                    ))}
                  </select>
                </div>
              </FormField>

              <FormField label="성별" hint="선택 사항입니다">
                <div className="flex gap-6 pt-1">
                  {([['male', '남성'], ['female', '여성'], ['none', '선택안함']] as const).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-1 cursor-pointer text-sm text-card-foreground">
                      <input
                        type="radio"
                        name="gender"
                        value={val}
                        checked={gender === val}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-[18px] h-[18px] cursor-pointer accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </FormField>

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1 min-h-[44px] font-bold font-heading"
                >
                  이전
                </Button>
                <ActionButton
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  다음
                </ActionButton>
              </div>
            </div>
          )}

          {/* Step 3: 약관 동의 */}
          {step === 2 && (
            <div>
              {/* 전체 동의 */}
              <div className="border-b-2 border-input pb-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-base text-card-foreground py-2">
                  <Checkbox
                    checked={allAgreed}
                    onCheckedChange={(checked) => handleAllTerms(checked === true)}
                    className="w-5 h-5"
                  />
                  전체 동의
                </label>
              </div>

              {/* 이용약관 */}
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-card-foreground py-2">
                    <Checkbox
                      checked={termsAgreed}
                      onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-destructive font-bold">[필수]</span> 이용약관 동의</span>
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setExpandedTerm(expandedTerm === 'terms' ? null : 'terms')}
                    className="text-muted-foreground text-xs underline min-h-0 h-auto px-1"
                  >
                    보기
                  </Button>
                </div>
                {expandedTerm === 'terms' && (
                  <div className="bg-muted rounded-md p-3 text-xs text-muted-foreground leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
                    {TERMS_DETAIL.terms}
                  </div>
                )}
              </div>

              {/* 개인정보 수집 */}
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-card-foreground py-2">
                    <Checkbox
                      checked={privacyAgreed}
                      onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-destructive font-bold">[필수]</span> 개인정보 수집 및 이용 동의</span>
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setExpandedTerm(expandedTerm === 'privacy' ? null : 'privacy')}
                    className="text-muted-foreground text-xs underline min-h-0 h-auto px-1"
                  >
                    보기
                  </Button>
                </div>
                {expandedTerm === 'privacy' && (
                  <div className="bg-muted rounded-md p-3 text-xs text-muted-foreground leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
                    {TERMS_DETAIL.privacy}
                  </div>
                )}
              </div>

              {/* 마케팅 수신 */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-card-foreground py-2">
                    <Checkbox
                      checked={marketingAgreed}
                      onCheckedChange={(checked) => setMarketingAgreed(checked === true)}
                      className="w-5 h-5"
                    />
                    <span><span className="text-muted-foreground font-bold">[선택]</span> 마케팅 정보 수신 동의</span>
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setExpandedTerm(expandedTerm === 'marketing' ? null : 'marketing')}
                    className="text-muted-foreground text-xs underline min-h-0 h-auto px-1"
                  >
                    보기
                  </Button>
                </div>
                {expandedTerm === 'marketing' && (
                  <div className="bg-muted rounded-md p-3 text-xs text-muted-foreground leading-relaxed max-h-[150px] overflow-y-auto mt-1 whitespace-pre-line">
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

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 min-h-[44px] font-bold font-heading"
                >
                  이전
                </Button>
                <ActionButton
                  onClick={handleSubmit}
                  disabled={!requiredTermsAgreed}
                  loading={loading}
                  className="flex-1"
                >
                  가입하기
                </ActionButton>
              </div>
            </div>
          )}
        </Card>

        <div className="text-center mt-4 text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary font-bold">
            로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
