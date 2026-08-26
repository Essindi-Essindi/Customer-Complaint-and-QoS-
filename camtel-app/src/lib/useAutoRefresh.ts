import { useEffect, useRef } from 'react';

// setup refresh interval
export function useAutoRefresh(fn: () => void, intervalMs = 5000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fnRef.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
