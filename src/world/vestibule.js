/**
 * @file    src/world/vestibule.js
 * @brief   Passage d'entrée : montants sombres, portes en laiton et guirlande de ampoules.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Isole le sas d'entrée, qui donne son contraste sombre à la nef claire.
 */

import * as THREE from 'three/webgpu';

import { PALETTE, ROOM_ANCHORS, ROOM_LAYOUT } from './layout.js';

const DOOR = ROOM_ANCHORS.entrance;
const Z_BACK = ROOM_LAYOUT.DEPTH / 2 - 0.1;

/** Matériaux du vestibule. */
const MAT = {
  dark: new THREE.MeshStandardMaterial({ color: 0x241f1b, roughness: 0.9 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.34, metalness: 0.85 }),
  bulb: new THREE.MeshBasicMaterial({ color: 0xfff4e0 }),
};

/**
 * Ajoute une boîte au groupe.
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

/**
 * Construit le sas d'entrée : linteau, montants, deux battants entrouverts et guirlande.
 * @returns {THREE.Group} Groupe autonome, à ajouter à l'architecture.
 */
export function createVestibule() {
  const group = new THREE.Group();
  group.name = 'vestibule';

  // Linteau et montants.
  box(group, DOOR.width + 1.2, 0.3, 0.2, MAT.dark, DOOR.x, DOOR.height + 0.15, Z_BACK);
  [-1, 1].forEach((side) => {
    const x = DOOR.x + (side * DOOR.width) / 2;
    box(group, 0.24, DOOR.height + 0.3, 0.2, MAT.dark, x, (DOOR.height + 0.3) / 2, Z_BACK);
    box(group, 0.05, DOOR.height - 0.2, 0.24, MAT.brass, x, DOOR.height / 2, Z_BACK - 0.02);
  });

  // Deux battants en laiton, entrouverts vers l'intérieur.
  [-1, 1].forEach((side) => {
    const leaf = box(
      group,
      DOOR.width / 2 - 0.06,
      DOOR.height - 0.12,
      0.05,
      MAT.brass,
      DOOR.x + (side * DOOR.width) / 4,
      DOOR.height / 2,
      Z_BACK - 0.14
    );
    leaf.rotation.y = side * 0.28;
  });

  // Guirlande du passage : petites ampoules chaudes, sans lumière additionnelle.
  for (let i = 0; i < 9; i += 1) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), MAT.bulb);
    bulb.position.set(DOOR.x - 0.7 + i * 0.175, DOOR.height - 0.25 + Math.sin(i) * 0.04, Z_BACK - 0.3);
    group.add(bulb);
  }

  return group;
}
