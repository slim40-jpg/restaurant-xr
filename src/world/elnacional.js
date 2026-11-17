/**
 * @file    src/world/elnacional.js
 * @brief   Signature du lieu : trois îlots de bar, huîtres, vins, jambon et roues suspendues.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Porte les éléments qui identifient El Nacional, d'après la recherche sur le lieu.
 */

import * as THREE from 'three/webgpu';

import { addHangingWheels, addMaturationCase } from './elnacional-decor.js';
import { PALETTE } from './layout.js';

/** Matériaux partagés par tous les éléments. */
const MAT = {
  marble: new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.26, metalness: 0.08 }),
  wood: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.6 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.5, metalness: 0.5 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.34, metalness: 0.85 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x6b2c2a, roughness: 0.72 }),
  cream: new THREE.MeshStandardMaterial({ color: PALETTE.CREAM, roughness: 0.85 }),
  ice: new THREE.MeshStandardMaterial({ color: 0xdff0f5, roughness: 0.3, transparent: true, opacity: 0.9 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xa8c4cf,
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.28,
  }),
  bottleGreen: new THREE.MeshStandardMaterial({ color: 0x2f4a2a, roughness: 0.25, metalness: 0.2 }),
  bottleAmber: new THREE.MeshStandardMaterial({ color: 0x7a4a1e, roughness: 0.25, metalness: 0.2 }),
  oyster: new THREE.MeshStandardMaterial({ color: 0x9aa0a2, roughness: 0.7 }),
  meat: new THREE.MeshStandardMaterial({ color: 0x8a2f2c, roughness: 0.75 }),
};

/** Géométries réutilisées : une seule instance par forme. */
const GEO = {
  stool: new THREE.CylinderGeometry(0.19, 0.19, 0.06, 14),
  stoolLeg: new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8),
  bottle: new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8),
  neck: new THREE.CylinderGeometry(0.018, 0.018, 0.1, 6),
  oyster: new THREE.SphereGeometry(0.06, 8, 6),
  box: new THREE.BoxGeometry(1, 1, 1),
};

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
  const mesh = new THREE.Mesh(GEO.box, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Comptoir central : plateau de marbre, piètement bois et fer, rail de pied en laiton.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse du centre.
 * @param {number} z Ordonnée du centre.
 * @param {number} [length=4] Longueur dans l'axe X.
 * @returns {void}
 */
function addBarIsland(parent, x, z, length = 4) {
  const depth = 1.0;

  box(parent, MAT.marble, length, 0.06, depth, x, 1.05, z);
  box(parent, MAT.wood, length - 0.2, 0.9, depth - 0.2, x, 0.55, z);
  box(parent, MAT.brass, length, 0.04, 0.06, x, 0.16, z + depth / 2 + 0.04);
  box(parent, MAT.iron, 0.12, 0.16, depth - 0.1, x - length / 2 + 0.3, 0.08, z);
  box(parent, MAT.iron, 0.12, 0.16, depth - 0.1, x + length / 2 - 0.3, 0.08, z);

  // Tabourets côté salle.
  const count = Math.max(3, Math.round(length / 1.1));
  for (let i = 0; i < count; i += 1) {
    const sx = x - length / 2 + (length / (count + 1)) * (i + 1);
    const sz = z - depth / 2 - 0.34;
    const seat = new THREE.Mesh(GEO.stool, MAT.leather);
    seat.position.set(sx, 0.74, sz);
    seat.castShadow = true;
    parent.add(seat);
    [-0.1, 0.1].forEach((dx) => {
      [-0.1, 0.1].forEach((dz) => {
        const leg = new THREE.Mesh(GEO.stoolLeg, MAT.iron);
        leg.position.set(sx + dx, 0.37, sz + dz);
        parent.add(leg);
      });
    });
  }
}

/**
 * Bar à huîtres : lit de glace, coquillages, cadre laiton et vitre inclinée.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse.
 * @param {number} z Ordonnée.
 * @returns {void}
 */
function addOysterBar(parent, x, z) {
  box(parent, MAT.wood, 3.0, 0.95, 1.0, x, 0.48, z);
  box(parent, MAT.marble, 3.0, 0.06, 1.0, x, 0.98, z);
  box(parent, MAT.ice, 2.6, 0.14, 0.7, x, 1.08, z);

  for (let i = 0; i < 14; i += 1) {
    const oyster = new THREE.Mesh(GEO.oyster, MAT.oyster);
    oyster.position.set(x - 1.15 + (i % 7) * 0.38, 1.17, z - 0.16 + Math.floor(i / 7) * 0.34);
    oyster.scale.y = 0.55;
    parent.add(oyster);
  }

  const pane = box(parent, MAT.glass, 2.8, 0.6, 0.04, x, 1.42, z - 0.42);
  pane.rotation.x = 0.5;
  box(parent, MAT.brass, 3.0, 0.05, 0.05, x, 1.08, z + 0.48);
}

/**
 * Étagère à vins : trois niveaux, bouteilles vertes et ambrées, magnums.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse du mur.
 * @param {number} z Ordonnée.
 * @returns {void}
 */
function addWineShelf(parent, x, z) {
  for (let level = 0; level < 3; level += 1) {
    const y = 1.35 + level * 0.55;
    box(parent, MAT.wood, 0.32, 0.05, 2.6, x, y, z);
    for (let i = 0; i < 9; i += 1) {
      const body = new THREE.Mesh(GEO.bottle, i % 3 === 0 ? MAT.bottleAmber : MAT.bottleGreen);
      body.position.set(x - 0.02, y + 0.16, z - 1.15 + i * 0.28);
      parent.add(body);
      const neck = new THREE.Mesh(GEO.neck, MAT.bottleGreen);
      neck.position.set(x - 0.02, y + 0.33, z - 1.15 + i * 0.28);
      parent.add(neck);
    }
  }
}

/**
 * Jambon ibérique sur son support, avec couteau long.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse.
 * @param {number} z Ordonnée.
 * @returns {void}
 */
function addHamStand(parent, x, z) {
  box(parent, MAT.wood, 0.5, 0.08, 0.5, x, 0.04, z);
  box(parent, MAT.iron, 0.06, 1.1, 0.06, x, 0.55, z);
  const ham = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.4, 4, 8), MAT.meat);
  ham.position.set(x, 1.12, z);
  ham.rotation.z = 0.35;
  ham.castShadow = true;
  parent.add(ham);
  box(parent, MAT.cream, 0.03, 0.02, 0.5, x + 0.24, 1.14, z);
}

/**
 * Construit les éléments de signature du lieu.
 * @returns {THREE.Group} Groupe autonome, à ajouter au restaurant.
 */
export function createElNacional() {
  const group = new THREE.Group();
  group.name = 'el-nacional';

  // Trois îlots centraux : le marqueur du lieu, avec circulation tout autour.
  [-6, 0, 6].forEach((x) => {
    addBarIsland(group, x, -2.6, 4);
  });

  addOysterBar(group, 7.4, 5.2);
  addWineShelf(group, 10.85, 5.0);
  addHamStand(group, 6.4, 4.4);
  addHangingWheels(group, -3.4, -3.0);
  addMaturationCase(group, 10.5, -4.0);

  return group;
}
