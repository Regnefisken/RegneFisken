# Regnefisken Endgame-belonninger — Implementeringsguide

## Oversigt

Denne guide beskriver alle kodeaendringer for at erstatte de flade XP+coins milestone-belonninger (milestone 5 og 10) hos de tre NPC-samlere (pirat, pingvin, havfrue) med meningsfulde, sammenkoblede belonninger. Derudover tilfojes en kaelderlem i kokkenet og en ny lokation.

### Hovedaendringer

1. **5 nye milestone reward-typer** i type-systemet
2. **Nye milestone-belonninger**: Skibskatten Kradse (kaeled-yr), Piratens Skattekiste (moebel), Mystisk Isterning (moebel), Spilledaase (moebel), Jungle-noegle (quest-item)
3. **Mesterfisker-dialog** hos alle 3 NPC'er naar alle har naaet 10+
4. **4 nye 3D-komponenter**: CabinCat, PirateChestFurniture, IceCubeFurniture, MusicBoxFurniture
5. **Kaelderlem i kokkenet** (synlig fra dag 1, laast)
6. **cabin_cellar lokation** (grayed-out i rejsemenu)
7. **6 nye achievements** + GoalStats-felter
8. **Pergament + jungle-noegle** i TreasureTab
9. **PetTab** opdateret for 9. kaeled-yr

### Ingen nye dependencies

Alle aendringer bruger eksisterende pakker (react, three, @react-three/fiber, zustand).

---

## TRIN 1: Udvid MilestoneRewardType

**Fil:** `src/types/collectibles.ts`

Find den eksisterende `MilestoneRewardType` union type og tilfoej 5 nye vaerdier:

```ts
// FIND:
export type MilestoneRewardType =
  | 'hvalbof'
  | 'koedklump'
  | 'bait'
  | 'cheese'
  | 'xp_coins';

// ERSTAT MED:
export type MilestoneRewardType =
  | 'hvalbof'
  | 'koedklump'
  | 'bait'
  | 'cheese'
  | 'xp_coins'
  | 'pirate_cat'
  | 'pirate_chest_furniture'
  | 'ice_cube_furniture'
  | 'music_box_furniture'
  | 'jungle_key';
```

Resten af filen forbliver uaendret.

---

## TRIN 2: Opdater collectibles.ts (milestone rewards + companion + mesterfisker-dialog)

**Fil:** `src/data/collectibles.ts`

### 2a. Tilfoej import oevrst

```ts
// FIND (linje 1):
import type { CollectibleId, CollectiblesRegistry, CompanionDef } from '../types/collectibles.js';

// ERSTAT MED:
import type { CollectibleId, CollectiblesRegistry, CompanionDef } from '../types/collectibles.js';
import { useCollectionStore } from '../store/useCollectionStore.js';
```

### 2b. Udskift fossil milestone 5 og 10

```ts
// FIND (inde i fossil.milestoneRewards):
      5: { type: 'xp_coins', xp: 1200, coins: 1200, toast: '🏴‍☠️💰 Splitte mine bramsejl! 5 fossiler – her er en skat fra kisten! +1200 mønter & +1200 XP', particles: 60 },
      10: { type: 'xp_coins', xp: 2500, coins: 2500, toast: '🏴‍☠️💰 TI fossiler!! Du er en legende, matros! +2500 mønter & +2500 XP', particles: 80 },

// ERSTAT MED:
      5: { type: 'pirate_cat', toast: '🏴‍☠️🐱 Piraten trækker katten Kradse op af hatten! Tag ham med hjem, matros!', particles: 60 },
      10: { type: 'pirate_chest_furniture', toast: '🏴‍☠️📦 Piraten giver dig sin gamle skattekiste! Nøglen er dog forsvundet...', particles: 80 },
```

### 2c. Udskift fossil dialogs-funktion

```ts
// FIND (hele fossil dialogs-funktionen):
    dialogs: (d) => {
      if (d === 0) return '"Arrr! Har du knogle-rester til kaptajnen, matros?"';
      if (d === 1) return '"Et fossil! Godt gået, matros! Tag denne hvalbøf – den lugter af eventyr!"';
      if (d < 5) return `"${d} fossiler! Du er en rigtig skatte-rotte!"`;
      if (d === 5) return '"FEM fossiler! Splitte mine bramsejl – her er guld fra skattekisten!"';
      if (d < 10) return `"${d} fossiler! Du sejler snart bedre end mig!"`;
      if (d === 10) return '"TI fossiler!! Du er en legende, matros – tag dette skatte-guld! 🏴‍☠️"';
      return `"${d} fossiler – du er den største skattejæger siden Sorte Skæg!"`;
    },

// ERSTAT MED:
    dialogs: (d) => {
      if (d >= 10) {
        const st = useCollectionStore.getState().collectibleDelivered;
        if (st.fossil >= 10 && st.conch >= 10 && st.pearl >= 10) {
          return '"Du er den største fisker, havet nogensinde har set, matros. Selv min bedstefars bedstefar ville tage hatten af for dig!"';
        }
      }
      if (d === 0) return '"Arrr! Har du knogle-rester til kaptajnen, matros?"';
      if (d === 1) return '"Et fossil! Godt gået, matros! Tag denne hvalbøf – den lugter af eventyr!"';
      if (d < 5) return `"${d} fossiler! Du er en rigtig skatte-rotte!"`;
      if (d === 5) return '"FEM fossiler! Arrr, min gamle skibskat savner eventyr. Tag ham med hjem, matros!"';
      if (d < 10) return `"${d} fossiler! Du sejler snart bedre end mig!"`;
      if (d === 10) return '"TI fossiler!! Her, tag min gamle skattekiste. Nøglen er desværre blevet væk! 🏴‍☠️"';
      return `"${d} fossiler – du er den største skattejæger siden Sorte Skæg!"`;
    },
```

### 2d. Udskift conch milestone 10

```ts
// FIND (inde i conch.milestoneRewards):
      10: { type: 'xp_coins', xp: 2000, coins: 2000, toast: '🐧 Pingvinen laver en dans for dig! +2000 mønter & +2000 XP', particles: 80 },

// ERSTAT MED:
      10: { type: 'ice_cube_furniture', toast: '🐧🧊 Pingvinen graver en mystisk isterning frem fra den dybeste is! Den er iskold – og der sidder noget fast inde i den...', particles: 80 },
```

### 2e. Udskift conch dialogs-funktion

```ts
// FIND (hele conch dialogs-funktionen):
    dialogs: (d) => {
      if (d === 0) return '"Brrr… det er koldt! Har du en konkylie til mit hus?"';
      if (d === 1) return '"Gak gak! Første konkylie! Jeg er så glad!! 🐧"';
      if (d < 5) return `"${d} konkylier! Mit hus bliver større og større!"`;
      if (d === 5) return '"FEM!! GAKGAK! Se hvad jeg fandt under isen – en klistret kødklump! Tag den!!"';
      if (d < 10) return `"${d} konkylier! Det er det flotteste pingvin-palads!"`;
      if (d === 10) return '"TI konkylier!! Mit hus er nu et SLOT! Du er min bedste ven!"';
      return `"${d} konkylier – jeg elsker dig for evigt! 🐧❤️"`;
    },

// ERSTAT MED:
    dialogs: (d) => {
      if (d >= 10) {
        const st = useCollectionStore.getState().collectibleDelivered;
        if (st.fossil >= 10 && st.conch >= 10 && st.pearl >= 10) {
          return '"GAKGAK!! Du er min bedste ven i hele verden! Alle pingvinerne i Ishavet kender dit navn!"';
        }
      }
      if (d === 0) return '"Brrr… det er koldt! Har du en konkylie til mit hus?"';
      if (d === 1) return '"Gak gak! Første konkylie! Jeg er så glad!! 🐧"';
      if (d < 5) return `"${d} konkylier! Mit hus bliver større og større!"`;
      if (d === 5) return '"FEM!! GAKGAK! Se hvad jeg fandt under isen – en klistret kødklump! Tag den!!"';
      if (d < 10) return `"${d} konkylier! Det er det flotteste pingvin-palads!"`;
      if (d === 10) return '"TI konkylier!! Mit hus er nu et SLOT! Tag denne mystiske isterning – du er Ishavets Konge! 👑🧊"';
      return `"${d} konkylier – jeg elsker dig for evigt! 🐧❤️"`;
    },
```

### 2f. Udskift pearl milestone 5 og 10

```ts
// FIND (inde i pearl.milestoneRewards):
      5: { type: 'xp_coins', xp: 1500, coins: 1500, toast: '🧜‍♀️ Havfruen giver dig et perle-kys! +1500 mønter & +1500 XP', particles: 50 },
      10: { type: 'xp_coins', xp: 2500, coins: 2500, toast: '🧜‍♀️ Havfruen synger en smuk sang for dig! +2500 mønter & +2500 XP', particles: 80 },

// ERSTAT MED:
      5: { type: 'music_box_furniture', toast: '🧜‍♀️🎵 Havfruen giver dig en smuk spilledåse — den indeholder havets evige melodi!', particles: 50 },
      10: { type: 'jungle_key', toast: '🧜‍♀️🗝️ Havfruen giver dig en mystisk nøgle! Den passer til en kiste på Jungleøen...', particles: 80 },
```

### 2g. Udskift pearl dialogs-funktion

```ts
// FIND (hele pearl dialogs-funktionen):
    dialogs: (d) => {
      if (d === 0) return '"Åh… en gæst fra overfladen! Har du en lille perle til mig?"';
      if (d === 1) return '"En perle! Tag denne mystiske madding som tak – den virker i Dybet! ✨"';
      if (d < 5) return `"${d} perler… Mit hjerte svømmer af glæde!"`;
      if (d === 5) return '"FEM perler! Nu kan jeg næsten lave mit halsbånd! 💖"';
      if (d < 10) return `"${d} perler! Havet synger dit navn, lille fisker!"`;
      if (d === 10) return '"TI perler!! Det bliver det smukkeste smykke nogensinde! 🌊"';
      return `"${d} perler i alt – du er en ægte ven af havet! 🧜‍♀️"`;
    },

// ERSTAT MED:
    dialogs: (d) => {
      if (d >= 10) {
        const st = useCollectionStore.getState().collectibleDelivered;
        if (st.fossil >= 10 && st.conch >= 10 && st.pearl >= 10) {
          return '"Havet synger dit navn for evigt, lille fisker... Du har givet mig glæde nok til tusind år. 🌊💙"';
        }
      }
      if (d === 0) return '"Åh… en gæst fra overfladen! Har du en lille perle til mig?"';
      if (d === 1) return '"En perle! Tag denne mystiske madding som tak – den virker i Dybet! ✨"';
      if (d < 5) return `"${d} perler… Mit hjerte svømmer af glæde!"`;
      if (d === 5) return '"FEM perler! Mit halsbånd tager form... Tag denne spilledåse — den indeholder havets evige melodi! 🪞✨"';
      if (d < 10) return `"${d} perler! Havet synger dit navn, lille fisker!"`;
      if (d === 10) return '"TI perler!! Tag denne nøgle — den har ligget på havbunden i århundreder. Der findes en kiste på en jungle-ø... 🗝️🌊"';
      return `"${d} perler i alt – du er en ægte ven af havet! 🧜‍♀️"`;
    },
```

### 2h. Tilfoej Kradse til COMPANIONS_DATABASE

```ts
// FIND (sidste entry i COMPANIONS_DATABASE arrayet):
  { id: 'cheese_pet', name: 'Gammel Ost', icon: '🧀', emoji: '🧀', color: '#f59e0b', description: 'En købt ost der bor i fiskehytten.', unlockType: 'cheese_bought' },
];

// ERSTAT MED:
  { id: 'cheese_pet', name: 'Gammel Ost', icon: '🧀', emoji: '🧀', color: '#f59e0b', description: 'En købt ost der bor i fiskehytten.', unlockType: 'cheese_bought' },
  { id: 'pirate_cat', name: 'Skibskatten Kradse', icon: '🐱', emoji: '🐱', color: '#f97316', description: 'Piratens gamle skibskat — strejfer rundt i fiskehytten', unlockType: 'pirate_fossil_milestone' },
];
```

---

## TRIN 3: Udvid applyReward() i CollectibleModal.tsx

**Fil:** `src/components/modals/CollectibleModal.tsx`

Find `applyReward()`-funktionens afslutning (efter xp_coins-blokken) og tilfoej 5 nye cases:

```ts
// FIND (slutningen af applyReward):
  if (r.type === 'xp_coins' && 'xp' in r && 'coins' in r) {
    setCoins((c) => c + r.coins);
    const { level, xp, levelUps } = applyXP(progression.level, progression.xp, r.xp);
    setProgression({ level, xp });
    if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
  }
}

// ERSTAT MED:
  if (r.type === 'xp_coins' && 'xp' in r && 'coins' in r) {
    setCoins((c) => c + r.coins);
    const { level, xp, levelUps } = applyXP(progression.level, progression.xp, r.xp);
    setProgression({ level, xp });
    if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
  }
  if (r.type === 'pirate_cat') {
    useCollectionStore.getState().setUnlockedCompanions((prev) =>
      prev.includes('pirate_cat') ? prev : [...prev, 'pirate_cat'],
    );
  }
  if (r.type === 'pirate_chest_furniture') {
    usePlayerStore.getState().unlockFurniture('pirate_chest');
  }
  if (r.type === 'ice_cube_furniture') {
    usePlayerStore.getState().unlockFurniture('ice_cube');
  }
  if (r.type === 'music_box_furniture') {
    usePlayerStore.getState().unlockFurniture('music_box');
  }
  if (r.type === 'jungle_key') {
    usePlayerStore.getState().setQuestItems((prev) =>
      prev.includes('jungle_chest_key') ? prev : [...prev, 'jungle_chest_key'],
    );
  }
}
```

**Vigtigt:** `useCollectionStore` og `usePlayerStore` er allerede importeret i filen.

---

## TRIN 4: PetTab.tsx — unlockHint for Kradse

**Fil:** `src/components/chest/PetTab.tsx`

```ts
// FIND (i unlockHint switch):
    case 'cheese_bought':
      return '🧀 Køb Gammel Stærk Ost i butikken';
    default:

// ERSTAT MED:
    case 'cheese_bought':
      return '🧀 Køb Gammel Stærk Ost i butikken';
    case 'pirate_fossil_milestone':
      return '🏴‍☠️ Giv 5 fossiler til Kaptajn Rotteskæg';
    default:
```

---

## TRIN 5: TreasureTab.tsx — Jungle-noegle + Pergament

**Fil:** `src/components/chest/TreasureTab.tsx`

### 5a. Udskift noeglesektionen

```tsx
// FIND (hele cabin_key sektionen):
      {questItems.includes('cabin_key') && (
        <div>
          <div className={sectionLabel}>🗝️ Nøgler</div>
          <div
            className="flex items-center gap-3 rounded-2xl border border-amber-400/40 p-3"
            style={{ background: 'rgba(30,25,5,0.85)' }}
          >
            <span className="text-2xl">🗝️</span>
            <div className="font-bold text-amber-400">Fiskehyttens Nøgle</div>
          </div>
        </div>
      )}

// ERSTAT MED:
      {(questItems.includes('cabin_key') || questItems.includes('jungle_chest_key')) && (
        <div>
          <div className={sectionLabel}>🗝️ Nøgler</div>
          <div className="flex flex-col gap-2">
            {questItems.includes('cabin_key') && (
              <div
                className="flex items-center gap-3 rounded-2xl border border-amber-400/40 p-3"
                style={{ background: 'rgba(30,25,5,0.85)' }}
              >
                <span className="text-2xl">🗝️</span>
                <div className="font-bold text-amber-400">Fiskehyttens Nøgle</div>
              </div>
            )}
            {questItems.includes('jungle_chest_key') && (
              <>
                <div
                  className="flex items-center gap-3 rounded-2xl border border-indigo-400/40 p-3"
                  style={{ background: 'rgba(15,20,40,0.85)' }}
                >
                  <span className="text-2xl">🗝️</span>
                  <div>
                    <div className="font-bold text-indigo-300">Havfruens Nøgle</div>
                    <div className="text-[0.78rem] text-slate-500">Passer til en kiste på Jungleøen</div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 rounded-2xl border border-amber-600/30 p-3"
                  style={{ background: 'rgba(30,20,5,0.85)' }}
                >
                  <span className="text-2xl">📜</span>
                  <div>
                    <div className="font-bold text-amber-300">Mystisk Pergament</div>
                    <div className="text-[0.78rem] italic text-slate-400">
                      &ldquo;Skatten er allerede fundet... eller er den? Se mod himlens stjerner når mørket falder på.&rdquo;
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
```

### 5b. Opdater emptySkat-check

```ts
// FIND (i emptySkat beregningen):
    !questItems.includes('cabin_key') &&

// ERSTAT MED:
    !questItems.includes('cabin_key') &&
    !questItems.includes('jungle_chest_key') &&
```

---

## TRIN 6: furnitureShopItems.ts — Nye moebel-defaults + display

**Fil:** `src/data/furnitureShopItems.ts`

### 6a. Udvid QUEST_COMPANION_DEFAULTS

```ts
// FIND:
export const QUEST_COMPANION_DEFAULTS: Record<string, RoomId> = {
  turtle: 'living',
  axolotl: 'living',
  cheese: 'living',
  golden_frog: 'living',
};

// ERSTAT MED:
export const QUEST_COMPANION_DEFAULTS: Record<string, RoomId> = {
  turtle: 'living',
  axolotl: 'living',
  cheese: 'living',
  golden_frog: 'living',
  pirate_cat: 'living',
  pirate_chest: 'living',
  ice_cube: 'kitchen',
  music_box: 'living',
};
```

### 6b. Udvid COMPANION_DISPLAY

```ts
// FIND:
const COMPANION_DISPLAY: Record<string, { emoji: string; name: string }> = {
  turtle: { emoji: '🐢', name: 'Skildpadde' },
  axolotl: { emoji: '🦎', name: 'Axolotl' },
  cheese: { emoji: '🧀', name: 'Ost' },
  golden_frog: { emoji: '🐸', name: 'Gylden frø' },
};

// ERSTAT MED:
const COMPANION_DISPLAY: Record<string, { emoji: string; name: string }> = {
  turtle: { emoji: '🐢', name: 'Skildpadde' },
  axolotl: { emoji: '🦎', name: 'Axolotl' },
  cheese: { emoji: '🧀', name: 'Ost' },
  golden_frog: { emoji: '🐸', name: 'Gylden frø' },
  pirate_cat: { emoji: '🐱', name: 'Skibskatten Kradse' },
  pirate_chest: { emoji: '📦', name: 'Piratens Skattekiste' },
  ice_cube: { emoji: '🧊', name: 'Mystisk Isterning' },
  music_box: { emoji: '🎵', name: 'Spilledåse' },
};
```

---

## TRIN 7: GoalStats-felter i types/progression.ts

**Fil:** `src/types/progression.ts`

```ts
// FIND (i slutningen af GoalStats interfacet):
  /** Antal korrekt løste halvdel/dobbelt-opgaver */
  halvdelDobbeltSolves: number;
}

// ERSTAT MED:
  /** Antal korrekt løste halvdel/dobbelt-opgaver */
  halvdelDobbeltSolves: number;
  /** Skibskatten Kradse låst op via pirat-fossil milestone 5 */
  pirateCatUnlocked: boolean;
  /** Havfruens jungle-nøgle modtaget via pearl milestone 10 */
  jungleKeyObtained: boolean;
  /** Piratens skattekiste låst op via fossil milestone 10 */
  pirateChestUnlocked: boolean;
}
```

---

## TRIN 8: Nye achievements i progression.ts

**Fil:** `src/data/progression.ts`

```ts
// FIND (den allersidste goal i GOALS-arrayet):
  { id: 'catch_snow', title: 'Sneregnsfisker', description: 'Fang en fisk i snefald.', icon: '❄️', category: 'fangst', condition: (s) => s.snowCatches >= 1, reward: { xp: 80, coins: 75 }, secret: false },
];

// ERSTAT MED:
  { id: 'catch_snow', title: 'Sneregnsfisker', description: 'Fang en fisk i snefald.', icon: '❄️', category: 'fangst', condition: (s) => s.snowCatches >= 1, reward: { xp: 80, coins: 75 }, secret: false },

  // --- ENDGAME NPC-MÅL ---
  { id: 'pirate_cat_unlocked', title: 'Skibskatten', description: 'Lås Skibskatten Kradse op fra Kaptajn Rotteskæg.', icon: '🐱', category: 'samling', condition: (s) => s.pirateCatUnlocked, reward: { xp: 200, coins: 200 }, secret: true },
  { id: 'pirate_chest_obtained', title: 'Sørøverens Skat', description: 'Modtag Piratens Skattekiste som møbel.', icon: '📦', category: 'samling', condition: (s) => s.pirateChestUnlocked, reward: { xp: 250, coins: 0 }, secret: true },
  { id: 'jungle_key_obtained', title: 'Havfruens Gave', description: 'Modtag den mystiske nøgle fra Havfruen.', icon: '🗝️', category: 'samling', condition: (s) => s.jungleKeyObtained, reward: { xp: 300, coins: 300 }, secret: true },
  { id: 'pearl_10', title: 'Perlesmykket', description: 'Aflever 10 perler til Havfruen.', icon: '💎', category: 'samling', condition: (s) => (s.pearlCount ?? 0) >= 10, reward: { xp: 250, coins: 300 }, secret: false },
  { id: 'conch_20', title: 'Pingvinpaladset', description: 'Aflever 20 konkylier til Pingvinen.', icon: '🐧', category: 'samling', condition: (s) => (s.conchCount ?? 0) >= 20, reward: { xp: 300, coins: 400 }, secret: true },
  { id: 'npc_master', title: 'Havets Mesterfisker', description: 'Aflever 10 samleobjekter til alle tre NPC-samlere.', icon: '🏆', category: 'samling', condition: (s) => (s.fossilCount ?? 0) >= 10 && (s.conchCount ?? 0) >= 10 && (s.pearlCount ?? 0) >= 10, reward: { xp: 1000, coins: 2000 }, secret: true },
];
```

---

## TRIN 9: Opdater buildGoalStatsSnapshot i goal-progress.ts

**Fil:** `src/logic/goal-progress.ts`

```ts
// FIND (i slutningen af return-objektet i buildGoalStatsSnapshot):
    tropicalSpeciesCaught: ids.length,
    tropicalFishCaughtIds: ids,
  };

// ERSTAT MED:
    tropicalSpeciesCaught: ids.length,
    tropicalFishCaughtIds: ids,
    pirateCatUnlocked: c.unlockedCompanions.includes('pirate_cat'),
    jungleKeyObtained: p.questItems.includes('jungle_chest_key'),
    pirateChestUnlocked: p.unlockedFurniture.includes('pirate_chest'),
  };
```

---

## TRIN 10: Tilfoej cabin_cellar til LocationId

**Fil:** `src/types/locations.ts`

```ts
// FIND:
  | 'cave'
  | 'jungle_island';

// ERSTAT MED:
  | 'cave'
  | 'jungle_island'
  | 'cabin_cellar';
```

---

## TRIN 11: Tilfoej cabin_cellar lokation i locations.ts

**Fil:** `src/data/locations.ts`

### 11a. LOCATION_DISPLAY

```ts
// FIND:
  cabin_bedroom: 'Fiskehytten',
} as const;

// ERSTAT MED:
  cabin_bedroom: 'Fiskehytten',
  cabin_cellar: 'Fiskehytten',
} as const;
```

### 11b. LOCATIONS objekt

```ts
// FIND (lige foer den afsluttende kommentar):
  // ← NYE LOKATIONER TILFØJES HER – kun ét sted!
} as const satisfies Record<LocationId, LocationConfig>;

// ERSTAT MED:
  cabin_cellar: {
    id: 'cabin_cellar',
    name: 'Fiskehytten',
    subtitle: 'Kælder',
    parentGroup: 'fishing_cabin',
    emoji: '🏠',
    unlockLevel: 1,
    requiresItem: '__cellar_unlocked__',
    type: 'base',
    description: '???',
    bgColor: 0x87ceeb,
    waterColor: 0x5F9EA0,
    fogColor: 0x87ceeb,
    fogNear: 22,
    fogFar: 72,
    specialRules: { nothingChance: 0, noFishing: true, hasSeagulls: false },
    collectibleTypes: [],
    lockReason: 'Kælderlemmen sidder fast — der mangler et håndtag',
  },
  // ← NYE LOKATIONER TILFØJES HER – kun ét sted!
} as const satisfies Record<LocationId, LocationConfig>;
```

---

## TRIN 12: Opdater location-helpers.ts (ambience)

**Fil:** `src/logic/location-helpers.ts`

```ts
// FIND:
const QUIET_OCEAN_AMBIENCE_LOCATIONS = new Set<string>([
  ...CABIN_LOCATIONS,
  'desert_lake',
  'fishing_cabin',
]);

// ERSTAT MED:
const QUIET_OCEAN_AMBIENCE_LOCATIONS = new Set<string>([
  ...CABIN_LOCATIONS,
  'cabin_cellar',
  'desert_lake',
  'fishing_cabin',
]);
```

**VIGTIGT:** Tilfoej IKKE `cabin_cellar` til `CABIN_LOCATIONS`-arrayet! Den har sit eget unlock-krav (`__cellar_unlocked__`) og skal IKKE dele cabin_key+magnet-kravet.

---

## TRIN 13: Opret PirateChestFurniture.tsx (NY FIL)

**Fil:** `src/three/cabin/furniture/PirateChestFurniture.tsx`

Opret denne fil med foelgende indhold:

```tsx
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import type { Group } from 'three';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Piratens Skattekiste — genbruger samme geometri som TreasureChestModel
 * men integreret som flytbart møbel i fiskehytten.
 * Brun kiste (0x8b4513) + guld-cylinderlåg (0xffd700) + guldlås.
 */
export const PirateChestFurniture = forwardRef<Group, GroupProps>(function PirateChestFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'pirate_chest' }}>
      {/* Kiste-krop */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial color={0x8b4513} roughness={0.7} flatShading />
      </mesh>
      {/* Guld-låg (halvcylinder) */}
      <mesh castShadow position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={0xffd700} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Guldlås */}
      <mesh castShadow position={[0, 0.7, 0.4]}>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial color={0xffd700} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
});
```

---

## TRIN 14: Opret IceCubeFurniture.tsx (NY FIL)

**Fil:** `src/three/cabin/furniture/IceCubeFurniture.tsx`

Opret denne fil med foelgende indhold:

```tsx
import { forwardRef, useRef, type ComponentPropsWithoutRef } from 'react';
import { DoubleSide, type Group, type Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { useUIStore } from '../../../store/useUIStore.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Mystisk Isterning — transparent iskube med et messing-håndtag fastfrosset indeni.
 * Ved klik vises en hint-toast: "❄️ Der sidder noget fast i isen..."
 */
export const IceCubeFurniture = forwardRef<Group, GroupProps>(function IceCubeFurniture(
  props,
  ref,
) {
  const innerRef = useRef<Mesh>(null);

  // Subtle bob-animation
  useFrame(({ clock }) => {
    const m = innerRef.current;
    if (!m) return;
    m.rotation.y = clock.elapsedTime * 0.15;
  });

  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    useUIStore.getState().setToastMessage('❄️ Der sidder noget fast i isen...');
  }

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'ice_cube' }}>
      {/* Ydre is-kube — transparent */}
      <mesh castShadow position={[0, 0.45, 0]} onClick={handleClick}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshPhysicalMaterial
          color={0xb0d4e8}
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.1}
          transmission={0.6}
          thickness={0.5}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Indre messing-håndtag */}
      <group ref={innerRef} position={[0, 0.42, 0]}>
        {/* Håndtags-stang */}
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.28, 8]} />
          <meshStandardMaterial color={0xd4b896} metalness={0.6} roughness={0.35} flatShading />
        </mesh>
        {/* Håndtags-knop (top) */}
        <mesh castShadow position={[0, 0.16, 0]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshStandardMaterial color={0xd4b896} metalness={0.6} roughness={0.35} flatShading />
        </mesh>
        {/* Plade (bund) */}
        <mesh castShadow position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.04, 8]} />
          <meshStandardMaterial color={0xd4b896} metalness={0.6} roughness={0.35} flatShading />
        </mesh>
      </group>

      {/* Frost-partikel-effekt: små indlejrede "bobler" */}
      {[
        [0.12, 0.55, 0.1],
        [-0.1, 0.35, -0.12],
        [0.08, 0.50, -0.15],
        [-0.15, 0.40, 0.08],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.025, 6, 4]} />
          <meshStandardMaterial
            color={0xffffff}
            transparent
            opacity={0.5}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
});
```

---

## TRIN 15: Opret MusicBoxFurniture.tsx (NY FIL)

**Fil:** `src/three/cabin/furniture/MusicBoxFurniture.tsx`

Opret denne fil med foelgende indhold:

```tsx
import { forwardRef, useRef, type ComponentPropsWithoutRef } from 'react';
import type { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { useUIStore } from '../../../store/useUIStore.js';
import { startAmbience, fadeOutStopAmbience } from '../../../audio/audioEngine.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Smuk Spilledåse — havfruens gave.
 * Ved klik spilles havets ambient-lyd i ~10 sekunder.
 * Perlemor-farvet låg med dekorative snirkler.
 */
export const MusicBoxFurniture = forwardRef<Group, GroupProps>(function MusicBoxFurniture(
  props,
  ref,
) {
  const lidRef = useRef<Mesh>(null);
  const playingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gentle shimmer on the lid when "playing"
  useFrame(({ clock }) => {
    const lid = lidRef.current;
    if (!lid) return;
    if (playingRef.current) {
      lid.rotation.x = -0.3 + Math.sin(clock.elapsedTime * 2) * 0.03;
    } else {
      lid.rotation.x = 0;
    }
  });

  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    if (playingRef.current) return;

    playingRef.current = true;
    useUIStore.getState().setToastMessage('🎵 Spilledåsen spiller havets melodi...');
    startAmbience(1.5);

    timerRef.current = setTimeout(() => {
      fadeOutStopAmbience(2);
      playingRef.current = false;
      timerRef.current = null;
    }, 10_000);
  }

  const pearl = 0xf0e6d4;
  const gold = 0xc8a86e;
  const darkWood = 0x5a3018;

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'music_box' }}>
      {/* Base — mørkt træ */}
      <mesh castShadow position={[0, 0.15, 0]} onClick={handleClick}>
        <boxGeometry args={[0.55, 0.3, 0.4]} />
        <meshStandardMaterial color={darkWood} roughness={0.85} flatShading />
      </mesh>

      {/* Guld-kant (trim) */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.57, 0.03, 0.42]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} flatShading />
      </mesh>

      {/* Låg — perlemor-farvet */}
      <mesh
        ref={lidRef}
        castShadow
        position={[0, 0.32, -0.19]}
        onClick={handleClick}
      >
        <boxGeometry args={[0.53, 0.04, 0.38]} />
        <meshStandardMaterial
          color={pearl}
          metalness={0.3}
          roughness={0.15}
        />
      </mesh>

      {/* Dekorativ snirkel — enkel ring oven på låget */}
      <mesh position={[0, 0.34, -0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.012, 8, 16]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Lille hængsel bagpå */}
      <mesh castShadow position={[0, 0.3, -0.2]}>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
        <meshStandardMaterial color={gold} metalness={0.6} roughness={0.4} flatShading />
      </mesh>
    </group>
  );
});
```

---

## TRIN 16: Opret CabinCat.tsx (NY FIL)

**Fil:** `src/three/cabin/CabinCat.tsx`

Opret denne fil med foelgende indhold:

```tsx
import { useRef, useMemo, forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useUIStore } from '../../store/useUIStore.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Skibskatten Kradse — 3D kat med idle-animation (gå, sidde, sove).
 * Baseret på CatController-geometri fra akvariet (aquarium.html linje ~1476).
 * Farverne matcher wardrobeItems "Havnekatten Kradse": #6a6050 / #4a4030.
 */
export const CabinCat = forwardRef<Group, GroupProps>(function CabinCat(props, ref) {
  const torsoRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const legFLRef = useRef<Group>(null);
  const legFRRef = useRef<Group>(null);
  const legBLRef = useRef<Group>(null);
  const legBRRef = useRef<Group>(null);
  const tailRef = useRef<Group>(null);

  // Simple state machine: idle / walk / sit
  const stateRef = useRef<{ mode: 'idle' | 'walk' | 'sit'; timer: number; walkTime: number; targetRotY: number }>({
    mode: 'idle',
    timer: 2 + Math.random() * 3,
    walkTime: 0,
    targetRotY: 0,
  });

  const bodyColor = 0x6a6050; // wardrobe match
  const darkColor = 0x4a4030;
  const eyeColor = 0x66ccff;

  useFrame((_, delta) => {
    const st = stateRef.current;
    const torso = torsoRef.current;
    const head = headRef.current;
    const lfl = legFLRef.current;
    const lfr = legFRRef.current;
    const lbl = legBLRef.current;
    const lbr = legBRRef.current;
    const tail = tailRef.current;
    if (!torso || !head || !lfl || !lfr || !lbl || !lbr || !tail) return;

    st.timer -= delta;

    if (st.mode === 'idle') {
      // Gentle breathing
      torso.position.y = 0.6 + Math.sin(Date.now() * 0.001) * 0.01;
      head.rotation.z = Math.sin(Date.now() * 0.0005) * 0.03;
      tail.rotation.z = Math.sin(Date.now() * 0.002) * 0.15;
      // Relax legs
      lfl.rotation.x *= 0.92;
      lfr.rotation.x *= 0.92;
      lbl.rotation.x *= 0.92;
      lbr.rotation.x *= 0.92;

      if (st.timer <= 0) {
        const r = Math.random();
        if (r < 0.4) {
          st.mode = 'walk';
          st.timer = 2 + Math.random() * 3;
          st.targetRotY = (Math.random() - 0.5) * Math.PI;
        } else if (r < 0.7) {
          st.mode = 'sit';
          st.timer = 3 + Math.random() * 4;
        } else {
          st.timer = 1 + Math.random() * 2;
        }
      }
    } else if (st.mode === 'walk') {
      st.walkTime += delta;
      const speed = 8;
      const walkAngle = 0.4;
      const t = st.walkTime * speed;
      lfl.rotation.x = Math.sin(t) * walkAngle;
      lfr.rotation.x = Math.sin(t + Math.PI) * walkAngle;
      lbl.rotation.x = Math.sin(t + Math.PI) * walkAngle;
      lbr.rotation.x = Math.sin(t) * walkAngle;
      torso.position.y = 0.6 + Math.abs(Math.sin(t)) * 0.04;
      tail.rotation.z = Math.sin(st.walkTime * 12) * 0.2;
      head.rotation.z = Math.sin(st.walkTime * 1.5) * 0.05;

      if (st.timer <= 0) {
        st.mode = 'idle';
        st.timer = 2 + Math.random() * 3;
        st.walkTime = 0;
      }
    } else if (st.mode === 'sit') {
      // Sitting: lower body, tuck back legs
      torso.position.y = 0.45;
      lbl.rotation.x = -0.6;
      lbr.rotation.x = -0.6;
      lfl.rotation.x = 0.1;
      lfr.rotation.x = 0.1;
      tail.rotation.z = Math.sin(Date.now() * 0.0015) * 0.25;
      head.rotation.z = Math.sin(Date.now() * 0.0008) * 0.04;

      if (st.timer <= 0) {
        st.mode = 'idle';
        st.timer = 1 + Math.random() * 2;
      }
    }
  });

  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    useUIStore.getState().setToastMessage('🐱 Prrrrr...');
  }

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'pirate_cat' }}>
      <group scale={0.85} onClick={handleClick}>
        {/* Torso group */}
        <group ref={torsoRef} position={[0, 0.6, 0]}>
          {/* Body cylinder (horizontal) */}
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1.0, 16]} />
            <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
          </mesh>
          {/* Chest sphere */}
          <mesh castShadow position={[0, 0, 0.5]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
          </mesh>
          {/* Pelvis sphere */}
          <mesh castShadow position={[0, 0, -0.5]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
          </mesh>

          {/* Head group */}
          <group ref={headRef} position={[0, 0.18, 0.65]}>
            <mesh castShadow>
              <sphereGeometry args={[0.17, 16, 12]} />
              <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
            </mesh>
            {/* Mask/snout */}
            <mesh position={[0, -0.04, 0.09]}>
              <sphereGeometry args={[0.12, 12, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
            {/* Ears */}
            <mesh castShadow position={[0.1, 0.14, 0]} rotation={[-0.1, 0, -0.4]}>
              <coneGeometry args={[0.05, 0.16, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
            <mesh castShadow position={[-0.1, 0.14, 0]} rotation={[-0.1, 0, 0.4]}>
              <coneGeometry args={[0.05, 0.16, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
            {/* Eyes */}
            <mesh position={[0.05, 0.04, 0.15]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={eyeColor} roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[-0.05, 0.04, 0.15]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={eyeColor} roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Nose */}
            <mesh position={[0, -0.01, 0.17]}>
              <sphereGeometry args={[0.015, 6, 4]} />
              <meshStandardMaterial color={0x332222} roughness={0.6} />
            </mesh>
          </group>

          {/* Legs */}
          <group ref={legFLRef} position={[0.1, 0, 0.42]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.03, 0.022, 0.55, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>
          <group ref={legFRRef} position={[-0.1, 0, 0.42]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.03, 0.022, 0.55, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>
          <group ref={legBLRef} position={[0.1, 0, -0.42]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.03, 0.022, 0.55, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>
          <group ref={legBRRef} position={[-0.1, 0, -0.42]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.03, 0.022, 0.55, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>

          {/* Tail */}
          <group ref={tailRef} position={[0, 0.08, -0.55]} rotation={[-Math.PI / 3, 0, 0]}>
            <mesh castShadow position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.018, 0.03, 0.6, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});
```

---

## TRIN 17: Wire nye moebel-komponenter ind i CabinRoomFurniture.tsx

**Fil:** `src/three/cabin/CabinRoomFurniture.tsx`

### 17a. Tilfoej imports (efter de eksisterende BedroomFurniture-imports)

```ts
// FIND:
} from '../cabin/furniture/BedroomFurniture.js';

const COAL_COLORS

// ERSTAT MED:
} from '../cabin/furniture/BedroomFurniture.js';
import { PirateChestFurniture } from '../cabin/furniture/PirateChestFurniture.js';
import { IceCubeFurniture } from '../cabin/furniture/IceCubeFurniture.js';
import { MusicBoxFurniture } from '../cabin/furniture/MusicBoxFurniture.js';
import { CabinCat } from '../cabin/CabinCat.js';

const COAL_COLORS
```

### 17b. Tilfoej refs og state (efter bedroomWardrobeRef)

```ts
// FIND:
  const bedroomMirrorRef = useRef<Group>(null);
  const bedroomWardrobeRef = useRef<Group>(null);

  const coalData

// ERSTAT MED:
  const bedroomMirrorRef = useRef<Group>(null);
  const bedroomWardrobeRef = useRef<Group>(null);

  const pirateChestRef = useRef<Group>(null);
  const iceCubeRef = useRef<Group>(null);
  const musicBoxRef = useRef<Group>(null);
  const pirateCatRef = useRef<Group>(null);

  const unlockedCompanions = useCollectionStore((s) => s.unlockedCompanions);
  const hasPirateCat = unlockedCompanions.includes('pirate_cat');

  const coalData
```

### 17c. Tilfoej til rebuildMovableList()

```ts
// FIND (i rebuildMovableList, lige foer cabinMovableRoots):
    if (vis('bedroom_wardrobe')) push(bedroomWardrobeRef);
    cabinMovableRoots.current = list;

// ERSTAT MED:
    if (vis('bedroom_wardrobe')) push(bedroomWardrobeRef);
    if (vis('pirate_chest')) push(pirateChestRef);
    if (vis('ice_cube')) push(iceCubeRef);
    if (vis('music_box')) push(musicBoxRef);
    if (comp('pirate_cat', hasPirateCat)) push(pirateCatRef);
    cabinMovableRoots.current = list;
```

### 17d. Tilfoej hasPirateCat til useLayoutEffect dependency array

```ts
// FIND (i useLayoutEffect deps):
    hasGoldenFrog,
    unlockedFurniture,
    furnitureRoomAssignment,
    hiddenFurniture,
  ]);

// ERSTAT MED:
    hasGoldenFrog,
    hasPirateCat,
    unlockedFurniture,
    furnitureRoomAssignment,
    hiddenFurniture,
  ]);
```

### 17e. Tilfoej JSX rendering (lige foer det afsluttende `</group>` i return)

```tsx
// FIND (den allersidste del af return):
      {vis('bedroom_wardrobe') && (
        <BedroomWardrobeFurniture
          ref={bedroomWardrobeRef}
          position={sp('bedroom_wardrobe').pos}
          rotation={[0, sp('bedroom_wardrobe').rotY, 0]}
        />
      )}
    </group>
  );
}

// ERSTAT MED:
      {vis('bedroom_wardrobe') && (
        <BedroomWardrobeFurniture
          ref={bedroomWardrobeRef}
          position={sp('bedroom_wardrobe').pos}
          rotation={[0, sp('bedroom_wardrobe').rotY, 0]}
        />
      )}

      {/* --- Nye endgame quest-møbler --- */}
      {vis('pirate_chest') && (
        <PirateChestFurniture
          ref={pirateChestRef}
          position={sp('pirate_chest').pos}
          rotation={[0, sp('pirate_chest').rotY, 0]}
          scale={0.6}
        />
      )}
      {vis('ice_cube') && (
        <IceCubeFurniture
          ref={iceCubeRef}
          position={sp('ice_cube').pos}
          rotation={[0, sp('ice_cube').rotY, 0]}
        />
      )}
      {vis('music_box') && (
        <MusicBoxFurniture
          ref={musicBoxRef}
          position={sp('music_box').pos}
          rotation={[0, sp('music_box').rotY, 0]}
        />
      )}
      {comp('pirate_cat', hasPirateCat) && (
        <CabinCat
          ref={pirateCatRef}
          position={sp('pirate_cat').pos}
          rotation={[0, sp('pirate_cat').rotY, 0]}
        />
      )}
    </group>
  );
}
```

---

## TRIN 18: Tilfoej kaelderlem i CabinKitchen.tsx

**Fil:** `src/three/environments/CabinKitchen.tsx`

### 18a. Tilfoej useUIStore import

```ts
// FIND:
import { useGameStore } from '../../store/useGameStore.js';
import { CabinWindowStarfield } from '../cabin/CabinWindowStarfield.js';

// ERSTAT MED:
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { CabinWindowStarfield } from '../cabin/CabinWindowStarfield.js';
```

### 18b. Tilfoej kaelderlem-JSX (lige efter `<CabinRoomFurniture roomId="kitchen" />`)

```tsx
// FIND:
      <CabinRoomFurniture roomId="kitchen" />

// ERSTAT MED:
      <CabinRoomFurniture roomId="kitchen" />

      {/* Kælderlem — synlig fra dag 1, låst (mangler håndtag) */}
      <group
        position={[0, 0.025, FLOOR_Z_CENTER]}
        onClick={(e) => {
          e.stopPropagation();
          useUIStore.getState().setToastMessage('🔒 Kælderlemmen sidder fast — der mangler et håndtag!');
        }}
        userData={{ isMovable: false }}
      >
        {/* Lem-plade — mørkere træ */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.5, 1.0]} />
          <meshStandardMaterial color={0x3a2010} roughness={0.92} />
        </mesh>
        {/* Kant/ramme */}
        {[
          { pos: [0, 0, -0.5] as [number, number, number], args: [1.54, 0.04, 0.04] as [number, number, number] },
          { pos: [0, 0, 0.5] as [number, number, number], args: [1.54, 0.04, 0.04] as [number, number, number] },
          { pos: [-0.75, 0, 0] as [number, number, number], args: [0.04, 0.04, 1.04] as [number, number, number] },
          { pos: [0.75, 0, 0] as [number, number, number], args: [0.04, 0.04, 1.04] as [number, number, number] },
        ].map((edge, i) => (
          <mesh key={i} position={edge.pos} castShadow>
            <boxGeometry args={edge.args} />
            <meshStandardMaterial color={0x1a1008} roughness={0.95} metalness={0.1} flatShading />
          </mesh>
        ))}
        {/* Jernhængsler */}
        {[-0.5, 0.5].map((xOff) => (
          <mesh key={xOff} position={[xOff, 0.01, -0.5]} castShadow>
            <boxGeometry args={[0.12, 0.02, 0.08]} />
            <meshStandardMaterial color={0x555555} metalness={0.7} roughness={0.4} flatShading />
          </mesh>
        ))}
        {/* Tomt hul for håndtag (cirkulær fordybning) */}
        <mesh position={[0, 0.015, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.07, 12]} />
          <meshStandardMaterial color={0x1a0a05} roughness={1} />
        </mesh>
      </group>
```

---

## Samlet filoversigt

### Aendrede filer (14):

| # | Fil | Aendring |
|---|-----|---------|
| 1 | `src/types/collectibles.ts` | 5 nye MilestoneRewardType vaerdier |
| 2 | `src/data/collectibles.ts` | Nye milestones + Kradse companion + mesterfisker-dialog + import |
| 3 | `src/components/modals/CollectibleModal.tsx` | 5 nye applyReward() cases |
| 4 | `src/components/chest/PetTab.tsx` | unlockHint for pirate_fossil_milestone |
| 5 | `src/components/chest/TreasureTab.tsx` | Jungle-noegle + pergament + emptySkat check |
| 6 | `src/data/furnitureShopItems.ts` | 4 nye defaults + 4 nye display labels |
| 7 | `src/types/progression.ts` | 3 nye GoalStats boolean-felter |
| 8 | `src/data/progression.ts` | 6 nye achievements |
| 9 | `src/logic/goal-progress.ts` | 3 nye felter i buildGoalStatsSnapshot |
| 10 | `src/types/locations.ts` | cabin_cellar i LocationId |
| 11 | `src/data/locations.ts` | cabin_cellar lokation + LOCATION_DISPLAY |
| 12 | `src/logic/location-helpers.ts` | cabin_cellar i quiet ambience |
| 13 | `src/three/cabin/CabinRoomFurniture.tsx` | Imports + refs + render af 4 nye moebel/kat |
| 14 | `src/three/environments/CabinKitchen.tsx` | Kaelderlem i gulvet + useUIStore import |

### Nye filer (4):

| # | Fil |
|---|-----|
| 1 | `src/three/cabin/furniture/PirateChestFurniture.tsx` |
| 2 | `src/three/cabin/furniture/IceCubeFurniture.tsx` |
| 3 | `src/three/cabin/furniture/MusicBoxFurniture.tsx` |
| 4 | `src/three/cabin/CabinCat.tsx` |

---

## Tjekliste efter implementering

Koer `npx tsc --noEmit` og verificer 0 fejl. Test derefter foelgende in-game:

- [ ] **TypeScript kompilerer uden fejl** (`npx tsc --noEmit`)
- [ ] **Vite dev server starter** (`npm run dev`)
- [ ] **Fossil milestone 5:** Aflever 5 fossiler -> modtag Kradse (companion) -> tjek PetTab viser 9. kaeled-yr
- [ ] **Fossil milestone 10:** Aflever 10 fossiler -> modtag Piratens Skattekiste (moebel i stuen)
- [ ] **Conch milestone 10:** Aflever 10 konkylier -> modtag Mystisk Isterning (moebel i kokkenet)
- [ ] **Pearl milestone 5:** Aflever 5 perler -> modtag Spilledaase (moebel i stuen)
- [ ] **Pearl milestone 10:** Aflever 10 perler -> modtag jungle-noegle -> tjek TreasureTab viser noegle + pergament
- [ ] **Isterning klik:** Klik paa isterningen -> toast "❄️ Der sidder noget fast i isen..."
- [ ] **Spilledaase klik:** Klik paa spilledaasen -> havlyd spiller i ~10 sek -> fader ud
- [ ] **Kat klik:** Klik paa Kradse -> toast "🐱 Prrrrr..."
- [ ] **Kat animation:** Kradse skifter mellem idle/walk/sit
- [ ] **Mesterfisker-dialog:** Naar alle 3 NPC'er >= 10, vises speciel dialog hos hver
- [ ] **Kaelderlem synlig:** Gaa til kokkenet -> kaelderlem er synlig i gulvet
- [ ] **Kaelderlem klik:** Klik paa lemmen -> toast "🔒 Kælderlemmen sidder fast..."
- [ ] **Kalder i rejsemenu:** "Kalder" vises grayed-out med laas under Fiskehytten
- [ ] **Achievements:** Tjek at de 6 nye maal virker (Skibskatten, Soeroeverens Skat, Havfruens Gave, Perlesmykket, Pingvinpaladset, Havets Mesterfisker)
- [ ] **PetTab taeller:** Viser X/9 (ikke X/8)
- [ ] **Moebel-flytning:** Alle nye moebel kan flyttes mellem rum i furniture mode
- [ ] **Eksisterende milestone 1 rewards virker stadig** (hvalbof, ost, mystisk madding)
