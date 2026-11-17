/**
 * @file    src/world/walkable.js
 * @brief   Contrat du futur mode marche : surfaces praticables et volumes bloquants du lieu.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-12
 * @role    Fournit hauteur de sol et collisions sans Three.js, pour une locomotion testable à part.
 */

import { LEVELS, ROOM_ANCHORS, ROOM_LAYOUT, STAIR } from './layout.js';

const { WIDTH, DEPTH, HEIGHT, MEZZANINE_Y } = ROOM_LAYOUT;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const DOOR = ROOM_ANCHORS.entrance;
const GARDEN = ROOM_ANCHORS.terrace;
const STEPS = ROOM_ANCHORS.stairs;
const STAIR_RUN = STAIR.bottomZ - STAIR.topZ;

/** Boîte de collision alignée sur les axes (arêtes incluses). */
const box = (minX, maxX, minZ, maxZ, minY, maxY, kind) => ({ minX, maxX, minZ, maxZ, minY, maxY, kind });

/** Surface praticable alignée sur les axes, à altitude constante. */
const surface = (minX, maxX, minZ, maxZ, y, level, kind) => ({ minX, maxX, minZ, maxZ, y, level, kind });

/** Quatre paliers d'escalier : `surfaceHeightAt` interpole entre eux pour lisser la montée. */
const stairPaliers = [0, 1, 2, 3].map((i) => ({
  minX: STEPS.minX,
  maxX: STEPS.maxX,
  minZ: STAIR.bottomZ - ((i + 1) * STAIR_RUN) / 4,
  maxZ: STAIR.bottomZ - (i * STAIR_RUN) / 4,
  y: ((i + 1) * MEZZANINE_Y) / 4,
  level: LEVELS.GROUND,
  kind: 'stair',
}));

/** Surfaces praticables : sol, mezzanine, terrasse, seuil de porte et marches d'escalier. */
export const WALK_SURFACES = [
  surface(-HALF_W, HALF_W, -HALF_D, HALF_D, 0, LEVELS.GROUND, 'floor'),
  surface(-HALF_W, HALF_W, -HALF_D, -1, MEZZANINE_Y, LEVELS.MEZZANINE, 'slab'),
  surface(GARDEN.minX, GARDEN.maxX, GARDEN.minZ, GARDEN.maxZ, 0, LEVELS.TERRACE, 'deck'),
  surface(DOOR.x - 1, DOOR.x + 1, HALF_D - 0.1, GARDEN.minZ + 0.1, 0, LEVELS.TERRACE, 'threshold'),
  ...stairPaliers,
];

/**
 * Volumes bloquants. Les tables n'y figurent jamais : on doit pouvoir passer près d'elles.
 * Les murs, garde-corps, haies et poteaux, en revanche, sont infranchissables.
 */
export const WALK_COLLIDERS = [
  box(-HALF_W - 0.1, HALF_W + 0.1, -HALF_D - 0.1, -HALF_D + 0.1, 0, HEIGHT, 'wall'),
  box(-HALF_W - 0.1, -HALF_W + 0.1, -HALF_D, HALF_D, 0, HEIGHT, 'wall'),
  box(HALF_W - 0.1, HALF_W + 0.1, -HALF_D, HALF_D, 0, HEIGHT, 'wall'),
  box(-HALF_W, DOOR.x - DOOR.width / 2, HALF_D - 0.1, HALF_D + 0.1, 0, HEIGHT, 'wall'),
  box(DOOR.x + DOOR.width / 2, HALF_W, HALF_D - 0.1, HALF_D + 0.1, 0, HEIGHT, 'wall'),
  box(-HALF_W, STEPS.minX, -1.06, -0.94, MEZZANINE_Y, MEZZANINE_Y + 1.1, 'railing'),
  box(STEPS.maxX, HALF_W, -1.06, -0.94, MEZZANINE_Y, MEZZANINE_Y + 1.1, 'railing'),
  box(STEPS.minX - 0.06, STEPS.minX + 0.06, -2, -1, MEZZANINE_Y, MEZZANINE_Y + 1.1, 'railing'),
  box(STEPS.maxX - 0.06, STEPS.maxX + 0.06, -2, -1, MEZZANINE_Y, MEZZANINE_Y + 1.1, 'railing'),
  box(STEPS.minX - 0.1, STEPS.minX, STAIR.topZ, STAIR.bottomZ, 0, MEZZANINE_Y + 1.1, 'stair'),
  box(STEPS.maxX, STEPS.maxX + 0.1, STAIR.topZ, STAIR.bottomZ, 0, MEZZANINE_Y + 1.1, 'stair'),
  box(9.85, HALF_W, -1, 4, 0, 1.2, 'furniture'),
  box(-9.6, 3.6, -HALF_D, -6.3, 0, 1.1, 'furniture'),
  box(4.5, 5.5, 5.12, 5.68, 0, 1.1, 'furniture'),
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
 * Priorité : l'escalier d'abord (rampe lissée entre ses quatre paliers), puis la surface
 * la plus haute trouvée. Sous la mezzanine, passer `level: 'ground'` rend le parquet et
 * non la dalle : un même (x, z) appartient à deux niveaux superposés.
 *
 * @param {number} x Abscisse en mètres.
 * @param {number} z Ordonnée en mètres.
 * @param {string|null} [level] Niveau demandé, ou `null` pour la surface la plus haute.
 * @returns {number|null} Altitude en mètres, ou `null` hors de toute zone praticable.
 */
export function surfaceHeightAt(x, z, level = null) {
  const onStair = x >= STEPS.minX && x <= STEPS.maxX && z >= STAIR.topZ && z <= STAIR.bottomZ;
  if (onStair && level !== LEVELS.MEZZANINE) {
    return ((STAIR.bottomZ - z) / STAIR_RUN) * MEZZANINE_Y;
  }

  let height = null;
  for (const surface of WALK_SURFACES) {
    if (x < surface.minX || x > surface.maxX || z < surface.minZ || z > surface.maxZ) continue;
    if (level !== null && surface.level !== level) continue;
    if (height === null || surface.y > height) height = surface.y;
  }
  return height;
}
