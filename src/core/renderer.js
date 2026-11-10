/**
 * @file    src/core/renderer.js
 * @brief   Création et configuration du moteur de rendu WebGL.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-10
 * @role    Fournit l'unique renderer de l'application, activé pour la WebXR.
 */

import * as THREE from 'three';

/**
 * Crée le renderer WebGL, active les ombres douces et la WebXR, puis monte son canvas.
 * @returns {THREE.WebGLRenderer} Le renderer prêt à être utilisé par la boucle de rendu.
 */
export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Activer les ombres
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  return renderer;
}
