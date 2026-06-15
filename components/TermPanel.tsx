'use client';

import { useEffect, useState } from 'react';

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

export function TermPanel({ uri, onClose }: { uri: string; onClose: () => void }) {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error'; message: string } | { status: 'done'; lookups: TermLookup[] }
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
          setState({ status: 'error', message: data?.error ?? 'Opzoeken mislukt.' });
          return;
        }
        setState({ status: 'done', lookups: data.lookups ?? [] });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', message: (e as Error).message });
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
          Termennetwerk
        </span>
        <button type="button" onClick={onClose} className="text-xs text-nde-muted hover:text-nde-blue">
          verbergen ✕
        </button>
      </div>

      {state.status === 'loading' && <p className="text-nde-muted">Bezig met opzoeken…</p>}
      {state.status === 'error' && <p className="text-nde-orange-dark">{state.message}</p>}
      {state.status === 'done' && hits.length === 0 && (
        <p className="text-nde-muted">
          Geen informatie gevonden in het Termennetwerk voor deze URI.
        </p>
      )}

      {hits.map((l, i) => (
        <div key={i} className="border-t border-nde-blue/10 py-2 first:border-t-0 first:pt-0">
          <div className="font-semibold text-nde-ink">
            {l.result?.prefLabel?.[0] ?? l.uri}
          </div>
          {l.source && <div className="text-xs text-nde-muted">Bron: {l.source.name}</div>}
          {l.result?.altLabel?.length ? (
            <div className="mt-1 text-xs text-nde-muted">
              Ook bekend als: {l.result.altLabel.slice(0, 6).join(', ')}
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
