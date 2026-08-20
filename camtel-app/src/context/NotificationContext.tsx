import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { notificationsApi } from '../lib/api';
import type { AppNotificationResponse } from '../lib/api';
import { useAuth } from './AuthContext';

// In-app notifications for whichever actor is logged in (subscriber, agent,
// manager) — polls GET /api/notifications every 5s using the last-seen
// createdAt as a cursor, so it only ever pulls what's actually new. New
// arrivals both land in the bell dropdown (`notifications`) and get queued
// as toast popups (`popups`) so they're seen even without opening the bell.
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
    // The very first poll after login/reload just catches up on history
    // (whatever's already sitting in the DB) — that shouldn't burst a wall
    // of toasts. Only polls after that one count as "something just happened".
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
          /* a missed tick just retries in 5s */
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

  // Callers are expected to only invoke this for a currently-unread
  // notification (the bell dropdown guards on `!n.read` before calling) —
  // that keeps the decrement here unconditional and avoids a nested setState
  // read-then-write across two different state variables.
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
