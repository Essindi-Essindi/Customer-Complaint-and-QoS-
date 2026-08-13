import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

/** Groups the theme and language switches for reuse across nav bars and auth pages. */
export function SettingsControls({ className = '' }: { className?: string }) {
  return (
    <div className={`settings-controls ${className}`}>
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );
}
