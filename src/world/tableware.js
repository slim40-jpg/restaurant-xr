/**
 * @file    src/world/tableware.js
 * @brief   Couverts et signes de service disposés sur chaque table du plan de salle.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Donne l'impression d'un service dressé sans déplacer tables, chaises ni lampes.
 */

import * as THREE from 'three';

import { PALETTE, TABLE_CATALOGUE } from './layout.js';

/** Altitude du dessus de table (nappe comprise). */
const SURFACE_Y = 0.8;

/** Matériaux partagés par toute la vaisselle. */
const MAT = {
  ceramic: new THREE.MeshStandardMaterial({ color: PALETTE.CREAM, roughness: 0.45 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xd7e6ea,
    roughness: 0.1,
    transparent: true,
    opacity: 0.45,
  }),
  napkin: new THREE.MeshStandardMaterial({ color: 0xf7f2e7, roughness: 0.9 }),
  menu: new THREE.MeshStandardMaterial({ color: 0xece0cb, roughness: 0.85 }),
  ink: new THREE.MeshBasicMaterial({ color: 0x2a2622 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.35, metalness: 0.8 }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffa24d }),
};

/** Géométries partagées par les 54 couverts. */
const GEO = {
  plate: new THREE.CylinderGeometry(0.14, 0.14, 0.012, 20),
  glass: new THREE.CylinderGeometry(0.035, 0.035, 0.11, 12),
  napkin: new THREE.BoxGeometry(0.18, 0.01, 0.12),
  panel: new THREE.BoxGeometry(0.2, 0.16, 0.006),
  ink: new THREE.BoxGeometry(0.15, 0.008, 0.002),
  candleBase: new THREE.CylinderGeometry(0.03, 0.035, 0.05, 10),
  candle: new THREE.CylinderGeometry(0.012, 0.012, 0.07, 8),
  flame: new THREE.ConeGeometry(0.018, 0.05, 8),
};

/** Ajoute un maillage partagé positionné à un groupe parent. */
function addMesh(parent, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Calcule la position locale de chaque couvert en réutilisant la disposition des chaises.
 * @param {{ capacity: number, shape: string }} entry Entrée du plan de salle.
 * @returns {Array<{ px: number, pz: number, tx: number, tz: number, ix: number, iz: number, limitX?: number }>}
 *   Positions d'assiette, tangente et direction vers le centre.
 */
function seatLayout(entry) {
  const { capacity, shape } = entry;
  const seats = [];

  if (shape === 'rect') {
    const halfLength = capacity >= 6 ? 1.0 : 0.8;
    const halfBreadth = 0.45;
    const perSide = Math.max(1, Math.ceil(capacity / 2));
    const spacing = perSide > 1 ? (halfLength * 2 - 0.4) / (perSide - 1) : 0;
    let placed = 0;
    for (let i = 0; i < perSide && placed < capacity; i += 1) {
      const lx = perSide > 1 ? -halfLength + 0.2 + i * spacing : 0;
      for (const side of [1, -1]) {
        if (placed >= capacity) break;
        seats.push({
          px: lx,
          pz: side * (halfBreadth - 0.18),
          tx: 1,
          tz: 0,
          ix: 0,
          iz: -side,
          limitX: halfLength - 0.12,
        });
        placed += 1;
      }
    }
    return seats;
  }

  const radius = capacity >= 6 ? 0.75 : capacity >= 4 ? 0.55 : 0.4;
  const offset = Math.PI / capacity;
  for (let i = 0; i < capacity; i += 1) {
    const angle = offset + (i / capacity) * Math.PI * 2;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    seats.push({ px: ca * (radius - 0.18), pz: sa * (radius - 0.18), tx: -sa, tz: ca, ix: -ca, iz: -sa });
  }
  return seats;
}

/** Pose assiette, serviette pliée et verre devant une chaise. */
function addCover(group, seat) {
  addMesh(group, GEO.plate, MAT.ceramic, seat.px, SURFACE_Y + 0.006, seat.pz);

  const napkinX = seat.px + seat.tx * 0.18;
  const clampedX = seat.limitX ? Math.max(-seat.limitX, Math.min(seat.limitX, napkinX)) : napkinX;
  addMesh(group, GEO.napkin, MAT.napkin, clampedX, SURFACE_Y + 0.005, seat.pz + seat.tz * 0.18);

  const glassX = seat.px - seat.tx * 0.15 + seat.ix * 0.05;
  const glassZ = seat.pz - seat.tz * 0.15 + seat.iz * 0.05;
  addMesh(group, GEO.glass, MAT.glass, glassX, SURFACE_Y + 0.055, glassZ);
}

/** Chevalet de menu : deux panneaux inclinés en V avec une ligne d'encre suggérée. */
function addMenu(group) {
  const easel = new THREE.Group();
  easel.position.set(0, SURFACE_Y, 0);
  [-1, 1].forEach((side) => {
    const panel = addMesh(easel, GEO.panel, MAT.menu, 0, 0.08, side * 0.025);
    panel.rotation.x = side * 0.3;
    addMesh(panel, GEO.ink, MAT.ink, 0, 0.015, 0.004);
  });
  group.add(easel);
}

/** Bougeoir de table : pied laiton, bougie crème et flamme émissive. */
function addCandle(group) {
  addMesh(group, GEO.candleBase, MAT.brass, -0.16, SURFACE_Y + 0.025, 0.02);
  addMesh(group, GEO.candle, MAT.napkin, -0.16, SURFACE_Y + 0.085, 0.02);
  addMesh(group, GEO.flame, MAT.flame, -0.16, SURFACE_Y + 0.145, 0.02);
}

/**
 * Crée le groupe des couverts de toutes les tables du plan.
 * @returns {THREE.Group} Assiettes, verres, serviettes, menus et bougeoirs de la salle.
 */
export function createTableware() {
  const tableware = new THREE.Group();
  TABLE_CATALOGUE.forEach((entry, index) => {
    const group = new THREE.Group();
    group.position.set(entry.x, 0, entry.z);
    group.rotation.y = entry.rotation;
    seatLayout(entry).forEach((seat) => {
      addCover(group, seat);
    });
    if (index % 3 === 0) addMenu(group);
    if (entry.zone === 'banquette' || entry.zone === 'corner') addCandle(group);
    tableware.add(group);
  });
  return tableware;
}
