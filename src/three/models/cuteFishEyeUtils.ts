import {
  BufferGeometry,
  CircleGeometry,
  Path,
  Shape,
  ShapeGeometry,
  SphereGeometry,
} from 'three';
import type { EyePupilShape } from '../../types/fish.js';

/** `true` for flade pupilformer der bør bruge `side: DoubleSide`. */
export function isPupilFlat(shape: EyePupilShape): boolean {
  return shape !== 'sphere';
}

export function createPupilGeometry(shape: EyePupilShape, r: number): BufferGeometry {
  if (shape === 'sphere') {
    return new SphereGeometry(r, 12, 10);
  }
  if (shape === 'round') {
    return new CircleGeometry(r, 48);
  }
  if (shape === 'vertical_slit') {
    const s = new Shape();
    s.absellipse(0, 0, r * 0.2, r * 0.98, 0, Math.PI * 2, false, 0);
    return new ShapeGeometry(s);
  }
  if (shape === 'horizontal_slit') {
    const s = new Shape();
    s.absellipse(0, 0, r * 0.98, r * 0.2, 0, Math.PI * 2, false, 0);
    return new ShapeGeometry(s);
  }
  if (shape === 'diamond') {
    const s = new Shape();
    s.moveTo(0, r);
    s.lineTo(r * 0.92, 0);
    s.lineTo(0, -r);
    s.lineTo(-r * 0.92, 0);
    s.closePath();
    return new ShapeGeometry(s);
  }
  if (shape === 'star') {
    const pts = 5;
    const outer = r;
    const inner = r * 0.38;
    const s = new Shape();
    for (let i = 0; i < pts * 2; i++) {
      const rad = i % 2 === 0 ? outer : inner;
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return new ShapeGeometry(s);
  }
  if (shape === 'heart') {
    const s = new Shape();
    const sc = r * 1.1;
    s.moveTo(0, sc * 0.35);
    s.bezierCurveTo(sc * 0.5, sc * 0.15, sc * 0.55, -sc * 0.25, 0, -sc * 0.45);
    s.bezierCurveTo(-sc * 0.55, -sc * 0.25, -sc * 0.5, sc * 0.15, 0, sc * 0.35);
    return new ShapeGeometry(s);
  }
  if (shape === 'crescent') {
    const shapeG = new Shape();
    shapeG.absarc(0, 0, r, 0, Math.PI * 2, false);
    const hole = new Path();
    hole.absarc(r * 0.28, 0, r * 0.72, 0, Math.PI * 2, true);
    shapeG.holes.push(hole);
    return new ShapeGeometry(shapeG);
  }
  if (shape === 'cross') {
    const t = r * 0.32;
    const L = r * 0.92;
    const s = new Shape();
    s.moveTo(-t, -L);
    s.lineTo(t, -L);
    s.lineTo(t, -t);
    s.lineTo(L, -t);
    s.lineTo(L, t);
    s.lineTo(t, t);
    s.lineTo(t, L);
    s.lineTo(-t, L);
    s.lineTo(-t, t);
    s.lineTo(-L, t);
    s.lineTo(-L, -t);
    s.lineTo(-t, -t);
    s.lineTo(-t, -L);
    return new ShapeGeometry(s);
  }
  return new SphereGeometry(r, 12, 10);
}
