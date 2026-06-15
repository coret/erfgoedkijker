# NDE ErfgoedKijker — prototype

## Context

De NDE wil een **ErfgoedKijker**: een webtool waarmee een applicatiebeheerder bij
een erfgoedinstelling of een datacleaner uit een NDE-datawerkplaats snel kan
controleren of een erfgoedobject correct als linked data volgens **SCHEMA-AP-NDE**
(https://docs.nde.nl/schema-profile/) wordt aangeboden, en hoe die data eruitziet.

De gebruiker plakt een **permalink** van een erfgoedobject en klikt **Bekijken**.
De tool haalt de linked data op via content-negotiation, controleert of het object
als linked data beschikbaar is (en of een ARK/Handle correct resolvet), en toont
vervolgens uitsluitend de velden die het herkent uit SCHEMA-AP-NDE — met Nederlandse
labels. `DefinedTerm`-waarden worden getoond met taal (nl/en) en, als er een
`sameAs`-URI is, als klikbare link die de term via het **NDE Termennetwerk** opzoekt.
Een `MediaObject` met IIIF-manifest wordt getoond in een **Tify** IIIF-viewer.

Doel: een werkend, modern ogend TypeScript-prototype dat op termijn in Kubernetes kan draaien.

## Beslissingen (met gebruiker afgestemd)

- **Stack:** Next.js (App Router) fullstack, TypeScript. De API routes fungeren als
  server-side proxy — noodzakelijk omdat content-negotiation tegen externe
  erfgoed-servers én de Termennetwerk-API vanuit de browser op CORS stuklopen.
- **Linked data ophalen:** **Comunica** `rdf-dereference` (server-side) — content-negotiat
  en dereferentieert elke URL naar een quad-stream, ongeacht JSON-LD / Turtle /
  N-Triples / N-Quads.
- **Voorbeeld-permalinks:** ik kies bekende publieke NDE-voorbeelden en verifieer dat ze werken.
- **Styling:** Tailwind + eigen NDE-thema (huisstijl docs.nde.nl).

## Architectuur

Eén Next.js-app. RDF wordt **server-side** opgehaald, geparsed en omgezet naar een
schoon, getypeerd **view-model** (JSON); de client is puur presentationeel (kleine
bundle, geen RDF-libs in de browser).

```
Browser (React, Tailwind)                Next.js route handlers (proxy)         Extern
──────────────────────────               ──────────────────────────────        ──────
Invoerscherm + Bekijken      ── POST ──>  /api/object                           erfgoed-permalink
  → rendert ViewModel                       rdf-dereference (Comunica)  ───────> (JSON-LD/TTL/NT/NQ)
  → diagnostiek-paneel                       N3.Store → extract ViewModel
DefinedTerm-link (sameAs)    ── POST ──>  /api/term                             termennetwerk-api
  → klap term-info open                      GraphQL lookup(uris:[…])  ───────> .../graphql
IIIF MediaObject             ──────────>  Tify-viewer laadt manifest            IIIF manifest
                              (evt. via    /api/iiif?url=…  bij CORS-problemen)
/api/health                  (K8s probe)
```

### Route handlers (server)

1. **`POST /api/object`** — body `{ url }`.
   - `rdf-dereference` dereferentieert `url` (volgt redirects; `Accept` met JSON-LD
     voorkeur, daarna Turtle/N-Triples/N-Quads). Quads → `N3.Store`.
   - Bepaalt het hoofd-subject: het subject dat gelijk is aan de (resolved) URL, anders
     het eerste subject `a schema:CreativeWork`.
   - Extraheert het **view-model** (zie onder) — alléén SCHEMA-AP-NDE-properties.
   - Retourneert `{ object, diagnostics }`:
     - `diagnostics`: `httpStatus`, `finalUrl`, `redirectChain`, `contentType`,
       `detectedFormat`, `tripleCount`, `foundCreativeWork` (bool),
       `persistentId` `{ scheme: ARK|Handle|DOI|URN:NBN|null, input, resolved, ok }`.
   - Foutafhandeling: nooit een kale fout. Elke faalsituatie levert een
     **gestructureerde status** terug (zie "Faalsituaties & begeleiding"), zodat de
     client laagdrempelige uitleg + motiverende suggesties kan tonen i.p.v. een
     lege/witte pagina. Resultaat is **graceful degradation**: toon altijd wat wél
     lukt, en leg per ontbrekend onderdeel uit wat het betekent en hoe het op te lossen is.

2. **`POST /api/term`** — body `{ uris: string[] }`. Proxyt de Termennetwerk GraphQL
   `lookup(uris:)`-query (endpoint `https://termennetwerk-api.netwerkdigitaalerfgoed.nl/graphql`).
   Retourneert per URI: `source{uri,name}`, `result{uri,prefLabel,altLabel,definition,scopeNote,seeAlso}`.

3. **`GET /api/iiif?url=`** — eenvoudige pass-through proxy voor IIIF-manifests, als fallback
   wanneer een manifest-server geen CORS-headers stuurt (Tify haalt het manifest normaal zelf op).

4. **`GET /api/health`** — `200 {status:"ok"}` voor K8s liveness/readiness.

### View-model (server → client)

```ts
type Lang = 'nl' | 'en' | string;
type LangLiteral = { value: string; lang?: Lang };
type DefinedTerm   = { name: LangLiteral[]; sameAs?: string };          // klikbaar als sameAs aanwezig
type ValueNode =
  | { kind: 'literal';  value: LangLiteral }
  | { kind: 'date';     value: string }
  | { kind: 'term';     term: DefinedTerm }
  | { kind: 'resource'; resource: MappedResource }   // Person/Place/Organization (genest)
  | { kind: 'geo';      lat: number; long: number }
  | { kind: 'media';    media: MediaObject }
  | { kind: 'iiif';     manifestUrl: string };
type Field = { property: string; labelNl: string; values: ValueNode[] };
type MappedResource = { uri?: string; type: string; typeLabelNl: string; fields: Field[] };
type ObjectView = { uri: string; fields: Field[] };  // de CreativeWork
```

Alleen properties uit de **SCHEMA-AP-NDE Dutch-label dictionary** komen in `fields`;
al het overige wordt genegeerd. `DefinedTerm`-detectie: node getypeerd als
`schema:DefinedTerm` → render `name` + taalbadge + (indien `sameAs`) link.

### SCHEMA-AP-NDE → Nederlandse labels (dictionary)

Eén config-module (`lib/schema-ap-nde.ts`) met per klasse de toegestane properties en
hun Nederlandse label (afgeleid uit de SHACL-profielbeschrijvingen). Kernset:

- **CreativeWork:** `name`→"Titel", `creator`→"Maker", `dateCreated`→"Datering",
  `description`→"Beschrijving", `abstract`→"Samenvatting", `text`→"Tekst",
  `material`→"Materiaal", `genre`→"Genre", `about`→"Onderwerp",
  `contentLocation`→"Afgebeelde locatie", `locationCreated`→"Vervaardigingsplaats",
  `temporalCoverage`→"Periode", `size`→"Afmetingen", `identifier`→"Identificatie",
  `additionalType`→"Objecttype", `isPartOf`→"Onderdeel van dataset",
  `associatedMedia`→"Media", `sdDatePublished`→"Laatst gewijzigd".
- **Person:** `name`→"Naam", `birthDate`→"Geboortedatum", `birthPlace`→"Geboorteplaats",
  `deathDate`→"Overlijdensdatum", `deathPlace`→"Overlijdensplaats", `hasOccupation`→"Beroep".
- **Organization:** `name`→"Naam", `location`→"Locatie".
- **Place:** `name`→"Naam", `address`→"Adres", `geo`→"Coördinaten".
- **PostalAddress:** `streetAddress`→"Straat", `postalCode`→"Postcode",
  `addressLocality`→"Plaats", `addressRegion`→"Regio", `addressCountry`→"Land".
- **MediaObject:** `contentUrl`, `thumbnailUrl`, `license`→"Licentie",
  `copyrightNotice`→"Copyright", `encodingFormat`. IIIF-manifest herkend aan
  `encodingFormat` ~ `application/ld+json;profile='http://iiif.io/api/presentation/N/context.json'`.

### Frontend (componenten)

- `app/page.tsx` — beginscherm: groot invoerveld + **Bekijken**-knop; eronder een rijtje
  klikbare **voorbeeld-permalinks**. NDE-header met logo.
- `ObjectView` — rendert de CreativeWork-velden als nette label/waarde-rijen (definition list).
- `FieldValue` — schakelt op `ValueNode.kind`; literal met taalbadge; geneste resource als subkaart.
- `TermLink` / `TermPanel` — klik op `DefinedTerm`-link → `POST /api/term` → uitklapbaar
  paneel met prefLabel/altLabel/definitie/bron; opnieuw klikken verbergt het.
- `IiifViewer` — laadt **Tify** (`tify@0.35.0`) in een `useEffect` op een container-ref,
  geïnitialiseerd met de manifest-URL.
- `Guidance` — herbruikbaar uitlegblok (titel, korte uitleg, motiverende suggestie,
  doc-link) dat de faalcodes uit "Faalsituaties & begeleiding" rendert; gebruikt zowel
  op het beginscherm (bij `URL_UNRESOLVED`/`NO_LINKED_DATA`) als inline in `ObjectView`
  (bij `NO_IIIF`/`NO_TERMS`/`NOT_SCHEMA_AP_NDE`).
- `Diagnostics` — toont de twee hoofdcontroles: *beschikbaar als linked data?*
  (status/format/triples/CreativeWork gevonden) en *persistente URI resolvet?* (ARK/Handle
  herkend + redirect-keten/finale URL). Groen/rood badges.

### Faalsituaties & begeleiding (kernontwerp, geen kale errors)

Er kan van alles misgaan. In plaats van een foutpagina degradeert de tool gracieus:
toon altijd wat wél beschikbaar is, en geef per ontbrekend/fout onderdeel een
**laagdrempelige uitleg + motiverende suggestie** (wat betekent dit, waarom is het
belangrijk, hoe los je het op — met een link naar de relevante docs.nde.nl-pagina).
De server retourneert hiervoor per controle een status: `ok` | `warning` | `error`
met een `code`. De client mapt elke code op een vriendelijk uitlegblok (component
`Guidance`, met titel, korte uitleg, concrete suggestie en doc-link).

| Situatie | Code | Begeleiding (laagdrempelig + motiverend) |
|---|---|---|
| URL resolvet niet (niet bereikbaar / persistente URI lost niet op) | `URL_UNRESOLVED` | "We konden deze URL niet bereiken." Suggestie: controleer de link; als het een ARK/Handle is, controleer de resolver-configuratie. Link → persistent-identifiers docs. |
| URL biedt geen linked data (geen RDF / niet te parsen) | `NO_LINKED_DATA` | "Deze URL geeft geen linked data terug." Uitleg over content-negotiation; suggestie: bied JSON-LD/Turtle/N-Triples aan. Link → requirements/schema-profile. |
| Wel RDF, maar niet conform SCHEMA-AP-NDE (geen `CreativeWork` / geen herkende velden) | `NOT_SCHEMA_AP_NDE` | "We vonden linked data, maar (nog) geen velden die we volgens SCHEMA-AP-NDE herkennen." Toon wel de ruwe diagnostiek (formaat, #triples, gevonden types). Suggestie + link → schema-profile. |
| Geen (werkende) IIIF-manifest | `NO_IIIF` | Rustige notitie i.p.v. lege viewer: "Geen IIIF-manifest gevonden voor dit object." Korte uitleg waarom IIIF nuttig is + link → IIIF/associatedMedia in het profiel. |
| Geen termen (`DefinedTerm`s) | `NO_TERMS` | "Dit object verwijst nog niet naar termen uit een gedeelde vocabulaire." Uitleg waarom termen + `sameAs` waardevol zijn + link → Termennetwerk/reference-terms. |

Belangrijk: deze situaties zijn **niet wederzijds uitsluitend en niet fataal**. Een
object kan prima getoond worden zónder IIIF en zónder termen; alleen `URL_UNRESOLVED`
en `NO_LINKED_DATA` verhinderen een objectweergave (dan toont het beginscherm de uitleg
direct onder het invoerveld). De twee hoofdcontroles (linked data beschikbaar?,
persistente URI resolvet?) blijven altijd zichtbaar in `Diagnostics`.

### Styling / huisstijl

- Tailwind met NDE-tokens: **primair** blauw `#093ef5` (NDE-logo), **accent** oranje
  `#f95200`, neutrale grijzen, witte achtergrond. Inter/system-font, ruime witruimte,
  afgeronde kaarten, subtiele schaduw.
- NDE-logo in de header als lokaal SVG-asset (NDE-wordmark in `#093ef5`), niet hotlinken.

## Afhankelijkheden

`next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`,
`rdf-dereference` (Comunica), `n3`, `@rdfjs/types`, `tify@0.35.0`.
GraphQL via `fetch` (geen extra client).

## Bestanden (nieuw)

```
package.json, tsconfig.json, next.config.mjs (output:'standalone'), tailwind.config.ts, postcss.config.js
app/layout.tsx, app/page.tsx, app/globals.css
app/api/object/route.ts, app/api/term/route.ts, app/api/iiif/route.ts, app/api/health/route.ts
lib/schema-ap-nde.ts        # property→NL-label dictionary + toegestane klassen
lib/rdf.ts                  # rdf-dereference + N3.Store + view-model extractie
lib/termennetwerk.ts        # GraphQL lookup(uris:) client
lib/persistent-id.ts        # ARK/Handle/DOI/URN:NBN detectie + resolve-check
lib/examples.ts             # geverifieerde voorbeeld-permalinks
lib/guidance.ts            # faalcodes → titel/uitleg/suggestie/doc-link
components/ObjectView.tsx, FieldValue.tsx, TermPanel.tsx, IiifViewer.tsx, Diagnostics.tsx, Guidance.tsx
public/nde-logo.svg
Dockerfile, .dockerignore
k8s/deployment.yaml, k8s/service.yaml, k8s/ingress.yaml
PLAN.md            # kopie van dit plan in de projectmap (gevraagd)
README.md          # requirements + starten + docker/k8s
```

## Implementatievolgorde

1. Scaffold Next.js + TypeScript + Tailwind; NDE-thema-tokens + header/logo.
2. `lib/schema-ap-nde.ts` (dictionary) + `lib/persistent-id.ts`.
3. `lib/rdf.ts` (Comunica dereference → N3.Store → view-model) + `app/api/object`.
4. Beginscherm + `ObjectView`/`FieldValue` + `Diagnostics` + `Guidance`/`lib/guidance.ts`
   (faalsituaties & begeleiding); end-to-end met één voorbeeld + minstens één faalpad.
5. `lib/termennetwerk.ts` + `app/api/term` + `TermPanel` (klik op `sameAs`).
6. `IiifViewer` met Tify + `app/api/iiif` fallback.
7. `lib/examples.ts`: voorbeeld-permalinks kiezen en **verifiëren** (resolven + parsen + CreativeWork).
8. Dockerfile (multi-stage, standalone) + k8s-manifests + `/api/health`.
9. `PLAN.md` + `README.md`.

## Verificatie (end-to-end)

- `npm install && npm run dev` → http://localhost:3000.
- Klik elke voorbeeld-permalink: object verschijnt, diagnostiek groen
  (linked data beschikbaar; ARK/Handle resolvet indien aanwezig).
- Faalsituaties (elk geeft laagdrempelige uitleg + suggestie, geen kale error):
  een 404-URL → `URL_UNRESOLVED`; een HTML-only/niet-RDF-URL → `NO_LINKED_DATA`;
  RDF zonder `CreativeWork` → `NOT_SCHEMA_AP_NDE` (met ruwe diagnostiek); object zonder
  IIIF → `NO_IIIF`-notitie; object zonder `DefinedTerm`s → `NO_TERMS`-notitie. Verifieer
  dat een object met sommige onderdelen ontbrekend tóch correct (gedeeltelijk) weergeeft.
- Een `DefinedTerm` met `sameAs` aanklikken → Termennetwerk-paneel opent met prefLabel/definitie en sluit weer.
- Een object met IIIF-manifest → Tify-viewer toont de afbeelding(en).
- Formaat-dekking: test een bron die Turtle/N-Triples levert i.p.v. JSON-LD (content-negotiation).
- `curl localhost:3000/api/health` → `{"status":"ok"}`.
- `docker build` slaagt; container serveert de app; `k8s/` manifests `kubectl apply --dry-run` valide.

## Bewust buiten scope (prototype, YAGNI)

- Geen volledige SHACL-validatie (alleen de twee hoofdcontroles + "herken/toon wat we snappen").
- Geen authenticatie, geen opslag/persistente historie, geen i18n-toggle (UI is NL).
- Geen ondersteuning voor properties buiten SCHEMA-AP-NDE.
