import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { SubscriberNav } from '../components/SubscriberNav';
import { complaintsApi, ApiError } from '../lib/api';
import type { ComplaintResponse } from '../lib/api';
import { Toast } from '../components/Toast';
import { Recaptcha } from '../components/Recaptcha';
import { useI18n } from '../context/I18nContext';
import {
  COMPLAINT_TYPES,
  REGIONS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type ServiceTypeValue,
} from '../lib/constants';

// Fields map 1:1 to dto/request/ComplaintSubmissionRequest.java:
// idempotencyKey, type, serviceType, region, city, description.
// categoryId is left out — there's no endpoint a subscriber can call to list
// categories (GET /api/manager/categories requires the MANAGER role), so
// there's nothing to populate a category picker with.
function newIdempotencyKey() {
  return crypto.randomUUID();
}

interface FormState {
  type: string;
  serviceType: ServiceTypeValue | '';
  region: string;
  city: string;
  description: string;
}

const emptyForm: FormState = { type: '', serviceType: '', region: '', city: '', description: '' };

export default function SubmitComplaint() {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [result, setResult] = useState<ComplaintResponse | null>(null);
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const resetRecaptchaRef = useRef<() => void>(() => {});

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!captchaToken) e.captcha = t('validation.required');
    if (!form.type) e.type = t('validation.required');
    if (!form.serviceType) e.serviceType = t('validation.required');
    if (!form.region) e.region = t('validation.required');
    if (!form.city.trim()) e.city = t('validation.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBanner('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await complaintsApi.submit({
        idempotencyKey,
        type: form.type,
        serviceType: form.serviceType as ServiceTypeValue,
        region: form.region,
        city: form.city.trim(),
        description: form.description.trim() || undefined,
        captchaToken,
      });
      setResult(res);
      setToast(t('submit.success'));
      // A fresh key means the next submit creates a new complaint instead of
      // being deduplicated against this one.
      setIdempotencyKey(newIdempotencyKey());
      setForm(emptyForm);
      setErrors({});
      setCaptchaToken('');
      resetRecaptchaRef.current();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
      resetRecaptchaRef.current();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <SubscriberNav />
      <main className="page-content">
        <h1>{t('page.submitComplaint')}</h1>

        {result && (
          <div className="banner success">
            {t('submit.confirmedPrefix')} <strong>{result.ticketNumber}</strong>
          </div>
        )}

        {banner && <div className="banner error">{banner}</div>}

        <form onSubmit={handleSubmit} className="form-card" noValidate>
          <div className={`field ${errors.type ? 'error' : ''}`}>
            <label>{t('submit.complaintType')}</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="">{t('register.selectEllipsis')}</option>
              {COMPLAINT_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
            {errors.type && <span className="field-error">{errors.type}</span>}
          </div>

          <div className={`field ${errors.serviceType ? 'error' : ''}`}>
            <label>{t('submit.affectedService')}</label>
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

          <div className={`field ${errors.region ? 'error' : ''}`}>
            <label>{t('common.region')}</label>
            <select value={form.region} onChange={(e) => set('region', e.target.value)}>
              <option value="">{t('register.selectEllipsis')}</option>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {errors.region && <span className="field-error">{errors.region}</span>}
          </div>

          <div className={`field ${errors.city ? 'error' : ''}`}>
            <label>{t('common.city')}</label>
            <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)} />
            {errors.city && <span className="field-error">{errors.city}</span>}
          </div>

          <div className="field">
            <label>
              {t('common.description')} <span className="hint-inline">{t('submit.optional')}</span>
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className={`field ${errors.captcha ? 'error' : ''}`}>
            <Recaptcha
              onChange={setCaptchaToken}
              onReady={(reset) => (resetRecaptchaRef.current = reset)}
            />
            {errors.captcha && <span className="field-error">{errors.captcha}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('submit.submitting') : t('submit.submitComplaint')}
          </button>
        </form>
      </main>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
