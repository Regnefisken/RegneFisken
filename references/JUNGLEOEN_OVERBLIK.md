# Jungleøen — Overordnet Beskrivelse

## Kort om RegneFisken

RegneFisken er et 3D-fiskespil bygget med React, TypeScript og Three.js (React Three Fiber). Spilleren kombinerer afslappet fiskeri med matematik-udfordringer: man kaster snøren ud, en fisk bider, og man skal løse et regnestykke for at hale den ind. Undervejs optjener man XP og mønter, opgraderer udstyr (stænger, madding, magnet, guldkrog), gennemfører quest-kæder (flaskepost, fossiler, skattekort) og låser nye lokationer op. Spillet har 12+ områder — fra Den Gamle Mole og Skovsøen til Dybet, Ishavet og Den Forbudte Sø — samt Fiskehytten (tre indendørs rum med møbler). Jungleøen er en særlig lokation der fungerer som udforskningsmiljø i first-person, uden det klassiske fiskeri-loop.

---

## Sådan når man Jungleøen

Jungleøen er låst bag quest-flaget `jungle_discovered`. Spilleren skal:

1. Nå tilstrækkeligt niveau og udstyr til at fiske i **Dybet**.
2. Fange **Plesiosaurus** (boss-fisk med 3 spørgsmål / 30 sek).
3. Tale med Plesiosaurus via `PlesioNpcModal` — den tilbyder at svømme spilleren til den forhistoriske ø.
4. Quest-itemet `__jungle_discovered__` tilføjes, og spilleren teleporteres til `jungle_island`.

Derefter kan Jungleøen også nås via **TravelNavModal** under fanen "Nye Verdener".

---

## Synlige Elementer

### Terræn

Øen er bygget af **koncentriske cylinder-lag** centreret omkring `(0, 14)` i world-space:

| Lag | Beskrivelse | Farve |
|-----|-------------|-------|
| Undervandsbase | Stor frustum under vandoverfladen | Mørk grøn `#2a3a2a` |
| Sand | Sandstrand rundt om øen | Sand `#c4a265` |
| Transition | Overgang strand → jord | Sand `#c4a265` |
| Jord | Indre jordring | Sand `#c4a265` |
| Skovring | Tæt skovbund | Mørk skovgrøn `#2c3824` |
| Central bakke | Forhøjning i midten | Brun jord `#4a3a28` |

Hele terrænet er løftet 0.12 enheder (`islandLift`) over vandniveauet.

### Træer (JungleTree)

Procedurale jungletræer med:
- **Stamme:** 9 stablede cylinder-segmenter med aftagende radius og let hældning.
- **Krone:** 4 stablede `icosahedronGeometry`-kugler i grøn (tre varianter: `#1a5c1a`, `#144414`, `#1e6e20`).
- **Placering:** ~34 træer i alt — 5 i et centralt cluster (de højeste, op til 13 enheder), 23 i en ring (radius 6–9 fra centrum), 6 i en ydre ring (radius 10–11, lavere).

### Klipper (JungleRock)

8 klipper fordelt rundt om øen:
- `dodecahedronGeometry` med grågrønt materiale (`#4a5040`).
- Tilfældig rotation og skala for variation.
- Placeret i en ring (radius ~8–9 fra centrum).

### Lianer (LianaGroup)

12 lianegrupper hængende fra trækronerne:
- Cylinder-segmenter i mørkegrøn (`#2e4a1a`).
- Animeret gyngebevægelse via `useFrame` (sinusbølge på `rotation.x`).
- Forankret i højde 4–8 enheder over jorden.

### Ildsted (JungleCampfire)

Bålplads i øens centrum `(0, 14)`:
- **Stenring:** 9 `dodecahedronGeometry`-sten i grå (`#555555`).
- **Brænde:** 5 stablede cylindre i mørk brun (`#3d2b18`).
- **Gløder:** 10 emissive dodecahedron-partikler (orange/rød/guld palette).
- **Flammer:** 10 animerede `octahedronGeometry`-meshes med flimrende y-position og skala.
- **Lys:** `pointLight` (varm orange `#ffaa33`, intensity 1.8 ± 0.5, rækkevidde 8).

### Ildfluer (Fireflies)

32 svævende lyspartikler:
- Små emissive sfærer (`#ffaa33`, radius 0.03).
- Bevæger sig i individuelle orbits inden for en annulus (radius 5.1–13.9 fra centrum).
- Animeret pulserende lysstyrke.
- Hver 4. ildfue har et tilknyttet `pointLight`.

### Bro (JunglePier)

En mørk træbro der strækker sig ud fra øens sydside:
- Mørke planker i rækker (`boxGeometry`).
- Sidegelændere og lodrette pæle.
- Forbinder vandkanten med øens strand.
- Ingen skygger på broen (undgår hård shadow banding på sand/træ).

### Atmosfære og miljø

| Egenskab | Værdi |
|----------|-------|
| Baggrundsfarve | Mørk junglegrøn `#1a4a1a` |
| Vandfarve | Blågrøn `#4a8fc4` |
| Tågefarve | Mørk grøn `#1a3a1a` |
| Tåge nær/fjern | 15 / 50 |
| Vejr | Tvunget mod solskin (ingen torden/lyn) |
| Vandoverflade | Rolig lagune nær øen; ingen skygger på vand |
| Skyer | Drifter i cirkelbevægelse rundt om øens centrum |
| Måger | Aktive (jungle-specifik spawn omkring centrum) |
| Nattehimmel | Jungle-specifik måneplacement |

---

## Interagerbare Objekter

### Kaptajn Rotteskæg (Pirat-NPC)

- **Placering:** Ved bålpladsen (ca. `x: 2.61, z: 16.29`), rettet mod ilden.
- **3D-model:** Bygget via `buildPirateMesh()` — krop, hoved, hat, arme med idle-animation (gyngende bevægelse).
- **Interaktion:** Klik eller FPS-raycast → åbner `JunglePirateWelcomeModal`.
- **Dialog:** "Aaarr! Velkommen, matros! Denne ø er fuld af mysterier og sjældne fisk. Pas på — junglen gemmer mange hemmeligheder..."
- **Afslut:** Knappen "Tak, kaptajn!" lukker dialogen og genoptager pointer lock.

### Plesiosaurus (Strand-NPC)

- **Placering:** Ved strandkanten (ambient model, skaleret ×8, gynger op/ned i vandet).
- **3D-model:** Genbrugt `PlesiosaurusCatchModel` med forøget skala.
- **Interaktion:** Klik eller FPS-raycast → åbner `JunglePlesioNpcModal`.
- **Dialog:** "Jeg kan svømme dig tilbage til Den Gamle Mole når som helst. Hop op!"
- **Valg:**
  - "Ja, tag mig tilbage!" → teleporterer til `pier` (Den Gamle Mole).
  - "Nej tak, jeg bliver lidt endnu" → lukker dialogen og genoptager udforskning.

### NPC-interaktion i First-Person

Begge NPC'er har `userData.jungleNpcClick`-tags (`'pirate'` / `'plesio'`). I pointer-lock-tilstand udfører `JunglePlayerController` en raycast fra skærmens centrum (sigtekornet) ved venstreklik. Rammer rayen en NPC, frigøres pointer lock, og den relevante dialog åbnes.

---

## Navigationssystem

### First-Person Controller (WASD + Mus)

Jungleøen er den eneste lokation med **first-person-styring**. Det normale `CameraRig` er deaktiveret.

| Kontrol | Handling |
|---------|----------|
| **W / A / S / D** | Bevæg fremad / venstre / bagud / højre |
| **Mus (bevægelse)** | Kig rundt (yaw + pitch) |
| **Shift** | Sprint (7 enheder/sek i stedet for 4) |
| **Mellemrum** | Hop (vertikal impuls 5, tyngdekraft -15) |
| **Venstreklik** | Interager med NPC (via raycast) |
| **Klik på canvas** | Aktiver pointer lock (skjuler mus) |
| **Escape** | Frigør pointer lock |

### Fysik og begrænsninger

- **Øjenhøjde:** 1.55 enheder over terræn.
- **Pitch-grænser:** -1.344 til +0.855 radianer.
- **Musefølsomhed:** 0.002.
- **Gangbart område:** Spilleren kan bevæge sig på broen, i overgangszonen (bro→strand), og overalt inden for øens radius (26.4 enheder fra centrum). Forsøg på at gå ud over kanten blokeres — systemet tillader sliding langs grænsen.
- **Terrænfølgning:** Kameraets y-position tilpasses løbende terrænet — spilleren går op ad bakken mod centrum og ned mod stranden.
- **Spawn:** Spilleren starter på broen (`x: -0.01, y: 2.25, z: -23.23`) og kigger mod øen.

### Rejse til/fra Jungleøen

| Retning | Metode |
|---------|--------|
| **Til øen** | Fang Plesiosaurus i Dybet → NPC-dialog teleporterer til `jungle_island`. Derefter også via TravelNavModal ("Nye Verdener"). |
| **Fra øen** | Klik på strand-Plesiosaurus → vælg "Tag mig tilbage" → teleporteres til Den Gamle Mole. Alternativt: åbn TravelNavModal fra HUD. |

### Sigtekorn (Crosshair)

I stedet for det normale fiskeri-UI viser `FishingControls` et minimalistisk sigtekorn (kryds) midt på skærmen — gennemsigtigt og uden interaktion.

---

## Aktiviteter på Jungleøen

Jungleøen er aktuelt en **udforsknings-lokation** — det klassiske fiskeri-loop (kast → bid → regnestykke) er **ikke aktivt** her. Scenen behandles som en "world"-lokation (ligesom hyttens rum): ingen `FishPool`, fiskestang, flåd eller spand renderes.

De nuværende aktiviteter er:

1. **Fri udforskning** i first-person af den 3D-procedurale jungleø.
2. **NPC-interaktion** med Kaptajn Rotteskæg (velkomstdialog).
3. **NPC-interaktion** med Plesiosaurus (rejse tilbage).

> *Bemærk:* `collectibleTypes` er tom for Jungleøen — der er ikke konfigureret samleobjekter endnu. Kaptajn Rotteskægs dialog antyder fremtidige "mysterier og sjældne fisk", hvilket peger mod planlagt indhold.
