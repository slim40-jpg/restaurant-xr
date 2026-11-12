/**
 * @file    src/xr/controllers.js
 * @brief   Bouton VR, contrôleurs WebXR, modèle de manette et rayon de visée.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Prépare les entrées WebXR ; la logique de sélection est branchée par l'appelant.
 */

import * as THREE from 'three/webgpu';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

/**
 * Fonctionnalités demandées à l'ouverture de session.
 * `webgpu` permet au renderer WebGPU de composer directement dans le casque quand
 * le navigateur expose `XRGPUBinding` ; sinon `WebGLXRFallback` bascule sur WebGL2.
 */
const SESSION_FEATURES = ['local-floor', 'bounded-floor', 'webgpu'];

/**
 * Ajoute le bouton d'entrée en VR, un contrôleur avec son modèle 3D et une ligne de visée.
 * Le bouton AR est créé par `src/xr/ar.js`, qui porte tout le cycle de vie d'`immersive-ar` :
 * le dupliquer ici produirait deux boutons et deux sessions concurrentes.
 * @param {THREE.WebGPURenderer} renderer Renderer dont la session XR est utilisée.
 * @param {THREE.Scene} scene Scène dans laquelle les contrôleurs sont ajoutés.
 * @returns {{
 *   controller: THREE.XRController,
 *   grip: THREE.XRControllerGrip,
 *   button: HTMLElement
 * }} Le contrôleur principal, son grip et le bouton VR injecté dans le document.
 */
export function setupControllers(renderer, scene) {
  const button = VRButton.createButton(renderer, { optionalFeatures: SESSION_FEATURES });
  document.body.appendChild(button);

  const controllerModelFactory = new XRControllerModelFactory();

  // Contrôleur principal (droit)
  const controller = renderer.xr.getController(0);
  scene.add(controller);

  // Modèle 3D de la manette
  const grip = renderer.xr.getControllerGrip(0);
  grip.add(controllerModelFactory.createControllerModel(grip));
  scene.add(grip);

  // Ligne de visée
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -5),
  ]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x00ffff }));
  controller.add(line);

  return { controller, grip, button };
}
