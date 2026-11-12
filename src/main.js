/**
 * @file    src/main.js
 * @brief   Point d'entrée : assemble les modules, branche les interactions et démarre le rendu.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-11
 * @role    Bootstrap uniquement — aucune construction 3D ni logique métier ici.
 */

import { STATUS_ELEMENT_ID } from './config/constants.js';
import { registerServiceWorker } from './core/pwa.js';
import { createXRRenderer } from './core/renderer.js';
import { addLighting, createScene } from './core/scene.js';
import { bindControlsToXR, createOrbitControls } from './interaction/controls.js';
import { createHighlighter } from './interaction/highlight.js';
import { enablePointerSelection } from './interaction/pointer.js';
import { createSelectionHandler, createSelectionService } from './interaction/selection.js';
import { createBackendBadge } from './ui/backend-badge.js';
import { createPreferencesPanel } from './ui/preferences.js';
import { createStatusFanout } from './ui/status-fanout.js';
import { createStatusPanel } from './ui/status-panel.js';
import { createWorldStatusPanel } from './ui/status-panel-3d.js';
import { buildRestaurant } from './world/restaurant.js';
import { setupAR } from './xr/ar.js';
import { setupControllers } from './xr/controllers.js';

// Le canvas est monté dans ce conteneur stable : lors du basculement de backend
// pour la XR, seul le canvas est remplacé et les écouteurs survivent.
const container = document.getElementById('app') ?? document.body;

// ========== 1. RENDU ET SCÈNE ==========
const xrRenderer = createXRRenderer({ container });
const { scene, camera } = createScene();
addLighting(scene);

// Point de vue desktop : hauteur de salle, presque à hauteur d'œil, pour éviter
// qu'un plafond nu ou un sol vide n'occupe la moitié de l'image.
// En session immersive, la pose du casque remplace cette position.
camera.position.set(0, 1.95, 6.2);

// ========== 2. RESTAURANT ET PANNEAUX DE STATUT ==========
const { restaurant, tablesGroup } = buildRestaurant();
scene.add(restaurant);

// Panneau flottant réservé à la VR : côté écran, le panneau DOM du haut fait déjà
// le travail et afficher les deux dupliquerait le message. En session immersive,
// c'est le seul support lisible, car le DOM est invisible dans le casque.
const worldPanel = createWorldStatusPanel({ position: [0, 2.55, -2.6], size: [3, 0.8] });
worldPanel.object3D.visible = false;
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
const highlighter = createHighlighter({ tablesGroup });

// Le panneau de préférences doit refléter l'état courant après chaque réservation :
// sans ce rafraîchissement, une table réservée resterait proposée.
const preferences = createPreferencesPanel({
  container: document.getElementById('panel') ?? document.body,
  getTables: () => tablesGroup.children.map((child) => child.userData),
  onHighlight: (ids) => highlighter.highlight(ids),
});

const handleXRSelect = createSelectionHandler({ tablesGroup, statusPanel });
controller.addEventListener('selectstart', (event) => {
  handleXRSelect(event);
  preferences.refresh();
});

const controls = createOrbitControls(camera, container);
bindControlsToXR(xrRenderer.getRenderer(), controls);
enablePointerSelection({
  domElement: container,
  camera,
  select: (ray) => {
    selection.select(ray);
    preferences.refresh();
  },
});

const badge = createBackendBadge();

// Le mode AR est indépendant de la session VR : même page, deux boutons, deux cycles de vie.
const ar = setupAR({
  renderer: xrRenderer.getRenderer(),
  scene,
  restaurant,
  worldPanel,
});

// Le verdict n'est connu qu'après l'initialisation du backend : c'est lui qui décide
// si l'écran de blocage « WebGPU requis » doit s'afficher (géré par le renderer).
void xrRenderer.init().then((status) => {
  badge.update(xrRenderer.getRenderer(), status.reason);
});

// Enregistrement du service worker (ignoré hors contexte sécurisé).
registerServiceWorker();

// ========== 4. BOUCLE DE RENDU ET REDIMENSIONNEMENT ==========
let lastTime = 0;

xrRenderer.setAnimationLoop((time = 0, frame = null) => {
  const renderer = xrRenderer.getRenderer();
  const delta = lastTime === 0 ? 0 : (time - lastTime) / 1000;
  lastTime = time;

  controls.update();
  worldPanel.update(camera);
  worldPanel.object3D.visible = renderer.xr.isPresenting && renderer.xr.getSession()?.mode !== 'immersive-ar';
  ar.update(frame);
  highlighter.update(delta);
  badge.update(renderer);
  renderer.render(scene, camera);
});

/**
 * Aligne la caméra et le buffer de rendu sur la taille réelle du conteneur.
 * @returns {void}
 */
function applyViewportSize() {
  const { width, height } = xrRenderer.resize();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', applyViewportSize);

// Un simple écouteur `resize` ne suffit pas : l'ouverture des outils de
// développement ou un changement de mise en page modifie le conteneur sans
// événement de fenêtre, et laisserait des bandes noires autour du canvas.
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(applyViewportSize).observe(container);
}

applyViewportSize();
