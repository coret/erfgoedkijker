'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ApiErrorCode, ObjectResponse } from '@/lib/types';
import { EXAMPLES } from '@/lib/examples';
import { ObjectView } from '@/components/ObjectView';
import { ObjectSkeleton } from '@/components/ObjectSkeleton';
import { Diagnostics } from '@/components/Diagnostics';
import { Guidance } from '@/components/Guidance';

/** Error *codes*, never prose: translated at render, so a language switch is never stale. */
type ErrorCode = ApiErrorCode | 'NETWORK' | 'UNKNOWN';

const API_ERROR_CODES = new Set<string>(['INVALID_URL', 'NO_URIS', 'TERM_LOOKUP_FAILED']);

export default function Page() {
  const t = useTranslations('page');
  const te = useTranslations('errors');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ObjectResponse | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);

  const lookup = useCallback(async (target: string) => {
    let value = target.trim();
    if (!value) return;
    // Relative example paths (self-hosted demo object) → absolute on this host.
    if (value.startsWith('/') && typeof window !== 'undefined') {
      value = window.location.origin + value;
    }
    setUrl(value);
    setLoading(true);
    setError(null);
    setData(null);
    // Reflect the lookup in the URL bar so results are shareable / deep-linkable.
    if (typeof window !== 'undefined') {
      const u = new URL(window.location.href);
      u.searchParams.set('url', value);
      window.history.replaceState(null, '', u.toString());
    }
    try {
      const res = await fetch('/api/object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      });
      const json = await res.json();
      if (!res.ok && !json.diagnostics) {
        setError(API_ERROR_CODES.has(json.error) ? (json.error as ApiErrorCode) : 'UNKNOWN');
        return;
      }
      setData(json as ObjectResponse);
    } catch {
      setError('NETWORK');
    } finally {
      setLoading(false);
    }
  }, []);

  // Deep-link support: ?url=<permalink> auto-runs the lookup on load.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('url');
    if (param) lookup(param);
  }, [lookup]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-nde-muted [text-wrap:balance]">
          {t.rich('intro', { b: (chunks) => <strong>{chunks}</strong> })}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(url);
          }}
          className="flex flex-col gap-2 py-3 sm:flex-row"
        >
          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full rounded-xl border border-nde-line bg-white px-4 py-3 text-nde-ink shadow-sm outline-none focus:border-nde-blue focus:ring-2 focus:ring-nde-blue/20"
            aria-label={t('inputAria')}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="shrink-0 rounded-xl bg-nde-blue px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-nde-blue-dark disabled:opacity-50"
          >
            {loading ? t('submitLoading') : t('submit')}
          </button>
        </form>

        {EXAMPLES.length > 0 && <ExampleChips onPick={lookup} />}
      </section>

      {error && (
        <div className="rounded-2xl border border-nde-orange/30 bg-nde-orange/5 p-4 text-sm text-nde-orange-dark">
          {te(error)}
        </div>
      )}

      {loading && <ObjectSkeleton />}

      {data && (
        <Results data={data} />
      )}
    </div>
  );
}

function ExampleChips({ onPick }: { onPick: (url: string) => void }) {
  const t = useTranslations('page');
  const locale = useLocale();
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-nde-muted">{t('examples')}</span>
      {EXAMPLES.map((ex) => (
        <button
          key={ex.url}
          type="button"
          onClick={() => onPick(ex.url)}
          title={ex.note ?? ex.url}
          className="rounded-full border border-nde-line bg-white px-3 py-1 text-nde-blue transition hover:border-nde-blue hover:bg-nde-blue-soft"
        >
          {ex.label[locale]}
        </button>
      ))}
    </div>
  );
}

function Results({ data }: { data: ObjectResponse }) {
  return (
    <div className="space-y-6">
      <div className="space-y-5">
        {data.fatal ? (
          <Guidance code={data.fatal} />
        ) : data.object ? (
          <ObjectView obj={data.object} />
        ) : null}

        {/* Inline, non-fatal notices */}
        {data.notices.map((code) => (
          <Guidance key={code} code={code} />
        ))}
      </div>

      {/* Controles full-width at the bottom, before the footer */}
      <section className="space-y-4">
        <Diagnostics diag={data.diagnostics} />
      </section>
    </div>
  );
}
