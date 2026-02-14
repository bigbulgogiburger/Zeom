'use client';

import { useEffect } from 'react';
import { reportError } from './error-reporter';

export function GlobalErrorHandler() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportError(event.error ?? event.message, 'high', {
        source: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      reportError(event.reason ?? 'Unhandled promise rejection', 'high', {
        source: 'unhandledrejection',
      });
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
