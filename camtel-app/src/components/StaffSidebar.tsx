import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface Props {
  variant: 'agent' | 'manager';
}

export function StaffSidebar({ variant }: Props) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLogout = () => {
    logout();
    navigate('/internal/login');
  };

  const MANAGER_LINKS = [
    { to: '/manager/dashboard', label: t('sidebar.dashboard') },
    { to: '/manager/heatmap', label: t('sidebar.heatmap') },
    { to: '/manager/kpis', label: t('sidebar.kpis') },
    { to: '/manager/reports', label: t('sidebar.reports') },
    { to: '/manager/users', label: t('sidebar.users') },
    { to: '/manager/config', label: t('sidebar.config') },
  ];

  const links =
    variant === 'agent'
      ? [{ to: '/agent/complaints', label: t('nav.myComplaints') }]
      : MANAGER_LINKS;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">{t('brand.name')}</div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`sidebar-link ${location.pathname === l.to ? 'active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        {t('common.logout')}
      </button>
    </aside>
  );
}
