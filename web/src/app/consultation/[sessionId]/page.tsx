'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SendBirdCall from 'sendbird-calls';
import { apiFetch, getSessionToken, endSession as apiEndSession } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SessionTimer from '@/components/session-timer';
import ConsultationChat from '@/components/consultation-chat';
import NetworkQuality from '@/components/network-quality';
import CreditIndicator from '@/components/credit-indicator';

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

  async function handleEndSession() {
    if (!confirm('상담을 종료하시겠습니까?')) return;

    setLoading(true);
    try {
      clearDialTimeout();
      if (currentCallRef.current) {
        currentCallRef.current.end();
      }

      await apiEndSession(sessionId);

      router.push(`/consultation/${sessionId}/complete`);
    } catch (error: any) {
      setMessage(error.message || '세션 종료 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const handleTimeUp = () => {
    setMessage('세션 시간이 종료되었습니다. 곧 자동으로 종료됩니다.');
    setTimeout(() => {
      handleEndSession();
    }, 3000);
  };

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
  const effectiveDuration = tokenData?.durationMinutes ?? session?.durationMinutes ?? 0;
  const channelUrl = tokenData?.channelUrl || session?.sendbirdChannelUrl || '';

  if (!session) {
    return (
      <RequireLogin>
        <main className="max-w-5xl mx-auto px-4 py-8 grid gap-6">
          <h1 className="text-2xl font-bold">상담실</h1>
          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              세션을 불러오는 중...
            </CardContent>
          </Card>
        </main>
      </RequireLogin>
    );
  }

  const totalCredits = Math.ceil(effectiveDuration / 30) || 1;

  return (
    <RequireLogin>
      <main className="max-w-6xl mx-auto px-4 py-8 grid gap-6">
        <h1 className="text-2xl font-bold">상담실</h1>

        {message && (
          <Alert variant={connectionState === ConnectionState.NO_ANSWER ? 'default' : 'destructive'}>
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span>{message}</span>
              {connectionState === ConnectionState.NO_ANSWER && (
                <Button variant="outline" size="sm" onClick={handleRetryDial}>
                  다시 호출
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Top bar: Timer + Info + Quality + Credits */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <SessionTimer
            startTime={session.startedAt}
            durationMinutes={effectiveDuration}
            onTimeUp={handleTimeUp}
          />

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">상담사 정보</CardTitle>
                <Badge variant={getConnectionBadgeVariant(connectionState)}>
                  {getConnectionLabel(connectionState, reconnectAttempts)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <div>
                <span className="text-muted-foreground">이름: </span>
                <span className="font-bold">{counselorDisplayName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">분야: </span>
                <span>{session.counselorSpecialty}</span>
              </div>
            </CardContent>
          </Card>

          {callConnected && (
            <Card>
              <CardContent className="flex flex-col justify-center h-full py-3">
                <NetworkQuality call={currentCallRef.current} />
              </CardContent>
            </Card>
          )}

          {callConnected && session.startedAt && (
            <CreditIndicator
              totalCredits={totalCredits}
              durationMinutes={30}
              startTime={session.startedAt}
            />
          )}
        </div>

        {/* Connection Status Banner (ringing / reconnecting) */}
        {(connectionState === ConnectionState.RINGING || connectionState === ConnectionState.RECONNECTING) && (
          <Alert>
            <AlertDescription className="text-center">
              {connectionState === ConnectionState.RINGING && (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  선생님 호출 중... 잠시만 기다려주세요
                </span>
              )}
              {connectionState === ConnectionState.RECONNECTING && (
                <span>재연결 중... ({reconnectAttempts}/3)</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Video + Chat Area */}
        <div className={`grid gap-4 ${chatOpen ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Video Area */}
          <Card className={chatOpen ? 'lg:col-span-2' : ''}>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 min-h-[400px]">
                {/* Remote Video */}
                <div className="bg-muted rounded-lg relative overflow-hidden min-h-[300px]">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover bg-black"
                  />
                  {!callConnected && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground">
                      <div className="text-5xl mb-2">&#128100;</div>
                      <div className="font-medium">{counselorDisplayName}</div>
                      {connectionState === ConnectionState.RINGING && (
                        <div className="text-xs mt-1 animate-pulse">호출 중...</div>
                      )}
                      {connectionState === ConnectionState.IDLE && !callConnected && tokenData && !tokenData.calleeId && (
                        <div className="text-xs mt-1">선생님이 아직 준비 중입니다</div>
                      )}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    상담사
                  </div>
                </div>

                {/* Local Video */}
                <div className="bg-muted rounded-lg relative overflow-hidden min-h-[300px]">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover bg-black"
                  />
                  {!callConnected && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground">
                      <div className="text-5xl mb-2">&#128100;</div>
                      <div>나</div>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    나
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Panel */}
          {chatOpen && tokenData && (
            <div className="min-h-[400px]">
              <ConsultationChat
                channelUrl={channelUrl}
                sendbirdAppId={tokenData.sendbirdAppId || ''}
                sendbirdUserId={tokenData.sendbirdUserId}
                sendbirdToken={tokenData.sendbirdToken}
                open={chatOpen}
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            variant={audioEnabled ? 'secondary' : 'destructive'}
            disabled={!callConnected}
            onClick={toggleAudio}
          >
            {audioEnabled ? '마이크 켜짐' : '마이크 꺼짐'}
          </Button>

          <Button
            variant={videoEnabled ? 'secondary' : 'destructive'}
            disabled={!callConnected}
            onClick={toggleVideo}
          >
            {videoEnabled ? '카메라 켜짐' : '카메라 꺼짐'}
          </Button>

          <Button
            variant={chatOpen ? 'default' : 'outline'}
            disabled={!tokenData}
            onClick={() => setChatOpen(!chatOpen)}
          >
            {chatOpen ? '채팅 닫기' : '채팅'}
          </Button>

          {pipSupported && (
            <Button
              variant={pipActive ? 'default' : 'outline'}
              disabled={!callConnected}
              onClick={togglePip}
            >
              {pipActive ? 'PIP 끄기' : 'PIP'}
            </Button>
          )}

          {(connectionState === ConnectionState.FAILED || connectionState === ConnectionState.NO_ANSWER) && (
            <Button
              variant="outline"
              onClick={handleRetryDial}
            >
              다시 연결
            </Button>
          )}

          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleEndSession}
          >
            {loading ? '종료 중...' : '상담 종료'}
          </Button>
        </div>
      </main>
    </RequireLogin>
  );
}
