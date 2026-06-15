import rdfParse from 'rdf-parse';
import { Readable } from 'node:stream';
import { Store, DataFactory } from 'n3';
import type * as RDF from '@rdfjs/types';
import {
  SCHEMA,
  SCHEMA_HTTP,
  RDF_TYPE,
  schemaLocal,
  PROFILE,
  MEDIA_TYPES,
  CREATIVEWORK_SUBTYPES,
  TOP_LEVEL_TYPES,
  classLabelNl,
  isIiifEncodingFormat,
  type PropertyDef,
} from './schema-ap-nde';
import type {
  ObjectView,
  MappedResource,
  Field,
  ValueNode,
  LangLiteral,
} from './types';

const { namedNode } = DataFactory;

const ACCEPT =
  'application/ld+json, application/json;q=0.95, text/turtle;q=0.9, ' +
  'application/n-triples;q=0.8, application/n-quads;q=0.75, application/rdf+xml;q=0.7, application/trig;q=0.7';

const DATE_DATATYPES = new Set([
  SCHEMA + 'Date',
  SCHEMA_HTTP + 'Date',
  'http://www.w3.org/2001/XMLSchema#date',
  'http://www.w3.org/2001/XMLSchema#dateTime',
  'http://www.w3.org/2001/XMLSchema#gYear',
  'http://www.w3.org/2001/XMLSchema#gYearMonth',
]);

export type FetchResult = {
  store: Store;
  finalUrl: string;
  mediaType: string | null;
  tripleCount: number;
};

export class FetchError extends Error {
  constructor(
    message: string,
    readonly kind: 'URL_UNRESOLVED' | 'NO_LINKED_DATA',
  ) {
    super(message);
  }
}

const rdfParser = (rdfParse as unknown as { default?: typeof rdfParse }).default ?? rdfParse;

const KNOWN_RDF_TYPES = new Set([
  'application/ld+json',
  'text/turtle',
  'application/trig',
  'application/n-triples',
  'application/n-quads',
  'text/n3',
  'application/rdf+xml',
  'application/xhtml+xml',
  'text/html',
]);

/**
 * Map a server Content-Type (+ URL) to a media type rdf-parse understands.
 * Some heritage servers mislabel JSON-LD as application/json, or — when a client
 * sends `Accept-Encoding: gzip` — even as application/x-gzip; we always request
 * `identity` to avoid the latter, and normalize the former here.
 */
function normalizeContentType(raw: string | null, url: string): string {
  const ct = (raw ?? '').split(';')[0].trim().toLowerCase();
  if (ct === 'application/json') return 'application/ld+json';
  if (ct === 'application/xml' || ct === 'text/xml') return 'application/rdf+xml';
  if (KNOWN_RDF_TYPES.has(ct)) return ct;
  // Unknown/binary (x-gzip, octet-stream, text/plain, empty) → guess from extension.
  const u = url.toLowerCase().split(/[?#]/)[0];
  if (u.endsWith('.jsonld') || u.endsWith('.json')) return 'application/ld+json';
  if (u.endsWith('.ttl')) return 'text/turtle';
  if (u.endsWith('.nt')) return 'application/n-triples';
  if (u.endsWith('.nq')) return 'application/n-quads';
  if (u.endsWith('.trig')) return 'application/trig';
  if (u.endsWith('.rdf') || u.endsWith('.xml')) return 'application/rdf+xml';
  // SCHEMA-AP-NDE data is predominantly JSON-LD; assume that as a last resort.
  return 'application/ld+json';
}

/**
 * Fetch a URL with content-negotiation and parse it into an N3 store, using the
 * Comunica rdf-parse parser. We do the HTTP fetch ourselves (forcing
 * Accept-Encoding: identity and following redirects) so we control the negotiated
 * format and capture the final resolved URL for the persistent-identifier check.
 */
export async function fetchLinkedData(url: string): Promise<FetchResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: ACCEPT, 'accept-encoding': 'identity' },
      redirect: 'follow',
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    // DNS / connection / TLS / timeout → the URL did not resolve.
    throw new FetchError((err as Error)?.message ?? String(err), 'URL_UNRESOLVED');
  }

  if (!res.ok) {
    throw new FetchError(`HTTP-status ${res.status}`, 'URL_UNRESOLVED');
  }

  const finalUrl = res.url || url;
  const rawContentType = res.headers.get('content-type');
  const contentType = normalizeContentType(rawContentType, finalUrl);
  const body = await res.text();

  const store = new Store();
  try {
    await new Promise<void>((resolve, reject) => {
      rdfParser
        .parse(Readable.from([body]), { contentType, baseIRI: finalUrl })
        .on('data', (q: RDF.Quad) => store.addQuad(q))
        .on('end', () => resolve())
        .on('error', (e: Error) => reject(e));
    });
  } catch (err) {
    // Reached the server but the body could not be parsed as RDF.
    throw new FetchError(
      (err as Error)?.message ?? 'Kon de linked data niet inlezen.',
      'NO_LINKED_DATA',
    );
  }

  const tripleCount = store.size;
  if (tripleCount === 0) {
    throw new FetchError('Geen triples gevonden.', 'NO_LINKED_DATA');
  }

  return {
    store,
    finalUrl,
    mediaType: rawContentType ?? contentType,
    tripleCount,
  };
}

// ---- view-model extraction ---------------------------------------------------

type Ctx = { store: Store; visited: Set<string>; termCount: { n: number } };

/** Collect object terms for a subject + schema property (http or https ns). */
function objectsFor(store: Store, subject: RDF.Term, local: string): RDF.Term[] {
  return [
    ...store.getObjects(subject as RDF.Quad_Subject, namedNode(SCHEMA + local), null),
    ...store.getObjects(subject as RDF.Quad_Subject, namedNode(SCHEMA_HTTP + local), null),
  ];
}

function recognizedTypes(store: Store, subject: RDF.Term): string[] {
  return store
    .getObjects(subject as RDF.Quad_Subject, namedNode(RDF_TYPE), null)
    .map((t) => schemaLocal(t.value))
    .filter((x): x is string => x !== null);
}

function langLiterals(terms: RDF.Term[]): LangLiteral[] {
  return terms
    .filter((t) => t.termType === 'Literal')
    .map((t) => ({
      value: t.value,
      lang: (t as RDF.Literal).language || undefined,
    }));
}

function firstIri(terms: RDF.Term[]): string | undefined {
  return terms.find((t) => t.termType === 'NamedNode')?.value;
}

function pickMainSubject(
  store: Store,
  finalUrl: string,
  inputUrl: string,
): { subject: RDF.Term; type: string } | null {
  const typeQuads = store.getQuads(null, namedNode(RDF_TYPE), null, null);
  const bySubject = new Map<string, { subject: RDF.Term; types: Set<string> }>();
  for (const q of typeQuads) {
    const local = schemaLocal(q.object.value);
    if (!local) continue;
    const key = q.subject.value;
    if (!bySubject.has(key)) bySubject.set(key, { subject: q.subject, types: new Set() });
    bySubject.get(key)!.types.add(local);
  }

  const urlCandidates = new Set(
    [finalUrl, inputUrl].flatMap((u) => [u, u.replace(/\/$/, ''), u + '/']),
  );

  const isMain = (types: Set<string>) =>
    [...types].find((t) => CREATIVEWORK_SUBTYPES.has(t)) ??
    [...types].find((t) => TOP_LEVEL_TYPES.has(t));

  // 1. subject matching the requested URL with a recognized main type
  for (const [uri, { subject, types }] of bySubject) {
    if (urlCandidates.has(uri)) {
      const t = isMain(types);
      if (t) return { subject, type: CREATIVEWORK_SUBTYPES.has(t) ? 'CreativeWork' : t };
    }
  }
  // 2. any CreativeWork(-subtype)
  for (const { subject, types } of bySubject.values()) {
    const t = [...types].find((x) => CREATIVEWORK_SUBTYPES.has(x));
    if (t) return { subject, type: 'CreativeWork' };
  }
  // 3. any top-level Person/Organization/Place
  for (const { subject, types } of bySubject.values()) {
    const t = [...types].find((x) => TOP_LEVEL_TYPES.has(x));
    if (t) return { subject, type: t };
  }
  return null;
}

/** Find a IIIF Presentation manifest IRI anywhere in the graph (by encodingFormat). */
function findIiifManifest(store: Store): string | undefined {
  for (const ns of [SCHEMA, SCHEMA_HTTP]) {
    const quads = store.getQuads(null, namedNode(ns + 'encodingFormat'), null, null);
    for (const q of quads) {
      if (
        q.object.termType === 'Literal' &&
        isIiifEncodingFormat(q.object.value) &&
        q.subject.termType === 'NamedNode'
      ) {
        return q.subject.value;
      }
    }
  }
  return undefined;
}

function propertiesForType(type: string): PropertyDef[] {
  return PROFILE[type]?.properties ?? PROFILE.CreativeWork.properties;
}

function mapValue(ctx: Ctx, term: RDF.Term, depth: number): ValueNode | null {
  if (term.termType === 'Literal') {
    const dt = (term as RDF.Literal).datatype?.value;
    if (dt && DATE_DATATYPES.has(dt)) return { kind: 'date', value: term.value };
    return {
      kind: 'literal',
      value: { value: term.value, lang: (term as RDF.Literal).language || undefined },
    };
  }

  // NamedNode or BlankNode (a resource)
  const { store } = ctx;

  // IIIF manifest entry: identified by its encodingFormat, not by class.
  const encFmt = objectsFor(store, term, 'encodingFormat').find(
    (t) => t.termType === 'Literal',
  )?.value;
  if (isIiifEncodingFormat(encFmt) && term.termType === 'NamedNode') {
    return { kind: 'iiif', manifestUrl: term.value };
  }

  const types = recognizedTypes(store, term);

  if (types.includes('DefinedTerm')) {
    ctx.termCount.n += 1;
    const sameAs = firstIri(objectsFor(store, term, 'sameAs')) ??
      (term.termType === 'NamedNode' ? term.value : undefined);
    return {
      kind: 'term',
      term: { name: langLiterals(objectsFor(store, term, 'name')), sameAs },
    };
  }

  if (types.some((t) => MEDIA_TYPES.has(t))) {
    return {
      kind: 'media',
      media: {
        contentUrl: firstIri(objectsFor(store, term, 'contentUrl')),
        thumbnailUrl: firstIri(objectsFor(store, term, 'thumbnailUrl')),
        encodingFormat: encFmt,
        license: firstIri(objectsFor(store, term, 'license')),
        copyrightNotice: langLiterals(objectsFor(store, term, 'copyrightNotice')),
      },
    };
  }

  if (types.includes('GeoCoordinates')) {
    const lat = parseFloat(objectsFor(store, term, 'latitude')[0]?.value ?? '');
    const long = parseFloat(objectsFor(store, term, 'longitude')[0]?.value ?? '');
    if (!Number.isNaN(lat) && !Number.isNaN(long)) return { kind: 'geo', lat, long };
    return null;
  }

  const resourceType = types.find((t) =>
    ['Person', 'Organization', 'Place', 'PostalAddress', 'Occupation', 'PropertyValue'].includes(
      t,
    ),
  );
  if (resourceType && depth < 4) {
    const resource = mapResource(ctx, term, resourceType, depth + 1);
    if (resource.fields.length) return { kind: 'resource', resource };
  }

  // Untyped/unknown resource: show a name if present, else the bare IRI as a link.
  const names = langLiterals(objectsFor(store, term, 'name'));
  if (names.length) {
    return {
      kind: 'resource',
      resource: {
        uri: term.termType === 'NamedNode' ? term.value : undefined,
        type: 'Thing',
        typeLabelNl: 'Verwijzing',
        fields: [{ property: 'name', labelNl: 'Naam', values: names.map((n) => ({ kind: 'literal', value: n }) as ValueNode) }],
      },
    };
  }
  if (term.termType === 'NamedNode') return { kind: 'iri', value: term.value };
  return null;
}

function mapResource(
  ctx: Ctx,
  subject: RDF.Term,
  type: string,
  depth: number,
): MappedResource {
  const key = `${type}|${subject.value}`;
  const fields: Field[] = [];
  if (!ctx.visited.has(key)) {
    ctx.visited.add(key);
    for (const prop of propertiesForType(type)) {
      const objs = objectsFor(ctx.store, subject, prop.name);
      if (!objs.length) continue;
      const values = objs.map((o) => mapValue(ctx, o, depth)).filter((v): v is ValueNode => v !== null);
      if (values.length) fields.push({ property: prop.name, labelNl: prop.labelNl, values });
    }
  }
  return {
    uri: subject.termType === 'NamedNode' ? subject.value : undefined,
    type,
    typeLabelNl: classLabelNl(type),
    fields,
  };
}

export type ExtractResult = {
  object: ObjectView | null;
  foundCreativeWork: boolean;
};

/** Build the ErfgoedKijker view-model from a parsed store. */
export function extractObject(
  store: Store,
  finalUrl: string,
  inputUrl: string,
): ExtractResult {
  const main = pickMainSubject(store, finalUrl, inputUrl);
  if (!main) return { object: null, foundCreativeWork: false };

  const ctx: Ctx = { store, visited: new Set(), termCount: { n: 0 } };
  const resource = mapResource(ctx, main.subject, main.type, 0);

  // Locate an IIIF Presentation manifest. Profile-compliant data exposes it as an
  // associatedMedia entry (kind 'iiif' in the fields); but some publishers link it
  // via other properties, so as a fallback scan the whole graph for any node whose
  // encodingFormat denotes a IIIF *Presentation* manifest.
  let iiifManifestUrl: string | undefined;
  const scan = (fields: Field[]) => {
    for (const f of fields)
      for (const v of f.values) {
        if (v.kind === 'iiif' && !iiifManifestUrl) iiifManifestUrl = v.manifestUrl;
        if (v.kind === 'resource') scan(v.resource.fields);
      }
  };
  scan(resource.fields);
  if (!iiifManifestUrl) iiifManifestUrl = findIiifManifest(store);

  const object: ObjectView = {
    uri: main.subject.value,
    type: main.type,
    typeLabelNl: classLabelNl(main.type),
    fields: resource.fields,
    iiifManifestUrl,
    termCount: ctx.termCount.n,
  };
  return { object, foundCreativeWork: main.type === 'CreativeWork' };
}
