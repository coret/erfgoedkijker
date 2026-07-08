// SCHEMA-AP-NDE application profile: the classes and properties the ErfgoedKijker
// understands, with labels in both interface languages.
// https://docs.nde.nl/schema-profile/  ·  shapes: netwerk-digitaal-erfgoed/schema-profile
//
// Only properties listed here are shown; everything else in the graph is ignored.
//
// Labels live here rather than in messages/{nl,en}.json because they are keyed by the
// schema.org `property` and `type` local names that already travel over the wire in the
// view-model. Putting them in the message catalog would force dynamic keys such as
// t(`profile.${type}.${property}`), which next-intl cannot verify at compile time.

import type { Locale } from './i18n';

export const SCHEMA = 'https://schema.org/';
export const SCHEMA_HTTP = 'http://schema.org/';
export const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

/** Local name of a schema.org IRI, accepting both https and http namespaces. */
export function schemaLocal(iri: string): string | null {
  if (iri.startsWith(SCHEMA)) return iri.slice(SCHEMA.length);
  if (iri.startsWith(SCHEMA_HTTP)) return iri.slice(SCHEMA_HTTP.length);
  return null;
}

/** A string in every interface language. */
export type Translated = Record<Locale, string>;

export type PropertyDef = {
  name: string;
  label: Translated;
  required?: boolean;
  /** ≈B1 explanation of the field, shown via an info popover. */
  description?: Translated;
};

export type ClassDef = {
  /** schema.org local name */
  type: string;
  /** properties in display order */
  properties: PropertyDef[];
};

// Labels for the top-level and nested classes. `Thing` is the pseudo-class `lib/rdf.ts`
// uses for an untyped resource that only has a name.
export const CLASS_LABELS: Record<string, Translated> = {
  CreativeWork: { nl: 'Erfgoedobject', en: 'Heritage object' },
  Person: { nl: 'Persoon', en: 'Person' },
  Organization: { nl: 'Organisatie', en: 'Organisation' },
  Place: { nl: 'Locatie', en: 'Location' },
  PostalAddress: { nl: 'Adres', en: 'Address' },
  GeoCoordinates: { nl: 'Coördinaten', en: 'Coordinates' },
  MediaObject: { nl: 'Media-object', en: 'Media object' },
  ImageObject: { nl: 'Afbeelding', en: 'Image' },
  VideoObject: { nl: 'Video', en: 'Video' },
  AudioObject: { nl: 'Audio', en: 'Audio' },
  '3DModel': { nl: '3D-model', en: '3D model' },
  Occupation: { nl: 'Beroep', en: 'Occupation' },
  PropertyValue: { nl: 'Identificatie', en: 'Identifier' },
  DefinedTerm: { nl: 'Term', en: 'Term' },
  Thing: { nl: 'Verwijzing', en: 'Reference' },
};

// Property → label, per class, in a sensible display order.
export const PROFILE: Record<string, ClassDef> = {
  CreativeWork: {
    type: 'CreativeWork',
    // Order and required flags follow SCHEMA-AP-NDE (https://docs.nde.nl/schema-profile/).
    properties: [
      {
        name: 'identifier',
        label: { nl: 'Identificatie', en: 'Identifier' },
        description: {
          nl: 'Een unieke code voor het erfgoedobject, meestal een reeks letters en cijfers. Handig om het object mee aan te duiden buiten de linked data, bijvoorbeeld bij een tentoonstelling.',
          en: 'A unique code for the heritage object, usually a string of letters and numbers. Useful for referring to the object outside the linked data, for example in an exhibition.',
        },
      },
      { name: 'name', label: { nl: 'Titel', en: 'Title' }, required: true },
      {
        name: 'description',
        label: { nl: 'Beschrijving', en: 'Description' },
        description: {
          nl: 'Een volledige beschrijving van het erfgoedobject.',
          en: 'A full description of the heritage object.',
        },
      },
      {
        name: 'additionalType',
        label: { nl: 'Objecttype', en: 'Object type' },
        description: {
          nl: 'Extra typeringen van het erfgoedobject uit andere woordenlijsten dan Schema.org, zoals Getty AAT.',
          en: 'Additional types for the heritage object, from vocabularies other than Schema.org, such as Getty AAT.',
        },
      },
      {
        name: 'creator',
        label: { nl: 'Maker', en: 'Creator' },
        description: {
          nl: 'De persoon of organisatie die heeft meegewerkt aan het maken van het erfgoedobject.',
          en: 'The person or organisation that had a role in producing the heritage object.',
        },
      },
      {
        name: 'abstract',
        label: { nl: 'Samenvatting', en: 'Summary' },
        description: {
          nl: 'Een korte samenvatting van het erfgoedobject in één zin. Gebruik hierin geen vakjargon of afkortingen, zodat iedereen het kan begrijpen.',
          en: 'A short summary of the heritage object in one sentence. Avoid jargon and abbreviations, so that everyone can understand it.',
        },
      },
      {
        name: 'text',
        label: { nl: 'Tekst', en: 'Text' },
        description: {
          nl: "De volledige tekstinhoud van het erfgoedobject, vooral bedoeld om het vindbaar te maken via zoeken. Denk aan de hele tekst van een verhaal, of tekst die is overgenomen uit beeld, zoals opschriften op foto's.",
          en: 'The complete textual content of the heritage object, mainly meant to make it findable through search. Think of the full text of a story, or text transcribed from an image, such as an inscription on a photograph.',
        },
      },
      {
        name: 'size',
        label: { nl: 'Afmetingen', en: 'Dimensions' },
        description: {
          nl: 'Hoe groot het erfgoedobject fysiek is, weergegeven op de gebruikelijke manier.',
          en: 'How large the heritage object is physically, given in its usual form.',
        },
      },
      {
        name: 'contentLocation',
        label: { nl: 'Afgebeelde locatie', en: 'Depicted location' },
        description: {
          nl: 'De plaats(en) die in het erfgoedobject te zien zijn of worden beschreven. Bijvoorbeeld de locatie op een foto of schilderij.',
          en: 'The place or places shown or described in the heritage object. For example, the location in a photograph or painting.',
        },
      },
      {
        name: 'temporalCoverage',
        label: { nl: 'Periode', en: 'Period' },
        description: {
          nl: 'De periode waar het erfgoedobject over gaat: de tijd die het beschrijft of laat zien.',
          en: 'The period the heritage object is about: the time it describes or depicts.',
        },
      },
      {
        name: 'about',
        label: { nl: 'Onderwerp', en: 'Subject' },
        description: {
          nl: 'Het onderwerp van het erfgoedobject. Bijvoorbeeld wat er op een schilderij of foto te zien is, waar een verhaal over gaat, of over welk ander object (zoals een collectiestuk) dit erfgoedobject gaat.',
          en: 'The subject of the heritage object. For example what a painting or photograph shows, what a story is about, or which other object (such as a collection item) this heritage object concerns.',
        },
      },
      {
        name: 'locationCreated',
        label: { nl: 'Vervaardigingsplaats', en: 'Place of creation' },
        description: {
          nl: 'De plaats(en) waar het erfgoedobject is gemaakt. Dit kan een andere plek zijn dan de plek die het object laat zien (de afgebeelde locatie).',
          en: 'The place or places where the heritage object was made. This can differ from the place the object shows (the depicted location).',
        },
      },
      {
        name: 'dateCreated',
        label: { nl: 'Datering', en: 'Date created' },
        description: {
          nl: 'De datum waarop het erfgoedobject is gemaakt.',
          en: 'The date on which the heritage object was made.',
        },
      },
      {
        name: 'material',
        label: { nl: 'Materiaal', en: 'Material' },
        description: {
          nl: 'Het materiaal of de materialen waarvan het erfgoedobject is gemaakt, bijvoorbeeld leer, wol, katoen of papier.',
          en: 'The material or materials the heritage object is made of, for example leather, wool, cotton or paper.',
        },
      },
      {
        name: 'genre',
        label: { nl: 'Genre', en: 'Genre' },
        description: {
          nl: 'Het genre of de genres van het erfgoedobject, bijvoorbeeld een kunststroming of periode.',
          en: 'The genre or genres of the heritage object, for example an art movement or period.',
        },
      },
      {
        name: 'associatedMedia',
        label: { nl: 'Media', en: 'Media' },
        description: {
          nl: 'Eén of meer mediabestanden (zoals afbeeldingen) die het erfgoedobject tonen.',
          en: 'One or more media files (such as images) that show the heritage object.',
        },
      },
      {
        name: 'sdDatePublished',
        label: { nl: 'Metadata laatst gewijzigd', en: 'Metadata last changed' },
        required: true,
        description: {
          nl: 'De datum waarop de metadata (de beschrijving van het object) voor het laatst is aangepast.',
          en: 'The date on which the metadata (the description of the object) was last changed.',
        },
      },
      {
        name: 'isPartOf',
        label: { nl: 'Onderdeel van dataset', en: 'Part of dataset' },
        description: {
          nl: 'De dataset(s) waar het erfgoedobject onderdeel van is.',
          en: 'The dataset or datasets the heritage object is part of.',
        },
      },
    ],
  },
  Person: {
    type: 'Person',
    properties: [
      { name: 'name', label: { nl: 'Naam', en: 'Name' } },
      { name: 'birthDate', label: { nl: 'Geboortedatum', en: 'Date of birth' } },
      { name: 'birthPlace', label: { nl: 'Geboorteplaats', en: 'Place of birth' } },
      { name: 'deathDate', label: { nl: 'Overlijdensdatum', en: 'Date of death' } },
      { name: 'deathPlace', label: { nl: 'Overlijdensplaats', en: 'Place of death' } },
      { name: 'hasOccupation', label: { nl: 'Beroep', en: 'Occupation' } },
    ],
  },
  Organization: {
    type: 'Organization',
    properties: [
      { name: 'name', label: { nl: 'Naam', en: 'Name' } },
      { name: 'location', label: { nl: 'Locatie', en: 'Location' } },
    ],
  },
  Place: {
    type: 'Place',
    properties: [
      { name: 'name', label: { nl: 'Naam', en: 'Name' } },
      { name: 'address', label: { nl: 'Adres', en: 'Address' } },
      { name: 'geo', label: { nl: 'Coördinaten', en: 'Coordinates' } },
    ],
  },
  PostalAddress: {
    type: 'PostalAddress',
    properties: [
      { name: 'streetAddress', label: { nl: 'Straat', en: 'Street' } },
      { name: 'postalCode', label: { nl: 'Postcode', en: 'Postal code' } },
      { name: 'addressLocality', label: { nl: 'Plaats', en: 'Town or city' } },
      { name: 'addressRegion', label: { nl: 'Regio', en: 'Region' } },
      { name: 'addressCountry', label: { nl: 'Land', en: 'Country' } },
    ],
  },
  Occupation: {
    type: 'Occupation',
    properties: [{ name: 'name', label: { nl: 'Naam', en: 'Name' } }],
  },
  PropertyValue: {
    type: 'PropertyValue',
    properties: [
      { name: 'propertyID', label: { nl: 'Soort', en: 'Type' } },
      { name: 'value', label: { nl: 'Waarde', en: 'Value' } },
    ],
  },
};

/** Untyped resource that only carries a name; see the `Thing` fallback in `lib/rdf.ts`. */
const THING_PROPERTIES: PropertyDef[] = [{ name: 'name', label: { nl: 'Naam', en: 'Name' } }];

// MediaObject and its subclasses share the same property set.
export const MEDIA_TYPES = new Set([
  'MediaObject',
  'ImageObject',
  'VideoObject',
  'AudioObject',
  '3DModel',
]);

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

export function classLabel(type: string, locale: Locale): string {
  return CLASS_LABELS[type]?.[locale] ?? type;
}

function definitionsFor(type: string): PropertyDef[] | undefined {
  if (PROFILE[type]) return PROFILE[type].properties;
  if (type === 'Thing') return THING_PROPERTIES;
  return undefined;
}

/**
 * The profile definition of `property` as it appears on `type`.
 *
 * The CreativeWork fallback matters twice over: a CreativeWork *subtype* (Painting,
 * Photograph, …) has no PROFILE entry of its own, and `/api/object` attaches an
 * `isPartOf` dataset field to whatever the main object is — including a Person or Place,
 * whose property lists do not mention `isPartOf`. Without the fallback those rows would
 * be labelled with the bare property name.
 *
 * Class-specific definitions win, which is why `name` is "Titel" on a CreativeWork but
 * "Naam" on a Person — and why a map keyed on property name alone would be wrong.
 */
export function propertyDef(type: string, property: string): PropertyDef | undefined {
  return (
    definitionsFor(type)?.find((p) => p.name === property) ??
    PROFILE.CreativeWork.properties.find((p) => p.name === property)
  );
}

export function propertyLabel(type: string, property: string, locale: Locale): string {
  return propertyDef(type, property)?.label[locale] ?? property;
}

export function propertyDescription(
  type: string,
  property: string,
  locale: Locale,
): string | undefined {
  return propertyDef(type, property)?.description?.[locale];
}

/** True when an encodingFormat string denotes an IIIF Presentation manifest. */
export function isIiifEncodingFormat(fmt: string | undefined): boolean {
  if (!fmt) return false;
  return /iiif\.io\/api\/presentation\/\d+\/context\.json/.test(fmt);
}
