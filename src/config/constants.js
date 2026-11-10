/**
 * @file    src/config/constants.js
 * @brief   Constantes partagées de la scène, du mobilier et des états de table.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-10
 * @role    Source unique de vérité pour les dimensions, les couleurs et les libellés.
 */

/** Couleur de fond de la scène (bleu nuit). */
export const SCENE_BACKGROUND_COLOR = 0x1a1a2e;

/** Champ de vision vertical de la caméra. */
export const FOV = 75;
/** Plan de clipping proche. */
export const NEAR = 0.1;
/** Plan de clipping lointain. */
export const FAR = 100;
/** Hauteur des yeux de l'utilisateur en mètres. */
export const EYE_HEIGHT = 1.6;

/** Dimensions de la salle en mètres. */
export const ROOM = Object.freeze({ WIDTH: 14, DEPTH: 12, HEIGHT: 3 });

/** États possibles d'une table. */
export const TABLE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  UNAVAILABLE: 'unavailable',
});

/** Couleur du marqueur d'état de chaque table. */
export const STATUS_COLORS = Object.freeze({
  available: 0x00cc00,
  occupied: 0xcc0000,
  reserved: 0xcccc00,
  unavailable: 0x888888,
});

/** Libellés français affichés dans le panneau d'état. */
export const STATUS_LABELS_FR = Object.freeze({
  available: 'Disponible',
  occupied: 'Occupée',
  reserved: 'Réservée',
  unavailable: 'Indisponible',
});

/** Couleurs de texte du panneau d'état. */
export const STATUS_TEXT_COLORS = Object.freeze({
  available: '#00ff00',
  unavailableStatus: '#ff6666',
  neutral: '#ffffff',
});

/** Identifiant DOM du panneau d'état. */
export const STATUS_ELEMENT_ID = 'status';

/** Message affiché avant toute sélection. */
export const INITIAL_STATUS_MESSAGE = 'Pointez une table et appuyez sur la gâchette';

/** Disposition initiale des tables dans la salle. */
export const TABLE_LAYOUT = Object.freeze([
  { x: -3, z: -3, status: 'available' },
  { x: 0, z: -3, status: 'occupied' },
  { x: 3, z: -3, status: 'reserved' },
  { x: -3, z: 1, status: 'available' },
  { x: 0, z: 1, status: 'unavailable' },
  { x: 3, z: 1, status: 'available' },
]);
