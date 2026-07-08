// Shimmer skeleton shown in the <article> area while an object is being fetched.
// Mirrors the layout of ObjectView so the real content replaces it without a jump.
// Purely decorative (aria-hidden); the submit button's loading label is the readable status.

// Value-column widths per row (fixed, not random) to vary the placeholder rhythm.
const ROWS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-5/6', 'w-1/2'];

export function ObjectSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <header className="space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-7 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
      </header>

      <dl className="divide-y divide-nde-line rounded-2xl border border-nde-line bg-white">
        {ROWS.map((w, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4"
          >
            <div className="skeleton h-4 w-28" />
            <div className={`skeleton h-4 ${w}`} />
          </div>
        ))}
      </dl>
    </div>
  );
}
