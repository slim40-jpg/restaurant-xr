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

/**
 * Zones de la salle. Une table appartient à une seule zone : c'est le premier
 * critère de choix d'un client (« près de la fenêtre », « au calme », …).
 */
export const ZONES = Object.freeze({
  WINDOW: 'window',
  CORNER: 'corner',
  CENTER: 'center',
  BAR: 'bar',
  BANQUETTE: 'banquette',
});

/** Caractéristiques secondaires d'une table, cumulables. */
export const TABLE_FEATURES = Object.freeze({
  QUIET: 'quiet',
  PRIVATE: 'private',
  VIEW: 'view',
  NEAR_WC: 'near_wc',
  NEAR_ENTRANCE: 'near_entrance',
});

/** Libellés français des zones, affichés dans l'interface. */
export const ZONE_LABELS_FR = Object.freeze({
  window: 'Près de la fenêtre',
  corner: 'Coin',
  center: 'Salle',
  bar: 'Au bar',
  banquette: 'Banquette',
});

/** Libellés français des caractéristiques, affichés dans l'interface. */
export const FEATURE_LABELS_FR = Object.freeze({
  quiet: 'Au calme',
  private: "À l'écart",
  view: 'Vue extérieure',
  near_wc: 'Près des WC',
  near_entrance: "Près de l'entrée",
});

/** Tailles de groupe proposées au client. */
export const PARTY_SIZES = Object.freeze([2, 4, 6]);

// Le plan de salle (dimensions, 16 tables, points d'ancrage) vit dans
// `src/world/layout.js` : c'est une donnée de monde, pas une constante de configuration.
