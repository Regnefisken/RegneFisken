# Omfordeling af Særlig Madding — Analyse & Implementeringsplan

## 1. Nuværende System (FØR)

I dag er **alle tre special-baits gated bag fossiler → piraten**:

| Milestone | NPC | Collectible | Belønning |
|-----------|-----|-------------|-----------|
| 1 fossil til piraten | Kaptajn Rotteskæg | 🦴 Fossil | 🥩 Kæmpe Hvalbøf (`hvalbof`) |
| 5 fossiler til piraten | Kaptajn Rotteskæg | 🦴 Fossil | 🍖 Klistret Kødklump (`koedklump`) |
| 10 fossiler til piraten | Kaptajn Rotteskæg | 🦴 Fossil | 🎣 Mystisk Madding (`bait`) |

Pingvinen (konkylier) og havfruen (perler) giver kun XP/coins og ost — ingen madding overhovedet.

### Hvad hver madding låser op

| Madding | Kode-nøgle | Låser op for | Lokation |
|---------|------------|--------------|----------|
| Kæmpe Hvalbøf | `hvalbof` | Kraken (boss) | Den Forbudte Sø |
| Klistret Kødklump | `koedklump` | Søuhyre (boss) | Ørkensøen |
| Mystisk Madding | `bait` | Plesiosaurus | Dybet |

---

## 2. Ønsket System (EFTER)

| Milestone | NPC | Collectible | Belønning |
|-----------|-----|-------------|-----------|
| 1 fossil til piraten | Kaptajn Rotteskæg | 🦴 Fossil | 🥩 **Kæmpe Hvalbøf** (uændret) |
| 5 fossiler til piraten | Kaptajn Rotteskæg | 🦴 Fossil | ~~Kødklump~~ → **ny belønning** (se nedenfor) |
| 10 fossiler til piraten | Kaptajn Rotteskæg | 🦴 Fossil | ~~Mystisk madding~~ → **ny belønning** (se nedenfor) |
| 5 konkylier til pingvinen | Den Kolde Pingvin | 🐚 Konkylie | ~~XP/coins~~ → 🍖 **Klistret Kødklump** |
| 1 perle til havfruen | Havfruen | 💎 Perle | ~~XP/coins~~ → 🎣 **Mystisk Madding** |

### Hvad er uberørt

- Pingvin milestone 1 (ost/cheese) — **UBERØRT** ✅
- Pirat milestone 1 (hvalbøf) — **UBERØRT** ✅
- Al fisk-data (requiredBait-felter) — **UBERØRT** ✅
- BaitTab UI — **UBERØRT** ✅ (reagerer allerede på state-flags)
- catch-engine bait-filtrering — **UBERØRT** ✅

---

## 3. Berørte Filer — Komplet Oversigt

### Fil 1: `src/data/collectibles.ts`
**Hovedændringen. Alt data-drevet.**

#### 3a. Pirat: Fjern kødklump og mystisk madding fra milestone 5 og 10

**Nuværende (linje 13-15):**
```ts
milestoneRewards: {
  1: { type: 'hvalbof', toast: '🏴‍☠️🥩 Piraten er imponeret! ...', particles: 40 },
  5: { type: 'koedklump', toast: '🏴‍☠️🍖 Piraten giver dig en Klistret Kødklump ...', particles: 60 },
  10: { type: 'bait', toast: '🏴‍☠️🎣 Piraten trækker en mystisk madding frem ...', particles: 80 },
},
```

**Forslag — erstat milestone 5 og 10 med XP/coins:**
```ts
milestoneRewards: {
  1: { type: 'hvalbof', toast: '🏴‍☠️🥩 Piraten er imponeret! Her – tag en Kæmpe Hvalbøf! Brug den til at lokke Krakenen frem i Dybet!', particles: 40 },
  5: { type: 'xp_coins', xp: 1200, coins: 1200, toast: '🏴‍☠️💰 Splitte mine bramsejl! 5 fossiler – her er en skat fra kisten! +1200 mønter & +1200 XP', particles: 60 },
  10: { type: 'xp_coins', xp: 2500, coins: 2500, toast: '🏴‍☠️💰 TI fossiler!! Du er en legende, matros! +2500 mønter & +2500 XP', particles: 80 },
},
```

#### 3b. Pirat: Opdater dialog-funktion

**Nuværende dialoger der refererer til madding (linje 19-23):**
```ts
if (d === 1) return '"Et fossil! Godt gået, matros! Tag denne hvalbøf – den lugter af eventyr!"';
if (d === 5) return '"FEM fossiler! Splitte mine bramsejl – her, tag denne klæbrige kødklump!"';
if (d === 10) return '"TI fossiler!! Du har fortjent den mystiske madding fra min skattekiste! 🏴‍☠️"';
```

**Forslag:**
```ts
if (d === 1) return '"Et fossil! Godt gået, matros! Tag denne hvalbøf – den lugter af eventyr!"';  // uændret
if (d === 5) return '"FEM fossiler! Splitte mine bramsejl – her er guld fra skattekisten!"';
if (d === 10) return '"TI fossiler!! Du er en legende, matros – tag dette skatte-guld! 🏴‍☠️"';
```

#### 3c. Pingvin: Tilføj kødklump ved milestone 5

**Nuværende (linje 37):**
```ts
5: { type: 'xp_coins', xp: 1000, coins: 1000, toast: '🐧 GAKGAK! +1000 mønter & +1000 XP', particles: 50 },
```

**Forslag:**
```ts
5: { type: 'koedklump', toast: '🐧🍖 GAKGAK! Pingvinen graver en Klistret Kødklump frem fra sneen! Brug den til at lokke Søuhyret frem i Ørkensøen!', particles: 50 },
```

#### 3d. Pingvin: Opdater dialog for milestone 5

**Nuværende (linje 44):**
```ts
if (d === 5) return '"FEM!! Nu har jeg et rigtigt vindue i skjulet! GAKGAK!!"';
```

**Forslag:**
```ts
if (d === 5) return '"FEM!! GAKGAK! Se hvad jeg fandt under isen – en klistret kødklump! Tag den!!"';
```

#### 3e. Havfrue: Tilføj mystisk madding ved milestone 1

**Nuværende (linje 59):**
```ts
1: { type: 'xp_coins', xp: 500, coins: 500, toast: '🧜‍♀️ Havfruen danser i vandet! +500 mønter & +500 XP', particles: 30 },
```

**Forslag:**
```ts
1: { type: 'bait', toast: '🧜‍♀️🎣 Havfruen smiler og rækker dig en Mystisk Madding fra havets bund! Nu kan du fiske i Dybet!', particles: 30 },
```

#### 3f. Havfrue: Opdater dialog for milestone 1

**Nuværende (linje 65):**
```ts
if (d === 1) return '"En perle! Den glitrer som stjernerne på havets bund ✨"';
```

**Forslag:**
```ts
if (d === 1) return '"En perle! Tag denne mystiske madding som tak – den virker i Dybet! ✨"';
```

---

### Fil 2: `src/logic/catch-engine.ts` — getRequirementText()

**Nuværende (linje 125-127):**
```ts
if (req.requiredBait === 'bait') text.push('Mystisk madding (10 fossiler til piraten)');
if (req.requiredBait === 'koedklump') text.push('Klistret Kødklump 🍖 (5 fossiler til piraten)');
if (req.requiredBait === 'hvalbof') text.push('Kæmpe Hvalbøf 🥩 (1 fossil til piraten)');
```

**Forslag:**
```ts
if (req.requiredBait === 'bait') text.push('Mystisk Madding 🎣 (1 perle til havfruen)');
if (req.requiredBait === 'koedklump') text.push('Klistret Kødklump 🍖 (5 konkylier til pingvinen)');
if (req.requiredBait === 'hvalbof') text.push('Kæmpe Hvalbøf 🥩 (1 fossil til piraten)');
```

---

## 4. Filer Der IKKE Skal Røres

| Fil | Hvorfor den er sikker |
|-----|----------------------|
| `src/data/fish.ts` | `requiredBait`-felter er uændrede — Kraken kræver stadig `hvalbof`, Søuhyre stadig `koedklump`, Plesiosaurus stadig `bait` |
| `src/components/chest/BaitTab.tsx` | Reagerer på `hvalbofActive` / `koedklumpActive` / `activeBait` state — uberørt |
| `src/components/modals/CollectibleModal.tsx` | `applyReward()` håndterer allerede alle reward-typer generisk (linje 44-46) — uberørt |
| `src/store/usePlayerStore.ts` | State-felter er de samme — uberørt |
| `src/logic/game-persistence.ts` | Gemmer/loader de samme state-felter — uberørt |
| `src/three/environments/*Npc*.tsx` | NPC-interaktioner kalder blot `setShowCollectibleModal()` — uberørt |

---

## 5. Migration / Backward Compatibility

**Ikke relevant.** Alle spillere (nye og eksisterende) vil foretage hard-reset ved udgivelse. Der er ingen saves at migrere, og ingen retroaktiv logik er nødvendig.

Det betyder at `game-persistence.ts` **ikke skal røres** — hverken med migrations-kode eller andre tilpasninger.

---

## 6. Edge Cases & Risici

| Edge Case | Risiko | Håndtering |
|-----------|--------|------------|
| Spiller leverer 5 konkylier på én gang med "Giv ALLE" | ✅ Intet problem — CollectibleModal tjekker milestones for hvert trin (linje 119-134) | Ingen ændring nødvendig |
| Spiller har allerede kødklump fra piraten (gammel save) | ✅ Ikke relevant — hard-reset ved udgivelse | Alle starter forfra |
| Havfruen giver mystisk madding, men spiller er under level 17 | ✅ Havfruen er slet ikke tilgængelig under level 17 (AbyssMermaidNpc.tsx linje 26) | Naturlig gating |
| Spiller fisker med mystisk madding, leverer perle, triggers reward igen | ✅ Milestone 1 triggeres kun én gang (delivered tæller aldrig ned) | `applyReward` med `type: 'bait'` sætter bare `activeBait = 'bait'` igen — harmløst |
| Toast-besked nævner forkert NPC | ⚠️ Skal manuelt verificeres | Alle nye toasts er skrevet ovenfor — verificer dem |

---

## 7. Opsummering — Ændringer i Rækkefølge

1. **`src/data/collectibles.ts`** — 6 ændringer (pirat milestones 5+10, pirat dialog 5+10, pingvin milestone 5 + dialog, havfrue milestone 1 + dialog)
2. **`src/logic/catch-engine.ts`** — 2 linje-ændringer i `getRequirementText()` (opdater hint-tekst)

**Total påvirkning: 2 filer. Ingen strukturelle ændringer. Kun data og tekst.**

---

## 8. Tjekliste Før Deploy

- [ ] Verificer at pirat milestone 1 (hvalbøf) stadig virker uberørt
- [ ] Verificer at pingvin milestone 1 (ost) stadig virker uberørt
- [ ] Test: lever 5 konkylier → modtag kødklump → fisk Søuhyre i Ørkensøen
- [ ] Test: lever 1 perle til havfruen → modtag mystisk madding → fisk Plesiosaurus i Dybet
- [ ] Test: BaitTab viser korrekt aktive baits
- [ ] Test: Fishopedia/krav-tekst viser opdaterede hints
- [ ] Test: "Giv ALLE" med >5 konkylier trigger kødklump korrekt
- [ ] Verificer at hard-reset fungerer korrekt (ingen gammel state lækker igennem)
