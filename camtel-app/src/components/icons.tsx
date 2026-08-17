import { ChevronLeft, Download } from 'lucide-react';

export function ChevronLeftIcon({ size = 14 }: { size?: number }) {
  return <ChevronLeft size={size} strokeWidth={2.4} aria-hidden="true" />;
}

export function InstallIcon({ size = 16 }: { size?: number }) {
  return <Download size={size} strokeWidth={2.2} aria-hidden="true" />;
}
