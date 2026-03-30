import { CanvasTexture, NoColorSpace, RepeatWrapping } from 'three';
import type { BodyPattern, ColorGradientStops } from '../../types/fish.js';

const bodyDiffuseTextureCache = new Map<string, CanvasTexture>();

function hexCss(n: number): string {
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fillFishBase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bodyColor: number
): void {
  ctx.fillStyle = hexCss(bodyColor);
  ctx.fillRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.05, w * 0.5, h * 0.5, w * 0.5);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function applySubtleDepthOverlay(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.05, w * 0.5, h * 0.5, w * 0.5);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function fillRainbowBackToBelly(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ff0000');
  g.addColorStop(0.16, '#ff7f00');
  g.addColorStop(0.33, '#ffff00');
  g.addColorStop(0.5, '#00ff00');
  g.addColorStop(0.66, '#0000ff');
  g.addColorStop(0.83, '#4b0082');
  g.addColorStop(1, '#9400d3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  applySubtleDepthOverlay(ctx, w, h);
}

function fillFourStopBackToBelly(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stops: ColorGradientStops
): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, hexCss(stops.back));
  g.addColorStop(0.33, hexCss(stops.mid1));
  g.addColorStop(0.66, hexCss(stops.mid2));
  g.addColorStop(1, hexCss(stops.belly));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  applySubtleDepthOverlay(ctx, w, h);
}

export interface GenerateBodyDiffuseMapParams {
  bodyColor: number;
  bodyPattern?: BodyPattern;
  patternColor?: number;
  patternDensity?: number;
  colorGradient?: ColorGradientStops;
  useRainbow?: boolean;
  width: number;
  height: number;
}

/**
 * Krops-diffuse-map: skæl-base, mønster, fire-stop gradient eller regnbue — kombineres efter behov.
 */
export function generateBodyDiffuseMap(params: GenerateBodyDiffuseMapParams): CanvasTexture {
  const {
    bodyColor,
    bodyPattern = 'solid',
    patternColor = 0x202020,
    patternDensity = 1,
    colorGradient,
    useRainbow,
    width: w,
    height: h,
  } = params;

  const key = JSON.stringify({
    bodyColor,
    bodyPattern,
    patternColor,
    patternDensity,
    cg: colorGradient ?? null,
    useRainbow: !!useRainbow,
    w,
    h,
  });
  const cached = bodyDiffuseTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const t = new CanvasTexture(canvas);
    t.wrapS = t.wrapT = RepeatWrapping;
    bodyDiffuseTextureCache.set(key, t);
    return t;
  }

  if (useRainbow) {
    fillRainbowBackToBelly(ctx, w, h);
  } else if (colorGradient) {
    fillFourStopBackToBelly(ctx, w, h, colorGradient);
  } else {
    fillFishBase(ctx, w, h, bodyColor);
  }

  if (bodyPattern !== 'solid') {
    drawPatternLayer(ctx, w, h, bodyPattern, patternColor, patternDensity, bodyColor);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.needsUpdate = true;
  bodyDiffuseTextureCache.set(key, tex);
  return tex;
}

function drawPatternLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pattern: BodyPattern,
  patternColor: number,
  density: number,
  bodyColor: number
): void {
  const pc = hexCss(patternColor);
  const rng = mulberry32((bodyColor * 31) ^ (patternColor * 17) ^ (density * 1000) >>> 0);
  const d = Math.max(0.3, Math.min(4, density));
  const freq = d;

  ctx.save();
  ctx.strokeStyle = pc;
  ctx.fillStyle = pc;
  ctx.globalAlpha = 0.85;

  switch (pattern) {
    case 'solid':
      break;
    case 'stripes': {
      const count = Math.max(4, Math.floor(10 * freq));
      const step = w / count;
      ctx.lineWidth = Math.max(1, step * 0.35);
      ctx.globalAlpha = 0.75;
      for (let x = -step; x < w + step; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      break;
    }
    case 'hstripes': {
      const count = Math.max(4, Math.floor(10 * freq));
      const step = h / count;
      ctx.lineWidth = Math.max(1, step * 0.35);
      ctx.globalAlpha = 0.75;
      for (let y = -step; y < h + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      break;
    }
    case 'waves': {
      const rows = Math.max(5, Math.floor(8 * freq));
      const amp = (h / rows) * 0.25;
      const waveLen = w / (2 + freq);
      ctx.lineWidth = Math.max(1.2, amp * 0.5);
      ctx.globalAlpha = 0.7;
      for (let r = 0; r < rows; r++) {
        const y0 = (r + 0.5) * (h / rows);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const yy = y0 + Math.sin((x / waveLen) * Math.PI * 2 + r) * amp;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      break;
    }
    case 'spots': {
      const n = Math.floor(35 + 40 * freq);
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < n; i++) {
        const cx = rng() * w;
        const cy = rng() * h;
        const rr = (0.015 + rng() * 0.04) * Math.min(w, h);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'koi': {
      const patches = Math.max(3, Math.floor(4 + 2 * freq));
      for (let i = 0; i < patches; i++) {
        const cx = rng() * w * 0.9 + w * 0.05;
        const cy = rng() * h * 0.9 + h * 0.05;
        const rr = (0.12 + rng() * 0.12) * Math.min(w, h);
        const g = ctx.createRadialGradient(cx - rr * 0.25, cy - rr * 0.25, 0, cx, cy, rr);
        g.addColorStop(0, pc);
        g.addColorStop(0.65, pc);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.45 + rng() * 0.35;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.85;
      break;
    }
    case 'trout': {
      const n = Math.floor(80 + 120 * freq);
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < n; i++) {
        const cx = rng() * w;
        const cy = rng() * h;
        const rr = (0.004 + rng() * 0.012) * Math.min(w, h);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'scales': {
      const rows = Math.max(6, Math.floor(8 * freq));
      const cols = Math.max(8, Math.floor(10 * freq));
      const cellW = w / cols;
      const cellH = h / rows;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.55;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ox = row % 2 === 0 ? 0 : cellW * 0.5;
          const cx = col * cellW + ox + cellW * 0.5;
          const cy = row * cellH + cellH * 0.5;
          const r = Math.min(cellW, cellH) * 0.42;
          ctx.beginPath();
          ctx.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 0.85);
          ctx.stroke();
        }
      }
      break;
    }
    case 'marble': {
      const blobs = Math.max(4, Math.floor(5 + 3 * freq));
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < blobs; i++) {
        const cx = rng() * w;
        const cy = rng() * h;
        const rr = (0.08 + rng() * 0.15) * Math.min(w, h);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        const mix = rng() > 0.5 ? pc : hexCss(bodyColor);
        g.addColorStop(0, mix);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.85;
      break;
    }
    case 'labyrinth': {
      const segments = Math.max(12, Math.floor(18 * freq));
      ctx.lineWidth = Math.max(1.5, 2.2 / Math.sqrt(freq));
      ctx.globalAlpha = 0.65;
      ctx.lineJoin = 'round';
      let x = rng() * w;
      let y = rng() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 0; i < segments; i++) {
        const nx = rng() * w;
        const ny = rng() * h;
        const c1x = x + (rng() - 0.5) * w * 0.4;
        const c1y = y + (rng() - 0.5) * h * 0.4;
        ctx.quadraticCurveTo(c1x, c1y, nx, ny);
        x = nx;
        y = ny;
      }
      ctx.stroke();
      break;
    }
    case 'leopard': {
      const n = Math.max(8, Math.floor(12 + 8 * freq));
      ctx.lineWidth = Math.max(2, 3 / Math.sqrt(freq));
      ctx.strokeStyle = pc;
      for (let i = 0; i < n; i++) {
        const cx = rng() * w * 0.85 + w * 0.075;
        const cy = rng() * h * 0.85 + h * 0.075;
        const rr = (0.02 + rng() * 0.04) * Math.min(w, h);
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = hexCss(bodyColor);
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(cx, cy, rr * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.85;
      break;
    }
    case 'net': {
      const step = Math.max(10, 28 / freq);
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.55;
      for (let x = -h; x < w + h; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }
      for (let x = -h; x < w + h; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + h, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      break;
    }
    case 'neon': {
      ctx.shadowColor = pc;
      ctx.shadowBlur = 12 / Math.sqrt(freq);
      ctx.lineWidth = Math.max(2.5, 4 / Math.sqrt(freq));
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      const amp = h * 0.22;
      const wl = w / (1.5 + freq * 0.5);
      for (let x = 0; x <= w; x += 2) {
        const yy = h * 0.5 + Math.sin((x / wl) * Math.PI * 2) * amp;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    }
    case 'bicolor': {
      ctx.globalAlpha = 1;
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, hexCss(bodyColor));
      g.addColorStop(0.45, hexCss(bodyColor));
      g.addColorStop(0.55, pc);
      g.addColorStop(1, pc);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'ocellus': {
      const spots = Math.max(2, Math.floor(2 + freq));
      ctx.globalAlpha = 0.85;
      for (let s = 0; s < spots; s++) {
        const cx = (0.2 + rng() * 0.6) * w;
        const cy = (0.2 + rng() * 0.6) * h;
        const maxR = (0.06 + rng() * 0.06) * Math.min(w, h);
        for (let ring = 3; ring >= 0; ring--) {
          const rr = (maxR * (ring + 1)) / 4;
          ctx.strokeStyle = ring % 2 === 0 ? pc : hexCss(bodyColor);
          ctx.lineWidth = Math.max(1.5, maxR * 0.12);
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
    default:
      break;
  }

  ctx.restore();
}

/**
 * Procedural diffus-map til kropsmesh. Uden cache-miss: genbruger CanvasTexture.
 * Bruges kun når `bodyPattern` er sat og ikke `'solid'`.
 */
export function generatePatternTexture(
  pattern: BodyPattern,
  bodyColor: number,
  patternColor: number,
  density: number,
  width: number,
  height: number
): CanvasTexture {
  return generateBodyDiffuseMap({
    bodyColor,
    bodyPattern: pattern,
    patternColor,
    patternDensity: density,
    width,
    height,
  });
}

/**
 * Bump-kort til glimmer: lyse prikker på neutral grå (128) + fin støj til metalness-agtig variation i lyset.
 * Frigør med `disposeGlimmerBumpMap`.
 */
/** Bland `placement` (0–1) ind i frøet så mønsteret kan skiftes uden at ændre amount/farve. */
export function combineGlimmerPlacementSeed(baseSeed: number, placement = 0): number {
  const p = Number.isFinite(placement) ? Math.max(0, Math.min(1, placement)) : 0;
  const a = Math.floor(p * 0xffffffff) >>> 0;
  const b = Math.imul(Math.floor(p * 100000), 2246822519) >>> 0;
  return (baseSeed ^ a ^ b) >>> 0;
}

export function disposeGlimmerBumpMap(tex: CanvasTexture | null | undefined): void {
  tex?.dispose();
}

/**
 * Hvide glimmerpletter på sort — til `emissiveMap` på krop (virker sammen med `normalMap`;
 * almindeligt `bumpMap` bruges ikke når normalMap er sat).
 */
export function createGlimmerEmissiveMask(
  seed: number,
  amount: number,
  size = 128,
  placement = 0
): CanvasTexture {
  const rng = mulberry32(combineGlimmerPlacementSeed(seed, placement));
  const w = size;
  const h = size;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, 0, w, h);

  const nSpots = Math.floor(40 + amount * 90);
  for (let i = 0; i < nSpots; i++) {
    const cx = rng() * w;
    const cy = rng() * h;
    const r = (0.4 + rng() * 2.4) * (0.75 + amount * 0.5);
    const alpha = Math.min(1, (0.35 + rng() * 0.55) * (0.85 + amount * 0.35));
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const nTiny = Math.floor(30 + amount * 70);
  for (let i = 0; i < nTiny; i++) {
    const cx = rng() * w;
    const cy = rng() * h;
    const r = 0.25 + rng() * 1.1;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = Math.min(1, (0.22 + rng() * 0.45) * (0.8 + amount * 0.4));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = NoColorSpace;
  return tex;
}
