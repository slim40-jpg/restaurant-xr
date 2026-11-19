/**
 * @file    src/world/arcature.mjs
 * @brief   Angles arrondis, arcades et cintres : sortir la salle du parallélépipède.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Ajoute les courbes du bâti sans modifier les murs porteurs ni les collisions existantes.
 */

import * as THREE from 'three/webgpu';

import { PALETTE } from './layout.mjs';

/** Matériaux partagés. */
const MAT = {
  plaster: new THREE.MeshStandardMaterial({ color: 0xe3dac8, roughness: 0.94 }),
  plasterDeep: new THREE.MeshStandardMaterial({ color: 0xd3c8b2, roughness: 0.95 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.34, metalness: 0.85 }),
  stone: new THREE.MeshStandardMaterial({ color: PALETTE.STONE, roughness: 0.9 }),
};

/** Nombre de segments d'un quart de cercle : assez pour lire la courbe, assez peu pour le budget. */
const SEGMENTS = 7;

/**
 * Ajoute une boîte orientée.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {THREE.Material} material Matériau.
 * @param {number} w Largeur.
 * @param {number} h Hauteur.
 * @param {number} d Profondeur.
 * @param {number} x Position X.
 * @param {number} y Position Y.
 * @param {number} z Position Z.
 * @param {number} [ry=0] Rotation autour de Y.
 * @returns {THREE.Mesh} Maillage ajouté.
 */
function part(parent, material, w, h, d, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Arrondit un angle par une paroi courbe approchée en segments.
 *
 * Un restaurant n'a presque jamais quatre angles droits : les murs épousent les
 * structures anciennes. Approcher le quart de cercle par sept pans donne la courbe
 * au regard sans géométrie lourde ni découpe des murs porteurs.
 *
 * @param {THREE.Group} parent Groupe porteur.
 * @param {number} cx Abscisse de l'angle.
 * @param {number} cz Ordonnée de l'angle.
 * @param {number} radius Rayon de courbure.
 * @param {number} height Hauteur du pan de mur.
 * @param {number} startAngle Angle de départ, en radians, dans le plan XZ.
 * @returns {void}
 */
export function addRoundedCorner(parent, cx, cz, radius, height, startAngle) {
  const step = Math.PI / 2 / SEGMENTS;
  const arcLength = radius * step * 1.06;

  for (let i = 0; i < SEGMENTS; i += 1) {
    const angle = startAngle + step * (i + 0.5);
    const x = cx + Math.cos(angle) * radius;
    const z = cz + Math.sin(angle) * radius;
    part(parent, MAT.plaster, arcLength, height, 0.16, x, height / 2, z, -angle + Math.PI / 2);
  }

  // Plinthe en pierre qui suit la courbe.
  for (let i = 0; i < SEGMENTS; i += 1) {
    const angle = startAngle + step * (i + 0.5);
    part(
      parent,
      MAT.stone,
      arcLength,
      0.16,
      0.2,
      cx + Math.cos(angle) * radius,
      0.08,
      cz + Math.sin(angle) * radius,
      -angle + Math.PI / 2
    );
  }
}

/**
 * Trace un cintre en plein ceintre, approché par une suite de voussoirs.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {object} options Paramètres du cintre.
 * @param {number} options.x Abscisse du centre.
 * @param {number} options.y Hauteur de naissance (bases).
 * @param {number} options.z Ordonnée du plan du cintre.
 * @param {number} options.span Largeur entre les bases.
 * @param {number} options.depth Épaisseur du cintre.
 * @param {number} [options.ry=0] Orientation du cintre autour de Y.
 * @param {THREE.Material} [options.material] Matériau des voussoirs.
 * @returns {void}
 */
export function addArch(parent, { x, y, z, span, depth = 0.24, ry = 0, material = MAT.plasterDeep }) {
  const radius = span / 2;
  const count = 11;
  const step = Math.PI / count;
  const voussoir = radius * step * 1.15;

  for (let i = 0; i < count; i += 1) {
    const angle = Math.PI - step * (i + 0.5);
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    const zz = ry === 0 ? z : z;
    part(parent, material, voussoir, 0.22, depth, ry === 0 ? px : zz, py, ry === 0 ? zz : px, 0).rotation.z =
      angle - Math.PI / 2;
  }
}

/**
 * Encadre une baie par deux piédroits et un cintre.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {object} options Paramètres de la baie.
 * @param {number} options.x Abscisse du centre.
 * @param {number} options.z Ordonnée du mur.
 * @param {number} options.width Largeur de la baie.
 * @param {number} options.height Hauteur des piédroits.
 * @param {number} [options.ry=0] Orientation (0 : mur en Z, π/2 : mur en X).
 * @returns {void}
 */
export function addArchedOpening(parent, { x, z, width, height, ry = 0 }) {
  const jamb = 0.3;
  const half = width / 2;

  [-1, 1].forEach((side) => {
    const offset = side * (half + jamb / 2);
    part(
      parent,
      MAT.plaster,
      jamb,
      height,
      0.26,
      ry === 0 ? x + offset : x,
      height / 2,
      ry === 0 ? z : z + offset,
      ry
    );
  });

  addArch(parent, { x, y: height, z, span: width + jamb * 2, depth: 0.26, ry });
  part(parent, MAT.brass, width + jamb * 2, 0.05, 0.3, x, height - 0.02, z, ry);
}

/**
 * Pose les quatre angles arrondis de la nef.
 * @param {THREE.Group} parent Groupe porteur.
 * @param {object} bounds Emprise de la salle.
 * @param {number} bounds.halfWidth Demi-largeur.
 * @param {number} bounds.halfDepth Demi-profondeur.
 * @param {number} bounds.height Hauteur.
 * @param {number} [bounds.radius=2.2] Rayon de courbure.
 * @returns {void}
 */
export function addRoundedRoom(parent, { halfWidth, halfDepth, height, radius = 2.2 }) {
  addRoundedCorner(parent, -halfWidth, -halfDepth, radius, height, 0);
  addRoundedCorner(parent, halfWidth, -halfDepth, radius, height, Math.PI / 2);
  addRoundedCorner(parent, halfWidth, halfDepth, radius, height, Math.PI);
  addRoundedCorner(parent, -halfWidth, halfDepth, radius, height, (3 * Math.PI) / 2);
}
