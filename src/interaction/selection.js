/**
 * @file    src/interaction/selection.js
 * @brief   Sélection par rayon du contrôleur et simulation de réservation d'une table.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-10
 * @role    Traduit un événement de gâchette en mise à jour d'état de table et de panneau.
 */

import * as THREE from 'three';

import { STATUS_COLORS, TABLE_STATUS } from '../config/constants.js';

/**
 * Crée le gestionnaire d'événement `selectstart` du contrôleur.
 * @param {{ tablesGroup: THREE.Group, statusPanel: Object }} deps Dépendances de la sélection :
 *   `tablesGroup` (groupe des tables) et `statusPanel` (panneau d'état).
 * @returns {(event: THREE.Event) => void} Gestionnaire à brancher sur `selectstart`.
 */
export function createSelectionHandler({ tablesGroup, statusPanel }) {
  /**
   * Lance un rayon depuis le contrôleur, identifie la table visée et applique la réservation.
   * @param {THREE.Event} event Événement `selectstart` dont la cible est le contrôleur.
   * @returns {void}
   */
  return function handleSelect(event) {
    const ctrl = event.target;
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(ctrl.matrixWorld);

    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // Intersection avec les tables (récursif pour atteindre le plateau)
    const intersects = raycaster.intersectObjects(tablesGroup.children, true);

    if (intersects.length > 0) {
      // Remonter jusqu'au groupe de la table
      let hit = intersects[0].object;
      while (hit.parent && !hit.userData.isTable) {
        hit = hit.parent;
      }

      if (hit.userData && hit.userData.isTable) {
        const data = hit.userData;

        // Si disponible, la marquer comme "réservée" (simulation)
        if (data.status === TABLE_STATUS.AVAILABLE) {
          data.status = TABLE_STATUS.RESERVED;
          data.marker.material.color.set(STATUS_COLORS.reserved);
          data.marker.material.emissive.set(STATUS_COLORS.reserved);
          statusPanel.showReserved(data);
        } else {
          statusPanel.showTable(data);
        }
      }
    } else {
      statusPanel.showNoTarget();
    }
  };
}
