import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & DATA
// ═══════════════════════════════════════════════════════════════════

const EXISTING_IDS = new Set([
  'fisk_torsk','fisk_sild','fisk_skrubbe','fisk_makrel','fisk_hornfisk','fisk_roedspette',
  'fisk_ising','fisk_fjaesing','fisk_skalle','fisk_aborre','fisk_sej','fisk_brasen',
  'fisk_rudskalle','fisk_aalekvabbe','fisk_gedde','fisk_ulk','fisk_hork','fisk_frø',
  'fisk_soestjerne','fisk_klovnefisk','fisk_papegojefisk','fisk_blaa_tang','fisk_muraene',
  'fisk_kejserfisk','fisk_piratfisk','fisk_laks','fisk_havørred','fisk_pighvar','fisk_aal',
  'fisk_stør','fisk_krabbe','fisk_havkat','fisk_sandart','fisk_kulmule','fisk_havtaske',
  'fisk_knurhane','fisk_lange','fisk_multe','fisk_suder','fisk_karpe','fisk_brosme',
  'fisk_blaeksprutte','fisk_kaempe_tun','fisk_haj','fisk_svaerdfisk','fisk_gyldne_karpe',
  'fisk_hummer','fisk_klumpfisk','fisk_sildehaj','fisk_rokke','fisk_petersfisk',
  'fisk_helleflynder','fisk_plesiosaurus','fisk_axolotl','fisk_gnavne_gorm',
  'fisk_gylden_frø','fisk_hvidhaj','fisk_regnbueørred','fisk_grundling','fisk_løje',
  'fisk_lygtefisk','fisk_fangtandfisk','fisk_dybhavsål','fisk_havedderkop',
  'fisk_ørkengrundling','fisk_sandbarbe','fisk_niltilapia','fisk_oase_malle',
  'fisk_lodde','fisk_hellefisk','fisk_narhval','fisk_spøgelsesål','fisk_skeletfisk',
  'fisk_sumptorsk','fisk_kaptajnens_karpe','fisk_piratål','fisk_giftig_søslange',
  'fisk_dødningehaj','fisk_guldtentakel','fisk_blind_grottefisk','fisk_grottekrebs',
  'fisk_drypstensål','fisk_underjordisk_malle','fisk_soeuhyre'
]);

const TAIL_TYPES = [
  { value: 'standard', label: 'Standard hale' },
  { value: 'forked', label: 'Gaffelhale' },
  { value: 'flat', label: 'Flad hale' },
  { value: 'eel', label: 'Ål-hale' },
  { value: 'thin', label: 'Tynd hale' },
  { value: 'chunky', label: 'Bred kraftig hale' },
  { value: 'shark', label: 'Hajhale' },
  { value: 'dino', label: 'Dinosaur-hale' },
  { value: 'whip', label: 'Piskehale' },
  { value: 'star', label: 'Stjerne (ingen)' },
  { value: 'none', label: 'Ingen hale' },
];

const CREATURE_TYPES = [
  { value: 'none', label: 'Normal fisk' },
  { value: 'isEel', label: 'Ål' },
  { value: 'isFrog', label: 'Frø' },
  { value: 'isStarfish', label: 'Søstjerne' },
  { value: 'isCrab', label: 'Krabbe' },
  { value: 'isOctopus', label: 'Blæksprutte' },
  { value: 'isLobster', label: 'Hummer' },
  { value: 'isRay', label: 'Rokke' },
  { value: 'isPiranha', label: 'Piranha' },
  { value: 'isGoldenCarp', label: 'Gyldne Karpe' },
];

const RARITIES = ['Almindelig', 'Sjælden', 'Legendarisk'];

const LOCATIONS = [
  { id: 'pier', name: 'Den Gamle Mole', emoji: '🏚' },
  { id: 'smaragd', name: 'Skovsøen', emoji: '🌲' },
  { id: 'abyss', name: 'Dybet', emoji: '🌊' },
  { id: 'tropical_island', name: 'Den Tropiske Ø', emoji: '🏝' },
  { id: 'desert_lake', name: 'Ørkensøen', emoji: '🏜' },
  { id: 'arctic_sea', name: 'Ishavet', emoji: '🧊' },
  { id: 'forbidden', name: 'Den Forbudte Sø', emoji: '☠' },
  { id: 'cave', name: 'Den Mørke Grotte', emoji: '🦇' },
];

const BIOME_PALETTES = {
  'Hav / Mole': [0x8B7355, 0x6B8CAE, 0xC4A882, 0x7A8A7A],
  'Skov / Ferskvand': [0x5A8A5A, 0x5A7A5A, 0xC0B890, 0xA8B5A0],
  'Dybet': [0x1A1A3A, 0x1A1210, 0x2A1A3A, 0x3A3A4A],
  'Tropisk': [0xFF6A00, 0x00CED1, 0x1E90FF, 0xFFD700],
  'Ørken': [0xD2B48C, 0xB8944A, 0x5F9EA0],
  'Ishav': [0xA8C0A8, 0x5A4A3A, 0x7A8A9A],
  'Forbudt': [0xC8D8E8, 0x1A1A1A, 0x3A4A2A],
  'Grotte': [0xF0E8E0, 0xE8E8F0, 0xB0A89A, 0x4A4A4A],
};

const ARCHETYPE_PRESETS = [
  { name: 'Standard rund', bodyShape: [0.8, 0.9, 1.2], tail: 'standard', speed: 1.2, scale: 0.9, creature: 'none', flags: {} },
  { name: 'Fladfisk', bodyShape: [1.4, 0.3, 1.2], tail: 'flat', speed: 0.8, scale: 0.9, creature: 'none', flags: { flat: true } },
  { name: 'Ål / Slange', bodyShape: [0.3, 0.3, 2.5], tail: 'eel', speed: 0.7, scale: 1.0, creature: 'isEel', flags: {} },
  { name: 'Stor rovfisk', bodyShape: [0.9, 1.0, 2.0], tail: 'shark', speed: 1.8, scale: 2.0, creature: 'none', flags: { finUp: true } },
  { name: 'Krabbe', bodyShape: [1.3, 0.5, 1.0], tail: 'none', speed: 0.5, scale: 0.7, creature: 'isCrab', flags: {} },
  { name: 'Blæksprutte', bodyShape: [1.0, 1.0, 1.0], tail: 'none', speed: 0.5, scale: 1.0, creature: 'isOctopus', flags: {} },
  { name: 'Hummer', bodyShape: [1.2, 0.5, 1.5], tail: 'none', speed: 0.6, scale: 1.2, creature: 'isLobster', flags: {} },
  { name: 'Dybhavsfisk', bodyShape: [1.0, 1.0, 0.9], tail: 'standard', speed: 0.4, scale: 0.6, creature: 'none', flags: { lure: true } },
  { name: 'Lang hornfisk', bodyShape: [0.4, 0.4, 2.5], tail: 'thin', speed: 1.8, scale: 1.1, creature: 'none', flags: { longBeak: true } },
  { name: 'Rokke', bodyShape: [2.5, 0.2, 2.0], tail: 'whip', speed: 1.0, scale: 1.5, creature: 'isRay', flags: {} },
];

const RODS = [
  { value: '', label: 'Ingen krav' },
  { value: 'rod_havblaa', label: 'Havblå stang' },
  { value: 'rod_mahogni', label: 'Mahogni stang' },
];

const BAITS = [
  { value: '', label: 'Ingen krav' },
  { value: 'bait', label: 'Standard lokkemad' },
  { value: 'hvalbof', label: 'Hvalbøf' },
  { value: 'koedklump', label: 'Kødklump' },
];

const RARITY_DEFAULTS = {
  'Almindelig': { weightRange: [1, 5], value: 25, xp: 8, maxDisplay: 2.15 },
  'Sjælden': { weightRange: [2, 12], value: 40, xp: 15, maxDisplay: 2.55 },
  'Legendarisk': { weightRange: [5, 30], value: 80, xp: 35, maxDisplay: 2.95 },
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const intToHex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');
const hexToInt = (s) => parseInt(s.replace('#', ''), 16);
const slugify = (s) => s.toLowerCase().replace(/[æ]/g,'ae').replace(/[ø]/g,'oe').replace(/[å]/g,'aa').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

function darkenColor(hex, factor = 0.7) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(factor);
  return c.getHex();
}

// ═══════════════════════════════════════════════════════════════════
// FISH GEOMETRY (LatheGeometry-based, matching game spec)
// ═══════════════════════════════════════════════════════════════════

function createFishLatheGeometry(segments = 32) {
  const profileX = [0.02, 0.35, 0.65, 0.82, 0.75, 0.50, 0.22, 0.08];
  const profileY = [0.00, 0.12, 0.30, 0.50, 0.65, 0.80, 0.92, 1.00];
  const points = [];
  const steps = segments;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let idx = t * (profileX.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, profileX.length - 1);
    const frac = idx - lo;
    const sm = frac * frac * (3 - 2 * frac);
    const r = lerp(profileX[lo], profileX[hi], sm);
    const y = lerp(profileY[lo], profileY[hi], sm) * 2.0;
    points.push(new THREE.Vector2(r, y));
  }
  const geo = new THREE.LatheGeometry(points, segments);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

function createScaleTexture(color, size = 192) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = new THREE.Color(color);
  const r = Math.floor(c.r * 255), g = Math.floor(c.g * 255), b = Math.floor(c.b * 255);
  // base gradient
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.7);
  grad.addColorStop(0, `rgb(${Math.min(255,r+30)},${Math.min(255,g+30)},${Math.min(255,b+30)})`);
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(1, `rgb(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // scale pattern
  const scaleSize = size / 12;
  ctx.globalAlpha = 0.15;
  for (let row = 0; row < 14; row++) {
    const offset = (row % 2) * scaleSize * 0.5;
    for (let col = -1; col < 14; col++) {
      const cx = col * scaleSize + offset;
      const cy = row * scaleSize;
      ctx.beginPath();
      ctx.arc(cx, cy, scaleSize * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${Math.max(0,r-60)},${Math.max(0,g-60)},${Math.max(0,b-60)},0.3)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════
// THREE.JS FISH RENDERER
// ═══════════════════════════════════════════════════════════════════

class FishRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 1.5, 4);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 5, 5);
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-3, 2, -3);
    this.scene.add(fill);

    // grid
    this.grid = new THREE.GridHelper(8, 16, 0x333355, 0x222244);
    this.grid.visible = false;
    this.scene.add(this.grid);

    this.fishGroup = new THREE.Group();
    this.scene.add(this.fishGroup);

    this.clock = new THREE.Clock();
    this.animating = true;
    this.paused = false;
    this.config = null;
    this.textureCache = {};

    // orbit
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.spherical = { theta: 0, phi: Math.PI / 6, radius: 4 };
    this.target = new THREE.Vector3(0, 0.5, 0);
    this._setupControls();
    this._updateCamera();
  }

  _setupControls() {
    const c = this.canvas;
    c.addEventListener('mousedown', (e) => { this.isDragging = true; this.prevMouse = { x: e.clientX, y: e.clientY }; });
    c.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      if (e.buttons === 1) {
        this.spherical.theta -= dx * 0.008;
        this.spherical.phi = clamp(this.spherical.phi - dy * 0.008, 0.1, Math.PI - 0.1);
      } else if (e.buttons === 2) {
        const right = new THREE.Vector3().setFromSpherical(new THREE.Spherical(1, this.spherical.phi, this.spherical.theta + Math.PI / 2)).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        this.target.addScaledVector(right, -dx * 0.005);
        this.target.addScaledVector(up, dy * 0.005);
      }
      this.prevMouse = { x: e.clientX, y: e.clientY };
      this._updateCamera();
    });
    c.addEventListener('mouseup', () => { this.isDragging = false; });
    c.addEventListener('mouseleave', () => { this.isDragging = false; });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.spherical.radius = clamp(this.spherical.radius + e.deltaY * 0.005, 1.0, 15.0);
      this._updateCamera();
    }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _updateCamera() {
    const { theta, phi, radius } = this.spherical;
    this.camera.position.set(
      this.target.x + radius * Math.sin(phi) * Math.sin(theta),
      this.target.y + radius * Math.cos(phi),
      this.target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    this.camera.lookAt(this.target);
  }

  resetCamera() {
    this.spherical = { theta: 0, phi: Math.PI / 6, radius: 4 };
    this.target.set(0, 0.5, 0);
    this._updateCamera();
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  getTexture(color) {
    const key = color;
    if (!this.textureCache[key]) {
      this.textureCache[key] = createScaleTexture(color, 256);
    }
    return this.textureCache[key];
  }

  buildFish(config) {
    this.config = config;
    // clear old
    while (this.fishGroup.children.length) {
      const c = this.fishGroup.children[0];
      c.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }});
      this.fishGroup.remove(c);
    }
    this.textureCache = {};

    if (!config) return;

    const group = new THREE.Group();
    const sc = (config.scale || 1) * 0.55;
    group.scale.setScalar(sc);

    const [sx, sy, sz] = config.bodyShape || [1, 1, 1];
    const bodyColor = config.color ?? 0x888888;
    const finColor = darkenColor(bodyColor, 0.7);

    // creature branch
    if (config.isCrab) { this._buildCrab(group, config); }
    else if (config.isOctopus) { this._buildOctopus(group, config); }
    else if (config.isLobster) { this._buildLobster(group, config); }
    else if (config.isStarfish) { this._buildStarfish(group, config); }
    else if (config.isFrog) { this._buildFrog(group, config); }
    else if (config.isRay) { this._buildRay(group, config); }
    else { this._buildStandardFish(group, config); }

    this.fishGroup.add(group);
    this._fishMeshGroup = group;
  }

  _buildStandardFish(group, config) {
    const [sx, sy, sz] = config.bodyShape || [1, 1, 1];
    const bodyColor = config.color ?? 0x888888;
    const finColor = darkenColor(bodyColor, 0.7);
    const tex = this.getTexture(bodyColor);

    // body
    const lathe = createFishLatheGeometry(32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      map: tex,
      metalness: config.metalness ?? 0.12,
      roughness: config.roughness ?? 0.2,
      clearcoat: 0.35,
      clearcoatRoughness: 0.1,
      emissive: config.emissive ?? new THREE.Color(bodyColor).lerp(new THREE.Color(0x2244aa), 0.1).getHex(),
      emissiveIntensity: config.emissiveIntensity ?? 0.06,
      wireframe: this._wireframe || false,
    });
    const body = new THREE.Mesh(lathe, mat);
    body.scale.set(sz * 0.7, sy * 0.7, sx * 0.7);
    if (config.flat) body.scale.y *= 0.4;
    group.add(body);

    // eyes (unless noEyes)
    if (!config.noEyes) {
      for (const side of [-1, 1]) {
        const eyeG = new THREE.Group();
        const white = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        pupil.position.z = 0.08 * side;
        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 }));
        glint.position.set(0.03, 0.03, 0.1 * side);
        eyeG.add(white, pupil, glint);
        const eyeX = sz * 0.35;
        const eyeY = sy * 0.15;
        const eyeZ = sx * 0.35 * side;
        eyeG.position.set(eyeX, eyeY, eyeZ);
        group.add(eyeG);
      }
    }

    // side fins
    const finMat = new THREE.MeshStandardMaterial({
      color: config.redFins ? 0xcc3333 : finColor,
      metalness: 0.1,
      roughness: 0.4,
      side: THREE.DoubleSide,
      wireframe: this._wireframe || false,
    });
    for (const side of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8), finMat);
      fin.rotation.z = side * 0.8;
      fin.rotation.x = side * 0.3;
      fin.position.set(-sz * 0.05, -sy * 0.25, sx * 0.3 * side);
      group.add(fin);
    }

    // dorsal fin
    if (config.finUp || config.spikes) {
      const count = config.spikes ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, config.spikes ? 0.4 : 0.6, 6),
          finMat
        );
        spike.position.set(-sz * 0.1 + i * 0.25, sy * 0.4, 0);
        group.add(spike);
      }
    }

    // tail
    this._buildTail(group, config, finColor);

    // long beak
    if (config.longBeak) {
      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: finColor, wireframe: this._wireframe || false })
      );
      beak.rotation.z = Math.PI / 2;
      beak.position.set(sz * 0.65, 0, 0);
      group.add(beak);
    }

    // sword
    if (config.sword) {
      const sword = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3, wireframe: this._wireframe || false })
      );
      sword.rotation.z = Math.PI / 2;
      sword.position.set(sz * 0.7, 0, 0);
      group.add(sword);
    }

    // whiskers
    if (config.whiskers) {
      for (const side of [-1, 1]) {
        const wh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4),
          new THREE.MeshStandardMaterial({ color: finColor })
        );
        wh.rotation.z = Math.PI / 4 * side;
        wh.position.set(sz * 0.4, -sy * 0.1, sx * 0.2 * side);
        group.add(wh);
      }
    }

    // lure (anglerfish)
    if (config.lure) {
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4),
        new THREE.MeshStandardMaterial({ color: finColor })
      );
      stalk.position.set(sz * 0.3, sy * 0.5, 0);
      stalk.rotation.z = -0.5;
      group.add(stalk);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x00ccff, emissiveIntensity: 2.0 })
      );
      bulb.position.set(sz * 0.5, sy * 0.65, 0);
      group.add(bulb);
    }

    // ugly head
    if (config.uglyHead) {
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.1, roughness: 0.3, wireframe: this._wireframe || false })
      );
      head.position.set(sz * 0.35, sy * 0.05, 0);
      head.scale.set(1.2, 1.0, 1.1);
      group.add(head);
    }

    // spots
    if (config.spots) {
      const spotColor = typeof config.spots === 'number' ? config.spots : darkenColor(bodyColor, 0.5);
      const spotMat = new THREE.MeshStandardMaterial({ color: spotColor, wireframe: this._wireframe || false });
      for (let i = 0; i < 8; i++) {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), spotMat);
        spot.position.set(
          (Math.random() - 0.3) * sz * 0.6,
          (Math.random() - 0.5) * sy * 0.3,
          (Math.random() - 0.5) * sx * 0.5
        );
        group.add(spot);
      }
    }

    // stripes
    if (config.stripes) {
      const stripeMat = new THREE.MeshStandardMaterial({
        color: darkenColor(bodyColor, 0.5),
        transparent: true,
        opacity: 0.4,
        wireframe: this._wireframe || false,
      });
      for (let i = 0; i < 4; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, sy * 0.6, sx * 0.7), stripeMat);
        stripe.position.set(-sz * 0.15 + i * sz * 0.18, 0, 0);
        group.add(stripe);
      }
    }

    // eel body modification
    if (config.isEel) {
      body.scale.set(sz * 1.2, sy * 0.4, sx * 0.4);
    }
  }

  _buildTail(group, config, finColor) {
    const [sx, sy, sz] = config.bodyShape || [1, 1, 1];
    const tailMat = new THREE.MeshStandardMaterial({
      color: config.redFins ? 0xcc3333 : finColor,
      side: THREE.DoubleSide,
      wireframe: this._wireframe || false,
    });
    const tailGroup = new THREE.Group();
    tailGroup.position.set(-sz * 0.65, 0, 0);
    this._tailGroup = tailGroup;

    switch (config.tail) {
      case 'forked': {
        for (const s of [-1, 1]) {
          const t = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 6), tailMat);
          t.rotation.z = s * 0.5 + Math.PI;
          t.position.set(-0.2, s * 0.15, 0);
          tailGroup.add(t);
        }
        break;
      }
      case 'flat': {
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.6), tailMat);
        tailGroup.add(t);
        break;
      }
      case 'eel': {
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), tailMat);
        t.rotation.z = Math.PI;
        tailGroup.add(t);
        break;
      }
      case 'thin': {
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.6, 4), tailMat);
        t.rotation.z = Math.PI;
        tailGroup.add(t);
        break;
      }
      case 'chunky': {
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 8), tailMat);
        t.rotation.z = Math.PI;
        tailGroup.add(t);
        break;
      }
      case 'shark': {
        const top = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), tailMat);
        top.rotation.z = 0.8 + Math.PI;
        top.position.set(-0.15, 0.2, 0);
        tailGroup.add(top);
        const bot = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), tailMat);
        bot.rotation.z = -0.5 + Math.PI;
        bot.position.set(-0.1, -0.1, 0);
        tailGroup.add(bot);
        break;
      }
      case 'dino': {
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 8), tailMat);
        t.rotation.z = Math.PI;
        tailGroup.add(t);
        break;
      }
      case 'whip': {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.06, 1.0, 6), tailMat);
        t.rotation.z = Math.PI / 2;
        t.position.x = -0.3;
        tailGroup.add(t);
        break;
      }
      case 'none':
      case 'star':
        break;
      default: { // standard
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 8), tailMat);
        t.rotation.z = Math.PI;
        tailGroup.add(t);
      }
    }
    group.add(tailGroup);
  }

  _buildCrab(group, config) {
    const bodyColor = config.color ?? 0xcc4422;
    const mat = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.15, roughness: 0.3, wireframe: this._wireframe || false });
    // body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), mat);
    body.scale.set(1.3, 0.5, 1.0);
    group.add(body);
    // claws
    for (const s of [-1, 1]) {
      const claw = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat);
      claw.position.set(0.4, 0, s * 0.7);
      claw.scale.set(1.3, 0.8, 1.0);
      group.add(claw);
    }
    // legs
    const legMat = new THREE.MeshStandardMaterial({ color: darkenColor(bodyColor, 0.8), wireframe: this._wireframe || false });
    for (let i = 0; i < 3; i++) {
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(config.thinLegs ? 0.015 : 0.03, config.thinLegs ? 0.015 : 0.03, 0.5, 4), legMat);
        leg.rotation.z = s * 0.8;
        leg.position.set(-0.1 + i * 0.2, -0.2, s * 0.5);
        group.add(leg);
      }
    }
    // eyes
    for (const s of [-1, 1]) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4), legMat);
      stalk.position.set(0.3, 0.35, s * 0.2);
      group.add(stalk);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      eye.position.set(0.3, 0.48, s * 0.2);
      group.add(eye);
    }
    this._tailGroup = group; // for animation
  }

  _buildOctopus(group, config) {
    const bodyColor = config.color ?? 0x884488;
    const mat = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.05, roughness: 0.5, wireframe: this._wireframe || false });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), mat);
    head.position.y = 0.3;
    head.scale.set(0.9, 1.1, 0.9);
    group.add(head);
    // tentacles
    const tentMat = new THREE.MeshStandardMaterial({ color: darkenColor(bodyColor, 0.85), wireframe: this._wireframe || false });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.8, 6), tentMat);
      tent.position.set(Math.cos(angle) * 0.25, -0.4, Math.sin(angle) * 0.25);
      tent.rotation.x = Math.cos(angle) * 0.4;
      tent.rotation.z = Math.sin(angle) * 0.4;
      group.add(tent);
    }
    // eyes
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      eye.position.set(0.25, 0.4, s * 0.25);
      group.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      pupil.position.set(0.32, 0.4, s * 0.25);
      group.add(pupil);
    }
    this._tailGroup = group;
  }

  _buildLobster(group, config) {
    const bodyColor = config.color ?? 0xcc3322;
    const mat = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.15, roughness: 0.3, wireframe: this._wireframe || false });
    // body segments
    for (let i = 0; i < 4; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.22 - i * 0.02, 10, 8), mat);
      seg.position.x = -i * 0.3;
      seg.scale.set(1.0, 0.6, 0.8);
      group.add(seg);
    }
    // claws
    for (const s of [-1, 1]) {
      const claw = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat);
      claw.position.set(0.5, 0, s * 0.4);
      claw.scale.set(1.5, 0.6, 0.8);
      group.add(claw);
    }
    // tail fan
    const tailMat = new THREE.MeshStandardMaterial({ color: darkenColor(bodyColor, 0.8), wireframe: this._wireframe || false });
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 6), tailMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -1.1;
    group.add(tail);
    this._tailGroup = group;
  }

  _buildStarfish(group, config) {
    const bodyColor = config.color ?? 0xff6633;
    const mat = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.05, roughness: 0.6, wireframe: this._wireframe || false });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const arm = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), mat);
      arm.position.set(Math.cos(angle) * 0.25, 0, Math.sin(angle) * 0.25);
      arm.rotation.z = -angle - Math.PI / 2;
      arm.rotation.x = Math.PI / 2;
      group.add(arm);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), mat);
    group.add(center);
    this._tailGroup = group;
  }

  _buildFrog(group, config) {
    const bodyColor = config.color ?? 0x44aa44;
    const mat = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.05, roughness: 0.6, wireframe: this._wireframe || false });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 12), mat);
    body.scale.set(0.9, 0.7, 1.0);
    group.add(body);
    // eyes
    for (const s of [-1, 1]) {
      const eyeBase = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat);
      eyeBase.position.set(0.25, 0.35, s * 0.25);
      group.add(eyeBase);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      eye.position.set(0.3, 0.4, s * 0.25);
      group.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      pupil.position.set(0.35, 0.42, s * 0.25);
      group.add(pupil);
    }
    // legs
    const legMat = new THREE.MeshStandardMaterial({ color: darkenColor(bodyColor, 0.85), wireframe: this._wireframe || false });
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), legMat);
      leg.position.set(-0.15, -0.3, s * 0.3);
      leg.rotation.z = s * 0.3;
      group.add(leg);
    }
    this._tailGroup = group;
  }

  _buildRay(group, config) {
    const bodyColor = config.color ?? 0x6666aa;
    const mat = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 0.1, roughness: 0.3, side: THREE.DoubleSide, wireframe: this._wireframe || false });
    // flat disc body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 8), mat);
    body.scale.set(1.5, 0.15, 1.2);
    group.add(body);
    // tail whip
    const tailMat = new THREE.MeshStandardMaterial({ color: darkenColor(bodyColor, 0.7), wireframe: this._wireframe || false });
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 1.2, 6), tailMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.9;
    group.add(tail);
    this._tailGroup = group;
    // eyes
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      eye.position.set(0.2, 0.12, s * 0.3);
      group.add(eye);
    }
  }

  setWireframe(v) {
    this._wireframe = v;
    if (this.config) this.buildFish(this.config);
  }

  setGrid(v) { this.grid.visible = v; }

  animate() {
    if (!this.animating) return;
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();
    const speed = this.config?.speed ?? 1.0;

    if (this._fishMeshGroup && !this.paused) {
      this._fishMeshGroup.rotation.y = t * speed * 0.85;
      this._fishMeshGroup.position.y = Math.sin(t * 2) * 0.18;
      if (this._tailGroup && this._tailGroup !== this._fishMeshGroup) {
        this._tailGroup.rotation.y = Math.sin(t * 12) * 0.35;
      }
    } else if (this._fishMeshGroup && this.paused) {
      // gentle idle wiggle
      if (this._tailGroup && this._tailGroup !== this._fishMeshGroup) {
        this._tailGroup.rotation.y = Math.sin(t * 8) * 0.2;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.animating = false;
    this.renderer.dispose();
  }
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT STATE
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_STATE = {
  id: 'fisk_ny_fisk',
  name: 'Ny Fisk',
  rarity: 'Almindelig',
  primaryAreas: ['pier'],
  requiredRod: '',
  requiredBait: '',
  itemType: 'fish',
  color: 0x8B7355,
  bodyShape: [0.8, 0.9, 1.2],
  tail: 'standard',
  speed: 1.2,
  scale: 0.9,
  creatureType: 'none',
  flat: false,
  spots: false,
  stripes: false,
  redFins: false,
  longBeak: false,
  spikes: false,
  uglyHead: false,
  finUp: false,
  sword: false,
  whiskers: false,
  lure: false,
  noEyes: false,
  emissive: null,
  emissiveIntensity: 0.06,
  metalness: 0.12,
  roughness: 0.2,
  maxDisplayScale: null,
  thinLegs: false,
  bellyColor: null,
  animPaused: false,
  showGrid: false,
  showWireframe: false,
  activeTab: 'shape',
};

// ═══════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const Slider = ({ label, value, min, max, step, onChange, unit = '' }) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        type="number"
        value={value}
        min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || min)}
        className="w-16 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-right text-gray-200 focus:border-cyan-500 focus:outline-none"
      />
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`
      }}
    />
  </div>
);

const Select = ({ label, value, options, onChange }) => (
  <div className="mb-3">
    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
    >
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, checked, onChange, disabled = false }) => (
  <label className={`flex items-center gap-2 py-1 cursor-pointer ${disabled ? 'opacity-40' : 'hover:bg-gray-800/50'} rounded px-1 transition-colors`}>
    <input
      type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="w-3.5 h-3.5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 bg-gray-800 cursor-pointer"
    />
    <span className="text-sm text-gray-300">{label}</span>
  </label>
);

const ColorSwatch = ({ color, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-7 h-7 rounded border-2 transition-all hover:scale-110 ${selected ? 'border-cyan-400 shadow-lg shadow-cyan-400/30' : 'border-gray-600'}`}
    style={{ backgroundColor: intToHex(color) }}
    title={`0x${color.toString(16).toUpperCase().padStart(6, '0')}`}
  />
);

// ═══════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════

function validate(state) {
  const checks = [];
  const ok = (msg) => checks.push({ ok: true, msg });
  const fail = (msg) => checks.push({ ok: false, msg });
  const warn = (msg) => checks.push({ ok: 'warn', msg });

  state.id.startsWith('fisk_') ? ok('ID starter med fisk_') : fail('ID skal starte med fisk_');
  state.id && state.id.length > 5 ? ok('ID er sat') : fail('ID er for kort');
  EXISTING_IDS.has(state.id) ? warn(`ID "${state.id}" eksisterer allerede — overskriver`) : ok('ID er unikt');
  state.name && state.name.length > 0 ? ok('Navn er sat') : fail('Navn mangler');
  RARITIES.includes(state.rarity) ? ok(`Rarity: ${state.rarity}`) : fail('Ugyldig rarity');
  state.primaryAreas.length >= 1 ? ok(`${state.primaryAreas.length} lokation(er) valgt`) : fail('Mindst 1 lokation krævet');
  const [sx, sy, sz] = state.bodyShape;
  (sx >= 0.1 && sx <= 5 && sy >= 0.1 && sy <= 5 && sz >= 0.1 && sz <= 5) ? ok('bodyShape er inden for rammer') : fail('bodyShape værdier skal være 0.1-5.0');
  TAIL_TYPES.some(t => t.value === state.tail) ? ok(`Hale: ${state.tail}`) : fail('Ugyldig haletype');
  (state.speed >= 0.1 && state.speed <= 3.5) ? ok(`Speed: ${state.speed}`) : (state.speed > 3.5 ? warn('Speed > 3.5 ser absurd ud') : fail('Speed skal være 0.1-3.5'));
  (state.scale >= 0.3 && state.scale <= 5.0) ? ok(`Scale: ${state.scale}`) : fail('Scale skal være 0.3-5.0');
  (state.color >= 0 && state.color <= 0xFFFFFF) ? ok('Farve er gyldig') : fail('Ugyldig farve');

  const traits = [state.spots, state.stripes, state.redFins, state.longBeak, state.spikes, state.uglyHead, state.finUp, state.sword, state.whiskers, state.lure, state.noEyes, state.thinLegs].filter(Boolean).length;
  traits <= 5 ? ok(`${traits} dekorative traits aktive`) : warn(`${traits} traits aktive — anbefaler maks 5`);

  if (state.rarity === 'Legendarisk' && state.scale > 2.5 && !state.maxDisplayScale) {
    warn('Stor Legendarisk fisk — overvej maxDisplayScale');
  }

  return checks;
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT BUILDER
// ═══════════════════════════════════════════════════════════════════

function buildExport(state) {
  const model = {};
  model.color = state.color;
  model.bodyShape = state.bodyShape.map(v => Math.round(v * 10) / 10);
  model.tail = `'${state.tail}'`;
  model.speed = Math.round(state.speed * 10) / 10;
  model.scale = Math.round(state.scale * 10) / 10;

  if (state.flat) model.flat = true;
  if (state.spots === true) model.spots = true;
  else if (typeof state.spots === 'number' && state.spots) model.spots = state.spots;
  if (state.stripes) model.stripes = true;
  if (state.redFins) model.redFins = true;
  if (state.longBeak) model.longBeak = true;
  if (state.spikes) model.spikes = true;
  if (state.uglyHead) model.uglyHead = true;
  if (state.finUp) model.finUp = true;
  if (state.sword) model.sword = true;
  if (state.whiskers) model.whiskers = true;
  if (state.lure) model.lure = true;
  if (state.noEyes) model.noEyes = true;
  if (state.thinLegs) model.thinLegs = true;
  if (state.emissive != null) model.emissive = state.emissive;
  if (state.emissiveIntensity !== 0.06) model.emissiveIntensity = state.emissiveIntensity;
  if (state.metalness !== 0.12) model.metalness = state.metalness;
  if (state.roughness !== 0.2) model.roughness = state.roughness;
  if (state.maxDisplayScale != null) model.maxDisplayScale = state.maxDisplayScale;

  if (state.creatureType !== 'none') model[state.creatureType] = true;

  const hexStr = (n) => '0x' + n.toString(16).toUpperCase().padStart(6, '0');

  // build one-liner model string
  let modelParts = [];
  modelParts.push(`color: ${hexStr(model.color)}`);
  modelParts.push(`bodyShape: [${model.bodyShape.join(', ')}]`);
  modelParts.push(`tail: ${model.tail}`);
  modelParts.push(`speed: ${model.speed}`);
  modelParts.push(`scale: ${model.scale}`);
  for (const [k, v] of Object.entries(model)) {
    if (['color', 'bodyShape', 'tail', 'speed', 'scale'].includes(k)) continue;
    if (typeof v === 'boolean') modelParts.push(`${k}: true`);
    else if (typeof v === 'number' && ['emissive'].includes(k)) modelParts.push(`${k}: ${hexStr(v)}`);
    else modelParts.push(`${k}: ${v}`);
  }

  const reqParts = [];
  reqParts.push(`requiredRod: ${state.requiredRod ? `'${state.requiredRod}'` : 'null'}`);
  reqParts.push(`requiredBait: ${state.requiredBait ? `'${state.requiredBait}'` : 'null'}`);

  const areas = state.primaryAreas.map(a => `'${a}'`).join(', ');

  let line = `{ id: '${state.id}', name: '${state.name}', type: 'fish', rarity: '${state.rarity}', primaryAreas: [${areas}], requirements: { ${reqParts.join(', ')} }, itemType: '${state.itemType}', model: { ${modelParts.join(', ')} } },`;

  // JSON version
  const jsonObj = {
    id: state.id,
    name: state.name,
    type: 'fish',
    rarity: state.rarity,
    primaryAreas: state.primaryAreas,
    requirements: {
      requiredRod: state.requiredRod || null,
      requiredBait: state.requiredBait || null,
    },
    itemType: state.itemType,
    model: {
      color: model.color,
      bodyShape: model.bodyShape,
      tail: state.tail,
      speed: model.speed,
      scale: model.scale,
    },
  };

  // add optional model fields to JSON
  for (const [k, v] of Object.entries(model)) {
    if (['color', 'bodyShape', 'tail', 'speed', 'scale'].includes(k)) continue;
    if (typeof v === 'string') continue; // skip quoted tail
    jsonObj.model[k] = v;
  }

  return { typescript: line, json: JSON.stringify(jsonObj, null, 2) };
}

// ═══════════════════════════════════════════════════════════════════
// BUILD MODEL CONFIG FROM STATE
// ═══════════════════════════════════════════════════════════════════

function buildModelConfig(state) {
  const config = {
    color: state.color,
    bodyShape: [...state.bodyShape],
    tail: state.tail,
    speed: state.speed,
    scale: state.scale,
  };
  if (state.flat) config.flat = true;
  if (state.spots) config.spots = state.spots;
  if (state.stripes) config.stripes = true;
  if (state.redFins) config.redFins = true;
  if (state.longBeak) config.longBeak = true;
  if (state.spikes) config.spikes = true;
  if (state.uglyHead) config.uglyHead = true;
  if (state.finUp) config.finUp = true;
  if (state.sword) config.sword = true;
  if (state.whiskers) config.whiskers = true;
  if (state.lure) config.lure = true;
  if (state.noEyes) config.noEyes = true;
  if (state.thinLegs) config.thinLegs = true;
  if (state.emissive != null) config.emissive = state.emissive;
  if (state.emissiveIntensity !== 0.06) config.emissiveIntensity = state.emissiveIntensity;
  if (state.metalness !== 0.12) config.metalness = state.metalness;
  if (state.roughness !== 0.2) config.roughness = state.roughness;
  if (state.maxDisplayScale != null) config.maxDisplayScale = state.maxDisplayScale;

  if (state.creatureType !== 'none') config[state.creatureType] = true;

  return config;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════

export default function FishEditor() {
  const [state, setState] = useState({ ...DEFAULT_STATE });
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [exportMode, setExportMode] = useState('ts');

  const set = useCallback((key, val) => {
    setState(prev => {
      const next = { ...prev, [key]: val };
      // Auto-generate id from name
      if (key === 'name') {
        next.id = 'fisk_' + slugify(val);
      }
      return next;
    });
  }, []);

  const setBodyAxis = useCallback((axis, val) => {
    setState(prev => {
      const bs = [...prev.bodyShape];
      bs[axis] = val;
      return { ...prev, bodyShape: bs };
    });
  }, []);

  const toggleArea = useCallback((areaId) => {
    setState(prev => {
      const areas = prev.primaryAreas.includes(areaId)
        ? prev.primaryAreas.filter(a => a !== areaId)
        : [...prev.primaryAreas, areaId];
      return { ...prev, primaryAreas: areas.length ? areas : prev.primaryAreas };
    });
  }, []);

  const applyPreset = useCallback((preset) => {
    setState(prev => ({
      ...prev,
      bodyShape: [...preset.bodyShape],
      tail: preset.tail,
      speed: preset.speed,
      scale: preset.scale,
      creatureType: preset.creature,
      flat: preset.flags.flat || false,
      finUp: preset.flags.finUp || false,
      longBeak: preset.flags.longBeak || false,
      lure: preset.flags.lure || false,
      spots: false, stripes: false, redFins: false, spikes: false,
      uglyHead: false, sword: false, whiskers: false, noEyes: false, thinLegs: false,
    }));
  }, []);

  const resetAll = useCallback(() => setState({ ...DEFAULT_STATE }), []);

  // 3D renderer setup
  useEffect(() => {
    if (!canvasRef.current) return;
    const r = new FishRenderer(canvasRef.current);
    rendererRef.current = r;
    r.animate();

    const onResize = () => r.resize();
    const ro = new ResizeObserver(onResize);
    ro.observe(canvasRef.current.parentElement);

    return () => {
      r.dispose();
      ro.disconnect();
    };
  }, []);

  // Update fish when state changes
  useEffect(() => {
    if (!rendererRef.current) return;
    const config = buildModelConfig(state);
    rendererRef.current.buildFish(config);
    rendererRef.current.paused = state.animPaused;
    rendererRef.current.setGrid(state.showGrid);
  }, [state]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        set('animPaused', !state.animPaused);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.animPaused, set]);

  const idConflict = EXISTING_IDS.has(state.id);
  const validationResults = useMemo(() => validate(state), [state]);
  const exportData = useMemo(() => buildExport(state), [state]);
  const traitCount = [state.spots, state.stripes, state.redFins, state.longBeak, state.spikes, state.uglyHead, state.finUp, state.sword, state.whiskers, state.lure, state.noEyes, state.thinLegs].filter(Boolean).length;
  const rarDefs = RARITY_DEFAULTS[state.rarity] || RARITY_DEFAULTS['Almindelig'];

  const handleCopy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch(e) {}
  };

  // ─── TAB CONTENT ───────────────────────────────────────────────

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'shape': return (
        <div>
          <div className="mb-4">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Arketype-preset</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ARCHETYPE_PRESETS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)}
                  className="text-xs text-left px-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700 hover:border-cyan-600">
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-700/50 pt-3">
            <Slider label="Bredde (sx)" value={state.bodyShape[0]} min={0.1} max={3.0} step={0.05} onChange={v => setBodyAxis(0, v)} />
            <Slider label="Højde (sy)" value={state.bodyShape[1]} min={0.1} max={3.0} step={0.05} onChange={v => setBodyAxis(1, v)} />
            <Slider label="Længde (sz)" value={state.bodyShape[2]} min={0.3} max={5.0} step={0.05} onChange={v => setBodyAxis(2, v)} />
          </div>
          <div className="border-t border-gray-700/50 pt-3">
            <Select label="Haletype" value={state.tail} options={TAIL_TYPES} onChange={v => set('tail', v)} />
            <Select label="Creature-type" value={state.creatureType} options={CREATURE_TYPES} onChange={v => set('creatureType', v)} />
          </div>
          <div className="border-t border-gray-700/50 pt-3">
            <Slider label="Scale (størrelse)" value={state.scale} min={0.3} max={5.0} step={0.1} onChange={v => set('scale', v)} />
            <Slider label="Speed (hastighed)" value={state.speed} min={0.1} max={3.5} step={0.1} onChange={v => set('speed', v)} />
            <Checkbox label="Fladtrykt krop" checked={state.flat} onChange={v => set('flat', v)} />
          </div>
        </div>
      );

      case 'color': return (
        <div>
          <div className="mb-4">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Kropsfarve</label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="color"
                value={intToHex(state.color)}
                onChange={e => set('color', hexToInt(e.target.value))}
                className="w-10 h-10 rounded border border-gray-600 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={intToHex(state.color).toUpperCase()}
                onChange={e => { const v = hexToInt(e.target.value); if (!isNaN(v)) set('color', v); }}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 font-mono w-24 focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-xs text-gray-500 font-mono">0x{state.color.toString(16).toUpperCase().padStart(6,'0')}</span>
            </div>
          </div>
          {Object.entries(BIOME_PALETTES).map(([name, colors]) => (
            <div key={name} className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">{name}</label>
              <div className="flex gap-1.5 flex-wrap">
                {colors.map(c => <ColorSwatch key={c} color={c} selected={state.color === c} onClick={() => set('color', c)} />)}
              </div>
            </div>
          ))}
          <div className="border-t border-gray-700/50 pt-3 mt-3">
            <Slider label="Metalness" value={state.metalness} min={0} max={1} step={0.01} onChange={v => set('metalness', v)} />
            <Slider label="Roughness" value={state.roughness} min={0} max={1} step={0.01} onChange={v => set('roughness', v)} />
            <div className="mt-3">
              <Checkbox label="Emissive glow" checked={state.emissive != null} onChange={v => set('emissive', v ? 0x00CCFF : null)} />
              {state.emissive != null && (
                <div className="ml-5 mt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="color" value={intToHex(state.emissive)} onChange={e => set('emissive', hexToInt(e.target.value))} className="w-7 h-7 rounded border border-gray-600 cursor-pointer bg-transparent" />
                    <span className="text-xs text-gray-400 font-mono">{intToHex(state.emissive).toUpperCase()}</span>
                  </div>
                  <Slider label="Glow-styrke" value={state.emissiveIntensity} min={0} max={2} step={0.05} onChange={v => set('emissiveIntensity', v)} />
                </div>
              )}
            </div>
          </div>
        </div>
      );

      case 'traits': return (
        <div>
          <div className={`mb-3 px-2 py-1.5 rounded text-xs font-medium ${traitCount > 5 ? 'bg-amber-900/40 text-amber-300' : 'bg-gray-800 text-gray-400'}`}>
            {traitCount}/5 dekorative traits aktive {traitCount > 5 && '⚠ Anbefaler maks 5'}
          </div>
          <div className="space-y-0.5">
            <Checkbox label="Pletter (spots)" checked={!!state.spots} onChange={v => set('spots', v)} />
            <Checkbox label="Striber" checked={state.stripes} onChange={v => set('stripes', v)} />
            <Checkbox label="Røde finner" checked={state.redFins} onChange={v => set('redFins', v)} />
            <Checkbox label="Langt næb" checked={state.longBeak} onChange={v => set('longBeak', v)} />
            <Checkbox label="Rygpigge" checked={state.spikes} onChange={v => set('spikes', v)} />
            <Checkbox label="Klodset hoved" checked={state.uglyHead} onChange={v => set('uglyHead', v)} />
            <Checkbox label="Opretstående finne" checked={state.finUp} onChange={v => set('finUp', v)} />
            <Checkbox label="Sværdnæb" checked={state.sword} onChange={v => set('sword', v)} />
            <Checkbox label="Skæggevarter" checked={state.whiskers} onChange={v => set('whiskers', v)} />
            <Checkbox label="Lygtefisk-lampe" checked={state.lure} onChange={v => set('lure', v)} />
            <Checkbox label="Ingen øjne" checked={state.noEyes} onChange={v => set('noEyes', v)} />
            <Checkbox label="Tynde ben (krabbe)" checked={state.thinLegs} onChange={v => set('thinLegs', v)} disabled={state.creatureType !== 'isCrab'} />
          </div>
          <div className="border-t border-gray-700/50 pt-3 mt-3">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Max Display Scale (valgfri)</label>
            <input
              type="number" step={0.1} min={1} max={5}
              value={state.maxDisplayScale ?? ''}
              placeholder={rarDefs.maxDisplay.toString()}
              onChange={e => set('maxDisplayScale', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      );

      case 'meta': return (
        <div>
          <div className="mb-3">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Navn (dansk)</label>
            <input
              type="text" value={state.name}
              onChange={e => set('name', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
              placeholder="Ny Fisk"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">ID</label>
            <input
              type="text" value={state.id}
              onChange={e => setState(p => ({...p, id: e.target.value}))}
              className={`w-full bg-gray-800 border rounded px-2 py-1.5 text-sm font-mono focus:outline-none ${idConflict ? 'border-amber-500 text-amber-300' : 'border-emerald-600 text-emerald-300'}`}
            />
            {idConflict ? (
              <p className="text-xs text-amber-400 mt-1">⚠ ID eksisterer allerede — vil overskrive</p>
            ) : (
              <p className="text-xs text-emerald-400 mt-1">✓ Nyt ID — klar til import</p>
            )}
          </div>
          <Select label="Rarity" value={state.rarity} options={RARITIES.map(r => ({value: r, label: r}))} onChange={v => set('rarity', v)} />
          <div className="mb-3">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Lokationer</label>
            <div className="space-y-0.5">
              {LOCATIONS.map(loc => (
                <Checkbox
                  key={loc.id}
                  label={`${loc.emoji} ${loc.name} (${loc.id})`}
                  checked={state.primaryAreas.includes(loc.id)}
                  onChange={() => toggleArea(loc.id)}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-gray-700/50 pt-3">
            <Select label="Krævet stang" value={state.requiredRod} options={RODS} onChange={v => set('requiredRod', v)} />
            <Select label="Krævet lokkemad" value={state.requiredBait} options={BAITS} onChange={v => set('requiredBait', v)} />
            <Select label="Item Type" value={state.itemType} options={[{value:'fish',label:'fish'},{value:'piranha',label:'piranha'}]} onChange={v => set('itemType', v)} />
          </div>
          <div className="border-t border-gray-700/50 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Vægt min (kg)</label>
                <input type="number" placeholder={rarDefs.weightRange[0]} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Vægt max (kg)</label>
                <input type="number" placeholder={rarDefs.weightRange[1]} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Værdi (coins)</label>
                <input type="number" placeholder={rarDefs.value} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">XP</label>
                <input type="number" placeholder={rarDefs.xp} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none" />
              </div>
            </div>
          </div>
        </div>
      );

      case 'export': return (
        <div>
          <div className="flex gap-1 mb-3">
            <button onClick={() => setExportMode('ts')} className={`flex-1 text-xs py-1.5 rounded ${exportMode === 'ts' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}>TypeScript</button>
            <button onClick={() => setExportMode('json')} className={`flex-1 text-xs py-1.5 rounded ${exportMode === 'json' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400'}`}>JSON</button>
          </div>
          <div className="relative mb-3">
            <pre className="bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
              {exportMode === 'ts' ? exportData.typescript : exportData.json}
            </pre>
            <button
              onClick={() => handleCopy(exportMode === 'ts' ? exportData.typescript : exportData.json)}
              className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-gray-700 hover:bg-cyan-600 text-xs text-gray-300 hover:text-white rounded transition-colors"
            >
              {copied ? '✓ Kopieret!' : 'Kopiér'}
            </button>
          </div>
          {idConflict ? (
            <div className="bg-amber-900/30 border border-amber-600/50 rounded p-2.5 mb-3">
              <p className="text-amber-300 text-xs font-medium">⚠ ERSTATNING</p>
              <p className="text-amber-200/70 text-xs mt-0.5">Overskriver eksisterende fisk: "{state.id}"</p>
            </div>
          ) : (
            <div className="bg-emerald-900/30 border border-emerald-600/50 rounded p-2.5 mb-3">
              <p className="text-emerald-300 text-xs font-medium">✓ NY FISK — Klar til import</p>
              <p className="text-emerald-200/70 text-xs mt-0.5">Indsæt i CATCH_MASTER_DATA i src/data/fish.ts</p>
            </div>
          )}
          <div className="space-y-0.5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Validering</p>
            {validationResults.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <span className={c.ok === true ? 'text-emerald-400' : c.ok === 'warn' ? 'text-amber-400' : 'text-red-400'}>
                  {c.ok === true ? '✓' : c.ok === 'warn' ? '⚠' : '✗'}
                </span>
                <span className={c.ok === true ? 'text-gray-400' : c.ok === 'warn' ? 'text-amber-300' : 'text-red-300'}>{c.msg}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  // ─── TABS ──────────────────────────────────────────────────────

  const tabs = [
    { id: 'shape', label: 'Form', icon: '◆' },
    { id: 'color', label: 'Farve', icon: '◉' },
    { id: 'traits', label: 'Detaljer', icon: '✦' },
    { id: 'meta', label: 'Meta', icon: '◎' },
    { id: 'export', label: 'Eksport', icon: '↗' },
  ];

  // ─── RENDER ────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace", background: '#0d0d1a', color: '#e2e8f0', overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ═══ LEFT PANEL ═══ */}
      <div style={{ width: '360px', minWidth: '360px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', background: '#111827' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '14px', fontWeight: 600, color: '#67e8f9', margin: 0, letterSpacing: '0.05em' }}>🐟 REGNEFISKEN</h1>
              <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0', letterSpacing: '0.1em' }}>FISH EDITOR</p>
            </div>
            <button
              onClick={resetAll}
              style={{ fontSize: '10px', padding: '4px 8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer' }}
            >Reset</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => set('activeTab', t.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: '10px',
                textAlign: 'center',
                background: state.activeTab === t.id ? '#1e293b' : 'transparent',
                color: state.activeTab === t.id ? '#67e8f9' : '#64748b',
                border: 'none',
                borderBottom: state.activeTab === t.id ? '2px solid #06b6d4' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ display: 'block', fontSize: '13px', marginBottom: '1px' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}
             className="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {renderTabContent()}
        </div>
      </div>

      {/* ═══ RIGHT: 3D VIEWPORT ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
          background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid #1e293b', zIndex: 10,
        }}>
          {[
            { label: state.animPaused ? '▶ Play' : '⏸ Pause', onClick: () => set('animPaused', !state.animPaused), active: state.animPaused },
            { label: '⊞ Grid', onClick: () => { const v = !state.showGrid; set('showGrid', v); rendererRef.current?.setGrid(v); }, active: state.showGrid },
            { label: '◇ Wire', onClick: () => { const v = !state.showWireframe; set('showWireframe', v); rendererRef.current?.setWireframe(v); }, active: state.showWireframe },
            { label: '⟳ Kamera', onClick: () => rendererRef.current?.resetCamera() },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              style={{
                fontSize: '11px', padding: '4px 10px', borderRadius: '4px',
                background: btn.active ? '#164e63' : '#1e293b',
                border: `1px solid ${btn.active ? '#06b6d4' : '#334155'}`,
                color: btn.active ? '#67e8f9' : '#94a3b8',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >{btn.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '10px', color: '#475569' }}>
            {state.name} • {state.rarity} • scale:{state.scale}
          </span>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {/* Info overlay */}
          <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '10px', color: '#475569', lineHeight: 1.5 }}>
            <span style={{ color: '#334155' }}>LMB</span> roter &nbsp;
            <span style={{ color: '#334155' }}>RMB</span> panorér &nbsp;
            <span style={{ color: '#334155' }}>Scroll</span> zoom &nbsp;
            <span style={{ color: '#334155' }}>Space</span> pause
          </div>
          <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '11px', color: '#334155', textAlign: 'right', lineHeight: 1.6 }}>
            <div>body: [{state.bodyShape.map(v => v.toFixed(1)).join(', ')}]</div>
            <div>tail: {state.tail} | creature: {state.creatureType}</div>
            <div>color: 0x{state.color.toString(16).toUpperCase().padStart(6,'0')}</div>
          </div>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #06b6d4; border: 2px solid #0e7490;
          cursor: pointer; margin-top: -1px;
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px; height: 12px; border-radius: 50%;
          background: #06b6d4; border: 2px solid #0e7490;
          cursor: pointer;
        }
        input[type="color"] {
          -webkit-appearance: none; border: none; padding: 0;
        }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
        select { -webkit-appearance: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%2394a3b8' fill='none' stroke-width='1.5'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 8px center;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
