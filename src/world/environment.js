/**
 * @file    src/world/environment.js
 * @brief   Décor de la nef : sols, murs traités par zone, portes et signalétique.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Habille la coquille sans jamais fermer le volume : les voûtes doivent rester visibles.
 */

import * as THREE from 'three/webgpu';

import { PALETTE, ROOM_ANCHORS, ROOM_LAYOUT } from './layout.js';
import { makeTileTexture } from './textures.js';

const { WIDTH, DEPTH, HEIGHT } = ROOM_LAYOUT;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const DOOR = ROOM_ANCHORS.entrance;
const WC = ROOM_ANCHORS.wc;
const KITCHEN = ROOM_ANCHORS.kitchen;

/** Matériaux partagés. */
const MAT = {
  plaster: new THREE.MeshStandardMaterial({ color: 0xd9cfbf, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.6 }),
  woodLight: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_LIGHT, roughness: 0.7 }),
  terracotta: new THREE.MeshStandardMaterial({ color: 0xb5643c, roughness: 0.85 }),
  stone: new THREE.MeshStandardMaterial({ color: PALETTE.STONE, roughness: 0.9 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.55, metalness: 0.4 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.34, metalness: 0.85 }),
  enamel: new THREE.MeshStandardMaterial({ color: 0x1d3a2b, roughness: 0.5 }),
};

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

/** Sol : parquet dans la nef, cubes de bois hexagonaux à l'entrée, terre cuite en terrasse. */
function buildFloor(group) {
  const parquet = new THREE.Mesh(
    new THREE.PlaneGeometry(WIDTH, DEPTH),
    new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_LIGHT, roughness: 0.62 })
  );
  parquet.rotation.x = -Math.PI / 2;
  parquet.receiveShadow = true;
  group.add(parquet);

  const hexTexture = makeTileTexture(['#8a6842', '#7a5a38', '#96744a'], 10, 'hex');
  hexTexture.repeat.set(4, 3);
  const entrance = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 5),
    new THREE.MeshStandardMaterial({ map: hexTexture, roughness: 0.7 })
  );
  entrance.rotation.x = -Math.PI / 2;
  entrance.position.set(DOOR.x - 1.2, 0.012, HALF_D - 2.6);
  entrance.receiveShadow = true;
  group.add(entrance);

  // Frise de terre cuite devant la cuisine, comme un tapis de service.
  box(group, 3.2, 0.02, 1.4, MAT.terracotta, KITCHEN.x, 0.011, -HALF_D + 1.1);
}

/** Quatre traitements de mur : mosaïque ivoire/vert, carreaux cobalt, boiserie noyer, crème. */
function buildWalls(group) {
  const creamTexture = makeTileTexture(['#efe7d8', '#e7ddca'], 8, 'square');
  creamTexture.repeat.set(10, 6);
  const cream = new THREE.MeshStandardMaterial({ map: creamTexture, roughness: 0.95 });

  // Mur du fond (taperia) : mosaïque hexagonale ivoire et vert.
  const mosaic = makeTileTexture(['#ede6d6', '#4f7a3a'], 14, 'hex');
  mosaic.repeat.set(8, 1);
  const mosaicMat = new THREE.MeshStandardMaterial({ map: mosaic, roughness: 0.85 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH - 1.2, 4.2), mosaicMat);
  back.position.set(0, 2.1, -HALF_D + 0.13);
  back.receiveShadow = true;
  group.add(back);

  // Mur est (llotja) : carreaux blancs et bleu cobalt sur 2,6 m.
  const cobalt = makeTileTexture(['#e9e6dd', '#2f4f7a'], 9, 'square');
  cobalt.repeat.set(6, 2);
  const cobaltMat = new THREE.MeshStandardMaterial({ map: cobalt, roughness: 0.8 });
  const east = new THREE.Mesh(new THREE.PlaneGeometry(DEPTH - 1.5, 2.6), cobaltMat);
  east.rotation.y = -Math.PI / 2;
  east.position.set(HALF_W - 0.13, 1.3, 0);
  group.add(east);
  box(group, 0.1, 4.6, DEPTH - 1.2, cream, HALF_W - 0.1, 5.0, 0);

  // Mur ouest : boiserie noyer de 2,4 m, crème au-dessus.
  box(group, 0.08, 2.4, DEPTH - 1.4, MAT.wood, -HALF_W + 0.14, 1.2, 0);
  const woodTop = new THREE.Mesh(new THREE.PlaneGeometry(DEPTH - 1.4, 5.4), cream);
  woodTop.rotation.y = Math.PI / 2;
  woodTop.position.set(-HALF_W + 0.13, 5.1, 0);
  group.add(woodTop);
}

/** Portes de service et d'entrée. */
function buildDoors(group) {
  [
    [KITCHEN.x, 'CUISINE'],
    [WC.x, 'WC'],
  ].forEach(([x]) => {
    box(group, 1.1, 2.1, 0.08, MAT.wood, x, 1.05, -HALF_D + 0.16);
    box(group, 0.1, 2.1, 0.12, MAT.brass, x - 0.55, 1.05, -HALF_D + 0.18);
    box(group, 0.1, 2.1, 0.12, MAT.brass, x + 0.55, 1.05, -HALF_D + 0.18);
  });
}

/**
 * Panneau de signalétique dessiné en canvas.
 * @param {string} text Texte à afficher.
 * @param {number} width Largeur du panneau.
 * @param {number} height Hauteur du panneau.
 * @returns {THREE.Mesh} Panneau prêt à poser.
 */
function makeSign(text, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1d3a2b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#b08d57';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = '#f1e8da';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 })
  );
}

/** Enseignes en émail : cuisine, WC et nom du lieu au-dessus du passage. */
function buildSigns(group) {
  const kitchen = makeSign('CUISINE', 1.5, 0.55);
  kitchen.position.set(KITCHEN.x, 2.45, -HALF_D + 0.18);
  group.add(kitchen);

  const wc = makeSign('WC', 1.1, 0.5);
  wc.position.set(WC.x, 2.4, -HALF_D + 0.18);
  group.add(wc);
}

/** Plinthes et cimaises : donnent l'échelle du volume. */
function buildBaseboards(group) {
  box(group, WIDTH - 0.4, 0.18, 0.06, MAT.stone, 0, 0.09, -HALF_D + 0.15);
  box(group, WIDTH - 0.4, 0.1, 0.05, MAT.brass, 0, 2.42, -HALF_D + 0.16);
  box(group, 0.06, HEIGHT - 0.4, 0.14, MAT.stone, -HALF_W + 0.16, HEIGHT / 2, HALF_D - 0.15);
}

/**
 * Crée le groupe d'environnement : sols, murs traités, portes, enseignes.
 *
 * Aucun plafond n'est dessiné ici : les quinze voûtes de `architecture.js` doivent
 * rester visibles. C'est l'erreur commise dans la version précédente, où une dalle
 * fermait le volume et faisait lire la nef comme une salle banale.
 *
 * @returns {THREE.Group} Décor intérieur, sans mobilier ni tables.
 */
export function createEnvironment() {
  const environment = new THREE.Group();
  environment.name = 'environment';
  buildFloor(environment);
  buildWalls(environment);
  buildDoors(environment);
  buildSigns(environment);
  buildBaseboards(environment);
  return environment;
}
