type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

type ErrorReport = {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  url?: string;
  timestamp: string;
  userAgent?: string;
};

const ERROR_LOG: ErrorReport[] = [];
const MAX_LOG_SIZE = 100;

function buildReport(
  error: unknown,
  severity: ErrorSeverity,
  context?: Record<string, unknown>,
): ErrorReport {
  const isError = error instanceof Error;
  return {
    message: isError ? error.message : String(error),
    stack: isError ? error.stack : undefined,
    severity,
    context,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };
}

export function reportError(
  error: unknown,
  severity: ErrorSeverity = 'medium',
  context?: Record<string, unknown>,
): void {
  const report = buildReport(error, severity, context);

  if (ERROR_LOG.length >= MAX_LOG_SIZE) {
    ERROR_LOG.shift();
  }
  ERROR_LOG.push(report);

  if (severity === 'critical' || severity === 'high') {
    console.error('[ErrorReporter]', report.message, report);
  } else {
    console.warn('[ErrorReporter]', report.message, report);
  }
}

export function reportApiError(
  path: string,
  status: number,
  body: unknown,
): void {
  const severity: ErrorSeverity = status >= 500 ? 'high' : 'medium';
  reportError(
    new Error(`API ${status}: ${path}`),
    severity,
    { path, status, body },
  );
}

export function getErrorLog(): readonly ErrorReport[] {
  return ERROR_LOG;
}

export function clearErrorLog(): void {
  ERROR_LOG.length = 0;
}
