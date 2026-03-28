import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Group as GroupType,
} from 'three';

/** Legacy `buildPirateChestMesh` — brun kiste + guldbånd + lås. */
export function buildPirateChestMesh(): GroupType {
  const g = new Group();
  const body = new Mesh(
    new BoxGeometry(0.5, 0.3, 0.35),
    new MeshStandardMaterial({ color: 0x8b4513, roughness: 0.85, flatShading: true }),
  );
  body.position.y = 0.15;
  const lid = new Mesh(
    new BoxGeometry(0.52, 0.08, 0.37),
    new MeshStandardMaterial({ color: 0x6b3410, roughness: 0.8, flatShading: true }),
  );
  lid.position.set(0, 0.34, 0);
  const band1 = new Mesh(
    new BoxGeometry(0.54, 0.03, 0.38),
    new MeshStandardMaterial({ color: 0xdaa520, roughness: 0.3, metalness: 0.6, flatShading: true }),
  );
  band1.position.set(0, 0.15, 0);
  const band2 = band1.clone();
  band2.position.y = 0.3;
  const lock = new Mesh(
    new BoxGeometry(0.06, 0.08, 0.02),
    new MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8, flatShading: true }),
  );
  lock.position.set(0, 0.22, 0.19);
  const cheese = new Mesh(
    new CylinderGeometry(0.06, 0.06, 0.04, 12),
    new MeshStandardMaterial({ color: 0xffe066, roughness: 0.4, flatShading: true }),
  );
  cheese.position.set(0, 0.22, 0);
  g.add(body, lid, band1, band2, lock, cheese);
  g.userData.isPirateChest = true;
  return g;
}
