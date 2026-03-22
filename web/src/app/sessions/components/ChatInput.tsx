'use client';

import { useState, useRef, KeyboardEvent } from 'react';

type ChatInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
};

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }

  return (
    <div className="sticky bottom-0 z-40 border-t border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--background)/0.95)] backdrop-blur-md px-4 py-3">
      <div className="max-w-[800px] mx-auto flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={disabled ? '상담이 종료되었습니다' : '메시지를 입력하세요...'}
          disabled={disabled}
          rows={1}
          className="
            flex-1 resize-none rounded-xl px-4 py-2.5
            bg-surface border border-[hsl(var(--gold)/0.15)]
            text-[hsl(var(--text-primary))] text-sm
            placeholder:text-[hsl(var(--text-secondary))]
            focus:border-[hsl(var(--gold)/0.4)] focus:shadow-[0_0_0_2px_hsl(var(--gold)/0.3)]
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-[44px] max-h-[120px]
          "
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="
            flex-shrink-0 w-[44px] h-[44px] rounded-full
            bg-gradient-to-r from-gold to-gold-soft
            text-background font-bold
            flex items-center justify-center
            hover:from-[hsl(var(--gold)/0.85)] hover:to-gold
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
          aria-label="전송"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
