# Jungle Island — Forbedring-plan 4 (5 opgaver, A–E)

> Kontekst: Alle trin fra `JUNGLE_BUGFIX_PLAN.md`, `JUNGLE_BUGFIX_PLAN_2.md` og `JUNGLE_BUGFIX_PLAN_3.md` er implementeret.
> **KRITISK:** Ændringer i dette dokument skal KUN påvirke `jungle_island`-lokationen. Alle andre lokationer (pier, tropical\_island, cave, cabin, smaragd, abyss, forbidden, osv.) skal fungere præcis som før.
>
> Relevante filer:
> - `src/three/environments/JungleIsland.tsx` — øens geometri, træer, sten, lianer, bålplads, ildfluer
> - `src/three/environments/JunglePlayerController.tsx` — first-person bevægelse, WASD, hop, gravity, ø-grænse
> - `src/three/environments/AmbientPierPlesiosaurus.tsx` — reference for plesiosaurus NPC ved molen
> - `src/components/modals/PlesioNpcModal.tsx` — reference for plesio-dialog (modal + transport)
> - `src/three/environments/ForbiddenSeaNpcs.tsx` — reference for pirat-NPC (mesh, position, pointer-events, dialog)
> - `src/three/meshes/pirate-mesh.ts` — `buildPirateMesh()` funktion
> - `src/three/models/bossCatchMiniModels.tsx` — `PlesiosaurusCatchModel` komponent
> - `src/store/useGameStore.ts` — `setCurrentLocation` til lokations-skifte
> - `src/store/useCollectionStore.ts` — `showPlesioNPC` / `setShowPlesioNPC`
> - `src/store/useUIStore.ts` — `showCollectibleModal` / `setShowCollectibleModal`
> - `src/store/useAdminStore.ts` — `freeRoamActive`
> - `src/three/admin/AdminFreeRoamCamera.tsx` — admin fly-kamera
> - `src/three/Experience.tsx` — skifter mellem `AdminFreeRoamCamera` og `CameraRig`

---

## Opgave A: Plesiosaurus-NPC ved vandkanten (transport tilbage til Den Gamle Mole)

### Problem
Spilleren kan rejse til jungleøen, men der er ingen NPC der tilbyder transport tilbage til Den Gamle Mole. En plesiosaurus (identisk model som ved molen) skal placeres ved vandkanten, ca. ved verdenskoordinat `[-4.96, ?, -3.95]` (y justeres så den ligger delvist i vandet som ved molen). Klik åbner en dialog-boks med mulighed for transport til `pier`.

### Reference — eksisterende plesiosaurus ved molen

**`AmbientPierPlesiosaurus.tsx`** viser mønsteret:
- Importerer `PlesiosaurusCatchModel` fra `../models/bossCatchMiniModels.js` med props `bucketIdle` og `ambientPierNpc`.
- `WORLD_SCALE = 8`, `BASE_Y = -0.28` (sænker dyret så kroppen ligger delvist i vandet).
- `useFrame` tilfører blød bob (Y) og let gyngen (rotation.z).
- `onPointerDown` → `play('ui')` + `setShowPlesioNPC(true)`.
- Modalen `PlesioNpcModal.tsx` vises og tilbyder lokations-skifte via `setCurrentLocation('jungle_island')`.

**`PlesioNpcModal.tsx`** — fuld modal med:
- Emoji-header, NPC-navn, tekst, to knapper ("Ja, tag mig med!" og "Måske en anden gang").
- `goJungle()` lukker modal og kalder `setCurrentLocation('jungle_island')`.

### Fix

**A1. Opret `AmbientJunglePlesiosaurus` komponent i `JungleIsland.tsx`** (eller ny fil `src/three/environments/AmbientJunglePlesiosaurus.tsx` importeret derfra):

Kopier mønsteret fra `AmbientPierPlesiosaurus.tsx` med følgende forskelle:

| Egenskab | Mole-versionen | Jungle-versionen |
|----------|----------------|------------------|
| Position (xz) | `[-6, 1.2]` | `[-4.96, -3.95]` — bemærk at disse er **verdenskoordinater**. Da `JungleIsland` har `<group position={[0, islandLift, 0]}>` med `islandLift = 0.12`, skal y-koordinaten beregnes relativt |
| Y (base) | `-0.28` (lige under vandplan) | Tilsvarende: ca. `-0.28` til `-0.35` — juster så plesiosaurus-kroppen ligger halvt i vandet. Vandplanet er ca. y=0 i verdensrum |
| Yaw | `-Math.PI * 0.2` | Vend dyret mod øen/broen — brug ca. `Math.PI * 0.4` (vender mod nordøst/øen) |
| Skala | `8` | `8` (identisk model-størrelse) |
| Vis-betingelse | `questItems.includes('plesio_defeated')` | Altid synlig (ingen quest-gate) — plesiosaurusen er her som fast beboer |
| Pointer-event | `setShowPlesioNPC(true)` | Åbn en **ny** dialog/modal dedikeret til "rejse tilbage til molen" |

**A2. Placering i scenen:**
- Koordinat `[-4.96, ?, -3.95]` er i verdensrum — dette er **uden for øens sand-radius** (afstand fra øens centrum `(0, 14)` er `sqrt(4.96² + 17.95²) ≈ 18.6`), altså ude i vandet syd for øen, nær broen.
- Placer `<AmbientJunglePlesiosaurus />` **uden for** `<group position={[0, islandLift, 0]}>` men stadig inden i `JungleIsland`-returværdien (som sibling til group'en, inden for `<>`). Positionen er i verdensrum.
- Alternativt placer den inde i `<group position={[0, islandLift, 0]}>` og juster y med `- islandLift`.

**A3. Ny modal: `JunglePlesioNpcModal.tsx`** i `src/components/modals/`:

Mønster som `PlesioNpcModal.tsx`, men med ændret tekst og transport til `pier`:

```tsx
// Store-integration:
// Brug en ny boolean i useCollectionStore: showJunglePlesioNPC / setShowJunglePlesioNPC
// Alternativt: genbrug showPlesioNPC med en ekstra parameter/variant.
// Anbefaling: ny separat boolean for klarhed.

function goBackToPier() {
  setShow(false);
  setCurrentLocation('pier' as LocationId);
  play('ui');
}
```

Modal-tekst (eksempel):
- Header-emoji: `🦕`
- Titel: `"Vil du rejse tilbage?"`
- Brødtekst: `"Jeg kan svømme dig tilbage til Den Gamle Mole når som helst. Hop op!"`
- Primær knap: `"🦕 Ja, tag mig tilbage!"` → kalder `goBackToPier()`
- Sekundær knap: `"Nej tak, jeg bliver lidt endnu"` → lukker modal

**A4. Registrér modal i `App.tsx`:**
- Importér `JunglePlesioNpcModal` og monter den ved siden af `PlesioNpcModal`.

**A5. Store-udvidelse i `useCollectionStore.ts`:**
- Tilføj `showJunglePlesioNPC: boolean` (default `false`) og `setShowJunglePlesioNPC`.

**A6. Bob-animation i `useFrame`:**
```ts
useFrame(({ clock }) => {
  const g = root.current;
  if (!g) return;
  const t = clock.elapsedTime + timeOffset.current;
  g.position.y = BASE_Y + Math.sin(t * 1.2) * 0.06;
  g.rotation.z = Math.sin(t * 0.8) * 0.02;
});
```

### Sådan tester du
1. Rejs til `jungle_island` — en plesiosaurus er synlig i vandet nær broen (ca. `[-4.96, ~0, -3.95]`).
2. Gå hen til kanten af broen/stranden — plesiosaurusen bobber blidt i vandet.
3. Klik på plesiosaurusen — en dialog åbner med tilbud om transport.
4. Klik "Ja, tag mig tilbage!" — du transporteres til `pier`.
5. Klik "Nej tak" — modalen lukker, du forbliver på jungleøen.
6. Plesiosaurusen ved **Den Gamle Mole** (`AmbientPierPlesiosaurus`) er **helt uændret**.
7. Andre lokationer: helt uberørte.

**STOP HER — lad mig teste.**

---

## Opgave B: Pirat-NPC ved bålpladsen (velkomsthilsen)

### Problem
Der mangler en NPC der byder spilleren velkommen på jungleøen. Piraten fra Den Forbudte Sø (identisk model via `buildPirateMesh()`) skal placeres nær koordinat `[2.61, ?, 16.29]` med fødderne på underlaget. Klik åbner en simpel dialog-boks med en velkomsthilsen.

### Reference — pirat ved Den Forbudte Sø

**`ForbiddenSeaNpcs.tsx`** viser mønsteret:
- `buildPirateMesh()` fra `../meshes/pirate-mesh.ts` returnerer en procedural Three.js-gruppe (skala `0.45`).
- Piratens position: `[5.2, 1.35, 3.5]` (oven på en klippe med y=−0.15).
- `onPointerDown` → `play('ui')` + `setShowCollectibleModal('fossil')`.
- `useFrame` animerer idle-bevægelse (torso-bob, hoved-dreje, arm-sving, hat-bob) og hover-skala via `userData`-felter.

**`pirate-mesh.ts`** — `buildPirateMesh()`:
- Returnerer en `Group` med `userData` indeholdende: `isPirateNPC`, `torso`, `headGroup`, `hatGroup`, `armR`, `armL`, `originalScale`, `hoverScale`, `timeOffset`, `isHovered`.
- Base-skala: `0.45`.

### Fix

**B1. Opret `JunglePirateNpc` komponent i `JungleIsland.tsx`:**

```tsx
function JunglePirateNpc() {
  const pirateObj = useMemo(() => buildPirateMesh(), []);
  const pirateRef = useRef<Group>(null);
  const { play } = useAudio();
  // Brug en ny store-boolean, f.eks. showJunglePirateDialog
  const setShowJunglePirateDialog = useUIStore((s) => s.setShowJunglePirateDialog);

  useFrame(({ clock }) => {
    const root = pirateRef.current;
    if (!root?.userData?.torso) return;
    const d = root.userData;
    const t = clock.elapsedTime + (d.timeOffset ?? 0);
    // Samme idle-animation som i ForbiddenSeaNpcs:
    d.torso.position.y = 2.2 + Math.sin(t * 1.8) * 0.028;
    d.headGroup.position.y = 3.4 + Math.sin(t * 1.8) * 0.022;
    d.headGroup.rotation.y = Math.sin(t * 0.55) * 0.15;
    d.hatGroup.position.y = 0.85 + Math.sin(t * 2.6) * 0.006;
    d.armR.rotation.x = -0.7 + Math.sin(t * 1.5) * 0.04;
    d.armL.rotation.x = -0.2 + Math.sin(t * 1.5 + 1.0) * 0.04;
    const targetScale = d.isHovered ? d.hoverScale : d.originalScale;
    root.scale.setScalar(MathUtils.lerp(root.scale.x, targetScale, 0.12));
  });

  // Y-beregning: terrainYAt(2.61, 16.29, hillTopY) giver ca. 0.06 (d < 9.35-zonen).
  // Piratens pivot er ved fødderne (y=0 i modellen). Sæt y = terrainY.
  // Pirat-modellens base-skala er 0.45 → feet-kontakt: y = terrainYAt + lille offset.

  return (
    <group position={[2.61, terrainY, 16.29]} rotation={[0, -Math.PI * 0.3, 0]}>
      <primitive
        ref={pirateRef}
        object={pirateObj}
        onPointerOver={(e) => { e.stopPropagation(); pirateObj.userData.isHovered = true; }}
        onPointerOut={(e) => { e.stopPropagation(); pirateObj.userData.isHovered = false; }}
        onPointerDown={(e) => {
          e.stopPropagation();
          play('ui');
          setShowJunglePirateDialog(true);
        }}
      />
    </group>
  );
}
```

**B2. Beregn præcis y-position:**
- `terrainYAt(2.61, 16.29, 0.325)`: `dx = 2.61`, `dz = 16.29 - 14 = 2.29`, `d = sqrt(2.61² + 2.29²) ≈ 3.47`. Da `d < 5.5`, er `t = 3.47 / 5.5 ≈ 0.631`, `y = 0.325 * (1 - 0.631) + 0.08 * 0.631 ≈ 0.170`.
- Piratens y inde i `<group position={[0, islandLift, 0]}>` skal altså være ca. `0.17`. Brug `terrainYAt(2.61, 16.29, hillTopY)` dynamisk.
- Pirat-modellens fødder starter omtrent ved modellens y=0. Men modellens interne y-offset kan variere; kontrollér visuelt og juster med ±0.05 så fødderne rammer terrænet.

**B3. Vend piraten** med `rotation={[0, <yaw>, 0]}` så han kigger mod bålpladsen / mod spillerens tilgang. Ca. `rotation={[0, -Math.PI * 0.3, 0]}` (tilpas visuelt).

**B4. Ny velkomst-modal: `JunglePirateWelcomeModal.tsx`** i `src/components/modals/`:

En simpel dialog — **IKKE** `CollectibleModal` (den bruges til fossil-handel). Opret en separat, simpel modal:

```tsx
export function JunglePirateWelcomeModal() {
  const show = useUIStore((s) => s.showJunglePirateDialog);
  const setShow = useUIStore((s) => s.setShowJunglePirateDialog);
  const { play } = useAudio();

  if (!show) return null;

  return (
    <div role="dialog" aria-modal="true" /* ... fullscreen overlay som PlesioNpcModal ... */
      onClick={() => setShow(false)}
    >
      <div /* panel */ onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 text-[4rem]">🏴‍☠️</div>
        <div /* subtitle */>Kaptajn Rotteskæg</div>
        <h2>Velkommen til Jungleøen!</h2>
        <p>
          Aaarr! Velkommen, matros! Denne ø er fuld af mysterier og sjældne fisk.
          Pas på — junglen gemmer mange hemmeligheder...
        </p>
        <button onClick={() => { play('ui'); setShow(false); }}>
          🏴‍☠️ Tak, kaptajn!
        </button>
      </div>
    </div>
  );
}
```

Style modalen i pirat-tema (mørk lilla/sort gradient, guldfarvet accent), præcis som `PlesioNpcModal` er i grøn jungle-tema. Brug samme layout-mønster (centered overlay, blur-backdrop, rounded panel).

**B5. Store-udvidelse i `useUIStore.ts`:**
- Tilføj `showJunglePirateDialog: boolean` (default `false`) og `setShowJunglePirateDialog`.

**B6. Registrér modal i `App.tsx`.**

**B7. Nødvendige imports i `JungleIsland.tsx`:**
- `import { buildPirateMesh } from '../meshes/pirate-mesh.js';`
- `import { useAudio } from '../../audio/useAudio.js';`
- `import { useUIStore } from '../../store/useUIStore.js';`
- `import { MathUtils } from 'three';` (til `MathUtils.lerp`)
- Tilføj `ThreeEvent` type-import fra `@react-three/fiber` til pointer-handlers.

**B8. Placer `<JunglePirateNpc />` inde i `JungleIsland`s `<group position={[0, islandLift, 0]}>`.** (Positionen er relativ til island-lift-gruppen.)

### Sådan tester du
1. Rejs til `jungle_island` — en pirat-figur står nær bålpladsen ved `[2.61, ?, 16.29]`.
2. Piratens fødder rører underlaget (ingen svæven).
3. Piraten har idle-animation (hoved, arme, torso-bob).
4. Klik på piraten — en velkomst-dialog åbner med pirat-tema.
5. Klik "Tak, kaptajn!" — modalen lukker.
6. Den Forbudte Søs pirat er **helt uændret** (han bruger `ForbiddenSeaNpcs` og `CollectibleModal`).
7. Andre lokationer: helt uberørte.

**STOP HER — lad mig teste.**

---

## Opgave C: Ildfluer kun i træbåndet, ikke i lysningen

### Problem
Ildfluerne (`Fireflies` i `JungleIsland.tsx`) svæver overalt inden for øens radius, inklusiv den åbne lysning i midten ved bålpladsen. De skal kun flyve inden for det brede bånd af træer — omtrent radius **5,5–11** fra øens centrum `(0, 14)`. Lidt overskridelse udadtil er OK (naturligt look).

### Nuværende kode

**`JungleIsland.tsx`** — `Fireflies` komponent:

Partiklernes startpositioner genereres med:
```ts
const ang = ffHash01(i * 2.17) * Math.PI * 2;
const r = 0.5 + ffHash01(i * 3.41) * 9.2;     // radius 0.5–9.7 fra (0, 14)
const baseX = Math.cos(ang) * r;
const baseZ = ISLAND_Z + Math.sin(ang) * r;
```

Og clamp i `useFrame`:
```ts
if (dist > FIREFLY_MAX_R && dist > 1e-6) { ... }
```

`FIREFLY_MAX_R = 9.85` — øvre grænse, men **ingen nedre grænse**. Mange ildfluer starter tæt på centrum (r < 5,5) og flyver i lysningen.

### Kontekst — træernes placering

- **Centrum-cluster**: 5 træer ved radius ~11–13 fra `(0, 14)` (xz: `[0, 26]` = dz=12).
- **Ring** (23 træer): radius **6–9** fra `(0, 14)`.
- **Ydre** (6 træer): radius **10–11** fra `(0, 14)`.
- **Lysningen** (bålplads + bakketop): radius **< 5,5** fra `(0, 14)`.

Så træbåndet er ca. radius **5,5–11,5** fra øens centrum.

### Fix

**C1. Tilføj nedre radius-grænse for ildfluer:**

Tilføj en ny konstant:
```ts
const FIREFLY_MIN_R = 5.5;   // indre grænse (udenfor lysningen)
const FIREFLY_MAX_R = 11.5;  // ydre grænse (let udenfor træbåndet for naturlighed)
```

**C2. Opdater startpositions-generering** — sørg for at `r` ligger i `[FIREFLY_MIN_R, FIREFLY_MAX_R]`:

```ts
const r = FIREFLY_MIN_R + ffHash01(i * 3.41) * (FIREFLY_MAX_R - FIREFLY_MIN_R);
```

**C3. Opdater clamp-logikken i `useFrame`** — hold ildfluer inden for ring-båndet:

```ts
const dx = x;
const dz = z - ISLAND_Z;
const dist = Math.hypot(dx, dz);
if (dist > FIREFLY_MAX_R && dist > 1e-6) {
  const s = FIREFLY_MAX_R / dist;
  x = dx * s;
  z = ISLAND_Z + dz * s;
} else if (dist < FIREFLY_MIN_R && dist > 1e-6) {
  const s = FIREFLY_MIN_R / dist;
  x = dx * s;
  z = ISLAND_Z + dz * s;
}
```

**C4. Juster `ampX` og `ampZ`** (drift-amplitude) lidt ned, f.eks. `0.10 + ffHash01(...) * 0.25`, så ildfluerne ikke oscilerer langt nok ud til at "poppe" ind/ud af grænsen for hurtigt. Clamp'en fanger dem alligevel, men mindre amplitude giver blødere bevægelse nær grænserne.

### Sådan tester du
1. Rejs til `jungle_island` — ildfluer ses kun mellem træerne, **ikke** i den åbne lysning ved bålpladsen.
2. Ildfluer drifter let ud forbi det yderste træ (naturligt), men aldrig langt ud over sandstranden.
3. Ingen ildfluer i centrum nær bålpladsen.
4. Andre lokationer: helt uberørte.

**STOP HER — lad mig teste.**

---

## Opgave D: Sandstrandens overgang til vand skal skråne jævnt

### Problem
Sand-cylinderens kant er for skarp/lodret. Sandstranden skal skråne gradvist ned i vandet i stedet for at have en brat kant.

### Nuværende kode

**`JungleIsland.tsx`** — sand-lag:
```tsx
<mesh position={[0, -0.4, ISLAND_Z]} receiveShadow>
  <cylinderGeometry args={[13.75, 14.3, 0.8, SEG]} />
  <meshStandardMaterial {...terrainMats.sand} />
</mesh>
```

Og sub-lag (undervandsbase):
```tsx
<mesh position={[0, -1.55, ISLAND_Z]} receiveShadow>
  <cylinderGeometry args={[14.3, 15.4, 2.0, SEG]} />
  <meshStandardMaterial {...terrainMats.sub} />
</mesh>
```

`cylinderGeometry` med `topRadius < bottomRadius` giver en let kegle, men overgangen fra sandets overkant til vand (y ≈ 0) er stadig ret brat: sand-cylinderens top (radius 13.75) er ved y = `-0.4 + 0.4 = 0.0`, og bunden (radius 14.3) ved y = `-0.4 - 0.4 = -0.8`. Men den udadvendte skråning er kun `(14.3 - 13.75) / 0.8 ≈ 0.69` — ret lodret.

### Fix

**D1. Tilføj en ekstra "sand-skråning"-kegle** (en fladere cylinder-sektion) der ligger oven på sub-laget og skaber en jævn overgang:

```tsx
{/* Sandskråning — jævn overgang fra strand til vandplan */}
<mesh position={[0, -0.85, ISLAND_Z]} receiveShadow>
  <cylinderGeometry args={[14.3, 15.8, 1.0, SEG]} />
  <meshStandardMaterial {...terrainMats.sand} />
</mesh>
```

Denne kegle:
- Top-radius: `14.3` (matcher sand-cylinderens bund-radius — sømløs overgang).
- Bund-radius: `15.8` (bredere end sub-lagets top 14.3 → stikker ud som en sandbanke under vand).
- Højde: `1.0`, centreret ved y = `-0.85` → top ved `-0.35`, bund ved `-1.35`. Overlapper delvist med sand og sub.
- Bruger `terrainMats.sand` farve (men kan evt. mixe med en lysere sandfarve for undervandseffekt).

**D2. Alternativt / supplerende: Gør den eksisterende sand-cylinder bredere i bunden:**

Ændr sand-cylinderens args fra `[13.75, 14.3, 0.8, SEG]` til `[13.75, 15.5, 1.2, SEG]` og sænk position.y fra `-0.4` til `-0.55`:
- Større forskel top vs. bund giver fladere skråning.
- Større højde strækker overgangen.

**Vælg den tilgang der ser bedst ud visuelt.** Den vigtige ting er: sandstranden skal se ud til at glide jævnt ned under vandoverfladen — ikke en brat kant.

**D3. Opdater sub-lagets radier** hvis nødvendigt, så det matcher den nye sand-bund (sub-top ≥ sand-bund).

**D4. `terrainYAt` og `terrainLocalY` behøver IKKE ændres** — spillerens bevægelse i vandkanten er allerede begrænset af `ISLAND_R`, og den ekstra sand-skråning er under vandplanet (visuel ændring, ikke funktionel).

### Sådan tester du
1. Rejs til `jungle_island` — sandstranden skråner jævnt ned i vandet. Ingen brat "klippekant".
2. Overgangen fra tørt sand til undervandsoverfladen er blød og naturlig.
3. Øens samlede proportioner er uændrede (bare en blødere kant).
4. Andre lokationer: helt uberørte.

**STOP HER — lad mig teste.**

---

## Opgave E: Admin free-roam ignorerer gravity/hop på jungle_island

### Problem
Når admin-brugeren aktiverer "Free-Roam Kamera" (`freeRoamActive = true` i `useAdminStore`) på `jungle_island`, kæmper to `useFrame`-controllere om kameraet:

1. **`AdminFreeRoamCamera`** (i `Experience.tsx`): sætter kameraposition via WASD + fly (Space/Q).
2. **`JunglePlayerController`** (i `JungleIsland.tsx` → `LocationScenery`): snapper kameraet til `standY` (ground + EYE_HEIGHT) og anvender gravity.

Resultat: admin kan ikke flyve frit, fordi `JunglePlayerController` hele tiden trækker kameraet ned til terrænet. Hop og gravity forstyrrer.

### Nuværende kode

**`JunglePlayerController.tsx`** — hele `useFrame`-blokken (linje 119–181) kører altid. Der er ingen check for `freeRoamActive`.

**`AdminFreeRoamCamera.tsx`** — fly-kamera bruger `e.code` (`KeyW`, `KeyS`, `KeyA`, `KeyD`, `Space`, `KeyQ`), mens `JunglePlayerController` bruger `e.key.toLowerCase()` (`'w'`, `'s'`, `'a'`, `'d'`, `' '`). Begge lytter på `window` keydown/keyup.

**`Experience.tsx`** (linje 50, 62–66):
```ts
const adminFreeRoam = useAdminStore((s) => (import.meta.env.DEV ? s.freeRoamActive : false));
// ...
{adminFreeRoam && AdminFreeRoamCameraLazy ? <AdminFreeRoamCameraLazy /> : <CameraRig />}
```

`CameraRig` skipper jungle (`if locationId === 'jungle_island' return`), men `JunglePlayerController` er ikke betinget af `adminFreeRoam`.

### Fix

**E1. I `JunglePlayerController.tsx` — skip al bevægelses- og gravity-logik når free-roam er aktiv:**

Tilføj import:
```ts
import { useAdminStore } from '../../store/useAdminStore.js';
```

I komponentens top:
```ts
const freeRoam = import.meta.env.DEV
  ? useAdminStore((s) => s.freeRoamActive)
  : false;
```

**E2. Skip `useFrame`-body:**

I starten af `useFrame`-callbacken, tilføj:
```ts
useFrame((_, delta) => {
  if (freeRoam) return;   // ← NY: lad AdminFreeRoamCamera styre
  // ... resten af eksisterende kode
});
```

**E3. Skip `useEffect`-event-listeners (valgfrit men anbefalet):**

Pointer-lock og key-listeners i `useEffect` kan også betinges:
```ts
useEffect(() => {
  if (freeRoam) return;   // ← intet setup i free-roam
  // ... eksisterende event-listener setup
}, [camera, gl, freeRoam]);
```

Bemærk: tilføj `freeRoam` til deps-arrayet. Når free-roam slås fra, genetableres event-listeners.

**E4. Ingen ændringer i `AdminFreeRoamCamera.tsx`** eller `Experience.tsx`. Fikset er udelukkende i jungle-controlleren.

**E5. VIGTIG: Denne ændring påvirker KUN `jungle_island`**, da `JunglePlayerController` udelukkende renderes på den lokation. Alle andre lokationer bruger `CameraRig` (eller `AdminFreeRoamCamera`), som allerede håndterer free-roam korrekt.

### Sådan tester du
1. Åbn admin-panelet (DEV-mode), slå "Free-Roam Kamera" til.
2. Rejs til `jungle_island` — du kan nu flyve frit med WASD/Space/Q. **Ingen gravity**, ingen hop, ingen snap til terræn.
3. Slå "Free-Roam Kamera" fra — normal FPS-bevægelse genoptages (WASD + gravity + hop).
4. Rejs til `pier` eller andre lokationer med free-roam tændt — fungerer præcis som før.
5. I produktion: `freeRoam` er altid `false`, ingen effekt overhovedet.

**STOP HER — lad mig teste.**
