'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RequireLogin } from '../../../../components/route-guard';
import { Card, InlineError, PageTitle, ActionButton } from '../../../../components/ui';

export default function PreflightPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    checkPermissions();
    checkNetworkQuality();

    return () => {
      // Cleanup preview stream
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function checkPermissions() {
    setChecking(true);
    try {
      // Use standard WebRTC for preview
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPreviewStream(stream);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      setCameraPermission('granted');
      setMicPermission('granted');
    } catch {
      // Check individually if combined check failed
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission('granted');
        cameraStream.getTracks().forEach(track => track.stop());
      } catch {
        setCameraPermission('denied');
      }

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission('granted');
        micStream.getTracks().forEach(track => track.stop());
      } catch {
        setMicPermission('denied');
      }
    } finally {
      setChecking(false);
    }
  }

  function checkNetworkQuality() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === '4g') {
        setNetworkQuality('good');
      } else if (effectiveType === '3g') {
        setNetworkQuality('fair');
      } else {
        setNetworkQuality('poor');
      }
    } else {
      setNetworkQuality('good'); // Default to good if can't detect
    }
  }

  function canEnterRoom() {
    return cameraPermission === 'granted' && micPermission === 'granted';
  }

  function enterRoom() {
    if (!canEnterRoom()) {
      setMessage('카메라와 마이크 권한이 필요합니다.');
      return;
    }

    // Clean up preview before entering
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }

    router.push(`/consultation/${sessionId}`);
  }

  const getPermissionIcon = (status: string) => {
    if (status === 'granted') return '✅';
    if (status === 'denied') return '❌';
    return '⏳';
  };

  const getNetworkIcon = (quality: string) => {
    if (quality === 'good') return '🟢';
    if (quality === 'fair') return '🟡';
    return '🔴';
  };

  return (
    <RequireLogin>
      <main className="max-w-[800px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>상담 준비 확인</PageTitle>
        <InlineError message={message} />

        {/* Camera Preview */}
        {cameraPermission === 'granted' && (
          <Card>
            <h3 className="m-0 mb-4 text-lg font-bold font-heading">
              카메라 미리보기
            </h3>
            <div className="relative w-full pb-[56.25%] bg-black rounded-xl overflow-hidden">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            </div>
          </Card>
        )}

        <Card>
          <h3 className="m-0 mb-4 text-lg font-bold font-heading">
            디바이스 점검
          </h3>

          <div className="grid gap-4">
            {/* Camera Permission */}
            <div className={`flex justify-between items-center p-4 rounded-xl ${
              cameraPermission === 'granted'
                ? 'bg-[hsl(var(--success)/0.15)]'
                : cameraPermission === 'denied'
                  ? 'bg-[hsl(var(--dancheong)/0.15)]'
                  : 'bg-[hsl(var(--surface))]'
            }`}>
              <div>
                <div className="font-bold text-base">
                  카메라
                </div>
                <div className="text-xs text-[hsl(var(--text-secondary))] mt-1">
                  화상 상담을 위해 필요합니다
                </div>
              </div>
              <div className="text-2xl">
                {getPermissionIcon(cameraPermission)}
              </div>
            </div>

            {/* Microphone Permission */}
            <div className={`flex justify-between items-center p-4 rounded-xl ${
              micPermission === 'granted'
                ? 'bg-[hsl(var(--success)/0.15)]'
                : micPermission === 'denied'
                  ? 'bg-[hsl(var(--dancheong)/0.15)]'
                  : 'bg-[hsl(var(--surface))]'
            }`}>
              <div>
                <div className="font-bold text-base">
                  마이크
                </div>
                <div className="text-xs text-[hsl(var(--text-secondary))] mt-1">
                  음성 상담을 위해 필요합니다
                </div>
              </div>
              <div className="text-2xl">
                {getPermissionIcon(micPermission)}
              </div>
            </div>

            {/* Network Quality */}
            <div className="flex justify-between items-center p-4 rounded-xl bg-[hsl(var(--surface))]">
              <div>
                <div className="font-bold text-base">
                  네트워크
                </div>
                <div className="text-xs text-[hsl(var(--text-secondary))] mt-1">
                  {networkQuality === 'good' ? '원활함' : networkQuality === 'fair' ? '보통' : '불안정'}
                </div>
              </div>
              <div className="text-2xl">
                {getNetworkIcon(networkQuality)}
              </div>
            </div>
          </div>

          {(cameraPermission === 'denied' || micPermission === 'denied') && (
            <div className="mt-6 p-4 bg-[hsl(var(--dancheong)/0.15)] rounded-xl text-sm text-[hsl(var(--dancheong))]">
              브라우저 설정에서 카메라와 마이크 권한을 허용해주세요.
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <ActionButton
            onClick={enterRoom}
            disabled={!canEnterRoom() || checking}
            loading={checking}
          >
            상담실 입장
          </ActionButton>

          <button
            onClick={checkPermissions}
            disabled={checking}
            className={`bg-transparent text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.15)] rounded-full px-6 py-2 text-sm hover:bg-[hsl(var(--gold))]/10 transition-colors ${
              checking ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            다시 확인
          </button>
        </div>
      </main>
    </RequireLogin>
  );
}
