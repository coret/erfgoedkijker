import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLinkedData,
  extractObject,
  resolveDataset,
  serializeTurtle,
  detectSchemaOrgVariant,
  FetchError,
} from '@/lib/rdf';
import type { SchemaOrgVariant } from '@/lib/types';
import { buildPersistentId, detectScheme } from '@/lib/persistent-id';
import type { ObjectResponse, GuidanceCode, ValueNode } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let url = '';
  try {
    const body = await req.json();
    url = (body?.url ?? '').toString().trim();
  } catch {
    /* ignore */
  }

  if (!isHttpUrl(url)) {
    return NextResponse.json(
      { ok: false, error: 'Geef een geldige http(s)-permalink op.' },
      { status: 400 },
    );
  }

  const baseDiagnostics = {
    inputUrl: url,
    httpStatus: null as number | null,
    finalUrl: null as string | null,
    redirectChain: [] as string[],
    contentType: null as string | null,
    detectedFormat: null as string | null,
    tripleCount: 0,
    foundCreativeWork: false,
    persistentId: { scheme: detectScheme(url), ok: null as boolean | null },
    datasetResolves: null as boolean | null,
    turtle: null as string | null,
    schemaOrg: null as SchemaOrgVariant | null,
  };

  try {
    const { store, finalUrl, mediaType, tripleCount } = await fetchLinkedData(url);
    const { object, foundCreativeWork, datasetUri } = extractObject(store, finalUrl, url);
    const turtle = await serializeTurtle(store);
    const schemaOrg = detectSchemaOrgVariant(store);

    // Resolve the isPartOf dataset-description URI (title/description/publisher) and
    // render it inline under the existing "Onderdeel van dataset" field.
    let datasetResolves: boolean | null = null;
    if (object && datasetUri) {
      const dataset = await resolveDataset(datasetUri);
      datasetResolves = dataset.resolved;
      const node: ValueNode = { kind: 'dataset', dataset };
      const field = object.fields.find((f) => f.property === 'isPartOf');
      if (field) field.values = [node];
      else
        object.fields.push({
          property: 'isPartOf',
          labelNl: 'Onderdeel van dataset',
          values: [node],
        });
    }

    const notices: GuidanceCode[] = [];
    if (!object) notices.push('NOT_SCHEMA_AP_NDE');
    if (object && !object.iiifManifestUrl) notices.push('NO_IIIF');
    if (object && object.termCount === 0) notices.push('NO_TERMS');

    const response: ObjectResponse = {
      ok: true,
      object: object ?? undefined,
      notices,
      diagnostics: {
        ...baseDiagnostics,
        httpStatus: 200,
        finalUrl,
        redirectChain: finalUrl !== url ? [url, finalUrl] : [url],
        contentType: mediaType,
        detectedFormat: mediaType,
        tripleCount,
        foundCreativeWork,
        persistentId: buildPersistentId(url, finalUrl, true),
        datasetResolves,
        turtle,
        schemaOrg,
      },
    };
    return NextResponse.json(response);
  } catch (err) {
    const code: GuidanceCode =
      err instanceof FetchError && err.kind === 'NO_LINKED_DATA'
        ? 'NO_LINKED_DATA'
        : 'URL_UNRESOLVED';
    const response: ObjectResponse = {
      ok: false,
      fatal: code,
      message: err instanceof Error ? err.message : String(err),
      notices: [],
      diagnostics: {
        ...baseDiagnostics,
        // NO_LINKED_DATA means we reached the server but found no RDF.
        httpStatus: code === 'NO_LINKED_DATA' ? 200 : null,
        persistentId: buildPersistentId(url, null, false),
      },
    };
    return NextResponse.json(response);
  }
}
