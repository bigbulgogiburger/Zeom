'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SendBirdCall from 'sendbird-calls';
import { apiFetch, getCounselorSessionToken, endSession as apiEndSession, markCounselorReady, getNextConsecutive } from '@/components/api-client';
import { Card, PageTitle, InlineError } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SessionTimer from '@/components/session-timer';
import type { TimerThreshold } from '@/components/session-timer';
import ConsecutiveSessionModal from '@/app/consultation/components/consecutive-session-modal';
import ConsultationChat from '@/components/consultation-chat';
import NetworkQuality from '@/components/network-quality';
import CreditIndicator from '@/components/credit-indicator';

type Session = {
  id: number;
  reservationId: number;
  customerName: string;
  startedAt: string;
  durationMinutes: number;
  status: string;
  sessionType?: string;
};

enum ConnectionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  WAITING = 'WAITING',
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  FAILED = 'FAILED',
}

export default function CounselorConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [customerDisconnected, setCustomerDisconnected] = useState(false);
  const [showConsecutiveModal, setShowConsecutiveModal] = useState(false);
  const [consecutiveInfo, setConsecutiveInfo] = useState<{ nextBookingId: number; nextSlotStartAt: string; nextSlotEndAt: string } | null>(null);
  const [effectiveDurationOverride, setEffectiveDurationOverride] = useState<number | null>(null);
  const [effectiveStartOverride, setEffectiveStartOverride] = useState<string | null>(null);
  const [sendbirdCreds, setSendbirdCreds] = useState<{
    sendbirdToken: string;
    sendbirdUserId: string;
    sendbirdAppId: string;
    channelUrl: string;
  } | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const currentCallRef = useRef<any>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  async function loadSession() {
    try {
      const res = await apiFetch(`/api/v1/sessions/${sessionId}`, { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setMessage(json.message || '세션을 불러올 수 없습니다.');
        return;
      }
      const data = await res.json();
      setSession(data);
    } catch {
      setMessage('세션 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }

  function getConnectionStateMessage(): string {
    switch (connectionState) {
      case ConnectionState.IDLE:
        return '연결 준비 중';
      case ConnectionState.CONNECTING:
        return '연결 설정 중...';
      case ConnectionState.WAITING:
        return '고객의 호출을 기다리는 중...';
      case ConnectionState.RINGING:
        return '고객이 호출하고 있습니다';
      case ConnectionState.CONNECTED:
        return '상담이 진행 중입니다';
      case ConnectionState.RECONNECTING:
        return `재연결 시도 중... (${reconnectAttempts}/3)`;
      case ConnectionState.FAILED:
        return '연결에 실패했습니다. "다시 연결" 버튼을 클릭해주세요.';
      default:
        return '';
    }
  }

  async function initializeSendbird(isReconnect = false) {
    if (!session) return;

    setConnectionState(isReconnect ? ConnectionState.RECONNECTING : ConnectionState.CONNECTING);
    setMessage(isReconnect ? '재연결 중...' : '연결 설정 중...');

    try {
      const tokenData = await getCounselorSessionToken(String(session.reservationId));
      const { sendbirdToken, sendbirdUserId, sendbirdAppId } = tokenData;

      const appId = sendbirdAppId || process.env.NEXT_PUBLIC_SENDBIRD_APP_ID || 'mock-app-id';

      setSendbirdCreds({
        sendbirdToken,
        sendbirdUserId,
        sendbirdAppId: appId,
        channelUrl: (tokenData as any).channelUrl || '',
      });

      if (appId === 'mock-app-id' || !sendbirdToken) {
        setMessage('Mock 모드: Sendbird 연동은 실제 토큰이 제공되면 활성화됩니다.');
        setConnectionState(ConnectionState.WAITING);
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

      // Set up listener for incoming calls from client
      SendBirdCall.addListener('counselor-listener', {
        onRinging: (call: any) => {
          setIncomingCall(call);
          setConnectionState(ConnectionState.RINGING);
        },
      });

      setConnectionState(ConnectionState.WAITING);
      setMessage('');
      setReconnectAttempts(0);

      // Signal counselor readiness to the waiting room
      markCounselorReady(sessionId).catch(() => {});
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

  function acceptCall() {
    if (!incomingCall) return;

    const callOption = {
      localMediaView: localVideoRef.current,
      remoteMediaView: remoteVideoRef.current,
      videoEnabled: true,
      audioEnabled: true,
    };

    setupCallHandlers(incomingCall);
    incomingCall.accept({ callOption });
    setIncomingCall(null);
  }

  function declineCall() {
    if (!incomingCall) return;
    incomingCall.end();
    setIncomingCall(null);
    setConnectionState(ConnectionState.WAITING);
  }

  function setupCallHandlers(call: any) {
    currentCallRef.current = call;

    call.onEstablished = () => {
      setConnectionState(ConnectionState.CONNECTING);
    };

    call.onConnected = () => {
      setCallConnected(true);
      setConnectionState(ConnectionState.CONNECTED);
      setCustomerDisconnected(false);
      setMessage('');
    };

    call.onEnded = () => {
      setCallConnected(false);
      setCustomerDisconnected(true);
      setConnectionState(ConnectionState.WAITING);
      currentCallRef.current = null;
    };

    call.onRemoteAudioSettingsChanged = () => {};
    call.onRemoteVideoSettingsChanged = () => {};
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
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (currentCallRef.current) {
        currentCallRef.current.end();
      }
      try { SendBirdCall.removeListener('counselor-listener'); } catch {}
      try { (SendBirdCall as any).disconnectWebSocket(); } catch {}
    };
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      initializeSendbird();
    }
  }, [session]);

  async function handleEndSession() {
    if (!confirm('상담을 종료하시겠습니까?')) return;

    setLoading(true);
    try {
      if (currentCallRef.current) {
        currentCallRef.current.end();
      }
      await apiEndSession(sessionId);
      router.push('/counselor');
    } catch (error: any) {
      setMessage(error.message || '세션 종료 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // Called when main timer expires
  const handleTimeUp = useCallback(async () => {
    try {
      const result = await getNextConsecutive(sessionId);
      if (result.hasNext) {
        setConsecutiveInfo({
          nextBookingId: result.nextBookingId,
          nextSlotStartAt: result.nextSlotStartAt,
          nextSlotEndAt: result.nextSlotEndAt,
        });
        setShowConsecutiveModal(true);
        return;
      }
    } catch {
      // proceed to grace period
    }
  }, [sessionId]);

  const handleGracePeriodEnd = useCallback(() => {
    handleEndSession();
  }, []);

  const handleConsecutiveContinue = useCallback((result: { extendedDurationMinutes: number; newEndTime: string; sessionId: number }) => {
    setShowConsecutiveModal(false);
    setConsecutiveInfo(null);
    setEffectiveDurationOverride(result.extendedDurationMinutes);
    setEffectiveStartOverride(new Date().toISOString());
    setMessage('');
  }, []);

  const handleConsecutiveEnd = useCallback(() => {
    setShowConsecutiveModal(false);
    setConsecutiveInfo(null);
    handleEndSession();
  }, []);

  const handleThreshold = useCallback((_threshold: TimerThreshold) => {
    // Threshold alerts handled by SessionTimer component (sound + visual)
  }, []);

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

  // Loading state
  if (!session) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle>상담실</PageTitle>
        <InlineError message={message} />
        <Card>
          <div className="text-center py-8 text-[#a49484]">
            세션을 불러오는 중...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      <PageTitle>상담실</PageTitle>
      <InlineError message={message} />

      {/* Incoming call dialog */}
      <Dialog open={connectionState === ConnectionState.RINGING && !!incomingCall} onOpenChange={() => {}}>
        <DialogContent className="bg-[#1a1612] text-[#f9f5ed] border-[rgba(201,162,39,0.15)] max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg">
              고객 호출
            </DialogTitle>
            <DialogDescription className="text-[#a49484] text-sm">
              고객님이 호출하고 있습니다. 수락하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-4xl mb-2">📞</div>
            <div className="font-heading font-bold text-lg">{session.customerName}</div>
          </div>
          <DialogFooter className="flex gap-3 justify-center sm:justify-center">
            <Button
              onClick={declineCall}
              variant="outline"
              className="border-2 border-[#8B0000] text-[#8B0000] bg-transparent rounded-full font-heading font-bold hover:bg-[#8B0000] hover:text-white"
            >
              거절
            </Button>
            <Button
              onClick={acceptCall}
              className="bg-green-600 text-white rounded-full font-heading font-bold hover:bg-green-700 px-8"
            >
              수락
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session info + Timer + Quality + Credits */}
      {/* Customer disconnect banner */}
      {customerDisconnected && connectionState === ConnectionState.WAITING && (
        <div className="bg-[#DAA520]/20 border border-[#DAA520] rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-[#DAA520]">
            고객 연결이 끊어졌습니다. 잠시 기다려주세요.
          </p>
          <p className="text-xs text-[#a49484] mt-1">
            고객이 다시 접속하면 자동으로 연결됩니다.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(session.startedAt || effectiveStartOverride) && (
          <SessionTimer
            startTime={effectiveStartOverride ?? session.startedAt}
            durationMinutes={effectiveDurationOverride ?? session.durationMinutes}
            onTimeUp={handleTimeUp}
            onThreshold={handleThreshold}
            gracePeriodMinutes={2}
            onGracePeriodEnd={handleGracePeriodEnd}
          />
        )}

        <Card>
          <h3 className="m-0 mb-2 text-sm font-bold font-heading">고객 정보</h3>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-[#a49484]">이름: </span>
              <span className="font-bold">{session.customerName}</span>
            </div>
            <div className="mt-2">
              <Badge
                className={
                  connectionState === ConnectionState.CONNECTED
                    ? 'bg-green-600 text-white'
                    : connectionState === ConnectionState.WAITING
                    ? 'bg-[#C9A227] text-[#0f0d0a]'
                    : connectionState === ConnectionState.RINGING
                    ? 'bg-[#D4A843] text-white animate-pulse'
                    : connectionState === ConnectionState.FAILED
                    ? 'bg-[#8B0000] text-white'
                    : 'bg-[#1a1612] text-[#a49484]'
                }
              >
                {getConnectionStateMessage()}
              </Badge>
            </div>
          </div>
        </Card>

        {callConnected && (
          <Card>
            <div className="flex flex-col justify-center h-full">
              <NetworkQuality call={currentCallRef.current} />
            </div>
          </Card>
        )}

        {callConnected && session.startedAt && (
          <CreditIndicator
            totalCredits={Math.ceil(session.durationMinutes / 30) || 1}
            durationMinutes={30}
            startTime={session.startedAt}
          />
        )}
      </div>

      {/* Waiting state */}
      {connectionState === ConnectionState.WAITING && !callConnected && (
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📞</div>
            <div className="font-heading font-bold text-lg text-[#C9A227] mb-2">
              고객의 호출을 기다리는 중...
            </div>
            <div className="text-sm text-[#a49484]">
              고객이 상담실에 입장하면 자동으로 알림이 표시됩니다.
            </div>
          </div>
        </Card>
      )}

      {/* Video/Audio + Chat Area */}
      {(callConnected || connectionState === ConnectionState.CONNECTED) && (
        <div className={`grid gap-4 ${chatOpen ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          <Card className={chatOpen ? 'lg:col-span-2' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
              {/* Remote Video (Client) */}
              <div className="bg-[#1a1612] rounded-lg relative overflow-hidden min-h-[300px]">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
                {!callConnected && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[#a49484]">
                    <div className="text-5xl mb-2">&#128100;</div>
                    <div>{session.customerName}</div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  고객
                </div>
              </div>

              {/* Local Video (Counselor) */}
              <div className="bg-[#1a1612] rounded-lg relative overflow-hidden min-h-[300px]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
                {!callConnected && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[#a49484]">
                    <div className="text-5xl mb-2">&#128100;</div>
                    <div>나 (선생님)</div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  나
                </div>
              </div>
            </div>
          </Card>

          {/* Chat Panel */}
          {chatOpen && sendbirdCreds && sendbirdCreds.channelUrl && (
            <div className="min-h-[400px]">
              <ConsultationChat
                channelUrl={sendbirdCreds.channelUrl}
                sendbirdAppId={sendbirdCreds.sendbirdAppId}
                sendbirdUserId={sendbirdCreds.sendbirdUserId}
                sendbirdToken={sendbirdCreds.sendbirdToken}
                open={chatOpen}
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center flex-wrap">
        <Button
          onClick={toggleAudio}
          disabled={!callConnected}
          className={`disabled:opacity-50 ${
            audioEnabled
              ? 'bg-[#C9A227] text-[#0f0d0a] font-heading font-bold hover:bg-[#D4A843]'
              : 'bg-[#8B0000] text-white font-heading font-bold hover:bg-[#8B0000]/90'
          }`}
        >
          {audioEnabled ? '마이크 켜짐' : '마이크 꺼짐'}
        </Button>

        <Button
          onClick={toggleVideo}
          disabled={!callConnected}
          className={`disabled:opacity-50 ${
            videoEnabled
              ? 'bg-[#C9A227] text-[#0f0d0a] font-heading font-bold hover:bg-[#D4A843]'
              : 'bg-[#8B0000] text-white font-heading font-bold hover:bg-[#8B0000]/90'
          }`}
        >
          {videoEnabled ? '카메라 켜짐' : '카메라 꺼짐'}
        </Button>

        <Button
          onClick={() => setChatOpen(!chatOpen)}
          disabled={!sendbirdCreds}
          className={`disabled:opacity-50 ${
            chatOpen
              ? 'bg-[#C9A227] text-[#0f0d0a] font-heading font-bold hover:bg-[#D4A843]'
              : 'bg-[#1a1612] text-[#f9f5ed] font-heading font-bold hover:bg-[#C9A227]/10'
          }`}
        >
          {chatOpen ? '채팅 닫기' : '채팅'}
        </Button>

        {pipSupported && (
          <Button
            onClick={togglePip}
            disabled={!callConnected}
            className={`disabled:opacity-50 ${
              pipActive
                ? 'bg-[#C9A227] text-[#0f0d0a] font-heading font-bold hover:bg-[#D4A843]'
                : 'bg-[#1a1612] text-[#f9f5ed] font-heading font-bold hover:bg-[#C9A227]/10'
            }`}
          >
            {pipActive ? 'PIP 끄기' : 'PIP'}
          </Button>
        )}

        {connectionState === ConnectionState.FAILED && (
          <Button
            onClick={() => {
              setReconnectAttempts(0);
              initializeSendbird();
            }}
            className="bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] rounded-full px-8 font-heading font-bold"
          >
            다시 연결
          </Button>
        )}

        <Button
          onClick={handleEndSession}
          disabled={loading}
          className="bg-[#8B0000] text-white font-heading font-bold hover:bg-[#8B0000]/90 rounded-full px-8 disabled:opacity-60"
        >
          {loading ? '종료 중...' : '상담 종료'}
        </Button>
      </div>

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
    </div>
  );
}
