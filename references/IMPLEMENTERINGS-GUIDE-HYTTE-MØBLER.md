# Implementerings-guide: Fiskehytte-møbler & Fiskekonkurrence

> Samlet plan for A) Spilledåse-opgradering, B) Stjernekikkert, C) Vindertrofæ, D) Fiskekonkurrence-feature.
> Baseret på kodebase-analyse d. 16. april 2026.

---

## A — Spilledåsen: Grafisk opgradering

### Nuværende tilstand
**Fil:** `src/three/cabin/furniture/MusicBoxFurniture.tsx`

Spilledåsen er i dag en simpel mørk trækasse (`0x5a3018`) med et fladt perlemor-låg (`0xf0e6d4`), en enkelt guldring (torus) og en lille guldlås. Animationen (låget vipper) fungerer fint, men modellen ser primitiv ud.

### Designvalg
Behold den rektangulære form, men tilføj markant flere detaljer for at gøre den "smuk og havfrue-værdig".

### Ændringsplan

**1. Krop/base — perlemor-finish i stedet for mørkt træ**
```
Nuværende: boxGeometry [0.55, 0.3, 0.4], color: 0x5a3018 (darkWood)
Nyt:        Samme box, men color: 0xf5e6d0 (varm perlemor), metalness: 0.25, roughness: 0.2
            + en emissive: 0xf0d8c0, emissiveIntensity: 0.05 for svag glød
```

**2. Guldkant/trim langs alle kanter**
Tilføj 4 vandrette guldlister (tynde boxGeometry-er) langs kassens top- og bundkanter:
```tsx
// Bundkant (front)
<mesh position={[0, 0.01, 0.2]}>
  <boxGeometry args={[0.57, 0.02, 0.02]} />
  <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
</mesh>
// + tilsvarende for bagkant, og to sidekanter
// + samme sæt ved topkanten (y ≈ 0.29)
```

**3. Dekorative guld-snirkler på forsiden**
Brug 2-3 små torusGeometry-er (r=0.04, tube=0.006) placeret på forsiden med let rotation for at illudere ornamentik:
```tsx
// Central ornament
<mesh position={[0, 0.15, 0.205]} rotation={[0, 0, Math.PI / 4]}>
  <torusGeometry args={[0.04, 0.006, 6, 12]} />
  <meshStandardMaterial color={gold} metalness={0.8} roughness={0.2} />
</mesh>
// Flanker (spejlet)
<mesh position={[-0.12, 0.15, 0.205]} rotation={[0, 0, -Math.PI / 6]}>
  <torusGeometry args={[0.03, 0.005, 6, 10]} />
  <meshStandardMaterial color={gold} metalness={0.8} roughness={0.2} />
</mesh>
<mesh position={[0.12, 0.15, 0.205]} rotation={[0, 0, Math.PI / 6]}>
  <torusGeometry args={[0.03, 0.005, 6, 10]} />
  <meshStandardMaterial color={gold} metalness={0.8} roughness={0.2} />
</mesh>
```

**4. Hjørnebeslag (små guld-kuber)**
4 stk. ved kassens øverste hjørner:
```tsx
{[[-0.26, 0.28, 0.19], [0.26, 0.28, 0.19], [-0.26, 0.28, -0.19], [0.26, 0.28, -0.19]].map((p, i) => (
  <mesh key={`corner${i}`} position={p}>
    <boxGeometry args={[0.03, 0.03, 0.03]} />
    <meshStandardMaterial color={gold} metalness={0.75} roughness={0.25} flatShading />
  </mesh>
))}
```

**5. Lille nøgle/hank på siden**
En cylinder + sphere der stikker ud fra højre side:
```tsx
<mesh position={[0.285, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
  <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
  <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
</mesh>
<mesh position={[0.32, 0.15, 0]}>
  <sphereGeometry args={[0.018, 8, 8]} />
  <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
</mesh>
```

**6. Svagt pointLight inde i kassen (synligt når låget åbner)**
```tsx
<pointLight
  color={0xffe8c8}
  position={[0, 0.2, 0]}
  intensity={playingRef.current ? 0.8 : 0}
  distance={2}
  decay={2}
/>
```
Kræver at lyset styres i `useFrame` — sæt `lightRef.current.intensity` baseret på `playingRef.current`.

**7. Perlemor-låget: Tilføj en lille guld-muslingeskal som dekoration**
```tsx
// Oval "muslingeskal" centreret på låget
<mesh position={[0, 0.02, 0]} scale={[1, 0.5, 1]}>
  <sphereGeometry args={[0.05, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
  <meshStandardMaterial color={gold} metalness={0.6} roughness={0.3} />
</mesh>
```
Placér dette som child af `lidRef`-meshen.

### Samlet effekt
Kassen går fra "mørk primitiv boks" til "elegant perlemor-skrin med guldbeslag, ornamenter og en varm glød når den spiller".

---

## B — Kikkerten → Stjernekikkert

### Nuværende tilstand
**Filer:**
- Komponent: `src/three/cabin/furniture/KitchenFurniture.tsx` → `KitchenTelescopeFurniture`
- Butik: `src/data/furnitureShopItems.ts` → id `kitchen_telescope`

Kikkerten er et pænt 3D-stativ med et cylinder-teleskop. Den har ingen onClick-handler — den "kan ikke noget endnu".

### Ændringsplan

**1. Omdøb i butikken**
I `furnitureShopItems.ts`, ændr:
```ts
// FRA:
{ id: 'kitchen_telescope', name: 'Kikkert', emoji: '🔭',
  description: 'Kikkert på stativ foran vinduet', ... }

// TIL:
{ id: 'kitchen_telescope', name: 'Stjernekikkert', emoji: '🔭',
  description: 'Antik stjernekikkert på stativ — et smukt relikvie fra en svunden tid',
  room: 'kitchen', price: 1200, featured: true }
```

**2. Tilføj onClick-handler med mystisk toast**
I `KitchenTelescopeFurniture`, tilføj:
```tsx
import { useUIStore } from '../../../store/useUIStore.js';

// Inde i komponenten:
function handleClick(e: { stopPropagation: () => void }) {
  e.stopPropagation();
  useUIStore.getState().setToastMessage(
    '🔭✨ Du kigger gennem stjernekikkerten... men linsen er revnet. Den viser kun mørke og tåge. Måske kan linsen repareres?'
  );
}
```
Tilføj `onClick={handleClick}` på hele gruppen eller på teleskop-cylinderen:
```tsx
<group position={[0, 1.26, 0]} rotation={[-Math.PI * 0.25, 0, 0]}>
  <mesh castShadow onClick={handleClick}>  {/* <-- tilføj onClick her */}
```

**3. Grafisk hint om alder/patina (valgfrit ekstra)**
Ændr metalfarven til en mere antik bronze-tone:
```ts
// FRA:
const metal = 0x4a4a4a;
// TIL:
const metal = 0x7a6540;  // Antik messing/bronze
```
Og øg roughness til 0.55 for en mere slidt, antik overflade.

### Fremtidig hook
Systemet er forberedt til at en "linse"-quest-item kan checke f.eks. `questItems.includes('telescope_lens')` og ændre toasten + give kikkerten funktionalitet.

---

## C — Vindertrofæ (nyt møbel)

### Koncept
En større, spejlvendt, guldfarvet version af `MountedFishFurniture` med en flottere ramme. Hænger over kaminen som default. Kan kun opnås via fiskekonkurrence-password.

### Ændringsplan

**1. Ny komponent: `src/three/cabin/furniture/WinnerTrophyFurniture.tsx`**

Baseret direkte på `MountedFishFurniture.tsx`, men med disse ændringer:

```tsx
import { forwardRef, useEffect, useMemo, type ComponentPropsWithoutRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import type { Group } from 'three';

type GroupProps = ComponentPropsWithoutRef<'group'>;

function useWinnerTailGeometry() {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    // SPEJLVENDT hale: positiv X i stedet for negativ
    const v = new Float32Array([
      0, 0, 0,   0.20, 0.15, 0,   0.20, -0.15, 0,
      0, 0, 0,   0.20, -0.15, 0,  0.20, 0.15, 0,
    ]);
    g.setAttribute('position', new BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** Vindertrofæ — forstørret, spejlvendt, guldfarvet fiskemontage. */
export const WinnerTrophyFurniture = forwardRef<Group, GroupProps>(
  function WinnerTrophyFurniture(props, ref) {
    const tailGeo = useWinnerTailGeometry();

    // GULDFARVER
    const goldBody = 0xffd700;      // Klar guld
    const goldFin = 0xdaa520;       // Mørk guld
    const goldPlaque = 0x8b7332;    // Ramme-guld (mørkere)
    const goldTrim = 0xffc125;      // Lys guldkant

    // Skala-faktor: ~1.6x større end originalen
    const S = 1.6;

    return (
      <group ref={ref} {...props}
        userData={{ isMovable: true, movableType: 'winner_trophy' }}>

        {/* Plade/baggrund — større + guldkant */}
        <mesh position={[0, 0, 0.04 * S]} castShadow>
          <boxGeometry args={[0.95 * S, 0.55 * S, 0.06 * S]} />
          <meshStandardMaterial
            color={goldPlaque}
            roughness={0.7}
            metalness={0.3}
            flatShading
          />
        </mesh>

        {/* Guldramme rundt om pladen (4 kanter) */}
        {/* Top */}
        <mesh position={[0, 0.275 * S + 0.015, 0.07 * S]} castShadow>
          <boxGeometry args={[1.0 * S, 0.03, 0.03]} />
          <meshStandardMaterial color={goldTrim} metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Bund */}
        <mesh position={[0, -0.275 * S - 0.015, 0.07 * S]} castShadow>
          <boxGeometry args={[1.0 * S, 0.03, 0.03]} />
          <meshStandardMaterial color={goldTrim} metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Venstre */}
        <mesh position={[-0.475 * S - 0.015, 0, 0.07 * S]} castShadow>
          <boxGeometry args={[0.03, 0.55 * S + 0.06, 0.03]} />
          <meshStandardMaterial color={goldTrim} metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Højre */}
        <mesh position={[0.475 * S + 0.015, 0, 0.07 * S]} castShadow>
          <boxGeometry args={[0.03, 0.55 * S + 0.06, 0.03]} />
          <meshStandardMaterial color={goldTrim} metalness={0.7} roughness={0.25} />
        </mesh>

        {/* Fiskekrop — SPEJLVENDT (x negeret), guldfarvet */}
        <mesh position={[-0.10, 0.01, 0.14 * S]} castShadow
              scale={[1.8 * S, 0.9 * S, S]}
              rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.08, 16]} />
          <meshStandardMaterial
            color={goldBody}
            metalness={0.6}
            roughness={0.3}
            emissive={0xffa500}
            emissiveIntensity={0.08}
          />
        </mesh>

        {/* Hale — spejlvendt (bruger positiv-X geometry) */}
        <mesh position={[0.15, 0.01, 0.14 * S]} castShadow
              geometry={tailGeo}
              scale={S}>
          <meshStandardMaterial
            color={goldFin}
            metalness={0.5}
            roughness={0.35}
            flatShading
          />
        </mesh>

        {/* Rygfinne — spejlvendt */}
        <mesh position={[-0.10, 0.02, 0.19 * S]} castShadow
              rotation={[0.3, 0, 0.8]}
              scale={[S, S, 0.25 * S]}>
          <coneGeometry args={[0.06, 0.12, 3]} />
          <meshStandardMaterial color={goldFin} metalness={0.5} roughness={0.35} flatShading />
        </mesh>

        {/* Øje — spejlvendt */}
        <mesh position={[-0.25, 0.03, 0.185 * S]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshBasicMaterial color={0x1a1a1a} />
        </mesh>

        {/* Svag guldglød */}
        <pointLight
          color={0xffd700}
          position={[0, 0, 0.2]}
          intensity={0.4}
          distance={3}
          decay={2}
        />
      </group>
    );
  },
);
```

**2. Registrer i furniture-systemet**

**`furnitureShopItems.ts`** — tilføj IKKE til `FURNITURE_SHOP_ITEMS` (det skal ikke kunne købes). Tilføj i stedet til `QUEST_COMPANION_DEFAULTS`:
```ts
export const QUEST_COMPANION_DEFAULTS: Record<string, RoomId> = {
  // ... eksisterende ...
  winner_trophy: 'living',
};

// Tilføj display-label
const COMPANION_DISPLAY: Record<string, { emoji: string; name: string }> = {
  // ... eksisterende ...
  winner_trophy: { emoji: '🏆', name: 'Vindertrofæ' },
};
```

**3. Default-position over kaminen**

**`cabinFurniturePersistence.ts`** — tilføj til `FURNITURE_RESET_DEFAULTS`:
```ts
winner_trophy: { x: -3.6, z: -4.8, rot: 0 },  // Direkte over kaminens mantel
```
Tilføj til `Y_DEFAULTS`:
```ts
winner_trophy: 2.8,  // Over kaminens mantel (mantel er ca. y=2.24)
```

**4. Rendering i kabinettet**

I `CabinRoomFurniture.tsx`, tilføj conditionally rendering:
```tsx
import { WinnerTrophyFurniture } from './furniture/WinnerTrophyFurniture.js';

// I render-logikken (ved siden af andre quest-companions):
{unlockedFurniture.includes('winner_trophy') && currentRoom('winner_trophy') === room && (
  <WinnerTrophyFurniture
    ref={addMovableRef}
    position={[defaultPos.x, Y_DEFAULTS.winner_trophy, defaultPos.z]}
    rotation={[0, defaultPos.rot, 0]}
  />
)}
```

---

## D — Fiskekonkurrence (ny feature)

### Overblik
Ny fane "Konkurrencer" i Mål-modalen med: 30-min timer, fangst-tæller, og password-unlock til vindertrofæ.

### Arkitektur

#### D.1 — Ny state i `useGameStore`

Tilføj til `useGameStore.ts` (fordi det er session-state der nulstilles ved reload):
```ts
// State
competitionStartedAt: number | null;     // Date.now() ved start, null = ikke startet
competitionCatches: number;              // Antal fangster under konkurrence
competitionFinished: boolean;            // true når 30 min er gået

// Actions
startCompetition: () => void;
resetCompetition: () => void;
incrementCompetitionCatches: () => void;
setCompetitionFinished: (v: boolean) => void;
```

Implementation:
```ts
competitionStartedAt: null,
competitionCatches: 0,
competitionFinished: false,

startCompetition: () => set({
  competitionStartedAt: Date.now(),
  competitionCatches: 0,
  competitionFinished: false,
}),
resetCompetition: () => set({
  competitionStartedAt: null,
  competitionCatches: 0,
  competitionFinished: false,
}),
incrementCompetitionCatches: () => set((s) => ({
  competitionCatches: s.competitionCatches + 1,
})),
setCompetitionFinished: (competitionFinished) => set({ competitionFinished }),
```

**Vigtigt:** Fordi det er `useGameStore` (ikke persisted), nulstilles alt automatisk ved page-refresh/app-luk. Dog: `competitionCatches` skal blive stående efter timeren udløber (kun nulstilles ved eksplicit `resetCompetition` eller app-luk) — dette opnås ved at `competitionFinished: true` stopper timeren men beholder `competitionCatches`.

#### D.2 — Hook fangst-tælleren ind

Fangster registreres i `src/components/fishing/MathChallenge.tsx` på to steder:

- **Linje 981** — `cabin_key` specialtilfælde (i `finalizeCatch`)
- **Linje 1126** — den generelle catch-handler (i `requestAnimationFrame`-blokken)

Begge steder kalder `usePlayerStore.getState().incrementTotalSuccessfulCatches()`.
Tilføj **lige efter** dette kald på begge steder:

```ts
// Konkurrence-tæller (session-only)
const _gs = useGameStore.getState();
if (_gs.competitionStartedAt && !_gs.competitionFinished) _gs.incrementCompetitionCatches();
```

Husk at importere `useGameStore` øverst i filen hvis det ikke allerede er gjort.

> **Note:** Alle fangster tæller (inkl. skrald), jf. designvalg. Vi genbruger IKKE den eksisterende `totalSuccessfulCatches` (all-time, persisteret) — i stedet bruger vi den nye `competitionCatches` som lever i `useGameStore` (session-only, nulstilles ved reload).

#### D.3 — Timer-logik

I konkurrence-UI'et (eller som en useEffect):
```ts
useEffect(() => {
  if (!competitionStartedAt || competitionFinished) return;

  const interval = setInterval(() => {
    const elapsed = Date.now() - competitionStartedAt;
    const remaining = 30 * 60 * 1000 - elapsed;  // 30 min

    if (remaining <= 0) {
      useGameStore.getState().setCompetitionFinished(true);
      clearInterval(interval);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [competitionStartedAt, competitionFinished]);
```

#### D.4 — Ny fane i GoalsScreen

**Ændring i `GoalsScreen.tsx`:**

Tilføj `'konkurrencer'` til categories-arrayet:
```ts
const categories = ['alle', 'fangst', 'matematik', 'udforskning', 'samling', 'økonomi', 'konkurrencer'];
```

Når `activeCategory === 'konkurrencer'`, vis et separat UI i stedet for goals-listen:

```tsx
{activeCategory === 'konkurrencer' ? (
  <CompetitionTab />
) : (
  <div className="scrollbar-hide ...">
    {/* eksisterende goals-rendering */}
  </div>
)}
```

#### D.5 — CompetitionTab-komponent

Ny fil: `src/components/screens/CompetitionTab.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { useAudio } from '../../audio/useAudio';

export function CompetitionTab() {
  const { play } = useAudio();
  const startedAt = useGameStore((s) => s.competitionStartedAt);
  const catches = useGameStore((s) => s.competitionCatches);
  const finished = useGameStore((s) => s.competitionFinished);
  const startCompetition = useGameStore((s) => s.startCompetition);
  const resetCompetition = useGameStore((s) => s.resetCompetition);

  // Timer display
  const [timeStr, setTimeStr] = useState('30:00');

  useEffect(() => {
    if (!startedAt || finished) return;
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 30 * 60 * 1000 - elapsed);
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      setTimeStr(`${min}:${sec.toString().padStart(2, '0')}`);
      if (remaining <= 0) {
        useGameStore.getState().setCompetitionFinished(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, finished]);

  // Password input
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [wrongCode, setWrongCode] = useState(false);

  const hasWinnerTrophy = usePlayerStore((s) =>
    s.unlockedFurniture.includes('winner_trophy')
  );

  function handleUnlock() {
    if (password === '676767') {
      play('legendary_catch');  // eller passende lyd
      usePlayerStore.getState().unlockFurniture('winner_trophy');
      useUIStore.getState().setToastMessage(
        '🏆🎉 Tillykke! Du er klassens fiskemester! ' +
        'Vindertrofæet hænger nu stolt over din kamin!'
      );
      setShowPasswordInput(false);
      setPassword('');
      setWrongCode(false);
    } else {
      setWrongCode(true);
      setPassword('');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br
        from-slate-900/90 to-blue-950/40 p-6 text-center">
        <h3 className="mb-2 text-2xl font-black text-blue-300">
          🐟 Fiskekonkurrence
        </h3>
        <p className="text-sm text-slate-400">
          Start en 30-minutters konkurrence og fang så mange som muligt!
        </p>
      </div>

      {/* TIMER + TÆLLER */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6">
        {!startedAt ? (
          /* Ikke startet endnu */
          <div className="text-center">
            <p className="mb-4 text-lg text-slate-300">
              Klar til at konkurrere?
            </p>
            <button
              onClick={() => { play('ui'); startCompetition(); }}
              className="rounded-xl bg-blue-600 px-8 py-3 text-lg font-bold
                text-white transition-all hover:bg-blue-500"
            >
              ▶ Start konkurrence
            </button>
          </div>
        ) : (
          <div className="text-center">
            {/* Timer */}
            <div className="mb-4">
              <span className={`text-5xl font-black tabular-nums ${
                finished ? 'text-red-400' : 'text-blue-300'
              }`}>
                {finished ? '00:00' : timeStr}
              </span>
              {finished && (
                <p className="mt-2 text-lg font-bold text-red-400">
                  ⏰ Tiden er udløbet!
                </p>
              )}
            </div>

            {/* Fangst-tæller */}
            <div className="mb-6 rounded-xl border border-amber-500/30
              bg-amber-900/20 px-6 py-4">
              <span className="text-4xl font-black text-amber-300">
                {catches}
              </span>
              <p className="text-sm text-amber-400/70">
                {catches === 1 ? 'fangst' : 'fangster'}
              </p>
            </div>

            {/* Nulstil-knap */}
            <button
              onClick={() => { play('ui'); resetCompetition(); setTimeStr('30:00'); }}
              className="rounded-xl bg-slate-700 px-6 py-2 text-sm font-bold
                text-slate-300 transition-all hover:bg-slate-600"
            >
              🔄 Nulstil konkurrence
            </button>
          </div>
        )}
      </div>

      {/* PRÆMIE-SEKTION */}
      {!hasWinnerTrophy && (
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br
          from-slate-900/90 to-yellow-950/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏆</span>
            <div>
              <h4 className="font-bold text-yellow-300">Vindertrofæ</h4>
              <p className="text-xs text-slate-400">
                Har din lærer givet dig en præmiekode?
              </p>
            </div>
          </div>

          {!showPasswordInput ? (
            <button
              onClick={() => { play('ui'); setShowPasswordInput(true); }}
              className="w-full rounded-xl bg-yellow-700/40 px-4 py-3
                text-sm font-bold text-yellow-300 transition-all
                hover:bg-yellow-700/60"
            >
              🔑 Indløs præmie
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Indtast kode..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setWrongCode(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="rounded-xl border border-slate-600 bg-slate-800
                  px-4 py-3 text-center text-lg font-mono text-white
                  placeholder-slate-500 focus:border-yellow-500 focus:outline-none"
                autoFocus
              />
              {wrongCode && (
                <p className="text-center text-sm text-red-400">
                  Forkert kode — prøv igen!
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPasswordInput(false); setPassword(''); setWrongCode(false); }}
                  className="flex-1 rounded-xl bg-slate-700 py-2 text-sm
                    font-bold text-slate-400 hover:bg-slate-600"
                >
                  Annuller
                </button>
                <button
                  onClick={handleUnlock}
                  className="flex-1 rounded-xl bg-yellow-600 py-2 text-sm
                    font-bold text-white hover:bg-yellow-500"
                >
                  🏆 Tag imod din præmie
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Allerede unlocked */}
      {hasWinnerTrophy && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-900/10 p-6 text-center">
          <span className="text-4xl">🏆</span>
          <p className="mt-2 font-bold text-yellow-300">
            Du er klassens fiskemester!
          </p>
          <p className="text-xs text-slate-400">
            Vindertrofæet hænger i din fiskehytte.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Implementerings-rækkefølge (anbefalet)

| Trin | Opgave | Estimat | Afhængigheder |
|------|--------|---------|---------------|
| 1 | **B: Stjernekikkert** — omdøb + toast | 10 min | Ingen |
| 2 | **A: Spilledåse** — grafisk opgradering | 20 min | Ingen |
| 3 | **C.1: WinnerTrophyFurniture** — ny komponent | 20 min | Ingen |
| 4 | **C.2: Registrering** — furniture defaults + persistence | 10 min | C.1 |
| 5 | **C.3: Rendering** — conditional rendering i cabin | 10 min | C.2 |
| 6 | **D.1: Game store** — competition state | 10 min | Ingen |
| 7 | **D.2: Fangst-hook** — increment ved catch | 10 min | D.1 |
| 8 | **D.3-D.5: CompetitionTab** — UI + password | 30 min | D.1 |
| 9 | **Integration** — fane i GoalsScreen | 10 min | D.3-D.5 |
| 10 | **Test** — fuld gennemgang | 20 min | Alt |

**Total estimat: ~2.5 timer**

---

## Vigtige noter

1. **Password-sikkerhed:** Koden `676767` ligger i klient-kode og kan i princippet læses af nysgerrige elever via DevTools. For et skolespil er dette acceptabelt, men vær opmærksom. En mulig forbedring er at hashe koden (f.eks. med en simpel SHA-256 check).

2. **Konkurrence-fangster nulstilles ved app-luk** fordi state'en lever i `useGameStore` (ikke-persisteret). Fangst-tallet forbliver synligt efter timeren udløber (designvalg), men forsvinder ved reload.

3. **Fane-placering:** "Konkurrencer" placeres efter "økonomi" i category-arrayet. Den renderes som en separat komponent (ikke goal-rows), fordi dens UI er fundamentalt anderledes.

4. **Vindertrofæet** bruger `unlockFurniture('winner_trophy')` som persisteres i `usePlayerStore.unlockedFurniture[]`, så det forbliver unlocked efter reload.

5. **Spejlvendingen** af fisken opnås ved at negere X-koordinater i position og hale-geometry. Fiskens krop peger nu den modsatte vej.
