/**
 * @file    src/world/mezzanine-trim.js
 * @brief   Finitions de la mezzanine : fascia moulurée, dents, plafond à poutres et main courante.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Fait lire la dalle comme un étage bâti, et non comme un plateau posé dans un volume.
 */

import * as THREE from 'three/webgpu';

import { PALETTE } from './layout.js';

/** Matériaux partagés : aucune création par objet. */
const MAT = {
  plaster: new THREE.MeshStandardMaterial({ color: 0xece4d6, roughness: 0.92 }),
  wood: new THREE.MeshStandardMaterial({ color: PALETTE.WOOD_DARK, roughness: 0.55 }),
  brass: new THREE.MeshStandardMaterial({ color: PALETTE.BRASS, roughness: 0.32, metalness: 0.85 }),
  stone: new THREE.MeshStandardMaterial({ color: PALETTE.STONE, roughness: 0.85 }),
};

/** Géométries partagées. */
const GEO = {
  dent: new THREE.BoxGeometry(0.06, 0.07, 0.09),
  beam: new THREE.BoxGeometry(1, 1, 1),
};

/**
 * Ajoute une boîte positionnée au centre.
 * @param {THREE.Group} parent Groupe recevant la boîte.
 * @param {THREE.Material} material Matériau appliqué.
 * @param {number} w Largeur (X).
 * @param {number} h Hauteur (Y).
 * @param {number} d Profondeur (Z).
 * @param {number} x Position X.
 * @param {number} y Position Y.
 * @param {number} z Position Z.
 * @returns {THREE.Mesh} Le maillage ajouté.
 */
function box(parent, material, w, h, d, x, y, z) {
  const mesh = new THREE.Mesh(GEO.beam, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Habille le nez de dalle : fascia, moulure et frise de dents.
 *
 * C'est cette épaisseur qui distingue un étage d'une simple plateforme : sans fascia,
 * la dalle n'a qu'une arête et le vide paraît « posé » dans le volume.
 *
 * @param {THREE.Group} group Groupe d'architecture.
 * @param {object} opts Bornes de la dalle.
 * @param {number} opts.y Altitude du dessus de dalle.
 * @param {number} opts.minX Extrémité gauche.
 * @param {number} opts.maxX Extrémité droite.
 * @param {number} opts.openZ Z du nez de dalle (côté salle).
 * @param {number} [opts.thickness=0.26] Hauteur de la fascia.
 * @returns {void}
 */
export function addFascia(group, { y, minX, maxX, openZ, thickness = 0.26 }) {
  const length = maxX - minX;
  const centre = (minX + maxX) / 2;
  const faceZ = openZ + 0.02;

  // Fascia principale sous le nez de dalle.
  box(group, MAT.plaster, length, thickness, 0.1, centre, y - thickness / 2, faceZ);
  // Moulure basse en laiton : fine ligne claire qui souligne l'étage.
  box(group, MAT.brass, length, 0.025, 0.12, centre, y - thickness - 0.012, faceZ + 0.01);
  // Filet supérieur en bois, sous le parquet.
  box(group, MAT.wood, length, 0.035, 0.12, centre, y - 0.018, faceZ + 0.01);

  // Frise de dents tous les 0,32 m, en retrait de 2 cm.
  const step = 0.32;
  for (let x = minX + step / 2; x < maxX - step / 2; x += step) {
    const dent = new THREE.Mesh(GEO.dent, MAT.plaster);
    dent.position.set(x, y - thickness - 0.04, faceZ - 0.02);
    dent.castShadow = true;
    group.add(dent);
  }
}

/**
 * Plafond du rez-de-chaussée sous la mezzanine, avec poutres apparentes.
 *
 * Sans ce plafond, le dessous de la mezzanine est un vide sombre : le rez-de-chaussée
 * n'a alors aucune échelle et la dalle perd sa crédibilité.
 *
 * @param {THREE.Group} group Groupe d'architecture.
 * @param {object} opts Bornes de la zone couverte.
 * @param {number} opts.y Altitude du plafond (sous la dalle).
 * @param {number} opts.minX Extrémité gauche.
 * @param {number} opts.maxX Extrémité droite.
 * @param {number} opts.minZ Fond de la salle.
 * @param {number} opts.openZ Nez de dalle.
 * @param {number} [opts.beams=3] Nombre de poutres.
 * @returns {void}
 */
export function addUnderCeiling(group, { y, minX, maxX, minZ, openZ, beams = 3 }) {
  const width = maxX - minX;
  const depth = openZ - minZ;
  const centreX = (minX + maxX) / 2;
  const centreZ = (minZ + openZ) / 2;

  // Plaque de plâtre : ferme le volume au-dessus du client.
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), MAT.plaster);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(centreX, y, centreZ);
  ceiling.receiveShadow = true;
  group.add(ceiling);

  // Poutres en bois dans le sens de la largeur, tous les (depth / beams).
  for (let i = 0; i < beams; i += 1) {
    const z = minZ + (depth * (i + 0.5)) / beams;
    box(group, MAT.wood, width, 0.18, 0.16, centreX, y - 0.09, z);
  }

  // Retombée de corniche sur le nez de dalle, côté salle.
  box(group, MAT.stone, width, 0.1, 0.08, centreX, y + 0.05, openZ - 0.03);
}

/**
 * Pose une main courante en laiton sur une lisse existante.
 * @param {THREE.Group} group Groupe d'architecture.
 * @param {object} opts Segment à couvrir.
 * @param {number} opts.y Altitude du dessus de la lisse.
 * @param {number} opts.minX Extrémité gauche.
 * @param {number} opts.maxX Extrémité droite.
 * @param {number} opts.z Profondeur du garde-corps.
 * @returns {void}
 */
export function addHandrailCap(group, { y, minX, maxX, z }) {
  box(group, MAT.brass, maxX - minX, 0.045, 0.075, (minX + maxX) / 2, y + 0.022, z);
}
