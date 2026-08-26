import { Modal } from './Modal';
import { usePwaInstall } from '../context/PwaInstallContext';
import { useI18n } from '../context/I18nContext';

// install prompt modal
export function PwaInstallPrompt() {
  const { t } = useI18n();
  const { promptOpen, closePrompt, canInstall, isIos, promptInstall } = usePwaInstall();

  if (!promptOpen) return null;

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome !== 'unavailable') closePrompt();
  };

  return (
    <Modal title={t('pwa.installTitle')} onClose={closePrompt}>
      <p>{isIos ? t('pwa.installIosBody') : t('pwa.installBody')}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={closePrompt}>
          {t('pwa.dismiss')}
        </button>
        {canInstall && (
          <button type="button" className="btn btn-primary" onClick={install}>
            {t('pwa.install')}
          </button>
        )}
      </div>
    </Modal>
  );
}
