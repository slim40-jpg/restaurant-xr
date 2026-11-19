/**
 * @file    src/world/facade.mjs
 * @brief   Façade sur rue : soubassement, vitrines, auvent, enseigne, appliques et seuil.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Donne au bâtiment un extérieur crédible, visible depuis la terrasse et le trottoir.
 */

import * as THREE from 'three/webgpu';

import { PALETTE, ROOM_ANCHORS, ROOM_LAYOUT } from './layout.mjs';

const WIDTH = ROOM_LAYOUT.WIDTH;
const HEIGHT = ROOM_LAYOUT.HEIGHT;
const Z = ROOM_LAYOUT.DEPTH / 2 + 0.02;
const DOOR = ROOM_ANCHORS.entrance;

const MAT = {
  stone: new THREE.MeshStandardMaterial({ color: PALETTE.STONE, roughness: 0.88 }),
  stoneDark: new THREE.MeshStandardMaterial({ color: 0x918a7c, roughness: 0.9 }),
  plaster: new THREE.MeshStandardMaterial({ color: 0xd8cdb8, roughness: 0.94 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.5, metalness: 0.5 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.32, metalness: 0.88 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x8fa6b2,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.42,
  }),
  awning: new THREE.MeshStandardMaterial({
    color: PALETTE.AWNING_RED,
    roughness: 0.72,
    side: THREE.DoubleSide,
  }),
  glow: new THREE.MeshBasicMaterial({ color: 0xffe3b8 }),
  leaf: new THREE.MeshStandardMaterial({ color: PALETTE.PLANT, roughness: 0.85 }),
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
 * Plaque émaillée dessinée en canvas.
 * @param {string} text Texte de l'enseigne.
 * @returns {THREE.Mesh} Panneau de 4,4 × 1,1 m prêt à poser.
 */
function makeEnamel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#17352a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#b08d57';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  ctx.fillStyle = '#f1e8da';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.1),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.45, metalness: 0.1 })
  );
}

/**
 * Vitrine de rue : encadrement pierre, vitre, meneaux et allège.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse du centre.
 * @param {number} width Largeur de la baie.
 * @returns {void}
 */
function addShopWindow(parent, x, width) {
  const sill = 0.95;
  const top = 3.6;

  box(parent, MAT.stone, width + 0.5, 0.18, 0.36, x, sill - 0.09, Z + 0.06);
  box(parent, MAT.stone, width + 0.5, 0.22, 0.36, x, top + 0.11, Z + 0.06);
  [-1, 1].forEach((side) => {
    box(
      parent,
      MAT.stone,
      0.22,
      top - sill + 0.4,
      0.36,
      x + (side * (width + 0.28)) / 2,
      (sill + top) / 2,
      Z + 0.06
    );
  });

  box(parent, MAT.glass, width, top - sill, 0.03, x, (sill + top) / 2, Z + 0.02).castShadow = false;

  box(parent, MAT.iron, 0.04, top - sill, 0.06, x, (sill + top) / 2, Z + 0.05);
  box(parent, MAT.stoneDark, width, sill, 0.3, x, sill / 2, Z + 0.04);
}

/**
 * Auvent rouge : toile inclinée, jupe festonnée, bras laiton.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} width Largeur de l'auvent.
 * @returns {void}
 */
function addAwning(parent, width) {
  const y = 3.15;
  const depth = 1.35;
  const cloth = box(parent, MAT.awning, width, 0.04, depth, DOOR.x, y, Z + depth / 2);
  cloth.rotation.x = -0.2;

  const teeth = Math.floor(width / 0.28);
  for (let i = 0; i < teeth; i += 1) {
    box(parent, MAT.awning, 0.24, 0.16, 0.03, DOOR.x - width / 2 + 0.14 + i * 0.28, y - 0.22, Z + depth);
  }
}

/**
 * Applique de façade : potence en fer et lanterne.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse.
 * @returns {void}
 */
function addWallLantern(parent, x) {
  box(parent, MAT.iron, 0.06, 0.06, 0.5, x, 3.0, Z + 0.25);
  box(parent, MAT.iron, 0.22, 0.3, 0.22, x, 2.78, Z + 0.5);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), MAT.glow);
  lamp.position.set(x, 2.78, Z + 0.5);
  parent.add(lamp);
  box(parent, MAT.iron, 0.16, 0.04, 0.16, x, 2.6, Z + 0.5);
}

/**
 * Construit la façade sur rue.
 * @returns {THREE.Group} Groupe autonome, à ajouter au restaurant.
 */
export function createFacade() {
  const group = new THREE.Group();
  group.name = 'facade';

  box(group, MAT.stoneDark, WIDTH + 0.4, 0.7, 0.24, 0, 0.35, Z + 0.04);
  box(group, MAT.plaster, WIDTH + 0.4, HEIGHT - 3.9, 0.16, 0, 6.15, Z + 0.02);
  box(group, MAT.stone, WIDTH + 0.5, 0.22, 0.34, 0, 3.75, Z + 0.06);
  box(group, MAT.stone, WIDTH + 0.5, 0.18, 0.3, 0, 7.0, Z + 0.06);

  addShopWindow(group, 1.2, 2.4);
  addShopWindow(group, -6.6, 2.4);

  box(group, MAT.stone, 0.34, 3.1, 0.4, DOOR.x - DOOR.width / 2 - 0.22, 1.55, Z + 0.06);
  box(group, MAT.stone, 0.34, 3.1, 0.4, DOOR.x + DOOR.width / 2 + 0.22, 1.55, Z + 0.06);
  box(group, MAT.stone, DOOR.width + 0.9, 0.3, 0.42, DOOR.x, 3.25, Z + 0.06);
  box(group, MAT.stoneDark, DOOR.width + 0.7, 0.12, 0.9, DOOR.x, 0.06, Z + 0.45);
  box(group, MAT.iron, DOOR.width - 0.3, 0.02, 0.6, DOOR.x, 0.13, Z + 0.4);

  addAwning(group, 3.6);

  const sign = makeEnamel('EL NACIONAL');
  sign.position.set(DOOR.x, 4.6, Z + 0.1);
  group.add(sign);

  addWallLantern(group, DOOR.x - 2.4);
  addWallLantern(group, DOOR.x + 2.4);

  [-1, 1].forEach((side) => {
    const x = DOOR.x + side * 1.9;
    box(group, MAT.stoneDark, 0.9, 0.55, 0.45, x, 0.27, Z + 0.35);
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), MAT.leaf);
    shrub.position.set(x, 0.78, Z + 0.35);
    shrub.castShadow = true;
    group.add(shrub);
  });

  return group;
}
