/**
 * Fiskekonkurrence (session): samme varighed i Mål-kort, matematik-indstillinger og in-game HUD.
 */
export const FISHING_COMPETITION_DURATION_MS = 15 * 60 * 1000;

/** Før start og efter nulstil — hele minutter, matcher FISHING_COMPETITION_DURATION_MS. */
export const FISHING_COMPETITION_IDLE_TIME_LABEL = `${FISHING_COMPETITION_DURATION_MS / 60000}:00`;
