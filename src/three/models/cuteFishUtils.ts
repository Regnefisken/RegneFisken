import { CanvasTexture, RepeatWrapping, Vector3, SphereGeometry } from 'three';
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
  // Diffuse is always white (material.color handles tint) — share one per quality tier.
  const keyDiffuse = `white_${quality}_d`;
  const keyNormal = `${color}_${quality}_n`;

  let map = textureCache.get(keyDiffuse);
  if (!map) {
    map = new CanvasTexture(drawScaleCanvas(0xffffff, false, res, quality));
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
 * Krop bruger `SphereGeometry` — **lige** `segments` for symmetrisk mesh. Klamp 8–32 og ret ulige værdier til nærmeste lige tal.
 */
export const DEFAULT_BODY_SEGMENTS = 16;

/** @deprecated Brug `DEFAULT_BODY_SEGMENTS`. */
export const DEFAULT_BODY_LATHE_SEGMENTS = DEFAULT_BODY_SEGMENTS;

export function normalizeBodySegments(raw: number | undefined): number {
  const d = raw ?? DEFAULT_BODY_SEGMENTS;
  const c = Math.max(8, Math.min(32, Math.round(d)));
  const even = Math.round(c / 2) * 2;
  return Math.max(8, Math.min(32, even));
}

/** @deprecated Brug `normalizeBodySegments`. */
export const normalizeBodyLatheSegments = normalizeBodySegments;

/** Enhedskugle som i electric monster generator; `hSegs = segments/2` som legacy lav kvalitet. */
export function createFishBodyGeometry(segments = 16): SphereGeometry {
  const hSegs = Math.max(8, segments >> 1);
  const geo = new SphereGeometry(1, segments, hSegs);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Punkt hvor en stråle fra origo i retning `dir` møder krops-ellipsoiden
 * (samme semi-akser som mesh: [sz, sy, sx] · 0.7 · puff).
 */
export function fishBodyEllipsoidSurface(
  sx: number,
  sy: number,
  sz: number,
  puffScale: number,
  dirX: number,
  dirY: number,
  dirZ: number
): [number, number, number] {
  const ax = sz * 0.7 * puffScale;
  const ay = sy * 0.7 * puffScale;
  const az = sx * 0.7 * puffScale;
  const len = Math.hypot(dirX, dirY, dirZ) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const uz = dirZ / len;
  const inv = 1 / Math.sqrt((ux / ax) ** 2 + (uy / ay) ** 2 + (uz / az) ** 2);
  return [ux * inv, uy * inv, uz * inv];
}

/** Udadgående normal på ellipsoiden i punktet p (til pupil på sclera). */
export function fishBodyEllipsoidOutwardNormal(
  sx: number,
  sy: number,
  sz: number,
  puffScale: number,
  px: number,
  py: number,
  pz: number
): Vector3 {
  const ax = sz * 0.7 * puffScale;
  const ay = sy * 0.7 * puffScale;
  const az = sx * 0.7 * puffScale;
  return new Vector3(px / (ax * ax), py / (ay * ay), pz / (az * az)).normalize();
}

const _vDef = new Vector3();
const _vDirRef = new Vector3();

/** Samme `deformBodyGeometry` som electric monster generator (Z = længdeakse på enhedskuglen). */
function applyReferenceMonsterBodyDeform(v: Vector3, shapeType: FishBodyProfile): void {
  if (shapeType === 'standard') return;
  if (shapeType === 'tapered') {
    const taper = 0.65 + (v.z + 1) * 0.45;
    v.x *= taper;
    v.y *= taper * 0.92;
  } else if (shapeType === 'flatBelly') {
    if (v.y < 0) {
      v.y = v.y * 0.45 + 0.12;
    }
  } else if (shapeType === 'tadpole') {
    const head = Math.pow(Math.max(0, (v.z + 0.6) / 1.6), 1.8);
    v.x *= 0.75 + head * 1.15;
    v.y *= 0.68 + head * 1.45;
  } else if (shapeType === 'boxfish') {
    const power = 4.0;
    const nx = Math.sign(v.x) * Math.pow(Math.abs(v.x), 1.0 / power);
    const ny = Math.sign(v.y) * Math.pow(Math.abs(v.y), 1.0 / power);
    const nz = Math.sign(v.z) * Math.pow(Math.abs(v.z), 1.0 / power);
    v.x = nx * 0.85;
    v.y = ny * 0.85;
    v.z = nz;
  } else if (shapeType === 'ray') {
    v.y *= 0.25;
    const wingSpread = 1.0 - Math.abs(v.z);
    v.x *= 1.0 + Math.max(0, wingSpread) * 1.8;
  }
}

/**
 * Deformerer krop på enhedskugle, derefter `rotateY(π/2)` så længdeakse matcher spillet (X = snude→hale).
 */
export function deformFishBody(geometry: SphereGeometry, shapeType: FishBodyProfile): void {
  if (shapeType !== 'standard') {
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      _vDef.fromBufferAttribute(position, i);
      applyReferenceMonsterBodyDeform(_vDef, shapeType);
      position.setXYZ(i, _vDef.x, _vDef.y, _vDef.z);
    }
    position.needsUpdate = true;
  }
  geometry.computeVertexNormals();
  geometry.rotateY(Math.PI / 2);
  geometry.computeVertexNormals();
}

/** @deprecated Brug `deformFishBody`. */
export const deformFishLatheBody = deformFishBody;

/**
 * Enhedsretning i mesh-rum (X = længde efter `deformFishBody`); mapper til reference-akser, deformerer, tilbage.
 */
export function deformUnitFishBodyDirection(v: Vector3, shapeType: FishBodyProfile): void {
  if (shapeType === 'standard') return;
  _vDirRef.set(-v.z, v.y, v.x);
  applyReferenceMonsterBodyDeform(_vDirRef, shapeType);
  v.set(_vDirRef.z, _vDirRef.y, -_vDirRef.x);
  v.normalize();
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
