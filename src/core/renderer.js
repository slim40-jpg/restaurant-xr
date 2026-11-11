/**
 * @file    src/core/renderer.js
 * @brief   Renderer WebGPU avec repli WebGL2 automatique, y compris pendant une session XR.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Fournit l'unique renderer, garantit le repli XR et maintient le canvas à la taille du conteneur.
 */

import * as THREE from 'three/webgpu';
import { setupWebGLXRFallback } from 'three/addons/webxr/WebGLXRFallback.js';

/**
 * Type d'ombre retenu. `PCFSoftShadowMap` a été supprimé de Three.js en r185 :
 * le seul type « doux » encore supporté par les deux backends est `PCFShadowMap`.
 */
const SHADOW_MAP_TYPE = THREE.PCFShadowMap;

/**
 * Crée le renderer de l'application et installe le repli WebGL2 pour la XR.
 *
 * WebXR sur WebGPU est encore expérimental en 2026 : la session exige la
 * fonctionnalité `webgpu` et l'interface `XRGPUBinding`, et le multiview n'y est
 * pas supporté. `setupWebGLXRFallback` remplace donc le renderer par un
 * `WebGPURenderer({ forceWebGL: true })` au moment où la session est ouverte,
 * sans quoi le casque afficherait un écran noir.
 *
 * La taille du canvas est pilotée par le conteneur et non par `window` : si le
 * navigateur rapporte des dimensions différentes de celles du conteneur, un
 * dimensionnement initial unique laisserait des bandes noires autour de la scène.
 *
 * @param {{ container?: HTMLElement }} [options] Conteneur recevant le canvas.
 * @returns {{
 *   getRenderer: () => THREE.WebGPURenderer,
 *   setAnimationLoop: (cb: Function) => void,
 *   resize: () => { width: number, height: number }
 * }} Accès au renderer courant, à la boucle de rendu et au recalcul de taille.
 */
export function createXRRenderer({ container = document.body } = {}) {
  /** @type {THREE.WebGPURenderer|null} */
  let current = null;
  /** @type {Function|null} */
  let loopCallback = null;
  const size = { width: 1, height: 1 };

  /** Relit la taille réelle du conteneur (repli sur la fenêtre s'il n'est pas mesuré). */
  function measure() {
    size.width = container.clientWidth || window.innerWidth || 1;
    size.height = container.clientHeight || window.innerHeight || 1;
  }

  /**
   * Construit un renderer WebGPU (ou son backend WebGL2 si `forceWebGL` est vrai).
   * @param {boolean} forceWebGL Force le backend WebGL2 au lieu de WebGPU.
   * @returns {THREE.WebGPURenderer} Renderer configuré, non monté dans le DOM.
   */
  function buildRenderer(forceWebGL) {
    const renderer = new THREE.WebGPURenderer({ antialias: true, multiview: true, forceWebGL });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // updateStyle = false : la taille CSS est laissée à la feuille de style (100 %).
    renderer.setSize(size.width, size.height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = SHADOW_MAP_TYPE;

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    // Doit précéder l'initialisation : l'adaptateur GPU est demandé avec `xrCompatible`.
    renderer.xr.enabled = true;

    return renderer;
  }

  measure();
  current = buildRenderer(false);
  container.appendChild(current.domElement);

  setupWebGLXRFallback(
    current,
    () => buildRenderer(true),
    (next, previous) => {
      // Le canvas est remplacé dans le conteneur : les écouteurs attachés au
      // conteneur (orbite, sélection souris) survivent au changement de backend.
      if (previous.domElement.parentNode) {
        previous.domElement.parentNode.replaceChild(next.domElement, previous.domElement);
      } else {
        container.appendChild(next.domElement);
      }

      if (typeof previous.dispose === 'function') {
        previous.dispose();
      }

      current = next;

      if (loopCallback) {
        next.setAnimationLoop(loopCallback);
      }
    }
  );

  return {
    getRenderer: () => current,
    setAnimationLoop: (cb) => {
      loopCallback = cb;
      current.setAnimationLoop(cb);
    },
    resize: () => {
      measure();
      current.setSize(size.width, size.height, false);
      return { width: size.width, height: size.height };
    },
  };
}
