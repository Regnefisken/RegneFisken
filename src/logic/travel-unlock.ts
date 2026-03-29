import { ARCTIC_SET, DESERT_SET } from '../data/progression.js';
import { AREAS, getLocation } from '../data/locations.js';
import type { LocationConfig } from '../types/game.js';

/** Matcher legacy `getUnlockedAreas`. */
export function getUnlockedAreas(
  level: number,
  upgrades: string[],
  questItems: string[],
): LocationConfig[] {
  return AREAS.filter((loc) => {
    if (level < loc.unlockLevel) return false;
    if (loc.requiresItem === null) return true;
    if (loc.requiresItem === 'desert_set')
      return DESERT_SET.every((id) => upgrades.includes(id));
    if (loc.requiresItem === 'arctic_set')
      return ARCTIC_SET.every((id) => upgrades.includes(id));
    if (loc.id === 'fishing_cabin')
      return upgrades.includes('magnet') && questItems.includes('cabin_key');
    if (loc.id === 'tropical_island') return upgrades.includes('rowboat');
    if (loc.id === 'cave')
      return upgrades.includes('rowboat') && upgrades.includes('headlamp');
    if (loc.id === 'jungle_island') return questItems.includes('jungle_discovered');
    /** Komplet skattekort: venstre halvdel (flaskepost) + højre (butik), som legacy. */
    if (loc.id === 'forbidden') {
      const hasLeft = questItems.includes('map_left');
      const hasRight =
        questItems.includes('map_right') ||
        (loc.requiresItem != null && upgrades.includes(loc.requiresItem));
      return hasLeft && hasRight;
    }
    if (loc.requiresQuestItem) return questItems.includes(loc.requiresQuestItem);
    return upgrades.includes(loc.requiresItem);
  });
}

export function isAreaUnlocked(
  area: LocationConfig,
  level: number,
  upgrades: string[],
  questItems: string[],
): boolean {
  return getUnlockedAreas(level, upgrades, questItems).some((a) => a.id === area.id);
}

export function canOpenTravelMenu(
  level: number,
  upgrades: string[],
  questItems: string[],
): boolean {
  return getUnlockedAreas(level, upgrades, questItems).length > 1;
}

/** Rejsekrav (Rejsekort) — samme som legacy `travelTo`. */
export function destinationAllowsTravel(
  areaId: string,
  upgrades: string[],
): { ok: true } | { ok: false; message: string } {
  const dest = getLocation(areaId);
  if (dest.travelRequires && !upgrades.includes(dest.travelRequires)) {
    return { ok: false, message: 'Du mangler Rejsekortet! Køb det i butikken.' };
  }
  return { ok: true };
}
