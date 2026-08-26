import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { SubscriberNav } from '../components/SubscriberNav';
import { complaintsApi, subscriberCategoriesApi, ApiError } from '../lib/api';
import type { ComplaintResponse, Category } from '../lib/api';
import { Toast } from '../components/Toast';
import { Recaptcha } from '../components/Recaptcha';
import { useI18n } from '../context/I18nContext';
import {
  REGIONS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type ServiceTypeValue,
} from '../lib/constants';
import { TOWNS_BY_REGION, LOCALITIES_BY_CITY, OTHER } from '../lib/cameroonLocations';

// key generator helper
function newIdempotencyKey() {
  return crypto.randomUUID();
}

interface FormState {
  categoryId: string;
  serviceType: ServiceTypeValue | '';
  region: string;
  city: string;
  locality: string;
  description: string;
}

const emptyForm: FormState = {
  categoryId: '', serviceType: '', region: '', city: '', locality: '', description: '',
};

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState('');
  const resetRecaptchaRef = useRef<() => void>(() => {});

  useEffect(() => {
    subscriberCategoriesApi
      .list()
      .then(setCategories)
      .catch((err) => setCategoriesError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')));
  }, [t]);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // region change handler
  const setRegion = (region: string) => setForm((f) => ({ ...f, region, city: '', locality: '' }));

  // city change handler
  const setCity = (city: string) => setForm((f) => ({ ...f, city, locality: '' }));

  // city options list
  const cityOptions = form.region ? [...(TOWNS_BY_REGION[form.region] ?? []), OTHER] : [];
  // locality options list
  const localityOptions =
    form.city && form.city !== OTHER ? [...(LOCALITIES_BY_CITY[form.city] ?? []), OTHER] : [];
  const showLocality = form.city !== '' && form.city !== OTHER;

  // description required flag
  const descriptionRequired = form.city === OTHER || form.locality === OTHER;
  const descriptionPlaceholder =
    form.city === OTHER
      ? t('submit.descriptionPlaceholderCityOther')
      : form.locality === OTHER
        ? t('submit.descriptionPlaceholderLocalityOther')
        : t('submit.descriptionPlaceholder');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!captchaToken) e.captcha = t('validation.required');
    if (!form.categoryId) e.categoryId = t('validation.required');
    if (!form.serviceType) e.serviceType = t('validation.required');
    if (!form.region) e.region = t('validation.required');
    if (!form.city) e.city = t('validation.required');
    if (showLocality && !form.locality) e.locality = t('validation.required');
    if (descriptionRequired && !form.description.trim()) e.description = t('submit.descriptionRequiredOther');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBanner('');
    if (!validate()) return;

    const selectedCategory = categories.find((c) => String(c.id) === form.categoryId);

    setLoading(true);
    try {
      const res = await complaintsApi.submit({
        idempotencyKey,
        type: selectedCategory ? selectedCategory.name : form.categoryId,
        categoryId: selectedCategory?.id,
        serviceType: form.serviceType as ServiceTypeValue,
        region: form.region,
        city: form.city,
        locality: showLocality ? form.locality : undefined,
        description: form.description.trim() || undefined,
        captchaToken,
      });
      setResult(res);
      setToast(t('submit.success'));
      // reset key value
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
        {categoriesError && <div className="banner error">{categoriesError}</div>}

        <form onSubmit={handleSubmit} className="form-card" noValidate>
          <div className={`field ${errors.categoryId ? 'error' : ''}`}>
            <label>{t('submit.complaintType')}</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">{t('register.selectEllipsis')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <span className="field-error">{errors.categoryId}</span>}
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
            <select value={form.region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">{t('register.selectEllipsis')}</option>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {errors.region && <span className="field-error">{errors.region}</span>}
          </div>

          <div className={`field ${errors.city ? 'error' : ''}`}>
            <label>{t('common.city')}</label>
            <select
              value={form.city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!form.region}
            >
              <option value="">
                {form.region ? t('register.selectEllipsis') : t('submit.pickRegionFirst')}
              </option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c === OTHER ? t('submit.otherNotListed') : c}
                </option>
              ))}
            </select>
            {errors.city && <span className="field-error">{errors.city}</span>}
          </div>

          {showLocality && (
            <div className={`field ${errors.locality ? 'error' : ''}`}>
              <label>{t('submit.locality')}</label>
              <select value={form.locality} onChange={(e) => set('locality', e.target.value)}>
                <option value="">{t('register.selectEllipsis')}</option>
                {localityOptions.map((l) => (
                  <option key={l} value={l}>
                    {l === OTHER ? t('submit.otherNotListed') : l}
                  </option>
                ))}
              </select>
              {errors.locality && <span className="field-error">{errors.locality}</span>}
            </div>
          )}

          <div className={`field ${errors.description ? 'error' : ''}`}>
            <label>
              {t('common.description')}{' '}
              <span className="hint-inline">
                {descriptionRequired ? t('submit.required') : t('submit.optional')}
              </span>
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={descriptionPlaceholder}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
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
      {toast && <Toast message={toast} onClose={() => setToast(null)} duration={4000} />}
    </div>
  );
}
