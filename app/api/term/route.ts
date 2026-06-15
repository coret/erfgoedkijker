import { NextRequest, NextResponse } from 'next/server';
import { lookupTerms } from '@/lib/termennetwerk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let uris: string[] = [];
  try {
    const body = await req.json();
    uris = Array.isArray(body?.uris) ? body.uris.filter((u: unknown) => typeof u === 'string') : [];
  } catch {
    /* ignore */
  }

  if (uris.length === 0) {
    return NextResponse.json({ error: 'Geef ten minste één term-URI op.' }, { status: 400 });
  }

  try {
    const lookups = await lookupTerms(uris);
    return NextResponse.json({ lookups });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Opzoeken in het Termennetwerk mislukte.' },
      { status: 502 },
    );
  }
}
