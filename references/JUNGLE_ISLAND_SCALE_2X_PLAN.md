# Jungleøen — Fordobling af radius (×2)

## Mål

Skalér jungleøens grundareal, så **alle radier fordobles** (faktor 2). Proportionerne mellem koncentriske lag bevares. Øens centrum forbliver `(0, 14)` i xz-planet. Vertikale mål (højder, y-positioner) ændres **ikke**.

### Vigtige regler

- **Træer, sten, lianer, ildfluer, pirat, bål** skal **bevare deres nuværende koordinater**. De flyttes ikke.
- **Broen** skal flyttes udad, så den bibeholder **nøjagtigt samme afstand** til den nye strandkant som den har til den nuværende.
- **Plesiosaurus** skal ligeledes flyttes udad med **samme offset**, så afstanden bro↔plesiosaurus er uændret.
- **Spawn-positionen** på broen bevares relativt (samme lokale plads på broen, men verdenskoordinaten skifter).
- **Intet andet i spillet** berøres — kun de filer, der specifikt omhandler jungleøen.

### Beregning af offset for bro/plesio/spawn

Nuværende sandcylinders top-radius: `13.75`. Ny: `27.5`.  
Strandkant i −z-retningen (ved `x ≈ 0`): nuværende `z = 14 − 13.75 = 0.25`, ny `z = 14 − 27.5 = −13.5`.  
**Strandkantens skift: `−13.75` i z.**

Alt uden for øen (bro, plesio, spawn) rykkes derfor **`−13.75` i z**.

---

## Trin 1 — `JungleIsland.tsx`: Cylinderlag (radier ×2)

### 1a. Cylindergeometrier

Erstat alle `cylinderGeometry args` i terrænlagene. Kun de to radius-argumenter ændres; `height` og `SEG` er uændrede. Y-positioner bevares.

| Lag | Gammel `[rTop, rBot, h, seg]` | Ny `[rTop, rBot, h, seg]` | Position (uændret) |
|-----|-------------------------------|---------------------------|---------------------|
| **sub** (undervandsbase) | `[14.3, 15.4, 2.0, SEG]` | `[28.6, 30.8, 2.0, SEG]` | `[0, -1.55, ISLAND_Z]` |
| **sand** | `[13.75, 14.42, 1.05, SEG]` | `[27.5, 28.84, 1.05, SEG]` | `[0, -0.525, ISLAND_Z]` |
| **transition** | `[11.66, 12.32, 0.3, SEG]` | `[23.32, 24.64, 0.3, SEG]` | `[0, -0.1, ISLAND_Z]` |
| **soil** | `[10.78, 11.22, 0.2, SEG]` | `[21.56, 22.44, 0.2, SEG]` | `[0, 0.0, ISLAND_Z]` |
| **forest** | `[8.25, 9.35, 0.15, SEG]` | `[16.5, 18.7, 0.15, SEG]` | `[0, 0.05, ISLAND_Z]` |
| **hill** | `[4.4, 5.5, 0.35, SEG]` | `[8.8, 11.0, 0.35, SEG]` | `[0, 0.15, ISLAND_Z]` |

### 1b. `terrainYAt`-funktion — fordobl afstandstærskler

Funktionen `terrainYAt(x, z, hillTopY)` bruger afstanden `d` fra centrum `(0, 14)`. Fordobl alle tærskelværdier:

```typescript
function terrainYAt(x: number, z: number, hillTopY: number): number {
  const dx = x;
  const dz = z - ISLAND_Z;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < 11.0) {                         // var 5.5
    const t = d / 11.0;                   // var 5.5
    return hillTopY * (1 - t) + 0.08 * t;
  }
  if (d < 18.7) return 0.06;              // var 9.35
  if (d < 24.2) return 0.02;              // var 12.1
  return -0.02;
}
```

### 1c. `terrainSurfaceYAt`-funktion — fordobl tærskel

```typescript
function terrainSurfaceYAt(x: number, z: number, hillTopY: number): number {
  const dx = x;
  const dz = z - ISLAND_Z;
  const d = Math.hypot(dx, dz);
  if (d < 8.8) return hillTopY;           // var 4.4
  return terrainYAt(x, z, hillTopY);
}
```

### 1d. Ildflue-grænser — fordobl min/max radius

```typescript
const FIREFLY_MIN_R = 11.0;   // var 5.5
const FIREFLY_MAX_R = 23.0;   // var 11.5
```

### 1e. Elementer der **IKKE** ændres i `JungleIsland.tsx`

Følgende bevarer deres nuværende koordinater og kode 1:1:

- `buildTreeInstances` — alle `push(x, z, h)` kald, ring-radier (`r = 6 + …`, `r = 10.1 + …`) og centrum-cluster.
- `buildRockInstances` — alle sten-positioner (`r = 8.1 + …`).
- `LIANA_ANCHORS` — alle 12 ankerpositioner.
- `JunglePirateNpc` — `pirateX = 2.61`, `pirateZ = 16.29`.
- `JungleCampfire` — position `[0, y0, ISLAND_Z]`.
- `CAMPFIRE_XZ` — `[0, ISLAND_Z]`.
- `islandLift = 0.12`, `hillTopY = 0.325` — uændret.

> **Bemærk:** Fordi `terrainYAt`-tærsklerne er fordoblet, vil objekter ved samme `(x,z)` nu falde i en anden afstandszone og dermed få en anden y-højde. F.eks. vil en sten ved `d ≈ 8.5` gå fra zone `d < 9.35 → y=0.06` til zone `d < 11.0 → blendet y`. Dette er forventet og korrekt: jordoverfladen under objektet er nu det større bakke-plateau i stedet for skovbåndet, og objektets y beregnes stadig korrekt af `terrainYAt`.

---

## Trin 2 — `JunglePlayerController.tsx`: Walkability og terrænhøjde

### 2a. `ISLAND_R` — fordobles

```typescript
const ISLAND_R = 26.4;   // var 13.2
```

### 2b. `terrainLocalY` (lokal kopi af `terrainYAt`) — fordobl tærskler

Samme ændringer som Trin 1b:

```typescript
function terrainLocalY(x: number, z: number): number {
  const dx = x;
  const dz = z - ISLAND_CZ;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < 11.0) {                         // var 5.5
    const t = d / 11.0;                   // var 5.5
    return HILL_TOP_Y * (1 - t) + 0.08 * t;
  }
  if (d < 18.7) return 0.06;              // var 9.35
  if (d < 24.2) return 0.02;              // var 12.1
  return -0.02;
}
```

### 2c. Spawn og look-at — spawn rykkes −13.75 i z

```typescript
const SPAWN = { x: -0.01, y: 2.25, z: -23.23 } as const;   // var z: -9.48
const LOOK_AT = { x: 0, y: 0, z: 14 } as const;             // UÆNDRET — kig mod øens centrum
```

### 2d. Afledte bro-konstanter

Disse beregnes automatisk fra `JUNGLE_PIER_ANCHOR_Z`, som ændres i Trin 3. Genbekræft at formlerne er korrekte efter ændringen:

```typescript
const PIER_Z_MIN = JUNGLE_PIER_ANCHOR_Z - 1;           // automatisk
const PIER_Z_MAX = JUNGLE_PIER_ANCHOR_Z + 11.2;        // automatisk
const PIER_X_EXTENT = 1.85 * 0.7;                      // UÆNDRET
const PIER_TO_ISLAND_Z_MAX = ISLAND_CZ - ISLAND_R + 0.5; // automatisk (ny: 14 - 26.4 + 0.5 = -11.9)
const PIER_DECK_WORLD_Y = 0.475 * 0.95;                // UÆNDRET
```

> **Bonus:** Med de nye værdier bliver `PIER_Z_MAX = -12.17` og `PIER_TO_ISLAND_Z_MAX = -11.9`, hvorved `isPierToIslandTransition`-betingelsen (`z >= PIER_Z_MAX && z <= PIER_TO_ISLAND_Z_MAX`) faktisk får et gyldigt interval `[-12.17, -11.9]`. Tidligere var båndet ugyldigt (`1.58 > 1.3`), hvilket var en latent bug.

---

## Trin 3 — `JunglePier.tsx`: Bro-anker rykkes −13.75 i z

### 3a. Opdater `JUNGLE_PIER_ANCHOR_Z`

Nuværende: `1.58 - 11.2` = `−9.62`.  
Strandkant-skift: `−13.75`.  
Ny: `−9.62 − 13.75` = `−23.37`.

```typescript
export const JUNGLE_PIER_ANCHOR_Z = 1.58 - 11.2 - 13.75;   // ≈ -23.37
```

Alternativt, skriv det mere læsbart som:

```typescript
export const JUNGLE_PIER_ANCHOR_Z = -12.17 - 11.2;   // -12.17 = ny strandkant-overlap z
```

### 3b. Alt andet i `JunglePier.tsx` er uændret

Plankernes lokale positioner, dimensioner, gelænder og pæle er alle i **lokal** koordinater relativt til gruppens position. Da kun gruppens z-position ændres (via `JUNGLE_PIER_ANCHOR_Z`), behøves ingen ændringer i plankegenerering, gelænder eller pæle.

---

## Trin 4 — `AmbientJunglePlesiosaurus.tsx`: Plesio rykkes −13.75 i z

```typescript
const NPC_XZ: [number, number] = [-2.75, -16.26];   // var [-2.75, -2.51], skift: z − 13.75
```

Alt andet (`WORLD_SCALE`, `BASE_Y`, `NPC_YAW`) er uændret.

---

## Trin 5 — `waterWaves.ts`: Vandmaskens radius fordobles

I funktionen `updateWaterGeometry`, under `onJungleIsland`-grenen:

```typescript
const JUNGLE_VX = 0;        // UÆNDRET
const JUNGLE_VY = -14;      // UÆNDRET (centrum, bare negeret for vandplan-XY)
const JUNGLE_R = 21.0;      // var 10.5  — fordoblet
const JUNGLE_BLEND = 4.0;   // var 2.0   — fordoblet, så overgangen er proportionel
```

Alt andet i `waterWaves.ts` er uændret (øvrige lokationer berøres ikke).

---

## Trin 6 — `AmbientLife.tsx`: Fugle-spawn tilpasses (valgfrit)

I `AmbientLife.tsx` under jungle-grenen spawner måger i radius `36–42` fra centrum `(0, 14)`. Med øens nye radius ~27.5 er fuglene nu tættere på kysten end før (var ~22–28 enheders afstand fra sand; nu ~8.5–14.5).

**Anbefaling:** Øg spawn-distancen proportionelt så fuglene stadig cirkler i passende afstand over havet:

```typescript
const SPAWN_DIST = 50 + Math.random() * 8;   // var 36 + random * 6
```

Alternativt: behold nuværende værdier, hvis fugle tæt på kysten er acceptabelt.

> Denne ændring er kosmetisk og kan springes over eller justeres efter smag.

---

## Trin 7 — `SkyClouds.tsx`: Sky-ring tilpasses (valgfrit)

Skyerne bevæger sig i en ring med radius `28–50` fra centrum. Med øens nye radius ~27.5 vil de inderste skyer nu være helt nede over strandkanten.

**Anbefaling:** Øg ring-distancen:

```typescript
const RING_DIST_MIN = 42;   // var 28
const RING_DIST_MAX = 64;   // var 50
```

> Denne ændring er kosmetisk og kan justeres efter smag.

---

## Trin 8 — Verifikation

### Tjekliste

1. **Terrain visuelt:** Øen fylder dobbelt så meget i XZ. Alle seks lag (sub → hill) er synlige og proportionelle.
2. **Walkability:** Man kan gå fra bro-enden til øens nye yderkant (`d ≈ 26.4` fra centrum). Grænsen stopper korrekt.
3. **Bro → ø overgang:** Man kan gå glidende fra broen ind på sandet uden at falde igennem eller sidde fast.
4. **Spawn:** Spilleren spawner i korrekt position på broen (nær den fjerne ende), kigger mod øen.
5. **Plesiosaurus:** Synlig i vandet i samme relative position som før (ved bro-enden, ikke inde på øen).
6. **NPC-klik:** Pirat og plesiosaurus kan stadig klikkes (raycast-interaktion).
7. **Træer, sten, lianer:** Står i deres nuværende positioner. Y-koordinat følger den nye terrænhøjde (de kan stå lidt anderledes vertikalt, da de nu er på bakke-plateauet i stedet for skovbåndet — det er forventet).
8. **Bål:** Centreret på øen, flammer og gløder vises korrekt.
9. **Ildfluer:** Flyver i det nye bredere bånd (radius 11–23) og undgår lysningen.
10. **Vand:** Bølger dæmpes korrekt under øen; ingen z-fighting ved strandkanten.
11. **Fugle & skyer:** Cirkler i passende afstand over havet (hvis Trin 6–7 er udført).
12. **Øvrige lokationer:** Ingen ændringer på nogen anden lokation (mole, tropical island, ørken, arktis, grotte, hytte, etc.).

---

## Oversigt over berørte filer

| Fil | Type ændring |
|-----|-------------|
| `src/three/environments/JungleIsland.tsx` | Cylinder-radier ×2, terrainYAt/terrainSurfaceYAt tærskler ×2, firefly-grænser ×2 |
| `src/three/environments/JunglePlayerController.tsx` | ISLAND_R ×2, terrainLocalY tærskler ×2, SPAWN z-offset |
| `src/three/environments/JunglePier.tsx` | JUNGLE_PIER_ANCHOR_Z −13.75 |
| `src/three/environments/AmbientJunglePlesiosaurus.tsx` | NPC_XZ[1] −13.75 |
| `src/three/logic/waterWaves.ts` | JUNGLE_R ×2, JUNGLE_BLEND ×2 |
| `src/three/effects/AmbientLife.tsx` | (Valgfrit) SPAWN_DIST øges |
| `src/three/effects/SkyClouds.tsx` | (Valgfrit) RING_DIST_MIN/MAX øges |

Ingen andre filer berøres.
