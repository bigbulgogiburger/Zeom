'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import SendbirdChat, { SendbirdChatWith } from '@sendbird/chat';
import { GroupChannelModule, GroupChannelHandler, type GroupChannel } from '@sendbird/chat/groupChannel';
import type { BaseMessage } from '@sendbird/chat/message';
import { Button } from '@/components/ui/button';

type ConsultationChatProps = {
  channelUrl: string;
  sendbirdAppId: string;
  sendbirdUserId: string;
  sendbirdToken: string;
  open: boolean;
  onClose: () => void;
};

type ChatMessage = {
  messageId: number;
  message: string;
  sender: string;
  senderId: string;
  createdAt: number;
  isMyMessage: boolean;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function linkify(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--color-gold);text-decoration:underline">$1</a>');
}

export default function ConsultationChat({
  channelUrl,
  sendbirdAppId,
  sendbirdUserId,
  sendbirdToken,
  open,
  onClose,
}: ConsultationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const sbRef = useRef<SendbirdChatWith<GroupChannelModule[]> | null>(null);
  const channelRef = useRef<GroupChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!open || !channelUrl || !sendbirdAppId || !sendbirdToken || sendbirdAppId === 'mock-app-id') {
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const sb = SendbirdChat.init({
          appId: sendbirdAppId,
          modules: [new GroupChannelModule()],
        }) as SendbirdChatWith<GroupChannelModule[]>;

        await sb.connect(sendbirdUserId, sendbirdToken);
        sbRef.current = sb;

        const channel = await sb.groupChannel.getChannel(channelUrl);
        channelRef.current = channel;

        // Load previous messages
        const params = channel.createPreviousMessageListQuery({ limit: 50 });
        const prevMessages = await params.load();
        if (!cancelled) {
          setMessages(
            prevMessages.map((msg) => ({
              messageId: msg.messageId,
              message: msg.isUserMessage() ? msg.message : '',
              sender: msg.isUserMessage() ? (msg.sender?.nickname || msg.sender?.userId || '') : '',
              senderId: msg.isUserMessage() ? msg.sender?.userId || '' : '',
              createdAt: msg.createdAt,
              isMyMessage: msg.isUserMessage() && msg.sender?.userId === sendbirdUserId,
            })).filter((m) => m.message)
          );
          setConnected(true);
          setTimeout(scrollToBottom, 100);
        }

        // Listen for new messages
        const handler = new GroupChannelHandler({
          onMessageReceived: (_ch: GroupChannel, msg: BaseMessage) => {
            if (_ch.url === channelUrl && msg.isUserMessage()) {
              setMessages((prev) => [
                ...prev,
                {
                  messageId: msg.messageId,
                  message: msg.message,
                  sender: msg.sender?.nickname || msg.sender?.userId || '',
                  senderId: msg.sender?.userId || '',
                  createdAt: msg.createdAt,
                  isMyMessage: msg.sender?.userId === sendbirdUserId,
                },
              ]);
              setTimeout(scrollToBottom, 50);
            }
          },
        });
        sb.groupChannel.addGroupChannelHandler('chat-handler', handler);
      } catch (err: any) {
        if (!cancelled) {
          setError('채팅 연결에 실패했습니다.');
          console.error('Chat init error:', err);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (sbRef.current) {
        sbRef.current.groupChannel.removeGroupChannelHandler('chat-handler');
        sbRef.current.disconnect();
        sbRef.current = null;
      }
      channelRef.current = null;
      setConnected(false);
      setMessages([]);
    };
  }, [open, channelUrl, sendbirdAppId, sendbirdUserId, sendbirdToken, scrollToBottom]);

  function handleSend() {
    if (!inputText.trim() || !channelRef.current || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    channelRef.current.sendUserMessage({ message: text })
      .onSucceeded((sentMsg: any) => {
        setMessages((prev) => [
          ...prev,
          {
            messageId: sentMsg.messageId,
            message: sentMsg.message,
            sender: sentMsg.sender?.nickname || sentMsg.sender?.userId || '',
            senderId: sentMsg.sender?.userId || '',
            createdAt: sentMsg.createdAt,
            isMyMessage: true,
          },
        ]);
        setTimeout(scrollToBottom, 50);
        setSending(false);
      })
      .onFailed(() => {
        setError('메시지 전송에 실패했습니다.');
        setInputText(text);
        setSending(false);
      });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!open) return null;

  return (
    <div
      className="flex flex-col border-2 rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: 'var(--color-border-card)',
        height: '100%',
        minHeight: '300px',
        maxHeight: '500px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          background: 'var(--color-bg-card-hover)',
          borderBottom: '1px solid var(--color-border-card)',
        }}
      >
        <span className="font-heading font-bold text-sm" style={{ color: 'var(--color-text-on-card)' }}>
          채팅
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted-card)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: '16px',
            minHeight: 'auto',
          }}
          aria-label="채팅 닫기"
        >
          &#10005;
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{ minHeight: 0 }}
      >
        {!connected && !error && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted-card)' }}>
            채팅 연결 중...
          </div>
        )}
        {error && (
          <div className="text-center py-4 text-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
        {connected && messages.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted-card)' }}>
            아직 메시지가 없습니다
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.messageId}
            className={`mb-2 flex flex-col ${msg.isMyMessage ? 'items-end' : 'items-start'}`}
          >
            {!msg.isMyMessage && (
              <span className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted-card)' }}>
                {msg.sender}
              </span>
            )}
            <div
              className="rounded-lg px-3 py-1.5 max-w-[80%] text-sm break-words"
              style={{
                background: msg.isMyMessage ? 'var(--color-gold)' : 'var(--color-bg-card-hover)',
                color: msg.isMyMessage ? 'var(--color-bg-primary)' : 'var(--color-text-on-card)',
              }}
              dangerouslySetInnerHTML={{ __html: linkify(msg.message) }}
            />
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted-card)' }}>
              {formatTime(msg.createdAt)}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex gap-2 px-3 py-2"
        style={{ borderTop: '1px solid var(--color-border-card)' }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          disabled={!connected || sending}
          className="flex-1 text-sm"
          style={{
            background: 'var(--color-bg-card-hover)',
            border: '1px solid var(--color-border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px',
            color: 'var(--color-text-on-card)',
            minHeight: '36px',
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!connected || sending || !inputText.trim()}
          className="bg-[var(--color-gold)] text-[var(--color-bg-primary)] font-heading font-bold hover:bg-[var(--color-gold-hover)] text-sm px-3"
          style={{ minHeight: '36px', opacity: (!connected || sending || !inputText.trim()) ? 0.5 : 1 }}
        >
          전송
        </Button>
      </div>
    </div>
  );
}
