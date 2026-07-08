// Voorbeeld-permalinks getoond onder het invoerveld. Elk is geverifieerd: het
// resolvet en levert linked data.
//
// Only the chip label is translated. `note` is the real title of a real heritage object
// — that is metadata, not interface text, so it stays as published.

import type { Locale } from './i18n';

export type Example = {
  label: Record<Locale, string>;
  url: string;
  note?: string;
};

export const EXAMPLES: Example[] = [
  {
    label: { nl: 'Herdenking', en: 'Commemoration' },
    url: 'https://n2t.net/ark:/48228/MFF_1709840',
    note: 'Herdenking 80 jaar vrijheid Burgum',
  },
  {
    label: { nl: 'Brochure', en: 'Brochure' },
    url: 'https://n2t.net/ark:/27707/KW_15039754',
    note: 'Brochure van de werkgroep Westerbork 102.000',
  },
  {
    label: { nl: 'Schetsmodel', en: 'Sketch model' },
    url: 'https://hdl.handle.net/20.500.14613/011j1n',
    note: 'Schetsmodel harfsen, boombeeld',
  },
  {
    label: { nl: 'Minuutplan', en: 'Cadastral map' },
    url: 'https://n2t.net/ark:/60537/bwrGXt',
    note: 'Kadastrale kaart (minuutplan) Gouda, sectie C, blad 01 (1811-1832)',
  },
  {
    label: { nl: 'Maliebaan verhaal', en: 'Maliebaan story' },
    url: 'https://n2t.net/ark:/88585/e04696c4-56b3-483c-8ebb-b785c5f3aab4',
    note: 'De Maliebaan als bolwerk van de NSB',
  },
];
