# Regnefisken

Et 3D-fiskespil i browseren, hvor man fanger fisk ved at løse regnestykker. Spillet er på dansk og
henvender sig til 0.–9. klasse. Det kører på [www.regnefisken.dk](https://www.regnefisken.dk/).

Spilleren kaster snøren ud, løser en opgave for at hale fangsten ind, sælger fisk, køber udstyr og
låser nye fiskepladser op. Sværhedsgraden vælges med tre "farvande":

| Farvand | Klassetrin | Eksempler på opgaver |
|---|---|---|
| 🏖️ Kysten | 0.–3. klasse | Plus, minus, tivenner, tælleopgaver med emojier |
| ⛵ Det Åbne Hav | 4.–6. klasse | Gange, division, afrunding, decimaltal, regnehistorier |
| 🐋 Dybet | 7.–9. klasse | Ligninger, flere led, procent, brøker |

Spillet har ingen backend. Alt fremskridt gemmes i browserens `localStorage`.

## Kom i gang

Kræver Node.js og npm.

```bash
npm install
npm run dev
```

| Kommando | Hvad den gør |
|---|---|
| `npm run dev` | Starter udviklingsserveren |
| `npm run build` | Typecheck og produktionsbuild til `dist/` |
| `npm run preview` | Viser produktionsbuildet lokalt |
| `npm test` | Kører testene (Vitest) |
| `npm run lint` | Kører ESLint |
| `npm run dev:sound-lab` | Starter lydværktøjet (kør først `npm install` i `apps/sound-lab`) |

## Teknik

React 19, TypeScript, Vite, Three.js (via react-three-fiber og drei), Zustand og Tailwind CSS.

## Opbygning

```
src/
  three/        3D-scenen: lokationer, modeller, effekter, hytten og dens minispil
  components/   Brugerfladen oven på scenen: HUD, regneopgave, butik, mål, indstillinger
  logic/        Spilregler uden brugerflade: regnemotor, fangstmotor, XP, gem/indlæs
  data/         Indhold: fisk, lokationer, butik, mål, opgavetyper
  store/        Zustand-stores med spillets tilstand
  audio/        Lydmotor og lydeffekter
  types/        Fælles typer
tests/          Tests af logik og data
apps/sound-lab/ Selvstændigt værktøj til at afprøve spillets lyde
public/         Statiske filer, bl.a. akvarie-minispillet (minigames/aquarium.html)
references/     Dokumentation af matematiksystemet
```

De vigtigste indgange:

- `src/logic/math-engine.ts` laver alle regneopgaver; `src/data/math-config.ts` bestemmer, hvilke
  opgavetyper hvert farvand tilbyder.
- `src/logic/catch-engine.ts` afgør, hvad der bider på krogen.
- `src/logic/game-persistence.ts` gemmer og indlæser spillet.
- `src/data/fish.ts` indeholder alle fisk og andre fangster.

Fiske-editoren og admin-panelet indlæses kun under udvikling og er ikke med i produktionsbuildet.

## Tests

`npm test` kører testene i `tests/`. De dækker spillogikken og data, ikke 3D-grafik eller
brugerflade:

- at facit passer til den viste opgave for alle opgavetyper og sværhedsgrader
- at fangster hører til på stedet og kræver det rigtige udstyr
- at gemte spil kan indlæses igen uden tab, og at ødelagte gem ikke får spillet til at gå ned
- at fisk, lokationer, butik og mål hænger sammen

## Gemte spil

Spillet gemmes under nøglen `regnefisken_save` i `localStorage`. Formatet har et versionsnummer,
`SAVE_FORMAT_VERSION` i `src/data/version.ts`.

**Hæv kun versionsnummeret med omtanke.** Et gemt spil med lavere version slettes ved opstart, og
spilleren begynder forfra; kun skærm- og lydindstillinger bevares. Nye felter kan tilføjes uden at
hæve versionen, så længe indlæsningen tåler, at feltet mangler.

## Udgivelse

Den offentlige udgave bygges og udgives af Netlify fra grenen `main`. Alt, der flettes til `main`,
går derfor direkte ud til spillerne. Nyt arbejde laves på en anden gren og flettes først, når det
er afprøvet.

Build-indstillingerne ligger i Netlifys egen opsætning; der er ingen `netlify.toml` i repoet.
`npm run build` lægger det færdige site i `dist/`.
