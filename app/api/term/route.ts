import { NextRequest, NextResponse } from 'next/server';
import { lookupTerms } from '@/lib/termennetwerk';
import type { ApiErrorCode } from '@/lib/types';

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

  // Errors are stable codes, not prose: the client renders them in the interface language.
  if (uris.length === 0) {
    const error: ApiErrorCode = 'NO_URIS';
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    const lookups = await lookupTerms(uris);
    return NextResponse.json({ lookups });
  } catch (err) {
    const error: ApiErrorCode = 'TERM_LOOKUP_FAILED';
    return NextResponse.json(
      // `detail` is for debugging only and is never rendered.
      { error, detail: err instanceof Error ? err.message : undefined },
      { status: 502 },
    );
  }
}
