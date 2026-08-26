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

// page component
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError(t('common.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login({ identifier: identifier.trim(), password });
      // wording note
      if (data.role !== 'SUBSCRIBER') {
        setError(t('common.invalidCredentials'));
        return;
      }
      login(data);
      navigate('/my-complaints');
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
        <h1>{t('login.title')}</h1>

        {error && <div className="banner error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>{t('common.emailOrPhone')}</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.cm / 06XXXXXXXX"
            />
          </div>
          <div className="field">
            <label>{t('common.password')}</label>
            <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.loggingIn') : t('common.login')}
          </button>
        </form>

        <p className="auth-footer">
          <a href="#" onClick={(e) => e.preventDefault()}>
            {t('common.forgotPassword')}
          </a>
        </p>
        <p className="auth-footer">
          {t('common.dontHaveAccount')} <Link to="/register">{t('common.register')}</Link>
        </p>
        <p className="auth-footer">
          <Link to="/verify-email">{t('login.verifyEmailLink')}</Link>
        </p>

        <div className="auth-role-switch">
          <Link to="/internal/login" className="auth-role-link">
            {t('login.staffLink')}
          </Link>
          <Link to="/welcome" className="auth-role-link muted">
            <ChevronLeftIcon size={12} /> {t('login.backToRoleSelect')}
          </Link>
        </div>
      </div>
    </div>
  );
}
