// NDE Network of Terms — look up terms by URI.
// https://docs.nde.nl/services/network-of-terms/graphql#look-up-terms-by-uri

const ENDPOINT = 'https://termennetwerk-api.netwerkdigitaalerfgoed.nl/graphql';

const LOOKUP_QUERY = `
query Lookup($uris: [ID!]!) {
  lookup(uris: $uris) {
    uri
    source {
      __typename
      ... on Source { uri name }
    }
    result {
      __typename
      ... on Term {
        uri
        prefLabel
        altLabel
        hiddenLabel
        definition
        scopeNote
        seeAlso
      }
      ... on NotFoundError { message }
      ... on ServerError { message }
      ... on TimeoutError { message }
    }
    responseTimeMs
  }
}`.trim();

export type TermResult = {
  uri: string;
  prefLabel?: string[];
  altLabel?: string[];
  definition?: string[];
  scopeNote?: string[];
  seeAlso?: string[];
};

export type TermLookup = {
  uri: string;
  source?: { uri: string; name: string };
  result?: TermResult | null;
  error?: string;
};

export async function lookupTerms(uris: string[]): Promise<TermLookup[]> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'NDE-ErfgoedKijker/0.1 (prototype)',
    },
    body: JSON.stringify({ query: LOOKUP_QUERY, variables: { uris } }),
    // The Termennetwerk can be slow for some sources.
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Termennetwerk gaf status ${res.status}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(
      Array.isArray(json.errors)
        ? json.errors.map((e: { message?: string }) => e.message).join('; ')
        : 'GraphQL-fout',
    );
  }

  const lookups = (json.data?.lookup ?? []) as Array<{
    uri: string;
    source?: { uri: string; name: string };
    result?: (TermResult & { __typename?: string; message?: string }) | null;
    responseTimeMs?: number;
  }>;

  return lookups.map((l) => {
    const r = l.result;
    const isTerm = r && r.__typename === 'Term';
    return {
      uri: l.uri,
      source: l.source,
      result: isTerm ? (r as TermResult) : null,
      error: r && !isTerm ? r.message ?? r.__typename : undefined,
    };
  });
}
