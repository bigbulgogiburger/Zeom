'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from './api-client';

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/notifications/unread-count', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // silently ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/notifications?size=5', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.content || []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleDropdown() {
    const opening = !dropdownOpen;
    setDropdownOpen(opening);
    if (opening) {
      fetchNotifications();
    }
  }

  async function markAsRead(id: number) {
    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silently ignore
    }
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString('ko-KR');
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full text-[#a49484] hover:text-[#C9A227] hover:bg-[rgba(201,162,39,0.1)] transition-colors duration-200"
        aria-label="알림"
      >
        {/* Bell SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(201,162,39,0.1)]">
            <span className="text-sm font-bold text-[var(--color-text-on-dark)] font-heading">
              알림
            </span>
            <Link
              href="/notifications"
              onClick={() => setDropdownOpen(false)}
              className="text-xs text-[#C9A227] hover:underline"
            >
              전체 보기
            </Link>
          </div>

          {/* Notification list */}
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-[#a49484]">
                불러오는 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[#a49484]">
                알림이 없습니다
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-[rgba(201,162,39,0.05)] cursor-pointer hover:bg-[rgba(201,162,39,0.05)] transition-colors ${
                    !n.isRead ? 'bg-[rgba(201,162,39,0.08)]' : ''
                  }`}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                    if (n.link) {
                      setDropdownOpen(false);
                      window.location.href = n.link;
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[#C9A227] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-on-dark)] truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-[#a49484] mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-[#6b5c4d] mt-1">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
