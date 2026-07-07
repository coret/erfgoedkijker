import { Fragment } from 'react';

// Lightweight, dependency-free Turtle syntax highlighter. The Turtle is already
// pretty-printed server-side by n3's Writer; here we only tokenize and colorize it.
// Rendered as React elements (no dangerouslySetInnerHTML) so the text is auto-escaped.

type TokenType =
  | 'comment'
  | 'iri'
  | 'string'
  | 'lang'
  | 'directive'
  | 'number'
  | 'keyword'
  | 'pname'
  | 'punct';

const CLASS: Record<TokenType, string> = {
  comment: 'text-nde-muted italic',
  iri: 'text-nde-blue',
  string: 'text-nde-orange-dark',
  lang: 'text-purple-600',
  directive: 'text-purple-600 font-semibold',
  number: 'text-sky-700',
  keyword: 'text-purple-600 font-semibold',
  pname: 'text-emerald-700',
  punct: 'text-nde-muted',
};

// Alternatives are tried left-to-right; order matters where patterns overlap
// (e.g. @prefix before a language tag, strings before anything else).
const TOKEN = new RegExp(
  [
    '(?<comment>#[^\\n]*)',
    '(?<string>"""[\\s\\S]*?"""|"(?:\\\\.|[^"\\\\])*")',
    '(?<iri><[^>\\s]*>)',
    '(?<directive>@(?:prefix|base)\\b)',
    '(?<lang>@[A-Za-z][A-Za-z0-9-]*)',
    '(?<number>[+-]?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b|\\b(?:true|false)\\b)',
    '(?<keyword>\\ba\\b)',
    '(?<pname>[A-Za-z_][\\w-]*:[\\w-]*)',
    '(?<punct>[;,.()\\[\\]^]+)',
  ].join('|'),
  'g',
);

function tokenType(groups: Record<string, string | undefined> | undefined): TokenType | null {
  if (!groups) return null;
  for (const t of Object.keys(CLASS) as TokenType[]) {
    if (groups[t] !== undefined) return t;
  }
  return null;
}

export function TurtleView({ turtle }: { turtle: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of turtle.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(<Fragment key={i++}>{turtle.slice(last, start)}</Fragment>);
    const type = tokenType(m.groups);
    if (type) {
      parts.push(
        <span key={i++} className={CLASS[type]}>
          {m[0]}
        </span>,
      );
    } else {
      parts.push(<Fragment key={i++}>{m[0]}</Fragment>);
    }
    last = start + m[0].length;
  }
  if (last < turtle.length) parts.push(<Fragment key={i++}>{turtle.slice(last)}</Fragment>);

  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-nde-ink">
      {parts}
    </pre>
  );
}
