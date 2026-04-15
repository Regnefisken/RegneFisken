# Regnefisken — Tvungen reset ved udgivelse

## Baggrund og mål

Ved udgivelse af v1.0 skal **alle** eksisterende browser-spillere starte forfra næste gang de åbner spillet. Resetten skal være usynlig — ingen dialog, ingen fejlbesked. Spillet starter bare "frisk" som om brugeren aldrig har spillet før.

---

## Vurdering af den eksisterende mekanisme

Composer foreslog at bumpe `SAVE_FORMAT_VERSION` i `src/data/version.ts`. Det er fundamentalt rigtigt — mekanismen er allerede bygget ind i `bootstrapPersistence()` i `src/logic/game-persistence.ts` (linje 689-694). Når `savedFmt < SAVE_FORMAT_VERSION`, springes `applyGameSave()` over, og alle Zustand-stores forbliver på defaults.

**Men der er et reelt problem med den nuværende implementering:** Når version-mismatch rammer, sker der dette (linje 691):

```ts
useSaveStore.setState({ lastLoaded: migrateSave(parsed), hydrated: true });
```

`migrateSave()` spreder det gamle save-objekt ind i det nye (`{ ...o, version: SAVE_FORMAT_VERSION }`). Derefter starter `startPersistenceSubscription()`, som debounce-skriver et nyt save baseret på de **nuværende** Zustand-stores (som nu er rene defaults). Det virker — men det gamle save ligger stadig i `lastLoaded` og potentielt i `localStorage` i det korte vindue mellem load og første auto-save.

Der er også **tre** localStorage-nøgler i spillet, ikke kun `regnefisken_save`:

| Nøgle | Fil | Funktion |
|-------|-----|----------|
| `regnefisken_save` | `src/logic/save-load.ts:4` | Hoved-save |
| `regnefisken_gpu_bench` | `src/logic/auto-detect-graphics.ts:13` | GPU-benchmark cache |
| `regnefisken_jungle_orientation_hint_dismissed` | `src/components/mobile/OrientationGuard.tsx:5` | Session-hint flag |

Ved en hård reset bør alle tre ryddes for at undgå stale data.

---

## Anbefalet tilgang

Composers forslag er den rigtige retning. Nedenfor er en strammet version der lukker kanttilfældene.

### Trin 1 — Bump versioner i `src/data/version.ts`

```ts
export const APP_VERSION = '1.0';          // eller hvad release-versionen er
export const SAVE_FORMAT_VERSION = 15;     // var 14
```

### Trin 2 — Ryd localStorage eksplicit ved version-mismatch

I `src/logic/game-persistence.ts`, erstat den nuværende version-mismatch-gren (linje 689-694) med:

```ts
if (savedFmt < SAVE_FORMAT_VERSION) {
  // Hård reset: fjern alt gammel data
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem('regnefisken_gpu_bench');
  localStorage.removeItem('regnefisken_jungle_orientation_hint_dismissed');

  useUIStore.getState().setNeedsReset(true);
  useSaveStore.setState({ lastLoaded: null, hydrated: true });
  startPersistenceSubscription();
  startGoalProgressSubscription();
  return;
}
```

**Hvad ændrede sig:**

1. `localStorage.removeItem(SAVE_KEY)` — det gamle save slettes med det samme i stedet for at leve videre til auto-save overskriver det. Ingen race condition.
2. `lastLoaded` sættes til `null` i stedet for `migrateSave(parsed)` — der er ingen grund til at migrere et save vi alligevel kasserer.
3. De to andre nøgler ryddes også, så GPU-benchmarken kører igen (relevalt hvis grafikindstillinger har ændret sig) og orientation-hintet vises igen for nye brugere.

### Trin 3 — Overvej at bevare brugerens UI-præferencer (valgfrit)

Hvis du vil give en lidt blødere oplevelse, kan du bevare udvalgte indstillinger selvom save-data nulstilles. Det kræver en lille ekstra blok **før** `removeItem`:

```ts
if (savedFmt < SAVE_FORMAT_VERSION) {
  // Bevar udvalgte indstillinger fra det gamle save
  const preserveKeys = ['isMuted', 'fontSize', 'uiScale', 'graphicsQuality',
                        'reducedMotion', 'highContrast', 'colorBlindMode'] as const;
  const preserved: Record<string, unknown> = {};
  for (const key of preserveKeys) {
    if (o[key] !== undefined) preserved[key] = o[key];
  }

  // Ryd alt
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem('regnefisken_gpu_bench');
  localStorage.removeItem('regnefisken_jungle_orientation_hint_dismissed');

  // Genanvend UI-præferencer
  const u = useUIStore.getState();
  if (typeof preserved.isMuted === 'boolean') u.setIsMuted(preserved.isMuted);
  if (typeof preserved.fontSize === 'number') u.setFontSize(preserved.fontSize);
  if (typeof preserved.uiScale === 'number') u.setUiScale(preserved.uiScale);
  if (typeof preserved.reducedMotion === 'boolean') u.setReducedMotion(preserved.reducedMotion);
  if (typeof preserved.highContrast === 'boolean') u.setHighContrast(preserved.highContrast);
  const gq = preserved.graphicsQuality;
  if (gq === 'low' || gq === 'medium' || gq === 'high' || gq === 'ultra') u.setGraphicsQuality(gq);
  const cbm = preserved.colorBlindMode;
  if (cbm === 'none' || cbm === 'deuteranopia' || cbm === 'protanopia' || cbm === 'tritanopia') u.setColorBlindMode(cbm);

  useUIStore.getState().setNeedsReset(true);
  useSaveStore.setState({ lastLoaded: null, hydrated: true });
  startPersistenceSubscription();
  startGoalProgressSubscription();
  return;
}
```

Dette er valgfrit men anbefales — det føles mere "seamless" at beholde brugerens lysstyrke, skala og tilgængelighed.

---

## Fremadrettet arkitektur (efter udgivelse)

### Bløde migrationer med bagudkompatibilitet

Den nuværende `migrateSave()` i `src/logic/save-load.ts` gør reelt ingenting ud over at sprede data og bumpe version. For fremtidige opdateringer bør den udvides til versionsstyret migration:

```ts
export function migrateSave(data: unknown): SaveData {
  if (data === null || typeof data !== 'object') {
    return { version: SAVE_FORMAT_VERSION };
  }
  const o = data as Record<string, unknown>;
  let version = typeof o.version === 'number' ? o.version
    : typeof o.v === 'number' ? o.v : 1;

  // Eksempel: v15 → v16 tilføjer nyt felt
  if (version < 16) {
    o.newFeatureEnabled = false;
    version = 16;
  }

  // Eksempel: v16 → v17 omdøber felt
  if (version < 17) {
    if (o.oldFieldName !== undefined) {
      o.newFieldName = o.oldFieldName;
      delete o.oldFieldName;
    }
    version = 17;
  }

  return { ...o, version: SAVE_FORMAT_VERSION } as SaveData;
}
```

Og i `bootstrapPersistence()` ændres logikken til at skelne mellem "blød" og "hård" migration:

```ts
// Hård reset: spring til næste major version
const HARD_RESET_BELOW = 15;  // Alle saves under denne → hård reset

if (savedFmt < HARD_RESET_BELOW) {
  // ... fuld reset som beskrevet ovenfor
  return;
}

if (savedFmt < SAVE_FORMAT_VERSION) {
  // Blød migration: bevar data, kør migrateSave()
  const data = migrateSave(parsed);
  applyGameSave(data);
  useSaveStore.setState({ lastLoaded: data, hydrated: true });
  startPersistenceSubscription();
  startGoalProgressSubscription();
  return;
}
```

### Patch notes

Bind `APP_VERSION` til det brugeren ser (versionsnummer i UI/patch notes). Bind `SAVE_FORMAT_VERSION` til hvornår saves skal migreres eller kasseres. De to bør altid bumpes uafhængigt af hinanden.

---

## Opsummering — minimumsindsats ved udgivelse

| Hvad | Hvor | Ændring |
|------|------|---------|
| Bump save-version | `src/data/version.ts` | `SAVE_FORMAT_VERSION = 15` |
| Bump app-version | `src/data/version.ts` | `APP_VERSION = '1.0'` |
| Eksplicit rydning | `src/logic/game-persistence.ts` linje 689-694 | `removeItem` på alle 3 nøgler, `lastLoaded: null` |
| (Valgfrit) Bevar UI-prefs | Samme sted | Udtræk indstillinger før rydning, genanvend efter |

Ingen andre filer behøver ændres. Eksisterende auto-save-logik klarer resten.
