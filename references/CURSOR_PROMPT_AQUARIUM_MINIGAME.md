# Opgave: Integrer akvarie-minigame i fiskehytten

## Kontekst

Jeg har placeret en standalone HTML-fil i `public/minigames/aquarium.html`. Det er et komplet 3D-akvariespil (vanilla Three.js, ~2100 linjer, én fil). Filen er allerede tilpasset til iframe-integration med følgende:

- En "🏠 Tilbage til hytten"-knap der kalder `window.parent.postMessage({ type: 'aquarium-exit' }, '*')`
- Et `window.onload`-signal: `window.parent.postMessage({ type: 'aquarium-ready' }, '*')`
- Escape-tasten sender også `aquarium-exit` (med guards: fish-creator-modal → cat-mode → hammer-mode → exit, i den prioritet)
- Knappen skjuler sig selv automatisk når filen åbnes standalone (uden iframe)

## Hvad der skal implementeres

### 1. Ny state i `useGameStore.ts`

Tilføj `showAquariumGame: boolean` (default `false`) og `setShowAquariumGame: (show: boolean) => void`. Dette er session-only state (ikke persisteret).

### 2. Akvarie-hitbox klik i `CabinFurnitureDrag.tsx`

I pointer down-handleren, tilføj et nyt raycast-tjek for akvariet. Det skal:

- KUN trigge når `furnitureMode === false` (ligesom skildpadde-klikket)
- Tjekke om det ramte objekt har `userData.movableType === 'aquarium'`
- Ved hit: kald `setShowAquariumGame(true)` og return (ingen yderligere interaktion)
- Placeres i prioritetskæden EFTER dør-klik og EFTER skildpadde-klik, men FØR return-guarden for "ikke i furniture mode"

Prioritetskæden skal altså være:
1. Dør → rejsemenu (uændret)
2. Skildpadde → turtle modal (uændret)  
3. **NY: Akvarium → setShowAquariumGame(true)**
4. Ikke i furniture mode → return (uændret)
5. Furniture mode drag-logik (uændret)

### 3. Ny komponent: `AquariumGameOverlay.tsx`

Opret `src/three/cabin/AquariumGameOverlay.tsx`. Det er en React DOM-komponent (IKKE R3F) der:

- Rendres betinget når `showAquariumGame === true`
- Viser en fuldskærms overlay med følgende faser:

**Fase 1 — Zoom-in animation (500-800ms):**
- En CSS-animeret overlay der simulerer "zoom ind i akvariet"
- Start: mørkeblå baggrund med vignette-effekt, evt. boble-animation
- Formål: maskere iframe-loadtid og give en smooth overgang

**Fase 2 — Iframe aktiv:**
- `<iframe src="/minigames/aquarium.html" />` fuldskærm, ingen border/scrollbar
- Lyt på `message`-events fra iframe:
  - `aquarium-ready` → fjern evt. loading-indikator (boble-overlay)
  - `aquarium-exit` → start zoom-ud animation

**Fase 3 — Zoom-ud animation (300-500ms):**
- Omvendt af zoom-in
- Når animationen er færdig: `setShowAquariumGame(false)`

CSS for overlay: `position: fixed; inset: 0; z-index: 99999;` — over alt andet inkl. CabinFurnitureBar.

### 4. Montering i `Experience.tsx` eller app-niveau

`AquariumGameOverlay` er en DOM-komponent, ikke R3F. Den skal monteres udenfor `<Canvas>` — f.eks. i samme fil/komponent hvor `CabinFurnitureBar` monteres, eller i app-roden. Den skal kun rendres når `currentLocation === 'fishing_cabin'`.

## Vigtige tekniske noter

- Iframe'en loader Three.js r128 fra CDN — det er en ANDEN instans end R3F's Three.js og konflikter ikke.
- Mens iframe er aktiv, kan R3F-canvas'et gerne forblive monteret bag overlay'et (det er skjult visuelt). Unmounting er ikke nødvendigt.
- `showAquariumGame` er session-only — behøver ikke persisteres i localStorage.
- Exit-knappen og Escape-tasten i iframe'en håndterer allerede `postMessage` — React-komponenten skal bare lytte.
- Iframe skal have `allow="fullscreen"` attributten, da akvariet har en fuldskærmsknap.

## Filer der skal oprettes/ændres

| Fil | Ændring |
|-----|---------|
| `src/store/useGameStore.ts` | Tilføj `showAquariumGame` + setter |
| `src/three/cabin/CabinFurnitureDrag.tsx` | Tilføj akvarie-raycast i pointer down |
| `src/three/cabin/AquariumGameOverlay.tsx` | **NY FIL** — overlay med zoom + iframe |
| Filen der monterer `CabinFurnitureBar` | Tilføj `<AquariumGameOverlay />` ved siden af |

## Hvad der IKKE skal ændres

- `public/minigames/aquarium.html` — filen er færdig, rør den ikke
- `FishingCabin.tsx` — akvariet har allerede `userData.movableType: 'aquarium'` og behøver ingen ændringer
- Ingen nye npm-pakker nødvendige
