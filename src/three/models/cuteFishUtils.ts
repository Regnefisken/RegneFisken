import {
  CanvasTexture,
  RepeatWrapping,
  Vector2,
  Vector3,
  LatheGeometry,
} from 'three';
import type { FishBodyProfile, FishModelConfig } from '../../types/fish.js';

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
  const res = quality === 'high' ? 512 : 256;
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

/**
 * Lathe om Y kræver **lige** `segments` for symmetrisk mesh. Klamp 6–32 og ret ulige værdier til nærmeste lige tal.
 */
/** Legacy medium quality bruger 16 segmenter — default matcher dette for korrekt visual. */
export const DEFAULT_BODY_LATHE_SEGMENTS = 16;

export function normalizeBodyLatheSegments(raw: number | undefined): number {
  const d = raw ?? DEFAULT_BODY_LATHE_SEGMENTS;
  const c = Math.max(6, Math.min(32, Math.round(d)));
  const even = Math.round(c / 2) * 2;
  return Math.max(6, Math.min(32, even));
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

const _vDef = new Vector3();

/**
 * Deformerer lathe-krop langs X (snude→hale). Matcher `deformBodyGeometry` i electric monster generator.
 */
export function deformFishLatheBody(geometry: LatheGeometry, shapeType: FishBodyProfile): void {
  if (shapeType === 'standard') return;
  const position = geometry.attributes.position;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < position.count; i++) {
    _vDef.fromBufferAttribute(position, i);
    minX = Math.min(minX, _vDef.x);
    maxX = Math.max(maxX, _vDef.x);
  }
  const range = Math.max(1e-6, maxX - minX);

  for (let i = 0; i < position.count; i++) {
    _vDef.fromBufferAttribute(position, i);
    const longNorm = ((_vDef.x - minX) / range) * 2 - 1;

    if (shapeType === 'tapered') {
      const taper = 0.65 + (longNorm + 1) * 0.45;
      _vDef.y *= taper * 0.92;
      _vDef.z *= taper;
    } else if (shapeType === 'flatBelly') {
      if (_vDef.y < 0) {
        _vDef.y = _vDef.y * 0.45 + 0.12;
      }
    } else if (shapeType === 'tadpole') {
      const head = Math.pow(Math.max(0, (longNorm + 0.6) / 1.6), 1.8);
      _vDef.y *= 0.68 + head * 1.45;
      _vDef.z *= 0.75 + head * 1.15;
    } else if (shapeType === 'boxfish') {
      const power = 4.0;
      const nx = Math.sign(_vDef.x) * Math.pow(Math.abs(_vDef.x), 1.0 / power);
      const ny = Math.sign(_vDef.y) * Math.pow(Math.abs(_vDef.y), 1.0 / power);
      const nz = Math.sign(_vDef.z) * Math.pow(Math.abs(_vDef.z), 1.0 / power);
      _vDef.x = nx * 0.85;
      _vDef.y = ny * 0.85;
      _vDef.z = nz;
    } else if (shapeType === 'ray') {
      _vDef.y *= 0.25;
      const wingSpread = 1.0 - Math.abs(longNorm);
      _vDef.z *= 1.0 + Math.max(0, wingSpread) * 1.8;
    }

    position.setXYZ(i, _vDef.x, _vDef.y, _vDef.z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

/**
 * Enhedsretning på krop (X = længde, Y = op, Z = side) — samme logik som kugle-pigge i reference-HTML.
 */
export function deformUnitFishBodyDirection(v: Vector3, shapeType: FishBodyProfile): void {
  if (shapeType === 'standard') return;
  const longNorm = v.x;

  if (shapeType === 'tapered') {
    const taper = 0.65 + (longNorm + 1) * 0.45;
    v.y *= taper * 0.92;
    v.z *= taper;
  } else if (shapeType === 'flatBelly') {
    if (v.y < 0) {
      v.y = v.y * 0.45 + 0.12;
    }
  } else if (shapeType === 'tadpole') {
    const head = Math.pow(Math.max(0, (longNorm + 0.6) / 1.6), 1.8);
    v.y *= 0.68 + head * 1.45;
    v.z *= 0.75 + head * 1.15;
  } else if (shapeType === 'boxfish') {
    const power = 4.0;
    v.x = Math.sign(v.x) * Math.pow(Math.abs(v.x), 1.0 / power) * 0.85;
    v.y = Math.sign(v.y) * Math.pow(Math.abs(v.y), 1.0 / power) * 0.85;
    v.z = Math.sign(v.z) * Math.pow(Math.abs(v.z), 1.0 / power) * 0.85;
  } else if (shapeType === 'ray') {
    v.y *= 0.25;
    const wingSpread = 1.0 - Math.abs(longNorm);
    v.z *= 1.0 + Math.max(0, wingSpread) * 1.8;
  }
}

/** Justerer øje-/overfladepositioner så de følger kropsprofilen (samme princip som reference-HTML). */
export function applyBodyProfileToEyePosition(
  shapeType: FishBodyProfile,
  sx: number,
  sy: number,
  sz: number,
  ex: number,
  ey: number,
  ez: number,
  puffScale: number
): [number, number, number] {
  if (shapeType === 'standard') return [ex, ey, ez];
  const longNorm = Math.max(-1, Math.min(1, ex / (sz * 0.7 * puffScale) - 1));
  let x = ex;
  let y = ey;
  let z = ez;

  if (shapeType === 'tapered') {
    const taper = 0.65 + (longNorm + 1) * 0.45;
    y *= taper * 0.92;
    z *= taper;
  } else if (shapeType === 'flatBelly') {
    if (y < 0) y = y * 0.45 + 0.12 * sy;
  } else if (shapeType === 'tadpole') {
    const head = Math.pow(Math.max(0, (longNorm + 0.6) / 1.6), 1.8);
    y *= 0.68 + head * 1.45;
    z *= 0.75 + head * 1.15;
  } else if (shapeType === 'boxfish') {
    const power = 4.0;
    x = Math.sign(x) * Math.pow(Math.abs(x), 1.0 / power) * 0.85;
    y = Math.sign(y) * Math.pow(Math.abs(y), 1.0 / power) * 0.85;
    z = Math.sign(z) * Math.pow(Math.abs(z), 1.0 / power) * 0.85;
  } else if (shapeType === 'ray') {
    y *= 0.25;
    const wingSpread = 1.0 - Math.abs(longNorm);
    z *= 1.0 + Math.max(0, wingSpread) * 1.8;
  }

  return [x, y, z];
}

/** Bughfinner Y relativt til `-sy * 0.42` (reference: getPelvicY vs. standard -0.55). */
export function pelvicFinYFactor(profile: FishBodyProfile | undefined): number {
  switch (profile) {
    case 'flatBelly':
      return 0.32 / 0.55;
    case 'tapered':
      return 0.62 / 0.55;
    case 'tadpole':
      return 0.5 / 0.55;
    case 'boxfish':
      return 0.42 / 0.55;
    case 'ray':
      return 0.12 / 0.55;
    default:
      return 1;
  }
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
