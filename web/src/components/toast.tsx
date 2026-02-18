'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastColors: Record<ToastType, string> = {
  success: '#2d6930',
  error: '#8B0000',
  info: '#C9A227',
};

let nextId = 0;

const SLIDE_IN_STYLE = `
@keyframes toast-slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes toast-slide-out {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
`;

let toastStyleInjected = false;
function injectToastStyle() {
  if (toastStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = SLIDE_IN_STYLE;
  document.head.appendChild(style);
  toastStyleInjected = true;
}

function ToastEntry({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, 2700);
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => onRemove(item.id), 300);
    return () => clearTimeout(t);
  }, [exiting, item.id, onRemove]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: toastColors[item.type],
        color: '#fff',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        maxWidth: 360,
        width: '100%',
        animation: exiting
          ? 'toast-slide-out 0.3s ease forwards'
          : 'toast-slide-in 0.3s ease forwards',
        pointerEvents: 'auto',
      }}
    >
      {item.message}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    injectToastStyle();
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted && createPortal(
        <div
          aria-label="알림"
          style={{
            position: 'fixed',
            bottom: 'var(--spacing-xl)',
            right: 'var(--spacing-xl)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: 'var(--spacing-sm)',
            pointerEvents: 'none',
          }}
        >
          {toasts.map((item) => (
            <ToastEntry key={item.id} item={item} onRemove={removeToast} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
