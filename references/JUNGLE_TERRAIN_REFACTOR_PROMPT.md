# Jungleøen Terrain Refactor — Smooth Radial Disc + Ø-hævning

## Mål

Erstat de 6 stablede cylinder-frustums i `JungleIsland.tsx` med **én enkelt custom radial BufferGeometry** der giver en glat, naturlig ø-profil. Samtidig skal øen **hæves moderat** så den centrale del (træzonen og bakken) stikker tydeligt op over vandniveauet, mens **strandkanten** (den yderste ring, r ≈ 27.5, hvor broen forbindes) **bevarer sin nuværende højde** — det er her vandet plasker perfekt ind.

### Filer der skal ændres

| Fil | Ændring |
|-----|---------|
| `src/three/environments/JungleIsland.tsx` | Ny radial disc-geometry, ny `terrainYAt`, hævet `hillTopY`, vertex colors |
| `src/three/environments/JunglePlayerController.tsx` | Opdater duplikat-`terrainLocalY` til den nye smooth kurve + nye konstanter |
| `src/three/logic/waterWaves.ts` | Eventuelt justér `JUNGLE_R` / `JUNGLE_BLEND` hvis den nye ø-radius ændres (formentlig uændret) |

---

## Trin 1 — Ny smooth højdekurve (`terrainYAt`)

Erstat den nuværende `terrainYAt` (linje 25–37 i `JungleIsland.tsx`) med en **smooth, kontinuert funktion** baseret på afstand fra centrum `(0, ISLAND_Z)`.

### Nuværende terrænprofil (lokal Y, før `islandLift`)

| Zone | Radius | Nuværende Y |
|------|--------|-------------|
| Strandkant (vandlinje) | 27.5 | ≈ -0.02 |
| Sand-plateau | 24.2–27.5 | 0.02 |
| Transition/Jord | 18.7–24.2 | 0.06 |
| Skovring | 11.0–18.7 | 0.06–0.08 |
| Bakketop (centrum) | 0–11.0 | 0.08–0.325 |

### Ny terrænprofil — krav

- **Strandkant (r ≥ 27):** Bevar Y ≈ -0.02 (uændret — vandet plasker stadig perfekt).
- **Ydre strand (r ≈ 22–27):** Blød stigning fra -0.02 op til ~0.15 via smoothstep.
- **Indre strand / jord (r ≈ 16–22):** Fortsæt blødt op til ~0.4.
- **Skovring (r ≈ 11–16):** Stiger til ~0.65. Det er her de yderste træer står.
- **Bakke (r < 11):** Blød stigning op til ny `hillTopY` ≈ 0.9–1.0 i centrum.

Brug `smoothstep`-interpolation (hermite: `t*t*(3-2*t)`) mellem zonerne for glatte overgange. Implementer en lille `smoothstep`-hjælpefunktion:

```typescript
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
```

Den nye `terrainYAt` skal returnere en **kontinuert, glat kurve** — ingen if/return-kaskade med faste værdier. Eksempel-skelet:

```typescript
const SHORE_R = 27.5;    // vandkant — Y holdes lav
const SAND_R = 22.0;     // overgangen fra strand til indre jord
const FOREST_R = 16.0;   // ydre trægrænse
const HILL_R = 11.0;     // bakkens fod

const SHORE_Y = -0.02;   // uændret vandlinje-højde
const SAND_Y = 0.15;
const FOREST_Y = 0.65;
const HILL_FOOT_Y = 0.65;
// hillTopY ≈ 0.9–1.0 (parameter)

function terrainYAt(x: number, z: number, hillTopY: number): number {
  const d = Math.hypot(x, z - ISLAND_Z);
  if (d >= SHORE_R) return SHORE_Y;
  if (d >= SAND_R) {
    return SHORE_Y + (SAND_Y - SHORE_Y) * smoothstep(SHORE_R, SAND_R, d);
  }
  if (d >= FOREST_R) {
    return SAND_Y + (FOREST_Y - SAND_Y) * smoothstep(SAND_R, FOREST_R, d);
  }
  if (d >= HILL_R) {
    return FOREST_Y + (HILL_FOOT_Y - FOREST_Y) * smoothstep(FOREST_R, HILL_R, d);
  }
  // Bakke: d < HILL_R
  return HILL_FOOT_Y + (hillTopY - HILL_FOOT_Y) * smoothstep(HILL_R, 0, d);
}
```

> **Vigtigt:** Tallene ovenfor er udgangspunkt — juster dem efter visuel test. Det afgørende er at `SHORE_Y` ved `SHORE_R` er **uændret** fra nuværende strandkant, og at `hillTopY` hæves markant (fra 0.325 → ~0.9–1.0).

### `terrainSurfaceYAt` (linje 39–46)

Denne funktion bruges til NPC-forankring (piraten). Opdater den tilsvarende — med den nye smooth kurve burde den kunne forenkles til bare at kalde `terrainYAt` direkte, da der ikke længere er en flad cylinder-top at matche.

---

## Trin 2 — Erstat cylinder-stakken med én radial BufferGeometry

Fjern de 6 `<mesh><cylinderGeometry>` blokke (linje 614–640) og erstat med **én** mesh der bruger en custom `BufferGeometry` bygget i en `useMemo`.

### Geometri-konstruktion

Byg en cirkulær disc med koncentriske vertex-ringe:

```typescript
const RADIAL_SEGS = 64;   // antal kile-segmenter (lidt flere end SEG=48 for glattere cirkel)
const RING_COUNT = 24;     // antal koncentriske ringe fra centrum til kant

const islandGeo = useMemo(() => {
  const geo = new BufferGeometry();
  const verts: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Centrum-vertex
  const centerY = terrainYAt(0, ISLAND_Z, hillTopY);
  verts.push(0, centerY, ISLAND_Z);
  normals.push(0, 1, 0);
  // vertex color for centrum (hill-farve)
  colors.push(/*r*/, /*g*/, /*b*/);

  // Koncentriske ringe
  for (let ring = 1; ring <= RING_COUNT; ring++) {
    const r = (ring / RING_COUNT) * SHORE_R;  // eller lidt større for at dække undervands-base
    for (let seg = 0; seg < RADIAL_SEGS; seg++) {
      const angle = (seg / RADIAL_SEGS) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = ISLAND_Z + Math.sin(angle) * r;
      const y = terrainYAt(x, z, hillTopY);
      verts.push(x, y, z);
      normals.push(0, 1, 0);  // overskrives af computeVertexNormals()
      // Vertex color baseret på r (se Trin 3)
      colors.push(/*r*/, /*g*/, /*b*/);
    }
  }

  // Indices: center-fan for inderste ring, quad-strips for resten
  // Inderste fan: centrum (idx 0) → ring 1
  for (let s = 0; s < RADIAL_SEGS; s++) {
    const next = (s + 1) % RADIAL_SEGS;
    indices.push(0, 1 + s, 1 + next);
  }
  // Ydre ringe: ring[i] → ring[i+1]
  for (let ring = 1; ring < RING_COUNT; ring++) {
    const ringStart = 1 + (ring - 1) * RADIAL_SEGS;
    const nextRingStart = 1 + ring * RADIAL_SEGS;
    for (let s = 0; s < RADIAL_SEGS; s++) {
      const sNext = (s + 1) % RADIAL_SEGS;
      const a = ringStart + s;
      const b = ringStart + sNext;
      const c = nextRingStart + s;
      const d = nextRingStart + sNext;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  geo.setIndex(indices);
  geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(verts), 3));
  geo.setAttribute('color', new Float32BufferAttribute(new Float32Array(colors), 3));
  geo.computeVertexNormals();  // ← smooth normals automatisk!
  return geo;
}, [hillTopY]);
```

### Undervands-base

Behold den **ene** store undervandsbase-cylinder (linje 614–617, den mørke `sub`-frustum) som den er — den er under vandet og usynlig. Den dækker den underliggende geometri. Alternativt: udvid disc-geometrien med en ekstra ring af vertices der går ned under vandet (y ≈ -1.5) for at danne en "nederdel".

### Materialet

Én `meshStandardMaterial` med `vertexColors: true` og `flatShading: false`:

```tsx
<mesh receiveShadow>
  <primitive object={islandGeo} attach="geometry" />
  <meshStandardMaterial
    vertexColors
    roughness={0.9}
    flatShading={false}
  />
</mesh>
```

`flatShading: false` + `computeVertexNormals()` giver **smooth shading** — lysovergangene bliver bløde.

---

## Trin 3 — Vertex Colors for zonerne

I stedet for separate materialer per lag, tildel **vertex colors** baseret på afstanden fra centrum. Brug smoothstep til at blende mellem farverne:

| Zone | Farve (hex) | RGB (0–1) | Radius-interval |
|------|-------------|-----------|-----------------|
| Sand (strand) | `#c4a265` | (0.769, 0.635, 0.396) | SHORE_R → SAND_R |
| Jord/transition | `#c4a265` | (0.769, 0.635, 0.396) | SAND_R → FOREST_R |
| Skovbund | `#2c3824` | (0.173, 0.220, 0.141) | FOREST_R → HILL_R |
| Bakke/jord | `#4a3a28` | (0.290, 0.227, 0.157) | HILL_R → 0 |

Brug smoothstep-lerp mellem farverne ved grænse-radii for bløde overgange. Eksempel:

```typescript
function terrainColor(d: number): [number, number, number] {
  const sand: [number, number, number] = [0.769, 0.635, 0.396];
  const forest: [number, number, number] = [0.173, 0.220, 0.141];
  const hill: [number, number, number] = [0.290, 0.227, 0.157];

  if (d >= SAND_R) return sand;
  if (d >= FOREST_R) {
    const t = smoothstep(SAND_R, FOREST_R, d);
    return lerpColor(sand, forest, t);
  }
  if (d >= HILL_R) {
    const t = smoothstep(FOREST_R, HILL_R, d);
    return lerpColor(forest, hill, t);
  }
  return hill;
}
```

---

## Trin 4 — Hæv `hillTopY` og opdater alle afhængige objekter

### 4a — Ny `hillTopY`

Ændr `hillTopY` fra `0.325` til en ny værdi, f.eks. **0.9** (linje 597). Den præcise værdi kan justeres visuelt — pointen er at centrum stikker markant mere op.

### 4b — Objekter der bruger `terrainYAt` / `terrainSurfaceYAt`

Alle disse placerer sig allerede **relativt til terrænet** via `terrainYAt(x, z, hillTopY)`, så de hæves automatisk når terrænfunktionen returnerer højere Y-værdier:

| Objekt | Placering | Afhængighed |
|--------|-----------|-------------|
| **Træer** (`buildTreeInstances`) | `y = terrainYAt(x, z, hillTopY)` (linje 111) | Automatisk korrekt |
| **Klipper** (`buildRockInstances`) | `y = terrainYAt(x, z, hillTopY) + 0.12` (linje 182) | Automatisk korrekt |
| **Pirat-NPC** (`JunglePirateNpc`) | `terrainSurfaceYAt(pirateX, pirateZ, hillTopY)` (linje 377) | Automatisk korrekt |
| **Bålplads** (`JungleCampfire`) | `y0 = terrainYAt(0, ISLAND_Z, hillTopY)` (linje 416) | Automatisk korrekt |
| **Ildfluer** (`Fireflies`) | Fast `baseY` (0.3–4.0) over `islandLift` | Bør hæves med den nye bakke-Y, eller gøres relative til terrænet |
| **Lianer** (`LIANA_ANCHORS`) | Faste Y-koordinater (4.2–7.2) | Bør hæves tilsvarende så de stadig hænger fra trækroner |

### 4c — Ildfluer og lianer

**Ildfluer** (linje 279): `baseY` er absolut (0.3 + random * 3.7). Tilføj den nye terræn-Y for at holde dem over jorden:

```typescript
const terrY = terrainYAt(baseX, baseZ, hillTopY);
const baseY = terrY + 0.3 + ffHash01(i * 5.03) * 3.7;
```

**Lianer** (`LIANA_ANCHORS`, linje 553–566): Y-koordinaterne er absolutte. De skal hæves med den ekstra terræn-offset. Enten:
- Gør Y relativ til terrænet i `terrainYAt` for den pågældende XZ, eller
- Tilføj en fast offset (f.eks. `+ 0.6`) til alle liana-Y-værdier.

---

## Trin 5 — Synkroniser `JunglePlayerController.tsx`

Filen `src/three/environments/JunglePlayerController.tsx` har en **duplikat** af `terrainYAt` kaldet `terrainLocalY` (linje 32–43) med identiske trin-værdier, plus `HILL_TOP_Y = 0.325` (linje 29).

### Løsning A (foretrukken): Eksportér og genbrug

Eksportér `terrainYAt`, `smoothstep`, og de relevante konstanter (`ISLAND_Z`, `hillTopY`/`HILL_TOP_Y`) fra `JungleIsland.tsx`, og importér dem i `JunglePlayerController.tsx`. Fjern `terrainLocalY`-duplikatet.

### Løsning B (minimal ændring)

Opdater `terrainLocalY` i `JunglePlayerController.tsx` til at bruge **præcis samme** smooth-kurve og nye `HILL_TOP_Y`-værdi. Opdater også `ISLAND_LIFT` (linje 28) hvis den ændres.

---

## Trin 6 — Verificér vandinteraktion

I `src/three/logic/waterWaves.ts` (linje 31–34):

```typescript
const JUNGLE_R = 21.0;
const JUNGLE_BLEND = 4.0;
```

Disse styrer hvor vandet dæmpes nær øen. Med den nye terrænprofil:
- `JUNGLE_R = 21.0` matcher nogenlunde `SAND_R = 22.0` — kontrollér at der ikke er overlap/gap.
- Bølgerne skal stadig nå den yderste strandkant og plaske ind. Justér `JUNGLE_R` / `JUNGLE_BLEND` om nødvendigt så vand-masken flugter med den nye geometris ydre kant.

---

## Trin 7 — Verificér bro-forbindelse

`JunglePier.tsx` (linje 12): `JUNGLE_PIER_ANCHOR_Z = 1.58 - 11.2 - 13.75 ≈ -23.37`.

`JunglePlayerController.tsx` har overgangslogik (`isPierToIslandTransition`, `getGroundWorldY`) der bruger `terrainLocalY`. Når `terrainLocalY` opdateres til den nye smooth-funktion, skal overgangen fra bro-dæk (world Y ≈ 0.45) til strand-terræn (world Y ≈ `SHORE_Y + islandLift` ≈ 0.10) stadig være glidende. Kontrollér at spilleren ikke "falder" eller "hopper" ved bro→strand-overgangen.

---

## Opsummering af ændringer

1. **Ny `smoothstep` + `terrainYAt`** i `JungleIsland.tsx` — glat kurve, `hillTopY` hævet til ~0.9–1.0
2. **Fjern `terrainSurfaceYAt`** eller forenkle den (den nye `terrainYAt` er allerede smooth)
3. **Erstat 6 cylinder-meshes** med én custom radial `BufferGeometry` med vertex colors og smooth shading
4. **Behold undervandsbase-cylinderen** (den mørke `sub`-frustum under vandet)
5. **Ildfluer + lianer**: Gør Y-placering relativ til terrænet
6. **Synkroniser `terrainLocalY`** i `JunglePlayerController.tsx` (identisk smooth-kurve + nye konstanter)
7. **Test visuelt**: Strandkant skal matche vandbølgerne, bro→strand skal være glidende, pirat/sten/træer skal stå solidt på det hævede terræn
8. **Fjern ubrugte `terrainMats`** (`sand`, `transition`, `soil`, `forest`, `hill`) da de erstattes af vertex colors — behold `sub`-materialet til undervandsbasen

### Vigtige begrænsninger

- **Strandkanten** (r ≈ 27.5, Y ≈ -0.02 lokal / 0.10 world) **MÅ IKKE ændres** — vand-interaktionen er perfekt der.
- `islandLift` (0.12) kan bibeholdes som-er — den løfter hele gruppen inkl. den nye disc.
- `SEG`/`RADIAL_SEGS` kan justeres for performance vs. smoothness (64 er et godt udgangspunkt, 48 minimum).
- `RING_COUNT = 24` giver tilstrækkelig opløsning for smooth-kurven (kan øges til 32 for endnu blødere).
