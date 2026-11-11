/**
 * @file    src/world/environment.js
 * @brief   Enveloppe du restaurant : parquet, murs, baie vitrée, portes et plafond structuré.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Produit la coquille statique et lisible de la salle, indépendante des tables et de la logique.
 */

import * as THREE from 'three';

import { ZONES } from '../config/constants.js';
import { PALETTE, ROOM_ANCHORS, ROOM_LAYOUT, TABLE_CATALOGUE } from './layout.js';

const { WIDTH, DEPTH, HEIGHT } = ROOM_LAYOUT;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const BEAM_Z = [-5.4, 0.9, 2.8];
const LIT_ZONES = [ZONES.CENTER, ZONES.BANQUETTE, ZONES.BAR];

/** Matériaux partagés de l'enveloppe. */
const MAT = {
  wall: new THREE.MeshStandardMaterial({ color: PALETTE.CREAM, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD, roughness: 0.6 }),
  woodDark: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.75 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.35, metalness: 0.8 }),
  wine: new THREE.MeshStandardMaterial({ color: PALETTE.WINE, roughness: 0.9 }),
  duct: new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.5, metalness: 0.35 }),
  glass: new THREE.MeshStandardMaterial({ color: PALETTE.GLASS, transparent: true, opacity: 0.22 }),
  dusk: new THREE.MeshBasicMaterial({ color: PALETTE.DUSK }),
  glow: new THREE.MeshBasicMaterial({ color: 0xffcf8a }),
};
const PLANK_MATS = [
  new THREE.MeshStandardMaterial({ color: PALETTE.WOOD, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_LIGHT, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: 0x9a6636, roughness: 0.7 }),
];

/** Ajoute une boîte positionnée à un groupe parent. */
function addBox(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Crée un panneau de signalétique lisible (texte dessiné sur canvas, aucune texture externe). */
function makeSign(text, width = 1.4, height = 0.42) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1c1712';
  ctx.fillRect(0, 0, 512, 192);
  ctx.fillStyle = '#f1e8da';
  ctx.font = 'bold 92px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 100);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

/** Sol parquet : base sombre + fines lattes de teintes légèrement variées. */
function buildFloor(group) {
  const base = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, DEPTH), MAT.woodDark);
  base.rotation.x = -Math.PI / 2;
  base.receiveShadow = true;
  group.add(base);
  const strips = 26;
  const strip = DEPTH / strips;
  const plankGeo = new THREE.PlaneGeometry(WIDTH, strip * 0.94);
  for (let i = 0; i < strips; i += 1) {
    const plank = new THREE.Mesh(plankGeo, PLANK_MATS[i % PLANK_MATS.length]);
    plank.rotation.x = -Math.PI / 2;
    plank.position.set(0, 0.004, -HALF_D + strip * (i + 0.5));
    plank.receiveShadow = true;
    group.add(plank);
  }
}

/** Murs crème avec soubassement bois sur 1 m, ouverture de l'entrée côté Z = +7. */
function buildWalls(group) {
  addBox(group, WIDTH, HEIGHT, 0.2, MAT.wall, 0, HEIGHT / 2, -HALF_D);
  addBox(group, 0.2, HEIGHT, DEPTH, MAT.wall, HALF_W, HEIGHT / 2, 0);
  const doorX = ROOM_ANCHORS.entrance.x;
  const halfDoor = ROOM_ANCHORS.entrance.width / 2;
  const leftLength = doorX - halfDoor + HALF_W;
  const rightLength = HALF_W - (doorX + halfDoor);
  addBox(group, leftLength, HEIGHT, 0.2, MAT.wall, -HALF_W + leftLength / 2, HEIGHT / 2, HALF_D);
  addBox(group, rightLength, HEIGHT, 0.2, MAT.wall, doorX + halfDoor + rightLength / 2, HEIGHT / 2, HALF_D);
  addBox(group, halfDoor * 2, HEIGHT - 2.5, 0.2, MAT.wall, doorX, 2.5 + (HEIGHT - 2.5) / 2, HALF_D);
  addBox(group, WIDTH - 0.4, 1.0, 0.06, MAT.wood, 0, 0.5, -HALF_D + 0.11);
  addBox(group, 0.06, 1.0, DEPTH - 0.4, MAT.wood, HALF_W - 0.11, 0.5, 0);
  addBox(group, WIDTH - 0.4, 0.05, 0.08, MAT.brass, 0, 1.02, -HALF_D + 0.14);
}

/** Baie vitrée sur tout le mur X = −11 : vitrage, montants, rail médian et lumière extérieure. */
function buildWindowWall(group) {
  addBox(group, 0.3, 0.5, DEPTH, MAT.woodDark, -HALF_W + 0.15, 0.25, 0);
  addBox(group, 0.3, HEIGHT - 2.9, DEPTH, MAT.wall, -HALF_W + 0.15, 2.9 + (HEIGHT - 2.9) / 2, 0);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(DEPTH, 2.4), MAT.glass);
  glass.rotation.y = Math.PI / 2;
  glass.position.set(-HALF_W + 0.12, 1.7, 0);
  group.add(glass);
  const mullionGeo = new THREE.BoxGeometry(0.08, 2.4, 0.08);
  for (let i = 0; i <= 8; i += 1) {
    const post = new THREE.Mesh(mullionGeo, MAT.woodDark);
    post.position.set(-HALF_W + 0.12, 1.7, -HALF_D + (i * DEPTH) / 8);
    group.add(post);
  }
  addBox(group, 0.06, 0.06, DEPTH, MAT.woodDark, -HALF_W + 0.12, 1.6, 0);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(DEPTH + 6, 8), MAT.dusk);
  backdrop.rotation.y = Math.PI / 2;
  backdrop.position.set(-HALF_W - 1.6, 2.5, 0);
  group.add(backdrop);
  for (let i = 0; i < 6; i += 1) {
    const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), MAT.glow);
    lamp.rotation.y = Math.PI / 2;
    lamp.position.set(-HALF_W - 1.55, 1.2 + (i % 3) * 0.9, -4.5 + i * 1.8);
    group.add(lamp);
  }
}

/** Portes CUISINE (battante), WC et entrée vitrée, avec paillasson et panneaux lisibles. */
function buildDoors(group) {
  const kitchenX = ROOM_ANCHORS.kitchen.x;
  const wcX = ROOM_ANCHORS.wc.x;
  const wallZ = -HALF_D + 0.16;
  const panelGeo = new THREE.BoxGeometry(0.86, 2.05, 0.06);
  [-1, 1].forEach((side) => {
    const panel = new THREE.Mesh(panelGeo, MAT.wood);
    panel.position.set(kitchenX + side * 0.44, 1.02, wallZ);
    panel.rotation.y = side * 0.22;
    panel.castShadow = true;
    group.add(panel);
  });
  const kitchenSign = makeSign('CUISINE', 1.5, 0.4);
  kitchenSign.position.set(kitchenX, 2.5, wallZ + 0.01);
  group.add(kitchenSign);
  addBox(group, 0.9, 2.05, 0.06, MAT.woodDark, wcX, 1.02, wallZ);
  const wcSign = makeSign('WC', 0.8, 0.4);
  wcSign.position.set(wcX, 2.5, wallZ + 0.01);
  group.add(wcSign);
  const doorX = ROOM_ANCHORS.entrance.x;
  const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 0.06), MAT.glass);
  glassDoor.position.set(doorX, 1.2, HALF_D - 0.14);
  group.add(glassDoor);
  addBox(group, 0.08, 2.3, 0.1, MAT.brass, doorX - 0.87, 1.2, HALF_D - 0.14);
  addBox(group, 0.08, 2.3, 0.1, MAT.brass, doorX + 0.87, 1.2, HALF_D - 0.14);
  addBox(group, 1.5, 0.04, 0.9, MAT.wine, doorX, 0.02, HALF_D - 0.55);
  const entrySign = makeSign('ENTRÉE', 1.5, 0.42);
  entrySign.position.set(doorX, 2.85, HALF_D - 0.16);
  entrySign.rotation.y = Math.PI;
  group.add(entrySign);
}

/** Plafond structuré : 3 poutres, 2 gaines anthracite, corniche marquée et pannes de suspension. */
function buildCeiling(group) {
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, DEPTH), MAT.wall);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = HEIGHT;
  group.add(ceiling);
  BEAM_Z.forEach((z) => {
    addBox(group, WIDTH, 0.24, 0.26, MAT.woodDark, 0, HEIGHT - 0.22, z);
  });
  [-4.6, 5.6].forEach((x) => {
    addBox(group, 0.26, 0.2, DEPTH - 1.2, MAT.duct, x, HEIGHT - 0.34, 0);
  });
  addBox(group, WIDTH, 0.22, 0.24, MAT.woodDark, 0, HEIGHT - 0.24, -HALF_D + 0.12);
  addBox(group, WIDTH, 0.22, 0.24, MAT.woodDark, 0, HEIGHT - 0.24, HALF_D - 0.12);
  addBox(group, 0.24, 0.22, DEPTH, MAT.woodDark, HALF_W - 0.12, HEIGHT - 0.24, 0);
  addBox(group, 0.24, 0.22, DEPTH, MAT.woodDark, -HALF_W + 0.12, HEIGHT - 0.24, 0);
  TABLE_CATALOGUE.filter((t) => LIT_ZONES.includes(t.zone)).forEach((t) => {
    const beamZ = BEAM_Z.slice().sort((a, b) => Math.abs(a - t.z) - Math.abs(b - t.z))[0];
    const span = Math.abs(beamZ - t.z);
    if (span >= 0.16) {
      addBox(group, 0.12, 0.14, span + 0.12, MAT.woodDark, t.x, HEIGHT - 0.2, (beamZ + t.z) / 2);
    }
  });
}

/**
 * Crée le groupe de décor complet de la salle.
 * @returns {THREE.Group} Sol, murs, baie vitrée, portes et plafond structuré.
 */
export function createEnvironment() {
  const environment = new THREE.Group();
  buildFloor(environment);
  buildWalls(environment);
  buildWindowWall(environment);
  buildDoors(environment);
  buildCeiling(environment);
  return environment;
}
