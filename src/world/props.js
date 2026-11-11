/**
 * @file    src/world/props.js
 * @brief   Mobilier fixe du restaurant : bar, banquettes, plantes, lampes, accueil et signalétique.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Remplit la salle d'objets procéduraux reconnaissables en réutilisant matériaux et géométries.
 */

import * as THREE from 'three';

import { ZONES } from '../config/constants.js';
import { PALETTE, ROOM_ANCHORS, TABLE_CATALOGUE } from './layout.js';
import { createTableware } from './tableware.js';

/** Matériaux partagés des accessoires. */
const MAT = {
  wood: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD, roughness: 0.6 }),
  woodDark: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.75 }),
  wine: new THREE.MeshStandardMaterial({ color: PALETTE.WINE, roughness: 0.85 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.35, metalness: 0.8 }),
  charcoal: new THREE.MeshStandardMaterial({ color: PALETTE.CHARCOAL, roughness: 0.6 }),
  plant: new THREE.MeshStandardMaterial({ color: PALETTE.PLANT, roughness: 0.85 }),
  plantDark: new THREE.MeshStandardMaterial({ color: PALETTE.PLANT_DARK, roughness: 0.9 }),
  terracotta: new THREE.MeshStandardMaterial({ color: 0x8a4b33, roughness: 0.9 }),
  cream: new THREE.MeshStandardMaterial({ color: PALETTE.CREAM, roughness: 0.9 }),
  bulb: new THREE.MeshStandardMaterial({ color: 0xffe3b0, emissive: 0xffb85c, emissiveIntensity: 1.4 }),
  glow: new THREE.MeshBasicMaterial({ color: 0xffcf8a }),
};

/** Géométries partagées, instanciées par matériau plutôt que dupliquées par objet. */
const GEO = {
  stoolSeat: new THREE.CylinderGeometry(0.19, 0.19, 0.07, 16),
  stoolLeg: new THREE.CylinderGeometry(0.02, 0.02, 0.72, 6),
  pot: new THREE.CylinderGeometry(0.26, 0.19, 0.42, 14),
  leaf: new THREE.IcosahedronGeometry(0.34, 0),
  bottle: new THREE.CylinderGeometry(0.05, 0.06, 0.32, 8),
  wire: new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6),
  shade: new THREE.ConeGeometry(0.3, 0.32, 18, 1, true),
  bulb: new THREE.SphereGeometry(0.07, 8, 8),
};

/** Ajoute une boîte positionnée à un groupe parent. */
function addBox(parent, w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Ajoute un maillage partagé positionné à un groupe parent. */
function addMesh(parent, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Tabouret de bar : assise ronde, quatre pieds fins et repose-pied. */
function addStool(parent, x, z) {
  addMesh(parent, GEO.stoolSeat, MAT.wine, x, 0.75, z);
  [
    [-0.12, -0.12],
    [0.12, -0.12],
    [-0.12, 0.12],
    [0.12, 0.12],
  ].forEach(([dx, dz]) => {
    addMesh(parent, GEO.stoolLeg, MAT.brass, x + dx, 0.37, z + dz);
  });
}

/** Comptoir de bar adossé au mur X = +11, avec étagère à bouteilles et tabourets. */
function createBar(parent) {
  const { counterX, length, z } = ROOM_ANCHORS.bar;
  addBox(parent, 0.9, 1.05, length, MAT.wine, counterX, 0.525, z);
  addBox(parent, 1.05, 0.08, length + 0.2, MAT.wood, counterX - 0.05, 1.09, z);
  addBox(parent, 0.05, 0.05, length - 0.2, MAT.brass, counterX - 0.5, 0.2, z);
  addBox(parent, 0.35, 0.05, length - 0.4, MAT.wood, 10.85, 1.7, z);
  addBox(parent, 0.35, 0.05, length - 0.4, MAT.wood, 10.85, 2.2, z);

  for (let i = 0; i < 9; i += 1) {
    const bz = z - 2.0 + i * 0.5;
    addMesh(parent, GEO.bottle, MAT.plantDark, 10.85, 1.9, bz);
    if (i % 2 === 0) addMesh(parent, GEO.bottle, MAT.wine, 10.85, 2.4, bz);
  }

  [-0.4, 0.6, 2.4, 3.4].forEach((sz) => {
    addStool(parent, 9.4, sz);
  });
}

/** Banquette capitonnée continue le long du mur du fond (Z = −7). */
function createBanquettes(parent) {
  const z = -6.68;
  addBox(parent, 13.2, 0.45, 0.65, MAT.wine, -3.0, 0.45, z);
  addBox(parent, 13.2, 0.85, 0.14, MAT.wine, -3.0, 0.92, z - 0.3);
  addBox(parent, 0.18, 0.62, 0.72, MAT.woodDark, -9.68, 0.5, z);
  addBox(parent, 0.18, 0.62, 0.72, MAT.woodDark, 3.68, 0.5, z);
  for (let i = 0; i < 15; i += 1) {
    addBox(parent, 0.03, 0.8, 0.12, MAT.charcoal, -9.5 + i * 0.9, 0.92, z - 0.2);
  }
}

/** Plantes en pot low-poly réparties dans les coins de la salle. */
function createPlants(parent) {
  [
    [-10.3, 6.4, 1.1],
    [9.7, 6.2, 1.15],
    [10.2, -6.4, 0.95],
    [4.3, 6.0, 0.85],
  ].forEach(([x, z, scale]) => {
    addMesh(parent, GEO.pot, MAT.terracotta, x, 0.21 * scale, z).scale.setScalar(scale);
    addMesh(parent, GEO.leaf, MAT.plant, x, 0.7 * scale, z).scale.setScalar(scale);
    addMesh(parent, GEO.leaf, MAT.plantDark, x + 0.18, 0.95 * scale, z - 0.1).scale.setScalar(scale * 0.7);
    addMesh(parent, GEO.leaf, MAT.plant, x - 0.16, 1.05 * scale, z + 0.12).scale.setScalar(scale * 0.6);
  });
}

/** Lampes suspendues au-dessus des tables de salle, banquette et bar. */
function createPendants(parent) {
  const litZones = [ZONES.CENTER, ZONES.BANQUETTE, ZONES.BAR];
  TABLE_CATALOGUE.filter((t) => litZones.includes(t.zone)).forEach((t) => {
    addMesh(parent, GEO.wire, MAT.brass, t.x, 2.95, t.z);
    addMesh(parent, GEO.shade, MAT.wine, t.x, 2.55, t.z);
    addMesh(parent, GEO.bulb, MAT.bulb, t.x, 2.44, t.z);
  });
}

/** Appliques murales chaudes sur le mur du bar et le mur du fond. */
function createSconces(parent) {
  [
    { x: 10.84, z: -2.0, dx: -0.08, dz: 0 },
    { x: 10.84, z: 4.5, dx: -0.08, dz: 0 },
    { x: -1.2, z: -6.84, dx: 0, dz: 0.08 },
  ].forEach(({ x, z, dx, dz }) => {
    addBox(parent, 0.06, 0.26, 0.18, MAT.brass, x, 2.1, z);
    addMesh(parent, GEO.bulb, MAT.bulb, x + dx, 2.12, z + dz);
  });
}

/** Borne d'accueil, portemanteau et tableau du menu près de l'entrée. */
function createAccents(parent) {
  const { x, z } = ROOM_ANCHORS.hostDesk;
  addBox(parent, 1.0, 1.0, 0.55, MAT.wood, x, 0.5, z);
  addBox(parent, 1.12, 0.06, 0.66, MAT.brass, x, 1.03, z);
  addBox(parent, 0.34, 0.03, 0.24, MAT.cream, x, 1.07, z - 0.05);

  addMesh(parent, GEO.stoolSeat, MAT.brass, 6.6, 0.02, z + 0.4);
  addMesh(parent, GEO.stoolLeg, MAT.brass, 6.6, 0.9, z + 0.4);
  addBox(parent, 0.2, 0.03, 0.03, MAT.brass, 6.6, 1.55, z + 0.4);

  addBox(parent, 0.05, 0.9, 0.7, MAT.brass, 10.9, 1.8, 5.4);
  addBox(parent, 0.02, 0.78, 0.58, MAT.charcoal, 10.86, 1.8, 5.4);
  for (let i = 0; i < 4; i += 1) {
    addBox(parent, 0.01, 0.02, 0.4, MAT.cream, 10.84, 1.98 - i * 0.1, 5.4);
  }
}

/** Mur du bar : tableaux abstraits au-dessus du comptoir et ardoise de menu à côté du bar. */
function createWallDecor(parent) {
  const x = 10.88;
  [
    { z: -0.4, w: 0.9, h: 0.38, mat: MAT.wine },
    { z: 1.9, w: 0.62, h: 0.38, mat: MAT.plant },
  ].forEach(({ z, w, h, mat }) => {
    addBox(parent, 0.05, h + 0.08, w + 0.08, MAT.woodDark, x, 2.8, z);
    addBox(parent, 0.02, h, w, mat, x - 0.03, 2.8, z);
  });
  const slateZ = 4.13;
  addBox(parent, 0.06, 0.95, 0.52, MAT.woodDark, x, 1.8, slateZ);
  addBox(parent, 0.02, 0.83, 0.4, MAT.charcoal, x - 0.035, 1.8, slateZ);
  for (let i = 0; i < 3; i += 1) {
    addBox(parent, 0.01, 0.02, 0.3, MAT.cream, x - 0.05, 2.02 - i * 0.14, slateZ);
  }
}

/**
 * Crée le groupe des accessoires fixes de la salle.
 * @returns {THREE.Group} Groupe contenant le bar, les banquettes, les plantes, les lampes et l'accueil.
 */
export function createProps() {
  const props = new THREE.Group();
  createBar(props);
  createBanquettes(props);
  createPlants(props);
  createPendants(props);
  createSconces(props);
  createAccents(props);
  createWallDecor(props);
  props.add(createTableware());
  return props;
}
