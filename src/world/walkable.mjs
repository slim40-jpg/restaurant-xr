/**
 * @file    src/world/walkable.mjs
 * @brief   Surfaces praticables et volumes bloquants de la nef, de la terrasse et du passage.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Fournit hauteur de sol et collisions sans Three.js, pour une locomotion testable à part.
 */

import { ROOM_ANCHORS, ROOM_LAYOUT } from './layout.mjs';

const { WIDTH, DEPTH, HEIGHT } = ROOM_LAYOUT;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const DOOR = ROOM_ANCHORS.entrance;
const GARDEN = ROOM_ANCHORS.terrace;

/** Boîte de collision alignée sur les axes (arêtes incluses). */
const box = (minX, maxX, minZ, maxZ, minY, maxY, kind) => ({ minX, maxX, minZ, maxZ, minY, maxY, kind });

/** Surface praticable alignée sur les axes, à altitude constante. */
const surface = (minX, maxX, minZ, maxZ, y, kind) => ({ minX, maxX, minZ, maxZ, y, kind });

/**
 * Surfaces praticables : nef, seuil de porte et terrasse.
 * La nef est un volume unique de 8 m : il n'y a plus d'étage ni d'escalier.
 */
export const WALK_SURFACES = [
  surface(-HALF_W, HALF_W, -HALF_D, HALF_D, 0, 'floor'),
  surface(DOOR.x - 1, DOOR.x + 1, HALF_D - 0.1, GARDEN.minZ + 0.1, 0, 'threshold'),
  surface(GARDEN.minX, GARDEN.maxX, GARDEN.minZ, GARDEN.maxZ, 0, 'deck'),
];

/**
 * Volumes bloquants. Les tables n'y figurent jamais : on doit pouvoir passer près d'elles.
 * Les murs, le bar, le bloc d'accueil et les haies de la terrasse sont infranchissables.
 */
export const WALK_COLLIDERS = [
  // Murs périmétriques, avec l'ouverture de la porte d'entrée côté z = +7.
  box(-HALF_W - 0.1, HALF_W + 0.1, -HALF_D - 0.1, -HALF_D + 0.1, 0, HEIGHT, 'wall'),
  box(-HALF_W - 0.1, -HALF_W + 0.1, -HALF_D, HALF_D, 0, HEIGHT, 'wall'),
  box(HALF_W - 0.1, HALF_W + 0.1, -HALF_D, HALF_D, 0, HEIGHT, 'wall'),
  box(-HALF_W, DOOR.x - DOOR.width / 2, HALF_D - 0.1, HALF_D + 0.1, 0, HEIGHT, 'wall'),
  box(DOOR.x + DOOR.width / 2, HALF_W, HALF_D - 0.1, HALF_D + 0.1, 0, HEIGHT, 'wall'),

  // Angles arrondis : quatre volumes approchent la courbure du bâti.
  ...[
    [-HALF_W, -HALF_D],
    [HALF_W - 1.5, -HALF_D],
    [HALF_W - 1.5, HALF_D - 1.5],
    [-HALF_W, HALF_D - 1.5],
  ].map(([x, z]) => box(x, x + 1.5, z, z + 1.5, 0, HEIGHT, 'rounded-corner')),

  // Colonnes de fonte alignées sur les murs.
  ...[-4.4, 0, 4.4].flatMap((z) =>
    [-HALF_W + 0.45, HALF_W - 0.45].map((x) => box(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0, HEIGHT, 'column'))
  ),

  // Comptoir du bar, bloc d'accueil et banquette du fond.
  box(9.85, HALF_W, -1, 4, 0, 1.2, 'furniture'),
  box(-9.6, 3.6, -HALF_D, -6.3, 0, 1.1, 'furniture'),
  box(4.5, 5.5, 5.12, 5.68, 0, 1.1, 'furniture'),

  // Haies et poteaux de la terrasse.
  box(GARDEN.minX - 0.55, GARDEN.minX - 0.05, 7.6, GARDEN.maxZ + 0.4, 0, 1.4, 'hedge'),
  box(GARDEN.maxX + 0.05, GARDEN.maxX + 0.55, 7.6, GARDEN.maxZ + 0.4, 0, 1.4, 'hedge'),
  box(GARDEN.minX - 0.55, GARDEN.maxX + 0.55, GARDEN.maxZ + 0.2, GARDEN.maxZ + 0.8, 0, 1.4, 'hedge'),
  ...[
    [-8.6, 9.2],
    [8.6, 9.2],
    [-8.6, 15.5],
    [8.6, 15.5],
  ].map(([x, z]) => box(x - 0.12, x + 0.12, z - 0.12, z + 0.12, 0, 2.8, 'post')),
];

/**
 * Hauteur de la surface praticable en (x, z).
 *
 * Le lieu n'a plus qu'un niveau intérieur : la fonction renvoie 0 dans la nef et sur la
 * terrasse, `null` hors zone. Le paramètre `level` est conservé pour ne pas casser
 * l'interface du mode marche, mais il n'a plus d'effet.
 *
 * @param {number} x Abscisse en mètres.
 * @param {number} z Ordonnée en mètres.
 * @param {string|null} [level] Niveau demandé, ignoré (compatibilité).
 * @returns {number|null} Altitude en mètres, ou `null` hors de toute zone praticable.
 */
export function surfaceHeightAt(x, z, level = null) {
  let height = null;
  for (const area of WALK_SURFACES) {
    if (x < area.minX || x > area.maxX || z < area.minZ || z > area.maxZ) continue;
    if (height === null || area.y > height) height = area.y;
  }
  // Le niveau n'a plus d'incidence ; la variable reste lue pour documenter l'interface.
  void level;
  return height;
}
