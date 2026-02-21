'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { apiFetch } from '@/components/api-client';

const INTERESTS = [
  { id: 'saju', label: '사주', icon: '\u2728' },
  { id: 'tarot', label: '타로', icon: '\uD83C\uDCCF' },
  { id: 'sinjeom', label: '신점', icon: '\uD83D\uDD2E' },
  { id: 'dream', label: '꿈해몽', icon: '\uD83C\uDF19' },
];

const CONCERNS = [
  { id: 'love', label: '연애', icon: '\u2764\uFE0F' },
  { id: 'wealth', label: '재물', icon: '\uD83D\uDCB0' },
  { id: 'career', label: '진로', icon: '\uD83D\uDE80' },
  { id: 'health', label: '건강', icon: '\uD83C\uDF3F' },
  { id: 'family', label: '가정', icon: '\uD83C\uDFE0' },
];

type Counselor = {
  id: number;
  name: string;
  specialty: string;
  intro: string;
};

const MOCK_RECOMMENDED: Counselor[] = [
  { id: 1, name: '김신명', specialty: '사주/타로', intro: '20년 경력의 전문 상담사입니다.' },
  { id: 2, name: '이연화', specialty: '신점/꿈해몽', intro: '정확한 신점으로 길을 밝혀드립니다.' },
  { id: 3, name: '박도윤', specialty: '사주/신점', intro: '운명의 흐름을 읽어드립니다.' },
];

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === currentStep
              ? 'w-8 bg-gradient-to-r from-[#C9A227] to-[#D4A843]'
              : i < currentStep
                ? 'w-2 bg-[#C9A227]'
                : 'w-2 bg-[rgba(201,162,39,0.2)]'
          }`}
        />
      ))}
    </div>
  );
}

function ToggleChip({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border transition-all duration-200 text-sm font-medium ${
        selected
          ? 'border-[#C9A227] bg-[rgba(201,162,39,0.15)] text-[#C9A227]'
          : 'border-[rgba(201,162,39,0.15)] bg-transparent text-[#a49484] hover:border-[rgba(201,162,39,0.3)]'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const { me, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1: Birth date
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthTime, setBirthTime] = useState('');

  // Step 2: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 3: Concerns
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  // Step 4: Recommended counselors
  const [recommended, setRecommended] = useState<Counselor[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    if (!authLoading && !me) {
      router.push('/login');
    }
  }, [me, authLoading, router]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleConcern = (id: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const loadRecommendations = async () => {
    setLoadingRec(true);
    try {
      const res = await apiFetch('/api/v1/counselors');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.content || [];
        setRecommended(list.slice(0, 3));
      } else {
        setRecommended(MOCK_RECOMMENDED);
      }
    } catch (_e) {
      setRecommended(MOCK_RECOMMENDED);
    } finally {
      setLoadingRec(false);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      loadRecommendations();
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    router.push('/');
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return birthYear.length === 4 && !!birthMonth && !!birthDay;
      case 1:
        return selectedInterests.length >= 1;
      case 2:
        return selectedConcerns.length >= 1;
      default:
        return true;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-12 h-12 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px]">
        <StepIndicator currentStep={step} totalSteps={4} />

        {/* Step 0: Birth Date */}
        {step === 0 && (
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">\uD83C\uDF38</span>
              <h2 className="text-2xl font-heading font-black text-foreground m-0 mb-2">
                생년월일 입력
              </h2>
              <p className="text-sm text-[#a49484] m-0">
                정확한 운세 분석을 위해 생년월일을 알려주세요
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-[#a49484] mb-1 block">연도</label>
                <input
                  type="number"
                  placeholder="1990"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="text-center"
                  min="1920"
                  max="2025"
                />
              </div>
              <div>
                <label className="text-xs text-[#a49484] mb-1 block">월</label>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                >
                  <option value="">월</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      {i + 1}월
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#a49484] mb-1 block">일</label>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                >
                  <option value="">일</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      {i + 1}일
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-[#a49484] mb-1 block">태어난 시간 (선택)</label>
              <select
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              >
                <option value="">모름 / 선택안함</option>
                <option value="자">자시 (23:00~01:00)</option>
                <option value="축">축시 (01:00~03:00)</option>
                <option value="인">인시 (03:00~05:00)</option>
                <option value="묘">묘시 (05:00~07:00)</option>
                <option value="진">진시 (07:00~09:00)</option>
                <option value="사">사시 (09:00~11:00)</option>
                <option value="오">오시 (11:00~13:00)</option>
                <option value="미">미시 (13:00~15:00)</option>
                <option value="신">신시 (15:00~17:00)</option>
                <option value="유">유시 (17:00~19:00)</option>
                <option value="술">술시 (19:00~21:00)</option>
                <option value="해">해시 (21:00~23:00)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Interests */}
        {step === 1 && (
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">\uD83D\uDD2E</span>
              <h2 className="text-2xl font-heading font-black text-foreground m-0 mb-2">
                관심 분야 선택
              </h2>
              <p className="text-sm text-[#a49484] m-0">
                관심 있는 상담 분야를 모두 선택해주세요
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {INTERESTS.map((item) => (
                <ToggleChip
                  key={item.id}
                  selected={selectedInterests.includes(item.id)}
                  onClick={() => toggleInterest(item.id)}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Concerns */}
        {step === 2 && (
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">\uD83D\uDCAD</span>
              <h2 className="text-2xl font-heading font-black text-foreground m-0 mb-2">
                고민 유형 선택
              </h2>
              <p className="text-sm text-[#a49484] m-0">
                현재 가장 관심 있는 고민을 모두 선택해주세요
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {CONCERNS.map((item) => (
                <ToggleChip
                  key={item.id}
                  selected={selectedConcerns.includes(item.id)}
                  onClick={() => toggleConcern(item.id)}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Recommended Counselors */}
        {step === 3 && (
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">{'\u{1FAB7}'}</span>
              <h2 className="text-2xl font-heading font-black text-foreground m-0 mb-2">
                추천 상담사
              </h2>
              <p className="text-sm text-[#a49484] m-0">
                선택하신 관심사에 맞는 상담사입니다
              </p>
            </div>

            {loadingRec ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recommended.map((c) => (
                  <Link
                    key={c.id}
                    href={`/counselors/${c.id}`}
                    className="block p-4 rounded-xl border border-[rgba(201,162,39,0.15)] hover:border-[rgba(201,162,39,0.3)] hover:bg-[rgba(201,162,39,0.05)] transition-all no-underline"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A227] to-[#D4A843] flex items-center justify-center text-[#0f0d0a] font-heading font-bold text-lg shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-heading font-bold text-foreground m-0">
                          {c.name}
                        </p>
                        <p className="text-xs text-[#C9A227] m-0">
                          {c.specialty}
                        </p>
                        <p className="text-xs text-[#a49484] m-0 mt-1 truncate">
                          {c.intro}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="btn-ghost flex-1 py-3"
            >
              이전
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary-lg flex-1 py-3"
            >
              다음
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="btn-primary-lg flex-1 py-3"
            >
              시작하기
            </button>
          )}
        </div>

        {/* Skip */}
        {step < 3 && (
          <div className="text-center mt-4">
            <button
              onClick={handleComplete}
              className="text-[#a49484] text-sm hover:text-[#C9A227] transition-colors bg-transparent border-none"
            >
              건너뛰기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
