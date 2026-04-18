import { ENRICHED_CATCH_DATA } from '../data/enrichment.js';
import type { EnrichedCatchEntry, RollCatchResult } from '../types/fish.js';

/** Absolut gulv for display-scale (relativt gulv `baseScale * 0.58` bevares også). */
export const MIN_DISPLAY_SCALE = 0.65;

/**
 * Flaskepost: uden clamp varierer display-scale stærkt med vægt (typ. ~0,58–1,75).
 * Strammer intervallet så flasken sjældent føles for lille eller for dominerende.
 */
const FLASKEPOST_DISPLAY_SCALE_MIN = 0.76;
const FLASKEPOST_DISPLAY_SCALE_MAX = 1.18;

/** Falmet Søkort (`junk_vandkort`): kun fangst-display via `FishPool` / `displayScaleForCatch`. */
const JUNK_VANDKORT_CATCH_DISPLAY_SCALE = 2;

/** Flagermus-knogle (`junk_flagermus_knogle`): samme princip. */
const JUNK_FLAGERMUS_KNOGLE_CATCH_DISPLAY_SCALE = 1.5;

/** Flosset Reb (`junk_frossent_tov`, visual `frossent_tov`): samme princip. */
const JUNK_FROSSENT_TOV_CATCH_DISPLAY_SCALE = 1.7;

/** Gammel Fakkel (`junk_gammel_fakkel`): samme princip. */
const JUNK_GAMMEL_FAKKEL_CATCH_DISPLAY_SCALE = 2;

/** Piratflagstump (`junk_piratflag`, visual `piratflag`): samme princip. */
const JUNK_PIRATFLAG_CATCH_DISPLAY_SCALE = 2;

/** Rusten Dykkermaske (`junk_dykkermaske`, visual `dykkermaske`): samme princip. */
const JUNK_DYKKERMASKE_CATCH_DISPLAY_SCALE = 2;

/** Rustent Cykelhjul (`junk_cykelhjul`, visual `wheel`): samme princip. */
const JUNK_CYKELHJUL_CATCH_DISPLAY_SCALE = 1.6;

/** Rustent Sværd (`junk_rustent_sværd`, visual `rustent_sværd`): samme princip. */
const JUNK_RUSTENT_SVAERD_CATCH_DISPLAY_SCALE = 1.15;

/** Solbrillestel (`junk_solbrille`, visual `solbrille`): samme princip. */
const JUNK_SOLBRILLE_CATCH_DISPLAY_SCALE = 1.2;

/** Ødelagt Ispilk (`junk_ispilk`, visual `ispilk`): samme princip. */
const JUNK_ISPILK_CATCH_DISPLAY_SCALE = 2;

/** Ødelagt Undervandskamera (`junk_undervandskamera`, visual `undervandskamera`): samme princip. */
const JUNK_UNDERVANDSKAMERA_CATCH_DISPLAY_SCALE = 2;

/** Lille Sardin (`sardine`): +200% fangst-display = ×3. */
const SARDINE_CATCH_DISPLAY_SCALE = 3;

/**
 * Ur-Krystal (`ur_krystal`, `itemType: 'crystal_junk'`): `model: null` — bruger ikke
 * `calculateDisplayScale`; +100% fangst-display = ×2 på legacy-`baseScale`-faldet.
 */
const CRYSTAL_JUNK_CATCH_DISPLAY_SCALE = 2;

/** Skal matche `PlesiosaurusCatchModel` root `<group scale={…}>` — legacy satte én root-scale, vi har indre × ydre. */
const PLESIO_HOOKED_INNER_SCALE = 0.055;

/** Legacy `calculateDisplayScale` — fangst-størrelse fra vægt + model/rarity. */
export function calculateDisplayScale(
  entry: EnrichedCatchEntry | null | undefined,
  actualWeight: number,
): number {
  if (!entry?.model) return 1.0;

  const baseScale = entry.model.scale ?? 1.0;
  const avgWeight = (entry.baseWeightMin + entry.baseWeightMax) / 2 || 10;

  let ratio = actualWeight / avgWeight;

  const curve =
    entry.model.scaleCurve ??
    (entry.isTrueBoss ||
    entry.rarity === 'Legendarisk' ||
    entry.rarity === 'Forhistorisk'
      ? 0.58
      : 0.82);
  ratio = Math.pow(ratio, curve);

  let scale = baseScale * ratio;

  let maxScale = entry.model.maxDisplayScale;
  if (maxScale === undefined) {
    maxScale =
      (
        {
          Almindelig: 2.15,
          Sjælden: 2.55,
          Legendarisk: 2.95,
          Boss: 5.15,
          Forhistorisk: 3.45,
          Mystisk: 2.75,
        } as Record<string, number>
      )[entry.rarity] ?? 2.85;
  }

  scale = Math.min(scale, maxScale);
  scale = Math.max(scale, baseScale * 0.58);
  scale = Math.max(scale, MIN_DISPLAY_SCALE);

  if (entry.id === 'flaskepost') {
    scale = Math.min(
      Math.max(scale, FLASKEPOST_DISPLAY_SCALE_MIN),
      FLASKEPOST_DISPLAY_SCALE_MAX,
    );
  }

  if (entry.id === 'junk_vandkort') {
    scale *= JUNK_VANDKORT_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_flagermus_knogle') {
    scale *= JUNK_FLAGERMUS_KNOGLE_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_frossent_tov') {
    scale *= JUNK_FROSSENT_TOV_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_gammel_fakkel') {
    scale *= JUNK_GAMMEL_FAKKEL_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_piratflag') {
    scale *= JUNK_PIRATFLAG_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_dykkermaske') {
    scale *= JUNK_DYKKERMASKE_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_cykelhjul') {
    scale *= JUNK_CYKELHJUL_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_rustent_sværd') {
    scale *= JUNK_RUSTENT_SVAERD_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_solbrille') {
    scale *= JUNK_SOLBRILLE_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_ispilk') {
    scale *= JUNK_ISPILK_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'junk_undervandskamera') {
    scale *= JUNK_UNDERVANDSKAMERA_CATCH_DISPLAY_SCALE;
  }

  if (entry.id === 'sardine') {
    scale *= SARDINE_CATCH_DISPLAY_SCALE;
  }

  return scale;
}

export function getEnrichedEntry(id: string | undefined): EnrichedCatchEntry | null {
  if (!id) return null;
  return ENRICHED_CATCH_DATA.find((e) => e.id === id) ?? null;
}

/**
 * Skala til display (krog/fangst) — enriched entry + `calculateDisplayScale`,
 * ellers legacy fallback fra `createCatchModel`.
 *
 * Plesiosaurus: legacy `createCatchModel` satte root-scale til `calculateDisplayScale` (erstattede indre 0.055).
 * React beholder indre 0.055 i `PlesiosaurusCatchModel`, så ydre skala = legacyRoot / 0.055.
 */
export function displayScaleForCatch(fish: RollCatchResult): number {
  if (fish.itemType === 'treasure' && fish.visualScale != null) {
    return fish.visualScale;
  }

  if (fish.itemType === 'plesiosaur') {
    const entry =
      getEnrichedEntry(fish.fishModelId) ?? getEnrichedEntry('fisk_plesiosaurus');
    if (entry?.model) {
      const legacyRootScale = calculateDisplayScale(entry, fish.weight);
      return legacyRootScale / PLESIO_HOOKED_INNER_SCALE;
    }
    const baseScale = Math.min(0.5 + fish.weight / 30, 2.85);
    return (baseScale * 0.5) / PLESIO_HOOKED_INNER_SCALE;
  }

  const caughtEntry = getEnrichedEntry(fish.fishModelId);
  if (caughtEntry?.model) {
    /* Én konsistent størrelse efter fangst — undgår "lille" model ved lav vægt + matcher ét legacy-display. */
    if (fish.itemType === 'axolotl') {
      const mid = (caughtEntry.baseWeightMin + caughtEntry.baseWeightMax) / 2;
      return calculateDisplayScale(caughtEntry, mid);
    }
    return calculateDisplayScale(caughtEntry, fish.weight);
  }
  const baseScale = Math.min(0.5 + fish.weight / 30, 2.85);
  if (fish.itemType === 'crystal_junk') {
    return baseScale * CRYSTAL_JUNK_CATCH_DISPLAY_SCALE;
  }
  return baseScale;
}
