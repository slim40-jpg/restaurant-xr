/**
 * @file    src/world/layout.js
 * @brief   Plan de salle du restaurant : dimensions, catalogue des 16 tables et points d'ancrage.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Source unique du plan de salle, consommée par le décor, le mobilier et la composition.
 */

import { TABLE_FEATURES, ZONES } from '../config/constants.js';

/** Palette « bistrot le soir » partagée par le décor, le mobilier et l'éclairage. */
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
});

/** Enveloppe de la salle (22 × 14 m) et contraintes d'implantation en mètres. */
export const ROOM_LAYOUT = Object.freeze({
  WIDTH: 22,
  DEPTH: 14,
  HEIGHT: 3.4,
  MIN_GAP: 1.6,
  WALL_CLEARANCE: 1.2,
  AISLE: 1.2,
  FLOOR_Y: 0,
});

const { WINDOW, CORNER, CENTER, BAR, BANQUETTE } = ZONES;
const { VIEW, QUIET, PRIVATE, NEAR_WC, NEAR_ENTRANCE } = TABLE_FEATURES;

/** Fabrique une entrée de table gelée à partir d'une ligne compacte du plan. */
function table(id, zone, capacity, shape, x, z, rotation, features, status) {
  return Object.freeze({
    id,
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
 * Les 16 tables de la salle. Les identifiants sont stables (T01..T16) et jamais dérivés
 * des coordonnées : une table peut être déplacée sans casser la logique de sélection.
 */
export const TABLE_CATALOGUE = Object.freeze([
  table('T01', WINDOW, 2, 'round', -9.3, -3.0, 0, [VIEW], 'available'),
  table('T02', WINDOW, 4, 'round', -9.3, -1.0, 0, [VIEW], 'reserved'),
  table('T03', WINDOW, 2, 'round', -9.3, 1.2, 0, [VIEW], 'available'),
  table('T04', WINDOW, 4, 'round', -9.3, 3.6, 0, [VIEW], 'occupied'),
  table('T05', WINDOW, 2, 'round', -9.3, 5.6, 0, [VIEW], 'available'),
  table('T06', CORNER, 6, 'rect', -9.1, -5.7, Math.PI / 2, [PRIVATE, QUIET], 'available'),
  table('T07', CORNER, 2, 'round', -6.4, -5.5, 0, [QUIET], 'available'),
  table('T08', CORNER, 4, 'round', 8.8, -5.3, 0, [PRIVATE, QUIET, NEAR_WC], 'unavailable'),
  table('T09', BANQUETTE, 4, 'round', -3.4, -5.4, 0, [QUIET], 'occupied'),
  table('T10', BANQUETTE, 6, 'round', -0.4, -5.4, 0, [QUIET], 'available'),
  table('T11', BANQUETTE, 4, 'round', 2.4, -5.4, 0, [QUIET], 'available'),
  table('T12', CENTER, 4, 'round', -4.2, 1.0, Math.PI / 4, [], 'available'),
  table('T13', CENTER, 2, 'round', 0.0, 1.4, 0, [], 'available'),
  table('T14', CENTER, 4, 'round', 4.2, 0.6, Math.PI / 4, [], 'available'),
  table('T15', BAR, 2, 'round', 9.2, 0.2, 0, [], 'available'),
  table('T16', BAR, 2, 'round', 9.2, 2.8, 0, [NEAR_ENTRANCE], 'available'),
]);

/** Points d'intérêt que le décor instancie (fenêtre, bar, WC, cuisine, entrée, accueil). */
export const ROOM_ANCHORS = Object.freeze({
  windows: Object.freeze({ x: -11, zMin: -7, zMax: 7, sill: 0.5, height: 2.4 }),
  bar: Object.freeze({ x: 11, z: 1.5, length: 5.0, counterX: 10.3 }),
  wc: Object.freeze({ x: 6.5, z: -7, width: 0.9, height: 2.05 }),
  kitchen: Object.freeze({ x: 3.5, z: -7, width: 1.8, height: 2.1 }),
  entrance: Object.freeze({ x: 7, z: 7, width: 1.8, height: 2.4 }),
  hostDesk: Object.freeze({ x: 5.0, z: 5.4 }),
});
