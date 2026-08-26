import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

interface PaginationProps {
  page: number; // page value
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
}

// pagination controls
export function Pagination({ page, totalPages, totalElements, onChange }: PaginationProps) {
  const { t } = useI18n();

  return (
    <div className="pagination-bar">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, page - 1))}
      >
        <ChevronLeft size={14} />
        {t('dashboard.previous')}
      </button>
      <span>
        {t('dashboard.pageLabel')} {totalPages === 0 ? 0 : page + 1} {t('dashboard.ofLabel')} {totalPages} (
        {totalElements})
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        {t('dashboard.next')}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
