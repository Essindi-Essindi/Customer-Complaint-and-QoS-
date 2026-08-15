import { InstallIcon } from './icons';
import { usePwaInstall } from '../context/PwaInstallContext';
import { useI18n } from '../context/I18nContext';

// Persistent install affordance shown on every page — subscriber pages and
// every staff dashboard alike, since it's rendered once at the App root.
// Unlike PwaInstallPrompt (auto-shown once per session, dismissible), this
// stays available for whoever dismissed that popup, or came back later, or
// is on iOS and never gets a native browser prompt at all — clicking it
// just reopens the same install dialog.
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
