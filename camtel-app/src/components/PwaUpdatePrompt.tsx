import { useRegisterSW } from 'virtual:pwa-register/react';
import { useI18n } from '../context/I18nContext';
import { Toast } from './Toast';

// Owns the service worker's lifecycle for the whole app: registers it,
// surfaces a one-time "ready to work offline" toast, and — since an
// installed PWA has no browser reload button reminding the user a new
// version shipped — a persistent banner with an explicit Reload action
// whenever autoUpdate has a new build waiting to activate.
export function PwaUpdatePrompt() {
  const { t } = useI18n();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // The browser only checks the SW script for a new version on
      // registration by default. An installed PWA is often left open (or
      // just backgrounded, not closed) for days, so that one check alone
      // means this banner can take a very long time to ever appear —
      // re-check hourly and whenever the app comes back to the foreground,
      // so a shipped update surfaces within one resume instead of only at
      // the next cold launch.
      const check = () => registration.update().catch(() => {});
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });

  if (needRefresh) {
    return (
      <div className="toast pwa-update-toast" role="alert">
        {t('pwa.updateAvailable')}
        <div className="pwa-update-actions">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => updateServiceWorker(true)}>
            {t('pwa.reload')}
          </button>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => setNeedRefresh(false)}>
            {t('pwa.dismiss')}
          </button>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return <Toast message={t('pwa.offlineReady')} onClose={() => setOfflineReady(false)} />;
  }

  return null;
}
