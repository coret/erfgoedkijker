'use client';

import { useTranslations } from 'next-intl';
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

export function Diagnostics({ diag }: { diag: Diag }) {
  const t = useTranslations('diagnostics');
  const tc = useTranslations('common');
  const linkedDataOk = diag.tripleCount > 0;
  const pid = diag.persistentId;

  /**
   * Label for the raw-Turtle disclosure. The shown Turtle is always serialized from
   * the parsed graph; when the source itself was not Turtle we say so, so it's clear
   * this is a normalized rendering rather than the original bytes.
   */
  const turtleLabel = (contentType: string | null): string => {
    const base = (contentType ?? '').split(';')[0].trim().toLowerCase();
    if (!base || base === 'text/turtle') return t('turtleRaw');
    return t('turtleRawFrom', { format: SOURCE_FORMAT_NAMES[base] ?? base });
  };

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
              {t('title')}
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
          <dt className="text-nde-ink">{t('linkedData')}</dt>
          <dd>
            <Badge ok={linkedDataOk}>{linkedDataOk ? tc('yes') : tc('no')}</Badge>
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt className="text-nde-ink">{t('recognized')}</dt>
          <dd>
            <Badge ok={diag.foundCreativeWork}>
              {diag.foundCreativeWork ? 'CreativeWork' : t('notRecognized')}
            </Badge>
          </dd>
        </div>

        {diag.schemaOrg !== null && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-nde-ink">{t('namespace')}</dt>
            <dd>
              <Badge ok={diag.schemaOrg === 'https'}>
                {diag.schemaOrg === 'https'
                  ? 'https'
                  : diag.schemaOrg === 'http'
                    ? t('namespaceHttp')
                    : t('namespaceMixed')}
              </Badge>
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <dt className="text-nde-ink">
            {pid.scheme ? t('persistentUriScheme', { scheme: pid.scheme }) : t('persistentUri')}
          </dt>
          <dd>
            {pid.scheme === null ? (
              <Badge ok={null}>{t('notPresent')}</Badge>
            ) : (
              <Badge ok={pid.ok}>{pid.ok ? t('resolves') : t('resolvesNot')}</Badge>
            )}
          </dd>
        </div>

        {diag.missingLanguageTags !== null && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-nde-ink">{t('missingLangTags')}</dt>
            <dd>
              <Badge ok={diag.missingLanguageTags === 0}>{diag.missingLanguageTags}</Badge>
            </dd>
          </div>
        )}

        {diag.licenseCheck && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-nde-ink">{t('licenseMatch')}</dt>
            <dd>
              <Badge ok={diag.licenseCheck.match}>
                {diag.licenseCheck.match ? tc('yes') : tc('no')}
              </Badge>
            </dd>
          </div>
        )}

        {diag.datasetResolves !== null && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-nde-ink">{t('datasetResolves')}</dt>
            <dd>
              <Badge ok={diag.datasetResolves}>
                {diag.datasetResolves ? tc('yes') : tc('no')}
              </Badge>
            </dd>
          </div>
        )}

        <div className="mt-3 space-y-1 border-t border-nde-line pt-3 text-xs text-nde-muted">
          {diag.detectedFormat && (
            <div>
              {t('format')}: <span className="font-mono">{diag.detectedFormat}</span>
            </div>
          )}
          {diag.tripleCount > 0 && <div>{t('triples')}: {diag.tripleCount}</div>}
          {diag.finalUrl && diag.finalUrl !== diag.inputUrl && (
            <div className="break-all">
              {t('resolvedTo')}: <span className="font-mono">{diag.finalUrl}</span>
            </div>
          )}
          {diag.licenseCheck && !diag.licenseCheck.match && (
            <>
              <div className="break-all">
                {t('mediaLicense')}: <span className="font-mono">{diag.licenseCheck.media}</span>
              </div>
              <div className="break-all">
                {t('manifestLicense')}: <span className="font-mono">{diag.licenseCheck.manifest}</span>
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
