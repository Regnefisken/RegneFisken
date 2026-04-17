/**
 * Bestemmer om spillet skal bruge kompakt «lille skærm»-layout (mobil-UI + tastatur osv.).
 * Bruges ved spilstart og til forhåndsvisning før start — én kilde til sandhed.
 *
 * Politik: hellere for mange end for få (især skole-Chromebooks og telefoner).
 * Rækkefølge: Client Hints (`userAgentData`) hvor Chromium stiller dem til rådighed, derefter
 * klassisk UA + iPadOS-touch-heuristik, til sidst viewport-bredde som net.
 * Ekstern skærm på CrOS kan give mobil-UI selv ved stor bredde; sjældent problem ift. klasseværelse.
 */

function compactFromUserAgentData(): boolean | null {
  const uad = (navigator as Navigator & { userAgentData?: { mobile?: boolean; platform?: string } })
    .userAgentData;
  if (!uad || typeof uad !== 'object') return null;

  if (uad.mobile === true) return true;

  const p = typeof uad.platform === 'string' ? uad.platform.toLowerCase() : '';
  if (p.includes('android')) return true;
  if (p.includes('ios')) return true;
  if (p.includes('chrome os')) return true;

  return null;
}

export function shouldUseCompactMobileLayout(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const fromCh = compactFromUserAgentData();
  if (fromCh === true) return true;

  const ua = navigator.userAgent;

  if (/CrOS/i.test(ua)) return true;
  if (/Android/i.test(ua)) return true;
  if (/iPhone|iPod/i.test(ua)) return true;

  if (navigator.platform === 'iPad') return true;

  const maxTouch = typeof navigator.maxTouchPoints === 'number' ? navigator.maxTouchPoints : 0;
  if (/iPad/i.test(ua)) return true;
  /** iPadOS 13+ (Safari kan rapportere som Mac); >2 som i `auto-detect-graphics` for at undgå trackpad-/edge cases. */
  if (/Macintosh/i.test(ua) && maxTouch > 2) return true;

  return window.innerWidth <= 1366;
}
