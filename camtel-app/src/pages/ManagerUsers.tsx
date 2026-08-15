import { useEffect, useState } from 'react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { usersApi, ApiError } from '../lib/api';
import type { UserResponse, UserCreateRequest, UserUpdateRequest } from '../lib/api';
import type { Role } from '../lib/constants';
import { REGIONS, SERVICE_TYPES, SERVICE_TYPE_LABELS, type ServiceTypeValue } from '../lib/constants';
import { useI18n } from '../context/I18nContext';

// POST /api/manager/users (UserCreateRequest) only supports role AGENT or
// MANAGER — UserManagementServiceImpl.createUser throws for anything else,
// because subscribers can only be created through the public
// /api/auth/register flow. PUT /api/manager/users/{id} (UserUpdateRequest)
// never accepts email, password, or role — only name, phone, active, and
// the role-specific fields (assignedRegion/assignedService for an agent,
// department for a manager). There's also no createdAt on UserResponse, so
// that column is gone too.
type CreateForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'AGENT' | 'MANAGER';
  assignedRegion: string;
  assignedService: ServiceTypeValue | '';
  department: string;
};

const emptyCreateForm: CreateForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'AGENT',
  assignedRegion: '',
  assignedService: '',
  department: '',
};

type EditForm = {
  name: string;
  phone: string;
  active: boolean;
  assignedRegion: string;
  assignedService: ServiceTypeValue | '';
  department: string;
};

export default function ManagerUsers() {
  const { t, lang } = useI18n();
  const [users, setUsers] = useState<UserResponse[]>([]);
  // Defaults to AGENT since that's who a manager is managing day to day;
  // "All Roles" is still one select away.
  const [roleFilter, setRoleFilter] = useState<Role | ''>('AGENT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    phone: '',
    active: true,
    assignedRegion: '',
    assignedService: '',
    department: '',
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const [confirmDeactivate, setConfirmDeactivate] = useState<UserResponse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    usersApi
      .list(roleFilter || undefined)
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [roleFilter, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setCreateForm(emptyCreateForm);
    setCreateErrors({});
    setCreateModal(true);
  };

  const validateCreate = () => {
    const e: Record<string, string> = {};
    if (!createForm.name.trim()) e.name = t('validation.required');
    if (!createForm.email.trim()) e.email = t('validation.required');
    if (!createForm.phone.trim()) e.phone = t('validation.required');
    if (!createForm.password) e.password = t('validation.required');
    else if (createForm.password.length < 6) e.password = t('validation.minPassword');
    if (createForm.role === 'AGENT') {
      if (!createForm.assignedRegion) e.assignedRegion = t('validation.required');
      if (!createForm.assignedService) e.assignedService = t('validation.required');
    }
    if (createForm.role === 'MANAGER' && !createForm.department) e.department = t('validation.required');
    setCreateErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitCreate = async () => {
    if (!validateCreate()) return;
    setCreating(true);
    setCreateErrors({});
    try {
      const payload: UserCreateRequest = {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        role: createForm.role,
        ...(createForm.role === 'AGENT'
          ? { assignedRegion: createForm.assignedRegion, assignedService: createForm.assignedService }
          : {}),
        ...(createForm.role === 'MANAGER' ? { department: createForm.department } : {}),
      };
      await usersApi.create(payload);
      setToast(t('users.created'));
      setCreateModal(false);
      refresh();
    } catch (err) {
      setCreateErrors({ form: err instanceof ApiError ? err.message : t('common.somethingWentWrong') });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: UserResponse) => {
    setEditing(u);
    setEditForm({
      name: u.name,
      phone: u.phone,
      active: u.active,
      assignedRegion: '',
      assignedService: '',
      department: '',
    });
    setModalError('');
  };

  const submitEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setModalError('');
    try {
      const payload: UserUpdateRequest = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        active: editForm.active,
      };
      if (editing.role === 'AGENT') {
        if (editForm.assignedRegion) payload.assignedRegion = editForm.assignedRegion;
        if (editForm.assignedService) payload.assignedService = editForm.assignedService;
      }
      if (editing.role === 'MANAGER' && editForm.department) {
        payload.department = editForm.department;
      }
      await usersApi.update(editing.id, payload);
      setToast(t('users.updated'));
      setEditing(null);
      refresh();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const doDeactivate = async () => {
    if (!confirmDeactivate) return;
    try {
      await usersApi.deactivate(confirmDeactivate.id);
      setToast(t('users.deactivated'));
      setConfirmDeactivate(null);
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    }
  };

  const reactivate = async (u: UserResponse) => {
    try {
      await usersApi.update(u.id, { active: true });
      setToast(t('users.reactivated'));
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <div className="staff-layout">
      <StaffSidebar variant="manager" />
      <div className="staff-main">
        <StaffHeader />
        <main className="page-content">
          <div className="page-title-row">
            <h1>{t('page.managerUsers')}</h1>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + {t('users.createNew')}
            </button>
          </div>

          <div className="filters-bar">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | '')}>
              <option value="">{t('users.allRoles')}</option>
              <option value="SUBSCRIBER">{t('users.subscriber')}</option>
              <option value="AGENT">{t('role.agent')}</option>
              <option value="MANAGER">{t('role.manager')}</option>
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
                    <th>{t('common.name')}</th>
                    <th>{t('common.emailShort')}</th>
                    <th>{t('common.phone')}</th>
                    <th>{t('common.role')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>
                        <span className="role-badge">{u.role}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.active ? 'is-active' : 'is-inactive'}`}>
                          {u.active ? t('users.active') : t('users.inactive')}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="btn btn-sm" onClick={() => openEdit(u)}>
                          {t('users.edit')}
                        </button>{' '}
                        {u.active ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => setConfirmDeactivate(u)}
                          >
                            {t('users.deactivate')}
                          </button>
                        ) : (
                          <button type="button" className="btn btn-sm btn-outline" onClick={() => reactivate(u)}>
                            {t('users.reactivate')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {createModal && (
        <Modal title={t('users.createNew')} onClose={() => setCreateModal(false)}>
          {createErrors.form && <div className="banner error">{createErrors.form}</div>}
          <div className={`field ${createErrors.name ? 'error' : ''}`}>
            <label>{t('common.fullName')}</label>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className={`field ${createErrors.email ? 'error' : ''}`}>
            <label>{t('common.email')}</label>
            <input
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className={`field ${createErrors.phone ? 'error' : ''}`}>
            <label>{t('common.phone')}</label>
            <input
              value={createForm.phone}
              onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className={`field ${createErrors.password ? 'error' : ''}`}>
            <label>{t('common.password')}</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            />
            {createErrors.password && <span className="field-error">{createErrors.password}</span>}
          </div>
          <div className="field">
            <label>{t('common.role')}</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as 'AGENT' | 'MANAGER' }))}
            >
              <option value="AGENT">{t('role.agent')}</option>
              <option value="MANAGER">{t('role.manager')}</option>
            </select>
          </div>

          {createForm.role === 'AGENT' && (
            <>
              <div className={`field ${createErrors.assignedRegion ? 'error' : ''}`}>
                <label>{t('common.assignedRegion')}</label>
                <select
                  value={createForm.assignedRegion}
                  onChange={(e) => setCreateForm((f) => ({ ...f, assignedRegion: e.target.value }))}
                >
                  <option value="">{t('register.selectEllipsis')}</option>
                  {REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className={`field ${createErrors.assignedService ? 'error' : ''}`}>
                <label>{t('common.assignedService')}</label>
                <select
                  value={createForm.assignedService}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, assignedService: e.target.value as ServiceTypeValue | '' }))
                  }
                >
                  <option value="">{t('register.selectEllipsis')}</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {SERVICE_TYPE_LABELS[s][lang]}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {createForm.role === 'MANAGER' && (
            <div className={`field ${createErrors.department ? 'error' : ''}`}>
              <label>{t('common.department')}</label>
              <input
                value={createForm.department}
                onChange={(e) => setCreateForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setCreateModal(false)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={submitCreate} disabled={creating}>
              {creating ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={t('users.editTitle')} onClose={() => setEditing(null)}>
          {modalError && <div className="banner error">{modalError}</div>}
          <div className="field">
            <label>{t('common.fullName')}</label>
            <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('common.emailShort')}</label>
            <input value={editing.email} disabled />
            <span className="hint-inline">{t('users.emailNotEditable')}</span>
          </div>
          <div className="field">
            <label>{t('common.phone')}</label>
            <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="field checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
              />{' '}
              {t('users.active')}
            </label>
          </div>

          {editing.role === 'AGENT' && (
            <>
              <div className="field">
                <label>{t('common.assignedRegion')}</label>
                <select
                  value={editForm.assignedRegion}
                  onChange={(e) => setEditForm((f) => ({ ...f, assignedRegion: e.target.value }))}
                >
                  <option value="">{t('users.leaveUnchanged')}</option>
                  {REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('common.assignedService')}</label>
                <select
                  value={editForm.assignedService}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, assignedService: e.target.value as ServiceTypeValue | '' }))
                  }
                >
                  <option value="">{t('users.leaveUnchanged')}</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {SERVICE_TYPE_LABELS[s][lang]}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {editing.role === 'MANAGER' && (
            <div className="field">
              <label>{t('common.department')}</label>
              <input
                value={editForm.department}
                onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                placeholder={t('users.leaveUnchanged')}
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={submitEdit} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </Modal>
      )}

      {confirmDeactivate && (
        <Modal title={t('users.confirmDeactivateTitle')} onClose={() => setConfirmDeactivate(null)}>
          <p>
            {t('users.confirmDeactivateBody')} <strong>{confirmDeactivate.name}</strong>?
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setConfirmDeactivate(null)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={doDeactivate}>
              {t('common.yes')}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
