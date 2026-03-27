Regnefisken: Komplet Migreringsplan
Fra 14.083-linjers HTML-monolit til Vite + React + TypeScript + Zustand + R3F
0. Overblik over monolittens anatomi
Inden vi planlægger, er det vigtigt at forstå hvad vi arbejder med:

Sektion	Linjer (ca.)	Indhold
<head> + CSS + Loader	1–580	Meta, Tailwind CDN, keyframes, glassmorphism, a11y-filtre, loader-canvas
DEL 1: Data	620–2186	WEATHER_TYPES, BUCKET_TIERS, ROD_TIERS, CATCH_MASTER_DATA (100+ entries), FISH_DATABASE, locations, shop, collectibles, math-config, XP
DEL 2: Lydsystem	2188–2306	Web Audio API: 20+ lydeffekter, ambience, regn, torden
DEL 3: Spilberegninger	2309–3066	generateMathProblem, rollForCatch, weightedFishPick, XP, rarity, regnehistorier
DEL 4: Three.js Scene	3068–8696	55+ mesh-builders (broer, stænger, bobber, fisk, bosser, miljøer), FishPool, partikler, vejr, companions
DEL 5: UI-komponenter	8698–8918	ShopScreen, GoalsScreen, WeatherWidget, XPBar, LevelUpOverlay, Journal
DEL 6: FishingGame	8920–14076	129 useState-kald, al spilflow, save/load, rendering, startskærm
Mounting	14078–14081	ReactDOM.createRoot
129 useState-kald. 55+ mesh-builders. 15 localStorage-operationer. Alt i én funktion.

FASE 0: Fundament (Dag 1–2)
0.1 Git-initialisering og Vite-scaffold
cd c:\Users\ander\Desktop\FORFRA
git init
echo "node_modules/\ndist/\n.env" > .gitignore
npm create vite@latest regnefisken-next -- --template react-ts
cd regnefisken-next
npm install
0.2 Dependencies
npm install zustand immer
npm install three @react-three/fiber @react-three/drei
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D tailwindcss @tailwindcss/vite
0.3 Mappestruktur
Strukturen er designet ud fra monolittens faktiske sektioner (DEL 1–6) og følger en feature-first tilgang, der eliminerer cirkulære afhængigheder:

regnefisken-next/
├── public/
│   └── index.html              ← Loader-canvas + SVG color-blind filtre
├── src/
│   ├── main.tsx                 ← Entry: mount <App />
│   ├── App.tsx                  ← Router/layout: StartScreen → Game
│   ├── vite-env.d.ts
│   │
│   ├── data/                    ← DEL 1: Ren data, nul logik
│   │   ├── weather.ts           ← WEATHER_TYPES
│   │   ├── equipment.ts         ← BUCKET_TIERS, ROD_TIERS + helpers
│   │   ├── fish.ts              ← CATCH_MASTER_DATA, FISH_DATABASE, FISH_SPECIES
│   │   ├── graphics.ts          ← GRAPHICS_CONFIG
│   │   ├── combat.ts            ← POOL_WEIGHTS, FIGHT_PARAMS, TRUE_BOSS_*
│   │   ├── enrichment.ts        ← ENRICHED_CATCH_DATA, MODIFIER_PIPELINE
│   │   ├── locations.ts         ← LOCATIONS, AREAS, FARVANDE
│   │   ├── shop.ts              ← SHOP_ITEMS
│   │   ├── world.ts             ← DAY_NIGHT_CYCLE, RAT_FACTS, PARROT_JOKES
│   │   ├── collectibles.ts      ← COLLECTIBLES, COMPANIONS_DATABASE
│   │   ├── progression.ts       ← GOALS, DESERT_SET, ARCTIC_SET
│   │   ├── xp.ts                ← XP_REWARDS, XP_BALANCING, xpNeededForLevel
│   │   ├── math-config.ts       ← OP_MULTIPLIERS, REGNEHISTORIE_*
│   │   └── version.ts           ← APP_VERSION, SAVE_FORMAT_VERSION
│   │
│   ├── logic/                   ← DEL 3: Ren forretningslogik (ingen React)
│   │   ├── math-engine.ts       ← generateMathProblem, regnehistorie-generators
│   │   ├── catch-engine.ts      ← rollForCatch, weightedFishPick, createJunkItem
│   │   ├── xp-engine.ts         ← applyXP, calculateStreakBonus
│   │   ├── rarity.ts            ← rarityWeights, pickColor
│   │   ├── save-load.ts         ← loadGame, saveGame, migrateSave
│   │   └── progression.ts       ← checkGoals, unlockChecks
│   │
│   ├── audio/                   ← DEL 2: Lydsystem
│   │   ├── audio-context.ts     ← initAudio, AudioContext singleton
│   │   ├── sound-effects.ts     ← playSoundEffect (alle 20+ cases)
│   │   ├── ambience.ts          ← startAmbience, stopAmbience, setRainVolume
│   │   └── useAudio.ts          ← React hook: { play, startAmbience, ... }
│   │
│   ├── store/                   ← Zustand stores (erstatter 129 useState)
│   │   ├── useGameStore.ts      ← Core: gameState, location, weather, time
│   │   ├── usePlayerStore.ts    ← coins, inventory, upgrades, progression
│   │   ├── useMathStore.ts      ← problem, answer, ops, difficulty, zen
│   │   ├── useFishingStore.ts   ← hookedFish, fightStages, streak, lastCatch
│   │   ├── useCollectionStore.ts← collectibles, companions, achievements
│   │   ├── useUIStore.ts        ← modals, menus, toasts, settings, a11y
│   │   └── useSaveStore.ts      ← Hydration/persistence middleware
│   │
│   ├── three/                   ← DEL 4: R3F-kompatible 3D-elementer
│   │   ├── models/
│   │   │   ├── FishModel.tsx    ← buildCuteFishModel → deklarativ R3F
│   │   │   ├── FishingRod.tsx   ← buildFishingRod → R3F component
│   │   │   ├── Bobber.tsx       ← buildBobber + steampunk variant
│   │   │   ├── Bridge.tsx       ← BRIDGE_MODELS[0..6] → R3F
│   │   │   ├── Bucket.tsx       ← buildBucket → R3F
│   │   │   ├── Brandmand.tsx    ← createBrandmandMesh → R3F
│   │   │   ├── Soeuhyre.tsx     ← createSoeUhyreMesh → R3F
│   │   │   ├── Kraken.tsx       ← createAmbientKrakenMesh → R3F
│   │   │   ├── Seagull.tsx      ← buildSeagull → R3F
│   │   │   ├── Spirit.tsx       ← createSpirit → R3F
│   │   │   └── GoldenFrog.tsx   ← buildGoldenFrogFurniture → R3F
│   │   ├── environments/
│   │   │   ├── DesertLake.tsx   ← buildDesertLake → R3F scene
│   │   │   ├── ArcticSea.tsx    ← buildArcticSea → R3F scene
│   │   │   ├── TropicalIsland.tsx
│   │   │   ├── Cave.tsx
│   │   │   └── Pier.tsx         ← Default location
│   │   ├── effects/
│   │   │   ├── WeatherParticles.tsx  ← Regn, sne, tåge
│   │   │   ├── WaterSurface.tsx      ← Bølge-animation
│   │   │   └── LightingRig.tsx       ← Sol, måne, headlamp, storm-lyn
│   │   ├── FishPool.tsx         ← Object pooling via R3F instancing
│   │   └── GameCanvas.tsx       ← <Canvas> wrapper med kamera + controls
│   │
│   ├── components/              ← DEL 5 + DEL 6: React UI
│   │   ├── hud/
│   │   │   ├── XPBar.tsx
│   │   │   ├── CoinDisplay.tsx
│   │   │   ├── WeatherWidget.tsx
│   │   │   ├── StreakIndicator.tsx
│   │   │   └── HUD.tsx          ← Samler alle HUD-elementer
│   │   ├── screens/
│   │   │   ├── StartScreen.tsx  ← Splash med skyer, bølger, fisk
│   │   │   ├── ShopScreen.tsx
│   │   │   ├── GoalsScreen.tsx
│   │   │   ├── JournalScreen.tsx
│   │   │   ├── MathSettingsScreen.tsx
│   │   │   └── ScreenSettings.tsx
│   │   ├── modals/
│   │   │   ├── LevelUpOverlay.tsx
│   │   │   ├── GoalNotification.tsx
│   │   │   ├── CollectibleModal.tsx
│   │   │   ├── WishModal.tsx
│   │   │   ├── ResetConfirm.tsx
│   │   │   └── ContactModal.tsx
│   │   ├── fishing/
│   │   │   ├── MathChallenge.tsx    ← Regnestykke-UI + numpad
│   │   │   ├── CatchResult.tsx      ← Fangst-animation
│   │   │   ├── BossFight.tsx        ← Multi-stage boss-kamp
│   │   │   └── FishingControls.tsx  ← Cast-knap, klip-linen
│   │   ├── chest/
│   │   │   ├── ChestMenu.tsx        ← Kiste med faner
│   │   │   ├── EquipmentTab.tsx
│   │   │   ├── BaitTab.tsx
│   │   │   ├── PetTab.tsx
│   │   │   └── TreasureTab.tsx
│   │   ├── mobile/
│   │   │   ├── MobileBag.tsx        ← Mobil-menu
│   │   │   └── NumberPad.tsx        ← Touch numpad
│   │   └── common/
│   │       ├── CoinIcon.tsx
│   │       ├── Toast.tsx
│   │       └── GlassPanel.tsx       ← Glassmorphism-panel
│   │
│   ├── hooks/                   ← Genbrugelige React hooks
│   │   ├── useIsMobile.ts
│   │   ├── useFullscreen.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useReducedMotion.ts
│   │
│   ├── styles/
│   │   ├── index.css            ← Tailwind directives + custom properties
│   │   ├── animations.css       ← Alle keyframes fra monolitten
│   │   └── accessibility.css    ← Farveblind-filtre, high-contrast, reduce-motion
│   │
│   └── types/
│       ├── fish.ts              ← CatchData, FishModel, Rarity, etc.
│       ├── game.ts              ← GameState, Location, Weather
│       ├── math.ts              ← MathProblem, MathCategory, Farvand
│       ├── shop.ts              ← ShopItem, BucketTier, RodTier
│       └── save.ts              ← SaveData, SaveFormat
│
├── tests/
│   ├── math-engine.test.ts
│   ├── catch-engine.test.ts
│   ├── xp-engine.test.ts
│   └── save-load.test.ts
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── netlify.toml
├── .gitignore
└── package.json
Nøgleprincip: Hvert modul kan importeres uafhængigt. Afhængighedsgrafen er et DAG (Directed Acyclic Graph):

types ← data ← logic ← store ← { components, three }
                  ↑               ↑
                audio ────────────┘
FASE 1: Data-ekstraktion (Dag 2–4)
Mål: Flyt al statisk data ud af monolitten til TypeScript-moduler med fuld type-sikkerhed. Dette er den sikreste start – data har ingen sideeffekter.

1.1 Definer typer først
Start med src/types/ – de definerer kontrakten for alt andet:

// src/types/fish.ts
export type Rarity = 'Almindelig' | 'Sjælden' | 'Legendarisk' | 'Mystisk';
export type ItemType = 'fish' | 'piranha' | 'boss' | 'junk' | 'frog' | 'starfish';
export type TailType = 'standard' | 'forked' | 'flat' | 'eel' | 'thin' | 'chunky' | 'star' | 'none';
export interface FishModelConfig {
  color: number | null;
  bodyShape: [number, number, number];
  tail: TailType;
  speed: number;
  scale: number;
  flat?: boolean;
  spots?: number;
  stripes?: boolean;
  redFins?: boolean;
  isEel?: boolean;
  isFrog?: boolean;
  isStarfish?: boolean;
  longBeak?: boolean;
  spikes?: boolean;
  uglyHead?: boolean;
  isPiranha?: boolean;
}
export interface CatchMasterEntry {
  id: string;
  name: string;
  type: string;
  rarity: Rarity;
  primaryAreas: string[];
  requirements: {
    requiredRod: string | null;
    requiredBait: string | null;
  };
  itemType: ItemType;
  lootWeight?: number;
  model: FishModelConfig;
}
1.2 Kopier data med typer
Hver data-sektion fra monolitten (linje 620–2186) flyttes direkte:

// src/data/weather.ts
import type { WeatherType } from '../types/game';
export const WEATHER_TYPES: Record<string, WeatherType> = {
  CLEAR:    { id: 'clear',    name: 'Klar Himmel', icon: '☀️', waveAmp: 0.2,  rain: false, storm: false, fogDens: 0.005, lightMod: 1.0 },
  OVERCAST: { id: 'overcast', name: 'Overskyet',   icon: '☁️', waveAmp: 0.25, rain: false, storm: false, fogDens: 0.015, lightMod: 0.8 },
  // ... identisk data, nu med typecheck
} as const;
1.3 Strategi for CATCH_MASTER_DATA
CATCH_MASTER_DATA er spillets hjerte – 100+ entries. Migreringsstrategien:

Eksporter arrayet uændret som CatchMasterEntry[]
De afledte strukturer (FISH_DATABASE, FISH_SPECIES, CUTE_FISH_CONFIG, ENRICHED_CATCH_DATA) flyttes til src/data/enrichment.ts og genberegnes via CATCH_MASTER_DATA.map(...) – præcis som i dag
Skriv en snapshot-test der sammenligner output med den originale data for at sikre 1:1
1.4 Validering
Skriv en simpel test der validerer at al data er korrekt kopieret:

// tests/data-integrity.test.ts
import { CATCH_MASTER_DATA } from '../src/data/fish';
test('alle fisk har unikke id\'er', () => {
  const ids = CATCH_MASTER_DATA.map(f => f.id);
  expect(new Set(ids).size).toBe(ids.length);
});
test('alle primaryAreas refererer til gyldige lokationer', () => {
  // ...
});
FASE 2: Logik-ekstraktion (Dag 4–7)
Mål: Flyt al ren forretningslogik (DEL 3, linje 2309–3066) til src/logic/. Disse funktioner er pure – de tager input og returnerer output uden at røre DOM eller React state.

2.1 Math-engine
generateMathProblem er den vigtigste funktion i spillet. Den flyttes uændret til src/logic/math-engine.ts:

// src/logic/math-engine.ts
import type { MathProblem, Farvand, MathDifficulty } from '../types/math';
import { FARVANDE } from '../data/locations';
export function generateMathProblem(
  ops: string[],
  difficulty: MathDifficulty,
  category: string,
  farvand: Farvand
): MathProblem {
  // Præcis samme implementering som linje ~2400-2800 i monolitten
}
Test straks:

// tests/math-engine.test.ts
test('tenfriends genererer tal der summer til 10', () => {
  const p = generateMathProblem(['tenfriends'], 'beginner', 'basic', 'kysten');
  expect(eval(p.expression)).toBe(p.answer);
  expect(p.answer).toBeLessThanOrEqual(10);
});
test('zen-mode: klip-linen afslører korrekt svar', () => {
  const p = generateMathProblem(['+'], 'beginner', 'basic', 'kysten');
  expect(typeof p.answer).toBe('number');
});
2.2 Catch-engine
rollForCatch, weightedFishPick, createJunkItem – alt der bestemmer hvad spilleren fanger:

// src/logic/catch-engine.ts
export function rollForCatch(params: CatchRollParams): CatchResult { ... }
export function weightedFishPick(area: string, rod: string | null, bait: string | null): CatchMasterEntry { ... }
2.3 Save/Load-system
Kritisk for bagudkompatibilitet – SAVE_FORMAT_VERSION = 14 med migrations:

// src/logic/save-load.ts
const SAVE_KEY = 'regnefisken_save';
export function loadGame(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  return migrateSave(data);
}
export function migrateSave(data: SaveData): SaveData {
  // Alle versionsmigrationer fra v1 → v14
}
export function saveGame(state: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
2.4 Nøgleprincip: Kopiér, test, slet
For hver funktion:

Kopiér til det nye modul med TypeScript-typer
Test med Vitest at output matcher
Slet ikke fra monolitten endnu – det sker i Fase 6
FASE 3: Zustand State-arkitektur (Dag 7–12)
Mål: Erstat 129 useState-kald med 7 fokuserede Zustand-stores. Dette er migrationens mest kritiske fase.

3.1 Store-design: Domæne-opdeling
De 129 useState-kald grupperes logisk i 7 stores:

Store	State (fra monolitten)	Antal useState det erstatter
useGameStore	gameState, currentLocation, weatherType, timePhase, hasStarted, sceneReady, showLightning, thunderActive	~10
usePlayerStore	coins, inventory, upgrades, questItems, activeBait, progression, stats, completedGoals, furniturePositions	~15
useMathStore	problem, userAnswer, timeLeft, activeOps, mathDifficulty, mathCategory, zenMode, zenSkipDelay, selectedFarvand, showNumberPad	~15
useFishingStore	hookedFish, fightStages, currentStreak, lastCatch, lastWasTrueBoss, koedklumpActive, soeuhyreDefeated, krakenDefeated	~12
useCollectionStore	collectibleInventory, collectibleDelivered, unlockedCompanions, hasGoldenFrog, achievements, helleflynderCaught, usedWishes, cheeseSources, featherSources	~18
useUIStore	Alle modale/menu-states: showKisteMenu, showShopScreen, showMathSettings, showNavPicker, showResetConfirm, showVersionModal, toastMessage, showLevelUp, fontSize, uiScale, graphicsQuality, reducedMotion, highContrast, colorBlindMode, isMuted	~45
useSaveStore	Persistence-middleware, hydration	~5
3.2 Implementation med Immer og Slices
// src/store/usePlayerStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
interface PlayerState {
  coins: number;
  inventory: CatchData[];
  upgrades: string[];
  questItems: string[];
  activeBait: string | null;
  baitExpiry: number;
  progression: { level: number; xp: number };
  stats: GameStats;
  completedGoals: string[];
  furniturePositions: Record<string, FurniturePos>;
}
interface PlayerActions {
  addCoins: (amount: number) => void;
  addCatch: (fish: CatchData) => void;
  buyUpgrade: (id: string, cost: number) => void;
  applyXP: (amount: number) => void;
  sellFish: (indices: number[]) => void;
}
export const usePlayerStore = create<PlayerState & PlayerActions>()(
  persist(
    immer((set, get) => ({
      coins: 0,
      inventory: [],
      upgrades: [],
      questItems: [],
      activeBait: null,
      baitExpiry: 0,
      progression: { level: 1, xp: 0 },
      stats: emptyStats(),
      completedGoals: [],
      furniturePositions: {},
      addCoins: (amount) => set((s) => { s.coins += amount; }),
      addCatch: (fish) => set((s) => {
        s.inventory.push(fish);
        s.stats.totalCatches += 1;
      }),
      buyUpgrade: (id, cost) => set((s) => {
        s.coins -= cost;
        s.upgrades.push(id);
      }),
      applyXP: (amount) => set((s) => {
        const result = applyXPCalc(s.progression.level, s.progression.xp, amount);
        s.progression = { level: result.level, xp: result.xp };
      }),
      sellFish: (indices) => set((s) => {
        const toSell = indices.map(i => s.inventory[i]).filter(Boolean);
        const earned = toSell.reduce((sum, f) => sum + (f.value ?? 0), 0);
        s.coins += earned;
        s.stats.totalEarned += earned;
        s.inventory = s.inventory.filter((_, i) => !indices.includes(i));
      }),
    })),
    {
      name: 'regnefisken_save',
      version: 14,
      migrate: migrateSave,
      partialize: (state) => ({
        coins: state.coins,
        inventory: state.inventory,
        upgrades: state.upgrades,
        // ... kun persistable fields
      }),
    }
  )
);
3.3 Cross-store kommunikation
Brug Zustand's getState() til at læse på tværs af stores uden at skabe tight coupling:

// I useFishingStore, efter en succesfuld fangst:
completeCatch: (catchData) => {
  set((s) => { s.lastCatch = catchData; s.currentStreak += 1; });
  
  usePlayerStore.getState().addCatch(catchData);
  usePlayerStore.getState().applyXP(catchData.xpReward);
  useUIStore.getState().showToast(`Du fangede en ${catchData.name}!`);
},
3.4 Persistence-strategi
Zustand's persist-middleware erstatter den manuelle localStorage-logik. Nøglepunkter:

Samme nøgle: regnefisken_save – så eksisterende saves virker
Versionering: version: 14 med migrate-funktion der håndterer v1→v14
Partialize: Gem kun det nødvendige (ikke UI-state som showShopScreen)
Merge: Ved load, merge saved state ind i default state (håndterer nye felter)
3.5 Migreringsstrategi for saves
Spillere har eksisterende saves i localStorage. Den nye Zustand-store skal:

Tjekke for eksisterende regnefisken_save ved opstart
Parse og migrere dataformatet til den nye store-struktur
Fordele data korrekt mellem de 7 stores (coins → PlayerStore, settings → UIStore, etc.)
Skrive den nye struktur tilbage
FASE 4: UI-komponent-ekstraktion (Dag 12–18)
Mål: Bryd DEL 5 + DEL 6 (linje 8698–14076) ned i React-komponenter.

4.1 Prioriteret rækkefølge (mindst risiko først)
Atomare UI-komponenter (ingen state): CoinIcon, XPBar, GlassPanel
Self-contained skærme (egen state): ShopScreen, GoalsScreen, JournalScreen
HUD-elementer: WeatherWidget, StreakIndicator, CoinDisplay
Modale overlays: LevelUpOverlay, GoalNotification, CollectibleModal
Komplekse interaktive: MathChallenge, BossFight, ChestMenu
Startskærm: StartScreen (linje 13952–14073)
Hoved-layout: GameLayout (erstatter FishingGame's return-statement)
4.2 Eksempel: ShopScreen-konvertering
Fra monolitten (linje 8747–8803) til moderne komponent:

// src/components/screens/ShopScreen.tsx
import { useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { useAudio } from '../../audio/useAudio';
import { SHOP_ITEMS } from '../../data/shop';
import { LOCATIONS } from '../../data/locations';
import { CoinIcon } from '../common/CoinIcon';
export function ShopScreen() {
  const { coins, upgrades, questItems, cheeseSources, featherSources } = usePlayerStore();
  const { level } = usePlayerStore(s => s.progression);
  const closeShop = useUIStore(s => s.closeShop);
  const initialTab = useUIStore(s => s.shopInitialTab);
  const { play } = useAudio();
  const [activeTab, setActiveTab] = useState(initialTab ?? 'fishing_gear');
  // ... resten af ShopScreen-logikken, uændret
}
4.3 CSS-migrering
Monolittens <style>-blok indeholder ~400 linjer CSS med keyframes og utility classes.

Strategi:

Tailwind-classes: Beholdes som de er (Tailwind v4 via Vite-plugin)
Custom keyframes (@keyframes slideInRight, shake, confetti, etc.): Flyttes til src/styles/animations.css
Glassmorphism-utilities (.panel-hud, .panel-shop, .btn-glass): Flyttes til src/styles/index.css som @layer components
A11y-styles (reduce-motion, high-contrast): Flyttes til src/styles/accessibility.css
FASE 5: Three.js → React Three Fiber (Dag 18–28)
Mål: Konverter 55+ imperative mesh-builders til deklarative R3F-komponenter. Dette er den teknisk tungeste fase.

5.1 Konverteringsprincip
Imperativ Three.js:

// Monolittens createBrandmandMesh() – linje 840
function createBrandmandMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 1.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xFF4444, roughness: 0.6 })
  );
  body.position.y = 0.6;
  g.add(body);
  // ... 170 linjer mere
  return g;
}
Deklarativ R3F:

// src/three/models/Brandmand.tsx
export function Brandmand(props: GroupProps) {
  return (
    <group {...props}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 1.2, 12]} />
        <meshStandardMaterial color={0xFF4444} roughness={0.6} />
      </mesh>
      {/* ... */}
    </group>
  );
}
5.2 Prioriteret konverteringsorden
Bølge 1 – Statiske modeller (enklest, ingen animation):

Bridge (5 varianter) → <Bridge variant={0..4} />
Bucket → <Bucket tier={bucketTier} />
GoldenFrog, TableVase, Spirit
Bølge 2 – Animerede modeller (kræver useFrame):

FishModel – den mest komplekse model med hale-, øje- og svømme-animation
FishingRod – svaj-animation
Bobber – vand-bop-animation
Seagull – flyve-animation
Bølge 3 – Komplekse scene-builders (miljøer):

DesertLake, ArcticSea, TropicalIsland, Cave, Pier
Disse indeholder mange sub-meshes og kræver omhyggelig konvertering
Bølge 4 – Boss-modeller og effekter:

Soeuhyre, Kraken, Brandmand (boss-varianter)
WeatherParticles (regn, sne, tåge)
WaterSurface med shader
5.3 FishPool → R3F Instancing
FishPool (monolittens IIFE-baserede object pool med Map<string, THREE.Group>) konverteres til R3F's <Instances>:

// src/three/FishPool.tsx
import { Instances, Instance } from '@react-three/drei';
export function FishPool({ activeFish }: { activeFish: ActiveFish[] }) {
  return (
    <Instances limit={50}>
      <boxGeometry />
      <meshStandardMaterial />
      {activeFish.map(fish => (
        <FishInstance key={fish.id} data={fish} />
      ))}
    </Instances>
  );
}
5.4 GameCanvas: Den samlende R3F-scene
// src/three/GameCanvas.tsx
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore';
export function GameCanvas() {
  const location = useGameStore(s => s.currentLocation);
  const weather = useGameStore(s => s.weatherType);
  const quality = useUIStore(s => s.graphicsQuality);
  return (
    <Canvas
      shadows={quality !== 'low'}
      dpr={quality === 'ultra' ? [1, 2] : [1, 1.5]}
      camera={{ position: [0, 5, 12], fov: 50 }}
    >
      <LightingRig weather={weather} />
      <LocationScene location={location} />
      <FishingRod />
      <Bobber />
      <FishPool />
      <WeatherParticles type={weather} />
      <WaterSurface />
    </Canvas>
  );
}
5.5 Sikkerhedsnet: Parallel kørsel
Under konverteringen kan du køre begge 3D-systemer side-by-side:

Indlejr <GameCanvas> som et overlay
Sammenlig visuelt med den originale monolits output
Fjern den imperative version når R3F-versionen matcher 1:1
FASE 6: Integration og Sammensmeltning (Dag 28–35)
6.1 Erstat FishingGame-komponenten
Den originale FishingGame() (linje 8920–14076) er nu en tom skal. Dens ansvar er fordelt:

// src/App.tsx
import { GameCanvas } from './three/GameCanvas';
import { HUD } from './components/hud/HUD';
import { StartScreen } from './components/screens/StartScreen';
import { useGameStore } from './store/useGameStore';
import { useSaveStore } from './store/useSaveStore';
export function App() {
  const hasStarted = useGameStore(s => s.hasStarted);
  
  useSaveStore(); // Hydrate fra localStorage
  if (!hasStarted) return <StartScreen />;
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GameCanvas />
      <HUD />
      <ModalLayer />
    </div>
  );
}
6.2 Loader-migration
Monolittens loader (canvas med plankton/bobler/skildpadde i <body> før React) erstattes:

Behold den statiske loader i index.html (den kører før JS er loadet)
Brug React.Suspense + React.lazy til code-splitting af tunge 3D-assets
Loader forsvinder via window.hideLoader() når React er mounted
6.3 Smoke-test: Fuld gennemgang
Gå systematisk igennem alle features:


Start spillet → se startskærm med animationer

Kast ud → regnestykke vises

Svar korrekt → fisk fanges, XP gives

Streak-bonus virker

Zen-mode med klip-linen

Alle 8+ lokationer loader korrekt 3D-scene

Shop fungerer (køb/lås op)

Boss-kampe (Hvidhaj, Kraken, Søuhyre, Gorm)

Kiste med alle faner

Companions/kæledyr

Collectibles (fossil, konkylie, perle)

Save/load bevarer al progression

Vejr-system (klar, regn, storm, tåge)

Dag/nat-cyklus

Lyd (alle 20+ effekter + ambience)

Mobil-UI (numpad, bag, responsive)

Tilgængelighed (farveblind, reduce-motion, font-size)
FASE 7: Test og Kvalitetssikring (Dag 35–40)
7.1 Vitest-opsætning
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
7.2 Test-pyramide
Unit tests (logik – højeste prioritet):

math-engine.test.ts – alle regnearter, farvande, sværhedsgrader
catch-engine.test.ts – rarity rolls, bait-modifiers, area-filtrering
xp-engine.test.ts – level-up beregninger, streak-bonus
save-load.test.ts – migration fra v1 → v14, korrupt data
Integration tests (stores):

Zustand stores: købsflow, fangst-cycle, progression-checks
Cross-store: fangst → XP → level-up → goal-check pipeline
Snapshot tests (data-integritet):

CATCH_MASTER_DATA output matcher monolitten
ENRICHED_CATCH_DATA beregnes identisk
SHOP_ITEMS priser/krav er uændrede
7.3 Performance-budget
Metrik	Monolit (nu)	Mål (Vite)
First Paint	~4s (Babel compile)	<1s
TTI	~6s	<2s
Bundle size	~700KB (alt i én)	<200KB initial + lazy
3D frame rate	30-45 FPS	55-60 FPS
FASE 8: Deployment (Dag 40–42)
8.1 Netlify-konfiguration
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
[build.environment]
  NODE_VERSION = "20"
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
8.2 GitHub-workflow
main ──→ Netlify Production
  │
  ├── feature/data-extraction
  ├── feature/zustand-stores
  ├── feature/r3f-models
  ├── feature/ui-components
  └── feature/integration
Hver feature-branch får en Netlify preview-URL via netlify deploy --alias=pr-X.

8.3 Git-strategi
git init
git add .
git commit -m "feat: initial Vite + TS scaffold"
# Behold monolitten som reference:
cp ../regnefisken.html ./reference/regnefisken-original.html
git add reference/
git commit -m "chore: add original monolith as reference"
Tidsplan (sammenfatning)
Fase	Varighed	Risiko	Deliverable
0: Fundament	2 dage	Lav	Vite-projekt med alle deps
1: Data	3 dage	Lav	14 typede data-moduler + tests
2: Logik	3 dage	Lav-Medium	6 logik-moduler + 30+ tests
3: Zustand	5 dage	Høj	7 stores, persistence, save-migration
4: UI	6 dage	Medium	30+ komponenter, CSS
5: R3F	10 dage	Høj	55+ 3D-modeller, scenes, effekter
6: Integration	7 dage	Høj	Alt samlet, smoke-test
7: Test	5 dage	Lav	Test-suite, performance
8: Deploy	2 dage	Lav	Netlify live
Total: ~43 arbejdsdage

Kritiske risici og modforanstaltninger
Risiko	Konsekvens	Modforanstaltning
Save-kompatibilitet bryder	Spillere mister progression	Skriv migration-tests først; test med rigtige saves
3D-modeller ser anderledes ud i R3F	Visuelt brud	Kør begge systemer parallelt; pixel-sammenligning
State-race conditions i Zustand	Uforklarlige bugs	Hold ét getState()-kald pr. action; brug Immer
Tailwind v4 vs CDN-forskelle	Styling-brud	Pin Tailwind-version; sammenlig visuelt
Performance-regression	Langsommere end monolitten	Profile tidligt med React DevTools + R3F perf monitor
Det er din komplette slagplan. Strukturen sikrer at du aldrig bryder noget der virker – du bygger udefra og ind (data → logik → state → UI → 3D), og hvert trin kan valideres uafhængigt.