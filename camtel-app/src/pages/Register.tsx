import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, ApiError } from '../lib/api';
import { Toast } from '../components/Toast';
import { Recaptcha } from '../components/Recaptcha';
import { useI18n } from '../context/I18nContext';
import { SettingsControls } from '../components/SettingsControls';
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, type ServiceTypeValue } from '../lib/constants';

// Every field here maps 1:1 to dto/request/RegisterSubscriberRequest.java:
// name, email, phone, password, camtelAccountNumber, serviceType.
// There is no captcha token field on that DTO, so nothing captcha-related is
// sent to the backend even though a placeholder widget is shown.
interface FormState {
  name: string;
  email: string;
  phone: string;
  camtelAccountNumber: string;
  serviceType: ServiceTypeValue | '';
  password: string;
  confirmPassword: string;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  camtelAccountNumber: '',
  serviceType: '',
  password: '',
  confirmPassword: '',
};

export default function Register() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const resetRecaptchaRef = useRef<() => void>(() => {});

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!captchaToken) e.captcha = t('validation.required');
    if (!form.name.trim()) e.name = t('validation.required');
    if (!form.phone.trim()) e.phone = t('validation.required');
    else if (!/^\d{9,12}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = t('validation.invalidPhone');
    if (!form.camtelAccountNumber.trim()) e.camtelAccountNumber = t('validation.required');
    if (!form.serviceType) e.serviceType = t('validation.required');
    if (!form.email.trim()) e.email = t('validation.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('validation.invalidEmail');
    if (!form.password) e.password = t('validation.required');
    else if (form.password.length < 6) e.password = t('validation.minPassword');
    if (form.confirmPassword !== form.password) e.confirmPassword = t('validation.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBanner('');
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        camtelAccountNumber: form.camtelAccountNumber.trim(),
        serviceType: form.serviceType,
        captchaToken,
      });
      setToast(t('register.success'));
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
      resetRecaptchaRef.current();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SettingsControls className="auth-page-controls" />
      <div className="auth-card">
        <div className="logo-placeholder">{t('brand.name')}</div>
        <h1>{t('register.title')}</h1>
        <p className="subtitle">{t('register.subtitle')}</p>

        {banner && <div className="banner error">{banner}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className={`field ${errors.name ? 'error' : ''}`}>
            <label>{t('common.fullName')}</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className={`field ${errors.phone ? 'error' : ''}`}>
            <label>{t('register.camtelPhone')}</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="06XXXXXXXX"
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className={`field ${errors.camtelAccountNumber ? 'error' : ''}`}>
            <label>{t('register.camtelAccount')}</label>
            <input
              type="text"
              value={form.camtelAccountNumber}
              onChange={(e) => set('camtelAccountNumber', e.target.value)}
            />
            {errors.camtelAccountNumber && (
              <span className="field-error">{errors.camtelAccountNumber}</span>
            )}
          </div>

          <div className={`field ${errors.serviceType ? 'error' : ''}`}>
            <label>{t('register.serviceType')}</label>
            <select
              value={form.serviceType}
              onChange={(e) => set('serviceType', e.target.value)}
            >
              <option value="">{t('register.selectEllipsis')}</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_TYPE_LABELS[s][lang]}
                </option>
              ))}
            </select>
            {errors.serviceType && <span className="field-error">{errors.serviceType}</span>}
          </div>

          <div className={`field ${errors.email ? 'error' : ''}`}>
            <label>{t('common.email')}</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className={`field ${errors.password ? 'error' : ''}`}>
            <label>{t('common.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className={`field ${errors.confirmPassword ? 'error' : ''}`}>
            <label>{t('common.confirmPassword')}</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <div className={`field ${errors.captcha ? 'error' : ''}`}>
            <Recaptcha
              onChange={setCaptchaToken}
              onReady={(reset) => (resetRecaptchaRef.current = reset)}
            />
            {errors.captcha && <span className="field-error">{errors.captcha}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('register.creating') : t('register.createAccount')}
          </button>
        </form>

        <p className="auth-footer">
          {t('common.alreadyHaveAccount')} <Link to="/login">{t('common.login')}</Link>
        </p>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
