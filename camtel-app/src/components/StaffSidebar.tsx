import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, BarChart3, FileText, Users, SlidersHorizontal, Inbox } from 'lucide-react';
import type { ComponentType } from 'react';
import { useI18n } from '../context/I18nContext';
import camtelLogo from '../assets/camtel-logo.png';

interface Props {
  variant: 'agent' | 'manager';
}

// sidebar nav links
export function StaffSidebar({ variant }: Props) {
  const location = useLocation();
  const { t } = useI18n();

  const MANAGER_LINKS: { to: string; label: string; icon: ComponentType<{ size?: number }> }[] = [
    { to: '/manager/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { to: '/manager/heatmap', label: t('sidebar.heatmap'), icon: Map },
    { to: '/manager/kpis', label: t('sidebar.kpis'), icon: BarChart3 },
    { to: '/manager/reports', label: t('sidebar.reports'), icon: FileText },
    { to: '/manager/users', label: t('sidebar.users'), icon: Users },
    { to: '/manager/config', label: t('sidebar.config'), icon: SlidersHorizontal },
  ];

  const links =
    variant === 'agent'
      ? [{ to: '/agent/complaints', label: t('nav.myComplaints'), icon: Inbox }]
      : MANAGER_LINKS;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={camtelLogo} alt="" className="sidebar-logo-img" />
        {t('brand.name')}
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`sidebar-link ${location.pathname === l.to ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon" aria-hidden="true">
              <l.icon size={17} />
            </span>
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
