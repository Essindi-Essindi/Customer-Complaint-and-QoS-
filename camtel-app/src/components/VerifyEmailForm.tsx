import { useState } from 'react';
import type { FormEvent } from 'react';
import { useI18n } from '../context/I18nContext';
import { authApi, ApiError } from '../lib/api';
import type { AuthResponse } from '../lib/api';
import { Toast } from './Toast';

interface VerifyEmailFormProps {
  initialEmail: string;
  // handle verified callback
  onVerified: (res: AuthResponse) => void;
}

export function VerifyEmailForm({ initialEmail, onVerified }: VerifyEmailFormProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!email.trim() || !code.trim()) {
      setError(t('common.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyEmail({ email: email.trim(), code: code.trim() });
      onVerified(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    if (!email.trim()) {
      setError(t('common.fillAllFields'));
      return;
    }
    setResending(true);
    try {
      await authApi.resendVerification({ email: email.trim() });
      setToast(t('verify.resendSuccess'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      {error && <div className="banner error">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label>{t('common.email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('verify.codeLabel')}</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t('verify.verifying') : t('verify.submit')}
        </button>
      </form>
      <p className="auth-footer">
        <button type="button" className="link-btn" onClick={handleResend} disabled={resending}>
          {resending ? t('verify.resending') : t('verify.resend')}
        </button>
      </p>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
