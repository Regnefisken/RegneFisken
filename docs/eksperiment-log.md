# Log over ændringer på grenen `eksperiment`

Skrevet 10. november 2026. Dækker alt, der ligger på `eksperiment` ud over `main`.

## Status

- `main` er urørt og står på commit `0fc963f` ("kastvariation"). Den offentlige udgave er derfor
  uændret.
- `eksperiment` ligger foran `main` med de ændringer, der er beskrevet herunder. Alt er pushet til
  GitHub.
- Intet er flettet til `main`.
- Formatversionen for gemte spil er uændret (15). Ingen spillere mister fremskridt ved en fletning.

Seneste kontrol af grenen:

| Kontrol | Resultat |
|---|---|
| `npm run build` | Går igennem |
| `npm test` | 242 af 242 tests består |
| `node scripts/smoke-test.cjs` | 37 af 37 tjek består, ingen fejl i konsollen |
| `npm run lint` | 74 problemer (84 på `main`) |

## Commits i rækkefølge

### 1. `ee0084d` — Tests af spillogikken

Kun testfiler; spillets kode er ikke ændret. Suiten gik fra 12 til 224 tests.

- `tests/math-engine.test.ts`: facit regnes efter ud fra opgaveteksten for alle opgavetyper,
  sværhedsgrader og farvande.
- `tests/catch-engine.test.ts`: faste udfald og regler, der skal holde over mange kast.
- `tests/save-load.test.ts`: gem og genindlæs uden tab, ødelagte gem, ældre formater, opstart og
  auto-gem.
- `tests/xp-engine.test.ts`: level-kurve, level-up og streak-bonus.
- `tests/travel-unlock.test.ts` (ny): oplåsning af alle lokationer.
- `tests/data-integrity.test.ts`: fisk, lokationer, butik, mål og regnehistorie-skabeloner.
- `tests/helpers/random.ts` (ny): hjælper til at styre `Math.random` i tests.

### 2. `f95b3f9` — Tomt svar tæller ikke længere som 0

- **Fejl:** et tomt svarfelt blev godkendt som rigtigt, når facit var 0 (fx "5 - 5").
- **Rettelse:** svar-tjekket er flyttet fra `MathChallenge.tsx` til den nye
  `src/logic/answer-check.ts` og afviser nu tomme svar.
- **Test:** `tests/answer-check.test.ts` (ny).

### 3. `b75fdcb` — Valget af decimaltegn gemmes

- **Fejl:** valget mellem komma og punktum i matematik-indstillingerne blev ikke gemt.
- **Rettelse:** `src/logic/game-persistence.ts` gemmer og indlæser nu feltet `decimalSeparator`.
  Ældre gem uden feltet beholder komma.
- **Test:** tilføjet i `tests/save-load.test.ts`.

### 4. `cecf53b` — Målet "Fuldt udrustet" kræver alt varigt udstyr

- **Fejl:** målet talte antal køb (36), så gentagne køb af madding udløste det.
- **Rettelse:** målet kræver nu de 27 varige varer, der kan købes for mønter. Listen er
  `FULL_UPGRADE_ITEM_IDS` i `src/data/shop.ts`.
- **Tæller ikke med:** madding, Sørøverens Hat (gratis, level 99), ost og papegøjefjer (kan også
  findes andre steder) samt møbler.
- **Uændret:** "Første investering" tæller stadig ethvert køb. Spillere, der allerede har målet,
  beholder det.
- **Synligt for spillere:** fremdriften viser "x / 27" i stedet for "x / 36".
- **Berørte filer:** `src/data/shop.ts`, `src/data/progression.ts`, `src/logic/goal-progress.ts`,
  `src/logic/goal-row-progress.ts`, `src/logic/xp-engine.ts`, `src/types/progression.ts`.
- **Test:** `tests/goal-progress.test.ts` (ny).

### 5. `5f5bf40` — README og oprydning

- `README.md`: Vite-skabelonen er erstattet af en beskrivelse af projektet.
- Slettet, fordi intet brugte dem: `src/assets/react.svg`, `src/assets/vite.svg`,
  `src/assets/hero.png` og `public/icons.svg`.
- Commit-beskeden nævner kun README; sletningerne kom med i samme commit ved en fejl.

### 6. `4019b7b` — Mekaniske lint-fejl

Ingen ændring i spillets opførsel.

- Seks `let` er blevet til `const` (`math-engine.ts`, `NightSky.tsx`, `environment.ts`,
  `AmbientLife.tsx`, `renderAvatarSvg.ts`).
- En ubrugt parameter er fjernet i `TropicalIsland.tsx`.
- En lint-kommentar til en regel, der ikke findes, er fjernet i `WardrobeModal.tsx`.
- Et tal i `JungleIsland.tsx` er skrevet med den værdi, det i forvejen havde ved kørsel.
- `eslint.config.js`: den maskingenererede `wardrobeItems.generated.ts` lintes ikke længere.

### 7. `9fca301` — Røgtest i en rigtig browser

- `scripts/smoke-test.cjs` (ny): spiller et produktionsbuild igennem i headless Chromium. Den
  dækker en ny spiller (fang, sælg, alle paneler), tomt svar, gemt decimaltegn og målet
  "Fuldt udrustet".
- Kræver Playwright, som ikke er tilføjet til `package.json`.
- `.gitignore`: mappen `smoke-screenshots` ignoreres.
- `README.md`: afsnit om, hvordan røgtesten køres.

### 8. `9d44b8d` — Fangst-panelet skjuler ikke længere knappen

- **Fejl:** i desktop-visning (vindue bredere end 1366 px) blev knappen skåret væk og kunne ikke
  klikkes, når vinduet var for lavt: "Læg i Spanden" under ca. 830 px og "Åbn kisten" under ca.
  1000 px. Fejlen findes stadig på `main`.
- **Rettelse:** panelet fylder nu højst den plads, der er. Indholdet ruller, og knappen bliver
  stående i bunden. De fælles klasser ligger i `DESKTOP_CATCH_PANEL_FIT` i
  `src/components/fishing/catchOverlayLayout.ts`.
- **Berørte filer:** `CatchResult.tsx`, `SunketChestCatchPanel.tsx`, `catchOverlayLayout.ts`.
- **Kontrolleret:** begge paneler i seks vinduesstørrelser fra 1400×600 til 1920×1080. Knappen kan
  klikkes i alle tolv tilfælde, og på store skærme står panelet samme sted som før.
- **Ændring i udseende:** i lave vinduer rykker panelet op og dækker den fangede fisk i
  3D-scenen. Det er rettet i næste commit.

### 9. Kompakt fangst-panel i lave desktop-vinduer

Commit-nummeret står i `git log`; beskeden er "Kompakt fangst-panel i lave desktop-vinduer".

- **Formål:** man skal kunne se både fangsten i 3D-scenen og panelet.
- **Ændring:** i desktop-visning bruger panelerne de tætte størrelser fra mobil-visningen, når
  vinduet er lavt: almindelig fangst under 900 px, skattekiste under 1000 px. Grænserne står i
  `src/components/fishing/catchOverlayLayout.ts`.
- **Ny fil:** `src/hooks/useViewportHeightBelow.ts`, som følger vinduets højde.
- **Berørte filer:** `CatchResult.tsx`, `SunketChestCatchPanel.tsx`, `catchOverlayLayout.ts`.
- **Kontrolleret:** begge paneler i de samme seks vinduesstørrelser. Knappen kan klikkes i alle
  tolv tilfælde. Fangsten er fri over panelet ned til ca. 730 px vindueshøjde; ved 600 px dækkes
  den delvist.
- **Uændret:** store skærme (almindelig fangst fra 900 px, kiste fra 1000 px) og mobil-visningen.

## Hvad der ikke er afprøvet

- Rettelserne er kun kørt i headless Chromium uden grafikkort, ikke på en rigtig computer, telefon
  eller Chromebook.
- Mobil-visningen er ikke ændret og ikke gennemgået.
- Lyd og hvor flydende spillet kører, kan ikke bedømmes i det miljø.

## Åbne punkter

1. **Fangst-panelet i lave vinduer** er løst med det kompakte panel (punkt 9). I vinduer lavere
   end ca. 700 px dækkes fangsten stadig delvist.
2. **De øvrige 14 fangst-paneler** (flaskepost, bosser, helleflynder m.fl.) har samme faste
   topmargen. De kan rulle, så knappen kan nås, men de er ikke målt enkeltvis.
3. **74 lint-problemer** står tilbage. Næsten alle er `react-hooks`-regler i 3D- og
   brugerfladekoden, hvor en rettelse kan ændre animationer. De tre `rules-of-hooks`-fejl er ikke
   rigtige fejl; se "Forestående arbejde".
4. **Hoved-bundlen er 1,2 MB.** Se "Forestående arbejde".
5. **Udækket af tests:** vejr, konkurrence og præmiekoder.
6. **Ikke ryddet op:** `_gen_wardrobe.mjs` og `scripts/extract-legacy-data.mjs` /
   `scripts/generate-data.mjs` læser filer, der ikke findes i repoet, og
   `references/faviconfix.svg` bruges ikke.
7. **Commit `5f5bf40`** har en commit-besked, der ikke nævner de slettede filer. Historikken er
   ikke omskrevet, fordi den er pushet.

## Forestående arbejde (næste session)

Aftalt 10. november 2026: de to opgaver herunder løses i en ny session på `eksperiment`. Intet af
det er påbegyndt.

### Før der laves nyt: prøv fangst-panelet på en rigtig computer

Det kompakte fangst-panel (punkt 9) er kun set i headless Chromium. Prøv det først, så der ikke
ligger to uafprøvede ændringer af udseendet oven i hinanden.

```bash
git fetch origin && git checkout eksperiment && git pull
npm install
npm run dev
```

- Brug et vindue bredere end 1366 px, ellers vises mobil-visningen.
- Fang et par fisk i et almindeligt vindue og igen i et lavt vindue (under ca. 900 px højt).
- Knappen "Læg i Spanden" skal altid kunne ses, og fisken skal være fri over panelet.
- Fang gerne en skattekiste: "Åbn kisten" skal kunne ses, og kisten i scenen skal være fri.

### Opgave 1: de tre `rules-of-hooks`-fejl (lille, ingen ændring i spillet)

Samme linje i `src/App.tsx`, `src/components/admin/AdminPanel.tsx` og `src/three/Experience.tsx`:

```ts
const fishEditorOpen = import.meta.env.DEV ? useEditorStore((s) => s.isOpen) : false;
```

- Det er ikke en rigtig fejl. `import.meta.env.DEV` ligger fast, når spillet bygges, så hooket
  kaldes enten altid (udvikling) eller aldrig (udgivet udgave). Rækkefølgen kan ikke skifte under
  kørsel.
- Konstruktionen ser ud til at være bevidst, så fiske-editoren ikke kommer med i den udgivne
  udgave. Hooket skal derfor ikke gøres ubetinget.
- **Løsning:** en `eslint-disable-next-line react-hooks/rules-of-hooks`-kommentar med forklaring
  på de tre linjer. Lint går fra 74 til 71 problemer.
- **Kontrol:** `npm run build`, `npm test` og `npm run lint`. Kræver ingen visuel kontrol.

### Opgave 2: mindre hoved-bundle (mellemstor, skal afprøves)

Hovedfilen er 1,2 MB (327 kB gzip). Butik, mål, matematik-indstillinger, lærer-dashboard og
skærmindstillinger kan indlæses med `React.lazy`, først når de åbnes. Garderoben gør det allerede i
`src/App.tsx` og kan bruges som forbillede.

Anbefalet rækkefølge:

1. **Udvid røgtesten først.** `scripts/smoke-test.cjs` åbner i dag Butik, Kiste, Mål, Matematik
   og Menu. Tilføj tjek for lærer-dashboardet, skærmindstillinger og de små dialoger (Om spillet,
   Kontakt, Nulstil), og kør den grøn mod den nuværende kode, før noget ændres.
2. **Flyt ét panel ad gangen** til `React.lazy` med `Suspense`, og kør `npm run build` efter
   hvert, så størrelsen på hovedfilen kan følges.
3. **Kør hele røgtesten** til sidst (ca. 8 minutter). Den fanger paneler, der ikke åbner, og fejl
   i konsollen.
4. **Prøv på en rigtig computer**, gerne en Chromebook: åbn hvert panel første gang og se efter et
   blink eller en forsinkelse.

Hvad der kan gå galt, og hvad der ikke kan bekræftes uden en rigtig enhed:

- Et panel åbner ikke, eller viser et kort blink første gang. Røgtesten fanger det første, ikke
  det andet.
- Om spillet mærkes hurtigere at starte, kan kun bedømmes på en rigtig enhed. Gevinsten i kB
  kendes først, når det er prøvet.
- Fortrydes let: hvert panel er sit eget commit og kan tages tilbage med `git revert`.

## Fletning til `main`

Er ikke udført og sker kun, når det bliver bedt om. `eksperiment` bygger direkte oven på `main`, så
en fletning kan ske uden konflikter, så længe `main` ikke har fået nye commits.

Fortryd af en enkelt ændring på `eksperiment`: `git revert <commit>` med commit-nummeret for
ændringen.
