// Shared view-model types passed from the server (/api/object) to the client.
// The client is purely presentational; all RDF parsing happens server-side.

export type LangLiteral = { value: string; lang?: string };

/** Which schema.org namespace a source uses: recommended https, legacy http, or both. */
export type SchemaOrgVariant = 'https' | 'http' | 'mixed';

/** Comparison of the media's schema:license against the IIIF manifest's rights/license. */
export type LicenseCheck = {
  match: boolean;
  /** The compared schema:license of the media. */
  media: string;
  /** The rights/license URI from the IIIF manifest. */
  manifest: string;
};

export type DefinedTermValue = {
  /** Language-tagged display name(s) from the publishing dataset. */
  name: LangLiteral[];
  /** Canonical term URI in a controlled vocabulary (clickable → Termennetwerk). */
  sameAs?: string;
  /** Extra schema.org type local names beyond DefinedTerm (e.g. ["Person"]); DefinedTerm excluded. */
  types?: string[];
};

export type MediaValue = {
  contentUrl?: string;
  thumbnailUrl?: string;
  encodingFormat?: string;
  license?: string;
  copyrightNotice?: LangLiteral[];
};

export type DatasetInfo = {
  /** The isPartOf dataset-description URI (also used for the register link). */
  uri: string;
  /** Did the URI resolve to linked data (RDF)? */
  resolved: boolean;
  name?: LangLiteral[];
  description?: LangLiteral[];
  /** Publisher display name(s). */
  publisher?: LangLiteral[];
  /** Deep link into the NDE Dataset Register. */
  registerUrl: string;
};

export type ValueNode =
  | { kind: 'literal'; value: LangLiteral }
  | { kind: 'date'; value: string }
  | { kind: 'iri'; value: string }
  | { kind: 'term'; term: DefinedTermValue }
  | { kind: 'resource'; resource: MappedResource }
  | { kind: 'geo'; lat: number; long: number }
  | { kind: 'media'; media: MediaValue }
  | { kind: 'dataset'; dataset: DatasetInfo }
  | { kind: 'iiif'; manifestUrl: string };

// No display labels travel over the wire: the client resolves them from `property` and
// `type` via `lib/schema-ap-nde.ts` in the current interface language, so switching
// language never needs to refetch the object.

export type Field = {
  /** schema.org property local name, e.g. "creator". */
  property: string;
  values: ValueNode[];
};

export type MappedResource = {
  uri?: string;
  /** schema.org class local name, e.g. "Person". */
  type: string;
  fields: Field[];
};

export type ObjectView = {
  uri: string;
  /** schema.org class local name of the main object (usually CreativeWork). */
  type: string;
  fields: Field[];
  /** Convenience: does this object expose an IIIF manifest? */
  iiifManifestUrl?: string;
  /** Convenience: count of DefinedTerm values anywhere in the tree. */
  termCount: number;
};

/** Stable error codes returned by the API routes; the client translates them. */
export type ApiErrorCode = 'INVALID_URL' | 'NO_URIS' | 'TERM_LOOKUP_FAILED';

export type GuidanceCode =
  | 'URL_UNRESOLVED'
  | 'NO_LINKED_DATA'
  | 'NOT_SCHEMA_AP_NDE'
  | 'NO_IIIF'
  | 'NO_TERMS';

export type PersistentId = {
  scheme: 'ARK' | 'Handle' | 'DOI' | 'URN:NBN' | null;
  input?: string;
  resolved?: string;
  ok: boolean | null;
};

export type Diagnostics = {
  inputUrl: string;
  httpStatus: number | null;
  finalUrl: string | null;
  redirectChain: string[];
  contentType: string | null;
  detectedFormat: string | null;
  tripleCount: number;
  foundCreativeWork: boolean;
  persistentId: PersistentId;
  /** Did the isPartOf dataset-description URI resolve to RDF? null = not present/checked. */
  datasetResolves: boolean | null;
  /** The object's graph serialized as pretty-printed Turtle; null on fetch/parse failure. */
  turtle: string | null;
  /** schema.org namespace variant used by the source (https recommended); null = none present. */
  schemaOrg: SchemaOrgVariant | null;
  /** Does the media license match the IIIF manifest's rights? null = not applicable/undetermined. */
  licenseCheck: LicenseCheck | null;
  /** Count of text values (name/description/abstract/text/copyrightNotice) lacking a language tag; null = not computed. */
  missingLanguageTags: number | null;
};

export type ObjectResponse = {
  ok: boolean;
  /** Set when no object view could be produced at all (URL/linked-data level). */
  fatal?: GuidanceCode;
  /** Debug only, never rendered: the raw upstream error. Users see `fatal`'s guidance. */
  message?: string;
  object?: ObjectView;
  diagnostics: Diagnostics;
  /** Non-fatal notices to render inline (e.g. NO_IIIF, NO_TERMS, NOT_SCHEMA_AP_NDE). */
  notices: GuidanceCode[];
};
