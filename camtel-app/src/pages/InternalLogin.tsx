import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { authApi, ApiError } from '../lib/api';
import { SettingsControls } from '../components/SettingsControls';
import { PasswordInput } from '../components/PasswordInput';
import { ChevronLeftIcon } from '../components/icons';
import camtelLogo from '../assets/camtel-logo.png';

// Same /api/auth/login endpoint as the subscriber login — the backend
// doesn't distinguish staff vs subscriber logins, it just returns whichever
// role the account has. We reject subscriber accounts here client-side so
// staff land on the right area. Staff accounts always have an email (see
// UserCreateRequest), so this form keeps the plain email field even though
// the wire field is the generic `identifier`.
export default function InternalLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(t('common.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login({ identifier: email.trim(), password });
      // Same reasoning as Login.tsx's mirror-image check: generic wording
      // only, so this can't be used to probe whether an identifier belongs
      // to a subscriber account.
      if (data.role === 'SUBSCRIBER') {
        setError(t('common.invalidCredentials'));
        return;
      }
      login(data);
      if (data.role === 'AGENT') navigate('/agent/complaints');
      else navigate('/manager/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SettingsControls className="auth-page-controls" />
      <div className="auth-card">
        <div className="logo-placeholder">
          <img src={camtelLogo} alt="" className="logo-placeholder-img" />
          <span className="logo-placeholder-text">{t('brand.name')}</span>
        </div>
        <h1>{t('internal.title')}</h1>
        <p className="subtitle">{t('internal.subtitle')}</p>

        {error && <div className="banner error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>{t('common.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('common.password')}</label>
            <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.loggingIn') : t('common.login')}
          </button>
        </form>

        <div className="auth-role-switch">
          <Link to="/login" className="auth-role-link">
            {t('internal.customerLink')}
          </Link>
          <Link to="/welcome" className="auth-role-link muted">
            <ChevronLeftIcon size={12} /> {t('internal.backToRoleSelect')}
          </Link>
        </div>
      </div>
    </div>
  );
}
