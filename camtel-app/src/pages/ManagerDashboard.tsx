import { useEffect, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { X, Eye, ListFilter, RotateCcw, Search } from 'lucide-react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import {
  analyticsApi,
  agentComplaintsApi,
  managerComplaintsApi,
  ApiError,
} from '../lib/api';
import type {
  KpiResponse,
  RecurringPatternResponse,
  ComplaintStaffDetailResponse,
  ComplaintManagerListItemResponse,
  AgentWithLoadResponse,
} from '../lib/api';
import { OTHER } from '../lib/cameroonLocations';
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

  // ── KPIs / patterns ──────────────────────────────────────────────────────
  const [kpis, setKpis] = useState<KpiResponse[]>([]);
  const [patterns, setPatterns] = useState<RecurringPatternResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // ── Complaint table ───────────────────────────────────────────────────────
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

  // ── Modal / detail ────────────────────────────────────────────────────────
  // Always fetched fresh via agentComplaintsApi.getByTicket() (city,
  // locality, description, sender name/email/phone, assigned agent — the
  // full picture) rather than reused from the list row, so a direct ticket
  // lookup (no row involved at all) shows exactly the same detail as
  // opening one from the table.
  const [found, setFound] = useState<ComplaintStaffDetailResponse | null>(null);
  const [modalError, setModalError] = useState('');
  const [status, setStatus] = useState<ComplaintStatusValue>('SUBMITTED');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Agent assignment ──────────────────────────────────────────────────────
  const [agents, setAgents] = useState<AgentWithLoadResponse[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [confirmAssign, setConfirmAssign] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // ── Ticket lookup (manual) ────────────────────────────────────────────────
  const [lookupTicket, setLookupTicket] = useState('');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // ── Load complaint rows ───────────────────────────────────────────────────
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
        .catch((err) =>
            setRowsError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'))
        )
        .finally(() => setRowsLoading(false));
  }, [appliedFilters, page, t]);

  useEffect(() => { loadRows(); }, [loadRows]);

  // ── Load KPIs / patterns once ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([analyticsApi.kpis('type'), analyticsApi.recurringPatterns()])
        .then(([k, p]) => { setKpis(k); setPatterns(p); })
        .catch((err) =>
            setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'))
        )
        .finally(() => setLoading(false));
  }, [t]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const loadAgents = (serviceType: string) => {
    setAgentsLoading(true);
    setAgents([]);
    managerComplaintsApi
        .agentsByService(serviceType)
        .then(setAgents)
        .catch(() => setAgents([]))
        .finally(() => setAgentsLoading(false));
  };

  const openModal = async (ticketNumber: string) => {
    setModalError('');
    setAssignError('');
    setSelectedAgentId(null);
    setConfirmAssign(false);
    setFound(null);

    try {
      const c = await agentComplaintsApi.getByTicket(ticketNumber);
      setFound(c);
      setStatus(c.status);
      setNote('');
      if (c.serviceType) loadAgents(c.serviceType);
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    }
  };

  const closeModal = () => {
    setFound(null);
    setAgents([]);
    setSelectedAgentId(null);
    setConfirmAssign(false);
    setAssignError('');
    setModalError('');
  };

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
    setFilterType(''); setFilterService(''); setFilterRegion('');
    setFilterStatus(''); setFilterStart(''); setFilterEnd('');
    setPage(0);
    setAppliedFilters({ type: '', serviceType: '', region: '', status: '', start: '', end: '' });
  };

  const handleLookup = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!lookupTicket.trim()) return;
    setLookupError('');
    setLooking(true);
    try {
      await openModal(lookupTicket.trim());
    } catch (err) {
      setLookupError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLooking(false);
    }
  };

  const saveStatus = async () => {
    if (!found) return;
    setSaving(true);
    setModalError('');
    try {
      await agentComplaintsApi.updateStatus(found.id, {
        newStatus: status,
        resolutionNote: note.trim() || undefined,
      });
      // updateStatus() only returns the lean ComplaintResponse shape — refetch
      // the full staff detail so `found` stays fully populated (sender,
      // locality, description) rather than narrowing after a save.
      const refreshed = await agentComplaintsApi.getByTicket(found.ticketNumber);
      setFound(refreshed);
      setToast(t('common.updateSaved'));
      loadRows();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const confirmAndAssign = async () => {
    if (!found || selectedAgentId === null) return;
    setAssigning(true);
    setAssignError('');
    try {
      await managerComplaintsApi.assignAgent(found.id, selectedAgentId);
      setToast(t('assign.success'));
      setConfirmAssign(false);
      setSelectedAgentId(null);
      loadRows();
      // Refresh agent load counts in the dropdown
      if (found.serviceType) loadAgents(found.serviceType);
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setAssigning(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const totalComplaints = kpis.reduce((s, k) => s + k.totalComplaints, 0);
  const resolvedComplaints = kpis.reduce((s, k) => s + k.resolvedComplaints, 0);
  const weightedAvgHours =
      totalComplaints > 0
          ? kpis.reduce((s, k) => s + k.averageResolutionTimeHours * k.totalComplaints, 0) /
          totalComplaints
          : 0;

  const visiblePatterns = patterns.filter((_, i) => !dismissedPatterns.has(i));
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
      <div className="staff-layout">
        <StaffSidebar variant="manager" />
        <div className="staff-main">
          <StaffHeader />
          <main className="page-content">
            <h1>{t('page.managerDashboard')}</h1>

            {error && <div className="banner error">{error}</div>}

            {/* Recurring pattern banners */}
            {visiblePatterns.map((p) => {
              const idx = patterns.indexOf(p);
              return (
                  <div key={idx} className="banner warning dismissible">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="banner-icon">
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
                      <X size={16} />
                    </button>
                  </div>
              );
            })}

            {/* KPI cards */}
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

            {/* Quick links */}
            <div className="quick-links">
              <Link to="/manager/heatmap" className="btn btn-outline btn-sm">{t('sidebar.heatmap')}</Link>
              <Link to="/manager/kpis" className="btn btn-outline btn-sm">{t('sidebar.kpis')}</Link>
              <Link to="/manager/reports" className="btn btn-outline btn-sm">{t('sidebar.reports')}</Link>
              <Link to="/manager/users" className="btn btn-outline btn-sm">{t('sidebar.users')}</Link>
            </div>

            {/* ── All complaints table ── */}
            <h2 style={{ marginTop: 32 }}>{t('dashboard.allComplaints')}</h2>

            <form onSubmit={applyFilters} className="filters-bar">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">{t('dashboard.allTypes')}</option>
                {COMPLAINT_TYPES.map((ty) => (
                    <option key={ty} value={ty}>{ty}</option>
                ))}
              </select>
              <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value as ServiceTypeValue | '')}
              >
                <option value="">{t('dashboard.allServices')}</option>
                {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>{SERVICE_TYPE_LABELS[s][lang]}</option>
                ))}
              </select>
              <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
                <option value="">{t('dashboard.allRegions')}</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ComplaintStatusValue | '')}
              >
                <option value="">{t('dashboard.allStatuses')}</option>
                {COMPLAINT_STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
              <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
              <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
              <button type="submit" className="btn btn-primary btn-sm">
                <ListFilter size={14} />
                {t('dashboard.applyFilters')}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
                <RotateCcw size={14} />
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
                            <td>{row.region}/{row.city}</td>
                            <td><StatusBadge status={row.status} /></td>
                            <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                            <td>{row.assignedAgentName ?? t('dashboard.unassigned')}</td>
                            <td>
                              <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => openModal(row.ticketNumber)}
                              >
                                <Eye size={13} />
                                {t('dashboard.view')}
                              </button>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
                </>
            )}

            {/* ── Ticket lookup ── */}
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
                <Search size={14} />
                {looking ? t('common.loading') : t('dashboard.lookup')}
              </button>
            </form>
          </main>
        </div>

        {/* ── Complaint detail modal ── */}
        {found && (
            <Modal title={found.ticketNumber} onClose={closeModal} wide>

              {/* Detail grid */}
              <div className="detail-grid">
                <div>
                  <strong>{t('common.complaintType')}</strong>
                  <div>{found.type}</div>
                </div>
                <div>
                  <strong>{t('common.location')}</strong>
                  <div>
                    {found.city === OTHER ? t('submit.otherNotListed') : found.city}, {found.region}
                  </div>
                </div>
                {found.locality && (
                  <div>
                    <strong>{t('submit.locality')}</strong>
                    <div>{found.locality === OTHER ? t('submit.otherNotListed') : found.locality}</div>
                  </div>
                )}
                <div>
                  <strong>{t('common.service')}</strong>
                  <div>
                    {SERVICE_TYPE_LABELS[found.serviceType as ServiceTypeValue]?.[lang] ?? found.serviceType}
                  </div>
                </div>
                <div>
                  <strong>{t('common.assignedAgent')}</strong>
                  <div>{found.assignedAgentName ?? t('dashboard.unassigned')}</div>
                </div>
                <div>
                  <strong>{t('common.sender')}</strong>
                  <div>{found.subscriberName ?? '—'}</div>
                </div>
                {(found.subscriberEmail || found.subscriberPhone) && (
                  <div>
                    <strong>{t('common.contact')}</strong>
                    <div>{[found.subscriberEmail, found.subscriberPhone].filter(Boolean).join(' · ')}</div>
                  </div>
                )}
                <div className="full">
                  <strong>{t('common.description')}</strong>
                  <div>{found.description || t('detail.noDescription')}</div>
                </div>
              </div>

              {modalError && <div className="banner error" style={{ margin: '0 0 12px' }}>{modalError}</div>}

              {/* ── Agent assignment block ── */}
              <div className="assign-block">
                <p className="assign-block__title">{t('assign.title')}</p>

                {agentsLoading ? (
                    <p className="assign-block__hint">{t('common.loading')}</p>
                ) : agents.length === 0 ? (
                    <p className="assign-block__hint">{t('assign.noAgents')}</p>
                ) : (
                    <>
                      <select
                          className="assign-block__select"
                          value={selectedAgentId ?? ''}
                          onChange={(e) => {
                            setSelectedAgentId(e.target.value ? Number(e.target.value) : null);
                            setConfirmAssign(false);
                            setAssignError('');
                          }}
                      >
                        <option value="">{t('assign.selectPlaceholder')}</option>
                        {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                              {a.assignedRegion ? ` · ${a.assignedRegion}` : ''} — {a.assignedComplaintCount}{' '}
                              {t('assign.activeComplaints')}
                            </option>
                        ))}
                      </select>

                      {assignError && (
                          <div className="banner error" style={{ marginTop: 8 }}>{assignError}</div>
                      )}

                      {selectedAgentId !== null && !confirmAssign && (
                          <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ marginTop: 8 }}
                              onClick={() => setConfirmAssign(true)}
                          >
                            {t('assign.btn')}
                          </button>
                      )}

                      {confirmAssign && selectedAgent && (
                          <div className="assign-confirm">
                            <p className="assign-confirm__text">
                              {t('assign.confirmTitle')} <strong>{selectedAgent.name}</strong> ?
                            </p>
                            <div className="assign-confirm__actions">
                              <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={confirmAndAssign}
                                  disabled={assigning}
                              >
                                {assigning ? t('assign.assigning') : t('common.confirm')}
                              </button>
                              <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setConfirmAssign(false)}
                                  disabled={assigning}
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                      )}
                    </>
                )}
              </div>

              {/* Status update */}
              <div className="field" style={{ marginTop: 16 }}>
                <label>{t('common.status')}</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ComplaintStatusValue)}
                >
                  {COMPLAINT_STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`status.${s}`)}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{t('agent.resolutionNote')}</label>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
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