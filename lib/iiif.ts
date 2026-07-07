// Minimal IIIF helper: fetch a Presentation manifest server-side and read its
// declared license. We do the fetch server-side (no CORS, no proxy needed).

/** First non-empty string from a value that may be a string or an array of strings. */
function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    for (const v of value) if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

/** The license/rights URI declared on a manifest or canvas node (v3 `rights`, v2 `license`). */
function licenseOf(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null;
  const n = node as Record<string, unknown>;
  return firstString(n.rights) ?? firstString(n.license);
}

/**
 * Fetch a IIIF Presentation manifest and return its declared license URI:
 * top-level `rights` (v3) / `license` (v2), falling back to the first canvas.
 * Returns null on any fetch/parse failure or when no license is declared.
 */
export async function fetchManifestLicense(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/ld+json, application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const manifest = (await res.json()) as Record<string, unknown>;
    const top = licenseOf(manifest);
    if (top) return top;
    const canvases = manifest.items;
    if (Array.isArray(canvases) && canvases.length) return licenseOf(canvases[0]);
    return null;
  } catch {
    return null;
  }
}
