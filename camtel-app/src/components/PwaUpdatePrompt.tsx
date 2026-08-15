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
  } = useRegisterSW();

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
