'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ApiErrorCode } from '@/lib/types';

type TermResult = {
  uri: string;
  prefLabel?: string[];
  altLabel?: string[];
  definition?: string[];
  scopeNote?: string[];
};
type TermLookup = {
  uri: string;
  source?: { uri: string; name: string };
  result?: TermResult | null;
  error?: string;
};

/** Error *codes*, never prose: translated at render, so a language switch is never stale. */
type ErrorCode = ApiErrorCode | 'NETWORK';

export function TermPanel({ uri, onClose }: { uri: string; onClose: () => void }) {
  const t = useTranslations('term');
  const te = useTranslations('errors');
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error'; code: ErrorCode } | { status: 'done'; lookups: TermLookup[] }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/term', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: [uri] }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: 'error', code: data?.error === 'NO_URIS' ? 'NO_URIS' : 'TERM_LOOKUP_FAILED' });
          return;
        }
        setState({ status: 'done', lookups: data.lookups ?? [] });
      } catch {
        if (!cancelled) setState({ status: 'error', code: 'NETWORK' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const hits = state.status === 'done' ? state.lookups.filter((l) => l.result) : [];

  return (
    <div className="mt-2 block rounded-xl border border-nde-blue/20 bg-nde-blue-soft/50 p-3 text-sm font-normal">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-nde-blue">
          {t('title')}
        </span>
        <button type="button" onClick={onClose} className="text-xs text-nde-muted hover:text-nde-blue">
          {t('hide')}
        </button>
      </div>

      {state.status === 'loading' && <p className="text-nde-muted">{t('loading')}</p>}
      {state.status === 'error' && <p className="text-nde-orange-dark">{te(state.code)}</p>}
      {state.status === 'done' && hits.length === 0 && (
        <p className="text-nde-muted">{t('none')}</p>
      )}

      {hits.map((l, i) => (
        <div key={i} className="border-t border-nde-blue/10 py-2 first:border-t-0 first:pt-0">
          <div className="font-semibold text-nde-ink">
            {l.result?.prefLabel?.[0] ?? l.uri}
          </div>
          {l.source && <div className="text-xs text-nde-muted">{t('source')} {l.source.name}</div>}
          {l.result?.altLabel?.length ? (
            <div className="mt-1 text-xs text-nde-muted">
              {t('alsoKnownAs')} {l.result.altLabel.slice(0, 6).join(', ')}
            </div>
          ) : null}
          {l.result?.definition?.length ? (
            <p className="mt-1 text-nde-ink">{l.result.definition[0]}</p>
          ) : null}
          {l.result?.scopeNote?.length ? (
            <p className="mt-1 text-xs text-nde-muted">{l.result.scopeNote[0]}</p>
          ) : null}
          <a
            href={l.uri}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block break-all text-xs text-nde-blue hover:underline"
          >
            {l.uri} ↗
          </a>
        </div>
      ))}
    </div>
  );
}
