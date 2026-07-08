import type { GuidanceCode } from './types';
import type { Locale } from './i18n';
import type { Translated } from './schema-ap-nde';

// Low-threshold, motivating guidance for each failure / empty situation.
// Never show a bare error: explain what it means, why it matters, and what to do,
// with a link to the relevant NDE documentation.
//
// `docHref` is the same in both languages: docs.nde.nl is published in English only.

export type GuidanceDef = {
  code: GuidanceCode;
  tone: 'error' | 'info';
  docHref: string;
  title: Translated;
  body: Translated;
  suggestion: Translated;
  docLabel: Translated;
};

/** A GuidanceDef resolved to one interface language. */
export type Guidance = {
  code: GuidanceCode;
  tone: 'error' | 'info';
  docHref: string;
  title: string;
  body: string;
  suggestion: string;
  docLabel: string;
};

export const GUIDANCE: Record<GuidanceCode, GuidanceDef> = {
  URL_UNRESOLVED: {
    code: 'URL_UNRESOLVED',
    tone: 'error',
    docHref: 'https://docs.nde.nl/requirements-collection-management-systems/',
    title: {
      nl: 'We konden deze URL niet bereiken',
      en: 'We could not reach this URL',
    },
    body: {
      nl: 'De opgegeven permalink gaf geen antwoord, of de persistente identifier (ARK/Handle/DOI) loste niet op naar een werkende locatie.',
      en: 'The permalink you entered did not respond, or its persistent identifier (ARK/Handle/DOI) did not resolve to a working location.',
    },
    suggestion: {
      nl: 'Controleer of de link klopt en in een browser opent. Is het een ARK of Handle? Controleer dan of de resolver correct is geconfigureerd, zodat de persistente URI doorverwijst naar je object.',
      en: 'Check that the link is correct and opens in a browser. Is it an ARK or Handle? Then check that the resolver is configured correctly, so the persistent URI redirects to your object.',
    },
    docLabel: {
      nl: 'NDE: persistente identifiers',
      en: 'NDE: persistent identifiers',
    },
  },
  NO_LINKED_DATA: {
    code: 'NO_LINKED_DATA',
    tone: 'error',
    docHref: 'https://docs.nde.nl/schema-profile/',
    title: {
      nl: 'Deze URL biedt (nog) geen linked data',
      en: 'This URL does not offer linked data (yet)',
    },
    body: {
      nl: 'De URL is bereikbaar, maar leverde geen linked data terug die we konden inlezen. Mogelijk wordt alleen HTML aangeboden, of ondersteunt de server geen content-negotiation.',
      en: 'The URL is reachable, but returned no linked data we could parse. It may serve only HTML, or the server may not support content negotiation.',
    },
    suggestion: {
      nl: 'Zorg dat het object via content-negotiation linked data aanbiedt — bij voorkeur JSON-LD, of anders Turtle, N-Triples of N-Quads — op dezelfde URL.',
      en: 'Make sure the object offers linked data through content negotiation — preferably JSON-LD, otherwise Turtle, N-Triples or N-Quads — at the same URL.',
    },
    docLabel: {
      nl: 'NDE: linked data publiceren',
      en: 'NDE: publishing linked data',
    },
  },
  NOT_SCHEMA_AP_NDE: {
    code: 'NOT_SCHEMA_AP_NDE',
    tone: 'info',
    docHref: 'https://docs.nde.nl/schema-profile/',
    title: {
      nl: 'Linked data gevonden, maar geen herkende SCHEMA-AP-NDE-velden',
      en: 'Linked data found, but no recognised SCHEMA-AP-NDE fields',
    },
    body: {
      nl: 'We konden de linked data inlezen, maar vonden geen erfgoedobject (schema:CreativeWork) met velden die we volgens SCHEMA-AP-NDE herkennen. Hieronder zie je wel de ruwe diagnostiek.',
      en: 'We could parse the linked data, but found no heritage object (schema:CreativeWork) with fields we recognise from SCHEMA-AP-NDE. The raw diagnostics are shown below.',
    },
    suggestion: {
      nl: 'Modelleer het object als een schema:CreativeWork met ten minste een naam, en gebruik de eigenschappen uit het profiel. Zo kunnen consumenten je data uniform tonen.',
      en: 'Model the object as a schema:CreativeWork with at least a name, and use the properties from the profile. That lets consumers display your data consistently.',
    },
    docLabel: {
      nl: 'NDE: SCHEMA-AP-NDE profiel',
      en: 'NDE: SCHEMA-AP-NDE profile',
    },
  },
  NO_IIIF: {
    code: 'NO_IIIF',
    tone: 'info',
    docHref: 'https://docs.nde.nl/schema-profile/',
    title: {
      nl: 'Geen IIIF-manifest gevonden',
      en: 'No IIIF manifest found',
    },
    body: {
      nl: 'Voor dit object is geen IIIF Presentation-manifest aangeboden, dus er is geen interactieve afbeeldingsviewer beschikbaar.',
      en: 'No IIIF Presentation manifest is offered for this object, so there is no interactive image viewer available.',
    },
    suggestion: {
      nl: 'Voeg een IIIF-manifest toe als extra associatedMedia-waarde (met het juiste encodingFormat). Daarmee kunnen kijkers in- en uitzoomen en door meerdere afbeeldingen bladeren.',
      en: 'Add a IIIF manifest as an extra associatedMedia value (with the right encodingFormat). That lets viewers zoom in and out and page through multiple images.',
    },
    docLabel: {
      nl: 'NDE: media & IIIF',
      en: 'NDE: media & IIIF',
    },
  },
  NO_TERMS: {
    code: 'NO_TERMS',
    tone: 'info',
    docHref: 'https://docs.nde.nl/services/network-of-terms/',
    title: {
      nl: 'Nog geen verwijzingen naar termen',
      en: 'No references to terms yet',
    },
    body: {
      nl: 'Dit object verwijst nog niet naar termen uit een gedeelde vocabulaire (een DefinedTerm met een sameAs-URI).',
      en: 'This object does not yet refer to terms from a shared vocabulary (a DefinedTerm with a sameAs URI).',
    },
    suggestion: {
      nl: 'Koppel waar mogelijk makers, onderwerpen, materialen en plaatsen aan publieke termen via het NDE Termennetwerk. Zo wordt je collectie vindbaar en koppelbaar over instellingen heen.',
      en: 'Wherever possible, link creators, subjects, materials and places to public terms via the NDE Network of Terms. That makes your collection findable and linkable across institutions.',
    },
    docLabel: {
      nl: 'NDE: Termennetwerk',
      en: 'NDE: Network of Terms',
    },
  },
};

export function getGuidance(code: GuidanceCode, locale: Locale): Guidance {
  const g = GUIDANCE[code];
  return {
    code: g.code,
    tone: g.tone,
    docHref: g.docHref,
    title: g.title[locale],
    body: g.body[locale],
    suggestion: g.suggestion[locale],
    docLabel: g.docLabel[locale],
  };
}
