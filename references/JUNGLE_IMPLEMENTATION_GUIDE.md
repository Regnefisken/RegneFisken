# Jungleøen — Trinvis Implementeringsguide

> Denne prompt er en implementeringsplan for Jungleøen (`jungle_island`) i Regnefisken.
> Hvert trin er selvstændigt testbart. **Stop efter hvert trin og lad mig teste inden du fortsætter.**

---

## Kontekst du SKAL kende

### Tech stack
- React 19 + Vite 8 + TypeScript + Tailwind CSS 4
- Three.js via React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- Zustand stores (`useGameStore`, `usePlayerStore`, `useUIStore`, `useCollectionStore`)
- **Alt 3D er proceduralt** — ingen glTF/OBJ, ingen sprites. Kun Three.js-geometri i TSX.

### Arkitektur
- Hele spillet kører i **én R3F-scene** (`Experience.tsx` inde i `GameCanvas.tsx`).
- "Lokationer" skiftes via `useGameStore.currentLocation` (en `LocationId`-string).
- Det delte shell (himmel, vand, tåge, lys) er altid aktivt og tager farver fra `LOCATIONS`-data.
- Lokationsspecifik geometri tilføjes i `LocationScenery.tsx` med betinget render.
- Fishing-equipment (stang, bobber, spand, linje) er aktive på alle locations undtagen `fishing_cabin`.

### Hvad der allerede eksisterer for jungle_island
- `LocationId: 'jungle_island'` i `src/types/locations.ts`
- `LOCATIONS.jungle_island` i `src/data/locations.ts` med farver (`bgColor: 0x1a4a1a`, `waterColor: 0x228855`, `fogColor: 0x1a3a1a`, `fogNear: 15, fogFar: 50`), `type: 'world'`
- Unlock-flow: `PlesioNpcModal.tsx` sætter `jungleDiscovered` + `questItems` og kalder `setCurrentLocation('jungle_island')`
- `LocationDock.tsx`: `jungle_island` er i `WOOD_IDS` (standard `Pier`)
- `backgroundZBounds` entry
- Persistence af `jungleDiscovered` i `usePlayerStore`

### Hvad der IKKE eksisterer endnu
- Ingen `JungleIsland.tsx` 3D-komponent
- Ingen branch i `LocationScenery.tsx` for `jungle_island`
- Fishing-equipment skjules IKKE på `jungle_island` (kun på `fishing_cabin`)
- `CameraRig.tsx` har ingen guard for `jungle_island`
- Ingen first-person controller
- Ingen jungle-specifik pier
- Ingen NPC på øen
- Ingen rejse-scene (`PlesiosaurusTravel`)

### Nøglefiler du skal læse/forstå inden du starter
- `src/three/Experience.tsx` — hovedscene-hierarki
- `src/three/environments/LocationScenery.tsx` — lokationsspecifik geometri
- `src/three/environments/LocationDock.tsx` — bro/mole per lokation
- `src/three/effects/CameraRig.tsx` — kamerapositioner
- `src/three/environments/TropicalIsland.tsx` — referenceimplementering for ø
- `src/three/environments/AmbientPierPlesiosaurus.tsx` — reference for NPC
- `src/store/useGameStore.ts` — game state
- `src/data/locations.ts` — lokationsdata

### Stilguide for 3D
- `meshStandardMaterial` med `roughness`/`flatShading`. Materialer i `useMemo`.
- Three.js primitiver: `boxGeometry`, `cylinderGeometry`, `sphereGeometry`, `dodecahedronGeometry`, `icosahedronGeometry`, `coneGeometry`.
- `castShadow` og `receiveShadow` på synlige meshes.
- Animation via `useFrame` med `useRef`.
- Farver som hex-numbers (`0x228B22`), ikke strings.
- Interaktion: `onPointerDown={(e) => { e.stopPropagation(); ... }}`.

---

## TRIN 1: Grundlæggende integration + skelet

### Mål
Når man rejser til `jungle_island`, skal fishing-equipment være skjult og en minimal placeholder-ø være synlig. Dette bekræfter at hele integrationsflowet virker.

### Opgaver

**1a. Skjul fishing-equipment på jungle_island**

I `src/three/Experience.tsx`:
- Variablen `isCabin` styrer om fishing-gear er skjult. Udvid denne logik til også at dække `jungle_island`.
- Opret en variabel som `const isWorldLocation = locationId === 'fishing_cabin' || locationId === 'jungle_island'` og brug den til at gate fishing-equipment (bucket, rod, bobber, line, cave lights, lantern).
- `FishPool` skal også skjules på jungle_island.
- `CabinFurnitureDrag` skal KUN vises på cabin (som nu).

**1b. Opret minimal JungleIsland.tsx**

Opret `src/three/environments/JungleIsland.tsx`:
- En simpel eksporteret `JungleIsland` komponent.
- Indhold for nu: en flad sand-cylinder centreret på `[0, -0.4, 14]` med radius 12.5 (øens grund-form). Brug `cylinderGeometry args={[12.5, 13.0, 0.8, 48]}` og en sand-farve (`0xc4a265`).
- Tilføj en enkelt mørk jord-cylinder ovenpå: position `[0, -0.05, 14]`, radius 9.8, højde 0.1, farve `0x241a0e`.
- Tilføj et enkelt test-træ i centrum `[0, 0, 26]` — en cylinder (stamme) + en icosahedron (bladkrone) — bare for at verificere skala og position.

**1c. Tilføj branch i LocationScenery.tsx**

I `src/three/environments/LocationScenery.tsx`:
- Importér `JungleIsland`.
- Tilføj: `{locationId === 'jungle_island' ? <JungleIsland /> : null}` før `<LocationDock />`.

### Sådan tester du
1. Start spillet, navigér til jungle_island (via PlesioNpcModal — kræver at du har `plesio_defeated` quest item, eller brug admin/dev tools til at sætte lokation direkte).
2. Verificér: fishing gear er IKKE synligt.
3. Verificér: en flad sand-disk og en mørk jord-disk er synlige med et enkelt træ.
4. Verificér: vand, tåge og himmel har jungle-farverne (dyb grøn).

**STOP HER — lad mig teste inden du fortsætter.**

---

## TRIN 2: Øens terræn og grundform

### Mål
Byg den komplette ø-form med concentriske lag.

### Opgaver

Udvid `JungleIsland.tsx`:

**Terræn-lag (nede → op):**
Øen er centreret på `[0, 0, 14]` (2.5 enheder dybere end TropicalIsland). Brug stablede `cylinderGeometry`-lag:

| Lag | Radius (top/bund) | Y-position | Højde | Farve | Beskrivelse |
|-----|-------------------|------------|-------|-------|-------------|
| Submarine base | 13.0 / 14.0 | -1.2 | 1.6 | `0x2a3a2a` | Undervandsbase |
| Sand-strand | 12.5 / 13.0 | -0.4 | 0.8 | `0xc4a265` | Ydre sand-ring |
| Overgangszone | 10.6 / 11.2 | -0.1 | 0.3 | `0x8a7a45` | Sand→jord overgang |
| Mørk jord | 9.8 / 10.2 | 0.0 | 0.2 | `0x241a0e` | Jungle-undergrund |
| Tæt skovbund | 7.5 / 8.5 | 0.05 | 0.15 | `0x1a1208` | Indre skovbund |
| Central bakke | 4.0 / 5.0 | 0.15 | 0.35 | `0x2a1a0e` | Let forhøjet center |

- Alle cylinder-lag skal bruge `segments: 48` for glat kant.
- Alle lag centreret på `z: 14` (øens centrum-offset).
- `receiveShadow` på alle terræn-meshes.
- Wrap materialer i `useMemo`.

### Sådan tester du
1. Navigér til jungle_island.
2. Verificér: øen har synlige koncentriske lag der ligner et naturligt terræn.
3. Verificér: stranden er synlig ved vandkanten, mørk jord i midten.
4. Kamera-vinklen (standard `CameraRig` idle position) bør give et overblik.

**STOP HER — lad mig teste.**

---

## TRIN 3: Procedurale jungletræer

### Mål
34 procedurale jungletræer med organiske stammer og bladkroner.

### Opgaver

I `JungleIsland.tsx`:

**Træ-komponent (`JungleTree`):**
- Props: `seed: number`, `height: number`, `position: [x, y, z]`.
- **Stamme:** 8–10 stablede cylinder-segmenter med aftagende radius. Brug seed til at variere hældning per segment (`Math.sin(seed + i * 0.3) * 0.15`). Farve: `0x3d2b18`.
- **Bladkrone:** 4 stablede `icosahedronGeometry`-kugler i faldende størrelse (detail: 1). Start fra toppen af stammen, forsat opad. Brug seed til at vælge blandt 3 grønne varianter:
  - Primær: `0x1a5c1a`
  - Accent (mørk): `0x144414`
  - Lys: `0x1e6e20`
- `castShadow` på stamme og blade.

**Træ-data array:**
- 34 træer fordelt i en ring/klynge-mønster rundt øens centrum.
- Placering: Majoriteten i radius 5–10 fra øens centrum (`[0, 0, 14]`), med enkelte tættere og enkelte ydre.
- Højder: 6.5–13 enheder. Det højeste (13) centralt ved `[0, 0, 26]`.
- Hvert træ har et unikt seed (brug index-baseret: `seed: 42 + i * 7`).
- Brug `useMemo` til at generere array'et.

**Eksempler på positioner** (x, z relativt til øens verden-koordinat):
- Centrum-cluster (4–5 træer): omkring `[0, 0, 26]`, `[-2, 0, 25]`, `[1.5, 0, 27]`...
- Ring (20+ træer): jævnt fordelt i radius 6–9 fra `[0, 14]` (dvs. z fra 5 til 23, x fra -9 til 9).
- Ydre (5–6 træer): radius 10–11, lavere højde (6.5–8).

### Sådan tester du
1. Navigér til jungle_island.
2. Verificér: 34 træer synlige med variation i højde, stamme-kurve og bladfarve.
3. Verificér: det centrale træ er markant højest.
4. Verificér: træerne ser organiske ud (ikke identiske).

**STOP HER — lad mig teste.**

---

## TRIN 4: Klipper, lianer og atmosfærisk lys

### Mål
Tilføj de resterende visuelle elementer: klipper, lianer og jungle-belysning.

### Opgaver

**4a. Klipper (8 stk)**

Komponent `JungleRock` med props: `position`, `scale`, `seed`.
- Kerne: `dodecahedronGeometry` med detail 1, farve `0x4a5040`.
- Mos-dæksel: Identisk dodecahedron, skaleret lidt større (`1.05×`), farve `0x2e4020`, med `transparent: true, opacity: 0.7`.
- Tilfældig rotation baseret på seed.
- Placér 8 klipper spredt på øen, primært i overgangszonen (radius 8–11 fra centrum).

**4b. Lianer (12 grupper)**

Komponent `LianaGroup` med props: `anchorPosition: [x, y, z]`, `seed`.
- Hvert sæt: 3–5 tynde cylinder-segmenter (`radius: 0.03–0.06`, `height: 2–4`) der hænger ned fra `anchorPosition`.
- Farve: `0x2e4a1a`.
- Animation i `useFrame`: gyngende bevægelse via `rotation.x = Math.sin(time * freq + seed) * amplitude`. Brug seed til at variere `freq` (0.3–0.8) og `amplitude` (0.05–0.15).
- Anchorpositions: vælg 12 punkter i trækronernes zone (tæt på top af diverse træer, y: 4–8, spredt i x/z).

**4c. Atmosfærisk lys (3 punktlys)**

Direkte i `JungleIsland` return:
- Grønt ambientlys: `<pointLight position={[0, 4, 26]} color={0x88cc44} intensity={0.6} distance={40} />`
- Varm fakkel 1: `<pointLight position={[-8, 2, 8]} color={0xcc8844} intensity={0.4} distance={20} />`
- Varm fakkel 2: `<pointLight position={[6, 2, 10]} color={0xcc8844} intensity={0.3} distance={18} />`

### Sådan tester du
1. Navigér til jungle_island.
2. Verificér: klipper med mos-dæksel synlige mellem træerne.
3. Verificér: lianer gynger blødt fra trækronerne.
4. Verificér: grønligt lys i centrum, varme toner ved stranden. Scenen føles mørk og atmosfærisk.

**STOP HER — lad mig teste.**

---

## TRIN 5: Jungle-pier (JunglePier)

### Mål
Erstat standard `Pier` med en mørk, forvitret junglekaj.

### Opgaver

**5a. Opret `src/three/environments/JunglePier.tsx`**

Baseret på `Pier.tsx`'s struktur, men med jungle-æstetik:

- **Planker:** Samme grid-mønster som `Pier` (z fra -1 til 11.2, step 0.28). Farve: `0x4a3520` (forvitret mørk eg). Lidt bredere gaps og mere variation i rotation.
- **Sidebjælker:** Farve: `0x3a2510` (mørkere). Lidt smallere.
- **Pæle:** Farve: `0x3a2510`. Tilføj alge-manchetter: en `cylinderGeometry` ring ved vandlinjen (y ≈ 0) på hver pæl, farve `0x2a4020`, radius lidt større end pælen, højde 0.3.
- **Mos-patches:** 4–6 flade box-geometrier placeret tilfældigt på plankerne, farve `0x2e4020`, skaleret fladt (0.5–1.0 × 0.02 × 0.3–0.6).
- **Jungleblade langs kanten:** Fra z ≈ 8.8 og fremad (ind mod øen) — 6–8 sfæriske blade (som `PalmLeaf` i TropicalIsland men mindre, farve `0x1a5c1a`) der "kravler ind" over plankekanterne.

**5b. Opdatér `LocationDock.tsx`**

- Importér `JunglePier`.
- Tilføj en tidlig return: `if (locationId === 'jungle_island') return <JunglePier />;` INDEN `WOOD_IDS`-checket.
- Fjern `'jungle_island'` fra `WOOD_IDS` Set'et.

### Sådan tester du
1. Navigér til jungle_island.
2. Verificér: molen er mørkere, mere forvitret end standard Pier.
3. Verificér: alger synlige på pæle ved vandlinjen.
4. Verificér: mos-patches og jungleblade langs kanterne.
5. Verificér: andre lokationer (pier, tropical_island) stadig har deres normale bro.

**STOP HER — lad mig teste.**

---

## TRIN 6: CameraRig-guard + statisk jungle-kamera

### Mål
Når spilleren er på `jungle_island`, skal `CameraRig` ikke styre kameraet. I stedet sættes et midlertidigt statisk kamera der giver et godt overblik over øen, inden first-person controlleren implementeres.

### Opgaver

**6a. CameraRig early return**

I `src/three/effects/CameraRig.tsx`:
- Tilføj øverst i `useFrame`-callbacket: `if (locationId === 'jungle_island') return;`
- Dette forhindrer CameraRig i at overskrive kameraet når jungle-controlleren senere overtager.

**6b. Midlertidigt statisk jungle-kamera**

I `JungleIsland.tsx`, tilføj en simpel kamera-positionering:
- Brug `useThree` til at få kameraet.
- I en `useEffect` (kun ved mount): sæt kameraet til en god overbliksposition, f.eks. `camera.position.set(0, 8, 5)` og `camera.lookAt(0, 0, 14)`.
- Dette er midlertidigt og erstattes af first-person controller i næste trin.

### Sådan tester du
1. Navigér til jungle_island.
2. Verificér: kameraet giver et godt overblik over hele øen.
3. Navigér TILBAGE til pier (via browser console: `useGameStore.getState().setCurrentLocation('pier')`).
4. Verificér: CameraRig virker normalt igen på pier.

**STOP HER — lad mig teste.**

---

## TRIN 7: First-person controller

### Mål
Implementér `JunglePlayerController` — spillets første (og eneste) first-person kamera med WASD-bevægelse og mus-look.

### Opgaver

**Opret `src/three/environments/JunglePlayerController.tsx`**

Eksportér `JunglePlayerController` komponent.

**Kamera-setup:**
- `camera.rotation.order = 'YXZ'` (undgår gimbal lock).
- Manipulér `camera.rotation.y` (yaw) og `camera.rotation.x` (pitch) direkte.

**Pointer Lock:**
- Ved mount: request pointer lock på canvas-elementet (`gl.domElement`).
- Lyt til `mousemove`-events for at opdatere yaw/pitch.
- Sensitivity: ~0.002.
- Pitch-begrænsning: −77° ned (`-1.344 rad`) til +49° op (`0.855 rad`).
- `Escape`-tast frigiver pointer lock (browser-default + lyt til `pointerlockchange` event).

**Bevægelse (WASD + Space):**
- Brug `useFrame` til at opdatere kameraposition hvert frame.
- Hold `keysPressed` i en `useRef<Set<string>>`.
- Lyt til `keydown`/`keyup` på `window`.
- Bevægelses-vektor beregnes relativt til kamerats yaw-rotation:
  ```
  forward = -Math.sin(yaw) * speed, 0, -Math.cos(yaw) * speed
  strafe  =  Math.cos(yaw) * speed, 0, -Math.sin(yaw) * speed
  ```
- Bevægelses-hastighed: ~4 enheder/sekund (gange `delta`).
- Gange med `delta` for framerate-uafhængighed.

**Hop:**
- `Space` sætter en velocity-y til ~5 enheder/sek.
- Tyngdekraft: -15 enheder/sek².
- Landing: når `position.y <= GROUND_Y + EYE_HEIGHT` (1.55 enheder over `GROUND_Y`).
- `GROUND_Y` er fast ~0.2 i v1 (tæt på vandplan).

**Øjenhøjde:** 1.55 over terræn-y → kameraets y ≈ 1.75 (GROUND_Y + EYE_HEIGHT).

**Grænse-check:**
- Spilleren kan ikke gå ud i vandet. Check: `distance(playerXZ, islandCenter) < islandRadius`.
- Ø-centrum: `[0, 14]`, radius: `12.0` (lidt inden for sand-kanten).

**Startposition:**
- Spilleren spawner ved molens indre ende: `[0, GROUND_Y + EYE_HEIGHT, 10]`, kiggende mod øen (yaw ≈ π = mod positiv z).

**Integration:**
- I `JungleIsland.tsx`: render `<JunglePlayerController />` som barn af `<JungleIsland>`.
- Fjern det midlertidige statiske kamera fra Trin 6b.

### Sådan tester du
1. Navigér til jungle_island.
2. Verificér: kameraet er i first-person (øjenhøjde).
3. WASD bevæger spilleren. Mus roterer kameraet.
4. Space hopper. Spilleren lander igen.
5. Gå til kanten — spilleren stoppes ved vandgrænsen.
6. Escape frigiver musen. Klik på canvas re-locker.
7. Navigér tilbage til pier — CameraRig virker normalt.

**STOP HER — lad mig teste.**

---

## TRIN 8: Kollisionssystem

### Mål
Spilleren kan ikke gå igennem træer og klipper.

### Opgaver

**8a. Eksportér `JUNGLE_OBSTACLES` fra `JungleIsland.tsx`**

Opret og eksportér et array:
```typescript
export const JUNGLE_OBSTACLES: { x: number; z: number; radius: number }[] = [
  // 34 træer (brug deres x, z-positioner fra træ-data arrayet, radius ~0.5–0.8)
  // 8 klipper (brug deres x, z-positioner, radius ~1.0–1.5)
];
```
- Single source of truth: generer dette fra de samme position-data som bruges til at placere træer og klipper.

**8b. Cylinder-kollision i `JunglePlayerController`**

- Importér `JUNGLE_OBSTACLES`.
- I `useFrame`, efter bevægelses-beregning men FØR position-opdatering:
  - For hvert obstacle: check om ny position (XZ) er inden for obstacle-cylinder (distance < player_radius + obstacle_radius).
  - Player-radius: ~0.3.
  - Hvis kollision: anvend **axis-aligned slide** — projicér bevægelses-vektoren langs obstacle-overfladen i stedet for at stoppe brat. Dvs. tillad den komponent af bevægelsen der er vinkelret på kollisions-normalen.

### Sådan tester du
1. Gå hen mod et træ — spilleren glider langs stammen i stedet for at stoppe brat.
2. Gå hen mod en klippe — samme slide-opførsel.
3. Man kan IKKE gå igennem nogen forhindring.
4. Bevægelsen føles naturlig (ikke "sticky").

**STOP HER — lad mig teste.**

---

## TRIN 9: Plesiosaurus NPC på øen + rejse-modal

### Mål
Plesiosaurus sidder ved molens vandkant på jungleøen. Klik på den åbner en modal der tilbyder at rejse tilbage til pier.

### Opgaver

**9a. Jungle Plesiosaurus NPC**

I `JungleIsland.tsx` (eller en separat `JungleNpcs.tsx` der importeres):

- Placering: `[-5.8, -0.22, 1.8]` — ved molen, halvt i vandet.
- Brug `PlesiosaurusCatchModel` med `bucketIdle` og `ambientPierNpc` props (identisk med `AmbientPierPlesiosaurus.tsx`).
- Animation: blid op/ned-bob via `useFrame` (se `AmbientPierPlesiosaurus` for reference).
- Scale: `8` (WORLD_SCALE som AmbientPierPlesiosaurus).
- Yaw: vend mod spilleren/molen — ca. `Math.PI * 0.2`.

**9b. Opret `JungleTravelModal.tsx`**

Opret `src/components/modals/JungleTravelModal.tsx`:

- State management: tilføj `showJungleTravelModal: boolean` + `setShowJungleTravelModal` i `useCollectionStore` (eller `useUIStore` — følg det eksisterende mønster for `showPlesioNPC`).
- Designmæssigt: brug samme stil som `PlesioNpcModal` (mørk grøn gradient, 🦕 emoji, blur-backdrop).
- To knapper:
  1. **"Bliv på øen"** — lukker modal. Hvis pointer lock var aktiv, re-lock efter 120ms delay.
  2. **"Sejl tilbage ⚓"** — kalder `setCurrentLocation('pier')`, lukker modal.

**9c. Interaktionsflow**

Når spilleren klikker på Plesiosaurus (efter at have trykket Escape for at frigive pointer lock):
- `onPointerDown` på Plesiosaurus-gruppen → `e.stopPropagation()` → `play('ui')` → `setShowJungleTravelModal(true)`.

**9d. Render modalen**

I `App.tsx` (eller hvor andre modals renders — find det eksisterende mønster): tilføj `<JungleTravelModal />`.

### Sådan tester du
1. På jungle_island: tryk Escape (frigiver mus).
2. Klik på Plesiosaurus → modal åbner.
3. "Bliv på øen" → modal lukker, pointer lock re-aktiveres.
4. "Sejl tilbage ⚓" → rejser til pier, alt fungerer normalt der.
5. Rejse tilbage til jungle (via Plesiosaurus på pier) → alt fungerer igen.

**STOP HER — lad mig teste.**

---

## TRIN 10 (FREMTIDIGT): PlesiosaurusTravel — rejsescene

> Dette trin er konceptuelt beskrevet men er mere komplekst. Implementér kun efter de foregående trin er stabile.

### Mål
En dedikeret rejse-scene der fungerer som loading-wrapper og narrativ overgang.

### Opgaver (oversigt)

**10a. Tilføj `travelState` i `useGameStore`**
- Nyt felt: `travelState: 'traveling_to_jungle' | 'traveling_to_pier' | null`
- Default: `null`.
- Actions: `setTravelState`.

**10b. Opret `PlesiosaurusTravel.tsx`**
- `src/three/environments/PlesiosaurusTravel.tsx`
- Vises i `Experience.tsx` når `travelState !== null` (skjuler normal sceneri).
- Komponenter:
  - `TravelCamera` — låst bag Plesiosaurus
  - `TravelPlesiosaurus` — PlesiosaurusCatchModel langs en `CatmullRomCurve3`
  - `TravelWaterEffects` — simple splash-meshes ved vandlinjen
  - `TravelProgress` — timer (min 3.5s) + Suspense-sync

**10c. Lazy-loading af JungleIsland**
```typescript
const JungleIslandLazy = React.lazy(() => import('./environments/JungleIsland'));
```
- I `LocationScenery.tsx`: wrap jungle-branchen i `<Suspense fallback={null}>`.
- `PlesiosaurusTravel` afventer både timer OG Suspense-resolution.

**10d. State-maskine flow:**
```
pier → klik Plesio NPC → travelState: 'traveling_to_jungle'
  → PlesiosaurusTravel monteres, JungleIsland lazy-loads
  → timer done + loaded → travelState: null, currentLocation: 'jungle_island'

jungle_island → klik Plesio NPC → travelState: 'traveling_to_pier'
  → PlesiosaurusTravel (spejlvendt) → currentLocation: 'pier'
```

---

## Farvepalette (reference)

| Element | Hex |
|---------|-----|
| Trækstammer | `0x3d2b18` |
| Blade (primær) | `0x1a5c1a` |
| Blade (accent) | `0x144414` |
| Blade (lys) | `0x1e6e20` |
| Klipper | `0x4a5040` |
| Mos på klipper | `0x2e4020` |
| Strand/sand | `0xc4a265` |
| Junglebund | `0x241a0e` |
| Lianer | `0x2e4a1a` |
| Mole-planker | `0x4a3520` |
| Alge på pæle | `0x2a4020` |
| Submarint fundament | `0x2a3a2a` |

## Øens koordinater (reference)

- **Ø-centrum:** `[0, 0, 14]`
- **Ø-radius:** 12.5 enheder
- **Mole:** z ≈ -1 til z ≈ 11.2, x = 0
- **Centralt kæmpetræ:** `[0, 0, 26]`, 13 enheder højt
- **GROUND_Y:** ~0.2
- **Øjenhøjde:** GROUND_Y + 1.55
- **Spawn-position:** `[0, GROUND_Y + 1.55, 10]`
- **Plesiosaurus NPC:** `[-5.8, -0.22, 1.8]`
