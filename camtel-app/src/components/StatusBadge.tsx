import type { ComplaintStatusValue } from '../lib/constants';
import { useI18n } from '../context/I18nContext';

const CLASS_MAP: Record<ComplaintStatusValue, string> = {
  SUBMITTED: 'is-submitted',
  ASSIGNED: 'is-assigned',
  IN_PROGRESS: 'is-inprogress',
  RESOLVED: 'is-resolved',
};

export function StatusBadge({ status }: { status: ComplaintStatusValue }) {
  const { t } = useI18n();
  return <span className={`status-badge ${CLASS_MAP[status]}`}>{t(`status.${status}`)}</span>;
}
