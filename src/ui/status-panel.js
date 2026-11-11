/**
 * @file    src/ui/status-panel.js
 * @brief   Rendu DOM du panneau d'état affichant la table visée, ses attributs et son statut.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-11
 * @role    Seul point de contact avec le DOM pour les messages de sélection ; aucune dépendance Three.js.
 */

import { STATUS_LABELS_FR, STATUS_TEXT_COLORS } from '../config/constants.js';
import { formatTableAttributes } from '../interaction/recommend.js';

/**
 * Compose l'en-tête d'une table : identifiant puis attributs lisibles.
 * @param {{ id: string, zone?: string, capacity?: number, features?: string[] }} tableData Données de la table.
 * @returns {string} Texte du type `Table T05 — Près de la fenêtre · 4 places · Au calme`.
 */
function formatTableHeading(tableData) {
  const attributes = formatTableAttributes(tableData);
  return attributes ? `Table ${tableData.id} — ${attributes}` : `Table ${tableData.id}`;
}

/**
 * Crée un contrôleur du panneau d'état lié à un élément DOM.
 * @param {HTMLElement} element Élément DOM du panneau d'état.
 * @returns {Object} API du panneau : setMessage, showTable, showReserved, showNoTarget.
 */
export function createStatusPanel(element) {
  /**
   * Affiche un message libre avec la couleur demandée.
   * @param {string} text Contenu textuel du panneau.
   * @param {string} color Couleur CSS du texte.
   * @returns {void}
   */
  function setMessage(text, color) {
    element.textContent = text;
    element.style.color = color;
  }

  /**
   * Affiche la table sélectionnée, ses attributs puis son libellé d'état sur une seconde ligne.
   * @param {{ id: string, status: string, zone?: string, capacity?: number, features?: string[] }} tableData
   *   Données de la table visée.
   * @returns {void}
   */
  function showTable(tableData) {
    const label = STATUS_LABELS_FR[tableData.status] || tableData.status;
    element.style.whiteSpace = 'pre-line';
    element.textContent = `${formatTableHeading(tableData)}\n${label}`;
    element.style.color =
      tableData.status === 'available' ? STATUS_TEXT_COLORS.available : STATUS_TEXT_COLORS.unavailableStatus;
  }

  /**
   * Affiche la table qui vient de passer de « Disponible » à « Réservée ».
   * Le libellé d'origine est conservé puisque la mutation d'état est déjà appliquée.
   * @param {{ id: string }} tableData Données de la table réservée.
   * @returns {void}
   */
  function showReserved(tableData) {
    element.textContent = `Table sélectionnée : ${tableData.id} — ${STATUS_LABELS_FR.available} → Réservée !`;
    element.style.color = STATUS_TEXT_COLORS.available;
  }

  /**
   * Signale qu'aucune table n'est visée par le rayon du contrôleur.
   * @returns {void}
   */
  function showNoTarget() {
    setMessage('Aucune table visée', STATUS_TEXT_COLORS.neutral);
  }

  return { setMessage, showTable, showReserved, showNoTarget };
}
