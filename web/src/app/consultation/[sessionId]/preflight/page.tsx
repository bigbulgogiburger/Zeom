'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, Wifi, WifiOff, SignalLow, MonitorCheck, MonitorX } from 'lucide-react';
import { RequireLogin } from '../../../../components/route-guard';
import {
  ActionButton,
  Card,
  InlineError,
  PageTitle,
} from '../../../../components/ui';
import { cn } from '@/lib/utils';

type Permission = 'pending' | 'granted' | 'denied';
type NetworkQuality = 'good' | 'fair' | 'poor';

export default function PreflightPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [cameraPermission, setCameraPermission] = useState<Permission>('pending');
  const [micPermission, setMicPermission] = useState<Permission>('pending');
  const [browserSupport, setBrowserSupport] = useState<Permission>('pending');
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('good');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const supported = checkBrowserSupport();
    if (supported) checkPermissions();
    checkNetworkQuality();

    return () => {
      const stream = previewStreamRef.current;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function detectBrowserSupport() {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof RTCPeerConnection !== 'undefined'
    );
  }

  function checkBrowserSupport() {
    const supported = detectBrowserSupport();
    setBrowserSupport(supported ? 'granted' : 'denied');
    if (!supported) {
      setCameraPermission('denied');
      setMicPermission('denied');
      setMessage('현재 브라우저는 화상 상담에 필요한 WebRTC 기능을 지원하지 않습니다.');
    }
    return supported;
  }

  async function checkPermissions() {
    setChecking(true);
    if (!checkBrowserSupport()) {
      setChecking(false);
      return;
    }
    // 재호출 시 이전 preview stream을 명시적으로 종료 — 카메라 LED/메모리 leak 방지
    const prev = previewStreamRef.current;
    if (prev) {
      prev.getTracks().forEach((t) => t.stop());
      previewStreamRef.current = null;
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      previewStreamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      setCameraPermission('granted');
      setMicPermission('granted');
    } catch {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission('granted');
        cameraStream.getTracks().forEach((t) => t.stop());
      } catch {
        setCameraPermission('denied');
      }

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission('granted');
        micStream.getTracks().forEach((t) => t.stop());
      } catch {
        setMicPermission('denied');
      }
    } finally {
      setChecking(false);
    }
  }

  function checkNetworkQuality() {
    const navAny = navigator as unknown as {
      connection?: { effectiveType?: string };
      mozConnection?: { effectiveType?: string };
      webkitConnection?: { effectiveType?: string };
    };
    const connection = navAny.connection || navAny.mozConnection || navAny.webkitConnection;
    if (connection?.effectiveType) {
      const t = connection.effectiveType;
      if (t === '4g') setNetworkQuality('good');
      else if (t === '3g') setNetworkQuality('fair');
      else setNetworkQuality('poor');
    } else {
      setNetworkQuality('good');
    }
  }

  function canEnterRoom() {
    return browserSupport === 'granted' && cameraPermission === 'granted' && micPermission === 'granted';
  }

  function enterRoom() {
    if (browserSupport !== 'granted') {
      setMessage('지원되는 최신 브라우저에서 다시 시도해주세요.');
      return;
    }
    if (!canEnterRoom()) {
      setMessage('카메라와 마이크 권한이 필요합니다.');
      return;
    }
    const stream = previewStreamRef.current;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    router.push(`/consultation/${sessionId}`);
  }

  function PermissionIcon({ status }: { status: Permission }) {
    if (status === 'granted')
      return <CheckCircle2 className="size-7 text-[hsl(var(--success))]" aria-hidden />;
    if (status === 'denied')
      return <XCircle className="size-7 text-[hsl(var(--dancheong))]" aria-hidden />;
    return (
      <Loader2
        className="size-7 text-[hsl(var(--text-secondary))] motion-safe:animate-spin"
        aria-hidden
      />
    );
  }

  function NetworkIcon({ quality }: { quality: NetworkQuality }) {
    if (quality === 'good')
      return <Wifi className="size-7 text-[hsl(var(--success))]" aria-hidden />;
    if (quality === 'fair')
      return <SignalLow className="size-7 text-[hsl(var(--warning))]" aria-hidden />;
    return <WifiOff className="size-7 text-[hsl(var(--dancheong))]" aria-hidden />;
  }

  function BrowserIcon({ status }: { status: Permission }) {
    if (status === 'granted')
      return <MonitorCheck className="size-7 text-[hsl(var(--success))]" aria-hidden />;
    if (status === 'denied')
      return <MonitorX className="size-7 text-[hsl(var(--dancheong))]" aria-hidden />;
    return (
      <Loader2
        className="size-7 text-[hsl(var(--text-secondary))] motion-safe:animate-spin"
        aria-hidden
      />
    );
  }

  return (
    <RequireLogin>
      <main className="max-w-[800px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>상담 준비 확인</PageTitle>
        <InlineError message={message} />

        {cameraPermission === 'granted' && (
          <Card>
            <h3 className="m-0 mb-4 text-lg font-bold font-heading">카메라 미리보기</h3>
            <div className="relative w-full pb-[56.25%] bg-[hsl(var(--background))] rounded-xl overflow-hidden">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                aria-label="카메라 미리보기"
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            </div>
          </Card>
        )}

        <Card>
          <h3 className="m-0 mb-4 text-lg font-bold font-heading">디바이스 점검</h3>

          <div className="grid gap-4">
            <PermissionRow
              title="브라우저"
              desc={
                browserSupport === 'granted'
                  ? '화상 상담 지원'
                  : 'WebRTC 지원이 필요합니다'
              }
              status={browserSupport}
            >
              <BrowserIcon status={browserSupport} />
            </PermissionRow>

            <PermissionRow
              title="카메라"
              desc="화상 상담을 위해 필요합니다"
              status={cameraPermission}
            >
              <PermissionIcon status={cameraPermission} />
            </PermissionRow>

            <PermissionRow
              title="마이크"
              desc="음성 상담을 위해 필요합니다"
              status={micPermission}
            >
              <PermissionIcon status={micPermission} />
            </PermissionRow>

            <PermissionRow
              title="네트워크"
              desc={
                networkQuality === 'good'
                  ? '원활함'
                  : networkQuality === 'fair'
                  ? '보통'
                  : '불안정'
              }
              status={
                networkQuality === 'good'
                  ? 'granted'
                  : networkQuality === 'fair'
                  ? 'pending'
                  : 'denied'
              }
            >
              <NetworkIcon quality={networkQuality} />
            </PermissionRow>
          </div>

          {browserSupport === 'denied' && (
            <div
              role="alert"
              className="mt-6 p-4 bg-[hsl(var(--dancheong)/0.15)] rounded-xl text-sm text-[hsl(var(--dancheong))]"
            >
              최신 Chrome, Safari, Edge처럼 WebRTC를 지원하는 브라우저에서 접속해주세요.
            </div>
          )}

          {browserSupport === 'granted' && (cameraPermission === 'denied' || micPermission === 'denied') && (
            <div
              role="alert"
              className="mt-6 p-4 bg-[hsl(var(--dancheong)/0.15)] rounded-xl text-sm text-[hsl(var(--dancheong))]"
            >
              브라우저 주소창 옆 자물쇠 아이콘을 눌러 카메라와 마이크 권한을 허용한
              뒤 다시 확인해주세요.
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
            className={cn(
              'bg-transparent text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)] rounded-full px-6 py-2 text-sm hover:bg-[hsl(var(--gold)/0.1)] transition-colors font-heading font-bold',
              checking ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            )}
          >
            다시 확인
          </button>
        </div>
      </main>
    </RequireLogin>
  );
}

function PermissionRow({
  title,
  desc,
  status,
  children,
}: {
  title: string;
  desc: string;
  status: Permission;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex justify-between items-center p-4 rounded-xl gap-4',
        status === 'granted' && 'bg-[hsl(var(--success)/0.15)]',
        status === 'denied' && 'bg-[hsl(var(--dancheong)/0.15)]',
        status === 'pending' && 'bg-[hsl(var(--surface))]',
      )}
    >
      <div>
        <div className="font-bold text-base font-heading">{title}</div>
        <div className="text-xs text-[hsl(var(--text-secondary))] mt-1">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
