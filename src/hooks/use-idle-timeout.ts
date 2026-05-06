import { useEffect, useRef } from 'react';

/**
 * Fires `onTimeout` after `minutes` of no user activity. Resets on
 * mousemove, keydown, click, scroll, and touchstart. Pass `enabled: false`
 * to disable (e.g. while logged out).
 */
export function useIdleTimeout(
  minutes: number,
  onTimeout: () => void,
  enabled = true,
): void {
  const timeoutRef = useRef<number | null>(null);
  const callbackRef = useRef(onTimeout);
  callbackRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return;

    const timeoutMs = minutes * 60_000;
    const reset = (): void => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current();
      }, timeoutMs);
    };

    const events: Array<keyof DocumentEventMap> = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ];

    let raf: number | null = null;
    const debounced = (): void => {
      if (raf !== null) return;
      raf = window.requestAnimationFrame(() => {
        raf = null;
        reset();
      });
    };

    for (const ev of events) {
      document.addEventListener(ev, debounced, { passive: true });
    }
    reset();

    return () => {
      for (const ev of events) document.removeEventListener(ev, debounced);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      if (raf !== null) window.cancelAnimationFrame(raf);
    };
  }, [minutes, enabled]);
}
