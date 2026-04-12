# Implementeringsplan: Mobil-version — Top 10

> **Formål:** Gør Regnefisken fuldt spillebar på mobil og tablet.  
> **Arkitektur:** Vite + React + Three.js (R3F) + Zustand + Tailwind  
> **Konvention:** Alle nye komponenter bruger `touch-manipulation` og minimum 44×44 px touch-targets.

---

## Fase 1 — Fælles fundament: Mobildetektering

> Alt mobilarbejde bygger på én konsistent kilde til "er vi på mobil?". Lige nu er der tre uafhængige mekanismer der modsiger hinanden.

### 1.1 Implementér `useIsMobile` hook

**Fil:** `src/hooks/useIsMobile.ts`  
**Status nu:** Stub der altid returnerer `false`.

```ts
// Ønsket implementering:
// - Abonnér på window resize + orientationchange
// - Returner true når uiMode === 'mobile' (fra useUIStore)
// - Alternativt: brug window.innerWidth <= 1024 || window.innerHeight <= 800
//   (samme logik som StartScreen.tsx linje 25-26)
// - Returner { isMobile, isTablet, isPortrait }
```

**Krav:**
- Hook'et skal lytte på `resize` og `orientationchange` events
- Skal returnere reaktiv state (ikke bare en engangsmåling)
- Overvej at eksponere `isTablet` (768–1024px) som separat flag
- Brug debounce (150ms) på resize for at undgå re-renders

### 1.2 Synkronisér `useMathStore.showNumberPad` med `uiMode`

**Fil:** `src/store/useMathStore.ts` (linje 45-48)  
**Problem:** NumberPad aktiveres ved `window.innerWidth < 768`, men tablets (f.eks. iPad 1024px) falder udenfor.

**Ændring:**
- Ved spilstart (`StartScreen.tsx`): Sæt `showNumberPad = true` når `uiMode === 'mobile'`
- Alternativt: Lyt på `useUIStore.uiMode` ændringer og synkronisér

### 1.3 Deprecér alle steder der hardcoder mobildetektering

**Filer at auditere:**
- `src/components/screens/StartScreen.tsx` (linje 25-26) — primær kilde, behold som autoritativ
- `src/store/useMathStore.ts` (linje 45-48) — erstat med uiMode-check
- `src/logic/auto-detect-graphics.ts` — bruger userAgent + touchPoints, OK som er

---

## Fase 2 — Jungle-ø mobilnavigation (KRITISK)

> Jungle-øen er 100% utilgængelig på mobil. WASD + pointer lock + E/Q tastatur er den eneste input.

### 2.1 Tilføj `jungleFishRequest` til GameStore

**Fil:** `src/store/useGameStore.ts`

Tilføj nyt felt til interface og store:
```ts
// I GameState interface:
jungleFishRequest: 'enter' | 'exit' | null;
setJungleFishRequest: (v: 'enter' | 'exit' | null) => void;

// I create():
jungleFishRequest: null,
setJungleFishRequest: (jungleFishRequest) => set({ jungleFishRequest }),
```

### 2.2 Opret `JungleTouchControls` komponent

**Ny fil:** `src/components/mobile/JungleTouchControls.tsx`

Denne komponent vises KUN på `uiMode === 'mobile'` når `currentLocation === 'jungle_island'`.

**Indeholder:**
1. **Virtual joystick** (venstre side af skærm) til WASD-bevægelse
2. **Touch-area** (højre side) til kamera-rotation via drag
3. **Kontekst-knapper** der vises situationsbestemt

**Joystick-implementering:**
- Anbefalet: Brug `nipplejs` bibliotek (letvægts, touch-optimeret) ELLER custom implementation
- Output: normalized direction vector `{ x: number, y: number }` der mappes til bevægelsesretning
- Position: fixed bottom-left, ~120px diameter, semi-transparent
- Vis kun når `!jungleFishing`

**Kamera-rotation:**
- Højre halvdel af skærmen: `touchmove` delta → camera yaw/pitch
- Sensitivitet: justerbar, start med `0.003` (lidt højere end musens `0.002`)
- Clamp pitch til `PITCH_MIN`/`PITCH_MAX` (samme som mus)

### 2.3 Modificér `JunglePlayerController.tsx` til at acceptere touch-input

**Fil:** `src/three/environments/JunglePlayerController.tsx`

**Ændringer:**

1. **Eksponér bevægelses-input via ref/store** så touch-joysticken kan drive WASD:
   ```
   // Ny shared ref eller store-felt:
   // jungleMoveInput: { x: number, z: number } — normaliseret retning
   // jungleCameraInput: { dx: number, dy: number } — kamera-delta per frame
   ```

2. **Reagér på `jungleFishRequest`** i `useFrame`:
   ```
   // I useFrame, efter eksisterende jungleFishing-check:
   const req = useGameStore.getState().jungleFishRequest;
   if (req === 'enter') {
     // Kør samme logik som E-tast (linje 152-173)
     // Husk: setJungleFishRequest(null) efter håndtering
   }
   if (req === 'exit') {
     // Kør samme logik som Q-tast (linje 176-196)
     // Husk: setJungleFishRequest(null) efter håndtering
   }
   ```

3. **Skip pointer lock på mobil:**
   ```
   // I tryLock(): Check uiMode !== 'mobile' før requestPointerLock()
   // Pointer lock virker ikke / giver dårlig UX på mobile browsere
   ```

4. **Flet joystick-input i bevægelsesloop** (linje 299-334):
   ```
   // Eksisterende WASD-check erstattes med:
   // mx/mz = jungleMoveInput ELLER keyboard-input (det der er aktivt)
   ```

### 2.4 Erstat "Tryk E/Q" tekst med touch-knapper

**Fil:** `src/components/fishing/FishingControls.tsx`

**Ændring i jungle_island idle-state (linje 197-211):**

```
// NUVÆRENDE: Viser "Tryk E for at fiske" som pointer-events-none tekst
// NY LOGIK:
// if (uiMode === 'mobile' && nearJungleBucket) {
//   Vis klikbar knap: "🎣 Fisk her"
//   onClick: useGameStore.getState().setJungleFishRequest('enter')
// } else if (uiMode === 'desktop' && nearJungleBucket) {
//   Vis tekst: "Tryk E for at fiske" (som nu)
// }
```

**Ændring i jungleFishing idle-state (linje 357-391):**

```
// NUVÆRENDE (linje 361-363): "Tryk Q for at gå" som pointer-events-none tekst
// NY LOGIK:
// if (uiMode === 'mobile') {
//   Vis klikbar knap: "⬅ Gå tilbage"
//   onClick: useGameStore.getState().setJungleFishRequest('exit')
//   Position: fixed bottom-8, same styling som cast-button
// } else {
//   Vis tekst: "Tryk Q for at gå" (som nu)
// }
```

### 2.5 Tilføj hop-knap (valgfrit)

- Hop (mellemrum) er nice-to-have men ikke kritisk for gameplay
- Kan tilføjes som lille knap ved siden af joystick
- Prioritet: LAV — kun hvis der er tid

---

## Fase 3 — Orientering og viewport

### 3.1 Tilføj orienterings-detection og anbefaling

**Ny fil:** `src/components/mobile/OrientationGuard.tsx`

**Funktionalitet:**
- Lyt på `orientationchange` og `resize`
- Hvis `window.innerWidth < window.innerHeight` (portrait) OG `currentLocation === 'jungle_island'`:
  - Vis overlay med besked: "Drej din enhed for bedre oplevelse" + rotations-ikon
  - Overlay er dismissable (tryk for at lukke, husk valg i sessionStorage)
- For andre lokationer: Vis ikke — spillet fungerer OK i portrait

**Placering:** Renderes i `App.tsx`, kun aktiv på `uiMode === 'mobile'`

### 3.2 Opdatér DPR ved resize/orientationsskift

**Fil:** `src/three/useRendererSettings.ts`

**Ændring:**
- Tilføj `resize` event listener der genberegner DPR
- Brug `useEffect` med cleanup
- Debounce med 300ms for at undgå thrashing

---

## Fase 4 — Math/Touch-input forbedringer

### 4.1 Verificér NumberPad-aktivering på tablets

**Fil:** `src/components/fishing/MathChallenge.tsx`

**Test-scenarie:**
- iPad (1024px bredde): `uiMode` sættes til `mobile` men `showNumberPad` er `false` (768px threshold)
- Android tablet (800px bredde): Samme problem muligt

**Fix:**
- I `MathChallenge.tsx`: Tilføj fallback-check:
  ```
  const effectiveShowNumpad = showNumberPad || uiMode === 'mobile';
  ```
- Eller: Synkronisér i Fase 1.2

### 4.2 Test og fix matematik-overflow på smalle skærme

**Fil:** `src/components/fishing/MathChallenge.tsx`

**Problem:** Font-size `clamp(2rem, 7vw, 4.5rem)` kan give overflow på 320px skærme med lange udtryk.

**Ændringer:**
- Tilføj `overflow-wrap: break-word` på opgave-containeren
- Overvej `clamp(1.5rem, 5vw, 4.5rem)` for `window.innerWidth < 400`
- Test specifikt med: brøker, store tal (4+ cifre), division-opgaver

### 4.3 Skjul native keyboard når NumberPad er aktiv

**Fil:** `src/components/fishing/MathChallenge.tsx`

**Problem:** Hvis input-feltet fokuseres på mobil, popper native keyboard op OVER NumberPad.

**Fix:**
- Når `showNumberPad === true`: sæt `readOnly` på input-feltet
- NumberPad driver allerede `setUserAnswer` direkte — input-feltet er kun display
- Alternativt: brug `inputMode="none"` på input-elementet

---

## Fase 5 — Kabine-forbedringer

### 5.1 Forstør akvarium exit-knap touch-target

**Fil:** `public/minigames/aquarium.html` (linje 68-95)

**Ændring:**
```css
#btn-exit-to-cabin {
  /* Nuværende: padding: 10px 20px */
  padding: 14px 24px;       /* Større touch-target */
  min-height: 48px;          /* Minimum 48px høj (Google anbefaling) */
  touch-action: manipulation; /* Fjern 300ms delay */
  -webkit-tap-highlight-color: transparent;
}
```

### 5.2 Tilføj mobil-navigation-knap i kabinen (valgfrit)

**Fil:** `src/components/hud/MobileHUD.tsx`

**Nuværende:** MobileHUD viser kun XP, vejr, streak — ingen navigationsknapper.

**Tilføjelse:**
- Når `isCabinLocation(currentLocation)` og `uiMode === 'mobile'`:
  - Vis en lille navigations-FAB (floating action button) i bunden
  - Ved tryk: Åbn et simpelt panel med rum-valg (Stue / Køkken / Soveværelse / Rejs)
  - Brug `runLocationTravel()` for rum-skift (samme som dør-klik)
- **Prioritet:** MEDIUM — dørene virker allerede via touch, men UX er bedre med dedikeret knap

---

## Fase 6 — MobileBag forbedringer

### 6.1 Tilføj swipe-to-dismiss på MobileBag

**Fil:** `src/components/mobile/MobileBag.tsx`

**Nuværende:** Bottom sheet lukkes kun via backdrop-klik eller Escape.

**Tilføjelse:**
- Track `touchstart` Y-position
- På `touchmove`: Beregn delta-Y, translateY med delta
- På `touchend`: Hvis delta > 100px nedaf → luk bag (`setIsBagOpen(false)`)
- Ellers: Animer tilbage til position
- Brug `requestAnimationFrame` for smooth animation

---

## Fase 7 — Boss-fight mobil-tilpasning

### 7.1 Skalér boss-UI til mobil

**Fil:** `src/components/fishing/MathChallenge.tsx`

**Ændringer:**
- Boss-indikator (rød border + shaking): Reducér shake-amplitude på mobil
  - Desktop: `translateX(±4px)` → Mobil: `translateX(±2px)`
- Boss-titel: Skalér med `clamp()` i stedet for fast størrelse
- Fight-stage bars: Sikr at de ikke overflower på smalle skærme
- Test: Start en boss-fight på 375px bred skærm

---

## Fase 8 — Touch-targets audit

### 8.1 Auditér alle interaktive elementer

**Minimumskrav:** 44×44 CSS-pixels (Apple HIG) / 48×48 dp (Material Design)

**Filer at gennemgå:**
| Komponent | Fil | Status |
|---|---|---|
| Fishing cast button | `FishingControls.tsx` | ✅ OK (px-16 py-6) |
| BID! button | `FishingControls.tsx` | ✅ OK (px-16 py-8) |
| NumberPad keys | `mobile/NumberPad.tsx` | ✅ OK (py-4) |
| MobileBag tabs | `mobile/MobileBag.tsx` | ⚠️ Tjek scroll-tabs |
| NPC-klik i jungle 3D | `JunglePlayerController.tsx` | ⚠️ Raycasted, svært at ramme |
| Akvarium exit | `aquarium.html` | ⚠️ 10px padding → fix i 5.1 |
| Klædeskab knapper | `WardrobeModal.tsx` | ✅ OK (h-8 w-8 minimum) |
| Settings toggles | `ScreenSettings.tsx` | ⚠️ Tjek slider touch-area |
| Kabine møbel-knapper | `CabinFurnitureBar.tsx` | ✅ OK (touch-manipulation) |

**NPC-klik fix:**
- Jungle NPC-interaktion bruger raycast fra skærmens centrum (sigtekorn)
- På mobil: Overvej at forstørre hitbox-radius eller tilføje on-screen tap-to-interact

---

## Fase 9 — `useReducedMotion` implementering

### 9.1 Implementér hooket

**Fil:** `src/hooks/useReducedMotion.ts`  
**Status nu:** Stub der returnerer `false`.

```ts
// Ønsket implementering:
// 1. Læs useUIStore.reducedMotion (brugerens manuelle toggle)
// 2. Læs window.matchMedia('(prefers-reduced-motion: reduce)')
// 3. Returner true hvis ENTEN er aktiv
// 4. Abonnér på MediaQueryList.addEventListener('change') for live-opdatering
```

### 9.2 Brug hooket i effekt-komponenter

**Filer at opdatere:**
- `src/three/effects/GameEffects.tsx` — skip sparkle-animationer
- `src/three/effects/WeatherParticles.tsx` — reducer/skip partikler
- `src/three/effects/WaterSurface.tsx` — reducer wave-amplitude
- `src/three/effects/SkyClouds.tsx` — stop sky-bevægelse
- `src/components/effects/LightningOverlay.tsx` — skip flash
- `src/components/fishing/MathChallenge.tsx` — skip boss shake-animation

---

## Fase 10 — Test og verifikation

### 10.1 Manuel test-matrix

| Device | Test-punkt | Forventet |
|---|---|---|
| iPhone SE (375px) | Matematik-opgaver med store tal | Ingen overflow |
| iPhone 14 (390px) | Jungle joystick + fiskeri | Smooth bevægelse |
| iPad (1024px) | NumberPad aktiveres | Ja |
| iPad landscape | Kabine-navigation | Dørene klikbare |
| Android budget (320px) | Boss-fight UI | Ingen clipping |
| Android tablet (800px) | Klædeskab + spejl | Touch virker |

### 10.2 Performance-test

- Kør jungle-ø på Moto G (budget Android) i 5 min → tjek for frame drops
- Kør akvarium-iframe på iPhone SE → tjek memory og scroll-performance
- Kør boss-fight med NumberPad på iPad mini → tjek input-latency

---

## Prioriteret rækkefølge

| Prio | Fase | Beskrivelse | Estimat |
|------|------|-------------|---------|
| 🔴 P0 | 2 | Jungle-ø touch-controls + E/Q knapper | 6-8 timer |
| 🔴 P0 | 1 | useIsMobile + NumberPad synkronisering | 1-2 timer |
| 🟡 P1 | 4 | Math-input: NumberPad på tablet + overflow + native keyboard | 2-3 timer |
| 🟡 P1 | 5.1 | Akvarium exit-knap touch-target | 15 min |
| 🟡 P1 | 9 | useReducedMotion implementering | 2-3 timer |
| 🟢 P2 | 3 | Orienterings-guard + DPR resize | 1-2 timer |
| 🟢 P2 | 6 | MobileBag swipe-to-dismiss | 1-2 timer |
| 🟢 P2 | 7 | Boss-fight mobil-skalering | 1 time |
| 🟢 P2 | 8 | Touch-target audit | 1-2 timer |
| 🟢 P2 | 5.2 | Kabine mobil-nav-knap | 2-3 timer |

---

## Filnøgle — Alle berørte filer

```
src/hooks/useIsMobile.ts                          ← Fase 1.1
src/hooks/useReducedMotion.ts                     ← Fase 9.1
src/store/useGameStore.ts                         ← Fase 2.1
src/store/useMathStore.ts                         ← Fase 1.2
src/store/useUIStore.ts                           ← Reference
src/three/environments/JunglePlayerController.tsx  ← Fase 2.3
src/components/fishing/FishingControls.tsx         ← Fase 2.4
src/components/fishing/MathChallenge.tsx           ← Fase 4.1, 4.2, 4.3, 7.1
src/components/mobile/NumberPad.tsx                ← Reference
src/components/mobile/MobileBag.tsx                ← Fase 6.1
src/components/mobile/BagButton.tsx                ← Reference
src/components/hud/MobileHUD.tsx                   ← Fase 5.2
src/three/useRendererSettings.ts                   ← Fase 3.2
src/three/effects/GameEffects.tsx                  ← Fase 9.2
src/three/effects/WeatherParticles.tsx             ← Fase 9.2
src/three/effects/WaterSurface.tsx                 ← Fase 9.2
src/three/effects/SkyClouds.tsx                    ← Fase 9.2
src/three/cabin/CabinFurnitureDrag.tsx             ← Reference
public/minigames/aquarium.html                     ← Fase 5.1
src/components/screens/StartScreen.tsx             ← Fase 1.3

NY FIL:
src/components/mobile/JungleTouchControls.tsx      ← Fase 2.2
src/components/mobile/OrientationGuard.tsx         ← Fase 3.1 (valgfrit)
```
