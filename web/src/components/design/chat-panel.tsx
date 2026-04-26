'use client';

import { Send, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  from: 'me' | 'them';
  text: string;
  ts: number;
}

interface ChatPanelProps {
  messages: ReadonlyArray<ChatMessage>;
  onSend: (text: string) => void;
  onClose?: () => void;
  className?: string;
  title?: string;
}

export function ChatPanel({ messages, onSend, onClose, className, title = '대화' }: ChatPanelProps) {
  const [draft, setDraft] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft('');
  }

  return (
    <section
      aria-label={title}
      className={cn(
        'flex h-full max-h-[560px] w-full max-w-sm flex-col rounded-[14px] border border-border-subtle bg-surface',
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="m-0 text-sm font-heading text-text-primary">{title}</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="대화 닫기"
            className="text-text-muted hover:text-text-primary"
          >
            <X size={16} />
          </button>
        )}
      </header>
      <ol className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <li className="py-8 text-center text-sm text-text-muted">메시지를 입력해보세요</li>
        ) : (
          messages.map((m) => (
            <li
              key={m.id}
              className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}
            >
              <span
                className={cn(
                  'inline-block max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                  m.from === 'me'
                    ? 'bg-gold text-background'
                    : 'bg-surface-2 text-text-primary',
                )}
              >
                {m.text}
              </span>
            </li>
          ))
        )}
      </ol>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border-subtle px-3 py-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="메시지 입력"
          aria-label="메시지 입력"
          className="flex-1 rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 text-sm focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/25"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="보내기"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold text-background disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </form>
    </section>
  );
}
