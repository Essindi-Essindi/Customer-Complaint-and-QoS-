import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { agentComplaintsApi, complaintsApi, ApiError } from '../lib/api';
import type { ComplaintListItemResponse } from '../lib/api';
import { COMPLAINT_STATUSES, type ComplaintStatusValue } from '../lib/constants';
import { useI18n } from '../context/I18nContext';

// GET /api/agent/complaints/assigned only ever returns complaints already
// assigned to this agent (findByAgentId) — there is no endpoint that lists
// unclaimed complaints, so an agent can't "browse" for work. The only way to
// pick one up is PATCH /api/agent/complaints/{id}/claim, and that needs a
// numeric complaint id. The public track endpoint (GET
// /api/complaints/track/{ticketNumber}) is the only way to turn a ticket
// number a manager/subscriber gave you into that id, so that's the flow
// below: look a ticket up, then claim it.
export default function AgentComplaints() {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState<ComplaintListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [claimTicket, setClaimTicket] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  const [selected, setSelected] = useState<ComplaintListItemResponse | null>(null);
  const [status, setStatus] = useState<ComplaintStatusValue>('ASSIGNED');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const refresh = () => {
    setLoading(true);
    agentComplaintsApi
      .listAssigned()
      .then(setComplaints)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [t]);

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
      refresh();
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
      refresh();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="staff-layout">
      <StaffSidebar variant="agent" />
      <div className="staff-main">
        <StaffHeader />
        <main className="page-content">
          <h1>{t('page.agentComplaints')}</h1>

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

          {error && <div className="banner error">{error}</div>}

          {loading ? (
            <p>{t('common.loading')}</p>
          ) : complaints.length === 0 ? (
            <div className="empty-state">{t('agent.emptyState')}</div>
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
                        <button type="button" className="btn btn-sm" onClick={() => open(c)}>
                          {t('agent.open')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
