// Shared view-model types passed from the server (/api/object) to the client.
// The client is purely presentational; all RDF parsing happens server-side.

export type LangLiteral = { value: string; lang?: string };

export type DefinedTermValue = {
  /** Language-tagged display name(s) from the publishing dataset. */
  name: LangLiteral[];
  /** Canonical term URI in a controlled vocabulary (clickable → Termennetwerk). */
  sameAs?: string;
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

export type Field = {
  /** schema.org property local name, e.g. "creator". */
  property: string;
  labelNl: string;
  values: ValueNode[];
};

export type MappedResource = {
  uri?: string;
  /** schema.org class local name, e.g. "Person". */
  type: string;
  typeLabelNl: string;
  fields: Field[];
};

export type ObjectView = {
  uri: string;
  /** schema.org class local name of the main object (usually CreativeWork). */
  type: string;
  typeLabelNl: string;
  fields: Field[];
  /** Convenience: does this object expose an IIIF manifest? */
  iiifManifestUrl?: string;
  /** Convenience: count of DefinedTerm values anywhere in the tree. */
  termCount: number;
};

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
};

export type ObjectResponse = {
  ok: boolean;
  /** Set when no object view could be produced at all (URL/linked-data level). */
  fatal?: GuidanceCode;
  message?: string;
  object?: ObjectView;
  diagnostics: Diagnostics;
  /** Non-fatal notices to render inline (e.g. NO_IIIF, NO_TERMS, NOT_SCHEMA_AP_NDE). */
  notices: GuidanceCode[];
};
