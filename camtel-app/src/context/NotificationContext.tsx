import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { notificationsApi } from '../lib/api';
import type { AppNotificationResponse } from '../lib/api';
import { useAuth } from './AuthContext';

// notification polling setup
const POLL_MS = 5000;
const MAX_KEPT = 30;

interface NotificationContextType {
  notifications: AppNotificationResponse[];
  unreadCount: number;
  markRead: (id: number) => void;
  markAllRead: () => void;
  popups: AppNotificationResponse[];
  dismissPopup: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, userId } = useAuth();
  const [notifications, setNotifications] = useState<AppNotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popups, setPopups] = useState<AppNotificationResponse[]>([]);

  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
    setPopups([]);

    if (!isAuthenticated) return;

    let cancelled = false;
    const sinceRef = { current: null as string | null };
    // first poll setup
    let isFirstPoll = true;

    const poll = () => {
      notificationsApi
        .list(sinceRef.current ?? undefined)
        .then((incoming) => {
          if (cancelled || incoming.length === 0) return;
          sinceRef.current = incoming[0].createdAt;

          setNotifications((prev) => [...incoming, ...prev].slice(0, MAX_KEPT));
          setUnreadCount((c) => c + incoming.filter((n) => !n.read).length);

          if (!isFirstPoll) {
            setPopups((prev) => [...prev, ...incoming]);
          }
          isFirstPoll = false;
        })
        .catch(() => {
          /* retry later */
        });
    };

    poll();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isAuthenticated, userId]);

  // update state helper
  const markRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    notificationsApi.markRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    notificationsApi.markAllRead().catch(() => {});
  }, []);

  const dismissPopup = useCallback((id: number) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markRead, markAllRead, popups, dismissPopup }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
