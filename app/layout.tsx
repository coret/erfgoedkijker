import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NDE ErfgoedKijker',
  description:
    'Bekijk een erfgoedobject als linked data volgens SCHEMA-AP-NDE. Een prototype van het Netwerk Digitaal Erfgoed.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <head>
        <link
          rel="preconnect"
          href="https://rsms.me"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        <header className="border-b border-nde-line bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
            <a href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nde-logo.svg" alt="Netwerk Digitaal Erfgoed" className="h-10 w-auto" />
              <span className="text-sm font-semibold text-nde-muted">
                ErfgoedKijker
              </span>
            </a>
            <a
              href="https://docs.nde.nl/schema-profile/"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-nde-blue hover:underline"
            >
              SCHEMA-AP-NDE ↗
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-5 py-10 text-xs text-nde-muted">
          Prototype · toont uitsluitend velden die het herkent volgens{' '}
          <a
            className="text-nde-blue hover:underline"
            href="https://docs.nde.nl/schema-profile/"
            target="_blank"
            rel="noreferrer"
          >
            SCHEMA-AP-NDE
          </a>
          . Termen via het{' '}
          <a
            className="text-nde-blue hover:underline"
            href="https://docs.nde.nl/services/network-of-terms/"
            target="_blank"
            rel="noreferrer"
          >
            NDE Termennetwerk
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
