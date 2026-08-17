import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ListFilter } from 'lucide-react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { Pagination } from '../components/Pagination';
import { CameroonHeatMap } from '../components/CameroonHeatMap';
import { analyticsApi, ApiError } from '../lib/api';
import type { HeatMapResponse, RegionTotalResponse } from '../lib/api';
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, type ServiceTypeValue } from '../lib/constants';
import { useI18n } from '../context/I18nContext';

const PAGE_SIZE = 10;

// GET /api/analytics/heatmap/regions (unpaginated, always every region —
// feeds the map) and GET /api/analytics/heatmap (paginated region+city rows
// — feeds the "by city" table) both take the same start/end/serviceType
// filters and are always fetched together, so the map and table can never
// show data from two different filter states.
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
  // '' means the table's default order (most complaints first) — the sort
  // itself happens on the backend, ahead of pagination, so "sort by region"
  // actually groups same-region rows together across pages instead of just
  // reordering whatever page happened to load.
  const [sortBy, setSortBy] = useState<'' | 'region' | 'city'>('');

  const [regionTotals, setRegionTotals] = useState<RegionTotalResponse[]>([]);
  const [rows, setRows] = useState<HeatMapResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // `silent` skips the loading state so the periodic auto-refresh below
  // swaps the map's shading in place instead of flashing a spinner over it
  // every 30s — only a manual Apply (or the very first load) shows one.
  const load = (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    setError('');
    Promise.all([
      analyticsApi.regionTotals(start, end, serviceType || undefined),
      analyticsApi.heatMap(start, end, serviceType || undefined, sortBy || undefined, page, PAGE_SIZE),
    ])
      .then(([regions, cityPage]) => {
        setRegionTotals(regions);
        setRows(cityPage.content);
        setTotalPages(cityPage.totalPages);
        setTotalElements(cityPage.totalElements);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => {
        if (!opts.silent) setLoading(false);
      });
  };

  // Reloads whenever a filter or the table page changes, then keeps polling
  // in the background so the map/table reflect newly-submitted complaints
  // without the manager having to hit Apply again.
  useEffect(() => {
    load();
    const id = setInterval(() => load({ silent: true }), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, serviceType, sortBy, page]);

  const handleApply = (ev: FormEvent) => {
    ev.preventDefault();
    setPage(0); // a new filter invalidates whatever page we were on
    load();
  };

  const handleSortChange = (value: '' | 'region' | 'city') => {
    setSortBy(value);
    setPage(0);
  };

  const byRegion = new Map<string, number>(regionTotals.map((r) => [r.region, r.complaintCount]));

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
              <ListFilter size={14} />
              {t('common.apply')}
            </button>
          </form>

          {error && <div className="banner error">{error}</div>}

          {loading ? (
            <p>{t('common.loading')}</p>
          ) : regionTotals.length === 0 ? (
            <div className="empty-state">{t('heatmap.empty')}</div>
          ) : (
            <>
              <CameroonHeatMap counts={byRegion} />

              <div className="page-title-row" style={{ marginTop: 24 }}>
                <h2>{t('heatmap.byCity')}</h2>
                <label className="sort-by-label">
                  {t('heatmap.sortBy')}{' '}
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as '' | 'region' | 'city')}
                  >
                    <option value="">{t('heatmap.sortByCount')}</option>
                    <option value="region">{t('common.region')}</option>
                    <option value="city">{t('common.city')}</option>
                  </select>
                </label>
              </div>
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
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.region}</td>
                        <td>{r.city || '—'}</td>
                        <td>{r.complaintCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
