import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';

// notification bell
export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="notification-bell" ref={ref}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('notif.bellLabel')}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <span>{t('notif.title')}</span>
            {unreadCount > 0 && (
              <button type="button" className="notification-bell__markall" onClick={markAllRead}>
                {t('notif.markAllRead')}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="notification-bell__empty">{t('notif.empty')}</p>
          ) : (
            <ul className="notification-bell__list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`notification-bell__item${n.read ? '' : ' unread'}`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <p>{n.message}</p>
                  <span className="notification-bell__time">
                    {new Date(n.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
