/**
 * Fiskekonkurrence (session): samme varighed i Mål-kort, matematik-indstillinger og in-game HUD.
 */
export const FISHING_COMPETITION_DURATION_MS = 15 * 60 * 1000;

/** Før start og efter nulstil — hele minutter, matcher FISHING_COMPETITION_DURATION_MS. */
export const FISHING_COMPETITION_IDLE_TIME_LABEL = `${FISHING_COMPETITION_DURATION_MS / 60000}:00`;

/**
 * Resterende tid i en konkurrence startet `startedAt` (ms), set fra `now` (ms).
 * `label` er "m:ss" rundet ned til hele sekunder; `remainingMs` er aldrig negativ.
 * Fælles for Mål-kortet og HUD'en, så de altid viser det samme.
 */
export function competitionTimeLeft(startedAt: number, now: number): { remainingMs: number; label: string } {
  const remainingMs = Math.max(0, FISHING_COMPETITION_DURATION_MS - (now - startedAt));
  const min = Math.floor(remainingMs / 60000);
  const sec = Math.floor((remainingMs % 60000) / 1000);
  return { remainingMs, label: `${min}:${sec.toString().padStart(2, '0')}` };
}
