'use client';

import { useCallback, useState } from 'react';

type FortuneShareData = {
  overallScore: number;
  summary: string;
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
  categories?: { label: string; score: number }[];
};

type ShareCardProps = {
  fortune: FortuneShareData;
  date: string;
};

export default function ShareCard({ fortune, date }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share?score=${fortune.overallScore}&date=${encodeURIComponent(date)}`
    : '';

  const shareTitle = `천지연꽃신당 - 오늘의 운세 (${fortune.overallScore}점)`;
  const shareText = `${date} 운세: ${fortune.summary}`;

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed silently
      }
    }
  }, [shareTitle, shareText, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied
    }
  }, [shareUrl]);

  const handleKakaoShare = useCallback(() => {
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(kakaoUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }, [shareUrl]);

  const handleTwitterShare = useCallback(() => {
    const tweetText = encodeURIComponent(`${shareTitle}\n${shareText}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }, [shareTitle, shareText, shareUrl]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#C9A227';
    if (score >= 60) return '#b08d1f';
    if (score >= 40) return '#8B6914';
    return '#8B0000';
  };

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <div
        className="glass-card p-6 relative overflow-hidden"
        style={{ borderColor: 'rgba(201,162,39,0.3)' }}
      >
        <div className="text-center mb-4">
          <p className="text-xs text-[#a49484] m-0 mb-1">{date}</p>
          <h3 className="text-lg font-heading font-bold text-[#C9A227] m-0">
            오늘의 운세
          </h3>
        </div>

        <div className="flex justify-center mb-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border-4"
            style={{ borderColor: getScoreColor(fortune.overallScore) }}
          >
            <span
              className="text-2xl font-heading font-black"
              style={{ color: getScoreColor(fortune.overallScore) }}
            >
              {fortune.overallScore}
            </span>
          </div>
        </div>

        <p className="text-sm text-[#a49484] text-center leading-relaxed m-0 mb-4">
          {fortune.summary}
        </p>

        {/* Lucky Items */}
        <div className="grid grid-cols-3 gap-3 text-center border-t border-[rgba(201,162,39,0.15)] pt-4">
          <div>
            <p className="text-[10px] text-[#a49484] m-0">행운의 색</p>
            <p className="text-xs font-bold text-[#C9A227] m-0 mt-0.5">{fortune.luckyColor}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#a49484] m-0">행운의 숫자</p>
            <p className="text-xs font-bold text-[#C9A227] m-0 mt-0.5">{fortune.luckyNumber}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#a49484] m-0">행운의 방향</p>
            <p className="text-xs font-bold text-[#C9A227] m-0 mt-0.5">{fortune.luckyDirection}</p>
          </div>
        </div>

        {/* Watermark */}
        <p className="text-[10px] text-[#a49484]/50 text-center m-0 mt-3">
          천지연꽃신당 | cheonjiyeon.com
        </p>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2">
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="flex-1 btn-primary py-2.5 text-sm rounded-lg"
          >
            공유하기
          </button>
        )}
        <button
          onClick={handleKakaoShare}
          className="flex-1 py-2.5 text-sm rounded-lg font-bold"
          style={{ backgroundColor: '#FEE500', color: '#191919' }}
        >
          카카오톡
        </button>
        <button
          onClick={handleTwitterShare}
          className="flex-1 py-2.5 text-sm rounded-lg font-bold text-white"
          style={{ backgroundColor: '#1DA1F2' }}
        >
          트위터
        </button>
        <button
          onClick={handleCopyLink}
          className="flex-1 btn-secondary py-2.5 text-sm rounded-lg"
        >
          {copied ? '복사됨!' : 'URL 복사'}
        </button>
      </div>
    </div>
  );
}
