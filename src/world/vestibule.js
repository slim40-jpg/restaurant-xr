/**
 * @file    src/world/vestibule.js
 * @brief   Porte de sortie : double vantail vitré, cadre laiton, seuil, poignées et enseigne.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Donne au passage d'entrée une vraie porte de restaurant, et non un trou dans un mur.
 */

import * as THREE from 'three/webgpu';

import { PALETTE, ROOM_ANCHORS, ROOM_LAYOUT } from './layout.js';

const DOOR = ROOM_ANCHORS.entrance;
const Z_BACK = ROOM_LAYOUT.DEPTH / 2 - 0.1;
const LEAF_W = DOOR.width / 2;

/** Matériaux partagés. */
const MAT = {
  steel: new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.35, metalness: 0.75 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.3, metalness: 0.9 }),
  brassDark: new THREE.MeshStandardMaterial({ color: 0x8a6f45, roughness: 0.4, metalness: 0.8 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xbcd0d8,
    roughness: 0.06,
    metalness: 0.1,
    transparent: true,
    opacity: 0.32,
  }),
  stone: new THREE.MeshStandardMaterial({ color: PALETTE.STONE, roughness: 0.85 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.55, metalness: 0.4 }),
  bulb: new THREE.MeshBasicMaterial({ color: 0xfff1d6 }),
};

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

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
 * Dessine une enseigne émaillée sur un plan.
 * @param {string} text Texte de l'enseigne.
 * @param {number} width Largeur du panneau.
 * @param {number} height Hauteur du panneau.
 * @returns {THREE.Mesh} Panneau prêt à poser.
 */
function makeSign(text, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1d3a2b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#b08d57';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = '#f1e8da';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55 })
  );
}

/**
 * Construit un vantail vitré : cadre laiton, vitre, traverses et poignée.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} side -1 pour le vantail gauche, +1 pour le droit.
 * @param {number} openAngle Angle d'ouverture en radians.
 * @returns {THREE.Group} Vantail pivoté sur ses gonds.
 */
function createLeaf(parent, side, openAngle) {
  const leaf = new THREE.Group();
  const width = LEAF_W - 0.04;
  const height = DOOR.height - 0.14;
  const bar = 0.06;

  // Cadre du vantail.
  box(leaf, MAT.steel, width, bar, 0.06, 0, height - bar / 2, 0);
  box(leaf, MAT.steel, width, bar * 1.6, 0.06, 0, bar * 0.8, 0);
  [-1, 1].forEach((edge) => {
    box(leaf, MAT.steel, bar, height, 0.06, (edge * (width - bar)) / 2, height / 2, 0);
  });

  // Vitre en deux carreaux.
  const glass = box(leaf, MAT.glass, width - bar * 2, height - bar * 2.6, 0.02, 0, height / 2 + bar * 0.2, 0);
  glass.castShadow = false;

  // Traverse médiane.
  box(leaf, MAT.steel, width - bar * 2, 0.035, 0.05, 0, 1.35, 0);

  // Poignée verticale côté jonction.
  const handleX = side * (width / 2 - 0.09);
  box(leaf, MAT.steelDark, 0.028, 0.9, 0.028, handleX, 1.15, -0.07);
  [-0.38, 0.38].forEach((dy) => {
    box(leaf, MAT.steelDark, 0.03, 0.03, 0.09, handleX, 1.15 + dy, -0.035);
  });

  // Ferme-porte discret au-dessus du vantail.
  box(leaf, MAT.iron, 0.26, 0.06, 0.08, handleX * 0.6, height - 0.02, -0.05);

  leaf.position.set(side * (width / 2 + 0.02), 0.02, Z_BACK);
  leaf.rotation.y = side * openAngle;
  parent.add(leaf);
  return leaf;
}

/**
 * Construit le sas d'entrée : dormant laiton, double vantail vitré entrouvert,
 * seuil de pierre, enseigne SORTIE et guirlande.
 * @returns {THREE.Group} Groupe autonome, à ajouter à l'architecture.
 */
export function createVestibule() {
  const group = new THREE.Group();
  group.name = 'vestibule';

  // Dormant : montants et linteau en laiton, encastrés dans le mur.
  [-1, 1].forEach((side) => {
    box(
      group,
      MAT.steel,
      0.1,
      DOOR.height + 0.16,
      0.26,
      DOOR.x + (side * (DOOR.width + 0.12)) / 2,
      DOOR.height / 2,
      Z_BACK
    );
  });
  box(group, MAT.steel, DOOR.width + 0.34, 0.14, 0.26, DOOR.x, DOOR.height + 0.09, Z_BACK);

  // Seuil en pierre, légèrement saillant.
  box(group, MAT.stone, DOOR.width + 0.5, 0.05, 0.62, DOOR.x, 0.025, Z_BACK - 0.1);

  // Deux vantaux entrouverts vers l'extérieur.
  const left = createLeaf(group, -1, 0.3);
  const right = createLeaf(group, 1, 0.3);
  left.position.x += DOOR.x;
  right.position.x += DOOR.x;

  // Enseigne SORTIE au-dessus du dormant, visible depuis la salle.
  const sign = makeSign('SORTIE', 1.1, 0.42);
  sign.position.set(DOOR.x, DOOR.height + 0.55, Z_BACK - 0.16);
  sign.rotation.y = Math.PI;
  group.add(sign);

  // Applique extérieure et guirlande du passage.
  box(group, MAT.iron, 0.22, 0.08, 0.08, DOOR.x, DOOR.height + 0.95, Z_BACK + 0.2);
  for (let i = 0; i < 9; i += 1) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), MAT.bulb);
    bulb.position.set(DOOR.x - 0.72 + i * 0.18, DOOR.height - 0.22 + Math.sin(i) * 0.04, Z_BACK - 0.34);
    group.add(bulb);
  }

  return group;
}
