/**
 * @file    src/main.mjs
 * @brief   Point d'entrée : assemble les modules, branche les interactions et démarre le rendu.
 * @author  Wassim Hajji
 * @date    2026-11-25
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
import { createLogoutButton } from './ui/logout.mjs';

// === AJOUT BACKEND : Imports ===
import { getCurrentUser } from './interaction/auth.mjs';
import { reserve as reserveInSupabase } from './interaction/reserve.mjs';
import { subscribeToReservations } from './core/realtime.mjs';
import { fetchTableStates } from './interaction/table-status.mjs';
import { applyTableStateColors } from './world/table-colors.mjs';
import { renderAuthPanel } from './ui/auth-panel.mjs';
// ===============================

const container = document.getElementById('app') ?? document.body;

// ========== 1. RENDU ET SCÈNE ==========
const xrRenderer = createXRRenderer({ container });
const { scene, camera } = createScene();
addLighting(scene);
camera.position.set(0, 1.95, 6.2);

// ========== 2. RESTAURANT ET PANNEAUX ==========
const { restaurant, tablesGroup } = buildRestaurant();
scene.add(restaurant);

const worldPanel = createWorldStatusPanel({ position: [0, 2.55, -2.6], size: [3, 0.8] });
worldPanel.object3D.visible = false;
scene.add(worldPanel.object3D);

const statusPanel = createStatusFanout([
  createStatusPanel(document.getElementById(STATUS_ELEMENT_ID) ?? document.createElement('div')),
  worldPanel,
]);

// ========== 3. ENTRÉES ==========
const { controller } = setupControllers(xrRenderer.getRenderer(), scene);

const tableCard = createTableCard({
  container: document.getElementById('table-card') ?? document.body,
  onReserve: (table) => {
    // === AJOUT BACKEND : Réservation Supabase ===
    void (async () => {
      const result = await reserveInSupabase(table.id);
      if (result.success) {
        preferences.refresh();
        tableCard.open(table);
      } else {
        alert(result.error); // Simple feedback for now
      }
    })();
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
  onChange: (mode) =>
    viewToggle.setMode(walkMode.setMode(xrRenderer.getRenderer().xr.isPresenting ? 'orbit' : mode)),
});
xrRenderer.getRenderer().xr.addEventListener('sessionstart', () => viewToggle.setMode(walkMode.setMode('orbit')));

const badge = createBackendBadge();
const ar = setupAR({ renderer: xrRenderer.getRenderer(), scene, restaurant, worldPanel });

void xrRenderer.init().then((status) => {
  badge.update(xrRenderer.getRenderer(), status.reason);
});

registerServiceWorker();

// ========== 4. BACKEND & AUTHENTIFICATION ==========
async function loadStatesAndSubscribe() {
  const states = await fetchTableStates();
  applyTableStateColors(tablesGroup, states);

  subscribeToReservations(({ eventType, tableId, status }) => {
    const child = tablesGroup.children.find((c) => c.userData?.id === tableId);
    if (!child) return;

    if (eventType === 'DELETE' || status === 'cancelled') {
      child.userData.state = 'free';
    } else if (status === 'occupied') {
      child.userData.state = 'occupied';
    } else if (status === 'confirmed') {
      child.userData.state = 'reserved';
    }

    applyTableStateColors(tablesGroup, null);
    preferences.refresh();
  });
}

async function initBackend() {
  const user = await getCurrentUser();
  const authRoot = document.getElementById('auth-root');
  
  if (!user) {
    authRoot.style.display = 'flex';
    renderAuthPanel(authRoot, async () => {
      authRoot.style.display = 'none';
      createLogoutButton(document.body);
      await loadStatesAndSubscribe();
    });
  } else {
    authRoot.style.display = 'none';
    createLogoutButton(document.body);
    await loadStatesAndSubscribe();
  }
}

void initBackend();

let lastTime = 0;
xrRenderer.setAnimationLoop((time = 0, frame = null) => {
  const renderer = xrRenderer.getRenderer();
  const delta = lastTime === 0 ? 0 : (time - lastTime) / 1000;
  lastTime = time;

  if (walkMode.isEnabled()) walkMode.update(delta);
  else controls.update();

  worldPanel.update(camera);
  worldPanel.object3D.visible = renderer.xr.isPresenting && renderer.xr.getSession()?.mode !== 'immersive-ar';
  ar.update(frame);
  highlighter.update(delta);
  badge.update(renderer);
  renderer.render(scene, camera);
});

function applyViewportSize() {
  const { width, height } = xrRenderer.resize();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', applyViewportSize);
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(applyViewportSize).observe(container);
}
applyViewportSize();