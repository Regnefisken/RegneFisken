# Jungleøen: End-game mega-pool

## Opgave

Gør Jungleøen til et end-game fiskested hvor alle spillets fisk kan fanges i én samlet pulje. Implementeringen skal UDELUKKENDE tilføje `'jungle_island'` til eksisterende fisks `primaryAreas` — ingen fisk må fjernes fra andre lokationer, ingen loot-weights må ændres, ingen achievements/mål skal opdateres.

## Vigtige regler

1. **Tilføj KUN `'jungle_island'` til `primaryAreas`-arrays** — ændr aldrig de eksisterende lokationer i arrayet
2. **Rør IKKE** ved fisk der allerede har `'all'` i primaryAreas (de virker allerede)
3. **Rør IKKE** ved entries med `type: 'boss'`, `type: 'quest'`, `type: 'danger'` eller `itemType: 'crystal_junk'`
4. **Rør IKKE** ved `fisk_plesiosaurus` (spawner via separat gate, ikke rarity-poolen)
5. **Rør IKKE** ved nogen filer ud over `src/data/fish.ts` og `src/data/locations.ts`
6. **Ingen ændringer** i `catch-engine.ts`, `rarity.ts`, `enrichment.ts`, `progression.ts` eller nogen UI-filer

---

## Fil 1: `src/data/fish.ts`

Tilføj `'jungle_island'` til `primaryAreas` for følgende 77 fisk. Bevar alle eksisterende lokationer i arrayet — tilføj kun den nye.

### Almindelig (36 fisk)

| Linje | ID | Nuværende `primaryAreas` | Ny `primaryAreas` |
|-------|----|--------------------------|--------------------|
| 16 | `fisk_torsk` | `['pier','arctic_sea']` | `['pier','arctic_sea','jungle_island']` |
| 63 | `fisk_sild` | `['pier','arctic_sea']` | `['pier','arctic_sea','jungle_island']` |
| 107 | `fisk_skrubbe` | `['pier']` | `['pier','jungle_island']` |
| 153 | `fisk_makrel` | `['pier']` | `['pier','jungle_island']` |
| 196 | `fisk_hornfisk` | `['pier']` | `['pier','jungle_island']` |
| 198 | `fisk_roedspette` | `['pier']` | `['pier','jungle_island']` |
| 236 | `fisk_ising` | `['pier']` | `['pier','jungle_island']` |
| 268 | `fisk_fjaesing` | `['pier']` | `['pier','jungle_island']` |
| 270 | `fisk_skalle` | `['pier','smaragd']` | `['pier','smaragd','jungle_island']` |
| 357 | `fisk_sej` | `['pier']` | `['pier','jungle_island']` |
| 534 | `fisk_ulk` | `['pier']` | `['pier','jungle_island']` |
| 576 | `fisk_hork` | `['pier','smaragd']` | `['pier','smaragd','jungle_island']` |
| 611 | `fisk_frø` | `['pier','smaragd','cave','forbidden','desert_lake']` | `['pier','smaragd','cave','forbidden','desert_lake','jungle_island']` |
| 313 | `fisk_aborre` | `['smaragd']` | `['smaragd','jungle_island']` |
| 390 | `fisk_brasen` | `['smaragd']` | `['smaragd','jungle_island']` |
| 1543 | `fisk_regnbueørred` | `['smaragd']` | `['smaragd','jungle_island']` |
| 1589 | `fisk_grundling` | `['smaragd']` | `['smaragd','jungle_island']` |
| 1620 | `fisk_løje` | `['smaragd']` | `['smaragd','jungle_island']` |
| 612 | `fisk_soestjerne` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 613 | `fisk_klovnefisk` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 615 | `fisk_papegojefisk` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 661 | `fisk_blaa_tang` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 1664 | `fisk_lygtefisk` | `['abyss']` | `['abyss','jungle_island']` |
| 1665 | `fisk_fangtandfisk` | `['abyss']` | `['abyss','jungle_island']` |
| 1666 | `fisk_dybhavsål` | `['abyss']` | `['abyss','jungle_island']` |
| 1667 | `fisk_havedderkop` | `['abyss']` | `['abyss','jungle_island']` |
| 1671 | `fisk_ørkengrundling` | `['desert_lake']` | `['desert_lake','jungle_island']` |
| 1715 | `fisk_sandbarbe` | `['desert_lake']` | `['desert_lake','jungle_island']` |
| 1760 | `fisk_niltilapia` | `['desert_lake']` | `['desert_lake','jungle_island']` |
| 1853 | `fisk_lodde` | `['arctic_sea']` | `['arctic_sea','jungle_island']` |
| 1895 | `fisk_hellefisk` | `['arctic_sea']` | `['arctic_sea','jungle_island']` |
| 1932 | `fisk_spøgelsesål` | `['forbidden']` | `['forbidden','jungle_island']` |
| 1933 | `fisk_skeletfisk` | `['forbidden']` | `['forbidden','jungle_island']` |
| 1935 | `fisk_sumptorsk` | `['forbidden']` | `['forbidden','jungle_island']` |
| 2082 | `fisk_blind_grottefisk` | `['cave']` | `['cave','jungle_island']` |
| 2126 | `fisk_grottekrebs` | `['cave']` | `['cave','jungle_island']` |

### Sjælden (27 fisk)

| Linje | ID | Nuværende `primaryAreas` | Ny `primaryAreas` |
|-------|----|--------------------------|--------------------|
| 532 | `fisk_gedde` | `['smaragd']` | `['smaragd','jungle_island']` |
| ~697 | `fisk_laks` | `['smaragd','arctic_sea']` | `['smaragd','arctic_sea','jungle_island']` |
| 748 | `fisk_havørred` | `['smaragd']` | `['smaragd','jungle_island']` |
| 791 | `fisk_pighvar` | `['pier']` | `['pier','jungle_island']` |
| 835 | `fisk_aal` | `['smaragd','desert_lake']` | `['smaragd','desert_lake','jungle_island']` |
| 837 | `fisk_stør` | `['smaragd']` | `['smaragd','jungle_island']` |
| 881 | `fisk_krabbe` | `['pier','tropical_island']` | `['pier','tropical_island','jungle_island']` |
| 883 | `fisk_havkat` | `['abyss','arctic_sea']` | `['abyss','arctic_sea','jungle_island']` |
| 916 | `fisk_sandart` | `['smaragd']` | `['smaragd','jungle_island']` |
| 961 | `fisk_kulmule` | `['abyss']` | `['abyss','jungle_island']` |
| 1009 | `fisk_havtaske` | `['abyss']` | `['abyss','jungle_island']` |
| 1011 | `fisk_knurhane` | `['pier']` | `['pier','jungle_island']` |
| 1051 | `fisk_lange` | `['abyss']` | `['abyss','jungle_island']` |
| 1096 | `fisk_multe` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 1139 | `fisk_suder` | `['smaragd']` | `['smaragd','jungle_island']` |
| 1184 | `fisk_karpe` | `['smaragd','desert_lake']` | `['smaragd','desert_lake','jungle_island']` |
| 1228 | `fisk_brosme` | `['abyss']` | `['abyss','jungle_island']` |
| 1272 | `fisk_blaeksprutte` | `['abyss','tropical_island','arctic_sea']` | `['abyss','tropical_island','arctic_sea','jungle_island']` |
| 699 | `fisk_muraene` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 700 | `fisk_kejserfisk` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 701 | `fisk_piratfisk` | `['tropical_island','desert_lake']` | `['tropical_island','desert_lake','jungle_island']` |
| 1811 | `fisk_oase_malle` | `['desert_lake']` | `['desert_lake','jungle_island']` |
| 2127 | `fisk_drypstensål` | `['cave']` | `['cave','jungle_island']` |
| 2129 | `fisk_underjordisk_malle` | `['cave']` | `['cave','jungle_island']` |
| 1991 | `fisk_kaptajnens_karpe` | `['forbidden']` | `['forbidden','jungle_island']` |
| 2029 | `fisk_piratål` | `['forbidden']` | `['forbidden','jungle_island']` |
| 2030 | `fisk_giftig_søslange` | `['forbidden']` | `['forbidden','jungle_island']` |

### Legendarisk (13 fisk)

| Linje | ID | Nuværende `primaryAreas` | Ny `primaryAreas` |
|-------|----|--------------------------|--------------------|
| 1276 | `fisk_kaempe_tun` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 1322 | `fisk_haj` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 1363 | `fisk_svaerdfisk` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 1409 | `fisk_hummer` | `['pier','abyss']` | `['pier','abyss','jungle_island']` |
| 1411 | `fisk_klumpfisk` | `['abyss']` | `['abyss','jungle_island']` |
| 1449 | `fisk_sildehaj` | `['abyss']` | `['abyss','jungle_island']` |
| 1480 | `fisk_rokke` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 1481 | `fisk_petersfisk` | `['tropical_island']` | `['tropical_island','jungle_island']` |
| 2032 | `fisk_dødningehaj` | `['forbidden']` | `['forbidden','jungle_island']` |
| 2078 | `fisk_guldtentakel` | `['forbidden']` | `['forbidden','jungle_island']` |
| 1929 | `fisk_narhval` | `['arctic_sea']` | `['arctic_sea','jungle_island']` |
| 1488 | `fisk_gylden_frø` | `['desert_lake']` | `['desert_lake','jungle_island']` |
| 1487 | `fisk_gnavne_gorm` | `['cave']` | `['cave','jungle_island']` |

### Mystisk (1 fisk)

| Linje | ID | Nuværende `primaryAreas` | Ny `primaryAreas` |
|-------|----|--------------------------|--------------------|
| 1484 | `fisk_helleflynder` | `['pier','smaragd','tropical_island','abyss','arctic_sea','forbidden']` | `['pier','smaragd','tropical_island','abyss','arctic_sea','forbidden','jungle_island']` |

### Legendarisk — OGSÅ tilføj (1 fisk)

| Linje | ID | Nuværende `primaryAreas` | Ny `primaryAreas` |
|-------|----|--------------------------|--------------------|
| 1486 | `fisk_axolotl` | `['cave']` | `['cave','jungle_island']` |

**Total: 78 fisk der skal opdateres.**

---

## Entries der IKKE skal røres

Disse entries skal forblive præcis som de er:

### Allerede globale (`primaryAreas: ['all']`)
- `fisk_gyldne_karpe` (linje 1408) — virker allerede overalt
- `sunket_kiste_lille`, `sunket_kiste`, `sunket_kiste_stor` — virker allerede

### Bosser (`type: 'boss'`) — spawner via boss-gate, ikke rarity-pool
- `fisk_hvidhaj` (linje 1490, `type: 'boss'`)
- `fisk_soeuhyre` (linje 2208, `type: 'boss'`)
- `kraken` (linje 2205, `type: 'boss'`)
- `oyster` (linje 2206, `type: 'boss'`)

### Quest/special items (`type: 'quest'` eller `type: 'danger'`)
- `flaskepost` — `type: 'quest'`, spawner via 5% gate
- `fossil` — `type: 'quest'`, spawner via fossilBonus gate
- `konkylie` — `type: 'quest'`, spawner via 2% gate
- `sardine` — `type: 'quest'`, spawner via sardineBonus gate
- `cabin_key` — `type: 'quest'`, spawner via UI-knap
- `brandmand` — `type: 'danger'`, spawner via 2% gate
- `ur_krystal` — `type: 'quest'`, `itemType: 'crystal_junk'`, spawner via crystal gate

### Forhistorisk — separat gate
- `fisk_plesiosaurus` (linje 1485) — spawner via `plesioChance` i `specialRules`

### Junk (`type: 'junk'`)
- Alle junk-entries — rør dem ikke. Universal junk virker allerede via `['all']`.

---

## Fil 2: `src/data/locations.ts`

Ændr jungle_island-konfigurationen (linje 180-188). Tilføj `requiresMahogni: true` til `specialRules`:

**Før:**
```ts
jungle_island: {
  id: 'jungle_island', name: 'Jungleøen', emoji: '🦕', unlockLevel: 1, requiresItem: '__jungle_discovered__',
  type: 'world', description: 'En forhistorisk jungleø — opdaget med Plesiosaurus',
  bgColor: 0x1a4a1a, waterColor: 0x228855, fogColor: 0x1a3a1a,
  fogNear: 15, fogFar: 50,
  specialRules: { nothingChance: 0, hasSeagulls: true },
  collectibleTypes: [],
  lockReason: 'Opdag øen via Plesiosaurus'
},
```

**Efter:**
```ts
jungle_island: {
  id: 'jungle_island', name: 'Jungleøen', emoji: '🦕', unlockLevel: 1, requiresItem: '__jungle_discovered__',
  type: 'world', description: 'En forhistorisk jungleø — opdaget med Plesiosaurus',
  bgColor: 0x1a4a1a, waterColor: 0x228855, fogColor: 0x1a3a1a,
  fogNear: 15, fogFar: 50,
  specialRules: { nothingChance: 0, requiresMahogni: true, hasSeagulls: true },
  collectibleTypes: [],
  lockReason: 'Opdag øen via Plesiosaurus'
},
```

Eneste ændring: `requiresMahogni: true` tilføjet til `specialRules`. Alt andet forbliver — `type: 'world'`, `collectibleTypes: []`, ingen `fossilBonus`, ingen `sardineBonus`, ingen `plesioChance`.

---

## Filer der IKKE skal ændres

- `src/logic/catch-engine.ts` — ingen ændringer
- `src/logic/rarity.ts` — ingen ændringer
- `src/data/enrichment.ts` — ingen ændringer
- `src/data/combat.ts` — ingen ændringer
- `src/data/progression.ts` — ingen ændringer (ingen nye achievements)
- `src/components/modals/TravelNavModal.tsx` — ingen ændringer
- `src/components/fishing/FishingControls.tsx` — ingen ændringer
- `src/store/useGameStore.ts` — ingen ændringer
- Alle andre filer — ingen ændringer

---

## Verifikation

Efter implementering, verificer følgende:

1. **Fisk på andre lokationer er uændrede** — kør spillet, fisk på molen, tjek at fangster er de samme som før
2. **Jungle-fiskeri giver alle typer** — fisk på Jungleøen, tjek at du får fisk fra alle lokationer
3. **Bosser spawner IKKE på Jungleøen** — der skal ingen boss-encounters være (ingen Hvidhaj, Kraken, Søuhyre, Østers)
4. **Quest-items er upåvirkede** — fossiler dropper stadig kun på lokationer med `fossilBonus`, sardiner kun på smaragd, kabinnøgle kun via magnet-knap
5. **Tom Krog forekommer ikke** — med 36+ almindelige fisk i puljen er der altid et fallback
6. **Plesiosaurus spawner IKKE på Jungleøen** — ingen `plesioChance` i specialRules
