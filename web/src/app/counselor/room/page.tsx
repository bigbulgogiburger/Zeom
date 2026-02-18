'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SendBirdCall from 'sendbird-calls';
import {
  getCounselorTodayBookings,
  getCounselorAuthToken,
  endSession as apiEndSession,
  saveCounselorMemo,
} from '@/components/api-client';
import { Card, PageTitle, InlineError, EmptyState, StatusBadge } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import CallNotification from '@/components/call-notification';
import SessionTimer from '@/components/session-timer';
import ConsultationChat from '@/components/consultation-chat';
import NetworkQuality from '@/components/network-quality';
import CreditIndicator from '@/components/credit-indicator';

type Booking = {
  id: number;
  customerName: string;
  startTime: string;
  endTime: string;
  status: string;
  durationMinutes?: number;
  specialty?: string;
};

enum RoomState {
  INITIALIZING = 'INITIALIZING',
  WAITING = 'WAITING',
  RINGING = 'RINGING',
  IN_CALL = 'IN_CALL',
  RECONNECTING = 'RECONNECTING',
  FAILED = 'FAILED',
}

export default function CounselorRoomPage() {
  const router = useRouter();

  // Booking state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // Sendbird state
  const [roomState, setRoomState] = useState<RoomState>(RoomState.INITIALIZING);
  const [error, setError] = useState('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [sendbirdReady, setSendbirdReady] = useState(false);

  // Call state
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callerInfo, setCallerInfo] = useState<{
    customerName: string;
    bookingTime?: string;
    specialty?: string;
    durationMinutes?: number;
  }>({ customerName: '고객' });
  const [callConnected, setCallConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(60);

  // Memo state
  const [memo, setMemo] = useState('');
  const [memoSaving, setMemoSaving] = useState(false);
  const [memoSaved, setMemoSaved] = useState(false);

  // Chat, PIP state
  const [chatOpen, setChatOpen] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [sendbirdCreds, setSendbirdCreds] = useState<{
    sendbirdToken: string;
    sendbirdUserId: string;
    sendbirdAppId: string;
    channelUrl: string;
  } | null>(null);

  // Loading
  const [ending, setEnding] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const currentCallRef = useRef<any>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load today's bookings
  async function loadBookings() {
    setBookingsLoading(true);
    try {
      const data = await getCounselorTodayBookings();
      const list: Booking[] = Array.isArray(data) ? data : data.content || [];
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setBookings(list);
    } catch {
      // Non-critical, bookings are supplementary info
    } finally {
      setBookingsLoading(false);
    }
  }

  // Initialize Sendbird
  async function initializeSendbird(isReconnect = false) {
    setRoomState(isReconnect ? RoomState.RECONNECTING : RoomState.INITIALIZING);
    setError('');

    try {
      const tokenData = await getCounselorAuthToken();
      const { sendbirdToken, sendbirdUserId, sendbirdAppId } = tokenData;

      const appId = sendbirdAppId || process.env.NEXT_PUBLIC_SENDBIRD_APP_ID || 'mock-app-id';

      setSendbirdCreds({
        sendbirdToken,
        sendbirdUserId,
        sendbirdAppId: appId,
        channelUrl: (tokenData as any).channelUrl || '',
      });

      if (appId === 'mock-app-id' || !sendbirdToken) {
        setError('Mock 모드: Sendbird 연동은 실제 토큰이 제공되면 활성화됩니다.');
        setRoomState(RoomState.WAITING);
        setSendbirdReady(false);
        return;
      }

      SendBirdCall.init(appId);
      await SendBirdCall.authenticate({ userId: sendbirdUserId, accessToken: sendbirdToken });
      SendBirdCall.connectWebSocket();

      // Request media permissions
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (permError: any) {
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          setError('카메라 및 마이크 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
          setRoomState(RoomState.FAILED);
          return;
        }
        throw permError;
      }

      // Set up incoming call listener
      SendBirdCall.addListener('counselor-listener', {
        onRinging: (call: any) => {
          // Try to match incoming call to a booking
          const callerId = call.caller?.userId || '';
          const matched = bookings.find(b =>
            (b.status === 'BOOKED' || b.status === 'PAID') &&
            callerId.includes(String(b.id))
          );

          setCallerInfo({
            customerName: matched?.customerName || call.caller?.nickname || '고객',
            bookingTime: matched
              ? `${formatTime(matched.startTime)} ~ ${formatTime(matched.endTime)}`
              : undefined,
            specialty: matched?.specialty,
            durationMinutes: matched?.durationMinutes,
          });

          setIncomingCall(call);
          setRoomState(RoomState.RINGING);
        },
      });

      setSendbirdReady(true);
      setRoomState(RoomState.WAITING);
      setReconnectAttempts(0);
    } catch (err: any) {
      console.error('Sendbird initialization error:', err);

      if (isReconnect && reconnectAttempts < 3) {
        const nextAttempt = reconnectAttempts + 1;
        setReconnectAttempts(nextAttempt);
        setError(`연결 실패. 재시도 중... (${nextAttempt}/3)`);
        setRoomState(RoomState.RECONNECTING);

        const delay = Math.min(1000 * Math.pow(2, nextAttempt), 10000);
        reconnectTimerRef.current = setTimeout(() => {
          initializeSendbird(true);
        }, delay);
      } else if (reconnectAttempts >= 3) {
        setError('연결에 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의해주세요.');
        setRoomState(RoomState.FAILED);
      } else {
        setReconnectAttempts(1);
        setError('연결 실패. 재시도 중... (1/3)');
        setRoomState(RoomState.RECONNECTING);
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
    setRoomState(RoomState.WAITING);
  }

  function setupCallHandlers(call: any) {
    currentCallRef.current = call;

    call.onEstablished = () => {
      // Signaling established, media not yet flowing
    };

    call.onConnected = () => {
      setCallConnected(true);
      setRoomState(RoomState.IN_CALL);
      setCallStartTime(new Date().toISOString());
      setError('');
    };

    call.onEnded = () => {
      setCallConnected(false);
      setRoomState(RoomState.WAITING);
      currentCallRef.current = null;
      setActiveSessionId(null);
      setCallStartTime(null);
      setMemo('');
      // Refresh bookings after a call ends
      loadBookings();
    };

    call.onRemoteAudioSettingsChanged = () => {};
    call.onRemoteVideoSettingsChanged = () => {};
  }

  async function handleSaveMemo() {
    if (!activeSessionId || !memo.trim()) return;
    setMemoSaving(true);
    setMemoSaved(false);
    try {
      await saveCounselorMemo(Number(activeSessionId), memo.trim());
      setMemoSaved(true);
      setTimeout(() => setMemoSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || '메모 저장에 실패했습니다.');
    } finally {
      setMemoSaving(false);
    }
  }

  async function handleEndSession() {
    if (!confirm('상담을 종료하시겠습니까?')) return;

    setEnding(true);
    try {
      // Save memo before ending if there is content
      if (activeSessionId && memo.trim()) {
        try {
          await saveCounselorMemo(Number(activeSessionId), memo.trim());
        } catch {
          // Non-critical: memo save failure shouldn't block session end
        }
      }
      if (currentCallRef.current) {
        currentCallRef.current.end();
      }
      if (activeSessionId) {
        await apiEndSession(activeSessionId);
      }
    } catch (err: any) {
      setError(err.message || '세션 종료 중 오류가 발생했습니다.');
    } finally {
      setEnding(false);
    }
  }

  function handleTimeUp() {
    setError('세션 시간이 종료되었습니다. 곧 자동으로 종료됩니다.');
    setTimeout(() => {
      handleEndSession();
    }, 3000);
  }

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

  function formatTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  // Check PIP support
  useEffect(() => {
    if (typeof document !== 'undefined' && document.pictureInPictureEnabled) {
      setPipSupported(true);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadBookings();
    initializeSendbird();

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
  }, []);

  const waitingBookings = bookings.filter(b => b.status === 'BOOKED' || b.status === 'PAID');

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      {/* Header with status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PageTitle>상담실</PageTitle>
        <Badge
          className={
            roomState === RoomState.IN_CALL
              ? 'bg-[var(--color-success)] text-white'
              : roomState === RoomState.WAITING && sendbirdReady
              ? 'bg-[var(--color-gold)] text-[var(--color-bg-primary)]'
              : roomState === RoomState.RINGING
              ? 'bg-[var(--color-warning)] text-white animate-pulse'
              : roomState === RoomState.FAILED
              ? 'bg-[var(--color-danger)] text-white'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted-card)]'
          }
        >
          {roomState === RoomState.INITIALIZING && '연결 준비 중...'}
          {roomState === RoomState.WAITING && (sendbirdReady ? '온라인 - 대기 중' : '대기 중')}
          {roomState === RoomState.RINGING && '호출 수신 중'}
          {roomState === RoomState.IN_CALL && '상담 진행 중'}
          {roomState === RoomState.RECONNECTING && `재연결 중 (${reconnectAttempts}/3)`}
          {roomState === RoomState.FAILED && '연결 실패'}
        </Badge>
      </div>

      <InlineError message={error} />

      {/* Incoming call notification */}
      <CallNotification
        open={roomState === RoomState.RINGING && !!incomingCall}
        callerInfo={callerInfo}
        onAccept={acceptCall}
        onDecline={declineCall}
      />

      {/* ===== WAITING MODE ===== */}
      {roomState !== RoomState.IN_CALL && !callConnected && (
        <>
          {/* Waiting indicator */}
          {roomState === RoomState.WAITING && (
            <Card>
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📞</div>
                <div className="font-heading font-bold text-lg text-[var(--color-gold)] mb-2">
                  고객의 호출을 기다리는 중...
                </div>
                <div className="text-sm text-[var(--color-text-muted-card)]">
                  고객이 상담실에 입장하면 자동으로 알림이 표시됩니다.
                </div>
              </div>
            </Card>
          )}

          {/* Failed / reconnect */}
          {roomState === RoomState.FAILED && (
            <Card>
              <div className="text-center py-6">
                <div className="text-3xl mb-3">⚠️</div>
                <div className="font-heading font-bold text-[var(--color-danger)] mb-3">
                  연결에 실패했습니다
                </div>
                <Button
                  onClick={() => {
                    setReconnectAttempts(0);
                    initializeSendbird();
                  }}
                  className="bg-[var(--color-gold)] text-[var(--color-bg-primary)] font-heading font-bold hover:bg-[var(--color-gold-hover)]"
                >
                  다시 연결
                </Button>
              </div>
            </Card>
          )}

          {/* Today's remaining bookings */}
          <div>
            <h3 className="text-base font-bold font-heading text-[var(--color-text-on-dark)] mb-3">
              오늘 남은 예약
            </h3>
            {bookingsLoading ? (
              <Card>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-1/3 bg-[var(--color-bg-secondary)] rounded" />
                  <div className="h-3 w-1/4 bg-[var(--color-bg-secondary)] rounded" />
                </div>
              </Card>
            ) : waitingBookings.length === 0 ? (
              <EmptyState
                title="오늘 남은 예약이 없습니다"
                desc="새로운 예약이 들어오면 여기에 표시됩니다."
              />
            ) : (
              <div className="grid gap-3">
                {waitingBookings.map((booking) => (
                  <Card key={booking.id}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold font-heading">{booking.customerName}</span>
                          <StatusBadge value={booking.status} />
                        </div>
                        <div className="text-sm text-[var(--color-text-muted-card)]">
                          {formatTime(booking.startTime)} ~ {formatTime(booking.endTime)}
                          {booking.durationMinutes && ` (${booking.durationMinutes}분)`}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== IN-CALL MODE ===== */}
      {(roomState === RoomState.IN_CALL || callConnected) && (
        <>
          {/* Timer + Info + Quality + Credits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {callStartTime && (
              <SessionTimer
                startTime={callStartTime}
                durationMinutes={callerInfo.durationMinutes || callDuration}
                onTimeUp={handleTimeUp}
              />
            )}
            <Card>
              <h3 className="m-0 mb-2 text-sm font-bold font-heading">고객 정보</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-[var(--color-text-muted-card)]">이름: </span>
                  <span className="font-bold">{callerInfo.customerName}</span>
                </div>
                {callerInfo.bookingTime && (
                  <div>
                    <span className="text-[var(--color-text-muted-card)]">시간: </span>
                    <span>{callerInfo.bookingTime}</span>
                  </div>
                )}
              </div>
            </Card>

            {callConnected && (
              <Card>
                <div className="flex flex-col justify-center h-full">
                  <NetworkQuality call={currentCallRef.current} />
                </div>
              </Card>
            )}

            {callConnected && callStartTime && (
              <CreditIndicator
                totalCredits={Math.ceil((callerInfo.durationMinutes || callDuration) / 30) || 1}
                durationMinutes={30}
                startTime={callStartTime}
              />
            )}
          </div>

          {/* Video + Chat area */}
          <div className={`grid gap-4 ${chatOpen ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            <Card className={chatOpen ? 'lg:col-span-2' : ''}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
                {/* Remote Video (Client) */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg relative overflow-hidden min-h-[300px]">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover bg-black"
                  />
                  {!callConnected && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[var(--color-text-muted-card)]">
                      <div className="text-5xl mb-2">&#128100;</div>
                      <div>{callerInfo.customerName}</div>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    고객
                  </div>
                </div>

                {/* Local Video (Counselor) */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg relative overflow-hidden min-h-[300px]">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover bg-black"
                  />
                  {!callConnected && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[var(--color-text-muted-card)]">
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

          {/* Memo area */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="m-0 text-base font-bold font-heading">상담 메모</h3>
              <div className="flex items-center gap-2">
                {memoSaved && (
                  <span className="text-xs text-[var(--color-success)] font-medium">저장됨</span>
                )}
                <Button
                  onClick={handleSaveMemo}
                  disabled={memoSaving || !memo.trim() || !activeSessionId}
                  className="bg-[var(--color-gold)] text-[var(--color-bg-primary)] font-heading font-bold hover:bg-[var(--color-gold-hover)] text-xs px-3 py-1"
                  style={{ minHeight: '32px', opacity: (memoSaving || !memo.trim() || !activeSessionId) ? 0.5 : 1 }}
                >
                  {memoSaving ? '저장 중...' : '메모 저장'}
                </Button>
              </div>
            </div>
            <Textarea
              value={memo}
              onChange={(e) => { setMemo(e.target.value); setMemoSaved(false); }}
              placeholder="상담 중 메모를 작성하세요..."
              className="bg-[var(--color-bg-secondary)] border-[var(--color-border-card)] text-[var(--color-text-on-card)] min-h-[100px] font-heading"
            />
          </Card>

          {/* Controls */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={toggleAudio}
              disabled={!callConnected}
              className={
                audioEnabled
                  ? 'bg-[var(--color-gold)] text-[var(--color-bg-primary)] font-heading font-bold hover:bg-[var(--color-gold-hover)]'
                  : 'bg-[var(--color-danger)] text-white font-heading font-bold hover:bg-[var(--color-danger)]/90'
              }
              style={{ opacity: callConnected ? 1 : 0.5 }}
            >
              {audioEnabled ? '마이크 켜짐' : '마이크 꺼짐'}
            </Button>

            <Button
              onClick={toggleVideo}
              disabled={!callConnected}
              className={
                videoEnabled
                  ? 'bg-[var(--color-gold)] text-[var(--color-bg-primary)] font-heading font-bold hover:bg-[var(--color-gold-hover)]'
                  : 'bg-[var(--color-danger)] text-white font-heading font-bold hover:bg-[var(--color-danger)]/90'
              }
              style={{ opacity: callConnected ? 1 : 0.5 }}
            >
              {videoEnabled ? '카메라 켜짐' : '카메라 꺼짐'}
            </Button>

            <Button
              onClick={() => setChatOpen(!chatOpen)}
              disabled={!sendbirdCreds}
              className={
                chatOpen
                  ? 'bg-[var(--color-gold)] text-[var(--color-bg-primary)] font-heading font-bold hover:bg-[var(--color-gold-hover)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-on-card)] font-heading font-bold hover:bg-[var(--color-bg-card-hover)]'
              }
              style={{ opacity: sendbirdCreds ? 1 : 0.5 }}
            >
              {chatOpen ? '채팅 닫기' : '채팅'}
            </Button>

            {pipSupported && (
              <Button
                onClick={togglePip}
                disabled={!callConnected}
                className={
                  pipActive
                    ? 'bg-[var(--color-gold)] text-[var(--color-bg-primary)] font-heading font-bold hover:bg-[var(--color-gold-hover)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-on-card)] font-heading font-bold hover:bg-[var(--color-bg-card-hover)]'
                }
                style={{ opacity: callConnected ? 1 : 0.5 }}
              >
                {pipActive ? 'PIP 끄기' : 'PIP'}
              </Button>
            )}

            <Button
              onClick={handleEndSession}
              disabled={ending}
              className="bg-[var(--color-danger)] text-white font-heading font-bold hover:bg-[var(--color-danger)]/90 px-8"
              style={{ opacity: ending ? 0.6 : 1 }}
            >
              {ending ? '종료 중...' : '상담 종료'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
