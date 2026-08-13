import { useI18n } from '../context/I18nContext';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div className={`lang-toggle ${className}`} role="group" aria-label="Language / Langue">
      <button
        type="button"
        className={`lang-option ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        className={`lang-option ${lang === 'fr' ? 'active' : ''}`}
        onClick={() => setLang('fr')}
        aria-pressed={lang === 'fr'}
      >
        FR
      </button>
    </div>
  );
}
