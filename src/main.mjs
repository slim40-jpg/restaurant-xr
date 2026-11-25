/**
 * @file    src/main.mjs
 * @brief   Point d'entrée : assemble les modules, branche les interactions et démarre le rendu.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-11
 * @role    Bootstrap uniquement — aucune construction 3D ni logique métier ici.
 */

import { STATUS_ELEMENT_ID } from './config/constants.mjs';
import { registerServiceWorker } from './core/pwa.mjs';
import { createXRRenderer } from './core/renderer.mjs';
import { addLighting, createScene } from './core/scene.mjs';
import { createOrbitControls, bindControlsToXR } from './interaction/controls.mjs';
import { createWalkMode } from './interaction/walk-mode.mjs';
import { createHighlighter } from './interaction/highlight.mjs';
import { enablePointerSelection } from './interaction/pointer.mjs';
import { createSelectionHandler, createSelectionService } from './interaction/selection.mjs';
import { createBackendBadge } from './ui/backend-badge.mjs';
import { createPreferencesPanel } from './ui/preferences.mjs';
import { createStatusFanout } from './ui/status-fanout.mjs';
import { createStatusPanel } from './ui/status-panel.mjs';
import { createWorldStatusPanel } from './ui/status-panel-3d.mjs';
import { createTableCard } from './ui/table-card.mjs';
import { createViewToggle } from './ui/view-toggle.mjs';
import { LEVELS } from './world/layout.mjs';
import { buildRestaurant } from './world/restaurant.mjs';
import { WALK_COLLIDERS, surfaceHeightAt } from './world/walkable.mjs';
import { setupAR } from './xr/ar.mjs';
import { setupControllers } from './xr/controllers.mjs';

// === AJOUT BACKEND : imports pour la persistance et le temps réel ===
import { getCurrentUser } from './interaction/auth.mjs';
import { getReservedTableIds, reserve as reserveInSupabase } from './interaction/reserve.mjs';
import { subscribeToReservations } from './core/realtime.mjs';
// === FIN AJOUT BACKEND ===

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

// Cliquer une table ne réserve plus : cela ouvre sa fiche (caractéristiques + menu).
// La réservation passe par le bouton explicite de la fiche, pour éviter les gestes accidentels.
const tableCard = createTableCard({
  container: document.getElementById('table-card') ?? document.body,
  onReserve: (table) => {
    // === AJOUT BACKEND : on écrit d'abord en base, puis on rafraîchit l'UI ===
    void (async () => {
      const result = await reserveInSupabase(table.id);
      if (result.success) {
        preferences.refresh();
        tableCard.open(table);
      }
    })();
    // === FIN AJOUT BACKEND ===
  },
  onClose: () => walkMode.resume(),
});

const selection = createSelectionService({
  tablesGroup,
  statusPanel,
  onSelect: (table) => {
    walkMode.suspend();
    tableCard.open(table);
  },
});
const highlighter = createHighlighter({ tablesGroup });

const preferences = createPreferencesPanel({
  container: document.getElementById('panel') ?? document.body,
  getTables: () => tablesGroup.children.map((child) => child.userData),
  onHighlight: (ids) => highlighter.highlight(ids),
});

const handleXRSelect = createSelectionHandler({
  tablesGroup,
  statusPanel,
  onSelect: (table) => tableCard.open(table),
});
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

const walkMode = createWalkMode({
  camera,
  domElement: container,
  controls,
  colliders: WALK_COLLIDERS,
  surfaceHeightAt,
  levels: LEVELS,
  start: { x: 4.6, z: 12.6 },
});
const viewToggle = createViewToggle({
  container: document.getElementById('view-toggle') ?? document.body,
  initial: 'orbit',
  // En session immersive, la pose du casque pilote la caméra : la marche doit céder.
  onChange: (mode) =>
    viewToggle.setMode(walkMode.setMode(xrRenderer.getRenderer().xr.isPresenting ? 'orbit' : mode)),
});
xrRenderer
  .getRenderer()
  .xr.addEventListener('sessionstart', () => viewToggle.setMode(walkMode.setMode('orbit')));

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

// === AJOUT BACKEND : chargement initial de l'état + abonnement Realtime ===
// On attend que l'utilisateur soit connu, puis on lit les tables déjà réservées.
// Aucune modification n'est faite aux modules existants : on réutilise
// `preferences.refresh()` pour que l'UI relise `getTables()` (qui, lui, n'a pas changé).
void (async () => {
  const user = await getCurrentUser();
  if (!user) {
    // Pas connecté : on laisse l'application tourner en lecture seule.
    return;
  }

  const reservedIds = await getReservedTableIds();
  // On stocke les IDs réservés sur les userData des tables pour que la sélection
  // et le panneau de préférences les voient comme indisponibles.
  for (const child of tablesGroup.children) {
    if (child.userData && reservedIds.has(child.userData.id)) {
      child.userData.status = 'reserved';
    }
  }
  preferences.refresh();

  // Écoute des changements en temps réel (insertions et mises à jour).
  subscribeToReservations(({ eventType, tableId, status }) => {
    const child = tablesGroup.children.find((c) => c.userData?.id === tableId);
    if (!child) return;

    if (eventType === 'INSERT' && status === 'confirmed') {
      child.userData.status = 'reserved';
    } else if (eventType === 'UPDATE' && status === 'cancelled') {
      child.userData.status = 'available';
    } else if (eventType === 'DELETE') {
      child.userData.status = 'available';
    }

    // Les mêmes points d'entrée que l'application existante.
    preferences.refresh();
    highlighter.highlight([]);
  });
})();
// === FIN AJOUT BACKEND ===

// ========== 4. BOUCLE DE RENDU ET REDIMENSIONNEMENT ==========
let lastTime = 0;

xrRenderer.setAnimationLoop((time = 0, frame = null) => {
  const renderer = xrRenderer.getRenderer();
  const delta = lastTime === 0 ? 0 : (time - lastTime) / 1000;
  lastTime = time;

  // Un seul des deux pilote la caméra : OrbitControls réécrirait la position
  // calculée par le marcheur à chaque appel de `update()`.
  if (walkMode.isEnabled()) {
    walkMode.update(delta);
  } else {
    controls.update();
  }

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