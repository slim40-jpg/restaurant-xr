/**
 * @file    src/world/layout.mjs
 * @brief   Plan du lieu : salle 22 × 14 m sur deux niveaux, mezzanine, escalier et jardin 18 × 8,8 m.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-12
 * @role    Source unique du plan (dimensions, niveaux, escalier, 24 tables, ancrages), sans Three.js.
 */

import { TABLE_FEATURES, ZONES } from '../config/constants.mjs';

/** Palette « bistrot le soir » partagée par le décor, le mobilier, le jardin et l'éclairage. */
export const PALETTE = Object.freeze({
  WOOD: 0x8b5a2b,
  WOOD_DARK: 0x513118,
  WOOD_LIGHT: 0xa9743f,
  CREAM: 0xf1e8da,
  BRASS: 0xb08d57,
  PLANT: 0x2f5d3a,
  PLANT_DARK: 0x1f4229,
  WINE: 0x6e1f2a,
  CHARCOAL: 0x2a2622,
  GLASS: 0x9fb6c4,
  DUSK: 0x2a3550,
  STONE: 0xa8a091,
  DECK: 0x8a6543,
  BULB: 0xffca7a,
  /** Bistrot parisien : zinc du comptoir, cuir oxblood, laque verte, marbre, auvent rouge. */
  ZINC: 0x9aa0a6,
  OXBLOOD: 0x5a1a22,
  BOTTLE_GREEN: 0x1f3a2e,
  MARBLE: 0xeae6dd,
  AWNING_RED: 0x8c1f28,
  IRON: 0x2f3236,
  RATTAN: 0xc9a26a,
});

/** Enveloppe du bâtiment, strates de hauteur et contraintes d'implantation, en mètres. */
export const ROOM_LAYOUT = Object.freeze({
  WIDTH: 22,
  DEPTH: 14,
  HEIGHT: 8.0,
  GROUND_HEIGHT: 3.0,
  SLAB: 0.25,
  MEZZANINE_Y: 3.25,
  WALL_CLEARANCE: 1.2,
  MIN_GAP: 1.6,
  AISLE: 1.2,
});

/** Niveaux praticables du lieu. Une table est toujours rattachée à un seul niveau. */
export const LEVELS = Object.freeze({
  GROUND: 'ground',
  MEZZANINE: 'mezzanine',
  TERRACE: 'terrace',
});

/**
 * Altitude du sol de chaque niveau. Le `y` d'une table se déduit d'ici et n'est jamais
 * écrit dans le catalogue : déplacer une table ne demande alors aucune retouche de hauteur.
 */
export const LEVEL_HEIGHT = Object.freeze({
  ground: 0,
  mezzanine: ROOM_LAYOUT.MEZZANINE_Y,
  terrace: 0,
});

/**
 * Escalier droit : 14 marches imposées et 3,25 m de montée. La hauteur de marche est donc
 * déduite (3,25 / 14 = 0,232 m) et non fixée à 0,21 m : 14 × 0,21 = 2,94 m ne joint pas la
 * dalle. Le giron de 0,30 m donne une pente de 37°, raide mais courante en bistrot.
 */
export const STAIR = Object.freeze({
  centreX: -7.0,
  width: 1.2,
  steps: 14,
  tread: 0.3,
  rise: ROOM_LAYOUT.MEZZANINE_Y / 14,
  topZ: -1.0,
  bottomZ: -1.0 + 14 * 0.3,
  railHeight: 1.0,
});

const HALF_W = ROOM_LAYOUT.WIDTH / 2;
const HALF_D = ROOM_LAYOUT.DEPTH / 2;
const { WINDOW, CORNER, CENTER, BAR, BANQUETTE, TERRACE } = ZONES;
const { VIEW, QUIET, PRIVATE, NEAR_WC, NEAR_ENTRANCE } = TABLE_FEATURES;

/** Fabrique une entrée de table gelée à partir d'une ligne compacte du plan. */
function table(id, level, zone, capacity, shape, x, z, rotation, features, status) {
  return Object.freeze({
    id,
    level,
    zone,
    capacity,
    shape,
    x,
    z,
    rotation,
    features: Object.freeze(features),
    status,
  });
}

/**
 * Le catalogue complet du lieu. T01..T16 gardent identifiants, positions et états d'origine ;
 * T17..T20 vivent en terrasse, T21..T24 sur la mezzanine. Les identifiants sont stables et
 * jamais dérivés des coordonnées : une table peut être déplacée sans casser la sélection.
 */
export const TABLE_CATALOGUE = Object.freeze([
  table('T01', LEVELS.GROUND, WINDOW, 2, 'round', -9.3, -3.0, 0, [VIEW], 'available'),
  table('T02', LEVELS.GROUND, WINDOW, 4, 'round', -9.3, -1.0, 0, [VIEW], 'reserved'),
  table('T03', LEVELS.GROUND, WINDOW, 2, 'round', -9.3, 1.2, 0, [VIEW], 'available'),
  table('T04', LEVELS.GROUND, WINDOW, 4, 'round', -9.3, 3.6, 0, [VIEW], 'occupied'),
  table('T05', LEVELS.GROUND, WINDOW, 2, 'round', -9.3, 5.6, 0, [VIEW], 'available'),
  table('T06', LEVELS.GROUND, CORNER, 6, 'rect', -9.1, -5.7, Math.PI / 2, [PRIVATE, QUIET], 'available'),
  table('T07', LEVELS.GROUND, CORNER, 2, 'round', -6.4, -5.5, 0, [QUIET], 'available'),
  table('T08', LEVELS.GROUND, CORNER, 4, 'round', 8.8, -5.3, 0, [PRIVATE, QUIET, NEAR_WC], 'unavailable'),
  table('T09', LEVELS.GROUND, BANQUETTE, 4, 'round', -3.4, -5.4, 0, [QUIET], 'occupied'),
  table('T10', LEVELS.GROUND, BANQUETTE, 6, 'round', -0.4, -5.4, 0, [QUIET], 'available'),
  table('T11', LEVELS.GROUND, BANQUETTE, 4, 'round', 2.4, -5.4, 0, [QUIET], 'available'),
  table('T12', LEVELS.GROUND, CENTER, 4, 'round', -4.2, 1.0, Math.PI / 4, [], 'available'),
  table('T13', LEVELS.GROUND, CENTER, 2, 'round', 0.0, 1.4, 0, [], 'available'),
  table('T14', LEVELS.GROUND, CENTER, 4, 'round', 4.2, 0.6, Math.PI / 4, [], 'available'),
  table('T15', LEVELS.GROUND, BAR, 2, 'round', 9.2, 0.2, 0, [], 'available'),
  table('T16', LEVELS.GROUND, BAR, 2, 'round', 9.2, 2.8, 0, [NEAR_ENTRANCE], 'available'),
  table('T17', LEVELS.TERRACE, TERRACE, 4, 'round', -5.6, 9.4, Math.PI / 4, [VIEW], 'available'),
  table('T18', LEVELS.TERRACE, TERRACE, 4, 'round', -0.6, 9.4, 0, [VIEW], 'available'),
  table('T19', LEVELS.TERRACE, TERRACE, 4, 'round', 4.2, 10.2, Math.PI / 4, [NEAR_ENTRANCE], 'available'),
  table('T20', LEVELS.TERRACE, TERRACE, 6, 'rect', -2.8, 13.8, 0, [VIEW, PRIVATE], 'reserved'),
]);

/**
 * Points d'intérêt que le décor instancie. Les surfaces de `mezzanine`, `terrace` et `garden`
 * sont des boîtes englobantes : elles servent au cadrage, au mode marche et aux tests.
 */
export const ROOM_ANCHORS = Object.freeze({
  windows: Object.freeze({
    x: -HALF_W,
    zMin: -HALF_D,
    zMax: HALF_D,
    sill: 0.5,
    height: 2.3,
    upperSill: 3.4,
    upperHeight: 2.3,
  }),
  bar: Object.freeze({ x: 11, z: 1.5, length: 5.0, counterX: 10.3 }),
  wc: Object.freeze({ x: 6.5, z: -7, width: 0.9, height: 2.05 }),
  kitchen: Object.freeze({ x: 3.5, z: -7, width: 1.8, height: 2.1 }),
  entrance: Object.freeze({ x: 7, z: 7, width: 1.8, height: 2.4 }),
  hostDesk: Object.freeze({ x: 4.2, z: 6.2 }),
  stairs: Object.freeze({
    minX: STAIR.centreX - STAIR.width / 2,
    maxX: STAIR.centreX + STAIR.width / 2,
    minZ: STAIR.topZ,
    maxZ: STAIR.bottomZ,
    top: ROOM_LAYOUT.MEZZANINE_Y,
    steps: STAIR.steps,
    rise: STAIR.rise,
    tread: STAIR.tread,
  }),
  mezzanine: Object.freeze({
    minX: -HALF_W,
    maxX: HALF_W,
    minZ: -HALF_D,
    maxZ: -1,
    y: ROOM_LAYOUT.MEZZANINE_Y,
    railHeight: 1.1,
  }),
  terrace: Object.freeze({ minX: -9, maxX: 9, minZ: 7.2, maxZ: 16, y: 0 }),
  garden: Object.freeze({ minX: -10.5, maxX: 10.5, minZ: 7, maxZ: 16.8 }),
  pergola: Object.freeze({ minX: -8.6, maxX: 8.6, minZ: 9.2, maxZ: 15.5, y: 2.8 }),
});
