// Voorbeeld-permalinks getoond onder het invoerveld. Elk is geverifieerd: het
// resolvet en levert linked data.

export type Example = {
  label: string;
  url: string;
  note?: string;
};

export const EXAMPLES: Example[] = [
  {
    label: 'Herdenking',
    url: 'https://n2t.net/ark:/48228/MFF_1709840',
    note: 'Herdenking 80 jaar vrijheid Burgum',
  },
  {
    label: 'Brochure',
    url: 'https://n2t.net/ark:/27707/KW_15039754',
    note: 'Brochure van de werkgroep Westerbork 102.000',
  },
  {
    label: 'Schetsmodel',
    url: 'https://hdl.handle.net/20.500.14613/011j1n',
    note: 'Schetsmodel harfsen, boombeeld',
  },
  {
    label: 'Minuutplan',
    url: 'https://n2t.net/ark:/60537/bwrGXt',
    note: 'Kadastrale kaart (minuutplan) Gouda, sectie C, blad 01 (1811-1832)',
  },
  {
    label: 'Maliebaan verhaal',
    url: 'https://n2t.net/ark:/88585/e04696c4-56b3-483c-8ebb-b785c5f3aab4',
    note: 'De Maliebaan als bolwerk van de NSB',
  },
];
