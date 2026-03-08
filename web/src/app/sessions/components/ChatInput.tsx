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
    <div className="sticky bottom-0 z-40 border-t border-[rgba(201,162,39,0.15)] bg-[rgba(15,13,10,0.95)] backdrop-blur-md px-4 py-3">
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
            bg-[#1a1612] border border-[rgba(201,162,39,0.15)]
            text-[var(--color-text-on-dark)] text-sm
            placeholder:text-[var(--color-text-muted-dark)]
            focus:border-[rgba(201,162,39,0.4)] focus:shadow-[0_0_0_2px_rgba(201,162,39,0.3)]
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
            bg-gradient-to-r from-[#C9A227] to-[#D4A843]
            text-[#0f0d0a] font-bold
            flex items-center justify-center
            hover:from-[#b08d1f] hover:to-[#C9A227]
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
