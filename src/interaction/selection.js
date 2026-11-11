/**
 * @file    src/interaction/selection.js
 * @brief   Sélection par rayon : réservation d'une table depuis un rayon quelconque.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-11
 * @role    Traduit un rayon (manette WebXR ou souris) en mise à jour d'état de table et de panneau.
 */

import * as THREE from 'three';

import { STATUS_COLORS, TABLE_STATUS } from '../config/constants.js';

/**
 * Crée le service de sélection, indépendant de la source du rayon.
 * Séparer la source (manette, souris) de la logique métier évite de dupliquer la
 * machine à états de réservation et permet de la tester sans événement XR.
 * @param {{ tablesGroup: THREE.Group, statusPanel: Object }} deps Dépendances de la sélection :
 *   `tablesGroup` (groupe des tables) et `statusPanel` (panneau d'état).
 * @returns {{ select: (ray: THREE.Ray) => void }} Service exposant `select(ray)`.
 */
export function createSelectionService({ tablesGroup, statusPanel }) {
  /**
   * Identifie la table visée par le rayon et applique la réservation.
   * @param {THREE.Ray} ray Rayon déjà positionné dans l'espace monde.
   * @returns {void}
   */
  function select(ray) {
    const raycaster = new THREE.Raycaster();
    raycaster.ray = ray;

    // Récursif : le rayon touche le plateau, le pied ou une chaise, jamais le Group de la table.
    const intersects = raycaster.intersectObjects(tablesGroup.children, true);

    if (intersects.length === 0) {
      statusPanel.showNoTarget();
      return;
    }

    // Remontée de hiérarchie jusqu'au Group porteur de `userData.isTable`.
    let hit = intersects[0].object;
    while (hit.parent && !hit.userData.isTable) {
      hit = hit.parent;
    }

    // Certains objets annexes (sol, murs) n'ont pas de table parente : on ne fait rien.
    if (!hit.userData || !hit.userData.isTable) {
      return;
    }

    const data = hit.userData;

    // Si disponible, la marquer comme « réservée » (simulation d'un geste de réservation).
    if (data.status === TABLE_STATUS.AVAILABLE) {
      data.status = TABLE_STATUS.RESERVED;
      data.marker.material.color.set(STATUS_COLORS.reserved);
      data.marker.material.emissive.set(STATUS_COLORS.reserved);
      statusPanel.showReserved(data);
    } else {
      statusPanel.showTable(data);
    }
  }

  return { select };
}

/**
 * Crée le gestionnaire d'événement `selectstart` du contrôleur WebXR.
 * Le rayon est reconstruit depuis la pose du contrôleur puis délégué au service,
 * ce qui conserve la signature et le comportement attendus par les tests.
 * @param {{ tablesGroup: THREE.Group, statusPanel: Object }} deps Dépendances de la sélection :
 *   `tablesGroup` (groupe des tables) et `statusPanel` (panneau d'état).
 * @returns {(event: THREE.Event) => void} Gestionnaire à brancher sur `selectstart`.
 */
export function createSelectionHandler({ tablesGroup, statusPanel }) {
  const service = createSelectionService({ tablesGroup, statusPanel });

  /**
   * Reconstruit le rayon de visée du contrôleur et déclenche la sélection.
   * @param {THREE.Event} event Événement `selectstart` dont la cible est le contrôleur.
   * @returns {void}
   */
  return function handleSelect(event) {
    const ctrl = event.target;
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(ctrl.matrixWorld);

    const ray = new THREE.Ray();
    ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
    ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    service.select(ray);
  };
}
