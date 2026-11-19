/**
 * @file    src/world/elnacional-decor.mjs
 * @brief   Éléments secondaires du lieu : roues suspendues et vitrine de maturation.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Isole les objets décoratifs lourds pour garder `elnacional.mjs` sous 200 lignes.
 */

import * as THREE from 'three/webgpu';

import { PALETTE } from './layout.mjs';

/** Matériaux partagés. */
const MAT = {
  iron: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.5, metalness: 0.5 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.34, metalness: 0.85 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xa8c4cf,
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.28,
  }),
  meat: new THREE.MeshStandardMaterial({ color: 0x8a2f2c, roughness: 0.75 }),
};

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const WHEEL = new THREE.TorusGeometry(0.62, 0.05, 6, 18);

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
 * Quatre roues métalliques suspendues, signature de la zone braseria.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse du centre de la zone.
 * @param {number} z Ordonnée du centre de la zone.
 * @returns {void}
 */
export function addHangingWheels(parent, x, z) {
  const wheels = [
    [-2.2, 0, 4.6, 1.0],
    [0, 0.8, 5.0, 0.72],
    [2.0, -0.4, 4.4, 0.9],
    [0.4, -1.4, 4.8, 0.6],
  ];

  wheels.forEach(([dx, dz, y, scale]) => {
    const wheel = new THREE.Mesh(WHEEL, MAT.iron);
    wheel.position.set(x + dx, y, z + dz);
    wheel.scale.setScalar(scale);
    wheel.castShadow = true;
    parent.add(wheel);
  });
}

/**
 * Vitrine de maturation : caisson sombre, vitre frontale, étagères de viande.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse.
 * @param {number} z Ordonnée.
 * @returns {void}
 */
export function addMaturationCase(parent, x, z) {
  box(parent, MAT.iron, 2.2, 2.2, 0.8, x, 1.1, z);

  const pane = box(parent, MAT.glass, 2.0, 1.9, 0.04, x, 1.1, z - 0.42);
  pane.castShadow = false;

  for (let i = 0; i < 6; i += 1) {
    box(parent, MAT.meat, 0.3, 0.16, 0.28, x - 0.7 + (i % 3) * 0.7, 1.0 + Math.floor(i / 3) * 0.55, z);
  }

  box(parent, MAT.brass, 2.2, 0.05, 0.05, x, 2.2, z - 0.4);
}
