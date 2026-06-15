import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Pass-through proxy for IIIF manifests, used as a fallback when a manifest server
// does not send CORS headers. Tify normally fetches the manifest directly.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: 'Ongeldige manifest-URL.' }, { status: 400 });
  }
  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/ld+json, application/json' },
      signal: AbortSignal.timeout(20_000),
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') ?? 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Manifest ophalen mislukte.' },
      { status: 502 },
    );
  }
}
