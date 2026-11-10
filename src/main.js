/**
 * @file    src/main.js
 * @brief   Point d'entrée de l'application : assemble les modules et démarre le rendu.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-10
 * @role    Bootstrap uniquement — aucune construction 3D ni logique métier ici.
 */

import { STATUS_ELEMENT_ID } from './config/constants.js';
import { createRenderer } from './core/renderer.js';
import { addLighting, createScene } from './core/scene.js';
import { createSelectionHandler } from './interaction/selection.js';
import { createStatusPanel } from './ui/status-panel.js';
import { buildRestaurant } from './world/restaurant.js';
import { setupControllers } from './xr/controllers.js';

// ========== 1. SCÈNE ==========
const renderer = createRenderer();
const { scene, camera } = createScene();
addLighting(scene);

// ========== 2. CONSTRUCTION DU RESTAURANT ==========
const { restaurant, tablesGroup } = buildRestaurant();
scene.add(restaurant);

// ========== 3. CONTRÔLES VR ET LOGIQUE DE SÉLECTION ==========
const { controller } = setupControllers(renderer, scene);
const statusElement = document.getElementById(STATUS_ELEMENT_ID);
const statusPanel = createStatusPanel(statusElement ?? document.createElement('div'));
controller.addEventListener('selectstart', createSelectionHandler({ tablesGroup, statusPanel }));

// ========== 4. BOUCLE DE RENDU ET REDIMENSIONNEMENT ==========
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
