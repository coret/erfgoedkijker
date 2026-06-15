'use client';

import { useState } from 'react';
import type { ValueNode, LangLiteral, DefinedTermValue } from '@/lib/types';
import { TermPanel } from './TermPanel';

function LangBadge({ lang }: { lang?: string }) {
  if (!lang) return null;
  return (
    <span className="ml-1.5 rounded bg-nde-blue-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-nde-blue">
      {lang}
    </span>
  );
}

function pickLiteral(lits: LangLiteral[]): LangLiteral | undefined {
  return (
    lits.find((l) => l.lang === 'nl') ??
    lits.find((l) => l.lang === 'en') ??
    lits[0]
  );
}

function TermValue({ term }: { term: DefinedTermValue }) {
  const [open, setOpen] = useState(false);
  const label = pickLiteral(term.name);
  const text = label?.value ?? term.sameAs ?? 'term';

  if (!term.sameAs) {
    return (
      <span>
        {text}
        <LangBadge lang={label?.lang} />
      </span>
    );
  }
  return (
    <span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-left font-medium text-nde-blue underline decoration-dotted underline-offset-2 hover:decoration-solid"
        aria-expanded={open}
      >
        {text}
      </button>
      <LangBadge lang={label?.lang} />
      {open && <TermPanel uri={term.sameAs} onClose={() => setOpen(false)} />}
    </span>
  );
}

export function FieldValue({ value }: { value: ValueNode }) {
  switch (value.kind) {
    case 'literal':
      return (
        <span className="whitespace-pre-wrap">
          {value.value.value}
          <LangBadge lang={value.value.lang} />
        </span>
      );
    case 'date':
      return <span>{value.value}</span>;
    case 'iri':
      return (
        <a
          href={value.value}
          target="_blank"
          rel="noreferrer"
          className="break-all text-nde-blue hover:underline"
        >
          {value.value}
        </a>
      );
    case 'term':
      return <TermValue term={value.term} />;
    case 'geo':
      return (
        <a
          href={`https://www.openstreetmap.org/?mlat=${value.lat}&mlon=${value.long}#map=13/${value.lat}/${value.long}`}
          target="_blank"
          rel="noreferrer"
          className="text-nde-blue hover:underline"
        >
          {value.lat.toFixed(5)}, {value.long.toFixed(5)} ↗
        </a>
      );
    case 'media':
      return (
        <div className="space-y-1">
          {(value.media.thumbnailUrl || value.media.contentUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.media.thumbnailUrl || value.media.contentUrl}
              alt=""
              className="max-h-48 rounded-lg border border-nde-line"
            />
          )}
          <div className="space-x-3 text-xs text-nde-muted">
            {value.media.contentUrl && (
              <a href={value.media.contentUrl} target="_blank" rel="noreferrer" className="text-nde-blue hover:underline">
                Bestand ↗
              </a>
            )}
            {value.media.license && (
              <a href={value.media.license} target="_blank" rel="noreferrer" className="text-nde-blue hover:underline">
                Licentie ↗
              </a>
            )}
          </div>
        </div>
      );
    case 'iiif':
      return (
        <span className="text-sm text-nde-muted">
          IIIF-manifest aanwezig — zie de viewer hierboven.{' '}
          <a href={value.manifestUrl} target="_blank" rel="noreferrer" className="text-nde-blue hover:underline">
            manifest ↗
          </a>
        </span>
      );
    case 'resource':
      return (
        <div className="rounded-xl border border-nde-line bg-nde-bg/60 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-nde-muted">
            {value.resource.typeLabelNl}
          </div>
          <dl className="space-y-1.5">
            {value.resource.fields.map((f) => (
              <div key={f.property} className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
                <dt className="text-nde-muted">{f.labelNl}</dt>
                <dd className="space-y-1">
                  {f.values.map((v, i) => (
                    <div key={i}>
                      <FieldValue value={v} />
                    </div>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          {value.resource.uri && (
            <a
              href={value.resource.uri}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block break-all text-xs text-nde-muted hover:text-nde-blue hover:underline"
            >
              {value.resource.uri}
            </a>
          )}
        </div>
      );
    default:
      return null;
  }
}
