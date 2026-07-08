// Interface-language plumbing and the rules for choosing which language-tagged
// metadata value to display. Deliberately React-free and framework-free: this module is
// imported by `lib/schema-ap-nde.ts`, which in turn is imported by the server-only
// `lib/rdf.ts`. A value imported from a `'use client'` module into a Server Component
// becomes a client-reference proxy and throws when called, so nothing here may touch
// React or `next-intl`'s client entry point.

import type { LangLiteral, ValueNode } from './types';

export type Locale = 'nl' | 'en';

export const LOCALES = ['nl', 'en'] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = 'nl';

/** Cookie the language switch writes and `i18n/request.ts` reads. */
export const LOCALE_COOKIE = 'locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === 'nl' || value === 'en';
}

/** The other interface language. Used as Tify's fallback for IIIF manifest strings. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'nl' ? 'en' : 'nl';
}

/** Cookie value → Locale, falling back to Dutch. */
export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Primary subtag of a BCP-47 language tag, lowercased: "nl-NL" → "nl".
 * `undefined` for an untagged literal — `lib/rdf.ts` normalizes `''` to `undefined`.
 */
export function primarySubtag(lang: string | undefined): string | undefined {
  return lang ? lang.split('-')[0].toLowerCase() : undefined;
}

/**
 * Best single literal to display: the interface language, else an untagged value, else
 * whatever exists. Never returns `undefined` for a non-empty list, so a value published
 * only in a language the user cannot read is still shown (with its LangBadge) rather
 * than hidden.
 */
export function pickLiteral(
  literals: LangLiteral[],
  locale: Locale,
): LangLiteral | undefined {
  return (
    literals.find((l) => primarySubtag(l.lang) === locale) ??
    literals.find((l) => !l.lang) ??
    literals[0]
  );
}

/**
 * The SCHEMA-AP-NDE properties that must be an `rdf:langString`: the single-cardinality
 * prose fields whose several literal values are translations of one another rather than
 * distinct values. `lib/rdf.ts` imports this for its missing-language-tag check, so this
 * set is the single source of truth for "this text should carry a language tag".
 *
 * https://docs.nde.nl/schema-profile/
 */
export const TRANSLATABLE_PROPERTIES: ReadonlySet<string> = new Set([
  'name',
  'description',
  'abstract',
  'text',
  'copyrightNotice',
]);

type LiteralNode = Extract<ValueNode, { kind: 'literal' }>;

/**
 * Collapse translation-siblings within one field's value list.
 *
 * A `description` published in both `@nl` and `@en` arrives as two separate literal
 * nodes that mean the same thing; rendering both stacks a Dutch and an English paragraph.
 * But `about`, `material` and `identifier` legitimately carry several *distinct* values,
 * which must never be collapsed — `about: ["Amsterdam"@nl, "Second World War"@en]` is two
 * subjects, not one subject in two languages. Structure alone cannot tell these apart, so
 * we gate on the property: only TRANSLATABLE_PROPERTIES are collapsed.
 *
 * This filters, it does not pick: two `@nl` paragraphs both survive. Non-literal nodes
 * (term / resource / media / dataset / geo / iri / date / iiif) are never touched and keep
 * their original relative order.
 */
export function selectValues(
  values: ValueNode[],
  locale: Locale,
  property: string,
): ValueNode[] {
  if (!TRANSLATABLE_PROPERTIES.has(property)) return values;

  const literals = values.flatMap((v, i) => (v.kind === 'literal' ? [i] : []));
  // With at most one literal there is nothing that could be a translation of anything.
  if (literals.length < 2) return values;

  const langAt = (i: number) => primarySubtag((values[i] as LiteralNode).value.lang);

  let keep = literals.filter((i) => langAt(i) === locale);
  if (!keep.length) keep = literals.filter((i) => langAt(i) === undefined);
  // Neither the interface language nor an untagged value: show them all, each badged.
  if (!keep.length) return values;

  const keepSet = new Set(keep);
  return values.filter((v, i) => v.kind !== 'literal' || keepSet.has(i));
}
