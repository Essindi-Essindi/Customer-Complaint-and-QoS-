import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { agentComplaintsApi, complaintsApi, ApiError } from '../lib/api';
import type { ComplaintListItemResponse } from '../lib/api';
import { COMPLAINT_STATUSES, SERVICE_TYPE_LABELS, type ComplaintStatusValue, type ServiceTypeValue } from '../lib/constants';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

type Tab = 'service' | 'mine';

export default function AgentComplaints() {
  const { t, lang } = useI18n();
  const { department } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('service');

  // --- service-level complaints (all complaints in agent's service) ---
  const [serviceComplaints, setServiceComplaints] = useState<ComplaintListItemResponse[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState('');

  // --- agent's personally assigned complaints ---
  const [myComplaints, setMyComplaints] = useState<ComplaintListItemResponse[]>([]);
  const [myLoading, setMyLoading] = useState(true);
  const [myError, setMyError] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  const [claimTicket, setClaimTicket] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  const [selected, setSelected] = useState<ComplaintListItemResponse | null>(null);
  const [status, setStatus] = useState<ComplaintStatusValue>('ASSIGNED');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const refreshService = () => {
    setServiceLoading(true);
    agentComplaintsApi
        .listServiceComplaints()
        .then(setServiceComplaints)
        .catch((err) => setServiceError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
        .finally(() => setServiceLoading(false));
  };

  const refreshMine = () => {
    setMyLoading(true);
    agentComplaintsApi
        .listAssigned()
        .then(setMyComplaints)
        .catch((err) => setMyError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
        .finally(() => setMyLoading(false));
  };

  const refreshAll = () => {
    refreshService();
    refreshMine();
  };

  useEffect(refreshAll, [t]);

  const open = (c: ComplaintListItemResponse) => {
    setSelected(c);
    setStatus(c.status);
    setNote('');
    setModalError('');
  };

  const handleClaim = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!claimTicket.trim()) return;
    setClaimError('');
    setClaiming(true);
    try {
      const ticket = await complaintsApi.track(claimTicket.trim());
      await agentComplaintsApi.claim(ticket.id);
      setClaimTicket('');
      setToast(t('agent.claimSuccess'));
      refreshAll();
    } catch (err) {
      setClaimError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setClaiming(false);
    }
  };

  const save = async () => {
    if (!selected) return;
    if (status === 'RESOLVED' && !note.trim()) {
      setModalError(t('agent.resolutionNoteRequired'));
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      await agentComplaintsApi.updateStatus(selected.id, {
        newStatus: status,
        resolutionNote: note.trim() || undefined,
      });
      setSelected(null);
      setToast(t('common.updateSaved'));
      refreshAll();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const serviceLabel = department
      ? (SERVICE_TYPE_LABELS[department as ServiceTypeValue]?.[lang] ?? department)
      : null;

  const renderTable = (items: ComplaintListItemResponse[], loading: boolean, error: string) => {
    if (loading) return <p>{t('common.loading')}</p>;
    if (error) return <div className="banner error">{error}</div>;
    if (items.length === 0) return <div className="empty-state">{t('agent.emptyState')}</div>;
    return (
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
            {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.ticketNumber}</td>
                  <td>{c.type}</td>
                  <td>{c.region}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm" onClick={() => open(c)}>
                      {t('agent.open')}
                    </button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
    );
  };

  return (
      <div className="staff-layout">
        <StaffSidebar variant="agent" />
        <div className="staff-main">
          <StaffHeader />
          <main className="page-content">
            <h1>{t('page.agentComplaints')}</h1>

            {/* Claim by ticket */}
            <form onSubmit={handleClaim} className="form-card claim-form">
              <div className="field">
                <label>{t('agent.claimByTicket')}</label>
                <input
                    type="text"
                    value={claimTicket}
                    onChange={(e) => setClaimTicket(e.target.value)}
                    placeholder="TKT-..."
                />
              </div>
              {claimError && <div className="banner error">{claimError}</div>}
              <button type="submit" className="btn btn-primary btn-sm" disabled={claiming}>
                {claiming ? t('agent.claiming') : t('agent.claim')}
              </button>
            </form>

            {/* Tab bar */}
            <div className="tab-bar" style={{ marginTop: 24, marginBottom: 0 }}>
              <button
                  type="button"
                  className={`tab-btn${activeTab === 'service' ? ' active' : ''}`}
                  onClick={() => setActiveTab('service')}
              >
                {serviceLabel
                    ? lang === 'fr'
                        ? `Toutes — ${serviceLabel}`
                        : `All — ${serviceLabel}`
                    : t('agent.tabService')}
                <span className="tab-count">{serviceComplaints.length}</span>
              </button>
              <button
                  type="button"
                  className={`tab-btn${activeTab === 'mine' ? ' active' : ''}`}
                  onClick={() => setActiveTab('mine')}
              >
                {t('agent.tabMine')}
                <span className="tab-count">{myComplaints.length}</span>
              </button>
            </div>

            <div className="tab-panel">
              {activeTab === 'service'
                  ? renderTable(serviceComplaints, serviceLoading, serviceError)
                  : renderTable(myComplaints, myLoading, myError)}
            </div>
          </main>
        </div>

        {selected && (
            <Modal title={selected.ticketNumber} onClose={() => setSelected(null)} wide>
              <div className="detail-grid">
                <div>
                  <strong>{t('common.complaintType')}</strong>
                  <div>{selected.type}</div>
                </div>
                <div>
                  <strong>{t('common.region')}</strong>
                  <div>{selected.region}</div>
                </div>
              </div>

              {modalError && <div className="banner error">{modalError}</div>}

              <div className="field" style={{ marginTop: 16 }}>
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
                <label>
                  {t('agent.resolutionNote')} {status === 'RESOLVED' && <span>({t('common.required')})</span>}
                </label>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>
                  {t('common.cancel')}
                </button>
                <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? t('common.saving') : t('agent.saveUpdate')}
                </button>
              </div>
            </Modal>
        )}
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>
  );
}