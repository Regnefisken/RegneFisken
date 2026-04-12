import type { GraphicsQuality } from '../types/game.js';
import { fpsMon } from './fps-monitor.js';
import { useUIStore } from '../store/useUIStore.js';

const QUALITY_ORDER: GraphicsQuality[] = ['low', 'medium', 'high', 'ultra'];

const CHECK_INTERVAL_SEC = 5;
const DOWNGRADE_COOLDOWN_MS = 30_000;

let lastCheckAt = 0;
let lastDowngradeAt = 0;

function downgradeOne(q: GraphicsQuality): GraphicsQuality {
  const i = QUALITY_ORDER.indexOf(q);
  if (i <= 0) return 'low';
  return QUALITY_ORDER[i - 1]!;
}

/**
 * Kald ca. hvert frame med `elapsedSec` fra R3F — tjekker ydelse med fast interval.
 */
export function tickDynamicQuality(elapsedSec: number): void {
  if (elapsedSec - lastCheckAt < CHECK_INTERVAL_SEC) return;
  lastCheckAt = elapsedSec;

  const s = useUIStore.getState();
  if (!s.autoQualityEnabled) return;
  if (!fpsMon.isUnderPerforming()) return;
  if (s.graphicsQuality === 'low') return;

  const now = performance.now();
  if (now - lastDowngradeAt < DOWNGRADE_COOLDOWN_MS) return;

  lastDowngradeAt = now;
  const next = downgradeOne(s.graphicsQuality);
  if (next === s.graphicsQuality) return;

  s.setGraphicsQuality(next);
  s.setToastMessage('Grafik sænket for bedre ydelse');
}
