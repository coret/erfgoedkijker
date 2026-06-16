// Voorbeeld-permalinks getoond onder het invoerveld. Elk is geverifieerd: het
// resolvet en levert linked data. Een relatieve URL (begint met "/") wordt door de
// pagina omgezet naar een absolute URL op basis van de huidige host — dit is het
// zelf-gehoste, volledig SCHEMA-AP-NDE-conforme demonstratieobject.

export type Example = {
  label: string;
  url: string;
  note?: string;
};

export const EXAMPLES: Example[] = [
  {
    label: 'Volledig voorbeeld',
    url: '/examples/schema-ap-nde',
    note:
      'Zelf-gehost, volledig SCHEMA-AP-NDE-conform: CreativeWork met termen (DefinedTerm + sameAs naar RKD/Getty) en een IIIF-manifest. Toont alle functies, inclusief het opzoeken van termen in het Termennetwerk.',
  },
  {
    label: 'Herdenking (ARK + IIIIF)',
    url: 'https://n2t.net/ark:/48228/MFF_1709840',
    note: 'Noorderstruun — schema:CreativeWork als JSON-LD. Heeft zowel IIIF als termen.',
  },
  {
    label: 'Object met ARK + IIIF',
    url: 'https://n2t.net/ark:/27707/KW_15039754',
    note: 'Kenniscentrum Kamp Westerbork — JSON-LD via content-negotiation, persistente ARK-URI die resolvet, met IIIF-manifest.',
  },
  {
    label: 'Schetsmodel (Handle + IIIF)',
    url: 'https://hdl.handle.net/20.500.14613/011j1n',
    note: '“schetsmodel harfsen, boombeeld” — Turtle via content-negotiation, persistente Handle-URI, met IIIF-manifest (Kleksi).',
  },
//  {
//    label: 'Niet-conform (Linked Art)',
//    url: 'https://id.rijksmuseum.nl/200107615',
//    note: 'Rijksmuseum levert wél linked data, maar als Linked Art (CIDOC-CRM), niet als SCHEMA-AP-NDE — toont de begeleiding bij niet-herkende data.',
//  },
];
