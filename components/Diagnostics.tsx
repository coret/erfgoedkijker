import type { Diagnostics as Diag } from '@/lib/types';
import { TurtleView } from './TurtleView';

function Badge({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  const cls =
    ok === true
      ? 'bg-green-100 text-green-800'
      : ok === false
        ? 'bg-nde-orange/15 text-nde-orange-dark'
        : 'bg-nde-line text-nde-muted';
  return (
    <span className={'rounded-full px-2 py-0.5 text-xs font-semibold ' + cls}>
      {children}
    </span>
  );
}

/** Human-readable name for a source RDF media type (used in the Turtle label). */
const SOURCE_FORMAT_NAMES: Record<string, string> = {
  'application/ld+json': 'JSON-LD',
  'application/json': 'JSON-LD',
  'application/rdf+xml': 'RDF/XML',
  'application/xml': 'RDF/XML',
  'text/xml': 'RDF/XML',
  'application/n-triples': 'N-Triples',
  'application/n-quads': 'N-Quads',
  'application/trig': 'TriG',
  'text/n3': 'N3',
};

/**
 * Label for the raw-Turtle disclosure. The shown Turtle is always serialized from
 * the parsed graph; when the source itself was not Turtle we say so, so it's clear
 * this is a normalized rendering rather than the original bytes.
 */
function turtleLabel(contentType: string | null): string {
  const base = (contentType ?? '').split(';')[0].trim().toLowerCase();
  if (!base || base === 'text/turtle') return 'Rauwe linked data (Turtle)';
  return `Rauwe linked data (Turtle, bron was ${SOURCE_FORMAT_NAMES[base] ?? base})`;
}

export function Diagnostics({ diag }: { diag: Diag }) {
  const linkedDataOk = diag.tripleCount > 0;
  const pid = diag.persistentId;

  // Number of "orange" (ok===false) checks below; grey/null checks don't count.
  const orangeCount =
    (linkedDataOk ? 0 : 1) +
    (diag.foundCreativeWork ? 0 : 1) +
    (diag.schemaOrg !== null && diag.schemaOrg !== 'https' ? 1 : 0) +
    (pid.scheme !== null && pid.ok === false ? 1 : 0) +
    (diag.missingLanguageTags !== null && diag.missingLanguageTags > 0 ? 1 : 0) +
    (diag.licenseCheck && !diag.licenseCheck.match ? 1 : 0) +
    (diag.datasetResolves === false ? 1 : 0);

  return (
    <section className="rounded-2xl border border-nde-line bg-white p-5">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-nde-muted">
              Controles
            </h2>
            {orangeCount > 0 && (
              <span className="rounded-full bg-nde-orange/15 px-2 py-0.5 text-xs font-semibold text-nde-orange-dark">
                {orangeCount}
              </span>
            )}
          </div>
          <span className="text-nde-muted transition-transform group-open:rotate-90">
            ▸
          </span>
        </summary>
        <dl className="mt-3 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-nde-ink">Beschikbaar als linked data</dt>
          <dd>
            <Badge ok={linkedDataOk}>{linkedDataOk ? 'Ja' : 'Nee'}</Badge>
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt className="text-nde-ink">Herkend als SCHEMA-AP-NDE-object</dt>
          <dd>
            <Badge ok={diag.foundCreativeWork}>
              {diag.foundCreativeWork ? 'CreativeWork' : 'Niet herkend'}
            </Badge>
          </dd>
        </div>

        {diag.schemaOrg !== null && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-nde-ink">schema.org-namespace</dt>
            <dd>
              <Badge ok={diag.schemaOrg === 'https'}>
                {diag.schemaOrg === 'https'
                  ? 'https'
                  : diag.schemaOrg === 'http'
                    ? 'http (afgeraden)'
                    : 'http + https'}
              </Badge>
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <dt className="text-nde-ink">
            Persistente URI{pid.scheme ? ` (${pid.scheme})` : ''}
          </dt>
          <dd>
            {pid.scheme === null ? (
              <Badge ok={null}>Niet aangetroffen</Badge>
            ) : (
              <Badge ok={pid.ok}>{pid.ok ? 'Resolvet' : 'Resolvet niet'}</Badge>
            )}
          </dd>
        </div>

        {diag.missingLanguageTags !== null && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-nde-ink">Tekstwaarden zonder taaltag</dt>
            <dd>
              <Badge ok={diag.missingLanguageTags === 0}>{diag.missingLanguageTags}</Badge>
            </dd>
          </div>
        )}

        {diag.licenseCheck && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-nde-ink">Licentie media komt overeen met manifest</dt>
            <dd>
              <Badge ok={diag.licenseCheck.match}>
                {diag.licenseCheck.match ? 'Ja' : 'Nee'}
              </Badge>
            </dd>
          </div>
        )}

        {diag.datasetResolves !== null && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-nde-ink">Dataset-URI resolvet</dt>
            <dd>
              <Badge ok={diag.datasetResolves}>
                {diag.datasetResolves ? 'Ja' : 'Nee'}
              </Badge>
            </dd>
          </div>
        )}

        <div className="mt-3 space-y-1 border-t border-nde-line pt-3 text-xs text-nde-muted">
          {diag.detectedFormat && (
            <div>
              Formaat: <span className="font-mono">{diag.detectedFormat}</span>
            </div>
          )}
          {diag.tripleCount > 0 && <div>Triples: {diag.tripleCount}</div>}
          {diag.finalUrl && diag.finalUrl !== diag.inputUrl && (
            <div className="break-all">
              Resolved naar: <span className="font-mono">{diag.finalUrl}</span>
            </div>
          )}
          {diag.licenseCheck && !diag.licenseCheck.match && (
            <>
              <div className="break-all">
                Licentie media: <span className="font-mono">{diag.licenseCheck.media}</span>
              </div>
              <div className="break-all">
                Licentie manifest: <span className="font-mono">{diag.licenseCheck.manifest}</span>
              </div>
            </>
          )}
        </div>

        {diag.turtle && (
          <details className="group/ttl mt-3 border-t border-nde-line pt-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold uppercase tracking-wide text-nde-blue [&::-webkit-details-marker]:hidden">
              <span className="transition-transform group-open/ttl:rotate-90">▸</span>
              {turtleLabel(diag.detectedFormat)}
            </summary>
            <div className="mt-2 overflow-x-auto rounded-xl border border-nde-line bg-nde-blue-soft/40 p-3">
              <TurtleView turtle={diag.turtle} />
            </div>
          </details>
        )}
        </dl>
      </details>
    </section>
  );
}
