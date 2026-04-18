import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminCoords } from '../../store/useAdminStore.js';
import { CATCH_MASTER_DATA } from '../../data/fish.js';
import { COLLECTIBLES } from '../../data/collectibles.js';
import { LOCATION_DISPLAY } from '../../data/locations.js';
import { ENRICHED_CATCH_DATA } from '../../data/enrichment.js';
import {
  computeAdditiveDR,
  computeAdditiveVR,
  makeId,
  rollCatchDisplayColor,
  rollForCatch,
} from '../../logic/catch-engine.js';
import type { CatchMasterEntry, RollCatchResult } from '../../types/fish.js';
import type { CollectibleId } from '../../types/collectibles.js';
import { useAdminStore } from '../../store/useAdminStore.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { useFishingStore } from '../../store/useFishingStore.js';
import { useGameStore } from '../../store/useGameStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';

/** Alle lokationer; sorteres alfabetisk på visningsnavn. */
const LOCATION_ENTRIES = Object.entries(LOCATION_DISPLAY as Record<string, string>).sort((a, b) =>
  a[1].localeCompare(b[1], 'da'),
);

/** `konkylie` i fiskedata ↔ `conch` i samleobjekt-register. */
const ADMIN_FISH_TO_COLLECTIBLE_ID: Partial<Record<string, CollectibleId>> = {
  konkylie: 'conch',
};

/** Kort NPC-navn fra `COLLECTIBLES` når det afviger fra `CatchMasterEntry.name` (fx Sardin vs Lille Sardin). */
function adminCollectibleShortName(fishId: string): string | null {
  const cid =
    ADMIN_FISH_TO_COLLECTIBLE_ID[fishId] ??
    (fishId === 'fossil' || fishId === 'sardine' ? (fishId as CollectibleId) : undefined);
  if (!cid) return null;
  return COLLECTIBLES[cid].name;
}

function adminForcedCatchSortKey(c: CatchMasterEntry): string {
  const short = adminCollectibleShortName(c.id);
  if (short && short !== c.name) return `${short} ${c.name}`;
  return c.name;
}

function adminForcedCatchOptionLabel(c: CatchMasterEntry): string {
  const short = adminCollectibleShortName(c.id);
  if (short && short !== c.name) return `${short} — ${c.name} (${c.rarity})`;
  return `${c.name} (${c.rarity})`;
}

const CATCH_OPTIONS = [...CATCH_MASTER_DATA].sort((a, b) =>
  adminForcedCatchSortKey(a).localeCompare(adminForcedCatchSortKey(b), 'da'),
);

/** Øverste valg i dropdown: samme pool som ved almindelig fiskeri på nuværende lokation. */
const NORMAL_CATCH_ID = '__admin_normal_catch__';

function rollNormalCatchLikeGameplay(): RollCatchResult {
  const now = Date.now();
  const game = useGameStore.getState();
  const player = usePlayerStore.getState();
  const collection = useCollectionStore.getState();
  const helleflynderCaught = collection.helleflynderCaught;
  return rollForCatch({
    difficulty: Math.min(3, Math.max(1, Math.floor(player.progression.level / 4) || 1)),
    level: player.progression.level,
    location: game.currentLocation,
    playerUpgrades: player.upgrades,
    questItems: player.questItems,
    activeBait: player.activeBait,
    weatherType: game.weatherType,
    hasMapLeft: player.questItems.includes('map_left'),
    activeConchBait: now < player.conchBaitExpiry,
    activeFossilBait: now < player.fossilBaitExpiry,
    activeFlyBait: now < player.flyBaitExpiry,
    hajBloodExpiry: player.hajBloodExpiry,
    perleLimExpiry: player.perleLimExpiry,
    additiveDR: computeAdditiveDR(
      now,
      player.upgrades,
      player.conchBaitExpiry,
      player.flyBaitExpiry,
      player.hajBloodExpiry,
      player.perleLimExpiry,
    ),
    additiveVR: computeAdditiveVR(player.upgrades),
    junkStreak: player.stats.currentJunkStreak,
    helleflynderCaught,
    hvalbofActive: player.hvalbofActive,
    krakenDefeated: player.krakenDefeated,
    koedklumpActive: player.koedklumpActive,
    soeuhyreDefeated: player.soeuhyreDefeated,
    collectibleDelivered: collection.collectibleDelivered,
  });
}

function buildForcedCatch(entry: CatchMasterEntry): RollCatchResult {
  const enriched = ENRICHED_CATCH_DATA.find((e) => e.id === entry.id);
  const weight = entry.weightRange
    ? Number(
        (
          entry.weightRange[0] +
          Math.random() * (entry.weightRange[1] - entry.weightRange[0])
        ).toFixed(1),
      )
    : Number((0.5 + Math.random() * 5).toFixed(1));
  return {
    id: makeId(),
    fishModelId: entry.id,
    species: entry.name,
    weight,
    value: entry.value ?? enriched?.baseValue ?? 10,
    rarity: entry.rarity,
    color: rollCatchDisplayColor(entry.id, entry.model?.color, entry.rarity),
    itemType: entry.itemType,
    visual: entry.visual,
    visualScale: entry.visualScale,
    xpReward: entry.xpReward ?? enriched?.baseXP ?? 5,
  };
}

export function AdminPanel() {
  const isOpen = useAdminStore((s) => s.isOpen);
  const close = useAdminStore((s) => s.close);
  const freeRoamActive = useAdminStore((s) => s.freeRoamActive);
  const setFreeRoamActive = useAdminStore((s) => s.setFreeRoamActive);
  const freeRoamGroundLock = useAdminStore((s) => s.freeRoamGroundLock);
  const setFreeRoamGroundLock = useAdminStore((s) => s.setFreeRoamGroundLock);
  const coords = useAdminStore((s) => s.coords);
  const coordRecordActive = useAdminStore((s) => s.coordRecordActive);
  const coordRecordSamples = useAdminStore((s) => s.coordRecordSamples);
  const startCoordRecord = useAdminStore((s) => s.startCoordRecord);
  const stopCoordRecord = useAdminStore((s) => s.stopCoordRecord);
  const clearCoordRecordSamples = useAdminStore((s) => s.clearCoordRecordSamples);
  const appendCoordRecordSample = useAdminStore((s) => s.appendCoordRecordSample);

  const fishEditorOpen = import.meta.env.DEV ? useEditorStore((s) => s.isOpen) : false;
  const currentLocation = useGameStore((s) => s.currentLocation);
  const progression = usePlayerStore((s) => s.progression);
  const coins = usePlayerStore((s) => s.coins);

  const [catchId, setCatchId] = useState(NORMAL_CATCH_ID);
  const [pointerLocked, setPointerLocked] = useState(() => !!document.pointerLockElement);

  useEffect(() => {
    const onPl = () => setPointerLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', onPl);
    return () => document.removeEventListener('pointerlockchange', onPl);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  /** Stop optagelse hvis free-roam slukkes (undgår “optager” uden kameraopdatering). */
  useEffect(() => {
    if (!freeRoamActive && coordRecordActive) {
      stopCoordRecord();
    }
  }, [freeRoamActive, coordRecordActive, stopCoordRecord]);

  /** Positionsprøve med det samme, derefter hvert 3. sek.; springer over hvis du står næsten stille. */
  useEffect(() => {
    if (!isOpen || !coordRecordActive || !freeRoamActive) return;

    const RECORD_MS = 3000;
    const DEDUP_EPS = 0.12;

    const shouldAppend = (last: AdminCoords | undefined, c: AdminCoords) => {
      if (!last) return true;
      const dx = c.x - last.x;
      const dy = c.y - last.y;
      const dz = c.z - last.z;
      return Math.hypot(dx, dy, dz) >= DEDUP_EPS;
    };

    const tick = () => {
      const c = useAdminStore.getState().coords;
      const { coordRecordSamples } = useAdminStore.getState();
      const last = coordRecordSamples[coordRecordSamples.length - 1];
      if (!shouldAppend(last, c)) return;
      appendCoordRecordSample(c);
    };

    tick();
    const id = window.setInterval(tick, RECORD_MS);
    return () => window.clearInterval(id);
  }, [isOpen, coordRecordActive, freeRoamActive, appendCoordRecordSample]);

  const onLocationChange = useCallback((id: string) => {
    useGameStore.getState().setCurrentLocation(id);
  }, []);

  const onForceCatch = useCallback(() => {
    let result: RollCatchResult;
    if (catchId === NORMAL_CATCH_ID) {
      result = rollNormalCatchLikeGameplay();
    } else {
      const entry = CATCH_MASTER_DATA.find((c) => c.id === catchId);
      if (!entry) return;
      result = buildForcedCatch(entry);
    }
    useGameStore.getState().setGameState('idle');
    useFishingStore.getState().setLastCatch(result);
    useGameStore.getState().setGameState('catch');
  }, [catchId]);

  const onAddLevel = useCallback(() => {
    const { progression: p, setProgression } = usePlayerStore.getState();
    setProgression({ ...p, level: p.level + 1, xp: 0 });
  }, []);

  const onAddCoins = useCallback(() => {
    usePlayerStore.getState().setCoins((c) => c + 1000);
  }, []);

  const onCopyCoords = useCallback(() => {
    const { x, y, z } = coords;
    void navigator.clipboard.writeText(`[${x}, ${y}, ${z}]`);
  }, [coords]);

  const onFreeRoamToggle = useCallback(() => {
    if (fishEditorOpen) return;
    setFreeRoamActive(!freeRoamActive);
  }, [fishEditorOpen, freeRoamActive, setFreeRoamActive]);

  const onGroundLockToggle = useCallback(() => {
    if (fishEditorOpen || !freeRoamActive) return;
    setFreeRoamGroundLock(!freeRoamGroundLock);
  }, [fishEditorOpen, freeRoamActive, freeRoamGroundLock, setFreeRoamGroundLock]);

  const onStartCoordRecord = useCallback(() => {
    if (fishEditorOpen || !freeRoamActive) return;
    startCoordRecord();
  }, [fishEditorOpen, freeRoamActive, startCoordRecord]);

  const onStopCoordRecord = useCallback(() => {
    stopCoordRecord();
  }, [stopCoordRecord]);

  const onCopyRecordedWaypoints = useCallback(() => {
    if (coordRecordSamples.length === 0) return;
    const text = coordRecordSamples
      .map((p) => `  [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}],`)
      .join('\n');
    void navigator.clipboard.writeText(text);
  }, [coordRecordSamples]);

  const onClearCoordSamples = useCallback(() => {
    if (coordRecordActive) return;
    clearCoordRecordSamples();
  }, [coordRecordActive, clearCoordRecordSamples]);

  const catchSelectOptions = useMemo(
    () => [
      { id: NORMAL_CATCH_ID, label: 'Normal fangst (nuværende lokation)' },
      ...CATCH_OPTIONS.map((c) => ({
        id: c.id,
        label: adminForcedCatchOptionLabel(c),
      })),
    ],
    [],
  );

  if (!isOpen) return null;

  return (
    <div
      className="pointer-events-auto fixed top-0 left-0 z-[99998] max-h-[min(100vh,42rem)] w-80 overflow-y-auto bg-black/80 p-4 text-sm text-white shadow-xl backdrop-blur-sm"
      role="dialog"
      aria-label="Admin panel"
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-gray-700 pb-2">
        <span className="font-semibold">🔧 ADMIN PANEL</span>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-500"
          onClick={close}
        >
          ✕ Luk
        </button>
      </div>

      <div className="border-t border-gray-700 pt-2 mt-2">
        <div className="mb-1 text-xs font-medium tracking-wide text-gray-400">LOKATION</div>
        <select
          className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
          value={String(currentLocation)}
          onChange={(e) => onLocationChange(e.target.value)}
        >
          {LOCATION_ENTRIES.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-gray-700 pt-2 mt-2">
        <div className="mb-1 text-xs font-medium tracking-wide text-gray-400">TVUNGEN FANGST</div>
        <select
          className="mb-2 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
          value={catchId}
          onChange={(e) => setCatchId(e.target.value)}
        >
          {catchSelectOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-500"
          onClick={onForceCatch}
        >
          🎣 Fang!
        </button>
      </div>

      <div className="border-t border-gray-700 pt-2 mt-2">
        <div className="mb-1 text-xs font-medium tracking-wide text-gray-400">PROGRESSION</div>
        <p className="mb-2 text-sm">
          Level: {progression.level} &nbsp;|&nbsp; Kroner: {coins.toLocaleString('da-DK')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-500"
            onClick={onAddLevel}
          >
            +1 Level
          </button>
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-500"
            onClick={onAddCoins}
          >
            +1.000 kr
          </button>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-2 mt-2">
        <div className="mb-1 text-xs font-medium tracking-wide text-gray-400">KAMERA</div>
        <label className="mb-2 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-gray-600"
            checked={freeRoamActive}
            disabled={fishEditorOpen}
            onChange={onFreeRoamToggle}
          />
          <span>Free-Roam Kamera</span>
        </label>
        <label className="mb-2 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-gray-600"
            checked={freeRoamGroundLock}
            disabled={fishEditorOpen || !freeRoamActive}
            onChange={onGroundLockToggle}
          />
          <span>Lås til jorden</span>
        </label>
        {freeRoamActive && freeRoamGroundLock && (
          <p className="mb-2 text-xs text-gray-400">
            WASD på vandret plan; Y sættes med raycast (øjenhøjde). Space/Q flyver ikke — bedre til
            waypoint-koordinater tæt på terrain.
          </p>
        )}
        {fishEditorOpen && (
          <p className="mb-2 text-xs text-amber-300">Fish Editor åben — free-roam er slået fra.</p>
        )}
        {freeRoamActive && !pointerLocked && (
          <p className="mb-2 text-xs text-gray-400">Klik på canvas for muselook</p>
        )}
        <p className="mb-2 font-mono text-xs">
          X: {coords.x.toFixed(2)} &nbsp; Y: {coords.y.toFixed(2)} &nbsp; Z: {coords.z.toFixed(2)}
        </p>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-500"
          onClick={onCopyCoords}
        >
          📋 Kopiér koordinater
        </button>

        <div className="mt-3 border-t border-gray-600 pt-2">
          <div className="mb-1 text-xs font-medium tracking-wide text-gray-400">WAYPOINT-OPTAGELSE</div>
          <p className="mb-2 text-xs text-gray-400">
            Gemmer positionsprøver hvert 3. sekund (første med det samme). Ignorerer næsten-identiske punkter
            hvis du står stille — kun cirka koordinater, ingen tidsstempler.
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-emerald-700 px-3 py-1 text-sm font-medium hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={fishEditorOpen || !freeRoamActive || coordRecordActive}
              onClick={onStartCoordRecord}
            >
              Start
            </button>
            <button
              type="button"
              className="rounded bg-rose-800 px-3 py-1 text-sm font-medium hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!coordRecordActive}
              onClick={onStopCoordRecord}
            >
              Stop
            </button>
          </div>
          {coordRecordActive && (
            <p className="mb-2 text-xs text-emerald-300">Optager… {coordRecordSamples.length} punkt(er)</p>
          )}
          {!coordRecordActive && coordRecordSamples.length > 0 && (
            <p className="mb-2 text-xs text-gray-400">{coordRecordSamples.length} punkt(er) klar til kopiering</p>
          )}
          <button
            type="button"
            className="mb-2 rounded bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={coordRecordSamples.length === 0}
            onClick={onCopyRecordedWaypoints}
          >
            📋 Kopiér alle som waypoint-linjer
          </button>
          <button
            type="button"
            className="mb-2 block rounded border border-gray-600 px-3 py-1 text-xs text-gray-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={coordRecordActive || coordRecordSamples.length === 0}
            onClick={onClearCoordSamples}
          >
            Slet optagede punkter
          </button>
        </div>
      </div>

      <p className="mt-3 border-t border-gray-700 pt-2 text-xs text-gray-500">
        Ctrl+Shift+A for at lukke
      </p>
    </div>
  );
}
