/**
 * @file    src/core/renderer.js
 * @brief   Renderer WebGPU exclusif : le backend WebGL2 n'est plus une option de secours.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Crée l'unique renderer, vérifie le backend après initialisation et bloque l'application sinon.
 */

import * as THREE from 'three/webgpu';
import { showWebGPUUnavailable } from '../ui/webgpu-gate.js';

/**
 * Type d'ombre retenu. `PCFSoftShadowMap` a été supprimé de Three.js en r185 :
 * `PCFShadowMap` est le seul type « doux » encore supporté par le backend WebGPU.
 */
const SHADOW_MAP_TYPE = THREE.PCFShadowMap;

/**
 * Traduit l'état du backend en cause d'échec.
 *
 * Three.js bascule seul sur son backend WebGL2 quand aucun adaptateur GPU n'est
 * accordé. Ce cas est détecté pour être signalé à l'utilisateur : il n'est jamais
 * utilisé pour rendre la scène.
 *
 * @param {object|null|undefined} backend Backend exposé par le renderer après `init()`.
 * @returns {'no-adapter'|'unsupported-backend'|null} Cause d'échec, `null` si WebGPU est actif.
 */
function describeBackendFailure(backend) {
  if (!backend) {
    return 'unsupported-backend';
  }

  // Backend WebGL2 obtenu = repli interne de Three.js, donc aucun adaptateur WebGPU.
  if (backend.isWebGLBackend === true) {
    return 'no-adapter';
  }

  return backend.isWebGPUBackend === true ? null : 'unsupported-backend';
}

/**
 * Crée le renderer WebGPU de l'application.
 *
 * L'initialisation est lancée immédiatement : le bootstrap monte la scène de façon
 * synchrone et n'attend pas `init()`. Le renderer est donc disponible dès sa
 * construction, mais aucun rendu n'a lieu tant que le backend WebGPU n'est pas
 * confirmé. En cas d'échec, le canvas est retiré et un écran de blocage explicite
 * remplace l'écran noir silencieux.
 *
 * @param {{ container?: HTMLElement }} [options] Conteneur recevant le canvas.
 * @returns {{
 *   getRenderer: () => THREE.WebGPURenderer,
 *   setAnimationLoop: (cb: Function|null) => void,
 *   resize: () => { width: number, height: number },
 *   init: () => Promise<{ supported: boolean, reason: string|null }>
 * }} Accès au renderer, à la boucle de rendu, au redimensionnement et au verdict d'initialisation.
 */
export function createXRRenderer({ container = document.body } = {}) {
  const size = { width: 1, height: 1 };
  let supported = false;
  let reason = null;
  /** @type {Promise<{ supported: boolean, reason: string|null }>|null} */
  let initPromise = null;
  /** @type {Function|null} */
  let loopCallback = null;

  const renderer = new THREE.WebGPURenderer({ antialias: true, multiview: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = SHADOW_MAP_TYPE;
  // Doit précéder l'initialisation : l'adaptateur GPU est demandé avec `xrCompatible`.
  renderer.xr.enabled = true;

  const canvas = renderer.domElement;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';

  /** Relit la taille réelle du conteneur (repli sur la fenêtre s'il n'est pas mesuré). */
  function measure() {
    size.width = container.clientWidth || window.innerWidth || 1;
    size.height = container.clientHeight || window.innerHeight || 1;
  }

  measure();
  // updateStyle = false : la taille CSS est laissée à la feuille de style (100 %).
  renderer.setSize(size.width, size.height, false);
  container.appendChild(canvas);

  /**
   * Enregistre l'échec, neutralise le rendu et affiche l'écran de blocage.
   * @param {'no-navigator-gpu'|'no-adapter'|'unsupported-backend'} cause Cause retenue.
   * @returns {{ supported: boolean, reason: string }} Verdict négatif, jamais levé en exception.
   */
  function block(cause) {
    supported = false;
    reason = cause;

    // Le canvas est retiré pour qu'aucun backend ne puisse afficher quoi que ce soit.
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    showWebGPUUnavailable({ reason: cause });

    return { supported: false, reason: cause };
  }

  /**
   * Initialise le backend et vérifie qu'il s'agit bien de WebGPU.
   * @returns {Promise<{ supported: boolean, reason: string|null }>} Verdict d'initialisation.
   */
  async function runInit() {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      return block('no-navigator-gpu');
    }

    try {
      await renderer.init();
    } catch {
      // Aucun backend exploitable : on ne tente aucun autre chemin de rendu.
      return block('unsupported-backend');
    }

    const cause = describeBackendFailure(renderer.backend);

    if (cause !== null) {
      return block(cause);
    }

    supported = true;
    renderer.setSize(size.width, size.height, false);

    // La boucle a pu être demandée avant la fin de l'initialisation : elle démarre ici.
    if (loopCallback) {
      renderer.setAnimationLoop(loopCallback);
    }

    return { supported: true, reason: null };
  }

  /**
   * Initialise le renderer une seule fois, quel que soit le nombre d'appels.
   * @returns {Promise<{ supported: boolean, reason: string|null }>} Verdict d'initialisation.
   */
  function init() {
    if (initPromise === null) {
      initPromise = runInit();
    }

    return initPromise;
  }

  // Le point d'entrée n'attend pas l'initialisation : elle est lancée ici pour que
  // l'application reste fonctionnelle sans modifier son bootstrap.
  void init();

  return {
    getRenderer: () => renderer,
    setAnimationLoop: (cb) => {
      loopCallback = cb;

      // Aucune frame n'est planifiée tant que WebGPU n'est pas confirmé.
      if (supported) {
        renderer.setAnimationLoop(cb);
      }
    },
    resize: () => {
      measure();

      if (reason === null) {
        renderer.setSize(size.width, size.height, false);
      }

      return { width: size.width, height: size.height };
    },
    init,
  };
}
