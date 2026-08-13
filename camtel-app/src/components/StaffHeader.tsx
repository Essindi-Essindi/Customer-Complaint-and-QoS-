import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { SettingsControls } from './SettingsControls';

// AuthResponse (dto/response/AuthResponse.java) only has token/role/userId/
// name — no "assigned area" string — so there's nothing to show there
// beyond the role badge.
export function StaffHeader() {
  const { name, role } = useAuth();
  const { t, lang } = useI18n();
  const now = new Date().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="staff-header">
      <span className="staff-name">{name}</span>
      <span className="role-badge">{role === 'AGENT' ? t('role.agent') : t('role.manager')}</span>
      {role === 'MANAGER' && <span className="staff-datetime">{now}</span>}
      <SettingsControls className="staff-header-controls" />
    </div>
  );
}
