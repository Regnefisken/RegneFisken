# Regnefisken — Random Fish Generator: Komplet Specifikation

> Denne rapport beskriver alt hvad en separat "Random Fish Generator"-software
> skal overholde for at producere fisk der kan importeres direkte i spillet
> **Regnefisken** uden tilpasning.

---

## 1. Arkitektur-overblik

### 1.1 Hvordan fisk eksisterer i spillet

Regnefisken bruger **ingen billedfiler, GLB/GLTF-modeller eller sprites til fisk**.
Alle fisk er **100% procedurale 3D-modeller** bygget i runtime med Three.js-primitiver
(LatheGeometry, SphereGeometry, ConeGeometry osv.) styret af en ren **data-config**.

En fisk i spillet er defineret som én linje i `CATCH_MASTER_DATA` (TypeScript-array i
`src/data/fish.ts`), hvor feltet `model: FishModelConfig` bestemmer alt om dens udseende.

**Der er ingen pixel-art, ingen UV-maps, ingen modelleringsfiler.**

### 1.2 Tech stack

| Komponent | Version |
|-----------|---------|
| React | 19.2.4 |
| Three.js | 0.183.2 |
| React Three Fiber | 9.5.0 |
| Zustand (state) | 5.0.12 |
| TypeScript | 5.9.3 |
| Vite | 8.0.1 |
| Tailwind CSS | 4.2.2 |

### 1.3 Anbefalet sprog til generatoren

**TypeScript** er det optimale valg. Output-formatet er et TypeScript-objekt
(`FishModelConfig`), og du kan genbruge typedefinitionerne direkte.

Alternativt: **enhver platform** der outputter **JSON** med den korrekte schema.
Spillet forventer kun data — ikke meshes, ikke billeder.

---

## 2. Output-format: `CatchMasterEntry`

Generatoren skal producere objekter der matcher dette interface **præcist**:

```typescript
interface CatchMasterEntry {
  id: string;                         // Unikt ID, format: "fisk_<dansk_slug>"
  name: string;                       // Dansk display-navn
  type: 'fish';                       // Altid 'fish' for normale fisk
  rarity: CatchRarity;               // Se sektion 3
  primaryAreas: string[];             // Lokations-IDs, se sektion 4
  requirements: {
    requiredRod: string | null;       // null = ingen krav, 'rod_havblaa', 'rod_mahogni'
    requiredBait: string | null;      // null = ingen krav, 'bait', 'hvalbof', 'koedklump'
    requiredUpgrade?: string;         // Valgfri: 'golden_hook', 'biolum_floats', 'magnet'
  };
  itemType: CatchItemType;           // Næsten altid 'fish', se sektion 5 for undtagelser
  lootWeight?: number;               // Valgfri: overskriver standard rarity-baseret vægt
  model: FishModelConfig;            // << KERNEN — se sektion 6
  visual?: string;                    // Kun for junk/specials, udelad for normale fisk
  visualScale?: number;               // Kun for skattekister
  weightRange?: [number, number];     // Valgfri: [min_kg, max_kg], ellers bruges rarity-defaults
  value?: number;                     // Valgfri: møntværdi, ellers bruges rarity-default
  xpReward?: number;                  // Valgfri: XP ved fangst, ellers bruges rarity-default
}
```

### 2.1 Eksempel: Komplet fisk-entry

```typescript
{
  id: 'fisk_torsk',
  name: 'Torsk',
  type: 'fish',
  rarity: 'Almindelig',
  primaryAreas: ['pier', 'arctic_sea'],
  requirements: { requiredRod: null, requiredBait: null },
  itemType: 'fish',
  model: {
    color: 0x8B7355,
    bodyShape: [1, 0.8, 1.2],
    tail: 'standard',
    speed: 1.0,
    scale: 1.0
  }
}
```

---

## 3. Rarity-system

### 3.1 Tilladte rariteter

| Rarity | Dansk | Typisk lootWeight | Typisk fish |
|--------|-------|-------------------|-------------|
| `'Almindelig'` | Almindelig | 65 (via POOL_WEIGHTS) | Torsk, Sild, Makrel |
| `'Sjælden'` | Sjælden | 25 | Laks, Gedde, Krabbe |
| `'Legendarisk'` | Legendarisk | 8 | Haj, Sværdfisk, Rokke |
| `'Mystisk'` | Mystisk | 1 | Helleflynder (unik) |
| `'Forhistorisk'` | Forhistorisk | N/A (boss-logik) | Plesiosaurus (unik) |
| `'Boss'` | Boss | N/A | Hvidhaj (unik) |

**For generatoren:** Hold dig til `Almindelig`, `Sjælden` og `Legendarisk`. De tre
øvrige er reserveret til unikke creatures med special-logik.

### 3.2 Rarity-defaults (bruges når entry IKKE har eksplicit værdi)

| Rarity | weightRange [kg] | baseValue (coins) | baseXP |
|--------|-------------------|-------------------|--------|
| Almindelig | [1, 5] | 25 | 8 |
| Sjælden | [2, 12] | 40 | 15 |
| Legendarisk | [5, 30] | 80 | 35 |

### 3.3 Display-scale caps pr. rarity

Fisken vises i 3D med en størrelse beregnet fra `model.scale`, `weight`, og rarity:

| Rarity | maxDisplayScale (default) |
|--------|--------------------------|
| Almindelig | 2.15 |
| Sjælden | 2.55 |
| Legendarisk | 2.95 |

Kan overskrives med `model.maxDisplayScale`.

---

## 4. Lokationer (primaryAreas)

### 4.1 Gyldige lokations-IDs

| ID | Navn | Typisk miljø |
|----|------|-------------|
| `'pier'` | Den Gamle Mole | Startlokation, hav |
| `'smaragd'` | Skovsøen | Ferskvandssø i skov |
| `'abyss'` | Dybet | Dybt mørkt hav |
| `'tropical_island'` | Den Tropiske Ø | Tropisk koralrev |
| `'desert_lake'` | Ørkensøen | Ørkenoase |
| `'arctic_sea'` | Ishavet | Arktisk ocean |
| `'forbidden'` | Den Forbudte Sø | Mørk piratsø |
| `'cave'` | Den Mørke Grotte | Underjordisk grotte |
| `'all'` | Alle steder | Specielt flag |

### 4.2 Retningslinjer for lokationstildeling

- Hver fisk bør have **1-3 lokationer** (sjældent mere)
- Brug **tematisk sammenhæng**: tropiske fisk → `tropical_island`, dybhavsfisk → `abyss`
- `'pier'` er begynderlokationen — flest Almindelige fisk her
- `'all'` bruges sjældent og kun for specielle items

---

## 5. ItemType

For **alle normale genererede fisk** skal `itemType` være `'fish'`.

Undtagelse: `'piranha'` (trigger speciel bucket-wipe mekanik + multi-svar kamp).

Andre itemTypes (`halibut`, `plesiosaur`, `kraken` osv.) er reserverede til
håndkodede special-fisk og skal **ikke** bruges af generatoren.

---

## 6. FishModelConfig — Den centrale specifikation

Dette er det objekt generatoren primært skal producere:

```typescript
interface FishModelConfig {
  // ═══ PÅKRÆVEDE FELTER ═══
  color: number;                    // Hex-farve, fx 0x8B7355
  bodyShape: [number, number, number]; // [sx, sy, sz] — kroppens proportioner
  tail: TailType;                   // Haletype
  speed: number;                    // Svømme-animationshastighed
  scale: number;                    // Basis-størrelse i scenen

  // ═══ VALGFRIE DEKORATIVE FLAGS ═══
  flat?: boolean;                   // Fladtrykt krop (fladfisk)
  spots?: number | boolean;        // Pletter (true = mørke, number = hex-farve)
  stripes?: boolean;               // Striber
  redFins?: boolean;               // Røde finner
  longBeak?: boolean;              // Lang næb/snude
  spikes?: boolean;                // Pigge på ryggen
  uglyHead?: boolean;              // Stort klodset hoved
  finUp?: boolean;                 // Opretstående rygfinne (hajstil)
  sword?: boolean;                 // Sværdfisk-næb
  whiskers?: boolean;              // Skæggevarter (malle-stil)
  lure?: boolean;                  // Lygtefisk-lampe
  noEyes?: boolean;                // Ingen øjne (hulefisk)
  emissive?: number;               // Glow-farve (hex), brug med abyss/cave fisk
  emissiveIntensity?: number;      // Glow-styrke (0-2)
  metalness?: number;              // Metal-udseende (0-1, default 0.12)
  roughness?: number;              // Overfladeruhed (0-1, default 0.2)
  maxDisplayScale?: number;        // Max display-størrelse
  scaleCurve?: number;             // Vægtkurve-eksponent

  // ═══ CREATURE-TYPE FLAGS (brug maks ÉT ad gangen) ═══
  isEel?: boolean;                 // Ål-kropstype
  isFrog?: boolean;                // Frø-model
  isStarfish?: boolean;            // Søstjerne-model
  isCrab?: boolean;                // Krabbe-model
  thinLegs?: boolean;              // Tynde ben (med isCrab)
  isOctopus?: boolean;             // Blæksprutte-model
  isLobster?: boolean;             // Hummer-model
  isRay?: boolean;                 // Rokke-model
  isPiranha?: boolean;             // Piranha-kæbe + røde øjne
  isGoldenCarp?: boolean;          // Gyldent skær + glow
  isWhiteShark?: boolean;          // Hvidhaj specialmodel
  isDino?: boolean;                // Dinosaur/plesiosaurus
  bellyColor?: number;             // Alternativ bugfarve (kun med isWhiteShark)
}
```

### 6.1 `bodyShape: [sx, sy, sz]` — Detaljeret forklaring

De tre værdier skalerer en **LatheGeometry** (rotationslegeme) langs akserne:

| Akse | Betydning | Typisk interval | Effekt |
|------|-----------|-----------------|--------|
| `sx` (index 0) | **Bredde/tykkelse** | 0.3 – 2.5 | Hvor bred fisken er set forfra |
| `sy` (index 1) | **Højde** | 0.2 – 2.5 | Hvor høj fisken er (top til bund) |
| `sz` (index 2) | **Længde** | 0.6 – 4.5 | Hvor lang fisken er (snude til hale) |

**Typiske body-shapes for arketyper:**

| Fisketype | bodyShape | Beskrivelse |
|-----------|-----------|-------------|
| Standard rund fisk | `[0.8, 0.9, 1.2]` | Typisk torsk/sild-form |
| Fladfisk | `[1.4, 0.3, 1.2]` | Flad som rødspætte/skrubbe |
| Ål/slange | `[0.3, 0.3, 2.8]` | Lang og tynd |
| Stor tun | `[1.0, 1.2, 1.8]` | Stor og kraftig |
| Haj-form | `[0.9, 1.0, 2.2]` | Torpedo-formet |
| Hornfisk/beak | `[0.4, 0.4, 2.5]` | Meget lang og tynd |
| Klumpfisk | `[0.6, 2.5, 1.5]` | Høj krop, kort |
| Krabbe | `[1.3, 0.5, 1.0]` | Bred og flad |

### 6.2 `tail: TailType` — Haletype

| TailType | Udseende | Bruges til |
|----------|----------|-----------|
| `'standard'` | Enkelt kegle-hale | De fleste fisk |
| `'forked'` | Gaffelhale (2 kegler) | Hurtige fisk (sild, makrel, tun) |
| `'flat'` | Flad hale | Fladfisk, rokker |
| `'eel'` | Tynd spids hale | Ål, muræner |
| `'thin'` | Meget tynd hale | Hornfisk |
| `'chunky'` | Bred kraftig hale | Ulke, store bundlevere |
| `'shark'` | Asymmetrisk hajhale | Hajer |
| `'dino'` | Kraftig dinosaur-hale | Plesiosaurus |
| `'whip'` | Piskehale | Rokker |
| `'star'` | Ingen (stjerne-form) | Søstjerner |
| `'none'` | Ingen hale | Krabber, frøer, blæksprutter |

### 6.3 `speed` — Svømmehastighed

| Interval | Beskrivelse | Eksempler |
|----------|-------------|-----------|
| 0.2 – 0.5 | Meget langsom | Søstjerne, bunddyr, hulefisk |
| 0.5 – 1.0 | Langsom | Fladfisk, krabber, ålekvabber |
| 1.0 – 1.5 | Normal | Torsk, aborre, laks |
| 1.5 – 2.5 | Hurtig | Sild, makrel, tun |
| 2.5 – 3.5 | Meget hurtig | Sværdfisk, piratfisk |

I praksis bruges `speed` til:
- `useFrame`-animationens rotationshastighed: `group.rotation.y = t * speed * 0.85`
- Hale-wiggle frekvens

### 6.4 `scale` — Basisstørrelse

| Interval | Beskrivelse | Eksempler |
|----------|-------------|-----------|
| 0.4 – 0.7 | Lille fisk | Søløje (0.5), hork (0.6) |
| 0.7 – 1.2 | Normal fisk | Torsk (1.0), makrel (0.8) |
| 1.2 – 2.0 | Stor fisk | Stør (1.8), gedde (1.3) |
| 2.0 – 4.0 | Meget stor | Tun (2.5), haj (3.0), hvidhaj (4.0) |

Endelig display-størrelse beregnes: `displayScale = scale * (weight/avgWeight)^curve`,
capped af `maxDisplayScale` eller rarity-default.

### 6.5 `color` — Farvevalg

Farver er hex-integers (Three.js-format). Farverne skal matche spilstil:

| Kategori | Farvespektrum | Eksempler |
|----------|---------------|-----------|
| Brune bundlevere | 0x5A4A3A – 0x8B7355 | Torsk, ål |
| Blå-grå havfisk | 0x4A5A8A – 0x7A8A9A | Tun, sej, haj |
| Grønne ferskvand | 0x4A7A4A – 0x5A8A5A | Aborre, gedde |
| Orange/røde | 0xD4826A – 0xFF6A00 | Rødspætte, klovnefisk |
| Tropisk farvede | 0x00CED1 – 0x1E90FF | Blå tang, papegøjefisk |
| Mørke dybhavsfisk | 0x1A1210 – 0x2A1A3A | Fangtand, lygtefisk |
| Blege hulefisk | 0xE8E8F0 – 0xF0E8E0 | Grottefisk, grottekrebs |
| Ørken/sand-toner | 0xB8944A – 0xD2B48C | Sandgrundling, ørkenbarbe |

### 6.6 Procedurale teksturer

Generatoren behøver IKKE producere teksturer. Spillet genererer automatisk:
- **Diffuse map**: `CanvasTexture` 192×192px (medium) / 256×256px (high) med skæl-mønster
  baseret på `color`
- **Normal map**: Tilsvarende resolution med bump-effekt for skæl

Teksturerne laves runtime af `getScaleTextures()` i `cuteFishUtils.ts`.

### 6.7 Material-egenskaber

Standard fish material er `meshPhysicalMaterial`:

```
metalness: config.metalness ?? 0.12
roughness: config.roughness ?? 0.2
clearcoat: 0.35
clearcoatRoughness: 0.1
emissive: <svag blålig lerp fra bodyColor>
emissiveIntensity: 0.06
```

For specielle fisk (gyldne, glødende) kan `emissive` og `emissiveIntensity` overskrives.

---

## 7. Geometri-pipeline (Teknisk reference)

### 7.1 Hoved-krop: LatheGeometry

Fiskkroppen er et **rotationslegeme** genereret af `createFishLatheGeometry()`:

```
Kontrol-profil:
  X (radius): [0.02, 0.35, 0.65, 0.82, 0.75, 0.50, 0.22, 0.08]
  Y (position): [0.00, 0.12, 0.30, 0.50, 0.65, 0.80, 0.92, 1.00]

Segmenter: 32 (default)
Profil-steps: 32 (interpoleret med vægtet smoothstep)
Total højde: 2.0 enheder
Roteret -90° om Z-aksen (liggende)
```

Denne geometry skaleres derefter med: `scale={[sz * 0.7, sy * 0.7, sx * 0.7]}`
og hele gruppen med: `scale={(config.scale || 1) * 0.55}`

### 7.2 Øjne

Placeret relativt til bodyShape, hver side:
- Hvidt sfærisk øje: radius 0.14
- Sort pupil: radius 0.08
- Hvid glint: radius 0.035

Kan slås fra med `noEyes: true`.

### 7.3 Finner

- **Sidefinner**: 2 kegle-geometrier under kroppen
- **Rygfinne**: Kun med `finUp`, `shark`-tail, eller `spikes` (1-3 kegler)
- **Farve**: 30% mørkere end kropsfarven

---

## 8. Animation

### 8.1 Svømme-animation (aktiv)

```
rotation.y = time * speed * 0.85        // Rotering
position.y = sin(time * 2) * 0.18       // Vertikal bob
tail.rotation.y = sin(time * 12) * 0.35 // Hale-vrikken
```

### 8.2 Bucket-idle (i spanden)

```
tail.rotation.y = sin(time * 8) * 0.2   // Kun svag hale-wiggle
```

### 8.3 Catch-display (efter fangst)

```
position.y = 2.5 + sin(time * 2 + offset) * 0.2  // Bob
rotation.y += 0.65 * dt                            // Langsom spin
```

Generatoren behøver ikke bekymre sig om animation — `speed`-feltet styrer alt.

---

## 9. ID- og navngivningskonventioner

### 9.1 ID-format

```
fisk_<dansk_slug_med_underscores>
```

Regler:
- Altid prefix `fisk_`
- Små bogstaver
- Underscores i stedet for mellemrum
- Danske/latinske navne
- **Skal være unikt** i hele `CATCH_MASTER_DATA`

Eksempler: `fisk_torsk`, `fisk_kaempe_tun`, `fisk_blind_grottefisk`, `fisk_dødningehaj`

### 9.2 Navne

- Dansk displaynavn
- Stort begyndelsesbogstav
- Kan indeholde specialtegn (æ, ø, å)

---

## 10. Requirements-system

### 10.1 Stænger (requiredRod)

| Værdi | Betydning |
|-------|-----------|
| `null` | Ingen krav (alle stænger virker) |
| `'rod_havblaa'` | Kræver Havblå stang |
| `'rod_mahogni'` | Kræver Mahogni stang (den bedste) |

### 10.2 Lokkemad (requiredBait)

| Værdi | Betydning |
|-------|-----------|
| `null` | Ingen krav |
| `'bait'` | Kræver standard lokkemad |
| `'hvalbof'` | Kræver hvalbøf (boss-lokkemad) |
| `'koedklump'` | Kræver kødklump (søuhyre-lokkemad) |

### 10.3 Retningslinjer

- **Almindelige fisk**: Altid `{ requiredRod: null, requiredBait: null }`
- **Sjældne fisk**: Normalt ingen krav, undtagen specielle
- **Legendariske fisk**: Kan kræve `rod_mahogni` og/eller lokkemad

---

## 11. Loot-system og balancering

### 11.1 Pool Weights

Standard weights pr. rarity (fra `POOL_WEIGHTS`):
- Almindelig: 65
- Sjælden: 25
- Legendarisk: 8
- Mystisk: 1

Inden for samme rarity vælges fisk vha. `lootWeight` (default = rarity-weight).
Brug `lootWeight` kun hvis en fisk skal have afvigende sandsynlighed.

### 11.2 Rarity-roll pipeline

```
1. getRarityWeights(level, additiveDR) → { common, rare, legendary, mystisk }
2. rollRarityPipeline(weights) → rarity-key
3. Filter ENRICHED_CATCH_DATA til: rarity + location + rod/bait krav
4. weightedFishPick fra filtreret pool (baseret på lootWeight)
```

---

## 12. Sådan integreres genereret data

### 12.1 Skridt for integration

1. Generatoren outputter et array af `CatchMasterEntry`-objekter (eller JSON)
2. Objekterne indsættes i `CATCH_MASTER_DATA` i `src/data/fish.ts`
3. Alt andet (enrichment, CUTE_FISH_CONFIG, preloading) sker **automatisk** via:
   - `ENRICHED_CATCH_DATA` i `enrichment.ts` (beregner defaults)
   - `CUTE_FISH_CONFIG` i `fish.ts` (bygger model-lookup)
   - `CatchModelPreloader` (varmer GPU-shaders)
   - `HookedCatchModel` → `CuteFishModel` (renderer via config)

### 12.2 Ingen andre filer skal ændres

For en standard `itemType: 'fish'` kræves **kun** én linje i `CATCH_MASTER_DATA`.
Hele rendering-pipelinen, fangst-logik, inventory-visning, XP/coins osv. håndteres
automatisk af det eksisterende system.

### 12.3 Validering

En genereret fisk er valid hvis:
- `id` er unikt og matcher `fisk_*` mønsteret
- `model.bodyShape` er `[number, number, number]` med rimelige værdier (0.1–5.0)
- `model.tail` er en gyldig `TailType`
- `model.color` er et gyldigt hex-tal (0x000000 – 0xFFFFFF)
- `model.speed` er 0.1 – 4.0
- `model.scale` er 0.3 – 5.0
- `primaryAreas` indeholder mindst én gyldig lokations-ID
- `rarity` er en gyldig `CatchRarity`
- Creature-flags er **indbyrdes eksklusive** (ikke `isCrab` + `isOctopus` samtidig)

---

## 13. Anbefalet generator-arkitektur

### 13.1 Teknologivalg

| Aspekt | Anbefaling | Begrundelse |
|--------|------------|-------------|
| **Sprog** | TypeScript/Node.js | Samme typesystem, direkte import af types |
| **Alternativ** | Python + JSON-output | Fin til ML/algoritmisk generation |
| **Preview** | Three.js + React Three Fiber | Identisk rendering som spillet |
| **Build** | Vite | Samme tooling som spillet |

### 13.2 Foreslået projekt-struktur

```
fish-generator/
├── src/
│   ├── types/              # Kopiér fra regnefisken/src/types/fish.ts
│   │   └── fish.ts
│   ├── generator/
│   │   ├── body-generator.ts    # Generer bodyShape baseret på archetype
│   │   ├── color-generator.ts   # Generer farver baseret på biom
│   │   ├── trait-generator.ts   # Tildel dekorative flags
│   │   ├── meta-generator.ts    # Generer id, name, rarity, location
│   │   └── index.ts             # Hoved-genereringsfunktion
│   ├── preview/                 # Valgfri: 3D preview
│   │   ├── FishPreview.tsx      # Kopiér CuteFishModel + cuteFishUtils
│   │   └── App.tsx
│   ├── validation/
│   │   └── validator.ts         # Validér output mod schema
│   └── output/
│       └── generated-fish.ts    # Output-fil klar til copy-paste
├── package.json
└── tsconfig.json
```

### 13.3 Kerne-generator pseudokode

```typescript
function generateRandomFish(options: {
  biome: LocationId;
  rarity: CatchRarity;
}): CatchMasterEntry {
  const archetype = pickArchetype(options.biome);  // standard, flat, eel, crab osv.
  const bodyShape = generateBodyShape(archetype);
  const color = generateColor(options.biome, archetype);
  const tail = pickTail(archetype);
  const speed = generateSpeed(archetype);
  const scale = generateScale(options.rarity, archetype);
  const traits = generateTraits(archetype, options.biome);
  const name = generateDanishFishName(archetype);
  const id = `fisk_${slugify(name)}`;

  return {
    id,
    name,
    type: 'fish',
    rarity: options.rarity,
    primaryAreas: [options.biome],
    requirements: generateRequirements(options.rarity),
    itemType: 'fish',
    model: {
      color,
      bodyShape,
      tail,
      speed,
      scale,
      ...traits,   // flat, spots, stripes, spikes osv.
    }
  };
}
```

### 13.4 Fisk-arketyper at implementere

| Arketype | bodyShape-range | tail | Typiske flags |
|----------|----------------|------|---------------|
| Standard rund | [0.6-1.2, 0.7-1.2, 1.0-1.5] | standard/forked | (ingen) |
| Fladfisk | [1.2-1.6, 0.2-0.4, 1.0-1.5] | flat | `flat: true` |
| Ål/slange | [0.3-0.5, 0.3-0.5, 1.8-3.0] | eel | `isEel: true` |
| Stor rovfisk | [0.8-1.2, 0.9-1.3, 1.5-2.5] | shark/forked | `finUp`, evt. `spikes` |
| Krabbe | [1.0-1.5, 0.3-0.6, 0.7-1.2] | none | `isCrab: true` |
| Blæksprutte | [0.8-1.3, 0.8-1.3, 0.8-1.3] | none | `isOctopus: true` |
| Hummer | [1.0-1.4, 0.4-0.6, 1.2-1.8] | none | `isLobster: true` |
| Dybhavsfisk | [0.6-1.2, 0.6-1.2, 0.8-1.3] | standard | `lure`, `emissive`, `uglyHead` |
| Lang tynd | [0.3-0.5, 0.3-0.5, 2.0-3.0] | thin | `longBeak: true` |
| Rokke | [2.0-3.0, 0.1-0.3, 1.5-2.5] | whip | `isRay: true` |

---

## 14. Test-strategi for preview

### 14.1 Kopiér disse filer fra regnefisken til preview:

```
src/three/models/cuteFishUtils.ts     → Geometri + teksturer
src/three/models/CuteFishModel.tsx    → Rendering-komponent
src/three/models/FishModel.tsx        → Fallback
src/types/fish.ts                     → Typer
```

### 14.2 Minimal preview-app

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CuteFishModel } from './preview/CuteFishModel';

function FishPreview({ config }: { config: FishModelConfig }) {
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <CuteFishModel
        config={config}
        fishModelId="preview"
        instanceId="preview_1"
        rollColor={config.color ?? 0x888888}
      />
      <OrbitControls />
    </Canvas>
  );
}
```

### 14.3 Dependencies for preview

```json
{
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "@react-three/fiber": "^9.5.0",
    "@react-three/drei": "^10.7.7",
    "three": "^0.183.2"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "@vitejs/plugin-react": "^6.0.1",
    "vite": "^8.0.1"
  }
}
```

---

## 15. Eksisterende fisk — Komplet reference

### 15.1 Alle 84+ registrerede fisk-IDs

**Almindelige (pier):** torsk, sild, skrubbe, makrel, hornfisk, roedspette, ising,
fjaesing, skalle, sej, rudskalle, aalekvabbe, ulk, hork, frø

**Almindelige (smaragd):** aborre, brasen, regnbueørred, grundling, løje

**Almindelige (tropical_island):** soestjerne, klovnefisk, papegojefisk, blaa_tang

**Almindelige (abyss):** lygtefisk, fangtandfisk, dybhavsål, havedderkop

**Almindelige (desert_lake):** ørkengrundling, sandbarbe, niltilapia

**Almindelige (arctic_sea):** lodde, hellefisk

**Almindelige (forbidden):** spøgelsesål, skeletfisk, sumptorsk

**Almindelige (cave):** blind_grottefisk, grottekrebs

**Sjældne:** gedde, laks, havørred, pighvar, aal, stør, krabbe, havkat, sandart,
kulmule, havtaske, knurhane, lange, multe, suder, karpe, brosme, blaeksprutte,
muraene, kejserfisk, piratfisk, oase_malle, kaptajnens_karpe, piratål,
giftig_søslange, drypstensål, underjordisk_malle

**Legendariske:** kaempe_tun, haj, svaerdfisk, gyldne_karpe, hummer, klumpfisk,
sildehaj, rokke, petersfisk, narhval, dødningehaj, guldtentakel

---

## 16. Vigtige begrænsninger og gotchas

1. **Creature-flags er eksklusive**: Brug aldrig `isCrab` + `isEel` samtidig —
   rendering-koden bruger if/else og kun det første match.

2. **`color: null`** er kun tilladt for frø (`isFrog: true`), hvor farven vælges
   runtime fra `FROG_COLOR_VARIANTS`.

3. **`model: null`** bruges kun for bosses/specials med dedikerede TSX-komponenter
   (Kraken, Brandmand, Søuhyre). Generatoren skal **altid** sætte et `model`-objekt.

4. **Maksimalt ~2-5 dekorative flags** pr. fisk. Rendering-logikken håndterer dem,
   men for mange kombinationer kan give visuelle konflikter.

5. **`speed > 3.5`** vil se absurd hurtig ud. Hold dig under 3.5.

6. **`scale > 4.0`** er kun for true bosses. Almindelige fisk bør holde sig under 2.0.

7. **Husk `maxDisplayScale`** for Legendariske fisk med høj `scale` — ellers kan de
   fylde hele skærmen ved tungere fangsler.

8. **`emissive`** giver kun mening for dybhav/grotte fisk. Brug det ikke på
   overflade-lokationer.

9. **ID-kollisioner**: Check altid mod eksisterende IDs i `CATCH_MASTER_DATA`.

10. **Lokationer skal eksistere**: Brug kun IDs fra sektion 4.1. Nye lokationer kræver
    ændringer i `locations.ts`, scene-kode og mere.

---

## 17. Checkliste: Er min genererede fisk klar til import?

- [ ] `id` starter med `fisk_` og er unikt
- [ ] `name` er dansk og pænt formateret
- [ ] `type` er `'fish'`
- [ ] `rarity` er `'Almindelig'`, `'Sjælden'`, eller `'Legendarisk'`
- [ ] `primaryAreas` indeholder 1-3 gyldige lokations-IDs
- [ ] `requirements.requiredRod` er `null` eller gyldig stang-ID
- [ ] `requirements.requiredBait` er `null` eller gyldig lokkemad-ID
- [ ] `itemType` er `'fish'` (eller `'piranha'` for piranha-variant)
- [ ] `model.color` er et gyldigt hex-tal
- [ ] `model.bodyShape` er `[sx, sy, sz]` med værdier 0.1–5.0
- [ ] `model.tail` er en gyldig TailType
- [ ] `model.speed` er 0.1–3.5
- [ ] `model.scale` matcher rarity (alm: 0.4-1.5, sjælden: 0.6-2.0, legend: 1.0-4.0)
- [ ] Kun ét creature-flag er sat (eller ingen)
- [ ] Dekorative flags giver visuelt mening sammen
- [ ] `maxDisplayScale` er sat for store Legendariske fisk
- [ ] Preview ser korrekt ud med CuteFishModel

---

## 18. Quick-start: Minimal generator i 10 minutter

```typescript
// generate-fish.ts — kør med: npx tsx generate-fish.ts
import type { FishModelConfig } from './types/fish';

const TAILS = ['standard', 'forked', 'flat', 'eel', 'thin', 'chunky', 'shark'] as const;
const BIOME_COLORS: Record<string, number[]> = {
  pier: [0x8B7355, 0x6B8CAE, 0xC4A882, 0x7A8A7A],
  abyss: [0x1A1A3A, 0x1A1210, 0x2A1A3A, 0x3A3A4A],
  tropical_island: [0xFF6A00, 0x00CED1, 0x1E90FF, 0xFFD700],
  cave: [0xF0E8E0, 0xE8E8F0, 0xB0A89A, 0x4A4A4A],
};

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFish(biome: string, rarity: string) {
  const colors = BIOME_COLORS[biome] ?? BIOME_COLORS.pier;
  const sx = +randomInRange(0.5, 1.5).toFixed(1);
  const sy = +randomInRange(0.5, 1.3).toFixed(1);
  const sz = +randomInRange(0.8, 2.0).toFixed(1);

  const model: FishModelConfig = {
    color: pick(colors),
    bodyShape: [sx, sy, sz],
    tail: pick(TAILS),
    speed: +randomInRange(0.4, 2.5).toFixed(1),
    scale: rarity === 'Legendarisk' ? +randomInRange(1.5, 3.0).toFixed(1)
         : rarity === 'Sjælden' ? +randomInRange(0.8, 1.8).toFixed(1)
         : +randomInRange(0.5, 1.2).toFixed(1),
  };

  // Tilfældige dekorationer
  if (Math.random() > 0.7) model.stripes = true;
  if (Math.random() > 0.8) model.spots = true;
  if (Math.random() > 0.85) model.spikes = true;
  if (Math.random() > 0.9) model.redFins = true;

  return {
    id: `fisk_generated_${Date.now()}`,
    name: 'Genereret Fisk',
    type: 'fish' as const,
    rarity,
    primaryAreas: [biome],
    requirements: { requiredRod: null, requiredBait: null },
    itemType: 'fish' as const,
    model,
  };
}

// Test
console.log(JSON.stringify(generateFish('pier', 'Almindelig'), null, 2));
```

---

*Denne rapport er genereret fra analyse af Regnefisken-kodebasen (marts 2026).*
*Alle typer, interfaces og kodeeksempler matcher den aktuelle version af spillet.*
