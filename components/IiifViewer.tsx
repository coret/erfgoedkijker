'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import type Tify from 'tify';
import { otherLocale } from '@/lib/i18n';
import 'tify/dist/tify.css';

// Tify (https://tify.rocks/) is a browser-only ESM module whose default export is
// the Tify class. It auto-mounts when `container` is provided and exposes destroy().
type TifyInstance = InstanceType<typeof Tify>;
type TifyCtor = typeof Tify;

// Tify normally derives this from its own <script> URL, but under a bundler that resolves
// to a build-time `file://` path (see tify/src/main.js and types/tify.d.ts), so we always
// pass it. `app/tify-translations/[file]/route.ts` serves the catalogs.
const TRANSLATIONS_DIR_URL = '/tify-translations';

export function IiifViewer({ manifestUrl }: { manifestUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<TifyInstance | null>(null);
  const locale = useLocale();

  // Read at construction time only, so a language switch is not a dependency of the
  // effect below — the viewer must not be torn down and rebuilt just to re-translate.
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useEffect(() => {
    let instance: TifyInstance | undefined;
    let cancelled = false;
    const el = ref.current;

    (async () => {
      const mod = (await import('tify')) as unknown as { default: TifyCtor };
      if (cancelled || !el) return;
      const TifyClass = mod.default;
      instance = new TifyClass({
        container: el,
        manifestUrl,
        language: localeRef.current,
        fallbackLanguage: otherLocale(localeRef.current),
        translationsDirUrl: TRANSLATIONS_DIR_URL,
      });
      instanceRef.current = instance;
    })();

    return () => {
      cancelled = true;
      instanceRef.current = null;
      try {
        instance?.destroy();
      } catch {
        /* ignore */
      }
      if (el) el.innerHTML = '';
    };
  }, [manifestUrl]);

  // Re-translate in place: Tify exposes setLanguage()/updateOptions() on the instance, so
  // the reader keeps their page, zoom and pan across a language switch.
  useEffect(() => {
    const instance = instanceRef.current;
    // Still loading: the constructor above already receives the current locale.
    if (!instance) return;
    instance.updateOptions({ fallbackLanguage: otherLocale(locale) });
    instance.setLanguage(locale).catch(() => {
      /* Tify surfaces a load failure in its own UI */
    });
  }, [locale]);

  return <div ref={ref} className="tify h-full w-full" />;
}
