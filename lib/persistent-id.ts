import type { PersistentId } from './types';

// Detect a persistent-identifier scheme in a URL and (optionally) report whether
// it resolves. See https://docs.nde.nl/requirements-collection-management-systems/

export function detectScheme(url: string): PersistentId['scheme'] {
  const u = url.toLowerCase();
  if (u.includes('ark:/') || u.includes('/ark:')) return 'ARK';
  if (u.includes('hdl.handle.net') || u.includes('://handle.net')) return 'Handle';
  if (u.includes('doi.org/10.') || /\/10\.\d{4,9}\//.test(u)) return 'DOI';
  if (u.includes('urn:nbn:')) return 'URN:NBN';
  return null;
}

/**
 * Build the PersistentId diagnostic for an input URL given the final resolved URL
 * after redirects. `resolved` differing from input (and a 2xx final status) means
 * the persistent identifier resolved successfully.
 */
export function buildPersistentId(
  inputUrl: string,
  finalUrl: string | null,
  httpOk: boolean,
): PersistentId {
  const scheme = detectScheme(inputUrl);
  if (scheme === null) {
    return { scheme: null, ok: null };
  }
  return {
    scheme,
    input: inputUrl,
    resolved: finalUrl ?? undefined,
    ok: httpOk,
  };
}
