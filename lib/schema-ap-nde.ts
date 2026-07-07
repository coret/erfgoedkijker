// SCHEMA-AP-NDE application profile: the classes and properties the ErfgoedKijker
// understands, with Dutch labels derived from the profile descriptions.
// https://docs.nde.nl/schema-profile/  ·  shapes: netwerk-digitaal-erfgoed/schema-profile
//
// Only properties listed here are shown; everything else in the graph is ignored.

export const SCHEMA = 'https://schema.org/';
export const SCHEMA_HTTP = 'http://schema.org/';
export const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

/** Local name of a schema.org IRI, accepting both https and http namespaces. */
export function schemaLocal(iri: string): string | null {
  if (iri.startsWith(SCHEMA)) return iri.slice(SCHEMA.length);
  if (iri.startsWith(SCHEMA_HTTP)) return iri.slice(SCHEMA_HTTP.length);
  return null;
}

export type PropertyDef = { name: string; labelNl: string; required?: boolean };

export type ClassDef = {
  /** schema.org local name */
  type: string;
  labelNl: string;
  /** properties in display order */
  properties: PropertyDef[];
};

// Dutch labels for the top-level and nested classes.
export const CLASS_LABELS_NL: Record<string, string> = {
  CreativeWork: 'Erfgoedobject',
  Person: 'Persoon',
  Organization: 'Organisatie',
  Place: 'Locatie',
  PostalAddress: 'Adres',
  GeoCoordinates: 'Coördinaten',
  MediaObject: 'Media-object',
  ImageObject: 'Afbeelding',
  VideoObject: 'Video',
  AudioObject: 'Audio',
  '3DModel': '3D-model',
  Occupation: 'Beroep',
  PropertyValue: 'Identificatie',
  DefinedTerm: 'Term',
};

export function classLabelNl(type: string): string {
  return CLASS_LABELS_NL[type] ?? type;
}

// Property → Dutch label, per class, in a sensible display order.
export const PROFILE: Record<string, ClassDef> = {
  CreativeWork: {
    type: 'CreativeWork',
    labelNl: 'Erfgoedobject',
    // Order and required flags follow SCHEMA-AP-NDE (https://docs.nde.nl/schema-profile/).
    properties: [
      { name: 'identifier', labelNl: 'Identificatie' },
      { name: 'name', labelNl: 'Titel', required: true },
      { name: 'description', labelNl: 'Beschrijving' },
      { name: 'additionalType', labelNl: 'Objecttype' },
      { name: 'creator', labelNl: 'Maker' },
      { name: 'abstract', labelNl: 'Samenvatting' },
      { name: 'text', labelNl: 'Tekst' },
      { name: 'size', labelNl: 'Afmetingen' },
      { name: 'contentLocation', labelNl: 'Afgebeelde locatie' },
      { name: 'temporalCoverage', labelNl: 'Periode' },
      { name: 'about', labelNl: 'Onderwerp' },
      { name: 'locationCreated', labelNl: 'Vervaardigingsplaats' },
      { name: 'dateCreated', labelNl: 'Datering' },
      { name: 'material', labelNl: 'Materiaal' },
      { name: 'genre', labelNl: 'Genre' },
      { name: 'associatedMedia', labelNl: 'Media' },
      { name: 'sdDatePublished', labelNl: 'Metadata laatst gewijzigd', required: true },
      { name: 'isPartOf', labelNl: 'Onderdeel van dataset' },
    ],
  },
  Person: {
    type: 'Person',
    labelNl: 'Persoon',
    properties: [
      { name: 'name', labelNl: 'Naam' },
      { name: 'birthDate', labelNl: 'Geboortedatum' },
      { name: 'birthPlace', labelNl: 'Geboorteplaats' },
      { name: 'deathDate', labelNl: 'Overlijdensdatum' },
      { name: 'deathPlace', labelNl: 'Overlijdensplaats' },
      { name: 'hasOccupation', labelNl: 'Beroep' },
    ],
  },
  Organization: {
    type: 'Organization',
    labelNl: 'Organisatie',
    properties: [
      { name: 'name', labelNl: 'Naam' },
      { name: 'location', labelNl: 'Locatie' },
    ],
  },
  Place: {
    type: 'Place',
    labelNl: 'Locatie',
    properties: [
      { name: 'name', labelNl: 'Naam' },
      { name: 'address', labelNl: 'Adres' },
      { name: 'geo', labelNl: 'Coördinaten' },
    ],
  },
  PostalAddress: {
    type: 'PostalAddress',
    labelNl: 'Adres',
    properties: [
      { name: 'streetAddress', labelNl: 'Straat' },
      { name: 'postalCode', labelNl: 'Postcode' },
      { name: 'addressLocality', labelNl: 'Plaats' },
      { name: 'addressRegion', labelNl: 'Regio' },
      { name: 'addressCountry', labelNl: 'Land' },
    ],
  },
  Occupation: {
    type: 'Occupation',
    labelNl: 'Beroep',
    properties: [{ name: 'name', labelNl: 'Naam' }],
  },
  PropertyValue: {
    type: 'PropertyValue',
    labelNl: 'Identificatie',
    properties: [
      { name: 'propertyID', labelNl: 'Soort' },
      { name: 'value', labelNl: 'Waarde' },
    ],
  },
};

// MediaObject and its subclasses share the same property set.
export const MEDIA_TYPES = new Set([
  'MediaObject',
  'ImageObject',
  'VideoObject',
  'AudioObject',
  '3DModel',
]);

export const MEDIA_PROPERTIES: PropertyDef[] = [
  { name: 'contentUrl', labelNl: 'Bestand' },
  { name: 'thumbnailUrl', labelNl: 'Miniatuur' },
  { name: 'encodingFormat', labelNl: 'Formaat' },
  { name: 'license', labelNl: 'Licentie' },
  { name: 'copyrightNotice', labelNl: 'Copyright' },
];

// Top-level classes that can be the "main object" of a permalink.
export const TOP_LEVEL_TYPES = new Set([
  'CreativeWork',
  'Person',
  'Organization',
  'Place',
]);

// schema.org subclasses of CreativeWork are common; treat any of these as the
// main heritage object when no plain CreativeWork is typed.
export const CREATIVEWORK_SUBTYPES = new Set([
  'CreativeWork',
  'Painting',
  'Photograph',
  'Book',
  'Sculpture',
  'VisualArtwork',
  'Drawing',
  'Manuscript',
  'Map',
  'Poster',
  'Article',
  'Dataset',
  'Clip',
  'MusicComposition',
  'Movie',
]);

/** True when an encodingFormat string denotes an IIIF Presentation manifest. */
export function isIiifEncodingFormat(fmt: string | undefined): boolean {
  if (!fmt) return false;
  return /iiif\.io\/api\/presentation\/\d+\/context\.json/.test(fmt);
}
