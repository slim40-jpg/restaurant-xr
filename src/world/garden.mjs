/**
 * @file    src/world/garden.mjs
 * @brief   Jardin d'un vrai lieu : terrasse bois, pergola, guirlandes, haies, chemin et 4 tables.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-12
 * @role    Étend le restaurant dehors (z ∈ [7,2 ; 16]) et livre les tables T17..T20 au composeur.
 */

import * as THREE from 'three';

import { LEVEL_HEIGHT, LEVELS, PALETTE, ROOM_ANCHORS, TABLE_CATALOGUE } from './layout.mjs';
import { createTable } from './furniture.mjs';

const TERRACE = ROOM_ANCHORS.terrace;
const PERGOLA = ROOM_ANCHORS.pergola;
const ENTRANCE = ROOM_ANCHORS.entrance;

/** Une seule boîte unitaire mise à l'échelle : géométrie mutualisée pour tout le jardin. */
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
/** Ampoule de guirlande : 6 × 4 segments suffisent à lire une sphère à 4 cm. */
const BULB_GEO = new THREE.SphereGeometry(0.055, 6, 4);

/** Matériaux partagés du jardin. */
const MAT = {
  deck: new THREE.MeshStandardMaterial({ color: PALETTE.DECK, roughness: 0.8 }),
  deckDark: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.85 }),
  beam: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.7 }),
  planter: new THREE.MeshStandardMaterial({ color: 0x6f6a5f, roughness: 0.95 }),
  hedge: new THREE.MeshStandardMaterial({ color: PALETTE.PLANT, roughness: 0.9 }),
  hedgeDark: new THREE.MeshStandardMaterial({ color: PALETTE.PLANT_DARK, roughness: 0.95 }),
  stone: new THREE.MeshStandardMaterial({ color: PALETTE.STONE, roughness: 0.9 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.35, metalness: 0.8 }),
  bulb: new THREE.MeshStandardMaterial({ color: 0x4a3a24, emissive: PALETTE.BULB, emissiveIntensity: 1.7 }),
  ground: new THREE.MeshStandardMaterial({ color: 0x2b3128, roughness: 1 }),
};

/** Ajoute une boîte positionnée à un groupe parent. */
function addBox(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(UNIT_BOX, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Sol extérieur sombre : pose la terrasse et le bâtiment sur un terrain au lieu du vide. */
function buildGround(group) {
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), MAT.ground);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.22;
  terrain.receiveShadow = true;
  group.add(terrain);
}

/** Plateforme en lames de bois à y = 0, joue de rive et bandeau périphérique. */
function buildDeck(group) {
  const width = TERRACE.maxX - TERRACE.minX;
  const depth = TERRACE.maxZ - TERRACE.minZ;
  const midZ = (TERRACE.minZ + TERRACE.maxZ) / 2;
  addBox(group, width, 0.16, depth, MAT.deckDark, 0, -0.11, midZ);

  const strips = 20;
  const strip = depth / strips;
  for (let i = 0; i < strips; i += 1) {
    const z = TERRACE.minZ + strip * (i + 0.5);
    addBox(group, width - 0.04, 0.03, strip * 0.94, i % 3 === 0 ? MAT.deckDark : MAT.deck, 0, -0.015, z);
  }
  [TERRACE.minX - 0.05, TERRACE.maxX + 0.05].forEach((x) => {
    addBox(group, 0.1, 0.24, depth, MAT.deckDark, x, -0.14, midZ);
  });
  addBox(group, width + 0.1, 0.24, 0.1, MAT.deckDark, 0, -0.14, TERRACE.maxZ + 0.05);
}

/** Pergola : 4 poteaux, 2 poutres filantes et 11 chevrons, tout sous 2,8 m. */
function buildPergola(group) {
  const top = PERGOLA.y - 0.14;
  const midZ = (PERGOLA.minZ + PERGOLA.maxZ) / 2;
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sz]) => {
    const x = sx * PERGOLA.maxX;
    const z = midZ + sz * ((PERGOLA.maxZ - PERGOLA.minZ) / 2);
    addBox(group, 0.18, top, 0.18, MAT.beam, x, top / 2, z);
  });
  [PERGOLA.minZ, PERGOLA.maxZ].forEach((z) => {
    addBox(group, PERGOLA.maxX * 2 + 0.36, 0.14, 0.16, MAT.beam, 0, top + 0.07, z);
  });
  const rafters = 11;
  for (let i = 0; i < rafters; i += 1) {
    const x = -PERGOLA.maxX + (i * PERGOLA.maxX * 2) / (rafters - 1);
    const span = PERGOLA.maxZ - PERGOLA.minZ;
    addBox(group, 0.09, 0.14, span + 0.2, MAT.beam, x, top + 0.07, midZ);
  }
}

/** Guirlandes : 3 cordes affaissées de 15 ampoules émissives, sans aucune lumière ponctuelle. */
function buildGarlands(group) {
  const strings = [10.06, 12.35, 14.64];
  const perString = 15;
  const bulbs = new THREE.InstancedMesh(BULB_GEO, MAT.bulb, strings.length * perString);
  const matrix = new THREE.Matrix4();
  let index = 0;

  strings.forEach((z) => {
    for (let i = 0; i < perString; i += 1) {
      const t = i / (perString - 1);
      const x = -PERGOLA.maxX + t * PERGOLA.maxX * 2;
      const sag = Math.sin(t * Math.PI) * 0.42;
      matrix.makeTranslation(x, 2.6 - sag, z);
      bulbs.setMatrixAt(index, matrix);
      index += 1;
    }
  });
  bulbs.instanceMatrix.needsUpdate = true;
  group.add(bulbs);
}

/** Haies en bacs : 12 modules qui ferment la terrasse sans masquer le bâtiment. */
function buildHedges(group) {
  const module = (x, z, length, alongZ) => {
    addBox(group, alongZ ? 0.42 : length, 0.36, alongZ ? length : 0.42, MAT.planter, x, 0.18, z);
    addBox(group, alongZ ? 0.48 : length - 0.1, 0.92, alongZ ? length - 0.1 : 0.48, MAT.hedge, x, 0.82, z);
    addBox(group, alongZ ? 0.5 : 0.3, 0.22, alongZ ? 0.3 : 0.5, MAT.hedgeDark, x, 1.34, z);
  };
  [8.7, 11.0, 13.3, 15.4].forEach((z) => {
    module(TERRACE.minX - 0.45, z, 2.0, true);
    module(TERRACE.maxX + 0.45, z, 2.0, true);
  });
  [-6.9, -2.9, 1.1, 5.1].forEach((x) => {
    module(x, TERRACE.maxZ + 0.5, 3.8, false);
  });
}

/** Chemin dallé depuis la porte (z = 7) jusqu'à la pergola, sur la largeur de l'entrée. */
function buildPath(group) {
  const slabs = 6;
  for (let i = 0; i < slabs; i += 1) {
    addBox(group, 1.5, 0.02, 0.7, MAT.stone, ENTRANCE.x, 0.01, 7.55 + i * 0.78);
  }
  addBox(group, 1.6, 0.03, 0.36, MAT.stone, ENTRANCE.x, 0.015, ENTRANCE.z + 0.1);
}

/**
 * Crée le jardin et les tables extérieures.
 * Le décor (`isGarden`) et les tables sont livrés séparément : la caméra masque le décor,
 * tandis que les tables restent sélectionnables et visibles en AR.
 * @returns {{ garden: THREE.Group, tables: THREE.Group }} Décor extérieur et tables T17..T20.
 */
export function createGarden() {
  const garden = new THREE.Group();
  garden.name = 'jardin';
  garden.userData.isGarden = true;
  buildGround(garden);
  buildDeck(garden);
  buildPergola(garden);
  buildGarlands(garden);
  buildHedges(garden);
  buildPath(garden);

  const tables = new THREE.Group();
  tables.name = 'tables-terrasse';
  TABLE_CATALOGUE.filter((entry) => entry.level === LEVELS.TERRACE).forEach((entry) => {
    const table = createTable(entry);
    table.position.y = LEVEL_HEIGHT[entry.level];
    tables.add(table);
  });

  return { garden, tables };
}
