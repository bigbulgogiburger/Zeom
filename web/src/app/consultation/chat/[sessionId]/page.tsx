'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
};

type ChatRoom = {
  id: number;
  bookingId: number;
  providerRoomId: string;
  status: string;
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const { me } = useAuth();
  const sessionId = params.sessionId as string;

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [counselorName, setCounselorName] = useState('');
  const [closing, setClosing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load room info and booking details
  useEffect(() => {
    async function loadRoom() {
      try {
        const roomRes = await apiFetch(`/api/v1/chats/room/${sessionId}`, { cache: 'no-store' });
        if (!roomRes.ok) {
          setError('채팅방을 불러올 수 없습니다.');
          setLoading(false);
          return;
        }
        const roomData: ChatRoom = await roomRes.json();
        setRoom(roomData);

        // Load booking details for counselor name
        const bookingRes = await apiFetch('/api/v1/bookings/me', { cache: 'no-store' });
        if (bookingRes.ok) {
          const bookings = await bookingRes.json();
          const booking = bookings.find((b: { id: number }) => b.id === Number(sessionId));
          if (booking) {
            setCounselorName(booking.counselorName);
          }
        }

        // Load initial messages
        const msgRes = await apiFetch(`/api/v1/chats/room/${sessionId}/messages`, { cache: 'no-store' });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages);
          setLastMessageId(msgData.lastMessageId);
        }

        setLoading(false);
      } catch {
        setError('네트워크 오류가 발생했습니다.');
        setLoading(false);
      }
    }
    loadRoom();
  }, [sessionId]);

  // Poll for new messages
  useEffect(() => {
    if (!room || room.status === 'CLOSED') return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(
          `/api/v1/chats/room/${sessionId}/messages?afterId=${lastMessageId}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.messages.length > 0) {
            setMessages((prev) => [...prev, ...data.messages]);
            setLastMessageId(data.lastMessageId);
          }
        }
      } catch {
        // silently ignore polling errors
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [room, sessionId, lastMessageId]);

  async function sendMessage() {
    if (!input.trim() || sending || !room || room.status === 'CLOSED') return;
    setSending(true);
    setError('');

    try {
      const res = await apiFetch(`/api/v1/chats/room/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || '메시지 전송에 실패했습니다.');
        setSending(false);
        return;
      }

      const msg: ChatMessage = await res.json();
      setMessages((prev) => [...prev, msg]);
      setLastMessageId(msg.id);
      setInput('');
      inputRef.current?.focus();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    if (closing) return;
    const confirmed = window.confirm('상담을 종료하시겠습니까?');
    if (!confirmed) return;

    setClosing(true);
    try {
      const res = await apiFetch(`/api/v1/chats/room/${sessionId}/close`, {
        method: 'POST',
      });
      if (res.ok) {
        setRoom((prev) => prev ? { ...prev, status: 'CLOSED' } : prev);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      setError('상담 종료에 실패했습니다.');
    } finally {
      setClosing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return (
      <main className="flex flex-col h-[calc(100vh-64px)] bg-[#2b2219]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#a49484] animate-pulse">채팅방 로딩중...</div>
        </div>
      </main>
    );
  }

  if (error && !room) {
    return (
      <main className="flex flex-col h-[calc(100vh-64px)] bg-[#2b2219]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#8B0000] mb-4">{error}</p>
            <button
              onClick={() => router.push('/bookings/me')}
              className="text-[#C9A227] font-heading font-bold hover:underline"
            >
              내 예약으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isClosed = room?.status === 'CLOSED';

  return (
    <main className="flex flex-col h-[calc(100vh-64px)] bg-[#2b2219]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(201,162,39,0.15)] bg-black/30 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/bookings/me')}
            className="text-[#a49484] hover:text-[#C9A227] transition-colors"
            aria-label="뒤로가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h2 className="m-0 font-heading font-bold text-base text-[var(--color-text-on-dark)]">
              {counselorName || '상담사'}
            </h2>
            <span className={cn(
              'text-xs font-medium',
              isClosed ? 'text-[#8B0000]' : 'text-[#4A90D9]'
            )}>
              {isClosed ? '상담 종료' : '채팅 상담중'}
            </span>
          </div>
        </div>
        {!isClosed && (
          <button
            onClick={handleClose}
            disabled={closing}
            className="px-4 py-1.5 rounded-full border border-[#8B0000]/30 text-[#8B0000] font-heading font-bold text-xs hover:bg-[#8B0000]/10 transition-all duration-200 disabled:opacity-50"
          >
            상담 종료
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#a49484] text-sm text-center">
              {isClosed ? '상담이 종료되었습니다.' : '채팅 상담이 시작되었습니다.\n메시지를 입력해주세요.'}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = me && msg.senderId === me.id;
          return (
            <div
              key={msg.id}
              className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
            >
              <div className={cn('max-w-[75%] min-w-[80px]')}>
                {!isOwn && (
                  <span className="text-xs text-[#a49484] font-medium mb-1 block">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words',
                    isOwn
                      ? 'bg-[#C9A227] text-white rounded-br-md'
                      : 'bg-[#f9f5ed] text-[#2b2219] rounded-bl-md'
                  )}
                >
                  {msg.content}
                </div>
                <span
                  className={cn(
                    'text-[10px] text-[#a49484] mt-1 block',
                    isOwn ? 'text-right' : 'text-left'
                  )}
                >
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && room && (
        <div className="px-4 py-2 bg-[#8B0000]/10 text-[#8B0000] text-xs text-center">
          {error}
        </div>
      )}

      {/* Input Area */}
      {isClosed ? (
        <div className="px-4 py-4 border-t border-[rgba(201,162,39,0.15)] bg-black/30 text-center shrink-0">
          <p className="text-[#a49484] text-sm mb-3">상담이 종료되었습니다.</p>
          <button
            onClick={() => router.push('/bookings/me')}
            className="text-[#C9A227] font-heading font-bold text-sm hover:underline"
          >
            내 예약으로 돌아가기
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[rgba(201,162,39,0.15)] bg-black/30 backdrop-blur-xl shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            maxLength={2000}
            className="flex-1 bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-full px-4 py-2.5 text-sm text-[var(--color-text-on-dark)] placeholder:text-[#a49484]/50 focus:outline-none focus:border-[#C9A227]/50 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0',
              input.trim()
                ? 'bg-[#C9A227] text-white hover:bg-[#D4A843]'
                : 'bg-[#1a1612] text-[#a49484]/50'
            )}
            aria-label="전송"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
