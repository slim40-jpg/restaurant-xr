/**
 * @file    src/ui/status-fanout.js
 * @brief   Diffusion des messages d'état vers plusieurs panneaux derrière une interface unique.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-11
 * @role    Permettre au panneau DOM et au panneau 3D de coexister sans modifier l'interaction.
 */

/**
 * Crée un répartiteur qui relaie chaque appel du contrat de panneau à tous les panneaux fournis.
 * Les entrées `null`/`undefined` et les méthodes absentes sont ignorées.
 * @param {Array<Object|null|undefined>} [panels] Panneaux cibles (DOM, 3D ou tout objet compatible).
 * @returns {{
 *   setMessage: (text: string, color: string) => void,
 *   showTable: (tableData: { id: string, status: string }) => void,
 *   showReserved: (tableData: { id: string }) => void,
 *   showNoTarget: () => void,
 *   update: (camera: import('three').Camera) => void
 * }} API agrégée déléguant à tous les panneaux disponibles.
 */
export function createStatusFanout(panels = []) {
  const targets = (Array.isArray(panels) ? panels : []).filter((panel) => panel && typeof panel === 'object');

  /**
   * Appelle une méthode sur chaque panneau qui l'implémente.
   * @param {string} method Nom de la méthode du contrat de panneau.
   * @param {unknown[]} args Arguments à transmettre.
   * @returns {void}
   */
  function dispatch(method, args) {
    for (const target of targets) {
      if (typeof target[method] === 'function') target[method](...args);
    }
  }

  /**
   * Affiche un message libre sur tous les panneaux.
   * @param {string} text Contenu textuel du message.
   * @param {string} [color] Couleur CSS du texte.
   * @returns {void}
   */
  function setMessage(text, color) {
    dispatch('setMessage', [text, color]);
  }

  /**
   * Affiche la table sélectionnée et son statut sur tous les panneaux.
   * @param {{ id: string, status: string }} tableData Données de la table visée.
   * @returns {void}
   */
  function showTable(tableData) {
    dispatch('showTable', [tableData]);
  }

  /**
   * Affiche la confirmation de réservation sur tous les panneaux.
   * @param {{ id: string }} tableData Données de la table réservée.
   * @returns {void}
   */
  function showReserved(tableData) {
    dispatch('showReserved', [tableData]);
  }

  /**
   * Signale l'absence de cible sur tous les panneaux.
   * @returns {void}
   */
  function showNoTarget() {
    dispatch('showNoTarget', []);
  }

  /**
   * Met à jour l'orientation de chaque panneau qui gère une caméra.
   * @param {import('three').Camera} camera Caméra en cours de rendu.
   * @returns {void}
   */
  function update(camera) {
    dispatch('update', [camera]);
  }

  return { setMessage, showTable, showReserved, showNoTarget, update };
}
