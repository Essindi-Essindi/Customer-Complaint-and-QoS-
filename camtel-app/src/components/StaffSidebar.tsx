import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

interface Props {
  variant: 'agent' | 'manager';
}

// Logout lives in StaffHeader now (top, same position as SubscriberNav's),
// not here — see StaffHeader.tsx.
export function StaffSidebar({ variant }: Props) {
  const location = useLocation();
  const { t } = useI18n();

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
    </aside>
  );
}
