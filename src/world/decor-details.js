/**
 * @file    src/world/decor-details.js
 * @brief   Objets de décoration : plantes en bac, ardoises de menu et horloge de salle.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Isole les objets à texture canvas pour garder `decor.js` sous la limite de lignes.
 */

import * as THREE from 'three/webgpu';

import { PALETTE } from './layout.js';

/** Matériaux partagés. */
const MAT = {
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.32, metalness: 0.88 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.5, metalness: 0.5 }),
  leaf: new THREE.MeshStandardMaterial({ color: PALETTE.PLANT, roughness: 0.85 }),
  pot: new THREE.MeshStandardMaterial({ color: 0xb8ac97, roughness: 0.9 }),
  cream: new THREE.MeshStandardMaterial({ color: PALETTE.CREAM, roughness: 0.8 }),
};

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

/**
 * Plante en bac : pot cylindrique et trois masses de feuillage.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse.
 * @param {number} z Ordonnée.
 * @returns {void}
 */
export function addPlant(parent, x, z) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.5, 12), MAT.pot);
  pot.position.set(x, 0.25, z);
  pot.castShadow = true;
  parent.add(pot);

  [
    [0, 0.72, 0, 0.3],
    [-0.16, 0.9, 0.1, 0.22],
    [0.15, 0.98, -0.08, 0.2],
  ].forEach(([dx, y, dz, r]) => {
    const mass = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), MAT.leaf);
    mass.position.set(x + dx, y, z + dz);
    mass.castShadow = true;
    parent.add(mass);
  });
}

/**
 * Ardoise murale dessinée en canvas : titre et lignes de craie.
 * @param {string} title Titre de l'ardoise.
 * @param {string[]} lines Lignes manuscrites.
 * @returns {THREE.Mesh} Panneau prêt à poser.
 */
export function makeBoard(title, lines) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#20241f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#8a6f45';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = '#f1e8da';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 90);

  ctx.font = '30px Georgia, serif';
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, 180 + index * 62);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.2),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 })
  );
}

/**
 * Horloge de salle : cadran crème, lunette laiton, deux aiguilles.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} x Abscisse.
 * @param {number} y Hauteur.
 * @param {number} z Ordonnée.
 * @returns {void}
 */
export function addClock(parent, x, y, z) {
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.28, 28), MAT.cream);
  face.position.set(x, y, z);
  parent.add(face);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.022, 8, 28), MAT.brass);
  ring.position.set(x, y, z);
  parent.add(ring);

  const minutes = new THREE.Mesh(UNIT_BOX, MAT.iron);
  minutes.scale.set(0.014, 0.18, 0.01);
  minutes.position.set(x, y + 0.09, z + 0.01);
  parent.add(minutes);

  const hours = new THREE.Mesh(UNIT_BOX, MAT.iron);
  hours.scale.set(0.014, 0.12, 0.01);
  hours.position.set(x + 0.03, y + 0.02, z + 0.01);
  hours.rotation.z = -0.7;
  parent.add(hours);
}
