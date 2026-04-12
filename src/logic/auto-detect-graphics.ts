import {
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three';
import type { GraphicsQuality } from '../types/game.js';
import { APP_VERSION } from '../data/version.js';

const CACHE_KEY = 'regnefisken_gpu_bench';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const QUALITY_ORDER: GraphicsQuality[] = ['low', 'medium', 'high', 'ultra'];

const EXPOSURE_FOR_TIER: Record<GraphicsQuality, number> = {
  low: 0.65,
  medium: 0.78,
  high: 0.82,
  ultra: 0.88,
};

const GPU_CAPS: Record<string, GraphicsQuality> = {
  'Mali-400': 'low',
  'Mali-T6': 'low',
  'Adreno (TM) 3': 'low',
  'Adreno (TM) 4': 'medium',
  'PowerVR SGX': 'low',
  'Intel HD Graphics 4': 'medium',
  SwiftShader: 'low',
};

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
  appVersion: string;
}

function readGpuCap(renderer: string): GraphicsQuality | null {
  for (const [pattern, maxQ] of Object.entries(GPU_CAPS)) {
    if (renderer.includes(pattern)) return maxQ;
  }
  return null;
}

function clampQualityToCap(q: GraphicsQuality, cap: GraphicsQuality): GraphicsQuality {
  if (QUALITY_ORDER.indexOf(q) > QUALITY_ORDER.indexOf(cap)) return cap;
  return q;
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
    if (o.appVersion !== APP_VERSION) return null;
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
      appVersion: typeof o.appVersion === 'string' ? o.appVersion : APP_VERSION,
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

/** Benchmark: tættere på gameplay-load (512², sfærer + bølge-plan), 30 målte frames. */
function benchGpuMs(): { avgMs: number; renderer: string } {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) return { avgMs: 32, renderer: '' };

  let rendererStr = '';
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    rendererStr = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
  }

  let renderer: WebGLRenderer | null = null;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(512, 512, false);

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 6;

    const sphereGeo = new SphereGeometry(0.12, 24, 24);
    const meshes: Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const mat = new MeshPhysicalMaterial({
        color: 0x88aaff,
        metalness: 0.2,
        roughness: 0.4,
        clearcoat: 0.6,
      });
      const mesh = new Mesh(sphereGeo, mat);
      const row = Math.floor(i / 6);
      const col = i % 6;
      mesh.position.set(col * 0.35 - 0.9, row * 0.35 - 0.75, (i % 3) * 0.1 - 0.1);
      scene.add(mesh);
      meshes.push(mesh);
    }

    const planeGeo = new PlaneGeometry(14, 14, 48, 48);
    const planeMat = new MeshPhysicalMaterial({
      color: 0x4488cc,
      metalness: 0.05,
      roughness: 0.35,
      clearcoat: 0.4,
    });
    const uTime = { value: 0 };
    planeMat.onBeforeCompile = (shader) => {
      shader.uniforms.u_bench_t = uTime;
      shader.vertexShader = 'uniform float u_bench_t;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float _w = 0.12 * sin(transformed.x * 2.0 + u_bench_t) * cos(transformed.z * 1.5 + u_bench_t * 0.7)
          + 0.08 * sin(transformed.x * 3.1 - transformed.z * 2.2 + u_bench_t * 1.1);
        transformed.y += _w;`,
      );
    };
    const plane = new Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1.1;
    scene.add(plane);

    for (let f = 0; f < 5; f++) {
      uTime.value += 0.04;
      renderer.render(scene, camera);
    }

    let total = 0;
    const frames = 30;
    const deadline = performance.now() + 5000;
    for (let f = 0; f < frames; f++) {
      if (performance.now() > deadline) {
        sphereGeo.dispose();
        planeGeo.dispose();
        for (const m of meshes) {
          const mat = m.material;
          if (!Array.isArray(mat)) mat.dispose();
          else mat.forEach((x) => x.dispose());
        }
        planeMat.dispose();
        renderer.dispose();
        return { avgMs: 32, renderer: rendererStr };
      }
      uTime.value += 0.05;
      for (const m of meshes) {
        m.rotation.x += 0.02;
        m.rotation.y += 0.03;
      }
      const t0 = performance.now();
      renderer.render(scene, camera);
      total += performance.now() - t0;
    }

    sphereGeo.dispose();
    planeGeo.dispose();
    for (const m of meshes) {
      const mat = m.material;
      if (!Array.isArray(mat)) mat.dispose();
      else mat.forEach((x) => x.dispose());
    }
    planeMat.dispose();
    renderer.dispose();

    return { avgMs: total / frames, renderer: rendererStr };
  } catch {
    renderer?.dispose();
    return { avgMs: 32, renderer: rendererStr };
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
  if (score >= 85) return { quality: 'ultra', exposure: EXPOSURE_FOR_TIER.ultra };
  if (score >= 65) return { quality: 'high', exposure: EXPOSURE_FOR_TIER.high };
  if (score >= 35) return { quality: 'medium', exposure: EXPOSURE_FOR_TIER.medium };
  return { quality: 'low', exposure: EXPOSURE_FOR_TIER.low };
}

/** Første spilstart: GPU-benchmark + heuristik. Cache ≤7 dage + app-version. */
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

  const bench = typeof document !== 'undefined' ? benchGpuMs() : { avgMs: 16, renderer: '' };
  const gpuScore = frameMsToGpuScore(bench.avgMs);
  let hwScore = gpuScore;

  if (cores >= 8) hwScore += 10;
  else if (cores <= 2) hwScore -= 15;
  if (memory >= 8) hwScore += 8;
  else if (memory <= 2) hwScore -= 12;
  if (isMobile && dpr >= 3) hwScore -= 10;
  if (is4k) hwScore -= 5;

  if (isMobile) hwScore -= 8;
  if (isMobile && memory <= 4 && cores <= 4) hwScore -= 5;

  hwScore = Math.max(0, Math.min(100, hwScore));

  let { quality, exposure } = mapScoreToQuality(hwScore);

  const gpuCap = readGpuCap(bench.renderer);
  if (gpuCap) {
    const capped = clampQualityToCap(quality, gpuCap);
    if (capped !== quality) {
      quality = capped;
      exposure = EXPOSURE_FOR_TIER[capped];
    }
  }

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
    appVersion: APP_VERSION,
  };
  writeCache(result);
  return result;
}
