import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n';
import type nl from '../messages/nl.json';
import type en from '../messages/en.json';

type Assert<T extends true> = T;

/**
 * next-intl types message keys off one catalog (`Messages` in global.d.ts), so a key
 * present in nl.json but missing from en.json would not be a compile error. This makes
 * it one, in both directions — an extra key in en.json fails too.
 */
export type _MessagesInSync = Assert<
  typeof en extends typeof nl ? (typeof nl extends typeof en ? true : false) : false
>;

// The interface language lives in a cookie rather than in the URL: the app is a single
// client-rendered lookup form, so per-language URLs would buy nothing, and `?url=`
// deep links stay exactly as they were.
//
// Reading the cookie here opts `/` out of static prerendering (it renders as `ƒ Dynamic`).
// That costs nothing: the page fetches everything client-side, and the API routes are
// already `force-dynamic`.
export default getRequestConfig(async () => {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  // A template literal keeps this a webpack context module, so both catalogs are compiled
  // into the server bundle. The Dockerfile therefore does not need to copy `messages/`.
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
