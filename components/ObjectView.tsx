import type { ObjectView as ObjectViewModel, LangLiteral } from '@/lib/types';
import { FieldValue } from './FieldValue';
import { IiifViewer } from './IiifViewer';

function headingFor(obj: ObjectViewModel): string {
  const name = obj.fields.find((f) => f.property === 'name');
  const lits = (name?.values ?? [])
    .map((v) => (v.kind === 'literal' ? v.value : null))
    .filter((x): x is LangLiteral => x !== null);
  const pick = lits.find((l) => l.lang === 'nl') ?? lits.find((l) => l.lang === 'en') ?? lits[0];
  return pick?.value ?? obj.uri;
}

export function ObjectView({ obj }: { obj: ObjectViewModel }) {
  const heading = headingFor(obj);
  const fields = obj.fields.filter((f) => f.property !== 'name');

  return (
    <article className="space-y-5">
      <header>
        <div className="text-xs font-semibold uppercase tracking-wide text-nde-blue">
          {obj.typeLabelNl}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-nde-ink">{heading}</h1>
        <a
          href={obj.uri}
          target="_blank"
          rel="noreferrer"
          className="break-all text-xs text-nde-muted hover:text-nde-blue hover:underline"
        >
          {obj.uri}
        </a>
      </header>

      {obj.iiifManifestUrl && (
        <div className="overflow-hidden rounded-2xl border border-nde-line bg-white">
          <div className="h-[460px]">
            <IiifViewer manifestUrl={obj.iiifManifestUrl} />
          </div>
        </div>
      )}

      <dl className="divide-y divide-nde-line rounded-2xl border border-nde-line bg-white">
        {fields.map((f) => (
          <div key={f.property} className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
            <dt className="text-sm font-medium text-nde-muted">{f.labelNl}</dt>
            <dd className="space-y-2 text-sm text-nde-ink">
              {f.values.map((v, i) => (
                <div key={i}>
                  <FieldValue value={v} />
                </div>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
