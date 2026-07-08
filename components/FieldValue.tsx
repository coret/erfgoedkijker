'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ValueNode, DefinedTermValue, DatasetInfo, MediaValue } from '@/lib/types';
import { classLabel, propertyLabel } from '@/lib/schema-ap-nde';
import { pickLiteral, selectValues } from '@/lib/i18n';
import { TermPanel } from './TermPanel';

function LangBadge({ lang }: { lang?: string }) {
  if (!lang) return null;
  return (
    <span className="ml-1.5 rounded bg-nde-blue-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-nde-blue">
      {lang}
    </span>
  );
}

/** Green badge for a term's extra schema.org type (e.g. Person, Organization). */
function TypeBadge({ type }: { type: string }) {
  return (
    <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-800">
      {type}
    </span>
  );
}

function TermValue({ term }: { term: DefinedTermValue }) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations('field');
  const label = pickLiteral(term.name, locale);
  const text = label?.value ?? term.sameAs ?? t('termFallback');

  if (!term.sameAs) {
    return (
      <span>
        {text}
        <LangBadge lang={label?.lang} />
        {term.types?.map((ty) => <TypeBadge key={ty} type={ty} />)}
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
      {term.types?.map((ty) => <TypeBadge key={ty} type={ty} />)}
      {open && <TermPanel uri={term.sameAs} onClose={() => setOpen(false)} />}
    </span>
  );
}

function DatasetValue({ dataset }: { dataset: DatasetInfo }) {
  const locale = useLocale();
  const t = useTranslations('field');
  const title = dataset.name ? pickLiteral(dataset.name, locale) : undefined;
  const description = dataset.description ? pickLiteral(dataset.description, locale) : undefined;
  const publisher = dataset.publisher ? pickLiteral(dataset.publisher, locale) : undefined;

  return (
    <div className="rounded-xl border border-nde-line bg-nde-bg/60 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-nde-muted">
        {t('dataset')}
      </div>
      {title && (
        <div className="font-semibold text-nde-ink">
          {title.value}
          <LangBadge lang={title.lang} />
        </div>
      )}
      {description && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-nde-ink">
          {description.value}
          <LangBadge lang={description.lang} />
        </p>
      )}
      {publisher && (
        <div className="mt-1 text-sm text-nde-muted">
          {t('publisher')} <span className="text-nde-ink">{publisher.value}</span>
        </div>
      )}
      {!dataset.resolved && (
        <p className="mt-1 text-xs text-nde-orange-dark">{t('datasetNoLinkedData')}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <a
          href={dataset.uri}
          target="_blank"
          rel="noreferrer"
          className="break-all text-nde-muted hover:text-nde-blue hover:underline"
        >
          {dataset.uri}
        </a>
        <a
          href={dataset.registerUrl}
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-nde-blue hover:underline"
        >
          {t('datasetRegister')}
        </a>
      </div>
    </div>
  );
}

function MediaObjectValue({ media }: { media: MediaValue }) {
  const locale = useLocale();
  const t = useTranslations('field');
  // copyrightNotice is single-cardinality prose, so several values are translations:
  // pick one, rather than stacking them.
  const copyright = media.copyrightNotice ? pickLiteral(media.copyrightNotice, locale) : undefined;

  return (
    <div className="space-y-1">
      {(media.thumbnailUrl || media.contentUrl) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.thumbnailUrl || media.contentUrl}
          alt=""
          className="max-h-48 rounded-lg border border-nde-line"
        />
      )}
      <div className="space-x-3 text-xs text-nde-muted">
        {media.contentUrl && (
          <a href={media.contentUrl} target="_blank" rel="noreferrer" className="text-nde-blue hover:underline">
            {t('file')}
          </a>
        )}
        {media.license && (
          <a href={media.license} target="_blank" rel="noreferrer" className="text-nde-blue hover:underline">
            {t('license')}
          </a>
        )}
      </div>
      {copyright && (
        <p className="text-xs text-nde-muted">
          © {copyright.value}
          <LangBadge lang={copyright.lang} />
        </p>
      )}
    </div>
  );
}

function ResourceValue({ resource }: { resource: Extract<ValueNode, { kind: 'resource' }>['resource'] }) {
  const locale = useLocale();
  return (
    <div className="rounded-xl border border-nde-line bg-nde-bg/60 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-nde-muted">
        {classLabel(resource.type, locale)}
      </div>
      <dl className="space-y-1.5">
        {resource.fields.map((f) => (
          <div key={f.property} className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
            <dt className="text-nde-muted">{propertyLabel(resource.type, f.property, locale)}</dt>
            <dd className="space-y-1">
              {selectValues(f.values, locale, f.property).map((v, i) => (
                <div key={i}>
                  <FieldValue value={v} />
                </div>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      {resource.uri && (
        <a
          href={resource.uri}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block break-all text-xs text-nde-muted hover:text-nde-blue hover:underline"
        >
          {resource.uri}
        </a>
      )}
    </div>
  );
}

function IiifValue({ manifestUrl }: { manifestUrl: string }) {
  const t = useTranslations('field');
  return (
    <span className="text-sm text-nde-muted">
      {t('iiifNote')}{' '}
      <a href={manifestUrl} target="_blank" rel="noreferrer" className="text-nde-blue hover:underline">
        {t('manifestLink')}
      </a>
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
    case 'dataset':
      return <DatasetValue dataset={value.dataset} />;
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
      return <MediaObjectValue media={value.media} />;
    case 'iiif':
      return <IiifValue manifestUrl={value.manifestUrl} />;
    case 'resource':
      return <ResourceValue resource={value.resource} />;
    default:
      return null;
  }
}
