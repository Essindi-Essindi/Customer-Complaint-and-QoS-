import { useEffect, useState } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { analyticsApi, ApiError } from '../lib/api';
import type { KpiResponse, RecurringPatternResponse } from '../lib/api';
import { KPI_GROUP_OPTIONS, type KpiGroupBy } from '../lib/constants';
import { useI18n } from '../context/I18nContext';

// GET /api/analytics/kpis only supports groupBy in {type, region, team}
// (AnalyticsServiceImpl.getKpis switches on those, anything else falls back
// to "type"). There's no per-agent, per-service-line, per-status, or
// time-series grouping on the backend, so the old fake bar/pie/line charts
// are gone in favour of the real grouped table plus the real recurring
// patterns endpoint.
export default function ManagerKPIs() {
  const { t } = useI18n();
  const [groupBy, setGroupBy] = useState<KpiGroupBy>('type');
  const [kpis, setKpis] = useState<KpiResponse[]>([]);
  const [patterns, setPatterns] = useState<RecurringPatternResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([analyticsApi.kpis(groupBy), analyticsApi.recurringPatterns()])
      .then(([k, p]) => {
        setKpis(k);
        setPatterns(p);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => setLoading(false));
  }, [groupBy, t]);

  return (
    <div className="staff-layout">
      <StaffSidebar variant="manager" />
      <div className="staff-main">
        <StaffHeader />
        <main className="page-content">
          <h1>{t('page.managerKpis')}</h1>

          <div className="filters-bar">
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as KpiGroupBy)}>
              {KPI_GROUP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t('kpis.groupByPrefix')} {o.en}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="banner error">{error}</div>}

          {loading ? (
            <p>{t('common.loading')}</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('kpis.group')}</th>
                    <th>{t('kpis.total')}</th>
                    <th>{t('kpis.resolved')}</th>
                    <th>{t('kpis.avgResolutionHours')}</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((k, i) => (
                    <tr key={i}>
                      <td>{k.groupLabel || '—'}</td>
                      <td>{k.totalComplaints}</td>
                      <td>{k.resolvedComplaints}</td>
                      <td>{k.averageResolutionTimeHours.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <section className="patterns-section">
            <h2>{t('kpis.recurringPatterns')}</h2>
            {patterns.length === 0 ? (
              <div className="empty-state">{t('kpis.noPatterns')}</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('common.complaintType')}</th>
                      <th>{t('common.region')}</th>
                      <th>{t('kpis.volume')}</th>
                      <th>{t('kpis.timeWindow')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patterns.map((p, i) => (
                      <tr key={i}>
                        <td>{p.type}</td>
                        <td>{p.region}</td>
                        <td>{p.occurrences}</td>
                        <td>{p.windowDescription}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
