/**
 * @file    src/world/furniture.js
 * @brief   Mobilier contemporain : tables terrazzo à chant laiton, chaises coque et piètement acier.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Construit chaque table à partir d'une entrée du plan et attache les données de sélection.
 */

import * as THREE from 'three';

import { STATUS_COLORS, TABLE_STATUS } from '../config/constants.js';
import { PALETTE } from './layout.js';
import { ringChairs, sideChairs } from './seat-layout.js';

/** Matériaux partagés : une instance par matière, jamais par objet. */
const MAT = {
  top: new THREE.MeshStandardMaterial({ color: 0xe7e3d8, roughness: 0.32, metalness: 0.04 }),
  rim: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.3, metalness: 0.9 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.38, metalness: 0.72 }),
  seat: new THREE.MeshStandardMaterial({ color: 0x6b2c2a, roughness: 0.78 }),
  shell: new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.42, metalness: 0.55 }),
};

/** Géométries partagées par tout le mobilier. */
const GEO = {
  seat: new THREE.BoxGeometry(0.42, 0.055, 0.42),
  back: new THREE.BoxGeometry(0.42, 0.3, 0.035),
  leg: new THREE.CylinderGeometry(0.016, 0.016, 0.44, 8),
  pedestal: new THREE.CylinderGeometry(0.045, 0.075, 0.7, 18),
  base: new THREE.CylinderGeometry(0.27, 0.27, 0.022, 24),
  rim: new THREE.TorusGeometry(1, 0.012, 6, 36),
};

/**
 * Rayon du plateau rond selon la capacité (contrat inchangé : la vaisselle s'y aligne).
 * @param {number} capacity Nombre de couverts.
 * @returns {number} Rayon en mètres.
 */
function roundRadius(capacity) {
  if (capacity >= 6) return 0.75;
  if (capacity >= 4) return 0.55;
  return 0.4;
}

/**
 * Crée une chaise contemporaine : coque fine, assise capitonnée, quatre pieds acier.
 * @returns {THREE.Group} Chaise positionnée à l'origine, orientée vers +Z.
 */
export function createChair() {
  const chair = new THREE.Group();

  const seat = new THREE.Mesh(GEO.seat, MAT.shell);
  seat.position.y = 0.45;
  seat.castShadow = true;
  chair.add(seat);

  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 0.38), MAT.seat);
  cushion.position.y = 0.482;
  chair.add(cushion);

  // Dossier légèrement incliné : c'est ce qui distingue une coque d'une caisse.
  const back = new THREE.Mesh(GEO.back, MAT.shell);
  back.position.set(0, 0.7, -0.19);
  back.rotation.x = -0.12;
  back.castShadow = true;
  chair.add(back);

  // Montants du dossier, fins, pour lier la coque au piètement.
  [-0.19, 0.19].forEach((px) => {
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), MAT.steel);
    riser.position.set(px, 0.58, -0.18);
    riser.rotation.x = -0.12;
    chair.add(riser);
  });

  [
    [-0.16, -0.16],
    [0.16, -0.16],
    [-0.16, 0.16],
    [0.16, 0.16],
  ].forEach(([px, pz]) => {
    const leg = new THREE.Mesh(GEO.leg, MAT.steel);
    leg.position.set(px, 0.22, pz);
    chair.add(leg);
  });

  return chair;
}

/**
 * Crée une table moderne à partir d'une entrée du plan.
 *
 * Plateau terrazzo de 4 cm à chant laiton, piètement central acier effilé, base discrète.
 * Le marqueur d'état et le contrat `userData` sont conservés à l'identique.
 *
 * @param {{ id: string, x: number, z: number, rotation: number, capacity: number,
 *   shape: string, zone: string, status: string, features: string[] }} entry Entrée du plan.
 * @returns {THREE.Group} Table enrichie de `userData` (isTable, status, id, marker, …).
 */
export function createTable(entry) {
  const { capacity, shape, status } = entry;
  const group = new THREE.Group();
  const isRect = shape === 'rect';
  const halfLength = isRect ? (capacity >= 6 ? 1.0 : 0.8) : roundRadius(capacity);
  const halfBreadth = isRect ? 0.45 : halfLength;

  const top = isRect
    ? new THREE.Mesh(new THREE.BoxGeometry(halfLength * 2, 0.04, halfBreadth * 2), MAT.top)
    : new THREE.Mesh(new THREE.CylinderGeometry(halfLength, halfLength, 0.04, 40), MAT.top);
  top.position.y = 0.75;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  if (isRect) {
    // Chant laiton sur les deux longs côtés.
    [-1, 1].forEach((side) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(halfLength * 2, 0.012, 0.014), MAT.rim);
      strip.position.set(0, 0.75, side * (halfBreadth - 0.005));
      group.add(strip);
    });
    [-0.75, 0.75].forEach((px) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.73, 0.05), MAT.steel);
      leg.position.set(px, 0.365, 0);
      leg.castShadow = true;
      group.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, halfBreadth * 2 - 0.08), MAT.steel);
      foot.position.set(px, 0.01, 0);
      group.add(foot);
    });
  } else {
    // Chant laiton : anneau fin au bord du plateau.
    const rim = new THREE.Mesh(GEO.rim, MAT.rim);
    rim.scale.setScalar(halfLength);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.75;
    group.add(rim);

    const pedestal = new THREE.Mesh(GEO.pedestal, MAT.steel);
    pedestal.position.y = 0.36;
    pedestal.castShadow = true;
    group.add(pedestal);

    const base = new THREE.Mesh(GEO.base, MAT.steel);
    base.position.y = 0.011;
    base.castShadow = true;
    group.add(base);
  }

  const color = STATUS_COLORS[status] ?? STATUS_COLORS[TABLE_STATUS.UNAVAILABLE];
  const markerMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 });
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), markerMat);
  marker.position.y = 0.98;
  group.add(marker);

  if (isRect) sideChairs(group, capacity, halfLength, halfBreadth, createChair);
  else ringChairs(group, capacity, halfLength + 0.38, createChair);

  group.position.set(entry.x, 0, entry.z);
  group.rotation.y = entry.rotation;
  group.userData = { ...entry, isTable: true, marker };
  return group;
}
