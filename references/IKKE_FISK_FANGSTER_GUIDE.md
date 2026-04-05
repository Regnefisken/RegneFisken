# Regnefisken — Komplet Guide til Ikke-Fisk Fangster

> Alt du kan fange i spillet som **ikke** er en almindelig fisk: quest-items, junk, bosser, samleobjekter, farlige fangster og specielle skabninger.

---

## Indhold

1. [Overblik over fangst-systemet](#overblik-over-fangst-systemet)
2. [Quest Items](#quest-items)
3. [Samleobjekter (Collectibles)](#samleobjekter-collectibles)
4. [Specielle Skabninger & Bosser](#specielle-skabninger--bosser)
5. [Skattekister (Treasure)](#skattekister-treasure)
6. [Junk / Skrald](#junk--skrald)
7. [Farlige Fangster](#farlige-fangster)
8. [Kæledyr / Companions](#kæledyr--companions)
9. [Madding & Forbrugsvarer](#madding--forbrugsvarer)
10. [Alle Lokationer](#alle-lokationer)
11. [Alle NPC'er](#alle-npcer)

---

## Overblik over fangst-systemet

Når spilleren kaster snøren, afgøres fangsten i følgende prioriterede rækkefølge:

1. **Konkylie-madding** — 30% chance for konkylie (hvis Sød Madding er aktiv)
2. **Fossil-slam** — 25% chance for fossil (hvis Fossil-slam er aktiv)
3. **Flaskepost** — 5% chance (kun hvis spilleren endnu ikke har `map_left`)
4. **Fossil** — variabel chance baseret på lokation og level (kun på lokationer med `fossilBonus`, blokeret ved `junkStreak >= 3`)
5. **Plesiosaurus** — 4% chance (kun i Dybet, kun med mystisk madding aktiv)
6. **Konkylie** — 2% tilfældig chance
7. **Brandmand** — 2% chance (kun på lokationer hvor brandmand kan dukke op)
8. **Junk** — 12% chance
9. **Boss-pool** — 10% chance (kun relevante bosser baseret på lokation og aktive baits)
10. **Legendarisk madding** — garanteret legendarisk fisk (hvis aktiv)
11. **Normal fangst** — rarity-baseret tilfældig fisk eller skattekiste fra loot-tabellen

Alle fangster kræver, at spilleren løser et regnestykke for at beholde fangsten.

---

## Quest Items

### Flaskepost

| Egenskab | Værdi |
|----------|-------|
| **ID** | `flaskepost` |
| **Type** | Quest |
| **Sjældenhed** | Quest |
| **Vægt** | 0,5 kg |
| **Salgsværdi** | 0 kr |
| **Matematik-kamp** | 1 spørgsmål, ingen tidsbegrænsning |

**Beskrivelse:** En mystisk flaskepost der driver i vandet. Den indeholder venstre halvdel af et skattekort.

**Hvordan man finder den:** Når spilleren endnu ikke har fået `map_left`, er der 5% chance per kast for at fange en flaskepost — uanset lokation. Så snart `map_left` er optjent, kan flaskepost ikke længere fanges.

**Hvad den bruges til:** Ved succesfuld fangst modtager spilleren `map_left` (venstre halvdel af skattekortet). Når dette kombineres med `map_right` (købes i butikken for 2.000 kr), låses **Den Forbudte Sø** op.

**Lokationer i data:** Den Gamle Mole, Skovsøen, Dybet (men roll-logikken tjekker ikke lokation — den kan fanges overalt).

---

### Fiskehyttens Nøgle

| Egenskab | Værdi |
|----------|-------|
| **ID** | `cabin_key` |
| **Type** | Quest |
| **Sjældenhed** | Quest |
| **Vægt** | — |
| **Salgsværdi** | 0 kr |
| **XP** | 10 |
| **Matematik-kamp** | Ingen (springer matematik over) |

**Beskrivelse:** En gammel, rusten nøgle til Fiskehytten.

**Hvordan man finder den:** Nøglen fanges **ikke** via det normale fangst-system. I stedet skal spilleren:
1. Købe **Magnet** i butikken (650 kr, level 6)
2. Bruge magneten på molen via "Brug Magnet"-knappen i `PierCabinHint`
3. Nøglen dukker op uden matematik-kamp

**Hvad den bruges til:** Låser op for **Fiskehytten** (stue, køkken og soveværelse) — spillerens base hvor kæledyr bor, og møbler kan placeres.

---

### Mystisk Fossil

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fossil` |
| **Type** | Quest |
| **Sjældenhed** | Mystisk |
| **Vægt** | 3,0 kg |
| **Salgsværdi** | 0 kr |
| **Matematik-kamp** | 1 spørgsmål, ingen tidsbegrænsning |

**Beskrivelse:** Et urgammelt fossil fra forhistorisk tid, indhyllet i sten og mystik.

**Hvordan man finder den:** Fossiler kan fanges på tre lokationer der har `fossilBonus`:
- **Skovsøen** (`fossilBonus: 0.006`) — lav bonus
- **Dybet** (`fossilBonus: 0.015`) — medium bonus
- **Den Forbudte Sø** (`fossilBonus: 0.03`) — højeste bonus

Basis-chance: `1.5% + max(0, level−5) × 0.2% + fossilBonus`, med en max-cap på **8%**. Fossil kan ikke droppes under boss-kampe, eller hvis spillerens junk-streak er 3 eller mere.

**Fossil-slam:** Maddingen "Fossil-slam" (købes i butikken for 160 kr, level 12) giver **25% chance per kast** i 10 minutter — langt højere end den naturlige chance.

**Hvad de bruges til:** Fossiler leveres til **Kaptajn Rotteskæg** på Den Forbudte Sø. Milestones:
- **1 fossil:** Kæmpe Hvalbøf (bruges til at lokke Krakenen frem)
- **5 fossiler:** Klistret Kødklump (bruges til at lokke Søuhyret frem)
- **10 fossiler:** Mystisk Madding (nødvendig for at fange Plesiosaurus)

---

### Konkylie

| Egenskab | Værdi |
|----------|-------|
| **ID** | `konkylie` |
| **Type** | Quest |
| **Sjældenhed** | Quest |
| **Vægt** | 0,3 kg |
| **Salgsværdi** | 0 kr |
| **Matematik-kamp** | 1 spørgsmål, ingen tidsbegrænsning |

**Beskrivelse:** En smuk konkylie fra havbunden med en spiral-formet skal.

**Hvordan man finder den:** Der er **2% tilfældig chance** per kast for at fange en konkylie. Derudover giver **Sød Madding** (`bait_conch`, 85 kr) en **30% chance** per kast i 10 minutter.

**Lokationer i data:** Den Gamle Mole, Den Tropiske Ø, Ishavet, Den Forbudte Sø.

**Hvad de bruges til:** Konkylier leveres til **Den Kolde Pingvin** i Ishavet. Milestones:
- **1 konkylie:** Pingvinen giver en **ost** (låser Rotten op som kæledyr)
- **5 konkylier:** +1.000 mønter og +1.000 XP
- **10 konkylier:** +2.000 mønter og +2.000 XP

---

### Halvt Skattekort (højre)

| Egenskab | Værdi |
|----------|-------|
| **ID** | `map_right` |
| **Type** | Butiksvare |
| **Pris** | 2.000 kr |
| **Krav** | Level 10 |

**Beskrivelse:** Højre halvdel af det mystiske skattekort. Købes i butikken.

**Hvad den bruges til:** Kombineres med `map_left` (fra flaskepost) for at låse **Den Forbudte Sø** op.

---

## Samleobjekter (Collectibles)

### Østers med Perle

| Egenskab | Værdi |
|----------|-------|
| **ID** | `oyster` |
| **Type** | Boss |
| **Sjældenhed** | Boss |
| **Vægt** | ~800 kg (boss-vægt) |
| **Matematik-kamp** | 3 spørgsmål, 30 sek tidsbegrænsning |
| **Special** | `pearlDrop` — giver en perle til inventory |

**Beskrivelse:** En stor østers der indeholder en glitrende perle.

**Hvordan man finder den:** Østers dukker op i boss-poolen i **Dybet** (Abyss). Der er 10% chance for at ramme boss-poolen, og østers er én af de mulige bosser. Med **Perlelim** aktiv (2.200 kr, level 14, varighed 10 min) ganges østers-entries i boss-poolen med **7** (dvs. 7 ud af mulige entries), hvilket drastisk øger chancen.

**Hvad perlen bruges til:** Perler leveres til **Havfruen** i Dybet (kræver level 17+). Milestones:
- **1 perle:** +500 mønter og +500 XP
- **5 perler:** +1.500 mønter og +1.500 XP
- **10 perler:** +2.500 mønter og +2.500 XP

---

### Ost (Cheese)

Oste er samle-objekter spredt rundt i verden. Der er flere kilder:
- **Butikken:** Gammel Stærk Ost (850 kr)
- **Pingvin-milestone:** Den Kolde Pingvin giver ost for 1. konkylie
- **Piratkiste:** Klik på piratkisten ved Den Forbudte Sø

At samle oste bruges til at **låse Rotten op som kæledyr**.

---

### Fjer (Feathers)

Fjer er samle-objekter spredt rundt i verden. Der er flere kilder:
- **Butikken:** Tropisk Papegøjefjer (1.500 kr, level 8) — kan købes op til 3 gange
- **Måger:** Saml op fra måge-interaktioner (`SeagullFeather`)
- **Skildpadde:** Via vild-skildpadde-interaktion

At samle **3 fjer** låser **Papegøjen** op som kæledyr.

---

### Ur-Krystal

| Egenskab | Værdi |
|----------|-------|
| **ID** | `ur_krystal` |
| **Type** | Special |
| **Sjældenhed** | Mystisk |
| **Salgsværdi** | 2.500 kr |
| **XP** | +200 |
| **Matematik-kamp** | 1 spørgsmål, ingen tidsbegrænsning |
| **Special** | `crystalReward` — sætter `crystalFound` flag |

**Beskrivelse:** En urgammel, glødende krystal fra dybt inde i grotten. Ekstremt sjælden og værdifuld.

**Hvordan man finder den:** Ur-Krystallen er defineret med lokation **Den Mørke Grotte** (cave). Den er kategoriseret som `type: 'special'` med `itemType: 'crystal_junk'`. Grotten har `collectibleTypes: ['crystal']` som markerer at krystaller kan findes der.

**Hvad den bruges til:** Sælges for **2.500 kr** og giver **+200 XP**. Udløser `crystalFound` flaget, som tæller mod målet "Grottens Hjerte" (+200 XP, +500 kr belønning) og det overordnede "Grotteudforsker"-mål.

---

## Specielle Skabninger & Bosser

### Den Gyldne Frø

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_gylden_frø` |
| **Type** | Fish (men speciel) |
| **Sjældenhed** | Legendarisk |
| **Lokationer** | Ørkensøen |
| **Salgsværdi** | 120 kr |
| **XP** | 45 |
| **Krav** | Ingen stang/madding-krav |
| **Special** | `unlockGoldenFrogFurniture` |

**Beskrivelse:** En gylden, glødende frø der er ekstremt sjælden. Den har en guldfarve (0xFFD700) med emissiv glød.

**Hvordan man finder den:** Den Gyldne Frø kan kun fanges i **Ørkensøen**. Med **Farverig Flue**-madding (300 kr) ganges loot-vægten med **4.0**, hvilket markant øger chancen. Almindelige frøer har en høj lootWeight (30), men den gyldne frø har standard legendarisk chance.

**Hvad den bruges til:** Ved fangst låses Den Gyldne Frø op som **kæledyr** i Fiskehytten, hvor den kan flyttes rundt som møbel.

---

### Glødende Axolotl

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_axolotl` |
| **Type** | Fish (speciel) |
| **Sjældenhed** | Legendarisk |
| **Lokationer** | Den Mørke Grotte |
| **Salgsværdi** | 150 kr |
| **XP** | 60 |
| **Krav** | Mahogni Stang + Selvlysende Prop |
| **Matematik-kamp** | 1 spørgsmål, ingen tidsbegrænsning |
| **Special** | `companionUnlock` |

**Beskrivelse:** Et lysende, pink padde-dyr der lever dybt i Den Mørke Grotte. Den har emissiv glød (hot pink) og ål-lignende hale.

**Hvordan man finder den:** Kræver:
1. **Mahogni Stang** (2.500 kr, level 10)
2. **Selvlysende Prop** (1.350 kr, level 15) — permanent opgradering
3. Fisk i **Den Mørke Grotte**

Axolotlen indgår i den legendariske fangst-pool for grotten.

**Hvad den bruges til:** Låser axolotlen op som **kæledyr** i Fiskehytten. Sætter `has_axolotl` quest-flag. Tæller mod målet "Lysende Venskab" (+400 XP).

---

### Gnavne-Gorm

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_gnavne_gorm` |
| **Type** | Fish (boss) |
| **Sjældenhed** | Legendarisk |
| **Lokationer** | Den Mørke Grotte |
| **Salgsværdi** | 250 kr |
| **XP** | 100 |
| **Krav** | Mahogni Stang |
| **Matematik-kamp** | 6 spørgsmål, 30 sek tidsbegrænsning |
| **Special** | `bossReward` |

**Beskrivelse:** En kæmpestor, vred grottefisk der fungerer som grottens boss. Mørk, klodset og aggressiv med en "chunky" hale.

**Hvordan man finder den:** Kræver Mahogni Stang. Fiskes i **Den Mørke Grotte** som legendarisk fangst. Boss-kampen kræver 6 korrekte svar inden for 30 sekunder.

**Hvad den bruges til:** Giver belønning ved sejr. Sætter `gormDefeated` flag. Tæller mod "Vred og Besejret" (+600 XP, +1.000 kr) og "Grotteudforsker"-målet.

---

### Helleflynder

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_helleflynder` |
| **Type** | Fish (speciel) |
| **Sjældenhed** | Mystisk |
| **Lokationer** | Den Gamle Mole, Skovsøen, Den Tropiske Ø, Dybet, Ishavet, Den Forbudte Sø |
| **Salgsværdi** | 0 kr |
| **XP** | 50 |
| **Matematik-kamp** | 1 spørgsmål, ingen tidsbegrænsning |
| **Special** | `wishMenu` — åbner ønskemenuen |

**Beskrivelse:** En mystisk, stor fladfisk der kan opfylde ønsker. Kan fanges op til 3 gange total, og giver ét ønske per fangst.

**Hvordan man finder den:** Helleflynderen er i den mystiske rarity-pool (1% base-chance) og kan dukke op på næsten alle fiske-lokationer.

**Hvad den bruges til:** Ved fangst åbnes **Ønskemenuen** med tre mulige ønsker (ét per fangst, max 3 total):

| Ønske | Effekt |
|-------|--------|
| **Venskab** (friend) | Låser **Aben** op som kæledyr/matematik-hjælper |
| **Kærlighed** (love) | Giver en **Hjerteballon** der gemmer sig rundt i spillet |
| **Rigdom** (wealth) | +1.000 kroner |

At bruge alle 3 ønsker udløser målet "Ønskebrønden" (+1.000 XP, +1.000 kr).

---

### Plesiosaurus

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_plesiosaurus` |
| **Type** | Fish |
| **Sjældenhed** | Forhistorisk |
| **Lokationer** | Dybet |
| **Salgsværdi** | 300 kr |
| **XP** | 120 |
| **Vægt** | 200–600 kg (data), 450 kg (roll) |
| **Krav** | Mahogni Stang + Mystisk Madding |
| **Matematik-kamp** | 3 spørgsmål, 30 sek tidsbegrænsning |
| **Special** | `consumeBait` — forbruger den mystiske madding |

**Beskrivelse:** Et forhistorisk havuhyre fra dinosaurernes tid. Kæmpestort med dinosaur-hale.

**Hvordan man finder den:**
1. Lever **10 fossiler** til Kaptajn Rotteskæg for at få **Mystisk Madding**
2. Brug Mahogni Stang
3. Fisk i **Dybet** med mystisk madding aktiv
4. 4% chance per kast når betingelserne er opfyldt

**Hvad den bruges til:** Ved fangst forbruges maddingen (`consumeBait`). Fangsten sætter `plesio_defeated` flag og fører til **Jungleøen** via `PlesioNpcModal` (sætter `jungle_discovered`).

---

### Kraken

| Egenskab | Værdi |
|----------|-------|
| **ID** | `kraken` |
| **Type** | Boss |
| **Sjældenhed** | Legendarisk |
| **Lokationer** | Den Forbudte Sø |
| **Vægt** | ~800 kg |
| **Krav** | Kæmpe Hvalbøf (aktiv) + Kraken ikke allerede besejret |
| **Matematik-kamp** | 3 spørgsmål, 30 sek tidsbegrænsning |
| **Special** | `krakenPenalty` |

**Beskrivelse:** Den legendariske Kraken — et gigantisk blæksprutte-monster fra piratlegender.

**Hvordan man finder den:**
1. Lever **1 fossil** til Kaptajn Rotteskæg → modtag **Kæmpe Hvalbøf**
2. Aktiver hvalbøfen
3. Fisk på **Den Forbudte Sø**
4. 10% chance for boss-pool, Kraken er en mulig boss

Kan kun fanges **én gang** (blokeret efter `krakenDefeated`).

**Effekt:** `krakenPenalty` — en negativ konsekvens ved fangst. Udløser målet "Du mødte Krakken" (+300 XP, +500 kr).

---

### Hvidhaj

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_hvidhaj` |
| **Type** | Boss |
| **Sjældenhed** | Boss |
| **Lokationer** | Den Tropiske Ø |
| **Vægt** | 800–2.268 kg |
| **Salgsværdi** | 200 kr |
| **XP** | 80 |
| **Krav** | Mahogni Stang |
| **Matematik-kamp** | 6 spørgsmål, 30 sek tidsbegrænsning |
| **Special** | `bossReward` |

**Beskrivelse:** En enorm hvidhaj med hvid bug. Spillets mest frygtindgydende rovdyr.

**Hvordan man finder den:** Dukker op i boss-poolen på **Den Tropiske Ø**. Med **Hajblod** aktiv (1.850 kr, level 12, 10 min) ganges haj-entries i boss-poolen med **6**, hvilket kraftigt øger chancen.

---

### Søuhyre

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_soeuhyre` |
| **Type** | Boss |
| **Sjældenhed** | Legendarisk |
| **Lokationer** | Ørkensøen |
| **Vægt** | 1.200–2.800 kg |
| **Salgsværdi** | 280 kr |
| **XP** | 140 |
| **Krav** | Mahogni Stang + Klistret Kødklump (aktiv) |
| **Matematik-kamp** | 6 spørgsmål, 32 sek tidsbegrænsning |
| **Special** | `soeuhyre_boss` |

**Beskrivelse:** Et enormt, mystisk uhyre fra ørkenens dybeste søer.

**Hvordan man finder den:**
1. Lever **5 fossiler** til Kaptajn Rotteskæg → modtag **Klistret Kødklump**
2. Aktiver kødklumpen
3. Brug Mahogni Stang
4. Fisk i **Ørkensøen**
5. 10% chance for boss-pool

Kan kun fanges **én gang** (blokeret efter `soeuhyreDefeated`).

---

### Den Gyldne Karpe

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_gyldne_karpe` |
| **Type** | Fish |
| **Sjældenhed** | Legendarisk |
| **Lokationer** | Alle |
| **Salgsværdi** | 750 kr |
| **XP** | 100 |
| **Loot-vægt** | 0.5 (meget lav) |
| **Krav** | Guld Krog (permanent upgrade, 3.950 kr, level 18) |

**Beskrivelse:** En strålende gylden karpe der glitrer som guld. Den har metallic udseende med høj emissiv glød.

**Hvordan man finder den:** Kræver **Guld Krog**-opgraderingen fra butikken. Kan derefter fanges på **alle lokationer**, men med en meget lav loot-vægt (0.5), hvilket gør den ekstremt sjælden selv inden for den legendariske pool.

---

### Piratfisk (Piranha)

| Egenskab | Værdi |
|----------|-------|
| **ID** | `fisk_piratfisk` |
| **Type** | Fish |
| **Sjældenhed** | Sjælden |
| **Lokationer** | Den Tropiske Ø, Ørkensøen |
| **Krav** | Havblå Stang |
| **Matematik-kamp** | 3 spørgsmål, 25 sek tidsbegrænsning |
| **Special** | `bucketWipe` — tømmer spanden |

**Beskrivelse:** En aggressiv piranha-fisk med røde finner og hurtig bevægelse. Pas på — den æder dine andre fisk!

**Effekt:** Ved fangst udløses `bucketWipe`, som tømmer spillerens spand for fisk (undtagen Plesiosaurus).

---

## Skattekister (Treasure)

Skattekister er i den normale rarity-baserede loot-tabel og kan fanges på **alle lokationer**.

| Navn | Sjældenhed | Vægt | Salgsværdi | XP |
|------|-----------|------|-----------|-----|
| **Lille Sunket Kiste** | Almindelig | 8–28 kg | 50 kr | 15 |
| **Sunket Kiste** | Sjælden | 30–120 kg | 100 kr | 30 |
| **Stor Sunket Kiste** | Legendarisk | 85–220 kg | 200 kr | 60 |

Skattekister kræver **1 spørgsmål** uden tidsbegrænsning for at beholde.

---

## Junk / Skrald

Junk fanges med **12% chance** per kast (når det ikke er en boss-kamp). Alle junk-items giver sjældenhed **Skrald** og kræver **1 spørgsmål** uden tidsbegrænsning.

### Globalt Junk (alle lokationer)

| Navn | Vægt | XP | Salgsværdi |
|------|------|----|-----------|
| **Gammelt Bildæk** | 4,0–5,5 kg | 2 | 0 kr |
| **Rustent Cykelhjul** | 1,5–2,2 kg | 2 | 0 kr |
| **Enlig Gummihandske** | 0,2–0,4 kg | 2 | 0 kr |
| **Tom Plastikflaske** | 0,3–0,5 kg | 2 | 1 kr |
| **Våd Bamse** | 0,7–1,1 kg | 3 | 0 kr |
| **Klistret Havtang** | 0,5–1,2 kg | 2 | 0 kr |

### Lokationsspecifikt Junk

| Navn | Lokation | Vægt | XP |
|------|----------|------|----|
| **Rusten Dykkermaske** | Dybet | 0,8–1,5 kg | 2 |
| **Ødelagt Undervandskamera** | Dybet | 1,2–2,0 kg | 2 |
| **Solbrillestel** | Ørkensøen | 0,1–0,3 kg | 2 |
| **Falmet Søkort** | Ørkensøen | 0,05–0,2 kg | 2 |
| **Flosset Reb** | Ishavet | 1,0–2,5 kg | 2 |
| **Ødelagt Ispilk** | Ishavet | 0,3–0,8 kg | 2 |
| **Piratflagstump** | Den Forbudte Sø | 0,1–0,4 kg | 2 |
| **Rustent Sværd** | Den Forbudte Sø | 2,0–4,0 kg | 2 |
| **Flagermusknogle** | Den Mørke Grotte | 0,05–0,15 kg | 2 |
| **Gammel Fakkel** | Den Mørke Grotte | 0,5–1,2 kg | 2 |

**Fallback:** Hvis ingen junk matcher lokationen (bør ikke ske), bruges "Gammel Støvle" (1,5 kg).

**Junk Streak:** Spillet tracker `currentJunkStreak` og `bestJunkStreak`. Hvis junk-streak er ≥ 3, blokeres fossil-drops midlertidigt. Målet "Rent Vand" kræver 10 fangster i træk uden skrald.

---

## Farlige Fangster

### Brandmand (Vandmand)

| Egenskab | Værdi |
|----------|-------|
| **ID** | `brandmand` |
| **Type** | Danger |
| **Sjældenhed** | Fare |
| **Lokationer** | Den Gamle Mole, Den Tropiske Ø, Den Forbudte Sø |
| **Vægt** | 0,1 kg |
| **Matematik-kamp** | 1 spørgsmål, ingen tidsbegrænsning |
| **Special** | `bucketWipe` — tømmer spanden |

**Beskrivelse:** En giftig brandmand (vandmand) der brænder og ødelægger din fangst.

**Effekt:** Ved fangst tømmes spillerens spand for alle fisk (undtagen Plesiosaurus). **2% chance** per kast på relevante lokationer.

Udløser det hemmelige mål "Av, det brænder!" (+50 XP, +100 kr).

---

## Kæledyr / Companions

Kæledyr er ikke fangster i sig selv, men nogle låses op via fangster og samleobjekter.

| Kæledyr | Ikon | Beskrivelse | Hvordan den låses op |
|---------|------|-------------|---------------------|
| **Rotten** | 🐀 | Fortæller fiskefakta | Saml nok oste (fra verden og butik) |
| **Papegøjen** | 🦜 | Siger kloge og fjollede ting | Saml 3 fjer (fra verden og butik) |
| **Skildpadden** | 🐢 | Bor i fiskehytten | Udrug skildpaddeæg fra Den Tropiske Ø |
| **Aben** | 🐒 | Matematik-hjælper | Ønsk "Venskab" fra Helleflynderen |
| **Hjerteballon** | 🎈 | Gemmer sig rundt i spillet | Ønsk "Kærlighed" fra Helleflynderen |
| **Den Gyldne Frø** | 🐸 | Kan flyttes rundt i hytten | Fang Den Gyldne Frø i Ørkensøen |
| **Glødende Axolotl** | 🦎 | Et lysende padde-dyr | Fang Axolotl i Den Mørke Grotte |
| **Gammel Ost** | 🧀 | Bor i fiskehytten | Køb i butikken |

### Skildpaddeæg-quest

1. Besøg **Den Tropiske Ø** (kræver Robåd)
2. Find et **skildpaddeæg** (`turtle_egg` quest-item)
3. Ægget udruges over tid (timer)
4. Når spilleren forlader Den Tropiske Ø med ægget, sættes `left_island_with_egg` flag
5. Ægget udklækkes til en baby-skildpadde (`turtle_hatched`)
6. Skildpadden bliver kæledyr i Fiskehytten

Udløser målet "Nyt Liv" (+300 XP).

---

## Madding & Forbrugsvarer

Disse er ikke fangster, men påvirker hvilke specielle items man kan fange.

| Madding | Pris | Krav | Varighed | Effekt |
|---------|------|------|----------|--------|
| **Farverig Flue** | 300 kr | Level 3 | 10 min | Frøer ×3 loot-vægt, Gyldne Frø ×4 |
| **Sød Madding** | 85 kr | Level 5 | 10 min | 30% chance for konkylie per kast |
| **Fossil-slam** | 160 kr | Level 12 | 10 min | 25% chance for fossil per kast |
| **Hajblod** | 1.850 kr | Level 12 | 10 min | Hvidhaj ×6 i boss-pool |
| **Perlelim** | 2.200 kr | Level 14 | 10 min | Østers ×7 i boss-pool |
| **Legendarisk Maddingspakke** | 4.500 kr | Level 16 | Engangsbrug | Garanteret 1 legendarisk fisk |

**Quest-madding (fra fossiler til Kaptajn Rotteskæg):**

| Madding | Krav | Effekt |
|---------|------|--------|
| **Kæmpe Hvalbøf** | 1 fossil → Rotteskæg | Aktiverer Kraken i Den Forbudte Sø |
| **Klistret Kødklump** | 5 fossiler → Rotteskæg | Aktiverer Søuhyre i Ørkensøen |
| **Mystisk Madding** | 10 fossiler → Rotteskæg | Aktiverer Plesiosaurus i Dybet (4% chance) |

---

## Alle Lokationer

| # | ID | Navn | Type | Krav for adgang | Særlige regler |
|---|-----|------|------|----------------|----------------|
| 1 | `pier` | **Den Gamle Mole** | Fiskeri | Level 1 (startlokation) | Har måger, ost og fjer som samleobjekter |
| 2 | `smaragd` | **Skovsøen** | Fiskeri | Level 3 + Rejsekort + Fisketilladelse: Skovsøen | `fossilBonus: 0.006`, har måger, ost som samleobjekt |
| 3 | `abyss` | **Dybet** | Fiskeri | Level 8 + Rejsekort + Fisketilladelse: Dybet | `plesioChance: 0.04`, `fossilBonus: 0.015`, mørk lokation, kræver Bambus-stang |
| 4 | `forbidden` | **Den Forbudte Sø** | Fiskeri | Komplet skattekort (`map_left` + `map_right`) | `fossilBonus: 0.03`, mørk lokation, har måger og fjer |
| 5 | `desert_lake` | **Ørkensøen** | Fiskeri | Fuldt ørkensæt (4 items) | Har måger |
| 6 | `arctic_sea` | **Ishavet** | Fiskeri | Fuldt ishavssæt (4 items) | Har måger, fjer som samleobjekt |
| 7 | `tropical_island` | **Den Tropiske Ø** | Fiskeri | Robåd | Skildpaddeæg, kræver Mahogni-stang, har måger |
| 8 | `cave` | **Den Mørke Grotte** | Fiskeri | Robåd + Pandelampe | Bioluminescens-boost, kræver Mahogni-stang + Pandelampe, krystaller som samleobjekt, ingen måger |
| 9 | `jungle_island` | **Jungleøen** | Verden | Opdag via Plesiosaurus-fangst | Forhistorisk jungleø, har måger |
| 10 | `cabin_living` | **Fiskehytten — Stue** | Base | Magnet + Fiskehyttens Nøgle | Ingen fiskeri, kæledyr-base |
| 11 | `cabin_kitchen` | **Fiskehytten — Køkken** | Base | Magnet + Fiskehyttens Nøgle | Rustikt køkken med udsigt |
| 12 | `cabin_bedroom` | **Fiskehytten — Soveværelse** | Base | Magnet + Fiskehyttens Nøgle | Et stille soveværelse |

### Udstyrssæt til lokationer

**Ørkensæt** (kræves alle til Ørkensøen):
- Solbriller (200 kr)
- Vandflaske (150 kr)
- Solhat (175 kr)
- Solcreme (125 kr)

**Ishavssæt** (kræves alle til Ishavet):
- Hue (200 kr)
- Handsker (175 kr)
- Varmedunk (150 kr)
- Halstørklæde (125 kr)

---

## Alle NPC'er

| # | NPC | Ikon | Lokation | Rolle |
|---|-----|------|----------|-------|
| 1 | **Kaptajn Rotteskæg** | 🏴‍☠️ | Den Forbudte Sø | Modtager **fossiler**. Giver hvalbøf (1), kødklump (5) og mystisk madding (10) som belønning. Har også en piratkiste med ost. |
| 2 | **Den Kolde Pingvin** | 🐧 | Ishavet | Modtager **konkylier**. Giver ost/Rotten-unlock (1), XP+mønter (5, 10). Bygger sit konkylie-hus. |
| 3 | **Havfruen** | 🧜‍♀️ | Dybet | Modtager **perler** (fra østers). Kræver level 17+ for at dukke op. Giver XP+mønter (1, 5, 10). |
| 4 | **Plesiosaurus** | 🦕 | Molen (ambient) + modaler | Optræder som ambient creature ved molen. Efter fangst i Dybet fører den til opdagelsen af Jungleøen. |
| 5 | **Jungle-pirat** | 🏴‍☠️ | Jungleøen | Byder velkommen til Jungleøen via `JunglePirateWelcomeModal`. |
| 6 | **Jungle-plesiosaurus** | 🦕 | Jungleøen | Ambient plesiosaurus på Jungleøen. |
| 7 | **Rotten** | 🐀 | Fiskehytten (companion) | Kæledyr der fortæller fiskefakta. Låses op via oste-samling. |
| 8 | **Papegøjen** | 🦜 | Fiskehytten (companion) | Kæledyr der fortæller jokes. Låses op via fjer-samling (3 fjer). |
| 9 | **Aben** | 🐒 | Molen + Fiskehytten | Matematik-hjælper kæledyr. Låses op via Helleflynder-ønske "Venskab". |
| 10 | **Skildpadden** | 🐢 | Den Tropiske Ø → Fiskehytten | Starter som æg på Den Tropiske Ø, udruges til kæledyr. Giver fjer via vild-skildpadde-interaktion. |

---

## Opsummering af Quest-Chains

### Fiskehytten-kæden
`Køb Magnet` → `Brug Magnet på molen` → `Fiskehyttens Nøgle` → `Fiskehytten låses op`

### Skattekort-kæden
`Fang Flaskepost (map_left)` + `Køb Halvt Skattekort (map_right)` → `Den Forbudte Sø låses op`

### Fossil-kæden
`Fang fossiler` → `Lever til Kaptajn Rotteskæg` → `1: Hvalbøf (Kraken)` → `5: Kødklump (Søuhyre)` → `10: Mystisk Madding (Plesiosaurus)`

### Plesiosaurus-kæden
`10 fossiler til piraten` → `Mystisk Madding` → `Fang Plesiosaurus i Dybet` → `Jungleøen opdages`

### Grotte-kæden
`Køb Robåd + Pandelampe` → `Grotten åbnes` → `Find Axolotl + Ur-Krystal + Besejr Gnavne-Gorm` → `Grotteudforsker-mål`

### Helleflynder-kæden
`Fang Helleflynder (op til 3 gange)` → `Vælg ønske: Venskab/Kærlighed/Rigdom` → `Ønskebrønden-mål`
