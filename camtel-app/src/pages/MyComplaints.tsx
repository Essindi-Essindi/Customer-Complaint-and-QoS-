import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { SubscriberNav } from '../components/SubscriberNav';
import { StatusBadge } from '../components/StatusBadge';
import { complaintsApi, ApiError } from '../lib/api';
import type { ComplaintListItemResponse } from '../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAutoRefresh } from '../lib/useAutoRefresh';

// GET /api/complaints/mine returns ComplaintListItemResponse rows: id,
// ticketNumber, type, status, region, createdAt. There's no service/city/
// subscriber info on this list endpoint, so the table only shows what's
// actually there.
export default function MyComplaints() {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState<ComplaintListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    complaintsApi
      .listMine()
      .then((data) => {
        if (!cancelled) setComplaints(data);
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
  }, [t]);

  // Auto-refresh: an agent/manager can move a status forward at any time —
  // re-fetch quietly every 5s so the list stays current without a manual
  // reload. Skips the loading spinner on these background ticks.
  useAutoRefresh(() => {
    complaintsApi.listMine().then(setComplaints).catch(() => {});
  });

  return (
    <div className="page">
      <SubscriberNav />
      <main className="page-content">
        <h1>{t('page.myComplaints')}</h1>

        {error && <div className="banner error">{error}</div>}

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <p>{t('myComplaints.empty')}</p>
            <Link to="/submit-complaint" className="btn btn-primary">
              {t('submit.submitComplaint')}
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('common.ticketNumber')}</th>
                  <th>{t('common.complaintType')}</th>
                  <th>{t('common.region')}</th>
                  <th>{t('common.dateSubmitted')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.action')}</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td>{c.ticketNumber}</td>
                    <td>{c.type}</td>
                    <td>{c.region}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <Link to={`/my-complaints/${c.ticketNumber}`} className="btn btn-sm">
                        <Eye size={13} />
                        {t('myComplaints.viewDetails')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
