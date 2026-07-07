import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NDE ErfgoedKijker',
  description:
    'Bekijk een erfgoedobject als linked data volgens SCHEMA-AP-NDE. Een prototype van het Netwerk Digitaal Erfgoed.',
  icons: {
    icon: '/nde-logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>
        <header className="border-b border-nde-line bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-10">
            <a href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nde-logo.svg" alt="Netwerk Digitaal Erfgoed" className="h-10 w-auto" />
              <span className="text-3xl font-bold tracking-tight text-nde-ink">
                Digitaal Erfgoed Kijker
              </span>
            </a>
          </div>
        </header>
        <main className="bg-nde-bg">
          <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
        </main>
        <footer className="border-t border-nde-line bg-white">
          <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-nde-muted [text-wrap:balance]">
          Prototype (source:{' '}
          <a
            className="text-nde-blue hover:underline"
            href="https://github.com/coret/erfgoedkijker"
            target="_blank"
            rel="noreferrer"
          >
            Github
          </a>), toont uitsluitend velden die het herkent volgens{' '}
          <a
            className="text-nde-blue hover:underline"
            href="https://docs.nde.nl/schema-profile/"
            target="_blank"
            rel="noreferrer"
          >
            SCHEMA-AP-NDE (versie 1.1.0)
          </a>, termen via het{' '}
          <a
            className="text-nde-blue hover:underline"
            href="https://docs.nde.nl/services/network-of-terms/"
            target="_blank"
            rel="noreferrer"
          >
            NDE Termennetwerk
          </a> en datasetbeschrijvingen via het{' '}
          <a
            className="text-nde-blue hover:underline"
            href="https://datasetregister.netwerkdigitaalerfgoed.nl/"
            target="_blank"
            rel="noreferrer"
          >
            NDE Dataset Register
          </a>.
          </div>
        </footer>
      </body>
    </html>
  );
}
