import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className="toast" role="alert">
      {message}
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = React.useState<string | null>(null);
  const showToast = (msg: string) => setToast(msg);
  const hideToast = () => setToast(null);
  return { toast, showToast, hideToast };
}
