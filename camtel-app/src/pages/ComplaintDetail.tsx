import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SubscriberNav } from '../components/SubscriberNav';
import { StatusBadge } from '../components/StatusBadge';
import { complaintsApi, ApiError } from '../lib/api';
import type { ComplaintResponse } from '../lib/api';
import { Toast } from '../components/Toast';
import { useI18n } from '../context/I18nContext';
import { COMPLAINT_STATUSES, SERVICE_TYPE_LABELS, type ServiceTypeValue } from '../lib/constants';
import { OTHER } from '../lib/cameroonLocations';
import { ChevronLeftIcon } from '../components/icons';
import { useAutoRefresh } from '../lib/useAutoRefresh';

// detail page component
export default function ComplaintDetail() {
  const { ticketNumber } = useParams<{ ticketNumber: string }>();
  const { t, lang } = useI18n();

  const [complaint, setComplaint] = useState<ComplaintResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [rated, setRated] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketNumber) return;
    let cancelled = false;
    setLoading(true);
    complaintsApi
      .track(ticketNumber)
      .then((data) => {
        if (!cancelled) setComplaint(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketNumber, t]);

  // auto-refresh setup
  useAutoRefresh(() => {
    if (!ticketNumber) return;
    complaintsApi.track(ticketNumber).then(setComplaint).catch(() => {});
  });

  if (loading) {
    return (
      <div className="page">
        <SubscriberNav />
        <main className="page-content">
          <p>{t('common.loading')}</p>
        </main>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="page">
        <SubscriberNav />
        <main className="page-content">
          <Link to="/my-complaints">{t('detail.backToMyComplaints')}</Link>
          <p>{error || t('detail.notFound')}</p>
        </main>
      </div>
    );
  }

  const currentIdx = COMPLAINT_STATUSES.indexOf(complaint.status);
  const serviceLabel =
    SERVICE_TYPE_LABELS[complaint.serviceType as ServiceTypeValue]?.[lang] ?? complaint.serviceType;

  const handleRate = async () => {
    if (rating < 1) return;
    setRatingError('');
    try {
      await complaintsApi.rate(complaint.id, { score: rating, comment: comment.trim() || undefined });
      setRated(true);
      setToast(t('detail.thankYou'));
    } catch (err) {
      setRatingError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <div className="page">
      <SubscriberNav />
      <main className="page-content">
        <Link to="/my-complaints" className="back-link">
          <ChevronLeftIcon /> {t('detail.backToMyComplaints')}
        </Link>
        <h1 className="ticket-heading">{complaint.ticketNumber}</h1>

        <div className="detail-grid">
          <div>
            <strong>{t('common.complaintType')}</strong>
            <div>{complaint.type}</div>
          </div>
          <div>
            <strong>{t('detail.affectedService')}</strong>
            <div>{serviceLabel}</div>
          </div>
          <div>
            <strong>{t('common.region')}</strong>
            <div>{complaint.region}</div>
          </div>
          <div>
            <strong>{t('common.city')}</strong>
            <div>{complaint.city === OTHER ? t('submit.otherNotListed') : complaint.city}</div>
          </div>
          {complaint.locality && (
            <div>
              <strong>{t('submit.locality')}</strong>
              <div>{complaint.locality === OTHER ? t('submit.otherNotListed') : complaint.locality}</div>
            </div>
          )}
          <div>
            <strong>{t('detail.submissionDate')}</strong>
            <div>{new Date(complaint.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <strong>{t('common.status')}</strong>
            <div>
              <StatusBadge status={complaint.status} />
            </div>
          </div>
        </div>

        {complaint.description && (
          <div className="detail-description">
            <strong>{t('common.description')}</strong>
            <p>{complaint.description}</p>
          </div>
        )}

        <div className="progress-steps">
          {COMPLAINT_STATUSES.map((step, i) => (
            <div
              key={step}
              className={`step ${i <= currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}`}
            >
              <div className="step-circle">
                {i < currentIdx ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <div className="step-label">{t(`status.${step}`)}</div>
            </div>
          ))}
        </div>

        {complaint.updatedAt && (
          <p className="meta">
            {t('detail.lastUpdated')} {new Date(complaint.updatedAt).toLocaleString()}
          </p>
        )}

        {complaint.status === 'RESOLVED' && !rated && (
          <div className="rate-section form-card">
            <h2>{t('detail.rateResolution')}</h2>
            <p>
              {t('detail.ticketPrefix')} {complaint.ticketNumber} — {complaint.type}
            </p>
            {ratingError && <div className="banner error">{ratingError}</div>}
            <div className="stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`star ${s <= (hover || rating) ? 'on' : ''}`}
                  aria-label={`${s}`}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 2.5l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 21.2l1.6-6.9-5.3-4.7 7-.7L12 2.5z" />
                  </svg>
                </button>
              ))}
            </div>
            <div className="field">
              <label>{t('detail.tellUsMore')}</label>
              <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRate}
              disabled={rating < 1}
            >
              {t('detail.submitRating')}
            </button>
          </div>
        )}

        {complaint.status === 'RESOLVED' && rated && (
          <div className="rate-section form-card">
            <p className="success-text">{t('detail.thankYou')}</p>
          </div>
        )}
      </main>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
