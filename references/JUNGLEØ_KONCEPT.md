# Jungleøen — Konceptpitch
### Et levende verdensrum i Regnefisken

---

## Vision

Jungleøen er det første sted i Regnefisken hvor spilleren **stiger i land og
udforsker med egne ben**. Det er en forhistorisk ø der bryder med spillets
fishing-loop og introducerer en ny kategori af oplevelse: verden som
destination, ikke som fiskeplads. Man ankommer på ryggen af en Plesiosaurus,
sætter fod på en mosset mole og træder ind i en tæt, mørk jungle.

---

## Spillets tekniske fundament

Regnefisken kører som **én kontinuerlig R3F-scene** i React Three Fiber.
Der er ingen scene-skift, ingen loading-screens mellem normale lokationer.
Alt 3D er proceduralt — ingen eksterne 3D-modeller eller teksturer.
Lokationer skiftes ved at ændre `useGameStore.currentLocation`, og React
viser og skjuler komponenter betinget på den streng.

Det delte "shell" — himmel, vand, tåge, lys, vejr — er altid aktivt og
tager automatisk lokationens farver fra `LOCATIONS`-data-objektet.
Jungleøen har allerede definerede farver: dyb skovgrøn baggrund
(`0x1a4a1a`), mørk grønt vand (`0x228855`) og tæt grøn tåge
(`0x1a3a1a` med `fogNear: 15, fogFar: 50`). Disse fyrer automatisk
når `currentLocation === 'jungle_island'`.

Alle gameplay-komponenter — fiskestang, spand, bobber, linje, fiskepulje —
er aktive på alle lokationer som udgangspunkt og skal eksplicit skjules
på jungle_island, da lokationen er af typen `'world'` frem for `'fishing'`.

---

## Unlock-flow og adgang

Jungleøen er ikke tilgængelig fra start. Den låses op via Plesiosaurus-questen
på Den Gamle Mole (`pier`). Når spilleren har besejret Plesiosaurus og har
`'plesio_defeated'` i `questItems`, dukker Plesiosaurus-NPC'en op ved molen.
Klik på den åbner en modal der tilbyder rejsen. Unlock-itemet
`'__jungle_discovered__'` gemmes i `requiresItem`-feltet og persisteres
via Zustand-storen. Hele denne mekanik eksisterer allerede i spillet —
jungleøen manglede blot et visuelt mål at rejse til.

---

## Øens fysiske layout

Øen er centreret ved world-koordinat **[0, 0, 14]** — 2.5 enheder dybere
end TropicalIsland ([0, 0, 11.5]). Det er en bevidst designbeslutning:
den ekstra dybde giver spilleren en stærkere ankomst-følelse, fordi
trætoppene og vegetationen allerede er synlige og omsluttende i det
øjeblik man sætter fod på den spejlvendte mole.

Øens radius er **12.5 enheder**. Det gør den til spillets største lokation
og den eneste der fysisk kan udforskes til fods. Vandplanet ligger ved
`y ≈ 0`. Stranden møder vandet ved y ≈ 0. Junglebunden hæver sig i
concentriske lag: sand (radius 12.4) → overgangszone (10.6) → mørk jord
(9.8) → tæt skovbund (7.5) → let forhøjet bakke centralt (radius 4.0).
Det centrale træ på [0, 0, 26] er 13 enheder højt — spillets suverænt
højeste enkeltstruktur.

**Molen** strækker sig fra z ≈ −1 til z ≈ 11.2, centreret på x = 0.
Den er spejlvendt ift. normale mole-lokationer: spilleren ankommer ved
molens indre ende (z ≈ 9–10) og kigger ind mod øen. Molen er visuelt
mørkere end standard Pier — forvitret træ (0x4a3520), mos-patches,
algekraver på pæle ved vandlinjen og jungleblade der trænger ind langs
kanterne fra z ≈ 8.8 og frem.

---

## Spillerens bevægelse — first-person

Jungleøen er spillets **eneste first-person lokation**. Der er ingen synlig
spiller-model. Kameraet er spilleren.

`JunglePlayerController` overtager kameraet fuldstændigt fra `CameraRig`
(som returnerer tidligt med en location-guard). Controlleren sætter
`camera.rotation.order = 'YXZ'` og manipulerer `camera.rotation.y` (yaw)
og `camera.rotation.x` (pitch) direkte — det klassiske FPS-kamera-pattern
der undgår gimbal lock.

**Styring:**
- `W/A/S/D` — bevægelse relativt til kamera-orientering
- `Space` — hop med tyngdekraft og landingsdetektion
- `Mus` (pointer lock) — frit kig 360° horisontalt, begrænset vertikalt
  (−77° ned / +49° op)
- `Escape` — frigiver pointer lock, muliggør UI-interaktion

**Øjenhøjde** er sat til 1.55 enheder over terræn-y (≈ 1.9 enheder over
vandplanet), svarende til en realistisk menneskelig first-person perspektiv.

**Kollision** er implementeret som cylinder-checks mod
`JUNGLE_OBSTACLES`-arrayet (40 opslag: 32 træer + 8 klipper), eksporteret
fra `JungleIsland.tsx` som single-source-of-truth. Axis-aligned slide
tillader spilleren at "glide langs" forhindringer frem for at stoppe brat.
Vand-grænsen håndhæves ved at sammenligne spillerens XZ-position med
ø-centrum og radius — spilleren kan ikke gå ud i vandet.

---

## Junglens visuelle identitet

Jungleøen er bevidst **mørkere og tættere** end TropicalIsland. Palletten:

| Element | Farve | Hex |
|---------|-------|-----|
| Trækstammer | Mørkebrun | `0x3d2b18` |
| Blade (primær) | Dyb skovgrøn | `0x1a5c1a` |
| Blade (accent) | Næsten sort grøn | `0x144414` |
| Blade (lys variant) | Mosgrøn | `0x1e6e20` |
| Klipper | Grågrøn mos-sten | `0x4a5040` |
| Mos på klipper | Mørk mos | `0x2e4020` |
| Strand | Varm okker-sand | `0xc4a265` |
| Junglebund | Næsten sort muld | `0x241a0e` |
| Lianer | Mørkegrøn ranke | `0x2e4a1a` |
| Mole-planker | Forvitret mørk eg | `0x4a3520` |
| Alge på pæle | Dyb sumpgrøn | `0x2a4020` |

**Træerne** er proceduralt genererede med stablede cylindersegmenter for
organisk stamme-kurve og 4 lag ikosaeder-bladkroner i faldende størrelse.
Hvert træ har et unikt seed der bestemmer hældning, stammeradius og
bladfarve-variation. De 34 træer spænder fra 6.5 til 13 enheder i højde.

**Lianer** hænger i 12 animerede grupper. Hvert sæt gynger uafhængigt med
seeded frekvens og amplitude via `useFrame`. Toppunkterne er forankret i
træernes bladzone; segmenterne hænger lodret ned.

**Klipper** er 8 dodecahedron-par (kerne + mos-dæksel) med tilfældig
rotation og skalering per seed.

**Atmosfærisk lys:** Tre punktlys i world-space der ikke påvirkes af
kamerarotation — et grønt ambientlys dybt inde på øen ([0, 4, 26],
`0x88cc44`) og to varme fakkel-toner langs stranden.

---

## NPC og interaktion — v1

I første version er Plesiosaurus den eneste interaktive NPC på øen.
Den sidder ved molens vandkant ([−5.8, −0.22, 1.8]), halvt i vandet,
og bobber blidt op og ned via `useFrame`. Den bruger den eksisterende
`PlesiosaurusCatchModel` med `bucketIdle`- og `ambientPierNpc`-props —
identisk med NPC'en på Den Gamle Mole, men i ny kontekst.

**Interaktionsflow:**
Spilleren trykker `Escape` (frigiver pointer lock) → klikker på
Plesiosaurus → `exitPointerLock()` fyres + 60ms delay →
`JungleTravelModal` åbner. Modalen tilbyder "Bliv på øen" (re-locker
pointer lock efter 120ms) eller "Sejl tilbage ⚓" (rejser til `pier`
via `setCurrentLocation`).

---

## Rejse-scenen — PlesiosaurusTravel

Dette er konceptets mest nye tekniske element: en dedikeret **travel-scene**
der fungerer som lazy-loading wrapper og fortællemæssig overgang mellem
Den Gamle Mole og Jungleøen. Rejsen sker begge veje.

### Konceptet

I stedet for et sort loading-screen rejser spilleren synligt **på ryggen af
Plesiosaurus** hen over havet. Scenen varer 3–6 sekunder — præcis nok til
at den tunge `JungleIsland`-komponent og dens ~40 obstacles kan mountes
og initialiseres i baggrunden via React `Suspense` og dynamisk import
(`React.lazy`).

Det er en **simpel illusion**: kameraet låses til en fast "rider-position"
lidt bag og over Plesiosaurussen, der svømmer fremad langs en kurvet rute.
Spilleren kan ikke styre. Det er en cutscene-agtig overgang der føles
intentionel og immersiv frem for teknisk nødvendig.

### Teknisk struktur

```
PlesiosaurusTravel.tsx
├── TravelCamera          ← låst kamera-position bag NPC
├── TravelPlesiosaurus    ← animeret PlesiosaurusCatchModel med svømmebevægelse
├── TravelWaterEffects    ← bølger/spray ved Plesiosaurus-krop (simple meshes)
├── TravelProgress        ← intern timer der styrer varighed + Suspense-signal
└── TravelDestinationLoader  ← React.lazy + Suspense wrapper om destination
```

**State-maskine** (i `useGameStore` eller lokal komponent-state):

```
'pier' → klik NPC → travelState: 'traveling_to_jungle'
  → PlesiosaurusTravel monteres, JungleIsland lazy-loader starter
  → efter N sekunder (eller når chunk er loaded): travelState: null
  → currentLocation: 'jungle_island'

'jungle_island' → klik NPC → travelState: 'traveling_to_pier'
  → PlesiosaurusTravel monteres (spejlvendt rute)
  → currentLocation: 'pier'
```

Et nyt felt `travelState: 'traveling_to_jungle' | 'traveling_to_pier' | null`
tilføjes til `useGameStore`. Experience.tsx viser `<PlesiosaurusTravel />`
når `travelState !== null`, og skjuler normal sceneri.

### Rejseruten

**Til jungle:** Plesiosaurus starter ved molens vandkant (z ≈ 2, x = −6),
svømmer i en blød bue ud og rundt, og nærmer sig jungleøens strand fra
siden eller forfra. Kameraet ser øen vokse frem af tågen.

**Fra jungle:** Spejlvendt — øen forsvinder bagud i tågen, Den Gamle Moles
silhuet dukker frem forude.

Tåge-indstillingerne (`fogNear: 15, fogFar: 50`) er perfekte til dette:
destinationen er usynlig ved rejsens start og materialiserer sig gradvist.

### Plesiosaurus-animation under rejse

`PlesiosaurusCatchModel` er allerede animeret med bob og vip. Til rejsen
tilføjes:
- Fremad-bevægelse langs en `CatmullRomCurve3`-rute
- Langsom krop-undulering (rotation.z sinusbølge)
- Halefinne-bevægelse (hvis modellen understøtter det)
- Vandstænk-effekt: 2–3 flade, skalerede cylendre der flimrer ved
  kroppens vandlinje

### Loading-strategi

`JungleIsland.tsx` er den tunge komponent (~34 træer × multiple meshes).
Den wrappes i `React.lazy`:

```typescript
const JungleIslandLazy = React.lazy(() => import('./environments/JungleIsland'));
```

Og i `LocationScenery.tsx`:
```typescript
{locationId === 'jungle_island' ? (
  <Suspense fallback={null}>
    <JungleIslandLazy />
  </Suspense>
) : null}
```

`PlesiosaurusTravel`'s timer sættes til minimum 3.5 sekunder — uanset om
chunken loader på 0.5 sekunder eller 3 sekunder, ser spilleren altid
den fulde rejse-animation. Hvis loading tager *længere* end timeren
venter travel-scenen med at afslutte til Suspense er resolved.

---

## Gameplay-potentiale — fremtidige versioner

Jungleøen er designet som et fundament der kan udvides:

**Udforskning og collectibles**
Skjulte genstande på øen: fossiler, eksotiske planter, fortidslevninger.
Proximity-baseret pick-up (spilleren går inden for N enheder).

**Dinosaur-NPCs**
Flere forhistoriske dyr med egne animationer og interaktioner.
En `JungleMoleInteractives`-komponent (samme mønster som
`PierMoleInteractives`) der gates bag `currentLocation === 'jungle_island'`.

**Terrænhøjde**
I v1 er al bevægelse på flad y. V2 kan tilføje raycasting mod
terræn-meshene for dynamisk `GROUND_Y` — spilleren går op ad bakken
mod øens centrum, ned mod stranden.

**Særlige fisk**
`fish.ts` har ingen fisk med `primaryAreas: ['jungle_island']` endnu.
En jungle-fishing-zone ved stranden (ned fra en klippeafsats?) med
forhistoriske og eksotiske fisk ville give lokationen en ny gameplay-krog
udover ren udforskning.

**Dag/nat på øen**
Junglens tætte baldakin giver dramatisk forskel mellem dag (spredt lys
filtrerer ned) og nat (nærmest komplet mørke, kun det grønne punktlys
og eventuelle fakler). `headlampOn`-mekanikken fra `useGameStore`
ville få ekstra mening her.

**Lyddesign**
Jungleambiens (fugle, insekter, fjern brus) som separat audio-lag der
activeres på `jungle_island`. `useAudio`-hooken understøtter allerede
lokations-baseret lyd.

---

## Hvad der eksisterer i dag vs. hvad der mangler

### Eksisterer allerede
- `LocationId: 'jungle_island'` i type-systemet
- `LOCATIONS.jungle_island` med farver, tåge og regler
- Unlock-flow via Plesiosaurus-quest
- Rejse-UI i `TravelNavModal`
- Plesiosaurus → Jungle rejseflow i `PlesioNpcModal`
- Standard træmole i `LocationDock` (erstattes af `JunglePier`)
- Persistence af `jungleDiscovered`
- `backgroundZBounds`-entry

### Klar til integration (leveret)
- `JungleIsland.tsx` — øens fulde 3D-sceneri
- `JunglePier.tsx` — mosset mole + Plesiosaurus NPC
- `JunglePlayerController.tsx` — first-person controller
- `JungleTravelModal.tsx` — rejse-modal

### Mangler endnu (fremtidigt arbejde)
- `PlesiosaurusTravel.tsx` — rejse/loading-scene (koncept beskrevet ovenfor)
- Lazy-loading setup for `JungleIsland`
- `travelState` i `useGameStore`
- Jungle-specifikke fisk i `fish.ts`
- Proximity-interaktion (E-tast) som alternativ til Escape → klik
- Touch/mobile first-person kontroller
- Terrænhøjde-variation (raycasting)
- Jungle-specifik lyd

---

## Sammenfatning

Jungleøen er ikke et nyt fishing spot. Det er spillets første **verden** —
et sted man rejser til, udforsker og oplever som en destination i sig selv.
Den er teknisk kompatibel med Regnefiskens eksisterende arkitektur fordi
den respekterer alle eksisterende mønstre: ét R3F-scene-træ, Zustand-stores,
procedural geometri, betingede renders på `currentLocation`.

Det der adskiller den er to principielle designbeslutninger:

**1. Spilleren bevæger sig.** For første gang er det ikke kameraet der
er passivt låst — det er spillerens krop der navigerer i rummet.

**2. Rejsen er en del af oplevelsen.** Plesiosaurus-travel-scenen
transformerer et teknisk nødvendigt loading-beat til et narrativt øjeblik:
man *ankommer* til Jungleøen, man *forlader* den. Det giver lokationen
en emotionel vægt som ingen andre steder i spillet har.
