/**
 * @file    src/xr/controllers.js
 * @brief   Mise en place du bouton VR, des contrôleurs WebXR et de leur ligne de visée.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-10
 * @role    Prépare les entrées WebXR ; la logique de sélection est branchée par l'appelant.
 */

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

/**
 * Ajoute le bouton d'entrée en VR, un contrôleur avec son modèle 3D et une ligne de visée cyan.
 * @param {THREE.WebGLRenderer} renderer Renderer dont la session XR est utilisée.
 * @param {THREE.Scene} scene Scène dans laquelle les contrôleurs sont ajoutés.
 * @returns {{ controller: THREE.XRController, grip: THREE.XRControllerGrip }} Le contrôleur principal
 *   et son grip.
 */
export function setupControllers(renderer, scene) {
  document.body.appendChild(VRButton.createButton(renderer));

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

  return { controller, grip };
}
