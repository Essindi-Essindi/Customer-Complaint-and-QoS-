import { useEffect, useRef } from 'react';

// default site key
const RECAPTCHA_SITE_KEY: string =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_RECAPTCHA_SITE_KEY ||
  '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

interface RecaptchaProps {
  onChange: (token: string) => void;
  onReady?: (reset: () => void) => void;
}

export function Recaptcha({ onChange, onReady }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tryRender = () => {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
      if (!window.grecaptcha || !window.grecaptcha.render) {
        setTimeout(tryRender, 200);
        return;
      }
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token: string) => onChange(token),
        'expired-callback': () => onChange(''),
      });
      onReady?.(() => {
        if (widgetIdRef.current !== null) window.grecaptcha?.reset(widgetIdRef.current);
        onChange('');
      });
    };

    tryRender();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="g-recaptcha" />;
}
