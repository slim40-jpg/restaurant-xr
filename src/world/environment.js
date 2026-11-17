/**
 * @file    src/world/environment.js
 * @brief   Dressing intérieur : parquet, plafonds des deux niveaux, portes, soubassements et enseignes.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-12
 * @role    Habille la structure d'architecture.js sans construire ni mur porteur ni baie vitrée.
 */

import * as THREE from 'three';

import { ROOM_ANCHORS, ROOM_LAYOUT } from './layout.js';

const { WIDTH, DEPTH, HEIGHT, GROUND_HEIGHT, MEZZANINE_Y } = ROOM_LAYOUT;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const DOOR = ROOM_ANCHORS.entrance;

/** Matériaux partagés du second œuvre. */
const MAT = {
  wood: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x513118, roughness: 0.75 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.35, metalness: 0.8 }),
  wine: new THREE.MeshStandardMaterial({ color: 0x6e1f2a, roughness: 0.9 }),
  duct: new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.5, metalness: 0.35 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x9fb6c4, transparent: true, opacity: 0.22 }),
};
const PLANK_MATS = [
  new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: 0xa9743f, roughness: 0.7 }),
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
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture })
  );
}

/** Parquet de la salle : base sombre + fines lattes de teintes légèrement variées. */
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

/** Plafonds structurés : poutres sous la dalle (3,0 m) et en double hauteur (6,3 m). */
function buildCeilings(group) {
  [-2.4, -5.2].forEach((z) => {
    addBox(group, WIDTH, 0.22, 0.24, MAT.woodDark, 0, GROUND_HEIGHT - 0.14, z);
  });
  [-2.4, -4.2, -6.0, 0.6, 2.8, 5.0].forEach((z) => {
    addBox(group, WIDTH, 0.22, 0.24, MAT.woodDark, 0, HEIGHT - 0.24, z);
  });
  [-4.6, 5.6].forEach((x) => {
    addBox(group, 0.26, 0.2, DEPTH - 2.4, MAT.duct, x, HEIGHT - 0.36, 0);
  });
  addBox(group, 0.24, 0.22, DEPTH, MAT.woodDark, HALF_W - 0.12, HEIGHT - 0.24, 0);
  addBox(group, 0.24, 0.22, DEPTH, MAT.woodDark, -HALF_W + 0.12, HEIGHT - 0.24, 0);
}

/** Portes CUISINE (battante), WC et entrée vitrée vers le jardin, avec paillasson. */
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
  addBox(group, 0.9, 2.05, 0.06, MAT.woodDark, wcX, 1.02, wallZ);

  const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(DOOR.width - 0.1, 2.3, 0.06), MAT.glass);
  glassDoor.position.set(DOOR.x, 1.2, HALF_D - 0.14);
  group.add(glassDoor);
  [DOOR.x - 0.85, DOOR.x + 0.85].forEach((x) => {
    addBox(group, 0.08, 2.3, 0.1, MAT.brass, x, 1.2, HALF_D - 0.14);
  });
  addBox(group, 1.5, 0.04, 0.9, MAT.wine, DOOR.x, 0.02, HALF_D - 0.55);
}

/** Enseignes CUISINE, WC et ENTRÉE, posées à hauteur de lecture sur les portes. */
function buildSigns(group) {
  const wallZ = -HALF_D + 0.2;
  const kitchenSign = makeSign('CUISINE', 1.5, 0.4);
  kitchenSign.position.set(ROOM_ANCHORS.kitchen.x, 2.5, wallZ);
  group.add(kitchenSign);
  const wcSign = makeSign('WC', 0.8, 0.4);
  wcSign.position.set(ROOM_ANCHORS.wc.x, 2.5, wallZ);
  group.add(wcSign);
  const entrySign = makeSign('ENTRÉE', 1.5, 0.42);
  entrySign.position.set(DOOR.x, 2.85, HALF_D - 0.16);
  entrySign.rotation.y = Math.PI;
  group.add(entrySign);
}

/** Soubassement bois et filet laiton, continus sur les murs intérieurs du rez-de-chaussée. */
function buildBaseboards(group) {
  addBox(group, WIDTH - 0.4, 1.0, 0.06, MAT.wood, 0, 0.5, -HALF_D + 0.11);
  addBox(group, 0.06, 1.0, DEPTH - 0.4, MAT.wood, HALF_W - 0.11, 0.5, 0);
  addBox(group, WIDTH - 0.4, 0.05, 0.08, MAT.brass, 0, 1.02, -HALF_D + 0.14);
  addBox(group, WIDTH - 0.4, 1.0, 0.06, MAT.wood, 0, MEZZANINE_Y + 0.5, -HALF_D + 0.11);
}

/**
 * Crée le dressing intérieur du restaurant.
 * @returns {THREE.Group} Parquet, plafonds, portes, soubassements et enseignes.
 */
export function createEnvironment() {
  const environment = new THREE.Group();
  environment.name = 'environnement';
  buildFloor(environment);
  buildCeilings(environment);
  buildDoors(environment);
  buildSigns(environment);
  buildBaseboards(environment);
  return environment;
}
