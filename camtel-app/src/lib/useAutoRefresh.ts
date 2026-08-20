import { useEffect, useRef } from 'react';

// Re-runs `fn` every `intervalMs` (default 5s) so complaint list/detail pages
// pick up changes made by another actor (an agent claiming a ticket, a
// manager assigning one, a status update) without a manual reload. Skips
// ticks while the tab is hidden/backgrounded so an idle tab doesn't keep
// hammering the API.
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
