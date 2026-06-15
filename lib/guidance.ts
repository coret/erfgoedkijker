import type { GuidanceCode } from './types';

// Low-threshold, motivating guidance for each failure / empty situation.
// Never show a bare error: explain what it means, why it matters, and what to do,
// with a link to the relevant NDE documentation.

export type Guidance = {
  code: GuidanceCode;
  tone: 'error' | 'info';
  title: string;
  body: string;
  suggestion: string;
  docHref: string;
  docLabel: string;
};

export const GUIDANCE: Record<GuidanceCode, Guidance> = {
  URL_UNRESOLVED: {
    code: 'URL_UNRESOLVED',
    tone: 'error',
    title: 'We konden deze URL niet bereiken',
    body:
      'De opgegeven permalink gaf geen antwoord, of de persistente identifier (ARK/Handle/DOI) loste niet op naar een werkende locatie.',
    suggestion:
      'Controleer of de link klopt en in een browser opent. Is het een ARK of Handle? Controleer dan of de resolver correct is geconfigureerd, zodat de persistente URI doorverwijst naar je object.',
    docHref: 'https://docs.nde.nl/requirements-collection-management-systems/',
    docLabel: 'NDE: persistente identifiers',
  },
  NO_LINKED_DATA: {
    code: 'NO_LINKED_DATA',
    tone: 'error',
    title: 'Deze URL biedt (nog) geen linked data',
    body:
      'De URL is bereikbaar, maar leverde geen linked data terug die we konden inlezen. Mogelijk wordt alleen HTML aangeboden, of ondersteunt de server geen content-negotiation.',
    suggestion:
      'Zorg dat het object via content-negotiation linked data aanbiedt — bij voorkeur JSON-LD, of anders Turtle, N-Triples of N-Quads — op dezelfde URL.',
    docHref: 'https://docs.nde.nl/schema-profile/',
    docLabel: 'NDE: linked data publiceren',
  },
  NOT_SCHEMA_AP_NDE: {
    code: 'NOT_SCHEMA_AP_NDE',
    tone: 'info',
    title: 'Linked data gevonden, maar geen herkende SCHEMA-AP-NDE-velden',
    body:
      'We konden de linked data inlezen, maar vonden geen erfgoedobject (schema:CreativeWork) met velden die we volgens SCHEMA-AP-NDE herkennen. Hieronder zie je wel de ruwe diagnostiek.',
    suggestion:
      'Modelleer het object als een schema:CreativeWork met ten minste een naam, en gebruik de eigenschappen uit het profiel. Zo kunnen consumenten je data uniform tonen.',
    docHref: 'https://docs.nde.nl/schema-profile/',
    docLabel: 'NDE: SCHEMA-AP-NDE profiel',
  },
  NO_IIIF: {
    code: 'NO_IIIF',
    tone: 'info',
    title: 'Geen IIIF-manifest gevonden',
    body:
      'Voor dit object is geen IIIF Presentation-manifest aangeboden, dus er is geen interactieve afbeeldingsviewer beschikbaar.',
    suggestion:
      'Voeg een IIIF-manifest toe als extra associatedMedia-waarde (met het juiste encodingFormat). Daarmee kunnen kijkers in- en uitzoomen en door meerdere afbeeldingen bladeren.',
    docHref: 'https://docs.nde.nl/schema-profile/',
    docLabel: 'NDE: media & IIIF',
  },
  NO_TERMS: {
    code: 'NO_TERMS',
    tone: 'info',
    title: 'Nog geen verwijzingen naar termen',
    body:
      'Dit object verwijst nog niet naar termen uit een gedeelde vocabulaire (een DefinedTerm met een sameAs-URI).',
    suggestion:
      'Koppel waar mogelijk makers, onderwerpen, materialen en plaatsen aan publieke termen via het NDE Termennetwerk. Zo wordt je collectie vindbaar en koppelbaar over instellingen heen.',
    docHref: 'https://docs.nde.nl/services/network-of-terms/',
    docLabel: 'NDE: Termennetwerk',
  },
};

export function getGuidance(code: GuidanceCode): Guidance {
  return GUIDANCE[code];
}
