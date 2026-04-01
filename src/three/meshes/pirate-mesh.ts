import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  type Group as GroupType,
} from 'three';

function sm(
  color: number,
  o: { roughness?: number; metalness?: number; flatShading?: boolean } = {},
) {
  return new MeshStandardMaterial({
    color,
    roughness: o.roughness ?? 0.5,
    metalness: o.metalness ?? 0,
    flatShading: o.flatShading ?? true,
  });
}

/** Legacy `buildPirateMesh()` — Kaptajn Rotteskæg (THREE.Group). */
export function buildPirateMesh(): GroupType {
  const pirate = new Group();

  const mSkin = sm(0xfcd2a8, { roughness: 0.55 });
  const mBeard = sm(0x704214, { roughness: 0.7 });
  const mBlack = sm(0x1a1a1a, { roughness: 0.6 });
  /** Bukse-overdel — skubbes lidt tilbage i dybdebuffer ift. vest. */
  const mBlackPantsTop = mBlack.clone();
  mBlackPantsTop.polygonOffset = true;
  mBlackPantsTop.polygonOffsetFactor = 1;
  mBlackPantsTop.polygonOffsetUnits = 1;
  const mVest = sm(0x2b73b3, { roughness: 0.45 });
  const mWhite = sm(0xffffff, { roughness: 0.5 });
  const mRed = sm(0xd93030, { roughness: 0.45 });
  const mYellow = sm(0xf4c430, { roughness: 0.45 });
  /** Gult på hat — let offset så det ikke z-fighter mod sort kant. */
  const mYellowHat = mYellow.clone();
  mYellowHat.polygonOffset = true;
  mYellowHat.polygonOffsetFactor = -0.6;
  mYellowHat.polygonOffsetUnits = -0.6;
  const mBrown = sm(0x5c3a21, { roughness: 0.5 });
  const mSteel = sm(0x9ca3af, { roughness: 0.5 });
  const mWood = sm(0x5c3a21, { roughness: 0.5 });

  const torso = new Group();
  torso.position.y = 2.2;
  torso.add(new Mesh(new BoxGeometry(1.2, 1.4, 0.7, 4, 4, 3), mWhite));
  for (let i = 0; i < 3; i++) {
    const stripe = new Mesh(new BoxGeometry(1.22, 0.2, 0.72, 3, 2, 2), mRed);
    stripe.position.y = 0.3 - i * 0.35;
    torso.add(stripe);
  }
  torso.add(new Mesh(new BoxGeometry(1.34, 1.52, 0.24, 4, 4, 2), mVest).translateZ(-0.32));
  const vestL = new Mesh(new BoxGeometry(0.48, 1.52, 0.92, 3, 4, 3), mVest);
  vestL.position.set(-0.46, 0, 0.08);
  torso.add(vestL);
  const vestR = new Mesh(new BoxGeometry(0.48, 1.52, 0.92, 3, 4, 3), mVest);
  vestR.position.set(0.46, 0, 0.08);
  torso.add(vestR);
  torso.add(new Mesh(new BoxGeometry(1.3, 0.3, 0.8, 4, 2, 3), mBrown).translateY(-0.65));
  torso.add(new Mesh(new BoxGeometry(0.4, 0.4, 0.85, 3, 3, 3), mYellow).translateY(-0.65));
  pirate.add(torso);

  const headGroup = new Group();
  headGroup.position.set(0, 3.4, 0);
  headGroup.rotation.x = -0.2;
  headGroup.add(new Mesh(new BoxGeometry(1.0, 1.0, 1.0, 5, 5, 5), mSkin));

  const eyeZ = 0.59;
  const eyeSegs = 16;
  const leftWhite = new Mesh(new SphereGeometry(0.185, eyeSegs, eyeSegs), mWhite);
  leftWhite.position.set(-0.245, 0.175, eyeZ);
  headGroup.add(leftWhite);
  const leftPupil = new Mesh(new SphereGeometry(0.092, 12, 10), mBlack);
  leftPupil.position.set(-0.245, 0.175, eyeZ + 0.15);
  headGroup.add(leftPupil);
  const leftGlint = new Mesh(new SphereGeometry(0.028, 8, 6), mWhite);
  leftGlint.position.set(-0.21, 0.205, eyeZ + 0.22);
  headGroup.add(leftGlint);

  const rightEyePatch = new Mesh(new BoxGeometry(0.35, 0.35, 0.05), mBlack);
  rightEyePatch.position.set(0.245, 0.175, eyeZ + 0.12);
  headGroup.add(rightEyePatch);

  const nose = new Mesh(new BoxGeometry(0.2, 0.2, 0.25, 3, 3, 3), mSkin);
  nose.position.set(0, -0.1, 0.62);
  headGroup.add(nose);

  const browL = new Mesh(new BoxGeometry(0.35, 0.12, 0.15, 3, 2, 2), mBeard);
  browL.position.set(-0.2, 0.32, 0.65);
  browL.rotation.z = -0.4;
  const browR = new Mesh(new BoxGeometry(0.35, 0.12, 0.15, 3, 2, 2), mBeard);
  browR.position.set(0.2, 0.32, 0.65);
  browR.rotation.z = 0.4;
  headGroup.add(browL, browR);

  const stacheL = new Mesh(new BoxGeometry(0.35, 0.15, 0.1, 3, 2, 2), mBeard);
  stacheL.position.set(-0.15, -0.25, 0.6);
  stacheL.rotation.z = -0.2;
  const stacheR = new Mesh(new BoxGeometry(0.35, 0.15, 0.1, 3, 2, 2), mBeard);
  stacheR.position.set(0.15, -0.25, 0.6);
  stacheR.rotation.z = 0.2;
  headGroup.add(stacheL, stacheR);

  const mainBeard = new Mesh(new ConeGeometry(0.65, 0.8, 18), mBeard);
  mainBeard.position.set(0, -0.6, 0.2);
  mainBeard.rotation.y = Math.PI / 6;
  headGroup.add(mainBeard);

  headGroup.add(new Mesh(new BoxGeometry(1.05, 0.25, 1.05, 4, 3, 4), mRed).translateY(0.52));

  const hatGroup = new Group();
  hatGroup.position.y = 0.85;
  hatGroup.add(new Mesh(new BoxGeometry(1.2, 0.6, 1.2, 4, 3, 4), mBlack));
  const brimL = new Mesh(new BoxGeometry(0.8, 0.6, 1.2, 3, 3, 3), mBlack);
  brimL.position.set(-0.8, 0.2, 0);
  brimL.rotation.z = -0.5;
  hatGroup.add(brimL);
  const brimR = new Mesh(new BoxGeometry(0.8, 0.6, 1.2, 3, 3, 3), mBlack);
  brimR.position.set(0.8, 0.2, 0);
  brimR.rotation.z = 0.5;
  hatGroup.add(brimR);
  const hatBand = new Mesh(new BoxGeometry(1.36, 0.14, 1.36), mYellowHat);
  hatBand.position.set(0, -0.28, 0.04);
  hatGroup.add(hatBand);
  const skullG = new Group();
  skullG.add(new Mesh(new BoxGeometry(0.46, 0.34, 0.12), mWhite));
  const skullJaw = new Mesh(new BoxGeometry(0.24, 0.12, 0.12), mWhite);
  skullJaw.position.y = -0.2;
  skullG.add(skullJaw);
  skullG.position.set(0, 0.2, 0.64);
  hatGroup.add(skullG);
  headGroup.add(hatGroup);
  pirate.add(headGroup);

  const legR = new Group();
  legR.position.x = -0.35;
  legR.add(new Mesh(new BoxGeometry(0.45, 0.6, 0.45, 3, 3, 3), mBlackPantsTop).translateY(1.2));
  legR.add(new Mesh(new BoxGeometry(0.55, 0.3, 0.55, 3, 2, 3), mBrown).translateY(0.8));
  legR.add(new Mesh(new BoxGeometry(0.45, 0.6, 0.45, 3, 3, 3), mBrown).translateY(0.4));
  const footR = new Mesh(new BoxGeometry(0.45, 0.3, 0.6, 3, 2, 3), mBrown);
  footR.position.set(0, 0.15, 0.1);
  legR.add(footR);
  pirate.add(legR);

  const legL = new Group();
  legL.position.x = 0.35;
  legL.add(new Mesh(new BoxGeometry(0.45, 0.6, 0.45, 3, 3, 3), mBlackPantsTop).translateY(1.2));
  legL.add(new Mesh(new CylinderGeometry(0.08, 0.04, 0.9, 32), mWood).translateY(0.45));
  pirate.add(legL);

  const armR = new Group();
  armR.position.set(0.8, 2.7, 0);
  armR.add(new Mesh(new BoxGeometry(0.4, 0.9, 0.4, 3, 4, 3), mWhite).translateY(-0.4));
  armR.add(new Mesh(new BoxGeometry(0.3, 0.3, 0.3, 3, 3, 3), mSkin).translateY(-1.0));
  const hook = new Group();
  hook.position.set(0, -1.0, 0.05);
  hook.add(new Mesh(new TorusGeometry(0.12, 0.03, 8, 16), mSteel).rotateX(Math.PI / 2));
  armR.add(hook);
  armR.rotation.set(-0.7, 0, -0.3);
  pirate.add(armR);

  const armL = new Group();
  armL.position.set(-0.8, 2.7, 0);
  armL.add(new Mesh(new BoxGeometry(0.4, 0.9, 0.4, 3, 4, 3), mWhite).translateY(-0.4));
  armL.add(new Mesh(new BoxGeometry(0.3, 0.3, 0.3, 3, 3, 3), mSkin).translateY(-1.0));
  armL.rotation.set(-0.2, 0, 0.2);
  pirate.add(armL);

  const earring = new Mesh(new TorusGeometry(0.08, 0.02, 12, 10), mYellow);
  earring.position.set(0.52, 3.4, 0);
  earring.rotation.y = Math.PI / 2;
  pirate.add(earring);

  pirate.userData = {
    isPirateNPC: true,
    torso,
    headGroup,
    hatGroup,
    armL,
    armR,
    timeOffset: Math.random() * Math.PI * 2,
    originalScale: 0.45,
    hoverScale: 0.49,
    isHovered: false,
  };

  pirate.scale.setScalar(0.45);
  return pirate;
}
