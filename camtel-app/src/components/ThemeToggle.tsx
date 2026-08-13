import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={isLight ? t('common.theme.night') : t('common.theme.day')}
      title={isLight ? t('common.theme.night') : t('common.theme.day')}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {isLight ? (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M20.4 14.7A8.3 8.3 0 0 1 9.3 3.6a.6.6 0 0 0-.7-.85A9.5 9.5 0 1 0 21.25 15.4a.6.6 0 0 0-.85-.7Z" />
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}
