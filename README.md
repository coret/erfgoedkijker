# NDE ErfgoedKijker

Een prototype waarmee een applicatiebeheerder bij een erfgoedinstelling of een
datacleaner uit een NDE-datawerkplaats snel kan controleren of een **erfgoedobject**
correct als linked data wordt aangeboden volgens **SCHEMA-AP-NDE**, en hoe die data
eruitziet.

Plak een **permalink** van een erfgoedobject, klik **Bekijken**, en de ErfgoedKijker:

1. haalt de linked data op via **content-negotiation** (voorkeur JSON-LD, anders
   Turtle / N-Triples / N-Quads / RDF-XML / TriG) met behulp van [Comunica];
2. controleert of het object **beschikbaar is als linked data**, of het de aanbevolen
   **`https://schema.org/`-namespace** gebruikt (en signaleert de afgeraden
   `http://schema.org/`-variant), en — als de URL een ARK/Handle/DOI bevat — of de
   **persistente URI resolvet**;
3. toont voor een erfgoedobject (`CreativeWork`) **alle** [SCHEMA-AP-NDE]-properties in de
   **volgorde van het profiel**, met labels in de interfacetaal — óók lege velden (als leeg
   waarde-vlak), zodat de weergave meteen een volledigheidscheck is; bij een ontbrekende
   **verplichte** property (`name`, `sdDatePublished`) verschijnt een duidelijke melding
   *"Deze verplichte waarde ontbreekt"*. Overige types tonen de herkende velden;
4. toont `DefinedTerm`-waarden met taal (nl/en) en, als er een `sameAs`-URI is, als
   klikbare link die de term opzoekt via het **[NDE Termennetwerk]**;
5. toont een **IIIF Presentation-manifest** in de [Tify] IIIF-viewer als dat aanwezig is;
6. resolvet de **`isPartOf` datasetbeschrijving** en toont titel, beschrijving en uitgever
   als datasetkaart, met een deeplink naar het **[NDE Dataset Register]** en een controle
   of de dataset-URI zelf linked data oplevert;
7. toont desgewenst de **rauwe linked data als leesbare, syntax-gekleurde Turtle** —
   uitklapbaar in het Controles-blok, genormaliseerd geserialiseerd uit de opgehaalde graph
   (met [N3]); was de bron geen Turtle, dan vermeldt het label het bronformaat
   (bijv. *bron was JSON-LD*).

Gaat er iets mis — de URL resolvet niet, biedt geen linked data, is niet conform
SCHEMA-AP-NDE, heeft geen IIIF-manifest of geen termen — dan toont de tool geen kale
foutmelding maar een **laagdrempelige uitleg met een motiverende suggestie** en een link
naar de relevante NDE-documentatie. Wat wél beschikbaar is, wordt altijd getoond
(graceful degradation).

## Tweetalig: Nederlands en Engels

De interface is beschikbaar in het **Nederlands (standaard)** en **Engels**, om te wisselen
is er een taalschakelaar in de header. De keuze wordt bewaard in een `locale`-cookie; de
URL verandert niet, dus `?url=`-deeplinks blijven werken.

De **getoonde metadata volgt de interfacetaal**:

- Heeft een veld waarden met een taaltag in de interfacetaal, dan worden alleen die getoond.
- Zo niet, dan waarden **zonder** taaltag.
- Zijn die er ook niet, dan worden **alle** aanwezige waarden getoond — er verdwijnt nooit
  data omdat de taal niet klopt. De taalbadge (`NL`/`EN`) laat zien wat je ziet.

Dit samenvouwen geldt alleen voor de properties die volgens SCHEMA-AP-NDE een
`rdf:langString` moeten zijn (`name`, `description`, `abstract`, `text`, `copyrightNotice`)
— hun meerdere literals zíjn vertalingen van elkaar. Meerwaardige velden als `about`,
`material` en `identifier` blijven onaangeroerd: `"Amsterdam"@nl` en
`"Second World War"@en` zijn twee onderwerpen, niet één onderwerp in twee talen.

Het wisselen van taal doet **geen nieuwe lookup**: de view-model die `/api/object` teruggeeft
bevat geen labels, alleen de schema.org-namen (`creator`, `Person`). De client zoekt het
label op in het profiel. Wisselen is daarmee een puur server-side hertekening van de
Server Components, waarbij de opgehaalde resultaten in beeld blijven staan.

Ook de **IIIF-viewer** volgt de interfacetaal: zowel zijn eigen knoppen (zoomen, draaien,
bladeren) als de labels uit het IIIF-manifest zelf. Tify levert de Nederlandse strings mee;
`app/tify-translations/` serveert dat bestand rechtstreeks uit het `tify`-pakket, zodat het
nooit uit de pas kan lopen met de versie in `package.json`. Bij een taalwissel wordt de
viewer niet opnieuw opgebouwd (`tify.setLanguage()`), dus de pagina en zoom blijven staan.

[Comunica]: https://comunica.dev/
[N3]: https://github.com/rdfjs/N3.js
[SCHEMA-AP-NDE]: https://docs.nde.nl/schema-profile/
[NDE Termennetwerk]: https://docs.nde.nl/services/network-of-terms/graphql
[NDE Dataset Register]: https://datasetregister.netwerkdigitaalerfgoed.nl/
[Tify]: https://github.com/tify-iiif-viewer/tify

## Requirements

- **Node.js 20+** (ontwikkeld en getest met Node 22) en **npm**.
- Uitgaande netwerktoegang vanaf de server naar:
  - de in te voeren erfgoed-permalinks;
  - `termennetwerk-api.netwerkdigitaalerfgoed.nl` (Termennetwerk GraphQL);
  - IIIF-manifest- en image-servers.
- Voor productie/containers: een container-runtime (Docker) en optioneel een
  Kubernetes-cluster.

> **Waarom een server-side component?** Het ophalen van linked data van externe
> erfgoed-servers en het bevragen van het Termennetwerk lukt niet rechtstreeks vanuit
> de browser (CORS). De Next.js **API routes** doen dit server-side als proxy.

## Lokaal starten (development)

```bash
npm install
npm run dev
# open http://localhost:3000
```

Unit tests (geen testframework nodig, draait op `node:test`):

```bash
npm test
```

## Productie-build

```bash
npm run build      # maakt een 'standalone' build (.next/standalone)
npm start          # start de productieserver op poort 3000 (of $PORT)
```

Health-check: `GET /api/health` → `{"status":"ok"}`.

## Docker

```bash
docker build -t erfgoedkijker:latest .
docker run --rm -e PORT=3003 -p 3003:3003 erfgoedkijker:latest
# http://localhost:3003
```

De server luistert op `$PORT` (standaard 3000). Wil je poort 3003, geef die dan zowel
aan de container mee (`-e PORT=3003`) als in de poortmapping (`-p 3003:3003`).

### Detached draaien

Voor een langdraaiende service start je de container losgekoppeld (`-d`), met een naam
en een herstartbeleid:

```bash
docker run -d --name erfgoedkijker \
  -e PORT=3003 \
  -p 3003:3003 \
  --restart unless-stopped \
  --health-cmd 'wget -qO- http://127.0.0.1:3003/api/health || exit 1' \
  --health-interval 30s \
  erfgoedkijker:latest
# http://localhost:3003
```

> De health-check gebruikt **`127.0.0.1`**, niet `localhost`: in de Alpine-container
> resolvet `localhost` eerst naar `::1`, terwijl de Node-server alleen op IPv4 luistert
> (`HOSTNAME=0.0.0.0`). Met `localhost` blijft de container daardoor eeuwig `unhealthy`
> terwijl hij prima draait.

Beheren:

```bash
docker ps                     # status (toont 'healthy' dankzij de health-check)
docker logs -f erfgoedkijker  # logs volgen
docker stop erfgoedkijker     # stoppen
docker start erfgoedkijker    # weer starten
docker rm -f erfgoedkijker    # stoppen + verwijderen
```

De image gebruikt de Next.js *standalone* output (kleine runtime-image, draait als
non-root gebruiker).

## Kubernetes (untested)

Manifests staan in [`k8s/`](./k8s): `Deployment` (2 replica's, liveness/readiness op
`/api/health`, non-root securityContext), `Service` (ClusterIP) en een voorbeeld-`Ingress`.

```bash
# 1. build & push de image naar je registry, en zet die in k8s/deployment.yaml
docker build -t <registry>/erfgoedkijker:<tag> .
docker push <registry>/erfgoedkijker:<tag>

# 2. pas image + host aan in k8s/deployment.yaml en k8s/ingress.yaml

# 3. uitrollen
kubectl apply -f k8s/
```

## Projectstructuur

```
app/
  page.tsx              Beginscherm (invoerveld, Bekijken, voorbeelden) + resultaat
  layout.tsx            NDE-header/footer + taalschakelaar (Server Action zet de cookie)
  api/object/route.ts   Proxy: dereference (Comunica) → ViewModel + diagnostiek
  api/term/route.ts     Proxy: Termennetwerk lookup(uris:)
  api/iiif/route.ts     Fallback-proxy voor IIIF-manifests (CORS)
  api/health/route.ts   Health-check
  tify-translations/    Serveert Tify's nl.json uit het tify-pakket (IIIF-viewer UI)
components/             ObjectView, FieldValue, Diagnostics, Guidance, TermPanel,
                        IiifViewer, LanguageSwitch
i18n/request.ts         next-intl: leest de locale-cookie, laadt de messages
messages/nl.json        Interfaceteksten (Nederlands, standaard)
messages/en.json        Interfaceteksten (Engels)
global.d.ts             next-intl AppConfig (Locale + typed message keys)
lib/
  i18n.ts               Locale + pickLiteral/selectValues (taalkeuze van de metadata)
  i18n.test.ts          Unit tests voor pickLiteral/selectValues (`npm test`)
  schema-ap-nde.ts      Toegestane klassen + property→label (nl/en) + veldtoelichting
  rdf.ts                Comunica dereference + N3-store + ViewModel-extractie
  termennetwerk.ts      GraphQL lookup-by-URI client
  persistent-id.ts      ARK/Handle/DOI/URN:NBN detectie + resolve-check
  guidance.ts           Faalsituaties → uitleg + suggestie + doc-link (nl/en)
  examples.ts           Voorbeeld-permalinks onder het invoerveld
  types.ts              Gedeelde ViewModel-types
k8s/                    Deployment, Service, Ingress
Dockerfile              Multi-stage build (standalone)
PLAN.md                 Ontwerp / plan
```

De vertalingen staan op twee plekken, elk waar ze horen: **interfaceteksten** in
`messages/{nl,en}.json` (statische keys, dus door TypeScript gecontroleerd), en de
**profiel-labels** bij hun `PropertyDef` in `lib/schema-ap-nde.ts` — die zijn gesleuteld op
de schema.org-namen die toch al in het ViewModel zitten.

## Wat de ErfgoedKijker (bewust) niet doet

- Geen volledige SHACL-validatie — alleen de hoofdcontroles en "toon wat we herkennen".
- Geen velden buiten SCHEMA-AP-NDE.
- Geen authenticatie, opslag of historie (prototype).

## Bronnen

- SCHEMA-AP-NDE profiel: <https://docs.nde.nl/schema-profile/>
- NDE Termennetwerk (GraphQL): <https://docs.nde.nl/services/network-of-terms/graphql>
- NDE Dataset Register: <https://datasetregister.netwerkdigitaalerfgoed.nl/>
- Tify IIIF-viewer: <https://github.com/tify-iiif-viewer/tify>
- NDE documentatie: <https://docs.nde.nl/>
