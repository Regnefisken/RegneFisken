import type { GraphicsConfigMap } from '../types/game.js';

export const GRAPHICS_CONFIG = {
  low: { segments: 10, texSize: 0, material: 'Standard' as const, clearcoat: 0, shimmer: 0 },
  medium: { segments: 16, texSize: 256, material: 'Physical' as const, clearcoat: 0.5, shimmer: 0 },
  high: { segments: 32, texSize: 512, material: 'Physical' as const, clearcoat: 0.8, shimmer: 0 },
  ultra: { segments: 48, texSize: 512, material: 'Physical' as const, clearcoat: 1.0, shimmer: 0.6 },
} as const satisfies GraphicsConfigMap;
