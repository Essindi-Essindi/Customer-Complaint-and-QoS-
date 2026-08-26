import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// custom event type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// storage key setup
const DISMISS_KEY = 'camtel_pwa_install_dismissed';

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

interface PwaInstallContextType {
  // install flag
  canInstall: boolean;
  // platform flag
  isIos: boolean;
  isInstalled: boolean;
  promptOpen: boolean;
  openPrompt: () => void;
  closePrompt: () => void;
  // prompt trigger
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

  // auto-open setup
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
    // reset event ref
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
