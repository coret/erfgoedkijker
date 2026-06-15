import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A self-hosted, fully SCHEMA-AP-NDE-conformant demonstration object, served as
// JSON-LD. It exists so the ErfgoedKijker can showcase every feature against
// reliable data: a typed CreativeWork, DefinedTerms with real `sameAs` URIs that
// resolve in the NDE Termennetwerk, and an IIIF Presentation manifest exposed via
// `associatedMedia` (the profile-compliant path). It is a synthetic record.
export async function GET(req: NextRequest) {
  const self = new URL(req.url);
  self.search = '';
  const id = self.toString();

  const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
  const IMG =
    'https://eu.cdn.kleksi.com/qb3d1n/E1jxnLwM_CU-tLCXKZHhhGqwZWY224rPsfJ3T5A3qV9.NE-pvqfWSmD-Ju6fj_Qq';

  const doc = {
    '@context': 'https://schema.org/',
    '@id': id,
    '@type': 'CreativeWork',
    name: [{ '@value': 'Voorbeeldobject (SCHEMA-AP-NDE)', '@language': 'nl' }],
    sdDatePublished: '2026-06-15',
    description: [
      {
        '@value':
          'Een synthetisch demonstratierecord dat alle onderdelen van SCHEMA-AP-NDE toont: een CreativeWork met termen (DefinedTerm met sameAs) en een IIIF-manifest.',
        '@language': 'nl',
      },
    ],
    additionalType: {
      '@type': ['DefinedTerm', 'URL'],
      name: [{ '@value': 'schilderingen', '@language': 'nl' }],
      sameAs: 'http://vocab.getty.edu/aat/300033618',
    },
    creator: {
      '@type': ['Person', 'DefinedTerm'],
      name: [{ '@value': 'Vincent van Gogh', '@language': 'nl' }],
      sameAs: 'https://data.rkd.nl/artists/32439',
    },
    dateCreated: '1889-06',
    material: [
      {
        '@type': ['DefinedTerm', 'URL'],
        name: [{ '@value': 'olieverf', '@language': 'nl' }],
        sameAs: 'http://vocab.getty.edu/aat/300015050',
      },
      {
        '@type': ['DefinedTerm', 'URL'],
        name: [{ '@value': 'doek', '@language': 'nl' }],
        sameAs: 'http://vocab.getty.edu/aat/300014078',
      },
    ],
    size: '73,7 × 92,1 cm',
    associatedMedia: [
      {
        '@type': ['ImageObject', 'MediaObject'],
        contentUrl: `${IMG}/full/max/0/default.jpg`,
        thumbnailUrl: `${IMG}/full/512,/0/default.jpg`,
        encodingFormat: 'image/jpeg',
        license: CC0,
      },
      {
        '@id': 'https://eu.api.kleksi.com/apps/qb3d1n/collectionitems/02n75v/manifest',
        encodingFormat:
          "application/ld+json;profile='http://iiif.io/api/presentation/3/context.json'",
        license: CC0,
      },
    ],
  };

  return new NextResponse(JSON.stringify(doc, null, 2), {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
