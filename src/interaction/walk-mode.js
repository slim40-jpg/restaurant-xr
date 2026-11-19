/**
 * @file    src/interaction/walk-mode.js
 * @brief   Mode « marcher » : caméra à hauteur d'yeux, sol atteignable et arbitrage avec l'orbite.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-17
 * @role    Isole le câblage de la marche pour que le bootstrap reste du câblage pur.
 */

import { createFirstPerson } from './first-person.js';

/** Altitude au-delà de laquelle on considère le marcheur à l'étage. */
const MEZZANINE_THRESHOLD = 1.4;

/** Marche montante tolérée entre deux images (escalier, seuils). */
const STEP_UP = 0.65;

/**
 * Crée le mode marche et l'arbitrage avec les contrôles orbitaux.
 *
 * `surfaceHeightAt(x, z)` renvoie la surface la plus haute : sans filtre, la dalle de
 * mezzanine (3,25 m) serait retenue comme sol alors qu'on marche au rez-de-chaussée,
 * sous elle. On ne retient donc une surface que si elle est atteignable depuis les
 * pieds, sinon on interroge le niveau courant.
 *
 * @param {object} deps Dépendances fournies par le bootstrap.
 * @param {THREE.PerspectiveCamera} deps.camera Caméra pilotée.
 * @param {HTMLElement} deps.domElement Élément qui capture clavier, souris et pointer lock.
 * @param {{ enabled: boolean, update: () => void }} deps.controls Contrôles orbitaux à céder.
 * @param {Array<object>} deps.colliders Volumes bloquants (`WALK_COLLIDERS`).
 * @param {(x: number, z: number, level?: string|null) => number|null} deps.surfaceHeightAt
 *   Hauteur praticable, sensible au niveau.
 * @param {{ GROUND: string, MEZZANINE: string }} deps.levels Niveaux de la scène.
 * @param {{ x: number, z: number }} [deps.start] Point d'apparition de la marche.
 * @param {number} [deps.eyeHeight=1.65] Hauteur des yeux au-dessus du sol.
 * @returns {{
 *   isEnabled: () => boolean,
 *   setMode: (mode: 'walk'|'orbit') => 'walk'|'orbit',
 *   update: (dt: number) => void,
 *   groundY: () => number,
 *   dispose: () => void
 * }} Commandes du mode marche.
 */
export function createWalkMode({
  camera,
  domElement,
  controls,
  colliders,
  surfaceHeightAt,
  levels,
  start = { x: 0, z: 5.4 },
  eyeHeight = 1.65,
}) {
  let ground = 0;

  /**
   * Surface retenue pour le marcheur, filtrée par ce qu'il peut atteindre.
   * @param {number} x Abscisse en mètres.
   * @param {number} z Ordonnée en mètres.
   * @returns {number|null} Altitude praticable, ou `null` hors zone.
   */
  function surfaceForWalker(x, z) {
    if (typeof surfaceHeightAt !== 'function') return null;

    const highest = surfaceHeightAt(x, z, null);
    if (highest === null) return null;
    if (highest - ground <= STEP_UP) return highest;

    const level = ground > MEZZANINE_THRESHOLD ? levels.MEZZANINE : levels.GROUND;
    return surfaceHeightAt(x, z, level);
  }

  const walk = createFirstPerson({
    camera,
    domElement,
    colliders,
    surfaceHeightAt: surfaceForWalker,
    start,
  });

  /**
   * Active ou désactive la marche et cède ou reprend les contrôles orbitaux.
   * @param {'walk'|'orbit'} mode Mode demandé.
   * @returns {'walk'|'orbit'} Mode réellement appliqué.
   */
  function setMode(mode) {
    if (mode === 'walk') {
      controls.enabled = false;
      walk.enable();
      return 'walk';
    }

    walk.disable();
    controls.enabled = true;
    return 'orbit';
  }

  /**
   * Libère la capture du pointeur pour laisser l'utilisateur cliquer dans une fiche.
   * @returns {void}
   */
  function releasePointer() {
    if (typeof document === 'undefined') return;
    if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
      document.exitPointerLock();
    }
  }

  return {
    isEnabled: () => walk.isEnabled(),
    releasePointer,
    setMode,
    /**
     * Avance d'une image et mémorise l'altitude des pieds.
     * @param {number} dt Temps écoulé en secondes.
     * @returns {void}
     */
    update: (dt) => {
      walk.update(dt);
      ground = Math.max(0, camera.position.y - eyeHeight);
    },
    groundY: () => ground,
    dispose: () => walk.dispose(),
  };
}
