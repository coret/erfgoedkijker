import { getGuidance } from '@/lib/guidance';
import type { GuidanceCode } from '@/lib/types';

export function Guidance({ code }: { code: GuidanceCode }) {
  const g = getGuidance(code);
  const error = g.tone === 'error';
  return (
    <div
      className={
        'rounded-2xl border p-5 ' +
        (error
          ? 'border-nde-orange/30 bg-nde-orange/5'
          : 'border-nde-line bg-white')
      }
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ' +
            (error ? 'bg-nde-orange' : 'bg-nde-blue')
          }
        >
          {error ? '!' : 'i'}
        </span>
        <div className="space-y-2">
          <h3 className="font-semibold text-nde-ink">{g.title}</h3>
          <p className="text-sm text-nde-muted">{g.body}</p>
          <p className="text-sm text-nde-ink">
            <span className="font-medium">Suggestie: </span>
            {g.suggestion}
          </p>
          <a
            href={g.docHref}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm font-medium text-nde-blue hover:underline"
          >
            {g.docLabel} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
