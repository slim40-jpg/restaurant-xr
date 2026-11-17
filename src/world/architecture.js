/**
 * @file    src/world/architecture.js
 * @brief   Architecture du bâtiment : deux niveaux, dalle de mezzanine, garde-corps, escalier, toiture.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-12
 * @role    Porte la coquille à 6,3 m et rend le niveau supérieur praticable, sans meubles ni décor.
 */

import * as THREE from 'three';

import { PALETTE, ROOM_ANCHORS, ROOM_LAYOUT, STAIR } from './layout.js';
import { addFascia, addHandrailCap, addUnderCeiling } from './mezzanine-trim.js';

const { WIDTH, DEPTH, HEIGHT, GROUND_HEIGHT, SLAB, MEZZANINE_Y } = ROOM_LAYOUT;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const DOOR = ROOM_ANCHORS.entrance;
const WIN = ROOM_ANCHORS.windows;
const RAIL = ROOM_ANCHORS.mezzanine.railHeight;

/**
 * Une seule boîte unitaire, mise à l'échelle par maillage : 1 géométrie pour toute
 * l'architecture, donc un budget triangles et un nombre de buffers maîtrisés.
 */
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

/** Matériaux partagés de la structure. */
const MAT = {
  wall: new THREE.MeshStandardMaterial({ color: PALETTE.CREAM, roughness: 0.95 }),
  slab: new THREE.MeshStandardMaterial({ color: 0xd9cfbf, roughness: 0.9 }),
  wood: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD, roughness: 0.65 }),
  woodDark: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.75 }),
  steel: new THREE.MeshStandardMaterial({ color: PALETTE.CHARCOAL, roughness: 0.35, metalness: 0.75 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.35, metalness: 0.8 }),
  glass: new THREE.MeshStandardMaterial({ color: PALETTE.GLASS, transparent: true, opacity: 0.2 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x494641, roughness: 0.9 }),
  stone: new THREE.MeshStandardMaterial({ color: PALETTE.STONE, roughness: 0.95 }),
  dusk: new THREE.MeshBasicMaterial({ color: PALETTE.DUSK }),
  glow: new THREE.MeshBasicMaterial({ color: PALETTE.BULB }),
};

/** Ajoute une boîte positionnée, dimensionnée par mise à l'échelle de `UNIT_BOX`. */
function addBox(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(UNIT_BOX, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Ajoute un plan vertical (rotation appliquée par l'appelant) — 2 triangles par vitrage. */
function addPlane(parent, w, h, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/** Murs porteurs : fond, bar, façade percée de l'entrée, trumeaux de la baie ouest. */
function buildWalls(group) {
  // Socle enterré : le parquet reste 5 mm au-dessus de lui, sans face coplanaire.
  addBox(group, WIDTH, 0.3, DEPTH, MAT.stone, 0, -0.155, 0);
  addBox(group, WIDTH, HEIGHT, 0.2, MAT.wall, 0, HEIGHT / 2, -HALF_D);
  addBox(group, 0.2, HEIGHT, DEPTH, MAT.wall, HALF_W, HEIGHT / 2, 0);

  const left = DOOR.x - DOOR.width / 2;
  const right = DOOR.x + DOOR.width / 2;
  addBox(group, left + HALF_W, HEIGHT, 0.2, MAT.wall, (-HALF_W + left) / 2, HEIGHT / 2, HALF_D);
  addBox(group, HALF_W - right, HEIGHT, 0.2, MAT.wall, (right + HALF_W) / 2, HEIGHT / 2, HALF_D);
  addBox(group, DOOR.width, HEIGHT - DOOR.height, 0.2, MAT.wall, DOOR.x, (HEIGHT + DOOR.height) / 2, HALF_D);

  // Mur ouest : appui, bandeau d'étage et linteau. Le reste est vitré.
  addBox(group, 0.3, WIN.sill, DEPTH, MAT.wall, -HALF_W + 0.15, WIN.sill / 2, 0);
  addBox(group, 0.3, 0.6, DEPTH, MAT.wall, -HALF_W + 0.15, GROUND_HEIGHT + 0.1, 0);
  addBox(group, 0.3, HEIGHT - 5.7, DEPTH, MAT.wall, -HALF_W + 0.15, (HEIGHT + 5.7) / 2, 0);
}

/** Baie vitrée sur deux niveaux (X = −11) : vitrages, meneaux continus, fond de nuit. */
function buildGlazing(group) {
  [1.65, 4.55].forEach((y) => {
    const glass = addPlane(group, DEPTH, 2.3, MAT.glass, -HALF_W + 0.12, y, 0);
    glass.rotation.y = Math.PI / 2;
  });
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.2, 0.08), MAT.woodDark);
  for (let i = 0; i <= 8; i += 1) {
    const post = mullion.clone();
    post.position.set(-HALF_W + 0.12, 3.1, -HALF_D + (i * DEPTH) / 8);
    group.add(post);
  }
  [0.5, 2.8, 3.4, 5.7].forEach((y) => {
    addBox(group, 0.1, 0.07, DEPTH, MAT.woodDark, -HALF_W + 0.12, y, 0);
  });

  const backdrop = addPlane(group, DEPTH + 8, 10, MAT.dusk, -HALF_W - 1.8, 3.4, 0);
  backdrop.rotation.y = Math.PI / 2;
  [1.3, 2.5, 4.1, 5.3].forEach((y, i) => {
    const lamp = addPlane(group, 0.3, 0.3, MAT.glow, -HALF_W - 1.75, y, -4.5 + i * 2.6);
    lamp.rotation.y = Math.PI / 2;
  });
}

/** Dalle de mezzanine (moitié arrière) et poutre de rive qui souligne le vide. */
function buildSlab(group) {
  addBox(group, WIDTH, SLAB, 6, MAT.slab, 0, GROUND_HEIGHT + SLAB / 2, -4);
  addBox(group, WIDTH, 0.3, 0.14, MAT.woodDark, 0, GROUND_HEIGHT + 0.1, -1.02);
}

/** Garde-corps : lisse haute, deux lisses basses, montants tous les 1,6 m. */
function addRailRun(group, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const alongX = Math.abs(dx) > Math.abs(dz);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;

  [RAIL, RAIL * 0.62, RAIL * 0.3].forEach((h) => {
    addBox(group, alongX ? length : 0.05, 0.05, alongX ? 0.05 : length, MAT.brass, cx, MEZZANINE_Y + h, cz);
  });
  const posts = Math.max(1, Math.round(length / 1.6));
  for (let i = 0; i <= posts; i += 1) {
    const t = i / posts;
    addBox(group, 0.05, RAIL, 0.05, MAT.steel, x1 + dx * t, MEZZANINE_Y + RAIL / 2, z1 + dz * t);
  }
}

/** Garde-corps du vide et retours encadrant l'arrivée de l'escalier. */
function buildGuardrails(group) {
  const { minX: stairMinX, maxX: stairMaxX } = ROOM_ANCHORS.stairs;
  addRailRun(group, -HALF_W, -1, stairMinX, -1);
  addRailRun(group, stairMaxX, -1, HALF_W, -1);
  addRailRun(group, stairMinX, -1, stairMinX, -2);
  addRailRun(group, stairMaxX, -1, stairMaxX, -2);
}

/** Escalier droit : 14 marches pleines, deux limons inclinés et mains courantes. */
function buildStair(group) {
  const { centreX, width, steps, tread, rise, topZ, railHeight } = STAIR;
  const run = steps * tread;
  const bottomZ = topZ + run;
  const angle = Math.atan2(MEZZANINE_Y, run);
  const slope = Math.hypot(run, MEZZANINE_Y);
  const midZ = (topZ + bottomZ) / 2;

  for (let i = 0; i < steps; i += 1) {
    const height = rise * (i + 1);
    const z = bottomZ - (i + 0.5) * tread;
    addBox(group, width, height, tread + 0.04, MAT.wood, centreX, height / 2, z);
  }

  [-1, 1].forEach((side) => {
    const x = centreX + side * (width / 2 + 0.03);
    const limon = addBox(group, 0.06, 0.3, slope, MAT.woodDark, x, MEZZANINE_Y / 2 + 0.05, midZ);
    limon.rotation.x = angle;
    const handrail = addBox(group, 0.05, 0.06, slope, MAT.steel, x, MEZZANINE_Y / 2 + railHeight, midZ);
    handrail.rotation.x = angle;
    [0.15, 0.5, 0.85].forEach((t) => {
      const z = bottomZ - t * run;
      addBox(group, 0.04, railHeight, 0.04, MAT.steel, x, t * MEZZANINE_Y + railHeight / 2, z);
    });
  });
}

/** Toiture plate à débord discret, corniche filante et auvent de l'entrée. */
function buildRoof(group) {
  addBox(group, WIDTH + 0.6, 0.14, DEPTH + 0.6, MAT.roof, 0, HEIGHT + 0.07, 0);
  addBox(group, WIDTH + 0.22, 0.2, DEPTH + 0.22, MAT.woodDark, 0, HEIGHT - 0.02, 0);
  addBox(group, 2.8, 0.1, 1.3, MAT.woodDark, DOOR.x, 2.95, HALF_D + 0.75);
  [DOOR.x - 1.25, DOOR.x + 1.25].forEach((x) => {
    addBox(group, 0.07, 2.9, 0.07, MAT.brass, x, 1.45, HALF_D + 1.3);
  });
}

/**
 * Crée le groupe d'architecture : murs, baies sur deux niveaux, dalle, garde-corps,
 * escalier et toiture.
 * @returns {THREE.Group} Structure du bâtiment, sans mobilier.
 */
export function createArchitecture() {
  const architecture = new THREE.Group();
  architecture.name = 'architecture';
  buildWalls(architecture);
  buildGlazing(architecture);
  buildSlab(architecture);
  buildGuardrails(architecture);
  buildStair(architecture);
  buildRoof(architecture);

  // Finitions qui font lire la dalle comme un étage : fascia moulurée, frise de dents,
  // plafond à poutres sous la mezzanine et main courante laiton sur le garde-corps.
  const trim = { minX: -HALF_W + 0.6, maxX: HALF_W - 0.6, openZ: -1 };
  addFascia(architecture, { ...trim, y: MEZZANINE_Y });
  addUnderCeiling(architecture, { ...trim, y: MEZZANINE_Y - SLAB - 0.04, minZ: -HALF_D + 0.1 });
  addHandrailCap(architecture, { ...trim, y: MEZZANINE_Y + RAIL, z: -1 });

  return architecture;
}
