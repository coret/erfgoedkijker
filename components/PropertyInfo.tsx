'use client';

import { useEffect, useRef, useState } from 'react';

/** Small (i) button that reveals a field explanation in a popover (click to toggle). */
export function PropertyInfo({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative ml-1.5 inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Uitleg over dit veld"
        aria-expanded={open}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-nde-line text-[10px] font-semibold italic leading-none text-nde-muted transition hover:border-nde-blue hover:text-nde-blue"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-6 z-10 w-64 rounded-xl border border-nde-line bg-white p-3 text-xs font-normal normal-case leading-relaxed text-nde-ink shadow-card"
        >
          {text}
        </span>
      )}
    </span>
  );
}
