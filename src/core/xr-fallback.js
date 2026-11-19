/**
 * @file    src/core/xr-fallback.js
 * @brief   Repli WebGL2 réservé aux sessions immersives, quand le casque ne compose pas en WebGPU.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-18
 * @role    Permet à l'AR et à la VR de s'ouvrir sur un appareil sans XRGPUBinding, sans
 *          changer le backend WebGPU utilisé à l'écran.
 */

import * as THREE from 'three/webgpu';
import { setupWebGLXRFallback } from 'three/addons/webxr/WebGLXRFallback.js';

/**
 * Installe le repli officiel de Three.js.
 *
 * Le renderer reste WebGPU tant qu'aucune session immersive n'est ouverte. Au moment de
 * `xr.setSession()`, si le backend est WebGPU et que le navigateur n'expose pas
 * `XRGPUBinding`, Three.js appelle `createFallback` et poursuit la session sur WebGL2.
 * Sans cela, la majorité des casques composerait un écran noir.
 *
 * @param {object} options Dépendances du bootstrap.
 * @param {THREE.WebGPURenderer} options.renderer Renderer principal.
 * @param {{ width: number, height: number }} options.size Taille de rendu à conserver.
 * @param {number} options.shadowType Type d'ombre à appliquer au nouveau renderer.
 * @param {(renderer: THREE.WebGPURenderer) => void} options.onSwap Appelé avec le nouveau renderer.
 * @returns {void}
 */
export function installXRFallback({ renderer, size, shadowType, onSwap }) {
  setupWebGLXRFallback(
    renderer,
    () => {
      const fallback = new THREE.WebGPURenderer({ antialias: true, multiview: true, forceWebGL: true });
      fallback.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      fallback.shadowMap.enabled = true;
      fallback.shadowMap.type = shadowType;
      fallback.xr.enabled = true;
      fallback.setSize(size.width, size.height, false);
      return fallback;
    },
    (next, previous) => {
      const parent = previous.domElement.parentNode;
      if (parent) parent.replaceChild(next.domElement, previous.domElement);

      const canvas = next.domElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';

      if (typeof previous.dispose === 'function') previous.dispose();

      onSwap(next);
    }
  );
}
