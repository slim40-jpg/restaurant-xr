/**
 * @file    src/interaction/recommend.js
 * @brief   Moteur de recommandation pur : notation et classement des places selon les préférences.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-11
 * @role    Décider quelles tables correspondent à un groupe, sans DOM ni Three.js.
 */

import { FEATURE_LABELS_FR, TABLE_FEATURES, TABLE_STATUS, ZONE_LABELS_FR } from '../config/constants.js';

/** Bonus d'une table située dans la zone demandée. */
const ZONE_MATCH_BONUS = 5;
/** Bonus par caractéristique demandée et présente. */
const FEATURE_MATCH_BONUS = 3;
/** Malus d'une table portant `NEAR_WC` alors que le client veut s'en éloigner. */
const NEAR_WC_PENALTY = -6;
/** Bonus d'une table au calme alors que le client le demande. */
const QUIET_BONUS = 4;
/** Malus d'une table nettement plus grande que le groupe (sièges gaspillés). */
const WASTE_PENALTY = -2;
/** Écart de couverts au-delà duquel la table est jugée surdimensionnée. */
const WASTE_THRESHOLD = 2;
/** Libellé de repli, en français, quand la table évite les WC. */
const LOIN_DES_WC_LABEL = 'Loin des WC';

/**
 * Décrit les attributs d'une table en français, sans son identifiant.
 * @param {{ zone?: string, capacity?: number, features?: string[] }} table Données de la table.
 * @returns {string} Attributs joints par « · », ou chaîne vide si aucun attribut exploitable.
 */
export function formatTableAttributes(table) {
  if (!table || typeof table !== 'object') return '';

  const parts = [];
  const zoneLabel = ZONE_LABELS_FR[table.zone];
  if (zoneLabel) parts.push(zoneLabel);

  if (Number.isFinite(table.capacity)) {
    parts.push(`${table.capacity} ${table.capacity === 1 ? 'place' : 'places'}`);
  }

  const features = Array.isArray(table.features) ? table.features : [];
  for (const feature of features) {
    const label = FEATURE_LABELS_FR[feature];
    if (label) parts.push(label);
  }

  return parts.join(' · ');
}

/**
 * Décrit une table en une ligne lisible : identifiant puis attributs.
 * @param {{ id: string, zone?: string, capacity?: number, features?: string[] }} table Données de la table.
 * @returns {string} Description du type `T05 · Près de la fenêtre · 4 places · Au calme`.
 */
export function describeTable(table) {
  if (!table || typeof table !== 'object') return '';

  const id = table.id === null || table.id === undefined ? '' : String(table.id);
  const attributes = formatTableAttributes(table);
  return attributes ? `${id} · ${attributes}` : id;
}

/**
 * Indique si une table peut recevoir un client.
 * @param {{ status?: string } | null | undefined} table Données de la table.
 * @returns {boolean} `true` uniquement quand la table est disponible.
 */
export function isAvailable(table) {
  return Boolean(table) && table.status === TABLE_STATUS.AVAILABLE;
}

/**
 * Note une table pour un groupe et des préférences donnés.
 *
 * Barème :
 * - table non disponible → `-Infinity` (exclue) ;
 * - capacité inférieure au groupe → `-Infinity` (une table de 2 ne sert pas 4) ;
 * - capacité excédentaire de plus de 2 couverts → malus de 2 points, une seule fois ;
 * - zone demandée et identique → +5 ;
 * - chaque caractéristique demandée présente → +3 ;
 * - `avoidWc` et table `NEAR_WC` → -6 ;
 * - `quiet` et table `QUIET` → +4.
 * @param {{ status?: string, capacity?: number, zone?: string, features?: string[] }} table Données de la table.
 * @param {{ partySize?: number, zone?: string | null, features?: string[], quiet?: boolean,
 *   avoidWc?: boolean }} [prefs] Préférences du client.
 * @returns {number} Score, ou `-Infinity` si la table est inéligible.
 */
export function scoreTable(table, prefs = {}) {
  if (!isAvailable(table)) return Number.NEGATIVE_INFINITY;

  const partySize = Number(prefs.partySize) || 0;
  const capacity = Number(table.capacity) || 0;
  if (capacity < partySize) return Number.NEGATIVE_INFINITY;

  const features = Array.isArray(table.features) ? table.features : [];
  let score = 0;

  if (capacity - partySize > WASTE_THRESHOLD) score += WASTE_PENALTY;
  if (prefs.zone && table.zone === prefs.zone) score += ZONE_MATCH_BONUS;

  const requested = Array.isArray(prefs.features) ? prefs.features : [];
  for (const feature of requested) {
    if (features.includes(feature)) score += FEATURE_MATCH_BONUS;
  }

  if (prefs.avoidWc && features.includes(TABLE_FEATURES.NEAR_WC)) score += NEAR_WC_PENALTY;
  if (prefs.quiet && features.includes(TABLE_FEATURES.QUIET)) score += QUIET_BONUS;

  return score;
}

/**
 * Construit les raisons lisibles d'une correspondance, sans jamais exposer de clé technique.
 * @param {{ zone?: string, features?: string[] }} table Données de la table.
 * @param {{ zone?: string | null, features?: string[], quiet?: boolean, avoidWc?: boolean }} prefs Préférences.
 * @returns {string[]} Libellés français courts, sans doublon.
 */
function buildReasons(table, prefs) {
  const reasons = [];
  const features = Array.isArray(table.features) ? table.features : [];

  if (prefs.zone && table.zone === prefs.zone && ZONE_LABELS_FR[table.zone]) {
    reasons.push(ZONE_LABELS_FR[table.zone]);
  }

  const requested = Array.isArray(prefs.features) ? prefs.features : [];
  for (const feature of requested) {
    if (features.includes(feature) && FEATURE_LABELS_FR[feature]) {
      reasons.push(FEATURE_LABELS_FR[feature]);
    }
  }

  if (prefs.quiet && features.includes(TABLE_FEATURES.QUIET)) {
    reasons.push(FEATURE_LABELS_FR[TABLE_FEATURES.QUIET]);
  }

  if (prefs.avoidWc && !features.includes(TABLE_FEATURES.NEAR_WC)) {
    reasons.push(LOIN_DES_WC_LABEL);
  }

  return [...new Set(reasons)];
}

/**
 * Classe les tables éligibles par score décroissant, puis capacité la plus proche du groupe,
 * puis identifiant croissant : l'ordre est total et déterministe.
 * @param {Array<{ id: string, status?: string, capacity?: number, zone?: string, features?: string[] }>} tables
 *   Tables candidates (données vivantes ou copie).
 * @param {{ partySize?: number, zone?: string | null, features?: string[], quiet?: boolean,
 *   avoidWc?: boolean }} [prefs] Préférences du client.
 * @returns {Array<{ table: Object, score: number, reasons: string[] }>} Correspondances triées.
 */
export function findMatchingTables(tables, prefs = {}) {
  const candidates = Array.isArray(tables) ? tables : [];
  const partySize = Number(prefs.partySize) || 0;
  const matches = [];

  for (const table of candidates) {
    const score = scoreTable(table, prefs);
    if (!Number.isFinite(score)) continue;
    matches.push({ table, score, reasons: buildReasons(table, prefs) });
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const distanceA = Math.abs((Number(a.table.capacity) || 0) - partySize);
    const distanceB = Math.abs((Number(b.table.capacity) || 0) - partySize);
    if (distanceA !== distanceB) return distanceA - distanceB;

    const idA = String(a.table.id);
    const idB = String(b.table.id);
    if (idA === idB) return 0;
    return idA < idB ? -1 : 1;
  });

  return matches;
}
