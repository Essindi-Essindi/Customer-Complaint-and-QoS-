import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { CameroonHeatMap } from '../components/CameroonHeatMap';
import { analyticsApi, ApiError } from '../lib/api';
import type { HeatMapResponse } from '../lib/api';
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, type ServiceTypeValue } from '../lib/constants';
import { useI18n } from '../context/I18nContext';

// GET /api/analytics/heatmap requires start/end (LocalDate) and returns
// HeatMapResponse rows: region, city, complaintCount. There's no
// type/service-line breakdown per region on the backend, so the old
// "breakdown panel" with fake percentages is gone — this just renders what
// the endpoint actually returns.
function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function defaultEnd() {
  return new Date().toISOString().slice(0, 10);
}

export default function ManagerHeatmap() {
  const { t, lang } = useI18n();
  const [serviceType, setServiceType] = useState<ServiceTypeValue | ''>('');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [rows, setRows] = useState<HeatMapResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // `silent` skips the loading state so the periodic auto-refresh below
  // swaps the map's shading in place instead of flashing a spinner over it
  // every 30s — only a manual Apply (or the very first load) shows one.
  const load = (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    setError('');
    analyticsApi
      .heatMap(start, end, serviceType || undefined)
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => {
        if (!opts.silent) setLoading(false);
      });
  };

  // Reloads whenever a filter changes, then keeps polling in the background
  // so the map reflects newly-submitted complaints without the manager
  // having to hit Apply again.
  useEffect(() => {
    load();
    const id = setInterval(() => load({ silent: true }), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, serviceType]);

  const handleApply = (ev: FormEvent) => {
    ev.preventDefault();
    load();
  };

  // Aggregate per region for the map shading; city breakdown shown below.
  const byRegion = new Map<string, number>();
  for (const r of rows) byRegion.set(r.region, (byRegion.get(r.region) || 0) + r.complaintCount);

  return (
    <div className="staff-layout">
      <StaffSidebar variant="manager" />
      <div className="staff-main">
        <StaffHeader />
        <main className="page-content">
          <h1>{t('page.managerHeatmap')}</h1>

          <form onSubmit={handleApply} className="filters-bar">
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceTypeValue | '')}>
              <option value="">{t('common.serviceType')}</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_TYPE_LABELS[s][lang]}
                </option>
              ))}
            </select>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
            <button type="submit" className="btn btn-primary btn-sm">
              {t('common.apply')}
            </button>
          </form>

          {error && <div className="banner error">{error}</div>}

          {loading ? (
            <p>{t('common.loading')}</p>
          ) : rows.length === 0 ? (
            <div className="empty-state">{t('heatmap.empty')}</div>
          ) : (
            <>
              <CameroonHeatMap counts={byRegion} />

              <h2 style={{ marginTop: 24 }}>{t('heatmap.byCity')}</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('common.region')}</th>
                      <th>{t('common.city')}</th>
                      <th>{t('heatmap.complaints')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .slice()
                      .sort((a, b) => b.complaintCount - a.complaintCount)
                      .map((r, i) => (
                        <tr key={i}>
                          <td>{r.region}</td>
                          <td>{r.city || '—'}</td>
                          <td>{r.complaintCount}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
