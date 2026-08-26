import { useRegisterSW } from 'virtual:pwa-register/react';
import { useI18n } from '../context/I18nContext';
import { Toast } from './Toast';

// service worker updates
export function PwaUpdatePrompt() {
  const { t } = useI18n();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // recheck periodically
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
