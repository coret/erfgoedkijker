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

export type PropertyDef = {
  name: string;
  labelNl: string;
  required?: boolean;
  /** Dutch (≈ B1) explanation of the field, shown via an info popover. */
  descriptionNl?: string;
};

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
      {
        name: 'identifier',
        labelNl: 'Identificatie',
        descriptionNl:
          "Een unieke code voor het erfgoedobject, meestal een reeks letters en cijfers. Handig om het object mee aan te duiden buiten de linked data, bijvoorbeeld bij een tentoonstelling.",
      },
      { name: 'name', labelNl: 'Titel', required: true },
      {
        name: 'description',
        labelNl: 'Beschrijving',
        descriptionNl: 'Een volledige beschrijving van het erfgoedobject.',
      },
      {
        name: 'additionalType',
        labelNl: 'Objecttype',
        descriptionNl:
          'Extra typeringen van het erfgoedobject uit andere woordenlijsten dan Schema.org, zoals Getty AAT.',
      },
      {
        name: 'creator',
        labelNl: 'Maker',
        descriptionNl:
          'De persoon of organisatie die heeft meegewerkt aan het maken van het erfgoedobject.',
      },
      {
        name: 'abstract',
        labelNl: 'Samenvatting',
        descriptionNl:
          'Een korte samenvatting van het erfgoedobject in één zin. Gebruik hierin geen vakjargon of afkortingen, zodat iedereen het kan begrijpen.',
      },
      {
        name: 'text',
        labelNl: 'Tekst',
        descriptionNl:
          "De volledige tekstinhoud van het erfgoedobject, vooral bedoeld om het vindbaar te maken via zoeken. Denk aan de hele tekst van een verhaal, of tekst die is overgenomen uit beeld, zoals opschriften op foto's.",
      },
      {
        name: 'size',
        labelNl: 'Afmetingen',
        descriptionNl:
          'Hoe groot het erfgoedobject fysiek is, weergegeven op de gebruikelijke manier.',
      },
      {
        name: 'contentLocation',
        labelNl: 'Afgebeelde locatie',
        descriptionNl:
          'De plaats(en) die in het erfgoedobject te zien zijn of worden beschreven. Bijvoorbeeld de locatie op een foto of schilderij.',
      },
      {
        name: 'temporalCoverage',
        labelNl: 'Periode',
        descriptionNl:
          'De periode waar het erfgoedobject over gaat: de tijd die het beschrijft of laat zien.',
      },
      {
        name: 'about',
        labelNl: 'Onderwerp',
        descriptionNl:
          'Het onderwerp van het erfgoedobject. Bijvoorbeeld wat er op een schilderij of foto te zien is, waar een verhaal over gaat, of over welk ander object (zoals een collectiestuk) dit erfgoedobject gaat.',
      },
      {
        name: 'locationCreated',
        labelNl: 'Vervaardigingsplaats',
        descriptionNl:
          'De plaats(en) waar het erfgoedobject is gemaakt. Dit kan een andere plek zijn dan de plek die het object laat zien (de afgebeelde locatie).',
      },
      {
        name: 'dateCreated',
        labelNl: 'Datering',
        descriptionNl: 'De datum waarop het erfgoedobject is gemaakt.',
      },
      {
        name: 'material',
        labelNl: 'Materiaal',
        descriptionNl:
          'Het materiaal of de materialen waarvan het erfgoedobject is gemaakt, bijvoorbeeld leer, wol, katoen of papier.',
      },
      {
        name: 'genre',
        labelNl: 'Genre',
        descriptionNl:
          'Het genre of de genres van het erfgoedobject, bijvoorbeeld een kunststroming of periode.',
      },
      {
        name: 'associatedMedia',
        labelNl: 'Media',
        descriptionNl:
          'Eén of meer mediabestanden (zoals afbeeldingen) die het erfgoedobject tonen.',
      },
      {
        name: 'sdDatePublished',
        labelNl: 'Metadata laatst gewijzigd',
        required: true,
        descriptionNl:
          'De datum waarop de metadata (de beschrijving van het object) voor het laatst is aangepast.',
      },
      {
        name: 'isPartOf',
        labelNl: 'Onderdeel van dataset',
        descriptionNl: 'De dataset(s) waar het erfgoedobject onderdeel van is.',
      },
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
