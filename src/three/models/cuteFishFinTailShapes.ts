import { ExtrudeGeometry, Shape, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { DorsalFinType, TailType } from '../../types/fish.js';

const bevelOff = { bevelEnabled: false as const };

/** Skal matche `depth` i `ExtrudeGeometry` for rygfinnen. */
const DORSAL_FIN_EXTRUDE_DEPTH = 0.055;

function finalizeDorsal(g: ExtrudeGeometry): ExtrudeGeometry {
  g.translate(0, 0, -DORSAL_FIN_EXTRUDE_DEPTH / 2);
  g.computeVertexNormals();
  return g;
}

/** Profil i XY (Y op), tykkelse langs Z — placeres på ryg uden ekstra rotation. */
export function createDorsalFinGeometry(type: DorsalFinType): ExtrudeGeometry {
  const shape = new Shape();
  switch (type) {
    case 'standard': {
      shape.moveTo(-0.2, 0);
      shape.lineTo(0, 0.62);
      shape.lineTo(0.2, 0);
      shape.closePath();
      break;
    }
    case 'spiked': {
      shape.moveTo(-0.24, 0);
      shape.lineTo(-0.16, 0.22);
      shape.lineTo(-0.1, 0.12);
      shape.lineTo(-0.04, 0.35);
      shape.lineTo(0.02, 0.18);
      shape.lineTo(0.08, 0.4);
      shape.lineTo(0.14, 0.15);
      shape.lineTo(0.2, 0.38);
      shape.lineTo(0.24, 0);
      shape.closePath();
      break;
    }
    case 'double': {
      shape.moveTo(-0.26, 0);
      shape.lineTo(-0.14, 0.58);
      shape.lineTo(-0.04, 0.32);
      shape.lineTo(0.04, 0.58);
      shape.lineTo(0.14, 0.32);
      shape.lineTo(0.26, 0);
      shape.closePath();
      break;
    }
    case 'mohawk': {
      shape.moveTo(-0.1, 0);
      shape.lineTo(-0.05, 0.45);
      shape.lineTo(0, 0.82);
      shape.lineTo(0.05, 0.45);
      shape.lineTo(0.1, 0);
      shape.closePath();
      break;
    }
    case 'standardVersion2': {
      const k = 0.38;
      shape.moveTo(-0.5 * k, 0);
      shape.lineTo(0, 1.2 * k);
      shape.lineTo(0.5 * k, 0);
      shape.closePath();
      break;
    }
    case 'almindelig': {
      const k = 0.38;
      shape.moveTo(0.5 * k, 0);
      shape.lineTo(-0.4 * k, 1.2 * k);
      shape.lineTo(-0.6 * k, 0);
      shape.closePath();
      break;
    }
    case 'shark': {
      const k = 0.35;
      shape.moveTo(0.5 * k, 0);
      shape.bezierCurveTo(0.2 * k, 0.8 * k, -0.2 * k, 1.5 * k, -0.5 * k, 1.5 * k);
      shape.quadraticCurveTo(-0.6 * k, 0.5 * k, -1.2 * k, 0);
      shape.lineTo(0.5 * k, 0);
      break;
    }
    case 'spikedVersion2': {
      const s = 0.22;
      shape.moveTo(1 * s, 0);
      shape.lineTo(0.8 * s, 1.2 * s);
      shape.lineTo(0.5 * s, 0.3 * s);
      shape.lineTo(0.2 * s, 1 * s);
      shape.lineTo(-0.1 * s, 0.3 * s);
      shape.lineTo(-0.4 * s, 0.8 * s);
      shape.lineTo(-0.7 * s, 0.2 * s);
      shape.lineTo(-1 * s, 0.5 * s);
      shape.lineTo(-1.2 * s, 0);
      shape.lineTo(1 * s, 0);
      break;
    }
    case 'doubleVersion2': {
      const k = 0.32;
      shape.moveTo(1 * k, 0);
      shape.quadraticCurveTo(0.5 * k, 1.5 * k, 0.2 * k, 1.2 * k);
      shape.quadraticCurveTo(0, 0.5 * k, -0.2 * k, 0);
      shape.lineTo(-0.4 * k, 0);
      shape.quadraticCurveTo(-0.6 * k, 0.8 * k, -0.8 * k, 0.7 * k);
      shape.quadraticCurveTo(-1 * k, 0.3 * k, -1.2 * k, 0);
      shape.lineTo(1 * k, 0);
      break;
    }
    case 'mohawkVersion2': {
      const s = 0.2;
      shape.moveTo(1 * s, 0);
      shape.lineTo(0.9 * s, 1.2 * s);
      shape.lineTo(0.8 * s, 0.2 * s);
      shape.lineTo(0.5 * s, 1.5 * s);
      shape.lineTo(0.4 * s, 0.2 * s);
      shape.lineTo(0.1 * s, 1.3 * s);
      shape.lineTo(0, 0.2 * s);
      shape.lineTo(-0.3 * s, 1 * s);
      shape.lineTo(-0.4 * s, 0.1 * s);
      shape.lineTo(-0.8 * s, 0.6 * s);
      shape.lineTo(-0.9 * s, 0);
      shape.lineTo(1 * s, 0);
      break;
    }
    case 'crown': {
      const k = 0.28;
      shape.moveTo(1 * k, 0);
      shape.quadraticCurveTo(0.8 * k, 1.5 * k, 0.5 * k, 1.4 * k);
      shape.quadraticCurveTo(0.4 * k, 0.8 * k, 0.2 * k, 0.6 * k);
      shape.quadraticCurveTo(0, 1.8 * k, -0.3 * k, 1.6 * k);
      shape.quadraticCurveTo(-0.5 * k, 0.8 * k, -0.7 * k, 0.6 * k);
      shape.quadraticCurveTo(-1 * k, 1.2 * k, -1.2 * k, 1 * k);
      shape.quadraticCurveTo(-1.4 * k, 0.5 * k, -1.5 * k, 0);
      shape.lineTo(1 * k, 0);
      break;
    }
    case 'sailDorsal': {
      const k = 0.3;
      shape.moveTo(1.2 * k, 0);
      shape.bezierCurveTo(1.0 * k, 0.3 * k, 0.6 * k, 2.2 * k, 0.1 * k, 2.4 * k);
      shape.bezierCurveTo(-0.3 * k, 2.3 * k, -0.6 * k, 1.8 * k, -0.8 * k, 1.2 * k);
      shape.quadraticCurveTo(-1.0 * k, 0.4 * k, -1.4 * k, 0);
      shape.lineTo(1.2 * k, 0);
      break;
    }
    case 'ragged': {
      const s = 0.22;
      shape.moveTo(1.1 * s, 0);
      shape.lineTo(1.0 * s, 0.6 * s);
      shape.lineTo(0.8 * s, 0.15 * s);
      shape.lineTo(0.6 * s, 1.1 * s);
      shape.lineTo(0.35 * s, 0.25 * s);
      shape.lineTo(0.1 * s, 0.7 * s);
      shape.lineTo(-0.1 * s, 0.1 * s);
      shape.lineTo(-0.35 * s, 1.3 * s);
      shape.lineTo(-0.55 * s, 0.3 * s);
      shape.lineTo(-0.7 * s, 0.55 * s);
      shape.lineTo(-0.9 * s, 0.1 * s);
      shape.lineTo(-1.1 * s, 0);
      shape.lineTo(1.1 * s, 0);
      break;
    }
    case 'wave': {
      const k = 0.28;
      shape.moveTo(1.0 * k, 0);
      shape.quadraticCurveTo(0.9 * k, 0.9 * k, 0.6 * k, 0.7 * k);
      shape.quadraticCurveTo(0.3 * k, 0.5 * k, 0.1 * k, 1.1 * k);
      shape.quadraticCurveTo(-0.1 * k, 1.5 * k, -0.4 * k, 1.0 * k);
      shape.quadraticCurveTo(-0.6 * k, 0.6 * k, -0.8 * k, 0.9 * k);
      shape.quadraticCurveTo(-1.0 * k, 1.1 * k, -1.2 * k, 0.5 * k);
      shape.quadraticCurveTo(-1.3 * k, 0.2 * k, -1.4 * k, 0);
      shape.lineTo(1.0 * k, 0);
      break;
    }
    default: {
      shape.moveTo(-0.2, 0);
      shape.lineTo(0, 0.62);
      shape.lineTo(0.2, 0);
      shape.closePath();
    }
  }
  return finalizeDorsal(
    new ExtrudeGeometry(shape, { ...bevelOff, depth: DORSAL_FIN_EXTRUDE_DEPTH, curveSegments: 16 })
  );
}

const EXTRUDED_TAILS = new Set<TailType>([
  'veil',
  'lyre',
  'scalloped',
  'ribbon',
  'heart',
  'sail',
  'giantSail',
  'crescent',
  'sword',
  'doubleLobe',
  'sharkTail',
  'fan',
  'spade',
  'kraken',
]);

export function isExtrudedTailType(tail: TailType): boolean {
  return EXTRUDED_TAILS.has(tail);
}

function finalizeTail(g: ExtrudeGeometry): ExtrudeGeometry {
  g.computeVertexNormals();
  return g;
}

/** Hale-profil i XY, extruderes langs Z; mesh får rotation [-π/2, 0, π/2] (XYZ) i CuteFishModel. */
export function createTailFinGeometry(tail: TailType): ExtrudeGeometry | BufferGeometry | null {
  if (!EXTRUDED_TAILS.has(tail)) return null;

  if (tail === 'kraken') {
    return createKrakenTailMerged();
  }

  const shape = new Shape();
  let depth = 0.045;

  switch (tail) {
    case 'veil': {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.4, 0.04, 0.62, 0.52, 0.52, 1.12);
      shape.bezierCurveTo(0.26, 1.28, -0.34, 1.15, -0.48, 0.82);
      shape.bezierCurveTo(-0.54, 0.48, -0.22, 0.05, 0, 0);
      depth = 0.016;
      break;
    }
    case 'lyre': {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.36, 0.14, 0.62, 0.88, 0.5, 1.42);
      shape.lineTo(0.14, 0.98);
      shape.quadraticCurveTo(0.06, 0.52, 0, 0.32);
      shape.quadraticCurveTo(-0.06, 0.52, -0.14, 0.98);
      shape.lineTo(-0.5, 1.42);
      shape.bezierCurveTo(-0.62, 0.88, -0.36, 0.14, 0, 0);
      depth = 0.028;
      break;
    }
    case 'scalloped': {
      const w = 0.34;
      const H = 0.56;
      const amp = 0.036;
      const n = 64;

      shape.moveTo(-w, 0);
      shape.lineTo(w, 0);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = w - t * 2 * w;
        const y = H + amp * Math.sin(t * 12 * Math.PI);
        shape.lineTo(x, y);
      }
      shape.closePath();
      depth = 0.035;
      break;
    }
    case 'ribbon': {
      shape.moveTo(-0.07, 0);
      shape.lineTo(0.07, 0);
      shape.lineTo(0.055, 1.72);
      shape.lineTo(-0.055, 1.72);
      shape.closePath();
      depth = 0.013;
      break;
    }
    case 'heart': {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(-0.14, 0.03, -0.32, 0.22, -0.36, 0.48);
      shape.bezierCurveTo(-0.38, 0.68, -0.12, 0.82, 0, 0.73);
      shape.bezierCurveTo(0.12, 0.82, 0.38, 0.68, 0.36, 0.48);
      shape.bezierCurveTo(0.32, 0.22, 0.14, 0.03, 0, 0);
      depth = 0.0325;
      break;
    }
    case 'sail': {
      shape.moveTo(-0.05, 0);
      shape.lineTo(0.05, 0);
      shape.lineTo(0.35, 1.2);
      shape.lineTo(0, 1.45);
      shape.lineTo(-0.35, 1.2);
      shape.closePath();
      depth = 0.0275;
      break;
    }
    case 'giantSail': {
      shape.moveTo(-0.07, 0);
      shape.lineTo(0.07, 0);
      shape.lineTo(0.52, 1.68);
      shape.lineTo(0, 2.02);
      shape.lineTo(-0.52, 1.68);
      shape.closePath();
      depth = 0.034;
      break;
    }
    case 'crescent': {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(-0.22, 0.08, -0.48, 0.48, -0.44, 0.98);
      shape.bezierCurveTo(-0.38, 1.18, -0.12, 1.05, 0, 0.78);
      shape.bezierCurveTo(0.12, 1.05, 0.38, 1.18, 0.44, 0.98);
      shape.bezierCurveTo(0.48, 0.48, 0.22, 0.08, 0, 0);
      depth = 0.038;
      break;
    }
    case 'sword': {
      shape.moveTo(-0.13, 0);
      shape.lineTo(0.13, 0);
      shape.lineTo(0.11, 0.52);
      shape.lineTo(0.03, 1.38);
      shape.lineTo(-0.07, 0.5);
      shape.closePath();
      depth = 0.022;
      break;
    }
    case 'doubleLobe': {
      const m = 0.4;
      const v = 0.94;
      const c = 0.44;
      shape.moveTo(-m, 0);
      shape.lineTo(-0.44, v);
      shape.lineTo(-c * 0.5, c);
      shape.lineTo(0, 0.5);
      shape.lineTo(c * 0.5, c);
      shape.lineTo(0.44, v);
      shape.lineTo(m, 0);
      shape.closePath();
      depth = 0.038;
      break;
    }
    case 'sharkTail': {
      shape.moveTo(-0.05, 0);
      shape.lineTo(0.05, 0);
      shape.lineTo(0.12, 0.18);
      shape.lineTo(0.44, 1.38);
      shape.lineTo(0.18, 1.05);
      shape.lineTo(0.06, 0.42);
      shape.lineTo(-0.18, 0.62);
      shape.lineTo(-0.34, 0.22);
      shape.closePath();
      depth = 0.04;
      break;
    }
    case 'fan': {
      const w = 0.54;
      const H = 0.44;
      shape.moveTo(-0.07, 0);
      shape.lineTo(0.07, 0);
      shape.bezierCurveTo(0.42, H * 0.28, w, H * 0.72, w * 0.94, H * 1.05);
      shape.quadraticCurveTo(0, H * 1.12, -w * 0.94, H * 1.05);
      shape.bezierCurveTo(-w, H * 0.72, -0.42, H * 0.28, -0.07, 0);
      shape.closePath();
      depth = 0.042;
      break;
    }
    case 'spade': {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.12, 0.24, 0.42, 0.64, 0.34, 1.02);
      shape.bezierCurveTo(0.22, 1.16, 0.06, 1.1, 0, 0.9);
      shape.bezierCurveTo(-0.08, 1.08, -0.3, 1.12, -0.38, 0.96);
      shape.bezierCurveTo(-0.44, 0.58, -0.12, 0.2, 0, 0);
      depth = 0.036;
      break;
    }
    default:
      return null;
  }

  const curveSegments = tail === 'fan' ? 28 : tail === 'giantSail' ? 12 : 18;
  return finalizeTail(new ExtrudeGeometry(shape, { ...bevelOff, depth, curveSegments }));
}

function createKrakenTailMerged(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = ((i - (n - 1) / 2) / (n - 1)) * 1.1;
    const s = new Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.04 + a * 0.08, 0.35, 0.12 + a * 0.15, 0.75);
    s.lineTo(0.05 + a * 0.1, 0.82);
    s.quadraticCurveTo(-0.02, 0.4, 0, 0);
    const g = new ExtrudeGeometry(s, { ...bevelOff, depth: 0.0225, curveSegments: 10 });
    g.rotateZ(a * 0.55);
    g.translate(a * 0.05, 0, 0);
    parts.push(g);
  }
  const merged = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  merged.computeVertexNormals();
  return merged;
}
