/**
 * @file    src/interaction/selection.mjs
 * @brief   Sélection par rayon : consulter une table, puis réserver explicitement.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-17
 * @role    Traduire un rayon (manette WebXR ou souris) en sélection, et isoler la réservation
 *          dans une action distincte pour éviter toute réservation accidentelle.
 */

import * as THREE from 'three';

import { STATUS_COLORS, TABLE_STATUS } from '../config/constants.mjs';

/** Raison renvoyée quand la table n'est pas dans l'état `available`. */
const NOT_AVAILABLE_REASON = 'non-disponible';
/** Raison renvoyée quand la table demandée est introuvable. */
const NOT_FOUND_REASON = 'introuvable';

/**
 * Crée le service de sélection, indépendant de la source du rayon.
 * `select` ne modifie jamais l'état d'une table : la réservation passe uniquement
 * par `reserve`, ce qui empêche de réserver en regardant.
 * @param {{ tablesGroup: THREE.Group, statusPanel: Object,
 *   onSelect?: ((table: Object) => void) | null }} deps Dépendances de la sélection :
 *   `tablesGroup` (groupe des tables), `statusPanel` (panneau d'état) et `onSelect`
 *   (rappel optionnel appelé après une sélection réussie).
 * @returns {{ select: (ray: THREE.Ray) => Object | null,
 *   reserve: (tableOrId: Object | string) => { ok: boolean, reason?: string },
 *   findTable: (id: string | number) => Object | null }} Service de sélection.
 */
export function createSelectionService({ tablesGroup, statusPanel, onSelect = null }) {
  /**
   * Retrouve les données `userData` d'une table à partir de son identifiant.
   * @param {string|number} id Identifiant de table (`T01`, …).
   * @returns {Object|null} Données de la table, ou `null` si absente.
   */
  function findTable(id) {
    if (id === null || id === undefined) return null;
    const target = String(id);
    const children = tablesGroup && Array.isArray(tablesGroup.children) ? tablesGroup.children : [];
    for (const child of children) {
      const data = child && child.userData;
      if (data && data.isTable && String(data.id) === target) return data;
    }
    return null;
  }

  /**
   * Lance un rayon et remonte la hiérarchie jusqu'au groupe porteur de `userData.isTable`.
   * @param {THREE.Ray} ray Rayon déjà positionné dans l'espace monde.
   * @returns {Object|null} Données de la table visée, ou `null` si aucune table n'est touchée.
   */
  function pickTable(ray) {
    const raycaster = new THREE.Raycaster();
    raycaster.ray = ray;

    // Récursif : le rayon touche le plateau, le pied ou une chaise, jamais le Group de la table.
    const intersects = raycaster.intersectObjects(tablesGroup.children, true);
    if (intersects.length === 0) return null;

    let hit = intersects[0].object;
    while (hit.parent && !hit.userData.isTable) hit = hit.parent;
    return hit.userData && hit.userData.isTable ? hit.userData : null;
  }

  /**
   * Sélectionne la table visée : met à jour le panneau sans changer son statut.
   * @param {THREE.Ray} ray Rayon déjà positionné dans l'espace monde.
   * @returns {Object|null} Données de la table sélectionnée, ou `null` si aucune cible.
   */
  function select(ray) {
    const data = pickTable(ray);
    if (!data) {
      statusPanel.showNoTarget();
      return null;
    }

    statusPanel.showTable(data);
    if (typeof onSelect === 'function') onSelect(data);
    return data;
  }

  /**
   * Résout l'argument de `reserve` en données de table vivantes.
   * @param {Object|string} tableOrId Données `userData`, `Group` de table ou identifiant.
   * @returns {Object|null} Données de la table, ou `null` si introuvable.
   */
  function resolveTable(tableOrId) {
    if (typeof tableOrId === 'string') return findTable(tableOrId);
    if (!tableOrId || typeof tableOrId !== 'object') return null;
    if (tableOrId.userData && tableOrId.userData.isTable) return tableOrId.userData;
    if (tableOrId.isTable) return tableOrId;

    const live = findTable(tableOrId.id);
    if (live) return live;
    return typeof tableOrId.status === 'string' ? tableOrId : null;
  }

  /**
   * Applique la transition `available → reserved` et confirme sur le panneau.
   * Aucune mutation n'a lieu si la table est introuvable ou non disponible.
   * @param {Object|string} tableOrId Données `userData`, `Group` de table ou identifiant.
   * @returns {{ ok: boolean, reason?: string }} Résultat de l'opération.
   */
  function reserve(tableOrId) {
    const data = resolveTable(tableOrId);
    if (!data) return { ok: false, reason: NOT_FOUND_REASON };
    if (data.status !== TABLE_STATUS.AVAILABLE) return { ok: false, reason: NOT_AVAILABLE_REASON };

    data.status = TABLE_STATUS.RESERVED;
    if (data.marker && data.marker.material) {
      data.marker.material.color.set(STATUS_COLORS.reserved);
      data.marker.material.emissive.set(STATUS_COLORS.reserved);
    }
    statusPanel.showReserved(data);
    return { ok: true };
  }

  return { select, reserve, findTable };
}

/**
 * Crée le gestionnaire d'événement `selectstart` du contrôleur WebXR.
 * Le rayon est reconstruit depuis la pose du contrôleur puis délégué au service,
 * ce qui conserve la signature et le comportement attendus par les tests.
 * @param {{ tablesGroup: THREE.Group, statusPanel: Object,
 *   onSelect?: ((table: Object) => void) | null }} deps Dépendances de la sélection.
 * @returns {(event: THREE.Event) => void} Gestionnaire à brancher sur `selectstart`.
 */
export function createSelectionHandler({ tablesGroup, statusPanel, onSelect = null }) {
  const service = createSelectionService({ tablesGroup, statusPanel, onSelect });

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
