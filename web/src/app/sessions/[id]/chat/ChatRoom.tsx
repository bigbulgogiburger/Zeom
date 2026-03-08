'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import MessageBubble from '../../components/MessageBubble';
import ChatInput from '../../components/ChatInput';
import SessionTimer from '../../components/SessionTimer';
import { ConfirmDialog } from '@/components/ui';

type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
};

type ChatRoomProps = {
  bookingId: number;
  sessionId: number;
  currentUserId: number;
  startedAt: string;
  durationMinutes: number;
  counselorName: string;
};

export default function ChatRoom({
  bookingId,
  sessionId,
  currentUserId,
  startedAt,
  durationMinutes,
  counselorName,
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const checkNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 100;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Load initial messages
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await apiFetch(`/api/v1/chats/room/${bookingId}/messages`);
        if (!res.ok) throw new Error('메시지를 불러올 수 없습니다.');
        const data = await res.json();
        setMessages(data.messages || []);
        setLastMessageId(data.lastMessageId || 0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '메시지 로딩 실패');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [bookingId]);

  // Scroll to bottom on initial load or when new messages arrive
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (ended) return;

    const interval = setInterval(async () => {
      try {
        const url = lastMessageId > 0
          ? `/api/v1/chats/room/${bookingId}/messages?afterId=${lastMessageId}`
          : `/api/v1/chats/room/${bookingId}/messages`;
        const res = await apiFetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => [...prev, ...data.messages]);
          setLastMessageId(data.lastMessageId);
        }
      } catch {
        // Silently ignore poll errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bookingId, lastMessageId, ended]);

  async function handleSend(content: string) {
    if (ended) return;
    try {
      const res = await apiFetch(`/api/v1/chats/room/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || '메시지 전송에 실패했습니다.');
      }
      const msg: ChatMessage = await res.json();
      setMessages((prev) => [...prev, msg]);
      setLastMessageId(msg.id);
      isNearBottomRef.current = true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '전송 실패');
    }
  }

  async function handleEndSession() {
    setEnding(true);
    try {
      const res = await apiFetch(`/api/v1/consultations/${sessionId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endReason: 'COMPLETED' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || '상담 종료에 실패했습니다.');
      }
      setEnded(true);
      setShowEndConfirm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '종료 실패');
    } finally {
      setEnding(false);
    }
  }

  function handleTimeUp() {
    setEnded(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-[var(--color-text-muted-dark)] text-sm">채팅을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Timer bar */}
      <SessionTimer
        startedAt={startedAt}
        durationMinutes={durationMinutes}
        onTimeUp={handleTimeUp}
      />

      {/* Header with counselor name and end button */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[rgba(15,13,10,0.6)] border-b border-[rgba(201,162,39,0.1)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#2b2219] border border-[rgba(201,162,39,0.2)] flex items-center justify-center text-xs font-bold text-[var(--color-gold)]">
            {counselorName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-[var(--color-text-on-dark)]">
            {counselorName} 상담사
          </span>
        </div>
        {!ended && (
          <button
            onClick={() => setShowEndConfirm(true)}
            className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors duration-150"
          >
            상담 종료
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-[rgba(139,0,0,0.2)] border-b border-[#8B0000] text-sm text-[var(--color-danger-light)]">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline text-xs">
            닫기
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={containerRef}
        onScroll={checkNearBottom}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[var(--color-text-muted-dark)] text-sm">
              <p className="mb-1">채팅 상담이 시작되었습니다</p>
              <p className="text-xs">메시지를 보내 대화를 시작하세요</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSend} disabled={ended} />

      {/* Ended overlay */}
      {ended && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[var(--color-bg-card)] text-[var(--color-text-on-card)] rounded-2xl p-8 max-w-sm mx-4 text-center shadow-xl">
            <h3 className="text-xl font-bold font-heading mb-2">상담이 종료되었습니다</h3>
            <p className="text-sm text-[var(--color-text-muted-card)] mb-6">
              {counselorName} 상담사와의 채팅 상담이 종료되었습니다.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/reviews/new?sessionId=${sessionId}`)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading text-sm hover:from-[#b08d1f] hover:to-[#C9A227] transition-all"
              >
                리뷰 작성
              </button>
              <button
                onClick={() => router.push('/consultations')}
                className="px-6 py-2.5 rounded-full border border-[var(--color-border-card)] text-[var(--color-text-on-card)] font-heading font-bold text-sm hover:bg-[var(--color-bg-card-hover)] transition-colors"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End session confirm dialog */}
      <ConfirmDialog
        open={showEndConfirm}
        title="상담을 종료하시겠습니까?"
        message="상담을 종료하면 더 이상 메시지를 보낼 수 없습니다. 종료하시겠습니까?"
        onConfirm={handleEndSession}
        onCancel={() => setShowEndConfirm(false)}
        confirmLabel={ending ? '종료 중...' : '상담 종료'}
        cancelLabel="취소"
        variant="danger"
      />
    </div>
  );
}
