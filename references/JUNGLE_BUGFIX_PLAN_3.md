# Jungle Island — Forbedring-plan 3 (6 opgaver, A–F)

> Kontekst: Alle trin fra `JUNGLE_BUGFIX_PLAN.md` og `JUNGLE_BUGFIX_PLAN_2.md` er implementeret.
> **KRITISK:** Ændringer i dette dokument skal KUN påvirke `jungle_island`-lokationen. Alle andre lokationer (pier, tropical\_island, cave, cabin, smaragd, abyss, osv.) skal fungere præcis som før.
>
> Relevante filer:
> - `src/three/environments/JungleIsland.tsx` — øens geometri, træer, sten, lianer, pointLights
> - `src/three/environments/JunglePier.tsx` — broens planker, rækværk, pæle
> - `src/three/environments/JunglePlayerController.tsx` — first-person bevægelse, WASD, hop, ø-grænse
> - `src/three/effects/NightSky.tsx` — stjerner + måne (position, fade, retning)
> - `src/three/environments/FishingCabin.tsx` — pejsens ild-effekt (reference-kode til bålpladsen)

---

## Opgave A: Ildfluer erstatter pointLights

### Problem
De to `<pointLight>` i `JungleIsland.tsx` (linje 278–291) giver statisk belysning. De skal fjernes og erstattes med animerede "ildfluer" — varme partikler der flyver rundt over øen og afgiver blødt lys.

### Nuværende kode

**`JungleIsland.tsx`** (linje 278–291):
```tsx
<pointLight position={[-8, 3, 8]} color={0xcc8844} intensity={0.15} distance={14} decay={2} />
<pointLight position={[6, 3, 10]} color={0xcc8844} intensity={0.1} distance={12} decay={2} />
```

### Fix

**A1. Slet begge `<pointLight>`** i `JungleIsland.tsx`.

**A2. Opret en ny komponent `Fireflies` i `JungleIsland.tsx`** (eller ny fil `src/three/effects/Fireflies.tsx` importeret derfra):

- ~25–40 partikler (ildfluer), hver bestående af en lille emissiv `<mesh>` med `sphereGeometry args={[0.03, 6, 4]}` og `meshStandardMaterial` med `emissive={0xffaa33}`, `emissiveIntensity` ~1.5–2.5.
- Hver ildfluepartikel har: tilfældig startposition inden for øens radius (`Math.hypot(x, z-14) < 10`), y ∈ [0.3, 4.0], en tilfældig bane (langsom kurvebevægelse via `sin`/`cos` med unikke frekvenser og faser).
- I `useFrame`: opdater positioner med blød tilfældig bevægelse. Hold partiklerne inden for øens cirkel (radius ~10 fra centrum `(0, 14)`). Brug `Math.sin(time * freq + phase)` for x/z-drift og `Math.sin(time * freqY + phaseY)` for y-svingning.
- Hvert 3.–5. partikel har en tilknyttet `<pointLight>` med `color={0xffaa33}`, `intensity` ~0.06–0.12, `distance` ~4–6, `decay={2}`. Ikke alle partikler skal have lys (for performance).
- Ildfluernes emissive-intensitet pulserer: `emissiveIntensity = baseIntensity + Math.sin(time * pulseSpeed + offset) * 0.4`.

**A3. Placer `<Fireflies />` inde i `JungleIsland`s `<group position={[0, islandLift, 0]}>`.** Fjern begge `<pointLight>` linjer.

### Sådan tester du
1. Rejs til `jungle_island` — små varme prikker flyver langsomt rundt mellem træerne.
2. Ildfluerne forbliver over øen, ikke over vandet.
3. Et blødt varmt skin fra et par af ildfluerne ses på nærliggende overflader.
4. Andre lokationer: helt uberørte.

**STOP HER — lad mig teste.**

---

## Opgave B: Bålplads midt på øen

### Problem
Øen mangler et centralt samlingspunkt. Der skal tilføjes en bålplads nær øens centrum.

### Kontekst — pejsens ild-effekt i fiskehytten

I `FishingCabin.tsx` bruges denne struktur til ild:

**Farver** (linje 38–39):
```ts
const COAL_COLORS = [0xff4500, 0xff8c00, 0xffd700, 0xb22222];
const FLAME_COLORS = [0xff4500, 0xff8c00, 0xffd700];
```

**Gløder** = 20 stk. `dodecahedronGeometry args={[0.11, 0]}` med `emissive` + `emissiveIntensity ~0.55–0.9`.

**Flammer** = 20 stk. `octahedronGeometry args={[0.13, 0]}` med `emissive` + `emissiveIntensity ~0.85–1.2`, animeret Y-position og X-skalering via `useFrame`:
```ts
obj.position.y = ud.baseY + Math.sin(time * ud.speed * 100 + ud.offset) * 0.25;
obj.scale.x = 0.4 + Math.sin(time * ud.speed * 80 + ud.offset) * 0.15;
```

**Ildlys** = `<pointLight color={0xffaa33} intensity={2.5} distance={10}>` der pulserer:
```ts
L.intensity = 2.5 + Math.sin(time * 3) * 0.7;
```

### Fix

**B1. Opret `JungleCampfire` komponent i `JungleIsland.tsx`:**

Bålpladsen placeres ved øens centrum — **position `[0, terrainYAt(0, 14, hillTopY), 14]`** — altså oven på bakketoppen.

**B2. Stencirkel** (8–10 sten):
- Placér sten i en cirkel med radius ~0.8 rundt om bålet.
- Hver sten: `dodecahedronGeometry args={[0.12, 0]}` med `color={0x555555}`, `roughness=0.95`, `flatShading=true`.
- Lidt tilfældig rotation og størrelses-variation for naturlighed.

**B3. Brændepinde** (4–6 stk.):
- Korte, tynde cylindre: `cylinderGeometry args={[0.02, 0.03, 0.5, 6]}`.
- `color={0x3d2b18}` (mørkt træ, samme som `trunkMat`), `flatShading=true`.
- Tilfældige rotationer så de "ligger skævt" oven på hinanden (rotation.x og rotation.z ≠ 0).
- Placeret inden for stencirklens radius.

**B4. Ild-effekt** — kopiér logikken fra `FishingCabin.tsx`:
- ~10 gløder (`COAL_COLORS`, `dodecahedronGeometry args={[0.06, 0]}`, emissive).
- ~10 flammer (`FLAME_COLORS`, `octahedronGeometry args={[0.08, 0]}`, emissive, animeret Y + scaleX i `useFrame`).
- 1 `<pointLight color={0xffaa33} intensity={1.8} distance={8} decay={2}>` der pulserer: `intensity = 1.8 + Math.sin(time * 3) * 0.5`.
- Skalaen er **mindre** end pejsen (~60 % af pejsens størrelse) — det er et udendørs bål, ikke en stor kamin.

**B5. Brug refs + `useFrame`** til flammeanimation, præcis som `FishingCabin.tsx`:
```ts
useFrame(({ clock }) => {
  const time = clock.elapsedTime;
  flameGroupRef.current?.traverse((obj) => {
    if (!(obj instanceof Mesh) || !obj.userData?.isFlame) return;
    const ud = obj.userData as { baseY: number; speed: number; offset: number };
    obj.position.y = ud.baseY + Math.sin(time * ud.speed * 100 + ud.offset) * 0.15;
    obj.scale.x = 0.4 + Math.sin(time * ud.speed * 80 + ud.offset) * 0.12;
  });
  const L = fireLightRef.current;
  if (L) L.intensity = 1.8 + Math.sin(time * 3) * 0.5;
});
```

**B6. Placer `<JungleCampfire />` inde i `JungleIsland`s `<group position={[0, islandLift, 0]}>`.** Bemærk at positionen er relativ til group-lift, så y-koordinaten skal bruge `terrainYAt(0, 14, hillTopY)`.

### Sådan tester du
1. Rejs til `jungle_island` — en lille bålplads midt på øen med flammer, gløder, stencirkel.
2. Flammerne bevæger sig realistisk (pulsering, skala-animation).
3. Et varmt ildlys kaster glød på nærliggende træer og terræn.
4. Nattetid: bålet er tydeligt og atmosfærisk.
5. Andre lokationer: helt uberørte.

**STOP HER — lad mig teste.**

---

## Opgave C: Månen er oval — skal være rund

### Problem
Månen vises ovalt fordi `moonGroupRef` er en flad `circleGeometry` disk. På **jungle\_island** bruger NightSky-gruppen `g.quaternion.identity()` (verdensrum), men måne-disken kigger altid mod -Z (standard face-retning for `circleGeometry`). Når kameraet ser på månen fra en skrå vinkel, forekommer cirklen forvrænget/oval.

### Nuværende kode

**`NightSky.tsx`** (linje 347–351) — quaternion:
```ts
if (locId === 'jungle_island') {
  g.quaternion.identity();
} else {
  g.quaternion.copy(cam.quaternion);
}
```

**Linje 372–381** — moonGroup positioning:
```ts
moonG.position.set(
  md[0] * moonParams.skyDist,
  md[1] * moonParams.skyDist,
  md[2] * moonParams.skyDist,
);
moonG.scale.setScalar(moonParams.moonScale);
```

Problemet: `moonG` er en child af `groupRef` som har `identity()` quaternion. Disken er en flad cirkel der ikke roteres mod kameraet. På andre lokationer kopieres `cam.quaternion` til gruppen, så disken automatisk er vinkelret på blikretningen.

### Fix

**C1. Tilføj `lookAt` for månegruppen på jungle** — i `useFrame`, lige efter `moonG.scale.setScalar(...)` (linje 381):

```ts
if (locId === 'jungle_island') {
  moonG.lookAt(cam.position);
}
```

`moonG` er child af `groupRef` (som har identity). `lookAt(cam.position)` roterer disken så den altid er vinkelret på kameraretningen — dvs. altid cirkulær.

### Sådan tester du
1. Rejs til `jungle_island` om natten — månen skal være perfekt rund fra alle vinkler.
2. Drej kameraet og kig på månen fra forskellige retninger — stadig rund.
3. Rejs til `pier` — måne fungerer som før (gruppen bruger `cam.quaternion`, ingen ændring).

**STOP HER — lad mig teste.**

---

## Opgave D: Stjerner tættere på horisonten

### Problem
Stjernerne på jungle\_island er for høje over horisonten. De skal sænkes så de spredes tættere ned mod vandlinjen.

### Nuværende kode

**`NightSky.tsx`** (linje 228) — jungle-grenens elevation:
```ts
const elevation = 0.08 + v * 1.15;
```

`v` ∈ [0, 1], så elevation ∈ [0.08, 1.23] radianer ≈ [4.6°, 70°]. Minimum 4.6° over horisont er for højt.

### Fix

**D1. Sænk `elevation` minimum og udflad fordelingen:**

```ts
const elevation = 0.01 + v * 0.85;
```

Nu: elevation ∈ [0.01, 0.86] radianer ≈ [0.6°, 49°]. Mere stjerner nær horisonten, og de spredes ned mod vandoverfladen.

Alternativt, brug en ikke-lineær fordeling der favoriserer lavere vinkler:

```ts
const elevation = 0.01 + (v * v) * 1.10;
```

Her: `v²` giver mere densitet nær horisont (v=0 → elev=0.01) og gradvist mere spredt opadtil (v=1 → elev=1.11).

Vælg den version der ser bedst ud — begge sænker horisontgrænsen markant.

### Sådan tester du
1. Rejs til `jungle_island` om natten — stjerner synlige helt nede ved vandlinjen.
2. Stadig godt med stjerner højt oppe (kuppelform).
3. Andre lokationer: uændrede (de bruger `else`-grenen).

**STOP HER — lad mig teste.**

---

## Opgave E: Bro smallere, lavere; ø ~10 % større

### Problem
Broen er for bred. Den skal gøres **30 % smallere** og **5 % lavere**. Øens sand-radius skal øges med **10 %** (sand strækker sig ind under broen). De øvrige lag (overgang, jord, skov, bakke) skal skaleres relativt til sandet, så øen samlet set vokser ~10 %. Træer, sten og lianer behøver **ikke** flyttes.

### Nuværende kode

**`JunglePier.tsx`** — bro-dimensioner:

| Element | Nuværende værdi | Linje |
|---------|----------------|-------|
| Planke-bredde | `4.0` (boxGeometry x) | 51 |
| Rækværk x-position | `±1.45` | 56, 60 |
| Pæl x-position | `±1.75` | 67 |
| Gruppe y-offset | `0.1` | 42 |
| Planke y | `0.3` | 46 |
| Rækværk y | `0.05` | 56, 60 |
| Pæl y | `-1` | 69 |

**`JunglePlayerController.tsx`** — bro-kollision:
| Konstant | Nuværende værdi | Linje |
|---------|----------------|-------|
| `PIER_X_EXTENT` | `1.85` | 41 |
| `PIER_DECK_WORLD_Y` | `0.475` | 44 |
| `ISLAND_R` | `12` | 17 |

**`JungleIsland.tsx`** — terræn-lag (centrum = `[0, y, 14]`):

| Lag | Top-radius | Bund-radius | Højde | Y-pos | Linje |
|-----|-----------|-------------|-------|-------|-------|
| sub | 13.0 | 14.0 | 2.0 | -1.55 | 297–299 |
| sand | 12.5 | 13.0 | 0.8 | -0.4 | 301–303 |
| transition | 10.6 | 11.2 | 0.3 | -0.1 | 305–307 |
| soil | 9.8 | 10.2 | 0.2 | 0.0 | 309–311 |
| forest | 7.5 | 8.5 | 0.15 | 0.05 | 313–315 |
| hill | 4.0 | 5.0 | 0.35 | 0.15 | 317–319 |

### Fix

**E1. Bro 30 % smallere** — i `JunglePier.tsx`:

| Element | Nuværende | Ny (×0.7) |
|---------|-----------|-----------|
| Planke-bredde | `4.0` | `2.8` |
| Rækværk x | `±1.45` | `±1.015` |
| Rækværk box x | `0.22` | `0.18` |
| Pæl x | `±1.75` | `±1.225` |

**E2. Bro 5 % lavere** — i `JunglePier.tsx`:

Sænk gruppens y-position: `0.1 → 0.095` (−5 %).
Sænk planke-y: `0.3 → 0.285`.
Rækværk-y: `0.05 → 0.0475`.

Eller enklere: bare sænk hele gruppens y med 5%: `position={[0, 0.095, JUNGLE_PIER_ANCHOR_Z]}`.

**E3. Opdater `PIER_X_EXTENT` i `JunglePlayerController.tsx`:**

```ts
const PIER_X_EXTENT = 1.85 * 0.7; // = 1.295
```

Og `PIER_DECK_WORLD_Y`:
```ts
const PIER_DECK_WORLD_Y = 0.475 * 0.95; // = 0.45125 ≈ 0.451
```

**E4. Sand +10 %, øvrige lag skaleret ~10 % op** — i `JungleIsland.tsx`:

| Lag | Nuv. top-r | Ny top-r | Nuv. bund-r | Ny bund-r |
|-----|-----------|----------|-------------|-----------|
| sub | 13.0 | 14.3 | 14.0 | 15.4 |
| sand | 12.5 | **13.75** | 13.0 | **14.3** |
| transition | 10.6 | 11.66 | 11.2 | 12.32 |
| soil | 9.8 | 10.78 | 10.2 | 11.22 |
| forest | 7.5 | 8.25 | 8.5 | 9.35 |
| hill | 4.0 | 4.4 | 5.0 | 5.5 |

Sand × 1.10. De andre lag × 1.10 (samme ratio). Sub-layer matcher den nye sand-bund.

**E5. Opdater `ISLAND_R` i `JunglePlayerController.tsx`:**

```ts
const ISLAND_R = 13.2;  // ~12 × 1.10 = 13.2 (matcher ny sand-radius)
```

**Bemærk:** `terrainYAt` i `JungleIsland.tsx` OG `terrainLocalY` i `JunglePlayerController.tsx` bruger hårdkodede afstands-grænser (`5.0`, `8.5`, `11`). Disse skal OGSÅ skaleres ×1.10:
- `5.0 → 5.5`
- `8.5 → 9.35`
- `11 → 12.1`

Opdater begge kopier af funktionen (i `JungleIsland.tsx` og `JunglePlayerController.tsx`).

**E6. Træer, sten og lianer** — behold alle positioner uændrede. De ligger stadig inden for den nu-større ø.

### Sådan tester du
1. Broen er synligt smallere (kan stadig gås på begge sider).
2. Broen er en anelse lavere.
3. Sandet strækker sig lidt længere ud — også under broen.
4. Øen er samlet ~10 % større, alle lag skaleret proportionalt.
5. Træer og sten er stadig på øen (nu med mere plads til kanten).
6. Kollision virker korrekt: man kan gå på hele broen og hele øen.
7. Andre lokationer: helt uberørte (alle ændringer er i jungle-specifikke filer).

**STOP HER — lad mig teste.**

---

## Opgave F: Sprint med Shift-tasten (kun jungle)

### Problem
Der er ingen sprint-funktion. Spilleren skal kunne holde Shift nede for at sprinte hurtigere — men KUN på `jungle_island`.

### Nuværende kode

**`JunglePlayerController.tsx`** (linje 7–8):
```ts
const EYE_HEIGHT = 1.55;
const MOVE_SPEED = 4;
```

**Linje 91–95** — key events:
```ts
const onKeyDown = (e: KeyboardEvent) => {
  keysPressed.current.add(e.key.toLowerCase());
};
const onKeyUp = (e: KeyboardEvent) => {
  keysPressed.current.delete(e.key.toLowerCase());
};
```

**Linje 144** — bevægelse:
```ts
const nx = camera.position.x + mx * MOVE_SPEED * delta;
const nz = camera.position.z + mz * MOVE_SPEED * delta;
```

### Fix

**F1. Tilføj sprint-konstant:**
```ts
const SPRINT_SPEED = 7; // ~1.75× normal hastighed
```

**F2. Registrér Shift korrekt.** Bemærk at `e.key.toLowerCase()` giver `"shift"` for Shift-tasten, så det virker allerede med det nuværende key-system.

**F3. Brug sprint-speed i `useFrame`:**

```ts
const sprinting = keys.has('shift');
const speed = sprinting ? SPRINT_SPEED : MOVE_SPEED;
// ...
const nx = camera.position.x + mx * speed * delta;
const nz = camera.position.z + mz * speed * delta;
```

**F4. Ingen ændringer andre steder.** `JunglePlayerController` bruges KUN på `jungle_island` (renderes af `JungleIsland`), så sprint påvirker ingen andre lokationer.

### Sådan tester du
1. Rejs til `jungle_island` — gå med WASD (normal hastighed).
2. Hold Shift nede + WASD — bemærk tydelig hastighedsforøgelse.
3. Slip Shift — hastighed vender tilbage til normal.
4. Prøv sprint + hop — begge skal virke samtidig.
5. Andre lokationer: ingen sprint-funktion, ingen ændring.

**STOP HER — lad mig teste.**
