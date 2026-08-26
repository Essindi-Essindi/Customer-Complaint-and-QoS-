import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { SettingsControls } from './SettingsControls';
import { NotificationBell } from './NotificationBell';
import { SERVICE_TYPE_LABELS } from '../lib/constants';
import type { ServiceTypeValue } from '../lib/constants';

// staff header bar
export function StaffHeader() {
    const { name, role, department, logout } = useAuth();
    const navigate = useNavigate();
    const { t, lang } = useI18n();

    const handleLogout = () => {
        logout();
        navigate('/internal/login');
    };
    const now = new Date().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    // format department label
    const departmentLabel =
        role === 'AGENT' && department
            ? (SERVICE_TYPE_LABELS[department as ServiceTypeValue]?.[lang] ?? department)
            : department;

    return (
        <div className="staff-header">
            <span className="staff-name">{name}</span>
            <span className="role-badge">{role === 'AGENT' ? t('role.agent') : t('role.manager')}</span>
            {departmentLabel && (
                <span className="dept-badge">{departmentLabel}</span>
            )}
            {role === 'MANAGER' && <span className="staff-datetime">{now}</span>}
            <NotificationBell />
            <SettingsControls className="staff-header-controls" />
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                <LogOut size={14} />
                {t('common.logout')}
            </button>
        </div>
    );
}