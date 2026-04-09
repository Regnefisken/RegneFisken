import { ExtrudeGeometry, Shape, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { DorsalFinType, TailType } from '../../types/fish.js';

const bevelOff = { bevelEnabled: false as const };

/** Skal matche `depth` i `ExtrudeGeometry` for rygfinnen. */
const DORSAL_FIN_EXTRUDE_DEPTH = 0.11;

function finalizeDorsal(g: ExtrudeGeometry): ExtrudeGeometry {
  // ExtrudeGeometry fylder [0, depth] langs lokal Z; centrer så midtlinjen (z=0) går gennem finnen.
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
    default: {
      shape.moveTo(-0.2, 0);
      shape.lineTo(0, 0.62);
      shape.lineTo(0.2, 0);
      shape.closePath();
    }
  }
  return finalizeDorsal(new ExtrudeGeometry(shape, { ...bevelOff, depth: DORSAL_FIN_EXTRUDE_DEPTH, curveSegments: 14 }));
}

const EXTRUDED_TAILS = new Set<TailType>([
  'veil',
  'lyre',
  'scalloped',
  'paddle',
  'ribbon',
  'heart',
  'sail',
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
  let depth = 0.09;

  switch (tail) {
    case 'veil': {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.35, 0.05, 0.55, 0.55, 0.45, 1.05);
      shape.bezierCurveTo(0.25, 1.25, -0.25, 1.25, -0.45, 1.05);
      shape.bezierCurveTo(-0.55, 0.55, -0.35, 0.05, 0, 0);
      depth = 0.035;
      break;
    }
    case 'lyre': {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.32, 0.15, 0.52, 0.75, 0.38, 1.15);
      shape.lineTo(0.12, 0.85);
      shape.quadraticCurveTo(0.06, 0.55, 0, 0.35);
      shape.quadraticCurveTo(-0.06, 0.55, -0.12, 0.85);
      shape.lineTo(-0.38, 1.15);
      shape.bezierCurveTo(-0.52, 0.75, -0.32, 0.15, 0, 0);
      depth = 0.06;
      break;
    }
    case 'scalloped': {
      shape.moveTo(-0.4, 0);
      shape.lineTo(-0.28, 0.18);
      shape.lineTo(-0.18, 0.06);
      shape.lineTo(-0.08, 0.2);
      shape.lineTo(0, 0.08);
      shape.lineTo(0.08, 0.2);
      shape.lineTo(0.18, 0.06);
      shape.lineTo(0.28, 0.18);
      shape.lineTo(0.4, 0);
      shape.lineTo(0.32, 0.52);
      shape.quadraticCurveTo(0, 0.82, -0.32, 0.52);
      shape.closePath();
      depth = 0.07;
      break;
    }
    case 'paddle': {
      shape.moveTo(0.4, 0.35);
      shape.ellipse(0, 0.35, 0.42, 0.38, 0, Math.PI * 2, false, 0);
      depth = 0.1;
      break;
    }
    case 'ribbon': {
      shape.moveTo(-0.08, 0);
      shape.lineTo(0.08, 0);
      shape.lineTo(0.06, 1.45);
      shape.lineTo(-0.06, 1.45);
      shape.closePath();
      depth = 0.028;
      break;
    }
    case 'heart': {
      shape.moveTo(0, 0.35);
      shape.bezierCurveTo(0, 0.2, -0.35, 0, -0.35, 0.35);
      shape.bezierCurveTo(-0.35, 0.65, 0, 0.95, 0, 1.15);
      shape.bezierCurveTo(0, 0.95, 0.35, 0.65, 0.35, 0.35);
      shape.bezierCurveTo(0.35, 0, 0, 0.2, 0, 0.35);
      depth = 0.065;
      break;
    }
    case 'sail': {
      shape.moveTo(-0.05, 0);
      shape.lineTo(0.05, 0);
      shape.lineTo(0.35, 1.2);
      shape.lineTo(0, 1.45);
      shape.lineTo(-0.35, 1.2);
      shape.closePath();
      depth = 0.055;
      break;
    }
    default:
      return null;
  }

  return finalizeTail(
    new ExtrudeGeometry(shape, { ...bevelOff, depth, curveSegments: tail === 'paddle' ? 24 : 18 })
  );
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
    const g = new ExtrudeGeometry(s, { ...bevelOff, depth: 0.045, curveSegments: 10 });
    g.rotateZ(a * 0.55);
    g.translate(a * 0.05, 0, 0);
    parts.push(g);
  }
  const merged = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  merged.computeVertexNormals();
  return merged;
}
