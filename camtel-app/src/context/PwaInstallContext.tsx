import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Chrome/Edge/Android fire this instead of letting the browser show its own
// install UI, so we can capture it, show our own prompt, and replay it
// later (from the persistent button) instead of only on first load.
// Not in the DOM lib yet, so it's typed by hand here.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// sessionStorage, not localStorage — dismissing means "not this session",
// not "never again". The persistent PwaInstallButton is always there
// regardless for whenever the user does want to install.
const DISMISS_KEY = 'camtel_pwa_install_dismissed';

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

interface PwaInstallContextType {
  // True once Chrome/Edge/Android has signaled an install prompt is ready.
  canInstall: boolean;
  // iOS Safari never fires beforeinstallprompt — there's no programmatic
  // install, only manual "Share -> Add to Home Screen", so this drives a
  // fallback instructions view instead of a real prompt button.
  isIos: boolean;
  isInstalled: boolean;
  promptOpen: boolean;
  openPrompt: () => void;
  closePrompt: () => void;
  // Resolves 'unavailable' if there's no captured browser prompt to replay
  // (e.g. called on iOS, or after the one-shot native event was consumed).
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone);
  const [promptOpen, setPromptOpen] = useState(false);
  const isIos = isIosDevice() && !isInstalled;
  const canInstall = !!deferredEvent && !isInstalled;

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredEvent(null);
      setPromptOpen(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Auto-open once per session, shortly after the page becomes installable
  // (or immediately on iOS, which has no "becomes installable" signal).
  // Only the automatic trigger respects the dismissal flag — the persistent
  // PwaInstallButton bypasses it and always opens on click.
  useEffect(() => {
    if (isInstalled || (!canInstall && !isIos)) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    const timer = setTimeout(() => setPromptOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [canInstall, isIos, isInstalled]);

  const openPrompt = useCallback(() => setPromptOpen(true), []);

  const closePrompt = useCallback(() => {
    setPromptOpen(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return 'unavailable' as const;
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    // The captured event is single-use regardless of outcome — Chrome
    // won't replay it, a fresh beforeinstallprompt has to fire again.
    setDeferredEvent(null);
    return choice.outcome;
  }, [deferredEvent]);

  return (
    <PwaInstallContext.Provider
      value={{ canInstall, isIos, isInstalled, promptOpen, openPrompt, closePrompt, promptInstall }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error('usePwaInstall must be used within PwaInstallProvider');
  return ctx;
}
