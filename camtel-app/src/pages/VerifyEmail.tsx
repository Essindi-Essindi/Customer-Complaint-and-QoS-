import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { SettingsControls } from '../components/SettingsControls';
import { VerifyEmailForm } from '../components/VerifyEmailForm';
import { Toast } from '../components/Toast';
import type { AuthResponse } from '../lib/api';
import camtelLogo from '../assets/camtel-logo.png';

// Standalone page for /verify-email — reachable directly (e.g. the "verify
// email" link on Login, a bookmarked/refreshed link, or a link in the code
// email itself), which is why email is a normal editable field pre-filled
// from route state rather than a hard requirement of arriving from Register.
// Register.tsx itself no longer routes here on signup — it pops the same
// VerifyEmailForm open in a Modal right on the registration page instead, so
// this page exists purely for the "come back later" path.
export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useI18n();

  const initialEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [toast, setToast] = useState<string | null>(null);

  const handleVerified = (res: AuthResponse) => {
    // Unlike register(), a successful verify-email always carries a real
    // token — this is the point the account actually becomes usable, so log
    // straight in rather than sending them to /login to type their password
    // again.
    login(res);
    setToast(t('verify.success'));
    setTimeout(() => navigate('/my-complaints'), 1200);
  };

  return (
    <div className="auth-page">
      <SettingsControls className="auth-page-controls" />
      <div className="auth-card">
        <div className="logo-placeholder">
          <img src={camtelLogo} alt="" className="logo-placeholder-img" />
          <span className="logo-placeholder-text">{t('brand.name')}</span>
        </div>
        <h1>{t('verify.title')}</h1>
        <p className="subtitle">{t('verify.subtitle')}</p>

        <VerifyEmailForm initialEmail={initialEmail} onVerified={handleVerified} />

        <p className="auth-footer">
          <Link to="/login">{t('common.login')}</Link>
        </p>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
