/**
 * @file    src/main.js
 * @brief   Point d'entrée : assemble les modules, branche les interactions et démarre le rendu.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-11
 * @role    Bootstrap uniquement — aucune construction 3D ni logique métier ici.
 */

import { STATUS_ELEMENT_ID } from './config/constants.js';
import { createXRRenderer } from './core/renderer.js';
import { addLighting, createScene } from './core/scene.js';
import { bindControlsToXR, createOrbitControls } from './interaction/controls.js';
import { enablePointerSelection } from './interaction/pointer.js';
import { createSelectionHandler, createSelectionService } from './interaction/selection.js';
import { createBackendBadge } from './ui/backend-badge.js';
import { createStatusFanout } from './ui/status-fanout.js';
import { createStatusPanel } from './ui/status-panel.js';
import { createWorldStatusPanel } from './ui/status-panel-3d.js';
import { buildRestaurant } from './world/restaurant.js';
import { setupControllers } from './xr/controllers.js';

// Le canvas est monté dans ce conteneur stable : lors du basculement de backend
// pour la XR, seul le canvas est remplacé et les écouteurs survivent.
const container = document.getElementById('app') ?? document.body;

// ========== 1. RENDU ET SCÈNE ==========
const xrRenderer = createXRRenderer({ container });
const { scene, camera } = createScene();
addLighting(scene);

// Point de vue desktop : recul et léger surplomb pour cadrer les six tables d'emblée.
// En session immersive, la pose du casque remplace cette position.
camera.position.set(0, 2.6, 4.4);

// ========== 2. RESTAURANT ET PANNEAUX DE STATUT ==========
const { restaurant, tablesGroup } = buildRestaurant();
scene.add(restaurant);

const worldPanel = createWorldStatusPanel();
scene.add(worldPanel.object3D);

// Le même état est publié sur deux supports : le DOM (desktop) et un panneau
// 3D ancré dans la salle (lisible dans le casque, où le DOM est invisible).
const statusPanel = createStatusFanout([
  createStatusPanel(document.getElementById(STATUS_ELEMENT_ID) ?? document.createElement('div')),
  worldPanel,
]);

// ========== 3. ENTRÉES : MANETTE, SOURIS, ORBITE ==========
const { controller } = setupControllers(xrRenderer.getRenderer(), scene);
const selection = createSelectionService({ tablesGroup, statusPanel });
controller.addEventListener('selectstart', createSelectionHandler({ tablesGroup, statusPanel }));

const controls = createOrbitControls(camera, container);
bindControlsToXR(xrRenderer.getRenderer(), controls);
enablePointerSelection({ domElement: container, camera, select: selection.select });

const badge = createBackendBadge();

// ========== 4. BOUCLE DE RENDU ET REDIMENSIONNEMENT ==========
xrRenderer.setAnimationLoop(() => {
  const renderer = xrRenderer.getRenderer();

  controls.update();
  worldPanel.update(camera);
  badge.update(renderer);
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  xrRenderer.getRenderer().setSize(window.innerWidth, window.innerHeight);
});
