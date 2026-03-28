import {
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three';
import type { GraphicsQuality } from '../types/game.js';

const CACHE_KEY = 'regnefisken_gpu_bench';
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface GpuBenchResult {
  quality: GraphicsQuality;
  exposure: number;
  hwScore: number;
  gpuScore: number;
  cores: number;
  memory: number;
  dpr: number;
  isMobile: boolean;
  ts: number;
}

function readCache(): GpuBenchResult | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<GpuBenchResult>;
    if (
      typeof o.ts !== 'number' ||
      typeof o.quality !== 'string' ||
      typeof o.exposure !== 'number' ||
      Date.now() - o.ts > CACHE_MAX_AGE_MS
    ) {
      return null;
    }
    const q = o.quality;
    if (q !== 'low' && q !== 'medium' && q !== 'high' && q !== 'ultra') return null;
    return {
      quality: q,
      exposure: o.exposure,
      hwScore: typeof o.hwScore === 'number' ? o.hwScore : 0,
      gpuScore: typeof o.gpuScore === 'number' ? o.gpuScore : 0,
      cores: typeof o.cores === 'number' ? o.cores : 0,
      memory: typeof o.memory === 'number' ? o.memory : 0,
      dpr: typeof o.dpr === 'number' ? o.dpr : 1,
      isMobile: Boolean(o.isMobile),
      ts: o.ts,
    };
  } catch {
    return null;
  }
}

function writeCache(r: GpuBenchResult): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(r));
  } catch {
    /* ignore quota */
  }
}

function benchGpuMs(): number {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) return 32;

  let renderer: WebGLRenderer | null = null;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(256, 256, false);

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 6;

    const geo = new SphereGeometry(0.12, 24, 24);
    const meshes: Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const mat = new MeshPhysicalMaterial({
        color: 0x88aaff,
        metalness: 0.2,
        roughness: 0.4,
        clearcoat: 0.6,
      });
      const mesh = new Mesh(geo, mat);
      const row = Math.floor(i / 6);
      const col = i % 6;
      mesh.position.set(col * 0.35 - 0.9, row * 0.35 - 0.75, (i % 3) * 0.1 - 0.1);
      scene.add(mesh);
      meshes.push(mesh);
    }

    for (let f = 0; f < 5; f++) {
      renderer.render(scene, camera);
    }

    let total = 0;
    const frames = 20;
    for (let f = 0; f < frames; f++) {
      for (const m of meshes) {
        m.rotation.x += 0.02;
        m.rotation.y += 0.03;
      }
      const t0 = performance.now();
      renderer.render(scene, camera);
      total += performance.now() - t0;
    }

    geo.dispose();
    for (const m of meshes) {
      const mat = m.material;
      if (!Array.isArray(mat)) mat.dispose();
      else mat.forEach((x) => x.dispose());
    }
    renderer.dispose();

    return total / frames;
  } catch {
    renderer?.dispose();
    return 32;
  }
}

function frameMsToGpuScore(ms: number): number {
  if (ms < 4) return 100;
  if (ms < 8) return 80;
  if (ms < 16) return 55;
  if (ms < 30) return 30;
  return 15;
}

function mapScoreToQuality(score: number): { quality: GraphicsQuality; exposure: number } {
  if (score >= 85) return { quality: 'ultra', exposure: 0.75 };
  if (score >= 65) return { quality: 'high', exposure: 0.7 };
  if (score >= 35) return { quality: 'medium', exposure: 0.65 };
  return { quality: 'low', exposure: 0.55 };
}

/** Første spilstart: GPU-benchmark + heuristik. Bruger cache ≤30 dage. */
export function autoDetectGraphics(): GpuBenchResult {
  const cached = readCache();
  if (cached) return cached;

  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const memory =
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number'
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory!
      : 4;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 2 && w < 1024);

  const is4k =
    typeof screen !== 'undefined' &&
    (screen.width >= 3840 || screen.height >= 3840 || screen.width >= 2560);

  const avgMs = typeof document !== 'undefined' ? benchGpuMs() : 16;
  const gpuScore = frameMsToGpuScore(avgMs);
  let hwScore = gpuScore;

  if (cores >= 8) hwScore += 10;
  else if (cores <= 2) hwScore -= 15;
  if (memory >= 8) hwScore += 8;
  else if (memory <= 2) hwScore -= 12;
  if (isMobile && dpr >= 3) hwScore -= 10;
  if (is4k) hwScore -= 5;

  hwScore = Math.max(0, Math.min(100, hwScore));

  const { quality, exposure } = mapScoreToQuality(hwScore);

  const result: GpuBenchResult = {
    quality,
    exposure,
    hwScore,
    gpuScore,
    cores,
    memory,
    dpr,
    isMobile,
    ts: Date.now(),
  };
  writeCache(result);
  return result;
}
