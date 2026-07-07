import type { ObjectView as ObjectViewModel, LangLiteral, Field } from '@/lib/types';
import { FieldValue } from './FieldValue';
import { IiifViewer } from './IiifViewer';
import { PropertyInfo } from './PropertyInfo';
import { PROFILE } from '@/lib/schema-ap-nde';

/** Orange badge for a required profile property that has no value. */
function MissingRequired() {
  return (
    <span className="rounded-full bg-nde-orange/15 px-2 py-0.5 text-xs font-semibold text-nde-orange-dark">
      Deze verplichte waarde ontbreekt
    </span>
  );
}

/** Display name (nl → en → first) of the object, or null when absent. */
function nameLiteral(obj: ObjectViewModel): string | null {
  const name = obj.fields.find((f) => f.property === 'name');
  const lits = (name?.values ?? [])
    .map((v) => (v.kind === 'literal' ? v.value : null))
    .filter((x): x is LangLiteral => x !== null);
  const pick = lits.find((l) => l.lang === 'nl') ?? lits.find((l) => l.lang === 'en') ?? lits[0];
  return pick?.value ?? null;
}

type Row = {
  property: string;
  labelNl: string;
  required: boolean;
  descriptionNl?: string;
  field?: Field;
};

/**
 * Rows to render below the heading. For a CreativeWork we show *every* profile
 * property in its defined order — including empty ones (as an empty value area,
 * or a "missing required" badge) — so the display doubles as a completeness check.
 * `name` is omitted here because it is the heading. Other top-level types keep the
 * plain "only present fields" behaviour.
 */
function rowsFor(obj: ObjectViewModel): Row[] {
  const byProp = new Map(obj.fields.map((f) => [f.property, f] as const));
  if (obj.type === 'CreativeWork') {
    return PROFILE.CreativeWork.properties
      .filter((p) => p.name !== 'name')
      .map((p) => ({
        property: p.name,
        labelNl: p.labelNl,
        required: Boolean(p.required),
        descriptionNl: p.descriptionNl,
        field: byProp.get(p.name),
      }));
  }
  return obj.fields
    .filter((f) => f.property !== 'name')
    .map((f) => ({ property: f.property, labelNl: f.labelNl, required: false, field: f }));
}

export function ObjectView({ obj }: { obj: ObjectViewModel }) {
  const heading = nameLiteral(obj);
  const rows = rowsFor(obj);

  return (
    <article className="space-y-5">
      <header className="ml-[calc(50%-50vw)] w-screen bg-nde-blue">
        <div className="mx-auto max-w-5xl px-5 py-6 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
            {obj.typeLabelNl}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {heading ?? <MissingRequired />}
          </h1>
          <a
            href={obj.uri}
            target="_blank"
            rel="noreferrer"
            className="break-all text-xs text-white/80 hover:text-white hover:underline"
          >
            {obj.uri}
          </a>
        </div>
      </header>

      {obj.iiifManifestUrl && (
        <div className="overflow-hidden rounded-2xl border border-nde-line bg-white">
          <div className="h-[460px]">
            <IiifViewer manifestUrl={obj.iiifManifestUrl} />
          </div>
        </div>
      )}

      <dl className="divide-y divide-nde-line rounded-2xl border border-nde-line bg-white">
        {rows.map((r) => (
          <div key={r.property} className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
            <dt className="flex items-start text-sm font-medium text-nde-muted sm:justify-end sm:text-right">
              {r.labelNl}
              {r.descriptionNl && <PropertyInfo text={r.descriptionNl} />}
            </dt>
            <dd className="min-h-[1.25rem] space-y-2 text-sm text-nde-ink">
              {r.field
                ? r.field.values.map((v, i) => (
                    <div key={i}>
                      <FieldValue value={v} />
                    </div>
                  ))
                : r.required
                  ? <MissingRequired />
                  : null}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
