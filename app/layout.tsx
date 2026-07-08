import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return {
    title: t('title'),
    description: t('description'),
    icons: { icon: '/nde-logo.svg' },
  };
}

/** Footer/intro links are rendered here, not in the message catalog: a translator edits
 *  the sentence and the link text, never the markup. */
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="text-nde-blue hover:underline" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations();

  // `LanguageSwitch` writes the locale cookie and calls router.refresh(), which re-renders
  // this Server Component — so the header and footer below (and <html lang> and <title>)
  // switch language too.
  return (
    <html lang={locale}>
      <body>
        {/* v4 inherits `locale` and `messages` from i18n/request.ts when rendered server-side. */}
        <NextIntlClientProvider>
          <header className="border-b border-nde-line bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-10">
              <a href="/" className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/nde-logo.svg" alt={t('app.logoAlt')} className="h-10 w-auto" />
                <span className="text-3xl font-bold tracking-tight text-nde-ink">
                  {t('app.name')}
                </span>
              </a>
              <LanguageSwitch />
            </div>
          </header>
          <main className="bg-nde-bg">
            <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
          </main>
          <footer className="border-t border-nde-line bg-white">
            <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-nde-muted [text-wrap:balance]">
              {t.rich('footer.body', {
                github: (chunks) => (
                  <ExternalLink href="https://github.com/coret/erfgoedkijker">{chunks}</ExternalLink>
                ),
                profile: (chunks) => (
                  <ExternalLink href="https://docs.nde.nl/schema-profile/">{chunks}</ExternalLink>
                ),
                terms: (chunks) => (
                  <ExternalLink href="https://docs.nde.nl/services/network-of-terms/">
                    {chunks}
                  </ExternalLink>
                ),
                register: (chunks) => (
                  <ExternalLink href="https://datasetregister.netwerkdigitaalerfgoed.nl/">
                    {chunks}
                  </ExternalLink>
                ),
              })}
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
