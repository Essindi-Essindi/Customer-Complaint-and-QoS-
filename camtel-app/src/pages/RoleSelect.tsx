import { useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { SettingsControls } from '../components/SettingsControls';
import camtelLogo from '../assets/camtel-logo.png';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="auth-page role-select-page">
      <SettingsControls className="auth-page-controls" />
      <div className="role-select-card">
        <div className="logo-placeholder">
          <img src={camtelLogo} alt="" className="logo-placeholder-img" />
          <span className="logo-placeholder-text">{t('brand.name')}</span>
        </div>
        <h1>{t('roleSelect.title')}</h1>
        <p className="subtitle">{t('roleSelect.subtitle')}</p>

        <div className="role-options">
          <button type="button" className="role-option" onClick={() => navigate('/login')}>
            <span className="role-option-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.6" />
                <path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
              </svg>
            </span>
            <span className="role-option-title">{t('roleSelect.customerTitle')}</span>
            <span className="role-option-desc">{t('roleSelect.customerDesc')}</span>
            <span className="role-option-cta">
              {t('roleSelect.customerCta')}
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>

          <button type="button" className="role-option" onClick={() => navigate('/internal/login')}>
            <span className="role-option-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="4.5" width="17" height="12" rx="1.6" />
                <path d="M8.5 20h7M12 16.5V20" />
              </svg>
            </span>
            <span className="role-option-title">{t('roleSelect.staffTitle')}</span>
            <span className="role-option-desc">{t('roleSelect.staffDesc')}</span>
            <span className="role-option-cta">
              {t('roleSelect.staffCta')}
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
