import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { SettingsControls } from './SettingsControls';
import { SERVICE_TYPE_LABELS } from '../lib/constants';
import type { ServiceTypeValue } from '../lib/constants';

// Shows the logged-in user's name, role badge, their service/department, the
// current date-time for managers, and logout — same top-right position as
// SubscriberNav's, rather than the sidebar bottom it used to live in.
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

    // For agents, department == assignedService (e.g. "MOBILE").
    // Translate it to the human label when possible.
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
            <SettingsControls className="staff-header-controls" />
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                {t('common.logout')}
            </button>
        </div>
    );
}