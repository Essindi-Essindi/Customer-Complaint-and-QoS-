import { InstallIcon } from './icons';
import { usePwaInstall } from '../context/PwaInstallContext';
import { useI18n } from '../context/I18nContext';

// install button
export function PwaInstallButton() {
  const { t } = useI18n();
  const { canInstall, isIos, isInstalled, openPrompt } = usePwaInstall();

  if (isInstalled || (!canInstall && !isIos)) return null;

  return (
    <button type="button" className="pwa-install-fab" onClick={openPrompt}>
      <span className="pwa-install-fab-icon">
        <InstallIcon />
      </span>
      {t('pwa.installCta')}
    </button>
  );
}
