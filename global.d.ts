import type { Locale } from '@/lib/i18n';
import type nl from './messages/nl.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    // Message keys are typed off the default catalog. `i18n/request.ts` holds the
    // assertion that en.json stays in sync with it — it cannot live here, because
    // `skipLibCheck` means nothing in a .d.ts is ever type-checked.
    Messages: typeof nl;
  }
}
