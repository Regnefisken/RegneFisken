import {
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  type Group as ThreeGroup,
  type Mesh as ThreeMesh,
} from 'three';

/** Legacy `createMermaidStone()` — grå sten før level 17. */
export function createMermaidStone(): ThreeMesh {
  const stenMat = new MeshStandardMaterial({ color: 0x888888, roughness: 0.9, flatShading: true });
  const stenGeo = new DodecahedronGeometry(1.8, 1);
  const sten = new Mesh(stenGeo, stenMat);
  sten.scale.set(1.2, 0.7, 1);
  sten.position.y = 0.5;
  sten.castShadow = true;
  sten.receiveShadow = true;
  return sten;
}

export interface MermaidNpcBuild {
  model: ThreeGroup;
  krop: ThreeMesh;
}

/**
 * Legacy `createMermaidNPC()` 1:1 — havfrue + sten.
 * `userData`: havfrue, haarGroup, haleTop, hofte, krop, animation refs.
 */
export function buildMermaidNpcMesh(): MermaidNpcBuild {
  const npcGroup = new Group();
  const hudMat = new MeshStandardMaterial({ color: 0xffdcb3, roughness: 0.4 });
  const haleMat = new MeshStandardMaterial({ color: 0x00cc99, roughness: 0.2, metalness: 0.3 });
  const haarMat = new MeshStandardMaterial({ color: 0xc83200, roughness: 0.8 });
  const brystMat = new MeshStandardMaterial({ color: 0xff88aa, roughness: 0.3 });
  const stenMat = new MeshStandardMaterial({ color: 0x888888, roughness: 0.9, flatShading: true });
  const ojenHvideMat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const irisMat = new MeshStandardMaterial({ color: 0x00aaee, roughness: 0.1 });
  const pupilMat = new MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
  const brynMat = new MeshStandardMaterial({ color: 0x8a2300, roughness: 0.9 });
  const laebeMat = new MeshStandardMaterial({ color: 0xff6688, roughness: 0.4 });
  const blushMat = new MeshStandardMaterial({ color: 0xff99aa, roughness: 1.0 });

  const stenGeo = new DodecahedronGeometry(1.8, 1);
  const sten = new Mesh(stenGeo, stenMat);
  sten.scale.set(1.2, 0.7, 1);
  sten.position.y = 0.5;
  sten.castShadow = true;
  sten.receiveShadow = true;
  npcGroup.add(sten);

  const havfrue = new Group();
  havfrue.position.set(0, 1.7, 0);
  npcGroup.add(havfrue);

  const kropGeo = new CylinderGeometry(0.2, 0.2, 0.75, 16, 1);
  const krop = new Mesh(kropGeo, hudMat);
  krop.position.y = 0.65;
  krop.castShadow = true;
  havfrue.add(krop);

  const kropCapGeo = new SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const kropCapTop = new Mesh(kropCapGeo, hudMat);
  kropCapTop.position.y = 0.65 + 0.375;
  havfrue.add(kropCapTop);
  const kropCapBot = new Mesh(kropCapGeo, hudMat);
  kropCapBot.position.y = 0.65 - 0.375;
  kropCapBot.rotation.x = Math.PI;
  havfrue.add(kropCapBot);

  const skalGeo = new SphereGeometry(0.1, 8, 8);
  const skalV = new Mesh(skalGeo, brystMat);
  skalV.position.set(-0.1, 0.75, 0.18);
  skalV.scale.z = 0.5;
  havfrue.add(skalV);
  const skalH = new Mesh(skalGeo, brystMat);
  skalH.position.set(0.1, 0.75, 0.18);
  skalH.scale.z = 0.5;
  havfrue.add(skalH);

  const halsGeo = new CylinderGeometry(0.06, 0.08, 0.2, 16);
  const hals = new Mesh(halsGeo, hudMat);
  hals.position.y = 1.0;
  havfrue.add(hals);

  const hovedGeo = new SphereGeometry(0.25, 32, 32);
  const hoved = new Mesh(hovedGeo, hudMat);
  hoved.position.y = 1.25;
  hoved.castShadow = true;
  havfrue.add(hoved);

  const scleraGeo = new SphereGeometry(0.04, 16, 16);
  const scleraV = new Mesh(scleraGeo, ojenHvideMat);
  scleraV.position.set(-0.09, 1.3, 0.21);
  havfrue.add(scleraV);
  const irisGeo = new SphereGeometry(0.025, 16, 16);
  const irisV = new Mesh(irisGeo, irisMat);
  irisV.position.set(-0.09, 1.3, 0.235);
  havfrue.add(irisV);
  const pupilGeo = new SphereGeometry(0.012, 16, 16);
  const pupilV = new Mesh(pupilGeo, pupilMat);
  pupilV.position.set(-0.09, 1.3, 0.255);
  havfrue.add(pupilV);

  const scleraH = new Mesh(scleraGeo, ojenHvideMat);
  scleraH.position.set(0.09, 1.3, 0.21);
  havfrue.add(scleraH);
  const irisH = new Mesh(irisGeo, irisMat);
  irisH.position.set(0.09, 1.3, 0.235);
  havfrue.add(irisH);
  const pupilH = new Mesh(pupilGeo, pupilMat);
  pupilH.position.set(0.09, 1.3, 0.255);
  havfrue.add(pupilH);

  const brynGeo = new CylinderGeometry(0.006, 0.006, 0.06, 8);
  const brynVL = new Mesh(brynGeo, brynMat);
  brynVL.position.set(-0.09, 1.36, 0.22);
  brynVL.rotation.set(0.2, -0.2, Math.PI / 2 + 0.15);
  havfrue.add(brynVL);
  const brynHL = new Mesh(brynGeo, brynMat);
  brynHL.position.set(0.09, 1.36, 0.22);
  brynHL.rotation.set(0.2, 0.2, Math.PI / 2 - 0.15);
  havfrue.add(brynHL);

  const naeseGeo = new SphereGeometry(0.025, 16, 16);
  const naese = new Mesh(naeseGeo, hudMat);
  naese.position.set(0, 1.25, 0.245);
  naese.scale.set(1, 0.8, 1);
  havfrue.add(naese);

  const blushGeo = new SphereGeometry(0.035, 16, 16);
  const blushV = new Mesh(blushGeo, blushMat);
  blushV.position.set(-0.13, 1.23, 0.2);
  blushV.scale.z = 0.2;
  havfrue.add(blushV);
  const blushH = new Mesh(blushGeo, blushMat);
  blushH.position.set(0.13, 1.23, 0.2);
  blushH.scale.z = 0.2;
  havfrue.add(blushH);

  const mundGeo = new TorusGeometry(0.025, 0.006, 8, 16, Math.PI * 0.9);
  const mund = new Mesh(mundGeo, laebeMat);
  mund.position.set(0, 1.2, 0.235);
  mund.rotation.set(0.1, 0, Math.PI * 1.05);
  havfrue.add(mund);

  const haarGroup = new Group();
  const haarTopGeo = new SphereGeometry(0.275, 32, 32);
  const haarTop = new Mesh(haarTopGeo, haarMat);
  haarTop.position.set(0, 1.32, -0.06);
  haarTop.scale.set(0.88, 1, 0.96);
  haarGroup.add(haarTop);

  const knoldGeo = new SphereGeometry(0.14, 16, 16);
  const knoldV = new Mesh(knoldGeo, haarMat);
  knoldV.position.set(-0.18, 1.48, -0.05);
  knoldV.castShadow = true;
  haarGroup.add(knoldV);
  const knoldH = new Mesh(knoldGeo, haarMat);
  knoldH.position.set(0.18, 1.48, -0.05);
  knoldH.castShadow = true;
  haarGroup.add(knoldH);

  const totGeo = new CylinderGeometry(0.02, 0.02, 0.12, 8, 1);
  const totV = new Mesh(totGeo, haarMat);
  totV.position.set(-0.16, 1.26, 0.12);
  totV.rotation.set(0.1, 0, 0.3);
  totV.castShadow = true;
  haarGroup.add(totV);
  const totH = new Mesh(totGeo, haarMat);
  totH.position.set(0.16, 1.26, 0.12);
  totH.rotation.set(0.1, 0, -0.3);
  totH.castShadow = true;
  haarGroup.add(totH);

  const hestehaleGeo = new ConeGeometry(0.18, 1.1, 16);
  hestehaleGeo.translate(0, -0.5, 0);
  const hestehaleMidt = new Mesh(hestehaleGeo, haarMat);
  hestehaleMidt.position.set(0, 1.25, -0.2);
  hestehaleMidt.rotation.x = 0.2;
  hestehaleMidt.castShadow = true;
  haarGroup.add(hestehaleMidt);
  const hestehaleVenstre = new Mesh(hestehaleGeo, haarMat);
  hestehaleVenstre.position.set(-0.05, 1.25, -0.18);
  hestehaleVenstre.rotation.set(0.25, 0, -0.3);
  hestehaleVenstre.castShadow = true;
  haarGroup.add(hestehaleVenstre);
  const hestehaleHoejre = new Mesh(hestehaleGeo, haarMat);
  hestehaleHoejre.position.set(0.05, 1.25, -0.18);
  hestehaleHoejre.rotation.set(0.25, 0, 0.3);
  hestehaleHoejre.castShadow = true;
  haarGroup.add(hestehaleHoejre);

  havfrue.add(haarGroup);

  const armGeo = new CylinderGeometry(0.06, 0.04, 0.7, 16);
  const armV = new Mesh(armGeo, hudMat);
  armV.position.set(-0.22, 0.55, -0.05);
  armV.rotation.set(0.4, 0, -0.4);
  armV.castShadow = true;
  havfrue.add(armV);
  const armH = new Mesh(armGeo, hudMat);
  armH.position.set(0.22, 0.6, -0.05);
  armH.rotation.z = 0.4;
  armH.castShadow = true;
  havfrue.add(armH);

  const hofteGeo = new SphereGeometry(0.24, 16, 16);
  const hofte = new Mesh(hofteGeo, haleMat);
  hofte.position.y = 0.25;
  hofte.castShadow = true;
  havfrue.add(hofte);

  const haleTopGeo = new CylinderGeometry(0.24, 0.15, 0.8, 16);
  const haleTop = new Mesh(haleTopGeo, haleMat);
  haleTop.position.set(0, -0.1, 0.3);
  haleTop.rotation.x = Math.PI / 2.5;
  haleTop.castShadow = true;
  havfrue.add(haleTop);

  const timeOffset = Math.random() * Math.PI * 2;
  npcGroup.userData = {
    isMermaidNPC: true,
    interactable: true,
    type: 'npc',
    isHovered: false,
    originalScale: 1.0,
    hoverScale: 1.08,
    timeOffset,
    havfrue,
    haarGroup,
    haleTop,
    hofte,
    krop,
  };

  return { model: npcGroup, krop };
}
