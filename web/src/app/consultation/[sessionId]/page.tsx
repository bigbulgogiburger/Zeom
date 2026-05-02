'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SendBirdCall from 'sendbird-calls';
import { Mic, MicOff, Video, VideoOff, MessageSquare, PhoneOff, PictureInPicture2, RefreshCw, User } from 'lucide-react';
import { apiFetch, getSessionToken, endSession as apiEndSession, getNextConsecutive, consumeSessionCredit } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FabBtn, MicLevelMeter, EndCallModal } from '@/components/design';
import SessionTimer from '@/components/session-timer';
import type { TimerThreshold } from '@/components/session-timer';
import ConsultationChat from '@/components/consultation-chat';
import NetworkQuality from '@/components/network-quality';
import CreditIndicator from '@/components/credit-indicator';
import ConnectionMonitor from '@/app/consultation/components/connection-monitor';
import QualityIndicator from '@/app/consultation/components/quality-indicator';
import ConsecutiveSessionModal from '@/app/consultation/components/consecutive-session-modal';

type Session = {
  id: number;
  reservationId: number;
  counselorName: string;
  counselorSpecialty: string;
  startedAt: string;
  durationMinutes: number;
  status: string;
  sendbirdChannelUrl?: string;
};

type TokenData = {
  sendbirdToken: string;
  sendbirdUserId: string;
  sendbirdAppId: string;
  calleeId: string;
  channelUrl: string;
  calleeName: string;
  durationMinutes: number;
};

enum ConnectionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  NO_ANSWER = 'NO_ANSWER',
  FAILED = 'FAILED',
}

const DIAL_TIMEOUT_MS = 30_000;

function getConnectionBadgeVariant(state: ConnectionState): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (state) {
    case ConnectionState.CONNECTED: return 'default';
    case ConnectionState.CONNECTING:
    case ConnectionState.RINGING: return 'secondary';
    case ConnectionState.RECONNECTING: return 'outline';
    case ConnectionState.NO_ANSWER:
    case ConnectionState.FAILED: return 'destructive';
    default: return 'secondary';
  }
}

function getConnectionLabel(state: ConnectionState, attempts: number): string {
  switch (state) {
    case ConnectionState.IDLE: return '대기 중';
    case ConnectionState.CONNECTING: return '연결 중...';
    case ConnectionState.RINGING: return '선생님 호출 중...';
    case ConnectionState.CONNECTED: return '연결됨';
    case ConnectionState.RECONNECTING: return `재연결 중... (${attempts}/3)`;
    case ConnectionState.NO_ANSWER: return '선생님이 응답하지 않습니다';
    case ConnectionState.FAILED: return '연결 실패';
  }
}

export default function ConsultationRoomPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [showConsecutiveModal, setShowConsecutiveModal] = useState(false);
  const [consecutiveInfo, setConsecutiveInfo] = useState<{ nextBookingId: number; nextSlotStartAt: string; nextSlotEndAt: string } | null>(null);
  const [effectiveDurationOverride, setEffectiveDurationOverride] = useState<number | null>(null);
  const [effectiveStartOverride, setEffectiveStartOverride] = useState<string | null>(null);
  const [sessionEnding, setSessionEnding] = useState(false);
  // ZEOM-20: end-call confirmation modal (UI only — does not affect Sendbird flow)
  const [endModalOpen, setEndModalOpen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const currentCallRef = useRef<any>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function loadSession() {
    try {
      const res = await apiFetch(`/api/v1/sessions/${sessionId}`, { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '세션을 불러올 수 없습니다.');
        return;
      }
      const data: Session = await res.json();
      setSession(data);

      try {
        const td = await getSessionToken(String(data.reservationId));
        setTokenData(td);
      } catch {
        // Token fetch may fail in mock mode, continue with session data
      }
    } catch {
      setMessage('세션 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }

  function clearDialTimeout() {
    if (dialTimeoutRef.current) {
      clearTimeout(dialTimeoutRef.current);
      dialTimeoutRef.current = null;
    }
  }

  async function initializeSendbird(isReconnect = false) {
    if (!session || !tokenData) return;

    clearDialTimeout();
    setConnectionState(isReconnect ? ConnectionState.RECONNECTING : ConnectionState.CONNECTING);
    setMessage(isReconnect ? '재연결 중...' : '연결 중...');

    try {
      const { sendbirdToken, sendbirdUserId, sendbirdAppId, calleeId } = tokenData;

      const appId = sendbirdAppId || process.env.NEXT_PUBLIC_SENDBIRD_APP_ID || 'mock-app-id';

      if (appId === 'mock-app-id' || !sendbirdToken) {
        setMessage('Mock 모드: Sendbird 연동은 실제 토큰이 제공되면 활성화됩니다.');
        setConnectionState(ConnectionState.IDLE);
        return;
      }

      SendBirdCall.init(appId);

      await SendBirdCall.authenticate({ userId: sendbirdUserId, accessToken: sendbirdToken });

      SendBirdCall.connectWebSocket();

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (permError: any) {
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          setMessage('카메라 및 마이크 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
          setConnectionState(ConnectionState.FAILED);
          return;
        }
        throw permError;
      }

      const callOption = {
        localMediaView: localVideoRef.current,
        remoteMediaView: remoteVideoRef.current,
        videoEnabled: true,
        audioEnabled: true,
      };

      if (calleeId) {
        // Outgoing call - dial the counselor
        setConnectionState(ConnectionState.RINGING);
        setMessage('선생님 호출 중...');

        const call = SendBirdCall.dial({
          userId: calleeId,
          isVideoCall: true,
          callOption,
        });

        setupCallHandlers(call);

        // 30-second no-answer timeout
        dialTimeoutRef.current = setTimeout(() => {
          if (connectionState !== ConnectionState.CONNECTED && currentCallRef.current) {
            currentCallRef.current.end();
            currentCallRef.current = null;
            setConnectionState(ConnectionState.NO_ANSWER);
            setMessage('선생님이 응답하지 않습니다. 다시 시도하시겠습니까?');
          }
        }, DIAL_TIMEOUT_MS);
      } else {
        // Incoming call - set up listener for ringing
        setMessage('선생님이 아직 준비 중입니다');
        SendBirdCall.addListener('consultation-listener', {
          onRinging: (call: any) => {
            setupCallHandlers(call);
            call.accept({ callOption });
          },
        });
      }

      setReconnectAttempts(0);

    } catch (error: any) {
      console.error('Sendbird initialization error:', error);

      if (isReconnect && reconnectAttempts < 3) {
        const nextAttempt = reconnectAttempts + 1;
        setReconnectAttempts(nextAttempt);
        setMessage(`연결 실패. 재시도 중... (${nextAttempt}/3)`);
        setConnectionState(ConnectionState.RECONNECTING);

        const delay = Math.min(1000 * Math.pow(2, nextAttempt), 10000);
        reconnectTimerRef.current = setTimeout(() => {
          initializeSendbird(true);
        }, delay);
      } else if (reconnectAttempts >= 3) {
        setMessage('연결에 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의해주세요.');
        setConnectionState(ConnectionState.FAILED);
      } else {
        setReconnectAttempts(1);
        setMessage('연결 실패. 재시도 중... (1/3)');
        setConnectionState(ConnectionState.RECONNECTING);

        reconnectTimerRef.current = setTimeout(() => {
          initializeSendbird(true);
        }, 2000);
      }
    }
  }

  function setupCallHandlers(call: any) {
    currentCallRef.current = call;

    call.onEstablished = () => {
      clearDialTimeout();
      setConnectionState(ConnectionState.RINGING);
      setMessage('선생님 호출 중...');
    };

    call.onConnected = () => {
      clearDialTimeout();
      setCallConnected(true);
      setConnectionState(ConnectionState.CONNECTED);
      setMessage('');
    };

    call.onEnded = () => {
      clearDialTimeout();
      setCallConnected(false);
      // Only go to IDLE if we were connected; otherwise might be a no-answer
      if (connectionState === ConnectionState.CONNECTED) {
        setConnectionState(ConnectionState.IDLE);
      }
      currentCallRef.current = null;
    };

    call.onRemoteAudioSettingsChanged = () => {};
    call.onRemoteVideoSettingsChanged = () => {};
  }

  function handleRetryDial() {
    setReconnectAttempts(0);
    setConnectionState(ConnectionState.IDLE);
    initializeSendbird();
  }

  useEffect(() => {
    if (typeof document !== 'undefined' && document.pictureInPictureEnabled) {
      setPipSupported(true);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }

    return () => {
      clearDialTimeout();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (currentCallRef.current) {
        currentCallRef.current.end();
      }
      try { SendBirdCall.removeListener('consultation-listener'); } catch {}
      try { (SendBirdCall as any).disconnectWebSocket(); } catch {}
    };
  }, [sessionId]);

  useEffect(() => {
    if (session && tokenData) {
      initializeSendbird();
    }
  }, [session, tokenData]);

  // ZEOM-20: confirmation now handled by EndCallModal — same end logic, no native confirm.
  async function confirmEndSession() {
    setEndModalOpen(false);
    setLoading(true);
    try {
      clearDialTimeout();
      if (currentCallRef.current) {
        currentCallRef.current.end();
      }
      await apiEndSession(sessionId);
      router.push(`/consultation/${sessionId}/summary`);
    } catch (error: any) {
      setMessage(error.message || '세션 종료 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // Called when main timer expires (before grace period)
  const handleTimeUp = useCallback(async () => {
    if (sessionEnding) return;
    // Check for consecutive booking before entering grace period
    try {
      const result = await getNextConsecutive(sessionId);
      if (result.hasNext) {
        setConsecutiveInfo({
          nextBookingId: result.nextBookingId,
          nextSlotStartAt: result.nextSlotStartAt,
          nextSlotEndAt: result.nextSlotEndAt,
        });
        setShowConsecutiveModal(true);
        return; // Don't enter grace period; show modal instead
      }
    } catch {
      // If check fails, proceed normally to grace period
    }
    // No consecutive booking: grace period will start via SessionTimer
  }, [sessionId, sessionEnding]);

  // Called when grace period ends — force end without confirmation
  const handleGracePeriodEnd = useCallback(async () => {
    if (sessionEnding) return;
    setSessionEnding(true);
    setLoading(true);
    try {
      if (currentCallRef.current) {
        currentCallRef.current.end();
      }
      await apiEndSession(sessionId);
      router.push(`/consultation/${sessionId}/summary`);
    } catch {
      setSessionEnding(false);
      setLoading(false);
    }
  }, [sessionId, sessionEnding, router]);

  // Called when user chooses to continue consecutive session
  const handleConsecutiveContinue = useCallback((result: { extendedDurationMinutes: number; newEndTime: string; sessionId: number }) => {
    setShowConsecutiveModal(false);
    setConsecutiveInfo(null);
    // Reset timer with new duration
    setEffectiveDurationOverride(result.extendedDurationMinutes);
    setEffectiveStartOverride(new Date().toISOString());
    setMessage('');
  }, []);

  // Called when user chooses to end at consecutive prompt
  const handleConsecutiveEnd = useCallback(async () => {
    if (sessionEnding) return;
    setShowConsecutiveModal(false);
    setConsecutiveInfo(null);
    setSessionEnding(true);
    setLoading(true);
    try {
      if (currentCallRef.current) {
        currentCallRef.current.end();
      }
      await apiEndSession(sessionId);
      router.push(`/consultation/${sessionId}/summary`);
    } catch {
      setSessionEnding(false);
      setLoading(false);
    }
  }, [sessionId, sessionEnding, router]);

  // Handle threshold alerts
  const handleThreshold = useCallback((threshold: TimerThreshold) => {
    // Consume credit at 30-min boundary if applicable
    if (threshold === 'expired') {
      consumeSessionCredit(sessionId).catch(() => {});
    }
  }, [sessionId]);

  function toggleAudio() {
    if (currentCallRef.current) {
      if (audioEnabled) {
        currentCallRef.current.muteMicrophone();
      } else {
        currentCallRef.current.unmuteMicrophone();
      }
    }
    setAudioEnabled(!audioEnabled);
  }

  function toggleVideo() {
    if (currentCallRef.current) {
      if (videoEnabled) {
        currentCallRef.current.stopVideo();
      } else {
        currentCallRef.current.startVideo();
      }
    }
    setVideoEnabled(!videoEnabled);
  }

  const togglePip = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPipActive(false);
      } else if (remoteVideoRef.current && document.pictureInPictureEnabled) {
        await remoteVideoRef.current.requestPictureInPicture();
        setPipActive(true);
        remoteVideoRef.current.addEventListener('leavepictureinpicture', () => {
          setPipActive(false);
        }, { once: true });
      }
    } catch {
      // PIP not supported or failed
    }
  }, []);

  const counselorDisplayName = tokenData?.calleeName || session?.counselorName || '';
  const effectiveDuration = effectiveDurationOverride ?? tokenData?.durationMinutes ?? session?.durationMinutes ?? 0;
  const effectiveStart = effectiveStartOverride ?? session?.startedAt;
  const channelUrl = tokenData?.channelUrl || session?.sendbirdChannelUrl || '';

  if (!session) {
    return (
      <RequireLogin>
        <main className="min-h-dvh bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">
          <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight">상담실</h1>
            {message && (
              <Alert variant="destructive" className="mt-4 rounded-2xl border-[hsl(var(--gold)/0.15)]">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <p className="mt-6 text-sm text-[hsl(var(--text-muted))]">세션을 불러오는 중...</p>
          </div>
        </main>
      </RequireLogin>
    );
  }

  const totalCredits = Math.ceil(effectiveDuration / 30) || 1;

  return (
    <RequireLogin>
      <main className="grid min-h-dvh grid-rows-[1fr_auto] bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">
        {/* ─────────────────────  Stage  ───────────────────── */}
        <section className="relative overflow-hidden">
          {/* Main (counselor) video — full bleed */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover bg-[hsl(var(--background))]"
          />

          {/* Fallback when not connected */}
          {!callConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[hsl(var(--text-muted))]">
              <div className="mb-3 text-[hsl(var(--gold))] opacity-70" aria-hidden="true">
                <User size={64} strokeWidth={1.5} />
              </div>
              <div className="font-heading text-lg font-bold text-[hsl(var(--text-primary))]">
                {counselorDisplayName}
              </div>
              {connectionState === ConnectionState.RINGING && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--gold))] motion-reduce:animate-none" />
                  선생님 호출 중...
                </div>
              )}
              {connectionState === ConnectionState.IDLE && tokenData && !tokenData.calleeId && (
                <div className="mt-2 text-sm">선생님이 아직 준비 중입니다</div>
              )}
              {connectionState === ConnectionState.RECONNECTING && (
                <div className="mt-2 text-sm">재연결 중... ({reconnectAttempts}/3)</div>
              )}
            </div>
          )}

          {/* Top status row */}
          <div className="absolute left-0 right-0 top-0 flex flex-wrap items-center gap-2 px-4 pt-4">
            <Badge
              variant={getConnectionBadgeVariant(connectionState)}
              className="rounded-full bg-[hsl(var(--background)/0.6)] font-heading text-xs font-bold backdrop-blur"
            >
              {getConnectionLabel(connectionState, reconnectAttempts)}
            </Badge>
            <span className="rounded-full bg-[hsl(var(--background)/0.6)] px-3 py-1 font-heading text-xs font-bold text-[hsl(var(--gold))] backdrop-blur">
              {counselorDisplayName} · {session.counselorSpecialty}
            </span>
            <div className="ml-auto rounded-full bg-[hsl(var(--background)/0.6)] px-3 py-1 backdrop-blur">
              <SessionTimer
                startTime={effectiveStart}
                durationMinutes={effectiveDuration}
                onTimeUp={handleTimeUp}
                onThreshold={handleThreshold}
                gracePeriodMinutes={2}
                onGracePeriodEnd={handleGracePeriodEnd}
              />
            </div>
          </div>

          {/* Self PIP — top-right */}
          <div className="absolute right-4 top-16 w-[160px] overflow-hidden rounded-2xl border border-[hsl(var(--gold)/0.3)] shadow-lg">
            <div className="relative aspect-video bg-[hsl(var(--background))]">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              {!callConnected && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-[hsl(var(--text-muted))]">
                  나
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-[hsl(var(--background)/0.7)] px-2 py-0.5 font-heading text-[10px] font-bold text-[hsl(var(--gold))] backdrop-blur">
                나
              </span>
            </div>
            <div className="flex items-center justify-between bg-[hsl(var(--background)/0.7)] px-2 py-1 backdrop-blur">
              <MicLevelMeter level={audioEnabled ? 0.45 : 0} />
              {callConnected && <QualityIndicator call={currentCallRef.current} />}
            </div>
          </div>

          {/* Inline error / message banner */}
          {message && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Alert
                variant={connectionState === ConnectionState.NO_ANSWER ? 'default' : 'destructive'}
                className="rounded-2xl border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--surface)/0.95)] backdrop-blur"
              >
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  <span>{message}</span>
                  {connectionState === ConnectionState.NO_ANSWER && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryDial}
                      className="rounded-full border-2 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.1)]"
                    >
                      다시 호출
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Credit indicator (bottom-left, subtle) */}
          {callConnected && session.startedAt && (
            <div className="absolute bottom-4 left-4">
              <div className="rounded-2xl bg-[hsl(var(--background)/0.6)] p-2 backdrop-blur">
                <CreditIndicator
                  totalCredits={totalCredits}
                  durationMinutes={30}
                  startTime={session.startedAt}
                />
              </div>
            </div>
          )}

          {/* Network quality (subtle) */}
          {callConnected && (
            <div className="absolute right-4 bottom-4 rounded-2xl bg-[hsl(var(--background)/0.6)] p-2 backdrop-blur">
              <NetworkQuality call={currentCallRef.current} />
            </div>
          )}

          {/* Chat slide-over (right) */}
          {tokenData && (
            <aside
              data-open={chatOpen}
              aria-hidden={!chatOpen}
              className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm translate-x-full transition-transform duration-300 ease-out data-[open=true]:translate-x-0 motion-reduce:transition-none"
            >
              <div className="flex h-full w-full border-l border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] shadow-2xl">
                <ConsultationChat
                  channelUrl={channelUrl}
                  sendbirdAppId={tokenData.sendbirdAppId || ''}
                  sendbirdUserId={tokenData.sendbirdUserId}
                  sendbirdToken={tokenData.sendbirdToken}
                  open={chatOpen}
                  onClose={() => setChatOpen(false)}
                />
              </div>
            </aside>
          )}
        </section>

        {/* ─────────────────────  Control bar  ───────────────────── */}
        <footer className="border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--background)/0.85)] px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
            <FabBtn
              icon={audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              label={audioEnabled ? '마이크 끄기' : '마이크 켜기'}
              on={audioEnabled}
              onClick={toggleAudio}
            />
            <FabBtn
              icon={videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              label={videoEnabled ? '카메라 끄기' : '카메라 켜기'}
              on={videoEnabled}
              onClick={toggleVideo}
            />
            <FabBtn
              icon={<MessageSquare size={20} />}
              label={chatOpen ? '채팅 닫기' : '채팅 열기'}
              on={chatOpen}
              onClick={() => setChatOpen(!chatOpen)}
            />
            {pipSupported && (
              <FabBtn
                icon={<PictureInPicture2 size={20} />}
                label={pipActive ? 'PIP 끄기' : 'PIP 켜기'}
                on={pipActive}
                onClick={togglePip}
              />
            )}
            {(connectionState === ConnectionState.FAILED || connectionState === ConnectionState.NO_ANSWER) && (
              <FabBtn
                icon={<RefreshCw size={20} />}
                label="다시 연결"
                onClick={handleRetryDial}
              />
            )}
            <FabBtn
              icon={<PhoneOff size={20} />}
              label="상담 종료"
              variant="destructive"
              on
              onClick={() => setEndModalOpen(true)}
            />
          </div>
        </footer>

        {/* Connection Monitor Overlay */}
        {callConnected && (
          <ConnectionMonitor
            call={currentCallRef.current}
            onReconnect={() => initializeSendbird(true)}
            onAudioOnlyFallback={() => {
              if (currentCallRef.current) {
                currentCallRef.current.stopVideo();
                setVideoEnabled(false);
              }
            }}
          />
        )}

        {/* Consecutive Session Modal */}
        {showConsecutiveModal && consecutiveInfo && (
          <ConsecutiveSessionModal
            sessionId={sessionId}
            nextBookingId={consecutiveInfo.nextBookingId}
            nextSlotStartAt={consecutiveInfo.nextSlotStartAt}
            nextSlotEndAt={consecutiveInfo.nextSlotEndAt}
            onContinue={handleConsecutiveContinue}
            onEnd={handleConsecutiveEnd}
          />
        )}

        {/* End-call confirmation */}
        <EndCallModal
          open={endModalOpen}
          loading={loading}
          onCancel={() => setEndModalOpen(false)}
          onConfirm={confirmEndSession}
        />
      </main>
    </RequireLogin>
  );
}
