/**
 * @file    src/interaction/pointer.js
 * @brief   Sélection à la souris : un clic se comporte comme la gâchette du contrôleur.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-11
 * @role    Convertit un clic écran en rayon monde et le transmet au service de sélection.
 */

import * as THREE from 'three';

/** Déplacement maximal toléré (en pixels) pour distinguer un clic d'un glisser d'orbite. */
const CLICK_MAX_DISTANCE_PX = 6;

/** Durée maximale tolérée (en millisecondes) entre l'appui et le relâchement. */
const CLICK_MAX_DURATION_MS = 400;

/**
 * Branche la sélection à la souris sur un élément DOM.
 * Filtrer les glissers est indispensable : OrbitControls consomme les mêmes événements,
 * et sans ce filtre chaque rotation de caméra déclencherait une réservation involontaire.
 * @param {{ domElement: HTMLElement, camera: THREE.Camera, select: (ray: THREE.Ray) => void }} deps
 *   Dépendances du pointeur : l'élément écouteur, la caméra utilisée pour le rayon et la
 *   fonction de sélection à invoquer.
 * @returns {() => void} Fonction `dispose()` qui retire les écouteurs.
 */
export function enablePointerSelection({ domElement, camera, select }) {
  const raycaster = new THREE.Raycaster();
  let press = null;

  /**
   * Mémorise le point et l'instant d'appui pour qualifier le geste au relâchement.
   * @param {PointerEvent} event Événement `pointerdown` du canvas.
   * @returns {void}
   */
  function handlePointerDown(event) {
    // Le bouton « Enter VR » est un overlay HTML : ne pas le traiter comme un clic scène.
    if (event.target && event.target.tagName === 'BUTTON') {
      return;
    }
    press = { x: event.clientX, y: event.clientY, time: event.timeStamp };
  }

  /**
   * Ne déclenche la sélection que si le geste est un clic court et quasi immobile.
   * @param {PointerEvent} event Événement `pointerup` du canvas.
   * @returns {void}
   */
  function handlePointerUp(event) {
    if (!press) {
      return;
    }
    if (event.target && event.target.tagName === 'BUTTON') {
      press = null;
      return;
    }

    const distance = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    const duration = event.timeStamp - press.time;
    press = null;

    if (distance > CLICK_MAX_DISTANCE_PX || duration > CLICK_MAX_DURATION_MS) {
      return;
    }

    // Conversion pixels → NDC via le rectangle réel du canvas (robuste au CSS et au DPR).
    const rect = domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera({ x, y }, camera);
    select(raycaster.ray);
  }

  domElement.addEventListener('pointerdown', handlePointerDown);
  domElement.addEventListener('pointerup', handlePointerUp);

  /**
   * Détache les écouteurs et oublie tout appui en cours.
   * @returns {void}
   */
  function dispose() {
    domElement.removeEventListener('pointerdown', handlePointerDown);
    domElement.removeEventListener('pointerup', handlePointerUp);
    press = null;
  }

  return dispose;
}
