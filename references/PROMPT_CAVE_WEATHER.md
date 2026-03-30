# Prompt: Grotte-vejrsystem med dryp-effekter

## Kontekst

Grotten ("Den Mørke Grotte", `locationId === 'cave'`) bruger i dag den **standard Markov-vejrkæde** (`pickStandardNext`), hvilket betyder at vejret kan skifte til `rain`, `storm` osv. — og dermed udløse **tordenblink** (hvid fuldskærms-flash via `LightningOverlay`) og **tordenlyd** inde i grotten. Det ser helt forkert ud.

Grotten undertrykker allerede:
- Regnpartikler (`WeatherParticles.tsx` linje 40-41: `outdoors = currentLocation !== 'cave'`)
- Bølger (`waterWaves.ts` tvinger `getWeatherEntry('clear')` i cave)
- Himmel (`SKY_OFF_LOCATIONS` inkluderer `cave`)
- Skyer (disabled i `backgroundZBounds.ts`)

Men **tordenblink og tordenlyd kører stadig globalt** fordi `scheduleFlash()` i `useWeatherEngine.ts` (linje 296-329) ikke checker `currentLocation`.

## Opgave

Implementer et dedikeret grotte-vejrsystem. **Rør IKKE ved eksisterende belysning, tåge, fog, lys eller caveMode-logik** — alt det fungerer allerede perfekt. Opgaven har to dele:

---

## Del 1: Grotte-vejrkæde (blokér storm/regn/torden)

**Fil: `src/hooks/useWeatherEngine.ts`**

1. Tilføj `CAVE_LOCATIONS` set (ligesom `SUNNY_LOCATIONS` og `ARCTIC_LOCATIONS`):
```typescript
const CAVE_LOCATIONS = new Set(['cave']);
function isCaveLocation(locationId: string): boolean {
  return CAVE_LOCATIONS.has(locationId);
}
```

2. Tilføj `toCaveWeather()` konverteringsfunktion (ligesom `toArcticWeather`). Mapper ugyldige vejrtyper ved ankomst:
```typescript
function toCaveWeather(weather: WeatherTypeId): WeatherTypeId {
  if (weather === 'rain' || weather === 'storm' || weather === 'snowstorm' || weather === 'snow') return 'clear';
  return weather; // clear, overcast, fog passerer
}
```

3. Tilføj `pickCaveNext()` Markov-kæde. Grotten skifter **kun** mellem `clear`, `overcast` og `fog` — aldrig `rain`/`storm`/`snow`/`snowstorm`:
```typescript
function pickCaveNext(current: WeatherTypeId): WeatherTypeId {
  const r = Math.random();
  switch (current) {
    case 'clear':
      return r < 0.35 ? 'fog' : r < 0.55 ? 'overcast' : 'clear';
    case 'fog':
      return r < 0.45 ? 'clear' : r < 0.65 ? 'overcast' : 'fog';
    case 'overcast':
      return r < 0.45 ? 'clear' : r < 0.65 ? 'fog' : 'overcast';
    default:
      return 'clear';
  }
}
```

4. I `pickNextWeather()` — tilføj cave-check **før** Arctic-checket:
```typescript
if (isCaveLocation(locationId)) {
  return pickCaveNext(current);
}
```

5. I effekten der håndterer location-skift (linje 202-214) — tilføj cave-konvertering (ligesom Arctic):
```typescript
if (isCaveLocation(currentLocation)) {
  const converted = toCaveWeather(weatherType);
  if (converted !== weatherType) {
    useGameStore.getState().setWeatherType(converted);
  }
}
```

6. I `scheduleFlash()` (linje 301-318) — tilføj cave-guard så lyn aldrig vises i grotten:
```typescript
function scheduleFlash() {
  const st = useGameStore.getState();
  if (cancelled || !st.thunderActive) return;
  if (isCaveLocation(st.currentLocation)) return;   // ← TILFØJ
  // ... resten uændret
}
```
Og tilsvarende i den indre timeout-callback (inden `setShowLightning(true)`) — check også `isCaveLocation(st2.currentLocation)`.

7. I `syncRainVolume()` — sikr at regnlyd er 0 i grotten:
Ingen ændring nødvendig her da cave-vejret aldrig er `rain`/`storm`.

8. Undertryk vejr-toasts i grotten. I `applyTransition()` — tilføj guard:
```typescript
if (isCaveLocation(useGameStore.getState().currentLocation)) {
  // Ingen vejr-toasts i grotten
} else {
  // eksisterende toast-logik
}
```

---

## Del 2: Grotte-dryp — 3D-partikler + lyd

Tilføj vanddråber der falder fra loftet med jævne mellemrum og en blød dryp-lyd.

### Ny fil: `src/three/effects/CaveDrips.tsx`

Opret en R3F-komponent `CaveDrips` der:

1. **Spawner dryp-partikler** fra tilfældige positioner i loftet:
   - Brug en pool af ~8-12 "aktive dryp" slots
   - Hvert dryp er en lille sfære (radius ~0.03-0.05) med let transparent, lyseblåt materiale (`color: 0x88ccff`, `opacity: 0.6`, `transparent: true`)
   - Startposition: `x` i range [-12, 12], `y` start fra ~7-9 (lofthøjde, se stalaktitter i `Cave.tsx` ved y≈8.5), `z` i range [-15, 10]
   - Dråben falder med acceleration (gravity): `vy -= 0.003` per frame, `y += vy`
   - Når `y < -2` (vandoverfladen): fjern dråben, afspil dryp-lyd, spawn en lille "ripple" (valgfrit: bare fjern dråben)

2. **Timing**: Ny dråbe spawner med tilfældigt interval mellem 800ms og 3000ms. Ikke alle på én gang — stagger dem. Brug `useRef` til at tracke næste spawn-tid.

3. **Dryp-lyd**: Kald `playSoundEffect('cave_drip')` når en dråbe rammer vandet.

### Tilføj i `src/audio/audioEngine.ts`

Tilføj ny case `'cave_drip'` i `playSoundEffect()` switch. Synteser en blød dryp-lyd:
```typescript
case 'cave_drip': {
  osc.type = 'sine';
  const freq = 1200 + Math.random() * 800; // variation 1200-2000 Hz
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + 0.15);
  gain.gain.setValueAtTime(0.04 + Math.random() * 0.03, now); // svag volume
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.start(now);
  osc.stop(now + 0.15);
  break;
}
```
Lyden skal være kort (150ms), svag, og med let random variation i frekvens så det lyder naturligt. Volume skal være lavt (0.04-0.07) — det er ambient, ikke en alert.

### Tilføj i `src/data/audio.ts`

Tilføj `'cave_drip'` til `SOUND_IDS` array.

### Mount i `src/three/environments/LocationScenery.tsx`

Tilføj `<CaveDrips />` ved siden af `<CaveLazy />` i cave-blokken:
```tsx
{locationId === 'cave' ? (
  <Suspense fallback={null}>
    <CaveLazy />
    <CaveDrips />
  </Suspense>
) : null}
```

Import `CaveDrips` normalt (ikke lazy — det er en letvægts partikelkomponent).

---

## Vigtige begrænsninger

- **Rør IKKE** ved `computeEnvironmentFrame()` i `environment.ts` — cave-belysning, tåge, fog, hemi/spot fungerer allerede.
- **Rør IKKE** ved `SceneEnvironment.tsx` — cave-lys styres allerede korrekt der.
- **Rør IKKE** ved `CaveFillLights.tsx` eller `lanternNightFill.ts`.
- **Rør IKKE** ved `WaterSurface.tsx` cave-logik.
- Dag/nat-cyklen (`computeDayNightPhase`, `DAY_NIGHT_EPOCH_MS`) kører uændret globalt — den påvirker ikke cave-belysningen (cave returnerer tidligt i `computeEnvironmentFrame`), men spillerens dag/nat-ur fortsætter normalt.
- `WeatherWidget` behøver ingen ændringer — den viser bare hvad `weatherType` er, og `clear`/`overcast`/`fog` har allerede ikoner/navne.
- Grotten har **ikke** `darkLocation: true` i `specialRules` — lad det være som det er.
- Brug den eksisterende `det(i, j)` hash-funktion fra `Cave.tsx` hvis du har brug for deterministisk random i dryp-positioner (men dryp-timing skal være runtime-random).

## Filer der skal ændres/oprettes

| Fil | Handling |
|-----|---------|
| `src/hooks/useWeatherEngine.ts` | Tilføj `CAVE_LOCATIONS`, `isCaveLocation`, `toCaveWeather`, `pickCaveNext`, cave-guards i `pickNextWeather`, `scheduleFlash`, location-effekt, toast-guard |
| `src/data/audio.ts` | Tilføj `'cave_drip'` til `SOUND_IDS` |
| `src/audio/audioEngine.ts` | Tilføj `case 'cave_drip'` i `playSoundEffect` switch |
| `src/three/effects/CaveDrips.tsx` | **NY FIL** — dryp-partikler med gravity + lyd |
| `src/three/environments/LocationScenery.tsx` | Mount `<CaveDrips />` i cave-blokken |
