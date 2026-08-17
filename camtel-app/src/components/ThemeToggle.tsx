import { Sun, Moon } from 'lucide-react';
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
            <Sun key="sun" className="theme-toggle-icon" size={13} strokeWidth={2.2} />
          ) : (
            <Moon key="moon" className="theme-toggle-icon" size={13} strokeWidth={2.2} fill="currentColor" />
          )}
        </span>
      </span>
    </button>
  );
}
