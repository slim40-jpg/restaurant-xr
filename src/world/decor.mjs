/**
 * @file    src/world/decor.mjs
 * @brief   Décoration : appliques, lanternes d'îlot, ardoises, plantes, horloge et affiches.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Complète l'ambiance sans toucher au plan de salle ni au mobilier.
 */

import * as THREE from 'three/webgpu';

import { addClock, addPlant, makeBoard } from './decor-details.mjs';
import { PALETTE, ROOM_LAYOUT } from './layout.mjs';

const HALF_W = ROOM_LAYOUT.WIDTH / 2;
const HALF_D = ROOM_LAYOUT.DEPTH / 2;

/** Matériaux partagés. */
const MAT = {
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.32, metalness: 0.88 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.5, metalness: 0.5 }),
  wood: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.6 }),
  glow: new THREE.MeshBasicMaterial({ color: 0xffe6bf }),
};

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const GLOBE = new THREE.SphereGeometry(0.13, 12, 10);

/**
 * Ajoute une boîte mise à l'échelle.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {THREE.Material} material Matériau.
 * @param {number} w Largeur.
 * @param {number} h Hauteur.
 * @param {number} d Profondeur.
 * @param {number} x Position X.
 * @param {number} y Position Y.
 * @param {number} z Position Z.
 * @returns {THREE.Mesh} Maillage ajouté.
 */
function box(parent, material, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(UNIT_BOX, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Applique murale : platine laiton, bras coudé et globe opalin.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse.
 * @param {number} y Hauteur.
 * @param {number} z Ordonnée.
 * @param {number} facing -1 si l'applique regarde vers -X, +1 vers +X, 0 vers +Z.
 * @returns {void}
 */
function addSconce(parent, x, y, z, facing) {
  const dx = facing === 1 ? -0.09 : facing === -1 ? 0.09 : 0;
  const dz = facing === 0 ? -0.09 : 0;

  box(parent, MAT.brass, 0.14, 0.18, 0.04, x, y, z);
  box(parent, MAT.brass, 0.04, 0.04, 0.18, x + dx, y + 0.06, z + dz);

  const globe = new THREE.Mesh(GLOBE, MAT.glow);
  globe.position.set(x + dx * 1.8, y + 0.06, z + dz * 1.8);
  parent.add(globe);
}

/**
 * Lanterne au-dessus d'un îlot : cadre fer, globe chaud, tige et rosace.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse.
 * @param {number} y Hauteur du globe.
 * @param {number} z Ordonnée.
 * @returns {void}
 */
function addLantern(parent, x, y, z) {
  box(parent, MAT.brass, 0.03, 1.1, 0.03, x, y + 0.75, z);
  box(parent, MAT.brass, 0.16, 0.03, 0.16, x, y + 1.28, z);

  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), MAT.glow);
  globe.position.set(x, y, z);
  parent.add(globe);

  // Cage à quatre montants : lecture « lanterne » plutôt que « ampoule nue ».
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      box(parent, MAT.iron, 0.012, 0.4, 0.012, x + sx * 0.17, y, z + sz * 0.17);
    });
  });
  box(parent, MAT.iron, 0.38, 0.02, 0.38, x, y - 0.2, z);
  box(parent, MAT.iron, 0.38, 0.02, 0.38, x, y + 0.2, z);
}

/**
 * Construit la décoration de la nef.
 * @returns {THREE.Group} Groupe autonome, à ajouter au restaurant.
 */
export function createDecor() {
  const group = new THREE.Group();
  group.name = 'decor';

  // Appliques : mur du fond, puis mur est.
  [-8, -5.4, -2, 1].forEach((x) => {
    addSconce(group, x, 2.65, -HALF_D + 0.16, 0);
  });
  [-5, -2, 6].forEach((z) => {
    addSconce(group, HALF_W - 0.16, 2.65, z, 1);
  });

  // Lanternes au-dessus des trois îlots de bar.
  [-6, 0, 6].forEach((x) => {
    addLantern(group, x, 3.2, -2.6);
  });

  // Plantes dans les angles libres.
  [
    [-10.1, -6.2],
    [10.1, -6.3],
    [-10.2, 6.2],
    [10.2, 6.5],
  ].forEach(([x, z]) => {
    addPlant(group, x, z);
  });

  // Ardoises : une à l'entrée, une près du bar.
  const menu = makeBoard('MENU', ['Tapas frías', 'Arroces y brasa', 'Postres']);
  menu.position.set(HALF_W - 0.16, 2.1, 6.4);
  menu.rotation.y = -Math.PI / 2;
  group.add(menu);

  const daily = makeBoard('PLAT DU JOUR', ['Arroz negro', '26,50 €', 'Vermut 6,50 €']);
  daily.position.set(-HALF_W + 0.18, 2.2, 4.6);
  daily.rotation.y = Math.PI / 2;
  group.add(daily);

  // Horloge au-dessus de la mosaïque du fond.
  addClock(group, 0, 4.9, -HALF_D + 0.16);

  return group;
}
