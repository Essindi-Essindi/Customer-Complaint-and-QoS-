import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Download } from 'lucide-react';
import { StaffSidebar } from '../components/StaffSidebar';
import { StaffHeader } from '../components/StaffHeader';
import { reportsApi, ApiError } from '../lib/api';
import type { ReportResponse } from '../lib/api';
import { REPORT_TYPES, type ReportTypeValue } from '../lib/constants';
import { Toast } from '../components/Toast';
import { useI18n } from '../context/I18nContext';

// POST /api/reports takes {type, startDate, endDate} and returns a
// ReportResponse right away — the PDF itself is built asynchronously (via
// RabbitMQ) and filePath stays null until it's ready, so GET
// /{id}/download can 409 with "still generating" if you're too quick.
// GET /api/reports returns this manager's full history (newest first), so
// it survives a refresh/new session instead of only showing what got
// generated in the current page load.
export default function ManagerReports() {
  const { t } = useI18n();
  const [reportType, setReportType] = useState<ReportTypeValue>('WEEKLY');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ReportResponse[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    reportsApi
      .list()
      .then(setHistory)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong')))
      .finally(() => setHistoryLoading(false));
  }, [t]);

  const handleGenerate = async (ev: FormEvent) => {
    ev.preventDefault();
    setError('');
    if (!start || !end) {
      setError(t('reports.pickDates'));
      return;
    }
    setLoading(true);
    try {
      const report = await reportsApi.generate({ type: reportType, startDate: start, endDate: end });
      setHistory((h) => [report, ...h]);
      setToast(t('reports.generated'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: ReportResponse) => {
    setDownloadingId(report.id);
    setError('');
    try {
      const blob = await reportsApi.download(report.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.somethingWentWrong'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="staff-layout">
      <StaffSidebar variant="manager" />
      <div className="staff-main">
        <StaffHeader />
        <main className="page-content">
          <h1>{t('reports.generateReport')}</h1>

          <form onSubmit={handleGenerate} className="form-card" style={{ maxWidth: 480 }}>
            <div className="field">
              <label>{t('reports.reportType')}</label>
              <div className="radio-row">
                {REPORT_TYPES.map((rt) => (
                  <label key={rt}>
                    <input
                      type="radio"
                      checked={reportType === rt}
                      onChange={() => setReportType(rt)}
                    />
                    {rt === 'WEEKLY' ? t('reports.weekly') : t('reports.monthly')}
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>{t('reports.startDate')}</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('reports.endDate')}</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('reports.generating') : t('reports.generateReport')}
            </button>
          </form>

          {error && <div className="banner error">{error}</div>}

          <h2 style={{ marginTop: 32 }}>{t('reports.reportHistory')}</h2>
          {historyLoading ? (
            <p>{t('common.loading')}</p>
          ) : history.length === 0 ? (
            <div className="empty-state">{t('reports.noneYet')}</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('reports.reportTypeCol')}</th>
                    <th>{t('reports.period')}</th>
                    <th>{t('reports.generatedAt')}</th>
                    <th>{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id}>
                      <td>{r.type === 'WEEKLY' ? t('reports.weekly') : t('reports.monthly')}</td>
                      <td>
                        {r.startDate} – {r.endDate}
                      </td>
                      <td>{new Date(r.generatedAt).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === r.id}
                        >
                          <Download size={13} />
                          {downloadingId === r.id ? t('common.loading') : t('reports.downloadPdf')}
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
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
