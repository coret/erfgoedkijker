import type { Diagnostics as Diag } from '@/lib/types';

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

export function Diagnostics({ diag }: { diag: Diag }) {
  const linkedDataOk = diag.tripleCount > 0;
  const pid = diag.persistentId;

  return (
    <section className="rounded-2xl border border-nde-line bg-white p-5">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-nde-muted">
            Controles
          </h2>
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
        </div>
        </dl>
      </details>
    </section>
  );
}
