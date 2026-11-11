/**
 * @file    src/interaction/highlight.js
 * @brief   Mise en évidence pulsée des marqueurs des tables recommandées.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-11
 * @role    Faire respirer les marqueurs ciblés sans jamais modifier l'état métier des tables.
 */

import { STATUS_COLORS, TABLE_STATUS } from '../config/constants.js';

/** Couleur d'émission des marqueurs mis en évidence. */
const HIGHLIGHT_COLOR = 0x7ad7ff;
/** Intensité moyenne de la pulsation. */
const BASE_INTENSITY = 0.9;
/** Amplitude discrète de la pulsation. */
const PULSE_AMPLITUDE = 0.5;
/** Fréquence de la pulsation, en hertz. */
const PULSE_FREQUENCY = 2;
/** Intensité de repli si celle d'origine n'a pas pu être mémorisée. */
const DEFAULT_INTENSITY = 0.3;

/**
 * Crée le service de mise en évidence des tables d'un groupe Three.js.
 * @param {{ tablesGroup: { children?: Array<Object> } | null }} [deps] Dépendances : groupe des tables.
 * @returns {{ highlight: (ids: string[]) => void, clear: () => void, update: (dt: number) => void }}
 *   API de mise en évidence.
 */
export function createHighlighter({ tablesGroup } = {}) {
  const highlighted = new Set();
  const originalIntensity = new WeakMap();
  let elapsed = 0;

  /**
   * Retourne les tables connues du groupe.
   * @returns {Array<Object>} Enfants du groupe, ou tableau vide.
   */
  function getTables() {
    return tablesGroup && Array.isArray(tablesGroup.children) ? tablesGroup.children : [];
  }

  /**
   * Récupère le marqueur d'une table et son matériau.
   * @param {Object} table Table candidate.
   * @returns {{ material: Object } | null} Marqueur utilisable, ou `null`.
   */
  function getMarker(table) {
    const marker = table && table.userData ? table.userData.marker : null;
    return marker && marker.material ? marker : null;
  }

  /**
   * Applique la couleur d'origine d'un marqueur selon le statut courant de la table.
   * @param {Object} table Table à restaurer.
   * @returns {void}
   */
  function restore(table) {
    const marker = getMarker(table);
    if (!marker) return;

    const color = STATUS_COLORS[table.userData.status] ?? STATUS_COLORS[TABLE_STATUS.UNAVAILABLE];
    if (marker.material.emissive && typeof marker.material.emissive.set === 'function') {
      marker.material.emissive.set(color);
    }
    marker.material.emissiveIntensity = originalIntensity.get(table) ?? DEFAULT_INTENSITY;
  }

  /**
   * Applique la pulsation courante à toutes les tables mises en évidence.
   * @returns {void}
   */
  function applyPulse() {
    const intensity = BASE_INTENSITY + PULSE_AMPLITUDE * Math.sin(elapsed * Math.PI * 2 * PULSE_FREQUENCY);

    for (const table of getTables()) {
      if (!table.userData || !highlighted.has(table.userData.id)) continue;

      const marker = getMarker(table);
      if (!marker) continue;
      if (!originalIntensity.has(table) && Number.isFinite(marker.material.emissiveIntensity)) {
        originalIntensity.set(table, marker.material.emissiveIntensity);
      }
      if (marker.material.emissive && typeof marker.material.emissive.set === 'function') {
        marker.material.emissive.set(HIGHLIGHT_COLOR);
      }
      marker.material.emissiveIntensity = intensity;
    }
  }

  /**
   * Met en évidence les tables demandées et restaure les autres.
   * @param {string[]} [ids] Identifiants des tables à mettre en évidence.
   * @returns {void}
   */
  function highlight(ids = []) {
    highlighted.clear();
    for (const id of Array.isArray(ids) ? ids : []) highlighted.add(id);

    for (const table of getTables()) {
      if (!table.userData || table.userData.isTable !== true) continue;
      if (!highlighted.has(table.userData.id)) restore(table);
    }
    applyPulse();
  }

  /**
   * Restaure tous les marqueurs dans leur état d'origine, sans toucher à `userData.status`.
   * @returns {void}
   */
  function clear() {
    highlighted.clear();
    for (const table of getTables()) {
      if (table.userData && table.userData.isTable === true) restore(table);
    }
  }

  /**
   * Avance la phase de pulsation.
   * @param {number} dt Temps écoulé depuis l'image précédente, en secondes.
   * @returns {void}
   */
  function update(dt) {
    if (!Number.isFinite(dt) || dt <= 0 || highlighted.size === 0) return;
    elapsed += dt;
    applyPulse();
  }

  return { highlight, clear, update };
}
