import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { SettingsControls } from './SettingsControls';

export function SubscriberNav() {
  const { name, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-nav">
      <div className="nav-logo">{t('brand.name')}</div>
      <div className="nav-center">{name || 'Subscriber'}</div>
      <div className="nav-actions">
        <Link to="/my-complaints" className="nav-link">
          {t('nav.myComplaints')}
        </Link>
        <Link to="/submit-complaint" className="nav-link">
          {t('nav.submitComplaint')}
        </Link>
        <SettingsControls />
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          {t('common.logout')}
        </button>
      </div>
    </header>
  );
}
