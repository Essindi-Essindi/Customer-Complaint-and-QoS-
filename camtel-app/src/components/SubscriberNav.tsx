import { Link, useNavigate } from 'react-router-dom';
import { ListChecks, FilePlus2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { SettingsControls } from './SettingsControls';
import camtelLogo from '../assets/camtel-logo.png';

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
      <div className="nav-logo">
        <img src={camtelLogo} alt="" className="nav-logo-img" />
        {t('brand.name')}
      </div>
      <div className="nav-center">{name || 'Subscriber'}</div>
      <div className="nav-actions">
        <Link to="/my-complaints" className="nav-link">
          <ListChecks size={15} />
          {t('nav.myComplaints')}
        </Link>
        <Link to="/submit-complaint" className="nav-link">
          <FilePlus2 size={15} />
          {t('nav.submitComplaint')}
        </Link>
        <SettingsControls />
        <button type="button" className="btn btn-outline" onClick={handleLogout}>
          <LogOut size={14} />
          {t('common.logout')}
        </button>
      </div>
    </header>
  );
}
