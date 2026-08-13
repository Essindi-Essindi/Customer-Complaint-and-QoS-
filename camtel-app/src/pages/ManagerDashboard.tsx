import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { StatusBadge } from '../components/StatusBadge';
import {
  analyticsApi,
  agentComplaintsApi,
  complaintsApi,
  managerComplaintsApi,
  ApiError,
} from '../lib/api';
import type {
  KpiResponse,
  RecurringPatternResponse,
  ComplaintResponse,
  ComplaintManagerListItemResponse,
} from '../lib/api';
import {
  COMPLAINT_STATUSES,
  COMPLAINT_TYPES,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  REGIONS,
  type ComplaintStatusValue,
  type ServiceTypeValue,
} from '../lib/constants';
import { useI18n } from '../context/I18nContext';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 10;

export default function ManagerDashboard() {
  const { t, lang } = useI18n();
  const [kpis, setKpis] = useState<KpiResponse[]>([]);
  const [patterns, setPatterns] = useState<RecurringPatternResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const [lookupTicket, setLookupTicket] = useState('');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [found, setFound] = useState<ComplaintResponse | null>(null);
  const [status, setStatus] = useState<ComplaintStatusValue>('SUBMITTED');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // --- All-complaints table (GET /api/manager/complaints) --------------
  const [rows, setRows] = useState<ComplaintManagerListItemResponse[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filterType, setFilterType] = useState('');
  const [filterService, setFilterService] = useState<ServiceTypeValue | ''>('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState<ComplaintStatusValue | ''>('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    type: '',
    serviceType: '' as ServiceTypeValue | '',
    region: '',
    status: '' as ComplaintStatusValue | '',
    start: '',
    end: '',
  });

  const loadRows = useCallback(() => {
    setRowsLoading(true);
    setRowsError('');
    managerComplaintsApi
      .list({
        type: appliedFilters.type || undefined,
        serviceType: appliedFilters.serviceType || undefined,
        region: appliedFilters.region || undefined,
        status: appliedFilters.status || undefined,
        start: appliedFilters.start || undefined,
        end: appliedFilters.end || undefined,
        page,
        size: PAGE_SIZE,
      })
      .then((res) => {
        setRows(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .catch((err) => setRowsError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => setRowsLoading(false));
  }, [appliedFilters, page, t]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const applyFilters = (ev: FormEvent) => {
    ev.preventDefault();
    setPage(0);
    setAppliedFilters({
      type: filterType,
      serviceType: filterService,
      region: filterRegion,
      status: filterStatus,
      start: filterStart,
      end: filterEnd,
    });
  };

  const resetFilters = () => {
    setFilterType('');
    setFilterService('');
    setFilterRegion('');
    setFilterStatus('');
    setFilterStart('');
    setFilterEnd('');
    setPage(0);
    setAppliedFilters({ type: '', serviceType: '', region: '', status: '', start: '', end: '' });
  };

  const viewComplaint = async (ticketNumber: string) => {
    setLookupError('');
    try {
      const c = await complaintsApi.track(ticketNumber);
      setFound(c);
      setStatus(c.status);
      setNote('');
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    }
  };

  useEffect(() => {
    Promise.all([analyticsApi.kpis('type'), analyticsApi.recurringPatterns()])
      .then(([k, p]) => {
        setKpis(k);
        setPatterns(p);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => setLoading(false));
  }, [t]);

  const totalComplaints = kpis.reduce((sum, k) => sum + k.totalComplaints, 0);
  const resolvedComplaints = kpis.reduce((sum, k) => sum + k.resolvedComplaints, 0);
  const weightedAvgHours =
    totalComplaints > 0
      ? kpis.reduce((sum, k) => sum + k.averageResolutionTimeHours * k.totalComplaints, 0) / totalComplaints
      : 0;

  const handleLookup = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!lookupTicket.trim()) return;
    setLookupError('');
    setLooking(true);
    setFound(null);
    try {
      const c = await complaintsApi.track(lookupTicket.trim());
      setFound(c);
      setStatus(c.status);
      setNote('');
    } catch (err) {
      setLookupError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLooking(false);
    }
  };

  const saveStatus = async () => {
    if (!found) return;
    setSaving(true);
    try {
      const updated = await agentComplaintsApi.updateStatus(found.id, {
        newStatus: status,
        resolutionNote: note.trim() || undefined,
      });
      setFound(updated);
      setToast(t('common.updateSaved'));
      loadRows(); // refresh the table row's status too
    } catch (err) {
      setLookupError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const visiblePatterns = patterns.filter((_, i) => !dismissedPatterns.has(i));

  return (
    <div className="staff-layout">
      <StaffSidebar variant="manager" />
      <div className="staff-main">
        <StaffHeader />
        <main className="page-content">
          <h1>{t('page.managerDashboard')}</h1>

          {error && <div className="banner error">{error}</div>}

          {visiblePatterns.map((p) => {
            const idx = patterns.indexOf(p);
            return (
              <div key={idx} className="banner warning dismissible">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="banner-icon">
                  <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" />
                  <path d="M12 10v4.5M12 17.5h.01" />
                </svg>
                {t('dashboard.recurringPrefix')} {p.type} — {p.region} — {p.occurrences}{' '}
                {t('dashboard.complaintsIn')} {p.windowDescription}
                <button
                  type="button"
                  className="dismiss-btn"
                  aria-label={t('common.close')}
                  onClick={() => setDismissedPatterns((s) => new Set(s).add(idx))}
                >
                  ×
                </button>
              </div>
            );
          })}

          {loading ? (
            <p>{t('common.loading')}</p>
          ) : (
            <div className="kpi-row">
              <div className="kpi-card">
                <div className="kpi-label">{t('dashboard.totalComplaints')}</div>
                <div className="kpi-value">{totalComplaints}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">{t('dashboard.resolved')}</div>
                <div className="kpi-value">{resolvedComplaints}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">{t('dashboard.avgResolutionTime')}</div>
                <div className="kpi-value">{weightedAvgHours.toFixed(1)}h</div>
              </div>
            </div>
          )}

          <div className="quick-links">
            <Link to="/manager/heatmap" className="btn btn-outline btn-sm">
              {t('sidebar.heatmap')}
            </Link>
            <Link to="/manager/kpis" className="btn btn-outline btn-sm">
              {t('sidebar.kpis')}
            </Link>
            <Link to="/manager/reports" className="btn btn-outline btn-sm">
              {t('sidebar.reports')}
            </Link>
            <Link to="/manager/users" className="btn btn-outline btn-sm">
              {t('sidebar.users')}
            </Link>
          </div>

          <h2 style={{ marginTop: 32 }}>{t('dashboard.allComplaints')}</h2>

          <form onSubmit={applyFilters} className="filters-bar">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">{t('dashboard.allTypes')}</option>
              {COMPLAINT_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {ty}
                </option>
              ))}
            </select>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value as ServiceTypeValue | '')}
            >
              <option value="">{t('dashboard.allServices')}</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_TYPE_LABELS[s][lang]}
                </option>
              ))}
            </select>
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
              <option value="">{t('dashboard.allRegions')}</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ComplaintStatusValue | '')}
            >
              <option value="">{t('dashboard.allStatuses')}</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
            <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
            <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-sm">
              {t('dashboard.applyFilters')}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
              {t('dashboard.reset')}
            </button>
          </form>

          {rowsError && <div className="banner error">{rowsError}</div>}

          {rowsLoading ? (
            <p>{t('common.loading')}</p>
          ) : rows.length === 0 ? (
            <p>{t('dashboard.noComplaints')}</p>
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('common.ticketNumber')}</th>
                      <th>{t('common.subscriber')}</th>
                      <th>{t('common.complaintType')}</th>
                      <th>{t('common.service')}</th>
                      <th>{t('common.regionCitySlash')}</th>
                      <th>{t('common.status')}</th>
                      <th>{t('common.dateSubmitted')}</th>
                      <th>{t('common.assignedAgent')}</th>
                      <th>{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.ticketNumber}</td>
                        <td>{row.subscriberName ?? '—'}</td>
                        <td>{row.type}</td>
                        <td>{SERVICE_TYPE_LABELS[row.serviceType]?.[lang] ?? row.serviceType}</td>
                        <td>
                          {row.region}/{row.city}
                        </td>
                        <td>
                          <StatusBadge status={row.status} />
                        </td>
                        <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td>{row.assignedAgentName ?? t('dashboard.unassigned')}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => viewComplaint(row.ticketNumber)}
                          >
                            {t('dashboard.view')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-bar">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  {t('dashboard.previous')}
                </button>
                <span>
                  {t('dashboard.pageLabel')} {totalPages === 0 ? 0 : page + 1} {t('dashboard.ofLabel')}{' '}
                  {totalPages} ({totalElements})
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('dashboard.next')}
                </button>
              </div>
            </>
          )}

          <h2 style={{ marginTop: 32 }}>{t('dashboard.lookupTitle')}</h2>
          <form onSubmit={handleLookup} className="form-card claim-form">
            <div className="field">
              <label>{t('dashboard.lookupLabel')}</label>
              <input
                type="text"
                value={lookupTicket}
                onChange={(e) => setLookupTicket(e.target.value)}
                placeholder="TKT-..."
              />
            </div>
            {lookupError && <div className="banner error">{lookupError}</div>}
            <button type="submit" className="btn btn-primary btn-sm" disabled={looking}>
              {looking ? t('common.loading') : t('dashboard.lookup')}
            </button>
          </form>
        </main>
      </div>

      {found && (
        <Modal title={found.ticketNumber} onClose={() => setFound(null)} wide>
          <div className="detail-grid">
            <div>
              <strong>{t('common.complaintType')}</strong>
              <div>{found.type}</div>
            </div>
            <div>
              <strong>{t('common.location')}</strong>
              <div>
                {found.city}, {found.region}
              </div>
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label>{t('common.status')}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatusValue)}>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('agent.resolutionNote')}</label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setFound(null)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={saveStatus} disabled={saving}>
              {saving ? t('common.saving') : t('agent.saveUpdate')}
            </button>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
