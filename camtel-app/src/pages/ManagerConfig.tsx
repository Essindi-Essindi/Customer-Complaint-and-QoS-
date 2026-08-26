import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { categoriesApi, ApiError } from '../lib/api';
import type { Category } from '../lib/api';
import { useI18n } from '../context/I18nContext';

// config page component
export default function ManagerConfig() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    categoriesApi
      .list()
      .then(setCategories)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => {
    setName('');
    setDescription('');
    setEditTarget(null);
    setModalError('');
    setModal('add');
  };

  const openEdit = (c: Category) => {
    setName(c.name);
    setDescription(c.description || '');
    setEditTarget(c);
    setModalError('');
    setModal('edit');
  };

  const saveCategory = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setModalError('');
    try {
      if (modal === 'add') {
        await categoriesApi.create(name.trim(), description.trim() || undefined);
        setToast(t('config.categoryAdded'));
      } else if (editTarget) {
        await categoriesApi.update(editTarget.id, name.trim(), description.trim() || undefined);
        setToast(t('config.categoryUpdated'));
      }
      setModal(null);
      refresh();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await categoriesApi.delete(deleteTarget.id);
      setToast(t('config.categoryDeleted'));
      setDeleteTarget(null);
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
          <h1>{t('page.managerConfig')}</h1>

          <div className="page-title-row">
            <div />
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <Plus size={15} />
              {t('config.addCategory')}
            </button>
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
                    <th>{t('common.description')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.description}</td>
                      <td>
                        <button type="button" className="btn btn-sm" onClick={() => openEdit(c)}>
                          <Pencil size={13} />
                          {t('users.edit')}
                        </button>{' '}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 size={13} />
                          {t('config.delete')}
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

      {modal && (
        <Modal title={modal === 'add' ? t('config.addCategory') : t('config.editCategory')} onClose={() => setModal(null)}>
          {modalError && <div className="banner error">{modalError}</div>}
          <div className="field">
            <label>{t('common.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('common.description')}</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={saveCategory} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title={t('config.deleteCategoryTitle')} onClose={() => setDeleteTarget(null)}>
          <p>{t('config.deleteCategoryBody')}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={doDelete}>
              {t('common.yes')}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
