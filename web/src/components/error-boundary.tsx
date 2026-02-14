'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from './error-reporter';
import { Card } from './ui';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportError(error, 'critical', {
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <main style={{ padding: 24, display: 'grid', gap: 12 }}>
          <Card>
            <h3 style={{ marginTop: 0, color: '#fca5a5' }}>오류가 발생했습니다</h3>
            <p style={{ color: '#94a3b8' }}>
              예상치 못한 문제가 발생했습니다. 페이지를 새로고침하거나 아래 버튼을 눌러주세요.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={{ fontSize: 12, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{ minHeight: 40, padding: '0 12px', marginTop: 8 }}
            >
              다시 시도
            </button>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
