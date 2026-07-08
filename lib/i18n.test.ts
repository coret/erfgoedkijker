// Run with: npm test   (node:test + type stripping; no test-framework dependency)
//
// `pickLiteral` and `selectValues` are the only pure functions in the i18n layer with
// real branching *and* a data-loss failure mode: a wrong rule here silently hides
// published metadata. Everything else (JSX, cookies, hydration) is cheaper to check by
// hand in the browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
// Explicit .ts extensions: Node's type stripping loads this file as ESM, which requires
// them. `allowImportingTsExtensions` in tsconfig.json keeps tsc happy (safe under noEmit).
import { pickLiteral, selectValues, primarySubtag } from './i18n.ts';
import type { LangLiteral, ValueNode } from './types.ts';

const lit = (value: string, lang?: string): ValueNode => ({ kind: 'literal', value: { value, lang } });
const term = (name: string): ValueNode => ({ kind: 'term', term: { name: [{ value: name }] } });
const media = (contentUrl: string): ValueNode => ({ kind: 'media', media: { contentUrl } });
const iiif = (manifestUrl: string): ValueNode => ({ kind: 'iiif', manifestUrl });

/** The literal values that survive, in order. */
const survivors = (nodes: ValueNode[]) =>
  nodes.filter((n) => n.kind === 'literal').map((n) => n.value.value);

test('primarySubtag', () => {
  assert.equal(primarySubtag('nl'), 'nl');
  assert.equal(primarySubtag('nl-NL'), 'nl');
  assert.equal(primarySubtag('EN-gb'), 'en');
  assert.equal(primarySubtag(undefined), undefined);
});

test('pickLiteral: exact locale, else untagged, else first', () => {
  const lits: LangLiteral[] = [
    { value: 'Titel', lang: 'nl' },
    { value: 'Title', lang: 'en' },
    { value: 'Neutraal' },
  ];
  assert.equal(pickLiteral(lits, 'nl')?.value, 'Titel');
  assert.equal(pickLiteral(lits, 'en')?.value, 'Title');

  // No match for the interface language → the untagged value, not the other language.
  assert.equal(pickLiteral([{ value: 'Titel', lang: 'nl' }, { value: 'X' }], 'en')?.value, 'X');

  // Nothing untagged either → show what exists rather than nothing.
  assert.equal(pickLiteral([{ value: 'Titre', lang: 'fr' }], 'nl')?.value, 'Titre');

  // Region subtags match on the primary subtag.
  assert.equal(pickLiteral([{ value: 'A', lang: 'en-GB' }, { value: 'B', lang: 'nl-NL' }], 'nl')?.value, 'B');

  assert.equal(pickLiteral([], 'nl'), undefined);
});

test('selectValues: collapses translations of a translatable property', () => {
  const both = [lit('Beschrijving', 'nl'), lit('Description', 'en')];
  assert.deepEqual(survivors(selectValues(both, 'en', 'description')), ['Description']);
  assert.deepEqual(survivors(selectValues(both, 'nl', 'description')), ['Beschrijving']);
});

test('selectValues: locale wins over untagged', () => {
  const vals = [lit('NL', 'nl'), lit('EN', 'en'), lit('Untagged')];
  assert.deepEqual(survivors(selectValues(vals, 'nl', 'description')), ['NL']);
  assert.deepEqual(survivors(selectValues(vals, 'en', 'description')), ['EN']);
});

test('selectValues: untagged is the fallback before another language', () => {
  const vals = [lit('EN', 'en'), lit('Untagged')];
  assert.deepEqual(survivors(selectValues(vals, 'nl', 'description')), ['Untagged']);
});

test('selectValues: neither locale nor untagged → show everything', () => {
  const vals = [lit('Français', 'fr'), lit('Deutsch', 'de')];
  assert.deepEqual(survivors(selectValues(vals, 'nl', 'description')), ['Français', 'Deutsch']);
});

test('selectValues: matches on the primary subtag', () => {
  const vals = [lit('NL', 'nl-NL'), lit('EN', 'en-GB')];
  assert.deepEqual(survivors(selectValues(vals, 'nl', 'description')), ['NL']);
});

test('selectValues: a lone off-language literal is never dropped', () => {
  const vals = [lit('Only English', 'en')];
  assert.deepEqual(survivors(selectValues(vals, 'nl', 'description')), ['Only English']);
});

test('selectValues: property gate — distinct subjects are never collapsed', () => {
  // The whole reason for TRANSLATABLE_PROPERTIES. These are two subjects, not one
  // subject in two languages, so both must survive in either interface language.
  const about = [lit('Amsterdam', 'nl'), lit('Second World War', 'en')];
  assert.deepEqual(survivors(selectValues(about, 'nl', 'about')), ['Amsterdam', 'Second World War']);
  assert.deepEqual(survivors(selectValues(about, 'en', 'about')), ['Amsterdam', 'Second World War']);

  const material = [lit('eikenhout', 'nl'), lit('papier', 'nl')];
  assert.deepEqual(survivors(selectValues(material, 'nl', 'material')), ['eikenhout', 'papier']);

  const identifier = [lit('inv-1'), lit('inv-2')];
  assert.deepEqual(survivors(selectValues(identifier, 'en', 'identifier')), ['inv-1', 'inv-2']);
});

test('selectValues: two same-language paragraphs both survive (filter, not pick)', () => {
  const vals = [lit('Alinea 1', 'nl'), lit('Alinea 2', 'nl')];
  assert.deepEqual(survivors(selectValues(vals, 'nl', 'description')), ['Alinea 1', 'Alinea 2']);
});

test('selectValues: non-literal nodes are untouched and keep their order', () => {
  const vals = [media('a.jpg'), media('b.jpg'), iiif('m.json')];
  assert.deepEqual(selectValues(vals, 'nl', 'associatedMedia'), vals);

  const terms = [term('Amsterdam'), term('Oorlog'), term('Foto')];
  assert.deepEqual(selectValues(terms, 'en', 'about'), terms);
});

test('selectValues: mixed literals and non-literals keep relative order', () => {
  // `name` is translatable, so the literals collapse — but the term node stays put.
  const vals = [lit('NL', 'nl'), term('Een term'), lit('EN', 'en')];
  const out = selectValues(vals, 'en', 'name');
  assert.equal(out.length, 2);
  assert.equal(out[0].kind, 'term');
  assert.equal(out[1].kind, 'literal');
  assert.deepEqual(survivors(out), ['EN']);
});

test('selectValues: copyrightNotice is translatable', () => {
  const vals = [lit('© Museum', 'nl'), lit('© Museum (EN)', 'en')];
  assert.deepEqual(survivors(selectValues(vals, 'en', 'copyrightNotice')), ['© Museum (EN)']);
});
