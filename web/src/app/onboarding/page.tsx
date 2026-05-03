'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, Calendar, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo, ProgressSteps } from '@/components/design';

const STEPS = [
  {
    key: 'welcome',
    label: '환영',
    icon: Sparkles,
    title: '천지연꽃신당에 오신 것을 환영합니다',
    description:
      '사주, 타로, 신점 등 다양한 상담을 통해 삶의 방향을 찾아보세요. 전문 상담사가 정성껏 안내해 드립니다.',
  },
  {
    key: 'counselors',
    label: '상담사',
    icon: Users,
    title: '검증된 전문 상담사',
    description:
      '엄선된 상담사들이 풍부한 경험과 깊은 통찰력으로 여러분의 고민에 진심을 담아 답해 드립니다.',
  },
  {
    key: 'booking',
    label: '예약',
    icon: Calendar,
    title: '간편한 예약 시스템',
    description:
      '원하는 상담사와 시간을 선택하고 간편하게 예약하세요. 화상 상담부터 채팅 상담까지 다양한 방식을 지원합니다.',
  },
  {
    key: 'fortune',
    label: '운세',
    icon: Star,
    title: '오늘의 무료 운세 확인',
    description:
      '회원가입 후 매일 무료 운세를 확인하고, 나에게 딱 맞는 상담사를 추천받아 보세요.',
  },
] as const;

const SWIPE_THRESHOLD = 50;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const isLastStep = currentStep === STEPS.length - 1;

  const goToStep = useCallback(
    (step: number) => {
      if (isTransitioning) return;
      if (step < 0 || step >= STEPS.length) return;
      setIsTransitioning(true);
      setCurrentStep(step);
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [isTransitioning],
  );

  const handleNext = useCallback(() => {
    if (isLastStep) {
      router.push('/signup');
      return;
    }
    goToStep(currentStep + 1);
  }, [currentStep, isLastStep, goToStep, router]);

  const handleSkip = useCallback(() => {
    router.push('/signup');
  }, [router]);

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndX.current = e.changedTouches[0].screenX;
      const diff = touchStartX.current - touchEndX.current;

      if (Math.abs(diff) < SWIPE_THRESHOLD) return;

      if (diff > 0) {
        // Swiped left -> next
        if (currentStep < STEPS.length - 1) {
          goToStep(currentStep + 1);
        }
      } else {
        // Swiped right -> previous
        if (currentStep > 0) {
          goToStep(currentStep - 1);
        }
      }
    },
    [currentStep, goToStep],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentStep < STEPS.length - 1) {
          goToStep(currentStep + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentStep > 0) {
          goToStep(currentStep - 1);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, goToStep, handleNext]);

  return (
    <div
      className="min-h-[100dvh] bg-[hsl(var(--background))] relative overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="온보딩 가이드"
      aria-roledescription="carousel"
    >
      {/* Top bar — Logo + Skip */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <Logo size="sm" />
        {!isLastStep && (
          <button
            onClick={handleSkip}
            className="text-[hsl(var(--text-muted))] text-sm hover:text-[hsl(var(--text-secondary))] transition-colors bg-transparent border-none px-3 py-2"
            aria-label="온보딩 건너뛰기"
          >
            건너뛰기
          </button>
        )}
      </div>

      {/* Slide track */}
      <div
        className="flex transition-transform duration-400 ease-[cubic-bezier(0.33,1,0.68,1)]"
        style={{
          width: `${STEPS.length * 100}%`,
          transform: `translateX(-${(currentStep * 100) / STEPS.length}%)`,
        }}
      >
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="min-h-[100dvh] flex flex-col items-center justify-center px-8"
              style={{ width: `${100 / STEPS.length}%` }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1}/${STEPS.length}: ${step.title}`}
              aria-hidden={index !== currentStep}
            >
              <div className="flex flex-col items-center text-center max-w-sm">
                {/* Floating icon */}
                <div
                  className="mb-8"
                  style={{
                    animation:
                      index === currentStep
                        ? 'float 3s ease-in-out infinite'
                        : 'none',
                  }}
                >
                  <Icon
                    className="size-16 text-[hsl(var(--gold))]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black font-heading text-foreground m-0 mb-4">
                  {step.title}
                </h2>

                {/* Description */}
                <p className="text-[hsl(var(--text-secondary))] text-base leading-relaxed max-w-sm m-0">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 px-8 flex flex-col items-center gap-6">
        {/* Progress steps + clickable dots underneath for tap nav */}
        <ProgressSteps steps={STEPS} current={currentStep} />
        <div className="flex items-center gap-3" role="tablist" aria-label="온보딩 단계">
          {STEPS.map((step, index) => (
            <button
              key={step.key}
              onClick={() => goToStep(index)}
              className={`rounded-full transition-all duration-300 motion-reduce:transition-none border-none p-0 ${
                index === currentStep
                  ? 'w-8 h-2 bg-[hsl(var(--gold))]'
                  : 'w-2 h-2 bg-[hsl(var(--text-muted))]'
              }`}
              role="tab"
              aria-selected={index === currentStep}
              aria-label={`${index + 1}단계로 이동`}
            />
          ))}
        </div>

        {/* CTA button */}
        <Button
          type="button"
          variant="gold-grad"
          size="lg"
          onClick={handleNext}
          className="w-full max-w-sm gap-2"
          aria-label={isLastStep ? '회원가입 시작하기' : '다음 단계로 이동'}
        >
          {isLastStep ? '시작하기' : '다음'}
          {!isLastStep && <ChevronRight className="size-5" aria-hidden="true" />}
        </Button>
      </div>

    </div>
  );
}
