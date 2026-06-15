'use client';

import { useEffect, useRef } from 'react';
import 'tify/dist/tify.css';

// Tify (https://tify.rocks/) is a browser-only ESM module whose default export is
// the Tify class. It auto-mounts when `container` is provided and exposes destroy().
type TifyInstance = { destroy: () => void };
type TifyCtor = new (opts: { container: HTMLElement; manifestUrl: string }) => TifyInstance;

export function IiifViewer({ manifestUrl }: { manifestUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: TifyInstance | undefined;
    let cancelled = false;
    const el = ref.current;

    (async () => {
      const mod = (await import('tify')) as unknown as { default: TifyCtor };
      if (cancelled || !el) return;
      const Tify = mod.default;
      instance = new Tify({ container: el, manifestUrl });
    })();

    return () => {
      cancelled = true;
      try {
        instance?.destroy();
      } catch {
        /* ignore */
      }
      if (el) el.innerHTML = '';
    };
  }, [manifestUrl]);

  return <div ref={ref} className="tify h-full w-full" />;
}
