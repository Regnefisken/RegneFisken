/**
 * Fælles layout for bund-forankrede fangst-/resultat-paneler.
 * Bruges i CatchResult og kan genbruges andre steder, så paneler ikke sidder i skærmbunden.
 */

/** Bund-padding: min. luft + safe area + lidt viewport-højde (typisk mobil). */
export const CATCH_OVERLAY_BOTTOM_PAD =
  'pb-[max(3.25rem,calc(1.35rem+env(safe-area-inset-bottom)),min(15vh,5.5rem))]';

/** Fuld skærm-overlay: panel i bunden med ens luft under (alle fangsttyper). */
export const CATCH_OVERLAY_SHELL = `pointer-events-none fixed inset-0 z-[10031] flex flex-col items-center justify-end px-4 pt-4 ${CATCH_OVERLAY_BOTTOM_PAD}`;
