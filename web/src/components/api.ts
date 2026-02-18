const isServer = typeof window === 'undefined';
export const API_BASE = isServer
  ? (process.env.API_BASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080')
  : (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080');
