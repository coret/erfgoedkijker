'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALES, type Locale } from '@/lib/i18n';

/**
 * NL/EN toggle. Writes the locale cookie client-side, then asks Next to re-render the
 * route's Server Components. `i18n/request.ts` reads the new cookie, so the header,
 * footer, `<html lang>` and `<title>` all switch language — while the page's client
 * state (a looked-up object) survives, so switching never refetches `/api/object`.
 *
 * A Server Action would be the idiomatic next-intl way to set the cookie, but it POSTs
 * as `Content-Type: text/plain`, which OWASP CRS rule 920420 rejects with a 403 on any
 * host running ModSecurity — including this app's own reverse proxy. `router.refresh()`
 * issues a plain RSC GET instead, so the app stays deployable behind a default WAF.
 */
export function LanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('lang');
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    // `secure` would make the cookie a no-op over plain http (i.e. `npm run dev`).
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={t('switchLabel')}
      className="flex items-center gap-1 rounded-full border border-nde-line bg-white p-1"
    >
      {LOCALES.map((l) => {
        const current = l === locale;
        return (
          <button
            key={l}
            type="button"
            disabled={pending || current}
            aria-current={current ? 'true' : undefined}
            title={t(l)}
            onClick={() => change(l)}
            className={
              'rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition ' +
              (current
                ? 'bg-nde-blue text-white'
                : 'text-nde-muted hover:bg-nde-blue-soft hover:text-nde-blue disabled:opacity-50')
            }
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
