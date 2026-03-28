import {
  CanvasTexture,
  RepeatWrapping,
  Vector2,
  LatheGeometry,
} from 'three';
import type { FishModelConfig } from '../../types/fish.js';

export const FROG_COLOR_VARIANTS = [0x4a8a4a, 0x32cd32, 0x6b8e23, 0x228b22, 0x3cb371] as const;

const textureCache = new Map<string, CanvasTexture>();

function drawScaleCanvas(
  color: number,
  isNormalMap: boolean,
  resolution: number,
  quality: 'medium' | 'high'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  if (isNormalMap) {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, resolution, resolution);
  } else {
    ctx.fillStyle = `#${(color >>> 0).toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, resolution, resolution);
  }

  const grad = ctx.createRadialGradient(
    resolution / 2,
    resolution / 2,
    resolution * 0.05,
    resolution / 2,
    resolution / 2,
    resolution * 0.5
  );
  if (isNormalMap) {
    grad.addColorStop(0, 'rgba(128,128,255,0)');
    grad.addColorStop(1, 'rgba(128,128,255,0)');
  } else {
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, resolution, resolution);

  const rows = quality === 'high' ? 10 : 8;
  const cols = quality === 'high' ? 12 : 10;
  const cellW = resolution / cols;
  const cellH = resolution / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = row % 2 === 0 ? 0 : cellW * 0.5;
      const cx = col * cellW + offsetX + cellW * 0.5;
      const cy = row * cellH + cellH * 0.5;
      const r = Math.min(cellW, cellH) * 0.45;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (isNormalMap) {
        const ng = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        ng.addColorStop(0, 'rgba(160,160,255,0.7)');
        ng.addColorStop(0.6, 'rgba(128,128,255,0.3)');
        ng.addColorStop(1, 'rgba(100,100,255,0.1)');
        ctx.fillStyle = ng;
      } else {
        const sg = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
        sg.addColorStop(0, 'rgba(255,255,255,0.18)');
        sg.addColorStop(0.5, 'rgba(255,255,255,0.04)');
        sg.addColorStop(1, 'rgba(0,0,0,0.08)');
        ctx.fillStyle = sg;
      }
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = isNormalMap ? 'rgba(90,90,200,0.25)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  return canvas;
}

export function getScaleTextures(
  color: number,
  quality: 'medium' | 'high' = 'medium'
): { map: CanvasTexture; normalMap: CanvasTexture } {
  const res = quality === 'high' ? 256 : 192;
  const keyDiffuse = `${color}_${quality}_d`;
  const keyNormal = `${color}_${quality}_n`;

  let map = textureCache.get(keyDiffuse);
  if (!map) {
    map = new CanvasTexture(drawScaleCanvas(color, false, res, quality));
    map.wrapS = map.wrapT = RepeatWrapping;
    textureCache.set(keyDiffuse, map);
  }
  let normalMap = textureCache.get(keyNormal);
  if (!normalMap) {
    normalMap = new CanvasTexture(drawScaleCanvas(color, true, res, quality));
    normalMap.wrapS = normalMap.wrapT = RepeatWrapping;
    textureCache.set(keyNormal, normalMap);
  }
  return { map, normalMap };
}

export function createFishLatheGeometry(segments = 32): LatheGeometry {
  const controlX = [0.02, 0.35, 0.65, 0.82, 0.75, 0.5, 0.22, 0.08];
  const controlY = [0.0, 0.12, 0.3, 0.5, 0.65, 0.8, 0.92, 1.0];
  const steps = Math.max(12, segments);
  const profilePoints: Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let x = 0;
    let totalWeight = 0;
    for (let j = 0; j < controlX.length; j++) {
      const dist = Math.abs(t - controlY[j]!);
      const w = Math.max(0, 1 - dist * controlX.length * 0.42);
      const ww = w * w * (3 - 2 * w);
      x += controlX[j]! * ww;
      totalWeight += ww;
    }
    x = totalWeight > 0 ? x / totalWeight : 0.01;
    if (i === 0) x = 0.015;
    if (i === steps) x = 0.01;
    profilePoints.push(new Vector2(x, t * 2.0));
  }
  const geo = new LatheGeometry(profilePoints, segments);
  geo.rotateZ(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Stabil pr. fangst-id (samme som legacy tilfældig frøfarve pr. roll). */
export function resolveBodyColor(
  config: FishModelConfig,
  fishModelId: string,
  rollColor: number,
  instanceId: string
): number {
  if (config.isGoldenFrog) return 0xffd700;
  if (fishModelId === 'fisk_frø' || (config.isFrog && config.color == null)) {
    return FROG_COLOR_VARIANTS[hashString(instanceId) % FROG_COLOR_VARIANTS.length]!;
  }
  if (config.isFrog) {
    const FROG_COLORS = [0x4a8a4a, 0x32cd32, 0x8b4513];
    const idx = fishModelId.length ? fishModelId.charCodeAt(fishModelId.length - 1) % 3 : 0;
    return FROG_COLORS[idx]!;
  }
  if (config.color != null) return config.color;
  return rollColor;
}
