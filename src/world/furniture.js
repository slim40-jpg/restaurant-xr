/**
 * @file    src/world/furniture.js
 * @brief   Fabrique des meubles du restaurant : chaises, tables et marqueur d'état.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Construit chaque table à partir d'une entrée du plan et attache les données de sélection.
 */

import * as THREE from 'three';

import { STATUS_COLORS, TABLE_STATUS } from '../config/constants.js';
import { PALETTE } from './layout.js';

/** Matériaux partagés par tout le mobilier (factorisation par matériau). */
const MAT = {
  top: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_LIGHT, roughness: 0.55 }),
  pedestal: new THREE.MeshStandardMaterial({ color: PALETTE.CHARCOAL, roughness: 0.4, metalness: 0.6 }),
  frame: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD, roughness: 0.75 }),
  seat: new THREE.MeshStandardMaterial({ color: PALETTE.WINE, roughness: 0.85 }),
  cloth: new THREE.MeshStandardMaterial({ color: PALETTE.CREAM, roughness: 0.9 }),
};

/** Géométries partagées (assise, dossier, pieds) réutilisées par toutes les chaises. */
const GEO = {
  seat: new THREE.BoxGeometry(0.4, 0.06, 0.4),
  back: new THREE.BoxGeometry(0.4, 0.42, 0.06),
  leg: new THREE.CylinderGeometry(0.022, 0.022, 0.45, 8),
};

/** Rayon du plateau rond selon la capacité. */
function roundRadius(capacity) {
  if (capacity >= 6) return 0.75;
  if (capacity >= 4) return 0.55;
  return 0.4;
}

/**
 * Crée une chaise simplifiée : assise capitonnée, dossier et quatre pieds.
 * @returns {THREE.Group} Chaise positionnée à l'origine, orientée vers +Z.
 */
export function createChair() {
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(GEO.seat, MAT.seat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  chair.add(seat);

  const back = new THREE.Mesh(GEO.back, MAT.frame);
  back.position.set(0, 0.68, -0.17);
  back.castShadow = true;
  chair.add(back);

  [
    [-0.14, -0.14],
    [0.14, -0.14],
    [-0.14, 0.14],
    [0.14, 0.14],
  ].forEach(([px, pz]) => {
    const leg = new THREE.Mesh(GEO.leg, MAT.frame);
    leg.position.set(px, 0.225, pz);
    chair.add(leg);
  });

  return chair;
}

/** Dispose `count` chaises régulièrement autour d'un plateau rond, tournées vers le centre. */
function ringChairs(group, count, ringRadius) {
  const offset = Math.PI / count;
  for (let i = 0; i < count; i += 1) {
    const angle = offset + (i / count) * Math.PI * 2;
    const chair = createChair();
    chair.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
    chair.rotation.y = Math.atan2(-Math.cos(angle), -Math.sin(angle));
    group.add(chair);
  }
}

/** Dispose `count` chaises sur les deux grands côtés d'un plateau rectangulaire. */
function sideChairs(group, count, halfLength, halfBreadth) {
  const perSide = Math.max(1, Math.ceil(count / 2));
  const spacing = perSide > 1 ? (halfLength * 2 - 0.4) / (perSide - 1) : 0;
  let placed = 0;

  for (let i = 0; i < perSide && placed < count; i += 1) {
    const x = perSide > 1 ? -halfLength + 0.2 + i * spacing : 0;
    const front = createChair();
    front.position.set(x, 0, halfBreadth + 0.36);
    front.rotation.y = Math.PI;
    group.add(front);
    placed += 1;

    if (placed < count) {
      const rear = createChair();
      rear.position.set(x, 0, -(halfBreadth + 0.36));
      group.add(rear);
      placed += 1;
    }
  }
}

/**
 * Crée une table complète à partir d'une entrée du plan.
 * @param {{ id: string, x: number, z: number, rotation: number, capacity: number,
 *   shape: string, zone: string, status: string, features: string[] }} entry Entrée du plan.
 * @returns {THREE.Group} Table enrichie de `userData` (isTable, status, id, marker, …).
 */
export function createTable(entry) {
  const { capacity, shape, zone, status } = entry;
  const group = new THREE.Group();
  const isRect = shape === 'rect';
  const halfLength = isRect ? (capacity >= 6 ? 1.0 : 0.8) : roundRadius(capacity);
  const halfBreadth = isRect ? 0.45 : halfLength;

  const top = isRect
    ? new THREE.Mesh(new THREE.BoxGeometry(halfLength * 2, 0.06, halfBreadth * 2), MAT.top)
    : new THREE.Mesh(new THREE.CylinderGeometry(halfLength, halfLength, 0.06, 32), MAT.top);
  top.position.y = 0.75;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  if (isRect) {
    const leg = new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8);
    [
      [-0.75, -0.3],
      [0.75, -0.3],
      [-0.75, 0.3],
      [0.75, 0.3],
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(leg, MAT.pedestal);
      post.position.set(px, 0.36, pz);
      post.castShadow = true;
      group.add(post);
    });
  } else {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.72, 16), MAT.pedestal);
    pedestal.position.y = 0.36;
    pedestal.castShadow = true;
    group.add(pedestal);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 20), MAT.pedestal);
    base.position.y = 0.02;
    group.add(base);
  }

  if (zone === 'banquette' || zone === 'corner') {
    const cloth = isRect
      ? new THREE.Mesh(new THREE.BoxGeometry(halfLength * 2 + 0.12, 0.02, halfBreadth * 2 + 0.12), MAT.cloth)
      : new THREE.Mesh(new THREE.CylinderGeometry(halfLength + 0.06, halfLength + 0.06, 0.02, 32), MAT.cloth);
    cloth.position.y = 0.79;
    group.add(cloth);
  }

  const color = STATUS_COLORS[status] ?? STATUS_COLORS[TABLE_STATUS.UNAVAILABLE];
  const markerMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 });
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), markerMat);
  marker.position.y = 0.98;
  group.add(marker);

  if (isRect) {
    sideChairs(group, capacity, halfLength, halfBreadth);
  } else {
    ringChairs(group, capacity, halfLength + 0.38);
  }

  group.position.set(entry.x, 0, entry.z);
  group.rotation.y = entry.rotation;
  group.userData = { ...entry, isTable: true, marker };
  return group;
}
