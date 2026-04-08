import {
  AX,
  BODY_BOTTOM,
  BODY_H,
  BODY_W,
  BODY_Y,
  EYE_STYLES,
  FOOT_Y,
  HAIR_COLORS,
  HAIR_STYLES,
  HAND_L_X,
  HAND_L_Y,
  HAND_R_X,
  HAND_R_Y,
  HEAD_Y,
  heldBucket,
  heldMisc,
  heldRod,
  LEG_H,
  LEG_Y,
  NECK_H,
  NECK_W,
  NECK_Y,
  PET_OX,
  PET_OY,
  PET_S,
  PET_X,
  PET_Y,
  SHOULDER_Y,
  SHORTS_H,
  SHORTS_Y,
  SKIN_TONES,
  WARDROBE_ITEMS,
} from '../../data/wardrobeItems.generated.js';
import { WARDROBE_ITEM_ADJ } from '../../data/wardrobeItemAdj.js';
import type { AvatarSaveState } from '../../store/usePlayerStore';

type Equipped = AvatarSaveState['equipped'];

/** Kun i klædeskab: flyt/skalér valgt udstyr og kopier offset til `wardrobeItemAdj`. */
export type AvatarRenderDevState = {
  targetId: string;
  offset: { x: number; y: number };
  scale: number;
  footGap: number;
};

const positions: Record<string, [number, number, number]> = {
  head: [AX, HEAD_Y - 14 - 15, 1.1],
  face: [AX, HEAD_Y + 8, 1],
  neck: [AX, NECK_Y + 4, 1],
  body: [AX, BODY_Y + 10, 1.25],
  belt: [AX, BODY_BOTTOM + 2, 1],
  legs: [AX, BODY_BOTTOM + 10, 1.1],
  back: [AX, BODY_Y, 1],
  hands: [AX, HAND_L_Y, 1],
  feet: [AX, FOOT_Y, 1],
};

function drawSlot(
  slot: string,
  equipped: Equipped,
  clipPrefix: string,
  dev: AvatarRenderDevState | undefined,
): string {
  const itemId = equipped[slot];
  if (!itemId) return '';
  const it = WARDROBE_ITEMS.find((i) => i.id === itemId);
  if (!it || typeof it.svgAvatar !== 'function') return '';

  const pos = positions[slot];
  if (!pos) return '';

  let [cx, cy, ds] = pos;
  const adj = WARDROBE_ITEM_ADJ[it.id];
  const isTarget = dev?.targetId === it.id;
  if (isTarget) {
    cx += dev!.offset.x;
    cy += dev!.offset.y;
  } else if (adj) {
    cx += adj.offset.x;
    cy += adj.offset.y;
  }
  const sc = isTarget ? dev!.scale : adj ? adj.scale : ds;
  const isFeet = slot === 'feet';
  const gap = isFeet ? (isTarget ? dev!.footGap : adj?.gap ?? 0) : 0;
  const svgFn = it.svgAvatar as (cx: number, cy: number) => string;

  if (sc !== 1 && isFeet) {
    const lx = cx - 18;
    const rx = cx + 18;
    const raw = svgFn(cx, cy);
    const clipId = `${clipPrefix}_fc_${it.id}`;
    return `<defs><clipPath id="${clipId}L"><rect x="-200" y="-200" width="${cx + 200}" height="800"/></clipPath><clipPath id="${clipId}R"><rect x="${cx}" y="-200" width="400" height="800"/></clipPath></defs><g transform="translate(${-gap},0)"><g transform="translate(${lx},${cy}) scale(${sc}) translate(${-lx},${-cy})" clip-path="url(#${clipId}L)">${raw}</g></g><g transform="translate(${gap},0)"><g transform="translate(${rx},${cy}) scale(${sc}) translate(${-rx},${-cy})" clip-path="url(#${clipId}R)">${raw}</g></g>`;
  }
  if (isFeet && gap !== 0) {
    const raw = svgFn(cx, cy);
    const clipId = `${clipPrefix}_fc_${it.id}`;
    return `<defs><clipPath id="${clipId}L"><rect x="-200" y="-200" width="${cx + 200}" height="800"/></clipPath><clipPath id="${clipId}R"><rect x="${cx}" y="-200" width="400" height="800"/></clipPath></defs><g transform="translate(${-gap},0)" clip-path="url(#${clipId}L)">${raw}</g><g transform="translate(${gap},0)" clip-path="url(#${clipId}R)">${raw}</g>`;
  }
  if (sc !== 1)
    return `<g transform="translate(${cx},${cy}) scale(${sc}) translate(${-cx},${-cy})">${svgFn(cx, cy)}</g>`;
  return svgFn(cx, cy);
}

/** Renderer avatar-SVG som i prototypen (`references/klædeskabet.html`). */
export function renderAvatarSvg(
  state: AvatarSaveState,
  clipPrefix = 'av',
  dev?: AvatarRenderDevState,
): string {
  const skin = SKIN_TONES.find((s) => s.id === state.skinTone) ?? SKIN_TONES[1]!;
  const sc = skin.color;
  const mc = skin.shadow;
  const hc = (HAIR_COLORS.find((h) => h.id === state.hairColor) ?? HAIR_COLORS[0]!).color;
  const hs = HAIR_STYLES.find((h) => h.id === state.hairStyle) ?? HAIR_STYLES[0]!;
  const eyes = EYE_STYLES.find((e) => e.id === state.eyeStyle) ?? EYE_STYLES[0]!;

  const equipped = state.equipped;
  const backSvg = drawSlot('back', equipped, clipPrefix, dev);

  let svg = `<svg viewBox="0 -40 200 360" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="glowA"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>

  ${backSvg}

  <rect x="${AX - 20}" y="${LEG_Y}" width="12" height="${LEG_H}" rx="6" fill="${sc}"/>
  <rect x="${AX + 8}" y="${LEG_Y}" width="12" height="${LEG_H}" rx="6" fill="${sc}"/>

  <ellipse cx="${AX - 18}" cy="${FOOT_Y}" rx="9" ry="5" fill="#e8e4e0"/>
  <ellipse cx="${AX + 18}" cy="${FOOT_Y}" rx="9" ry="5" fill="#e8e4e0"/>

  <path d="M${AX - BODY_W / 2} ${SHORTS_Y} Q${AX - BODY_W / 2} ${SHORTS_Y - 3} ${AX} ${SHORTS_Y - 5} Q${AX + BODY_W / 2} ${SHORTS_Y - 3} ${AX + BODY_W / 2} ${SHORTS_Y}
    L${AX + BODY_W / 2} ${SHORTS_Y + SHORTS_H - 4} Q${AX + BODY_W / 2} ${SHORTS_Y + SHORTS_H} ${AX + 16} ${SHORTS_Y + SHORTS_H}
    L${AX + 2} ${SHORTS_Y + SHORTS_H} L${AX} ${SHORTS_Y + SHORTS_H - 4} L${AX - 2} ${SHORTS_Y + SHORTS_H}
    L${AX - 16} ${SHORTS_Y + SHORTS_H} Q${AX - BODY_W / 2} ${SHORTS_Y + SHORTS_H} ${AX - BODY_W / 2} ${SHORTS_Y + SHORTS_H - 4} Z" fill="#5a6a7a"/>

  <rect x="${AX - BODY_W / 2}" y="${BODY_Y}" width="${BODY_W}" height="${BODY_H}" rx="8" fill="${sc}"/>

  <path d="M${AX - BODY_W / 2} ${BODY_Y + 6} Q${AX - BODY_W / 2} ${BODY_Y - 6} ${AX} ${BODY_Y - 10} Q${AX + BODY_W / 2} ${BODY_Y - 6} ${AX + BODY_W / 2} ${BODY_Y + 6}
    L${AX + BODY_W / 2} ${BODY_BOTTOM - 4} Q${AX + BODY_W / 2} ${BODY_BOTTOM} ${AX} ${BODY_BOTTOM + 2} Q${AX - BODY_W / 2} ${BODY_BOTTOM} ${AX - BODY_W / 2} ${BODY_BOTTOM - 4} Z" fill="#e8e4dc"/>
  <path d="M${AX - BODY_W / 2} ${BODY_Y + 6} Q${AX - BODY_W / 2} ${BODY_Y - 6} ${AX} ${BODY_Y - 10} Q${AX + BODY_W / 2} ${BODY_Y - 6} ${AX + BODY_W / 2} ${BODY_Y + 6}" fill="#d8d4cc"/>

  <rect x="${AX - NECK_W / 2}" y="${NECK_Y}" width="${NECK_W}" height="${NECK_H}" rx="5" fill="${sc}"/>

  <ellipse cx="${AX}" cy="${HEAD_Y}" rx="28" ry="30" fill="${sc}"/>

  <ellipse cx="${AX - 18}" cy="${HEAD_Y + 13}" rx="5" ry="3" fill="#e8a090" opacity=".2"/>
  <ellipse cx="${AX + 18}" cy="${HEAD_Y + 13}" rx="5" ry="3" fill="#e8a090" opacity=".2"/>

  ${hs.path(hc)}

  ${eyes.render(AX, HEAD_Y + 3)}

  <path d="M${AX - 6} ${HEAD_Y + 17} Q${AX} ${HEAD_Y + 22} ${AX + 6} ${HEAD_Y + 17}" fill="none" stroke="${mc}" stroke-width="1.5" stroke-linecap="round"/>`;

  svg += `<line x1="${AX - BODY_W / 2 + 8}" y1="${SHOULDER_Y - 6}" x2="${HAND_L_X}" y2="${HAND_L_Y}" stroke="${sc}" stroke-width="12" stroke-linecap="round"/>`;
  svg += `<line x1="${AX + BODY_W / 2 - 8}" y1="${SHOULDER_Y - 6}" x2="${HAND_R_X}" y2="${HAND_R_Y}" stroke="${sc}" stroke-width="12" stroke-linecap="round"/>`;
  svg += `<circle cx="${HAND_L_X}" cy="${HAND_L_Y}" r="9" fill="${sc}"/>`;
  svg += `<circle cx="${HAND_R_X}" cy="${HAND_R_Y}" r="9" fill="${sc}"/>`;

  const slotOrderRest = ['legs', 'body', 'belt', 'feet', 'neck', 'hands', 'head', 'face'] as const;
  for (const slot of slotOrderRest) {
    svg += drawSlot(slot, equipped, clipPrefix, dev);
  }

  state.heldItems.forEach((id, idx) => {
    const item = WARDROBE_ITEMS.find((i) => i.id === id);
    if (!item) return;
    let hx = idx === 0 ? HAND_L_X : HAND_R_X;
    let hy = idx === 0 ? HAND_L_Y : HAND_R_Y;
    if (dev?.targetId === id) {
      hx += dev.offset.x;
      hy += dev.offset.y;
    }
    const hSvg = item.rodColor
      ? heldRod(hx, hy, item.rodColor as string, item.rodAccent as string)
      : item.bucketColor
        ? heldBucket(hx, hy, item.bucketColor as string, item.bucketRim as string)
        : item.heldSvg
          ? heldMisc(hx, hy, item.heldSvg as string)
          : '';
    if (dev?.targetId === id && hSvg) {
      svg += `<g transform="translate(${hx},${hy}) scale(${dev.scale}) translate(${-hx},${-hy})">${hSvg}</g>`;
    } else {
      svg += hSvg;
    }
  });

  if (state.pet) {
    const pet = WARDROBE_ITEMS.find((i) => i.id === state.pet);
    if (pet?.petSvg) {
      let px = PET_X + PET_OX;
      let py = PET_Y + PET_OY;
      const s = dev?.targetId === state.pet ? dev.scale : PET_S;
      if (dev?.targetId === state.pet) {
        px += dev.offset.x;
        py += dev.offset.y;
      }
      svg += `<g transform="translate(${px},${py}) scale(${s})">${pet.petSvg as string}</g>`;
    }
  }

  svg += '</svg>';
  return svg;
}
