/**
 * @file    src/world/architecture.js
 * @brief   Nef unique de 8 m : quinze voûtes catalanes, colonnes de fonte, verrières et vestibule.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Porte la coquille du lieu, sans meubles ni décor, d'après la nef d'El Nacional.
 */

import * as THREE from 'three/webgpu';

import { PALETTE, ROOM_LAYOUT } from './layout.js';
import { createVestibule } from './vestibule.js';

const { WIDTH, DEPTH, HEIGHT } = ROOM_LAYOUT;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;

/** Nombre de travées de voûte sur la longueur. */
const BAYS = 15;
/** Largeur d'une travée. */
const BAY = WIDTH / BAYS;
/** Flèche de la voûte (montée au centre). */
const RISE = 0.45;
/** Rayon du cylindre générant l'arc surbaissé. */
const RADIUS = (BAY * BAY * 0.25 + RISE * RISE) / (2 * RISE);
/** Demi-angle de l'arc. */
const THETA = 2 * Math.asin((BAY * 0.5) / RADIUS);
/** Hauteur de naissance de la voûte. */
const SPRING = HEIGHT - RISE;

/** Matériaux partagés. */
const MAT = {
  plaster: new THREE.MeshStandardMaterial({ color: PALETTE.CREAM, roughness: 0.94 }),
  vault: new THREE.MeshStandardMaterial({ color: 0xede6d6, roughness: 0.96, side: THREE.DoubleSide }),
  rib: new THREE.MeshStandardMaterial({ color: 0xd9d0bf, roughness: 0.9 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.55, metalness: 0.45 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.34, metalness: 0.85 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x9fb6c4,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.3,
  }),
  light: new THREE.MeshBasicMaterial({ color: 0xfff4e0 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x241f1b, roughness: 0.9 }),
};

/** Géométrie d'arc réutilisée par les quinze travées (axe du cylindre sur Z). */
const VAULT_GEO = new THREE.CylinderGeometry(RADIUS, RADIUS, DEPTH, 12, 1, true, -THETA / 2, THETA);

/**
 * Ajoute une boîte positionnée au centre.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} w Largeur.
 * @param {number} h Hauteur.
 * @param {number} d Profondeur.
 * @param {THREE.Material} material Matériau.
 * @param {number} x Position X.
 * @param {number} y Position Y.
 * @param {number} z Position Z.
 * @returns {THREE.Mesh} Maillage ajouté.
 */
function box(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Murs périmétriques de 8 m, avec baies sur la façade et trou de porte à l'entrée. */
function buildWalls(group) {
  box(group, WIDTH, HEIGHT, 0.24, MAT.plaster, 0, HEIGHT / 2, -HALF_D);
  box(group, WIDTH, HEIGHT, 0.24, MAT.plaster, 0, HEIGHT / 2, HALF_D);
  box(group, 0.24, HEIGHT, DEPTH, MAT.plaster, HALF_W, HEIGHT / 2, 0);

  // Façade vitrée : deux niveaux de baies séparés par un bandeau plein.
  const pierBefore = new THREE.Mesh(new THREE.BoxGeometry(0.24, HEIGHT, DEPTH), MAT.plaster);
  pierBefore.position.set(-HALF_W, HEIGHT / 2, 0);
  pierBefore.visible = false;
  group.add(pierBefore);

  box(group, 0.24, 0.9, DEPTH, MAT.plaster, -HALF_W, 0.45, 0);
  box(group, 0.24, 0.5, DEPTH, MAT.plaster, -HALF_W, 3.15, 0);
  box(group, 0.24, 1.1, DEPTH, MAT.plaster, -HALF_W, HEIGHT - 0.55, 0);

  // Verrières basse et haute, entre les bandeaux.
  box(group, 0.06, 2.2, DEPTH - 0.4, MAT.glass, -HALF_W + 0.02, 2.0, 0);
  box(group, 0.06, 3.7, DEPTH - 0.4, MAT.glass, -HALF_W + 0.02, 5.7, 0);

  // Montants verticaux tous les 1,5 m.
  for (let z = -HALF_D + 0.8; z < HALF_D - 0.5; z += 1.5) {
    box(group, 0.1, 6.6, 0.1, MAT.iron, -HALF_W + 0.06, 3.4, z);
  }
}

/** Quinze voûtes catalanes surbaissées, séparées par des nervures. */
function buildVaults(group) {
  for (let i = 0; i < BAYS; i += 1) {
    const x = -HALF_W + BAY * (i + 0.5);
    const section = new THREE.Mesh(VAULT_GEO, MAT.vault);
    section.rotation.x = Math.PI / 2;
    section.position.set(x, SPRING - RADIUS + RADIUS, 0);
    section.position.y = HEIGHT - RADIUS;
    section.receiveShadow = true;
    group.add(section);

    // Nervure de séparation entre deux travées.
    if (i > 0) {
      box(group, 0.09, 0.16, DEPTH - 0.2, MAT.rib, -HALF_W + BAY * i, SPRING + RISE * 0.55, 0);
    }
  }
  // Nervures d'about.
  box(group, 0.12, 0.2, DEPTH - 0.2, MAT.rib, -HALF_W + 0.1, SPRING + 0.1, 0);
  box(group, 0.12, 0.2, DEPTH - 0.2, MAT.rib, HALF_W - 0.1, SPRING + 0.1, 0);
}

/** Colonnes de fonte le long des murs, et verrières zénithales sur l'axe. */
function buildColumnsAndLights(group) {
  [-4.4, 0, 4.4].forEach((z) => {
    [-HALF_W + 0.45, HALF_W - 0.45].forEach((x) => {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, SPRING, 12), MAT.iron);
      shaft.position.set(x, SPRING / 2, z);
      shaft.castShadow = true;
      group.add(shaft);
      box(group, 0.42, 0.12, 0.42, MAT.iron, x, SPRING - 0.06, z);
      box(group, 0.5, 0.14, 0.5, MAT.iron, x, 0.07, z);
    });
  });

  // Cinq zénithales lumineuses au faîte : la nef doit être baignée de jour.
  [-8.4, -4.2, 0, 4.2, 8.4].forEach((x) => {
    box(group, 2.2, 0.06, 2.6, MAT.light, x, HEIGHT - 0.06, 0);
    box(group, 2.4, 0.1, 2.8, MAT.iron, x, HEIGHT + 0.02, 0);
  });
}

/** Toiture et acrotère : ferment le volume sans laisser voir le ciel. */
function buildRoof(group) {
  box(group, WIDTH + 0.4, 0.2, DEPTH + 0.4, MAT.dark, 0, HEIGHT + 0.12, 0);
  [
    [-HALF_W - 0.2, 0, 0.3, DEPTH + 0.4],
    [HALF_W + 0.2, 0, 0.3, DEPTH + 0.4],
  ].forEach(([x, z, w, d]) => {
    box(group, w, 0.5, d, MAT.plaster, x, HEIGHT + 0.3, z);
  });
  [-HALF_D - 0.2, HALF_D + 0.2].forEach((z) => {
    box(group, WIDTH + 0.4, 0.5, 0.3, MAT.plaster, 0, HEIGHT + 0.3, z);
  });
}

/**
 * Crée le groupe d'architecture : murs, verrières, voûtes, colonnes, toiture et vestibule.
 * @returns {THREE.Group} Structure du bâtiment, sans mobilier.
 */
export function createArchitecture() {
  const architecture = new THREE.Group();
  architecture.name = 'architecture';
  buildWalls(architecture);
  buildVaults(architecture);
  buildColumnsAndLights(architecture);
  buildRoof(architecture);
  architecture.add(createVestibule());
  return architecture;
}
