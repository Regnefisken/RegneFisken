import { CanvasTexture } from 'three';

/** Lysende prikker langs midterlinjen (UV) — bruges som emissiveMap. */
export function createBioluminescentEmissiveMap(width = 256, height = 128, seed = 0): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  const midY = height * 0.5;
  let rng = (seed ^ 0x9e3779b9) >>> 0;
  const rnd = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 0xffffffff;
  };
  for (let i = 0; i < 48; i++) {
    const x = rnd() * width;
    const r = 2 + rnd() * 5;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.55})`;
    ctx.beginPath();
    ctx.arc(x, midY + (rnd() - 0.5) * 10, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function disposeBioluminescentTexture(tex: CanvasTexture | null | undefined) {
  if (tex) tex.dispose();
}

export function buildBoltSegments(
  sx: number,
  sy: number,
  sz: number,
): { cyan: Float32Array; white: Float32Array } {
  const cyanChunks: number[] = [];
  const whiteChunks: number[] = [];
  const boltCount = 6 + Math.floor(Math.random() * 5);
  for (let b = 0; b < boltCount; b++) {
    if (Math.random() < 0.35) continue;
    const u = Math.random() * Math.PI * 2;
    const v = Math.acos(2 * Math.random() - 1);
    const bx = Math.sin(v) * Math.cos(u) * sz * 0.34;
    const by = Math.cos(v) * sy * 0.34;
    const bz = Math.sin(v) * Math.sin(u) * sx * 0.34;
    const nx = bx;
    const ny = by;
    const nz = bz;
    const len = Math.hypot(nx, ny, nz) || 1;
    const dx = nx / len;
    const dy = ny / len;
    const dz = nz / len;
    const perpX = -dz;
    const perpY = dx;
    const perpZ = dy;
    const pl = Math.hypot(perpX, perpY, perpZ) || 1;
    const px = perpX / pl;
    const py = perpY / pl;
    const pz = perpZ / pl;
    const segments = 5 + Math.floor(Math.random() * 4);
    let ox = bx;
    let oy = by;
    let oz = bz;
    for (let s = 0; s < segments; s++) {
      const lateral = (Math.random() - 0.5) * 0.35;
      const jitter = (Math.random() - 0.5) * 0.08;
      const nx2 = ox + dx * 0.12 + px * lateral + jitter;
      const ny2 = oy + dy * 0.12 + py * lateral + jitter;
      const nz2 = oz + dz * 0.12 + pz * lateral + jitter;
      const push = (arr: number[], ax: number, ay: number, az: number, bx2: number, by2: number, bz2: number) => {
        arr.push(ax, ay, az, bx2, by2, bz2);
      };
      push(cyanChunks, ox, oy, oz, nx2, ny2, nz2);
      push(whiteChunks, ox * 0.98, oy * 0.98, oz * 0.98, nx2 * 0.99, ny2 * 0.99, nz2 * 0.99);
      ox = nx2;
      oy = ny2;
      oz = nz2;
    }
  }
  const cyan = new Float32Array(cyanChunks);
  const white = new Float32Array(whiteChunks);
  return { cyan, white };
}

export function ensureLinePositions(buf: Float32Array): Float32Array {
  return buf.length >= 6 ? buf : new Float32Array([0, 0, 0, 0.01, 0, 0]);
}

export function fillSparkParams(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const angles: number[] = [];
  const speeds: number[] = [];
  const phases: number[] = [];
  const isWhite: boolean[] = [];
  const rBase: number[] = [];
  for (let i = 0; i < 24; i++) {
    angles.push(next() * Math.PI * 2);
    speeds.push(0.55 + next() * 1.45);
    phases.push(next() * Math.PI * 2);
    isWhite.push(i < 24 * 0.4);
    rBase.push(0.42 + next() * 0.38);
  }
  return { angles, speeds, phases, isWhite, rBase };
}
