/**
 * @file    src/world/furniture.js
 * @brief   Fabrique des meubles du restaurant : chaises et tables avec marqueur d'état.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-10
 * @role    Expose les usines de mobilier et attache les données de sélection aux tables.
 */

import * as THREE from 'three';

import { STATUS_COLORS, TABLE_STATUS } from '../config/constants.js';

/**
 * Crée une chaise simplifiée (assise, dossier, quatre pieds).
 * @returns {THREE.Group} Groupe représentant la chaise, positionné à l'origine.
 */
export function createChair() {
  const chair = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 });

  // Assise
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.35), mat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  chair.add(seat);

  // Dossier
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.05), mat);
  back.position.set(0, 0.65, -0.15);
  back.castShadow = true;
  chair.add(back);

  // Pieds (simplifiés)
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
  const legPositions = [
    [-0.12, -0.12],
    [0.12, -0.12],
    [-0.12, 0.12],
    [0.12, 0.12],
  ];
  legPositions.forEach(([px, pz]) => {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(px, 0.225, pz);
    leg.castShadow = true;
    chair.add(leg);
  });

  return chair;
}

/**
 * Crée une table complète : plateau, pied, marqueur d'état coloré et quatre chaises.
 * @param {number} x Position horizontale de la table.
 * @param {number} z Position en profondeur de la table.
 * @param {string} [status=TABLE_STATUS.AVAILABLE] État initial de la table.
 * @returns {THREE.Group} Groupe de la table, enrichi de `userData` (isTable, status, id, marker).
 */
export function createTable(x, z, status = TABLE_STATUS.AVAILABLE) {
  const group = new THREE.Group();

  // Couleur selon l'état
  const color = STATUS_COLORS[status] ?? STATUS_COLORS[TABLE_STATUS.UNAVAILABLE];

  // Plateau de table (bois)
  const topMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.6 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 32), topMat);
  top.position.y = 0.75;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Pied de table
  const legMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.6 });
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 16), legMat);
  leg.position.y = 0.36;
  leg.castShadow = true;
  group.add(leg);

  // Marqueur d'état (petit cylindre coloré sur le dessus, indique la disponibilité)
  const markerMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), markerMat);
  marker.position.y = 0.82;
  group.add(marker);

  // Stocker les données pour la détection de sélection
  group.userData = { isTable: true, status, id: `Table_${x}_${z}`, marker };

  // Ajouter 4 chaises autour de la table
  const chairPositions = [
    { x: 0.7, z: 0, rot: Math.PI },
    { x: -0.7, z: 0, rot: 0 },
    { x: 0, z: 0.7, rot: -Math.PI / 2 },
    { x: 0, z: -0.7, rot: Math.PI / 2 },
  ];

  chairPositions.forEach((cp) => {
    const chair = createChair();
    chair.position.set(cp.x, 0, cp.z);
    chair.rotation.y = cp.rot;
    group.add(chair);
  });

  group.position.set(x, 0, z);
  return group;
}
