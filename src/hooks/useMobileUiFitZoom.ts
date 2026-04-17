import { useLayoutEffect, useRef, useState } from 'react';

const PAD = 28;
/** Meget lave landskabe (fx iPhone SE 375px højde) kræver zoom &lt; 0,5 — ellers klippes toppen. */
const MIN_ZOOM = 0.22;

/**
 * Skaler et panel ned så det (med ramme og indhold) kan være i viewport uden scroll,
 * når mobile UI / taske-mode er aktiv. Bruger CSS `zoom` (god understøttelse i Chrome m.fl.).
 */
export function useMobileUiFitZoom(enabled: boolean, contentKey?: string | number) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useLayoutEffect(() => {
    if (!enabled) {
      setZoom(1);
      return;
    }

    const el = ref.current;
    if (!el) {
      setZoom(1);
      return;
    }

    const compute = () => {
      const node = ref.current;
      if (!node) return;
      const h = Math.max(node.scrollHeight, node.offsetHeight);
      const w = Math.max(node.scrollWidth, node.offsetWidth);
      if (h < 8 || w < 8) return;

      const vv = window.visualViewport;
      const availH = Math.max(80, (vv?.height ?? window.innerHeight) - PAD);
      const availW = Math.max(80, (vv?.width ?? window.innerWidth) - PAD);
      const z = Math.min(1, availH / h, availW / w);
      const next = Math.max(MIN_ZOOM, Math.min(1, z));
      setZoom((prev) => (Math.abs(prev - next) < 0.004 ? prev : next));
    };

    const raf = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(compute);
      });
    };
    raf();

    const ro = new ResizeObserver(raf);
    ro.observe(el);
    window.addEventListener('resize', raf);
    window.visualViewport?.addEventListener('resize', raf);
    window.addEventListener('orientationchange', raf);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', raf);
      window.visualViewport?.removeEventListener('resize', raf);
      window.removeEventListener('orientationchange', raf);
    };
  }, [enabled, contentKey]);

  return { ref, zoom };
}
