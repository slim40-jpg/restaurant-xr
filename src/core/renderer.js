/**
 * @file    src/core/renderer.js
 * @brief   Renderer WebGPU avec repli WebGL2 automatique, y compris pendant une session XR.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Fournit l'unique renderer de l'application et garantit qu'une session immersive
 *          ne reste jamais sur un backend incompatible.
 */

import * as THREE from 'three/webgpu';
import { setupWebGLXRFallback } from 'three/addons/webxr/WebGLXRFallback.js';

/**
 * Type d'ombre retenu. `PCFSoftShadowMap` a été supprimé de Three.js en r185 :
 * le seul type « doux » encore supporté par les deux backends est `PCFShadowMap`.
 */
const SHADOW_MAP_TYPE = THREE.PCFShadowMap;

/**
 * Construit un renderer WebGPU (ou son backend WebGL2 si `forceWebGL` est vrai).
 * @param {boolean} forceWebGL Force le backend WebGL2 au lieu de WebGPU.
 * @returns {THREE.WebGPURenderer} Renderer configuré, non monté dans le DOM.
 */
function buildRenderer(forceWebGL) {
  const renderer = new THREE.WebGPURenderer({ antialias: true, multiview: true, forceWebGL });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = SHADOW_MAP_TYPE;

  // Doit précéder l'initialisation : l'adaptateur GPU est demandé avec `xrCompatible`.
  renderer.xr.enabled = true;

  return renderer;
}

/**
 * Crée le renderer de l'application et installe le repli WebGL2 pour la XR.
 *
 * WebXR sur WebGPU est encore expérimental en 2026 : la session exige la
 * fonctionnalité `webgpu` et l'interface `XRGPUBinding`, et le multiview n'y est
 * pas supporté. `setupWebGLXRFallback` remplace donc le renderer par un
 * `WebGPURenderer({ forceWebGL: true })` au moment où la session est ouverte,
 * sans quoi le casque afficherait un écran noir.
 *
 * @param {{ container?: HTMLElement }} [options] Conteneur recevant le canvas.
 * @returns {{ getRenderer: () => THREE.WebGPURenderer, setAnimationLoop: (cb: Function) => void }}
 *   Accès au renderer courant et enregistrement de la boucle de rendu.
 */
export function createXRRenderer({ container = document.body } = {}) {
  /** @type {THREE.WebGPURenderer|null} */
  let current = null;
  /** @type {Function|null} */
  let loopCallback = null;

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
  };
}
