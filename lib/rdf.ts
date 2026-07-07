import rdfParse from 'rdf-parse';
import { Readable } from 'node:stream';
import { decodeHTML } from 'entities';
import { Store, DataFactory, Writer } from 'n3';
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
  DatasetInfo,
  SchemaOrgVariant,
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

// ---- Turtle serialization ----------------------------------------------------

/** Well-known RDF namespaces, declared as prefixes only when actually used. */
const WELL_KNOWN_NS: Array<[string, string]> = [
  ['rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
  ['rdfs', 'http://www.w3.org/2000/01/rdf-schema#'],
  ['xsd', 'http://www.w3.org/2001/XMLSchema#'],
  ['skos', 'http://www.w3.org/2004/02/skos/core#'],
  ['dcterms', 'http://purl.org/dc/terms/'],
  ['foaf', 'http://xmlns.com/foaf/0.1/'],
  ['geo', 'http://www.w3.org/2003/01/geo/wgs84_pos#'],
  ['xhtml', 'http://www.w3.org/1999/xhtml/vocab#'],
  ['o', 'http://omeka.org/s/vocabs/o#'],
];

/** Namespace part of an IRI (everything up to and including the last '#' or '/'). */
function namespaceOf(iri: string): string {
  const hash = iri.lastIndexOf('#');
  if (hash >= 0) return iri.slice(0, hash + 1);
  const slash = iri.lastIndexOf('/');
  return slash >= 0 ? iri.slice(0, slash + 1) : iri;
}

/**
 * Build the `@prefix` set from the namespaces that actually occur in the store, so
 * the Turtle uses compact names (e.g. `schema:identifier`) and declares no unused
 * prefixes. schema.org is bound to `schema:` for whichever variant (http/https) the
 * data uses; if both occur, the http variant gets a secondary `schemahttp:` prefix.
 */
function buildTurtlePrefixes(store: Store): Record<string, string> {
  const used = new Set<string>();
  for (const q of store.getQuads(null, null, null, null)) {
    used.add(namespaceOf(q.predicate.value));
    if (q.subject.termType === 'NamedNode') used.add(namespaceOf(q.subject.value));
    if (q.object.termType === 'NamedNode') used.add(namespaceOf(q.object.value));
    else if (q.object.termType === 'Literal') {
      const dt = (q.object as RDF.Literal).datatype?.value;
      if (dt) used.add(namespaceOf(dt));
    }
  }

  const prefixes: Record<string, string> = {};
  const httpsUsed = used.has(SCHEMA); // https://schema.org/
  const httpUsed = used.has(SCHEMA_HTTP); // http://schema.org/
  if (httpsUsed) prefixes.schema = SCHEMA;
  else if (httpUsed) prefixes.schema = SCHEMA_HTTP;
  if (httpsUsed && httpUsed) prefixes.schemahttp = SCHEMA_HTTP;
  for (const [p, ns] of WELL_KNOWN_NS) if (used.has(ns)) prefixes[p] = ns;
  return prefixes;
}

/**
 * Detect which schema.org namespace the source uses. SCHEMA-AP-NDE recommends the
 * https variant; some publishers still emit the legacy http one. Returns null when
 * no schema.org terms occur (e.g. a non-recognized object).
 */
export function detectSchemaOrgVariant(store: Store): SchemaOrgVariant | null {
  let https = false;
  let http = false;
  for (const q of store.getQuads(null, null, null, null)) {
    for (const term of [q.subject, q.predicate, q.object]) {
      if (term.termType !== 'NamedNode') continue;
      if (term.value.startsWith(SCHEMA)) https = true;
      else if (term.value.startsWith(SCHEMA_HTTP)) http = true;
    }
  }
  if (https && http) return 'mixed';
  if (https) return 'https';
  if (http) return 'http';
  return null;
}

/** Serialize a parsed store to pretty-printed Turtle (with prefixes) for display. */
export function serializeTurtle(store: Store): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new Writer({ prefixes: buildTurtlePrefixes(store) });
    writer.addQuads(store.getQuads(null, null, null, null));
    writer.end((err, result) => (err ? reject(err) : resolve(result)));
  });
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

/**
 * Decode HTML/XML character entities embedded in plain-text literals. Some
 * heritage publishers store values like `digitale foto&#39;s` or `&#234;` (and
 * named forms such as `&amp;`) in their RDF; without decoding these would render
 * literally. Only runs when an entity is actually present.
 */
function decodeText(value: string): string {
  return value.includes('&') ? decodeHTML(value) : value;
}

function langLiterals(terms: RDF.Term[]): LangLiteral[] {
  return terms
    .filter((t) => t.termType === 'Literal')
    .map((t) => ({
      value: decodeText(t.value),
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

  // Richness = number of outgoing triples. Used to break ties between multiple
  // qualifying subjects: the actual heritage object is described in full, while
  // referenced stubs (e.g. an `isPartOf` Dataset) carry only @id + @type.
  const richness = (subject: RDF.Term) =>
    store.getQuads(subject as RDF.Quad_Subject, null, null, null).length;

  const richestWhere = (pred: (types: Set<string>) => boolean) => {
    let best: { subject: RDF.Term; types: Set<string>; r: number } | null = null;
    for (const { subject, types } of bySubject.values()) {
      if (!pred(types)) continue;
      const r = richness(subject);
      if (!best || r > best.r) best = { subject, types, r };
    }
    return best;
  };

  // 1. subject matching the requested URL with a recognized main type
  for (const [uri, { subject, types }] of bySubject) {
    if (urlCandidates.has(uri)) {
      const t = isMain(types);
      if (t) return { subject, type: CREATIVEWORK_SUBTYPES.has(t) ? 'CreativeWork' : t };
    }
  }
  // 2. the richest CreativeWork(-subtype) subject (most descriptive properties)
  const cw = richestWhere((types) => [...types].some((x) => CREATIVEWORK_SUBTYPES.has(x)));
  if (cw) return { subject: cw.subject, type: 'CreativeWork' };
  // 3. the richest top-level Person/Organization/Place
  const top = richestWhere((types) => [...types].some((x) => TOP_LEVEL_TYPES.has(x)));
  if (top) {
    const t = [...top.types].find((x) => TOP_LEVEL_TYPES.has(x))!;
    return { subject: top.subject, type: t };
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
      value: { value: decodeText(term.value), lang: (term as RDF.Literal).language || undefined },
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
    const extra = types.filter((t) => t !== 'DefinedTerm');
    return {
      kind: 'term',
      term: {
        name: langLiterals(objectsFor(store, term, 'name')),
        sameAs,
        types: extra.length ? extra : undefined,
      },
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
  /** The isPartOf dataset-description URI, if the object declares one (not fetched here). */
  datasetUri?: string;
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
  const datasetUri = firstIri(objectsFor(store, main.subject, 'isPartOf'));
  return { object, foundCreativeWork: main.type === 'CreativeWork', datasetUri };
}

/** Build the NDE Dataset Register deep link for a dataset-description URI. */
function datasetRegisterUrl(uri: string): string {
  return (
    'https://datasetregister.netwerkdigitaalerfgoed.nl/dataset?uri=' +
    encodeURIComponent(uri)
  );
}

/** Pick the schema:Dataset subject, preferring one whose IRI matches the URL. */
function pickDatasetSubject(
  store: Store,
  finalUrl: string,
  uri: string,
): RDF.Term | null {
  const datasets = store
    .getQuads(null, namedNode(RDF_TYPE), null, null)
    .filter((q) => schemaLocal(q.object.value) === 'Dataset')
    .map((q) => q.subject as RDF.Term);
  if (!datasets.length) return null;
  const wanted = new Set([finalUrl, uri, finalUrl.replace(/\/$/, ''), uri.replace(/\/$/, '')]);
  return datasets.find((s) => wanted.has(s.value)) ?? datasets[0];
}

/** Publisher display name(s): a nested resource's name, or a literal, else undefined. */
function datasetPublisher(store: Store, subject: RDF.Term): LangLiteral[] | undefined {
  const pub = objectsFor(store, subject, 'publisher')[0];
  if (!pub) return undefined;
  if (pub.termType === 'Literal') return [{ value: decodeText(pub.value) }];
  const names = langLiterals(objectsFor(store, pub, 'name'));
  return names.length ? names : undefined;
}

/**
 * Resolve an isPartOf dataset-description URI to its title/description/publisher.
 * Always returns a DatasetInfo (with the register link); `resolved` is false when
 * the URI does not yield linked data.
 */
export async function resolveDataset(uri: string): Promise<DatasetInfo> {
  const registerUrl = datasetRegisterUrl(uri);
  try {
    const { store, finalUrl } = await fetchLinkedData(uri);
    const subject = pickDatasetSubject(store, finalUrl, uri);
    if (!subject) return { uri, resolved: true, registerUrl };
    const name = langLiterals(objectsFor(store, subject, 'name'));
    const description = langLiterals(objectsFor(store, subject, 'description'));
    const publisher = datasetPublisher(store, subject);
    return {
      uri,
      resolved: true,
      name: name.length ? name : undefined,
      description: description.length ? description : undefined,
      publisher,
      registerUrl,
    };
  } catch {
    // URL_UNRESOLVED or NO_LINKED_DATA → only the URI + register link are available.
    return { uri, resolved: false, registerUrl };
  }
}
