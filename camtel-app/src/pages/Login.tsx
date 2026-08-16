import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { authApi, ApiError } from '../lib/api';
import { SettingsControls } from '../components/SettingsControls';
import { ChevronLeftIcon } from '../components/icons';

// LoginRequest.identifier accepts either the account's email or phone
// number (dto/request/LoginRequest.java) — a subscriber who registered
// phone-only has no email to log in with, so this form collects a single
// generic identifier field rather than assuming email.
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
      if (data.role !== 'SUBSCRIBER') {
        setError(t('login.wrongPortal'));
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
        <div className="logo-placeholder">{t('brand.name')}</div>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
