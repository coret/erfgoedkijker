import nl from 'tify/dist/translations/nl.json';

// Tify loads its interface strings at runtime from
// `${translationsDirUrl}/${language}.json?${version}` (tify/src/App.vue). English never
// reaches this route: it is Tify's built-in default and short-circuits before the fetch.
//
// The catalog is imported straight from the pinned tify package rather than copied into
// public/, so it can never drift from the installed version. Webpack inlines the JSON into
// the server bundle, so the standalone Docker image needs no extra COPY — same as the
// next-intl message catalogs.
//
// Add an entry here when LOCALES in lib/i18n.ts grows.
const CATALOGS: Record<string, unknown> = {
  'nl.json': nl,
};

export function generateStaticParams() {
  return Object.keys(CATALOGS).map((file) => ({ file }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Whitelist, so the dynamic segment can never address anything but a known catalog.
  const catalog = CATALOGS[file];
  if (!catalog) return new Response('Not found', { status: 404 });

  return Response.json(catalog, {
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
