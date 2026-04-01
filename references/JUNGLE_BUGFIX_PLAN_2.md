# Jungle Island — Bugfix-plan 2 (4 problemer, 3 trin)

> Kontekst: Alle trin fra `JUNGLE_BUGFIX_PLAN.md` er implementeret og virker.
> **KRITISK:** Ændringer i dette dokument skal KUN påvirke `jungle_island`-lokationen. Alle andre lokationer (pier, tropical\_island, cave, cabin, smaragd, abyss, osv.) skal fungere præcis som før.
>
> Relevante filer:
> - `src/three/effects/SkyClouds.tsx` — lavpoly-skyer (drift + farve)
> - `src/three/effects/AmbientLife.tsx` — fugle/måger (spawn, drift, Z-bounds)
> - `src/three/logic/backgroundZBounds.ts` — Z-bånd pr. lokation (bruges af skyer + fugle)
> - `src/three/effects/NightSky.tsx` — stjerner + måne (position, fade, retning)
> - `src/three/logic/environment.ts` — `computeMoonArcU`, `moonDirectionCameraLocal` m.m.
> - `src/three/environments/JungleIsland.tsx` — øens geometri + lyskilder

---

## TRIN 1: Skyer + fugle flyver rundt om hele jungleøen (Problem A + D)

### Problem
Skyer og fugle bruger det samme baggrunds-system: de placeres i Z-båndet `[-48, -9]` (bag spilleren) og drifter/flyver KUN langs X-aksen (venstre/højre). På pieren med statisk kamera er det fint, men på jungleøen har vi first-person, 360° udsyn — skyer og fugle er kun synlige bag spilleren og aldrig over øen eller foran.

### Nuværende kode

**`SkyClouds.tsx`** — placering (linje 68–83):
- Alle 8 skyer placeres med Z ∈ `[bounds.minZ, bounds.maxZ]` fra `backgroundZBounds.ts`.
- Drift (linje 101–110): kun `c.position.x += speed * driftSign`, dvs. rent horisontal X-drift.
- Z-wrap clamp (linje 108–109): skyen tvinges ind i Z-båndet.

**`AmbientLife.tsx`** — fugle/måger (linje 287–355):
- Fugle spawner med Z ∈ `[zBounds.minZ, zBounds.maxZ]` fra `getBackgroundZBounds()`.
- Flyver KUN langs X-aksen: `g.position.x += config.vx` (linje 72).
- Spawner på den ene side af skærmen og despawner forbi `SEAGULL_EXIT_X = 40` på den anden.
- `rotation.y` er sat til `(config.dir * PI/2)` — dvs. enten 90° eller -90° (venstre/højre).
- Z clampes hvert frame (linje 75–76): fuglen tvinges ind i Z-båndet.
- Max 4 fugle ad gangen, spawning styres af `consumeSeagullSpawn()` (audio-trigger).

**`backgroundZBounds.ts`** (linje 15):
```typescript
jungle_island: { minZ: -48, maxZ: -9 },
```

### Fix

**A1. Polær sky-fordeling for jungle** — i `SkyClouds.tsx`:

I `useMemo`-blokken (linje 68), tilføj et `if (locationId === 'jungle_island')` der placerer skyerne i en ring rundt om øens centrum (`ISLAND_CX=0, ISLAND_CZ=14`):

```typescript
// Jungle: placer skyer i en ring rundt om øen
const isJungle = String(locationId) === 'jungle_island';
if (isJungle) {
  const RING_DIST_MIN = 28;
  const RING_DIST_MAX = 50;
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const c = createLowPolyCloud(1000 + i * 7919);
    const angle = (i / CLOUD_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const dist = RING_DIST_MIN + Math.random() * (RING_DIST_MAX - RING_DIST_MIN);
    const x = Math.cos(angle) * dist;
    const z = 14 + Math.sin(angle) * dist;          // centreret på øens Z=14
    const y = 5 + Math.random() * 9;
    c.position.set(x, y, z);
    (c.userData as CloudUserData).driftSign = i % 2 === 0 ? 1 : -1;
    (c.userData as CloudUserData).idx = i;
    items.push(c);
  }
} else {
  // ... eksisterende kode uændret ...
}
```

**A2. Cirkulær drift for jungle** — i `useFrame` (linje 85), tilføj en `isJungle`-gren der bevæger skyerne i en cirkel rundt om øen i stedet for lineært langs X:

```typescript
const isJungle = String(useGameStore.getState().currentLocation) === 'jungle_island';

if (isJungle) {
  const JUNGLE_CZ = 14;
  for (const c of clouds) {
    const ud = c.userData as CloudUserData;
    const dx = c.position.x;
    const dz = c.position.z - JUNGLE_CZ;
    const angle = Math.atan2(dz, dx);
    const dist = Math.hypot(dx, dz);
    const angularSpeed = (speed * 0.015) * ud.driftSign;
    const newAngle = angle + angularSpeed;
    c.position.x = Math.cos(newAngle) * dist;
    c.position.z = JUNGLE_CZ + Math.sin(newAngle) * dist;
  }
} else {
  // ... eksisterende X-drift + Z-clamp uændret ...
}
```

**A3. Ingen ændring i `backgroundZBounds.ts`** — jungle-skyer og -fugle bruger slet ikke Z-bounds i den nye placering/drift-logik.

**A4. Polær fugle-fordeling for jungle** — i `AmbientLife.tsx`:

Fuglene skal spawne rundt om øen i alle retninger, flyve hen over/forbi øen, og despawne på den modsatte side. Det kræver ændringer i **spawn**- og **bevægelses**-logikken for `jungle_island`.

I spawn-blokken (inde i `setBirds`-callback, ca. linje 293), tilføj en `isJungle`-gren:

```typescript
const isJungle = lid === 'jungle_island';
```

**A4a. Spawn-position og retning for jungle:**

Når `isJungle`, brug polær spawn i stedet for lineær X-spawn:

```typescript
if (isJungle) {
  const JUNGLE_CZ = 14;
  const SPAWN_DIST = 36 + Math.random() * 6;   // afstand fra ø-centrum
  const angle = Math.random() * Math.PI * 2;    // tilfældig retning
  const sx = Math.cos(angle) * SPAWN_DIST;
  const sz = JUNGLE_CZ + Math.sin(angle) * SPAWN_DIST;
  const sy = 4 + Math.random() * 6;

  // Fly mod/forbi øen: retning peger mod centrum + lidt offset
  const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.6;
  const speed = 0.12 + Math.random() * 0.06;
  const vx = Math.cos(targetAngle) * speed;
  const vz = Math.sin(targetAngle) * speed;

  const add = (...): BirdConfig => ({
    id: randomId(),
    dir: 1,                    // dir bruges kun til rotation.y nedenfor
    vx,
    vz,                        // NYT FELT — se A4b
    startY: sy,
    phase: Math.random() * Math.PI * 2,
    maxLife: 900 + Math.floor(Math.random() * 300),
    x: sx, y: sy, z: sz,
    zMin: -999, zMax: 999,     // ingen Z-clamp for jungle
    formation: 'single',
    isJungle: true,            // NYT FLAG
  });
  // push 1–3 fugle
}
```

**A4b. Nyt `vz`- og `isJungle`-felt i `BirdConfig`:**

Tilføj til `BirdConfig` typen:

```typescript
type BirdConfig = {
  // ... eksisterende felter ...
  vz?: number;       // Z-hastighed (kun jungle)
  isJungle?: boolean; // bruges i FlyingSeagullMesh
};
```

**A4c. Bevægelse og rotation i `FlyingSeagullMesh`:**

I `useFrame` (linje 63–79), tilføj Z-drift og fri rotation for jungle-fugle:

```typescript
g.position.x += config.vx;
if (config.vz) g.position.z += config.vz;

// Rotation: peg fuglen i flyveretningen
if (config.isJungle) {
  g.rotation.y = Math.atan2(config.vx, config.vz ?? 0) + Math.sin(L * 0.01) * 0.3;
} else {
  g.rotation.y = (config.dir * Math.PI) / 2 + Math.sin(L * 0.01) * 0.3;
}
```

**A4d. Despawn for jungle:**

Erstat den nuværende `out`-check med en afstandsbaseret check for jungle:

```typescript
let out: boolean;
if (config.isJungle) {
  const dx = g.position.x;
  const dz = g.position.z - 14;
  out = Math.hypot(dx, dz) > 52;   // forsvinder når den er langt nok væk
} else {
  out = config.dir === 1 ? g.position.x > SEAGULL_EXIT_X : g.position.x < -SEAGULL_EXIT_X;
}
```

### Sådan tester du
1. Rejs til `jungle_island` — skyer ses i alle retninger (nord, syd, øst, vest), ikke kun bag spilleren.
2. Skyer kredser langsomt rundt om øen.
3. Fugle flyver hen over øen fra tilfældige retninger — ikke kun venstre/højre.
4. Fugle peger i deres flyveretning (ikke altid sidelengs).
5. Rejs til `pier` — skyer og fugle opfører sig præcis som før (venstre/højre drift, bag kameraet).
6. Test også `tropical_island`, `smaragd` osv. — helt uændrede.

**STOP HER — lad mig teste.**

---

## TRIN 2: Stjerner + måne spredes over hele himlen på jungle (Problem B)

### Problem
Stjerner er placeret i en kasse: `x ∈ [-55, 55]`, `y ∈ [11, 47]`, `z ∈ [-88, -40]` — alle med negativ Z. Med `g.quaternion.identity()` på jungle er stjernerne verdensakse-alignede, så de kun dækker den halvkugle der har negativ Z (bag spillerens spawn-retning). Når man kigger mod øen (positiv Z), er himlen tom.

Månen bruger `moonDirectionCameraLocal()` der altid tvinger `z < 0` (linje 151–153), så månen også kun vises i den negative Z-halvkugle. Derudover mismatcher månelysets retning: `md` roteres med `cam.quaternion` (linje 365), men gruppen bruger `identity()` — så lys og mesh peger forskelligt.

### Fix

**B1. Fuld-himmel stjernekuppel for jungle** — i `NightSky.tsx`:

I `useMemo`-blokken (linje 192), tilføj `currentLocation` awareness. Tilføj en boolean `isJungle` og brug den i star-generation loopet.

Hent lokation:
```typescript
const locationId = useGameStore((s) => s.currentLocation);
```
Tilføj `locationId` til `useMemo` deps:
```typescript
}, [graphicsQuality, locationId]);
```

I stjerneplacerings-loopet (linje 199–221): tilføj en `if (isJungle)` gren:

```typescript
const isJungle = String(locationId) === 'jungle_island';

for (let i = 0; i < count; i++) {
  const u = hash01(i * 3);
  const v = hash01(i * 3 + 1);
  const w = hash01(i * 5 + 2);

  let x: number, y: number, z: number;

  if (isJungle) {
    // Sfærisk fordeling over hele himmelkuplen
    const azimuth = u * Math.PI * 2;                 // 0–360°
    const elevation = 0.08 + v * 1.15;               // ~5°–70° over horisont
    const dist = 40 + w * 48;                         // 40–88
    x = dist * Math.cos(elevation) * Math.sin(azimuth);
    y = dist * Math.sin(elevation);
    z = dist * Math.cos(elevation) * Math.cos(azimuth);
  } else {
    // Eksisterende placering (uændret)
    z = -40 - u * 48;
    const zT = (z + 88) / 48;
    x = (v - 0.5) * 110;
    const yMix = w * 0.55 + (1 - zT) * 0.45;
    y = 11 + (47 - 11) * Math.min(1, Math.max(0, yMix));
  }

  pos[i * 3] = x;
  pos[i * 3 + 1] = y;
  pos[i * 3 + 2] = z;
  // ... sizes, colors uændret ...
}
```

Dette giver stjerner i en fuld kuppel, godt spredt ud — færre pr. sektor end før (spredes over 360° i stedet for ~120°), hvilket brugeren har godkendt.

**B2. Jungle-specifik måneretning** — i `NightSky.tsx`:

Tilføj en ny funktion `moonDirectionJungle` der IKKE clamper Z og tillader fuld azimut:

```typescript
function moonDirectionJungle(
  u: number | null,
  p: MoonNightParams,
): [number, number, number] | null {
  if (u === null) return null;
  const t = Math.max(0, u);
  // Stiger fra nær horisont (elevMin~0.05) til højt op — allerede dækket af params
  const elev = p.elevMin + (p.elevMax - p.elevMin) * t;
  // Fuld azimut: brug azimBase i hele [0, 2π]-rummet
  const fullAzim = p.azimBase * Math.PI * 2 + p.azimDrift * t;
  const ce = Math.cos(elev);
  const x = ce * Math.sin(fullAzim);
  const y = Math.sin(elev);
  const z = ce * Math.cos(fullAzim);
  return [x, y, z];
}
```

I `useFrame` (ca. linje 320–325), vælg funktionen baseret på lokation:

```typescript
const md = locId === 'jungle_island'
  ? moonDirectionJungle(moonU, moonParams)
  : moonDirectionCameraLocal(moonU, moonParams);
```

**B3. Større måne på jungle** — i `moonNightParams()` (eller oven over), boost `moonScale` for jungle:

Du kan enten:
- Overskrive `moonParams.moonScale` efter kaldet: `if (locId === 'jungle_island') moonParams.moonScale = Math.max(moonParams.moonScale, 1.1);`
- Eller bruge en separat `MOON_SCALE_MIN_JUNGLE` / `MOON_SCALE_MAX_JUNGLE` med f.eks. `[1.0, 1.5]`.

**B4. Månelys-retning for jungle** — linje 365:

Fordi NightSky-gruppen bruger `identity()` på jungle, er `md` allerede i verdenskoordinater. Men det nuværende kode ganger med `cam.quaternion`:

```typescript
const dir = _v3.set(md[0], md[1], md[2]).applyQuaternion(cam.quaternion);
```

Tilføj en jungle-check:

```typescript
if (locId === 'jungle_island') {
  _v3.set(md[0], md[1], md[2]); // allerede i verdensrum
} else {
  _v3.set(md[0], md[1], md[2]).applyQuaternion(cam.quaternion);
}
mLight.position.copy(cam.position).addScaledVector(_v3, 50);
```

Dette sikrer at månelysets retning matcher den visuelle måne-disk på jungleøen, så vandoverfladen lyses op korrekt.

**B5. Sørg for at `elevMin` er lav nok** — månen skal stige op "nedefra, bag vandet":

I `moonNightParams`, sæt lavere `elevMin` for en tydelig horisont-stigning:
```typescript
const elevMin = 0.02 + h(4) * 0.04;   // næsten ved vandlinjen
const elevMax = 0.40 + h(5) * 0.30;   // stiger højt op
```
Disse params bruges allerede til fade-in (`moonU < 0.20`), så månen starter som en svag glød ved horisonten og stiger op — præcis som ønsket. Bevar den nuværende `elevMin`/`elevMax`-logik for **ikke**-jungle lokationer.

### Sådan tester du
1. Vær på `jungle_island` om natten — kig i ALLE retninger: stjerner er fordelt over hele himlen.
2. Månen er stor og vises et tilfældigt sted på himlen — stiger op fra horisonten.
3. Månen fader gradvist ind/ud, præcis som på andre lokationer.
4. Månelyset kaster et blødt skin på vand/sand fra den rigtige retning.
5. Rejs til `pier` om natten — stjerner, måne, fade, lys fungerer præcis som før.
6. Rejs til `tropical_island`, `smaragd`, `fishing_cabin` — alt uændret.

**STOP HER — lad mig teste.**

---

## TRIN 3: Lysende pletter på øen (Problem C)

### Problem
Der er 1–2 lysende pletter synlige på jungleøen (den ene nær koordinat X:3.27 Y:4.15 Z:-0.02). De skaber en unaturlig glød.

### Analyse
I `JungleIsland.tsx` (linje 278–279) er der to `<pointLight>`:

```typescript
<pointLight position={[-8, 2, 8]} color={0xcc8844} intensity={0.4} distance={20} />
<pointLight position={[6, 2, 10]} color={0xcc8844} intensity={0.3} distance={18} />
```

Disse er varme orange punktlys med `distance` på 18–20 enheder. Fordi afstandsattenuering i three.js er relativt blød uden eksplicit `decay`, kan de skabe synlige lyse felter på sand/vegetation/vand. Den rapporterede position (3.27, 4.15, -0.02) er sandsynligvis der den lysende plet ses PÅ en overflade (specular highlight fra disse punktlys, eller fra solens `DirectionalLight`).

### Fix

**C1. Identificer kilden** — start med at reducere/deaktivere de to pointLights midlertidigt for at bekræfte:

```typescript
<pointLight position={[-8, 2, 8]} color={0xcc8844} intensity={0.0} distance={20} />
<pointLight position={[6, 2, 10]} color={0xcc8844} intensity={0.0} distance={18} />
```

Test: Hvis de lysende pletter forsvinder → det er disse lys. Gå videre til C2.
Hvis de stadig er der → det er sandsynligvis solens specular highlight. I så fald: check `SceneEnvironment.tsx`'s `directionalLight` retning / øens sand-material roughness.

**C2. Juster eller fjern pointLights** — afhængig af test:

Hvis pletterne forsvinder med `intensity=0`:
- **Option 1 — Fjern dem helt:** De var sandsynligvis tænkt som ambient fill-lys for tæt vegetation, men med solens directional light + ambient light er de overflødige. Slet begge `<pointLight>`-linjer.
- **Option 2 — Reducér og tilføj decay:** Behold dem med lavere intensitet og eksplicit `decay={2}` for fysisk korrekt fald:

```typescript
<pointLight position={[-8, 3, 8]} color={0xcc8844} intensity={0.15} distance={14} decay={2} />
<pointLight position={[6, 3, 10]} color={0xcc8844} intensity={0.10} distance={12} decay={2} />
```

- **Option 3 — Gør dem til ambient-only:** Erstat med en enkelt, svag `hemisphereLight` indeni øens gruppe, som giver jævn belysning uden synlige pletter:

```typescript
<hemisphereLight args={[0xcc8844, 0x2a1a0a, 0.15]} position={[0, 5, 14]} />
```

### Sådan tester du
1. Rejs til `jungle_island` — kig efter lysende pletter på terræn/vand.
2. Med fix C2 valgt: der bør ikke være synlige bright-spots, men øen bør stadig have varm belysning i vegetationen.
3. Kig fra broen mod øen — ingen unaturlig glød.
4. Natbelysning ser stadig OK ud (måne/stjerner giver nok ambient).
5. Andre lokationer: helt uberørte (disse pointLights er kun i `JungleIsland.tsx`).

**STOP HER — lad mig teste.**
