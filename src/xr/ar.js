/**
 * @file    src/xr/ar.js
 * @brief   Mode réalité augmentée : visée d'une surface réelle et pose du restaurant en maquette.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Isole tout le cycle de vie d'`immersive-ar` sans toucher au mode VR ni au bootstrap.
 */

import { ARButton } from 'three/addons/webxr/ARButton.js';

import { createArHint } from './ar-hint.js';
import { createArReticle } from './ar-reticle.js';

/** Échelle de la maquette posée sur la surface réelle. */
const MODEL_SCALE = 0.12;

/** Texte d'aide affiché pendant la session AR. */
const HINT_TEXT = 'Visez le sol ou une table, puis touchez l’écran pour poser le restaurant.';

/** Options réellement lues par `ARButton.createButton` (r187). */
const SESSION_INIT = {
  requiredFeatures: ['hit-test'],
  optionalFeatures: ['dom-overlay', 'local-floor'],
  domOverlay: { root: document.body },
};

/**
 * Installe le mode réalité augmentée : bouton, réticule, placement et restauration de la scène.
 * L'appelant branche `update(frame)` dans sa boucle ; sans lui, le réticule ne suit pas la surface.
 *
 * @param {object} options Dépendances fournies par le bootstrap.
 * @param {THREE.WebGPURenderer} options.renderer Renderer dont la session XR est utilisée.
 * @param {THREE.Scene} options.scene Scène contenant le restaurant et le réticule.
 * @param {THREE.Group} options.restaurant Restaurant mis à l'échelle de la maquette puis posé.
 * @param {{ object3D: THREE.Object3D } | null} [options.worldPanel] Panneau 3D masqué pendant la session.
 * @returns {{
 *   button: HTMLElement, start: () => void, stop: () => void, dispose: () => void,
 *   isSupported: () => boolean, update: (frame: XRFrame|null) => void
 * }} Le bouton, les commandes de session, le nettoyage, la compatibilité et la mise à jour par frame.
 */
export function setupAR({ renderer, scene, restaurant, worldPanel = null }) {
  const reticle = createArReticle(scene);
  const hint = createArHint(HINT_TEXT);

  const button = ARButton.createButton(renderer, SESSION_INIT);
  // ARButton et VRButton partagent l'ancrage bas-centre : l'AR est remontée pour rester cliquable.
  button.style.bottom = '64px';
  document.body.appendChild(button);

  let session = null;
  let hitTestSource = null;
  let placed = false;
  let supported = false;
  let warned = false;
  let failed = false;
  let environment = null;
  let previousBackground = scene.background;
  let previousPanel = true;

  /** Signale un échec à l'utilisateur, et une seule fois dans la console. */
  function reportProblem(message, error) {
    failed = true;
    if (!warned) {
      warned = true;
      console.warn(`[AR] ${message}`, error);
    }
    hint.show(message);
  }

  /** Invalide la source de hit-test si elle existe encore. */
  function cancelHitTest() {
    try {
      hitTestSource?.cancel();
    } catch {
      // Déjà invalidée par la fin de session.
    }
    hitTestSource = null;
  }

  /** Restaure la scène, l'échelle du restaurant et les éléments masqués pendant la session. */
  function restoreScene() {
    scene.background = previousBackground;
    if (environment) environment.visible = true;
    if (worldPanel) worldPanel.object3D.visible = previousPanel;
    restaurant.scale.setScalar(1);
    restaurant.position.set(0, 0, 0);
    reticle.hide();
  }

  /** Pose la maquette à l'endroit visé par le réticule. */
  function handleSelect() {
    if (!reticle.mesh.visible) return;
    restaurant.position.copy(reticle.mesh.position);
    placed = true;
    reticle.hide();
  }

  /** Prépare la session AR : fond transparent, environnement masqué, maquette et hit-test. */
  async function beginSession() {
    session = renderer.xr.getSession();
    if (!session) return;

    placed = false;
    failed = false;
    previousBackground = scene.background;
    previousPanel = worldPanel ? worldPanel.object3D.visible : true;
    scene.background = null;
    environment = restaurant.children.find((child) => child.userData.isEnvironment === true) ?? null;
    if (environment) environment.visible = false;
    if (worldPanel) worldPanel.object3D.visible = false;
    restaurant.scale.setScalar(MODEL_SCALE);
    restaurant.position.set(0, 0, 0);
    reticle.hide();
    hint.show(HINT_TEXT);
    session.addEventListener('select', handleSelect);

    try {
      const space = renderer.xr.getReferenceSpace();
      if (!space || typeof session.requestHitTestSource !== 'function') {
        throw new Error('hit-test indisponible');
      }
      hitTestSource = await session.requestHitTestSource({ space });
    } catch (error) {
      reportProblem('Le test de surface (hit-test) n’est pas disponible : la session AR se ferme.', error);
      endSession();
    }
  }

  /** Démarre la session AR, en signalant tout échec au lieu de laisser un écran noir. */
  function handleSessionStart() {
    beginSession().catch((error) => {
      reportProblem('La réalité augmentée n’a pas pu démarrer.', error);
      endSession();
    });
  }

  /** Nettoie l'état à la fermeture de session. */
  function handleSessionEnd() {
    if (session) session.removeEventListener('select', handleSelect);
    session = null;
    cancelHitTest();
    placed = false;
    restoreScene();
    if (!failed) hint.hide();
  }

  /** Met à jour le réticule depuis les résultats de hit-test de la frame courante. */
  function update(frame) {
    if (!hitTestSource || placed) return;
    try {
      reticle.update(frame, hitTestSource, renderer.xr.getReferenceSpace());
    } catch (error) {
      cancelHitTest();
      reportProblem('Le test de surface a été interrompu.', error);
    }
  }

  /** Ferme la session AR en cours, si elle existe. */
  function endSession() {
    const active = renderer.xr.getSession() ?? session;
    if (active) active.end().catch((error) => reportProblem('La session AR n’a pas pu être fermée.', error));
  }

  /** Demande l'entrée en AR, ou explique pourquoi elle est indisponible. */
  function start() {
    if (supported) button.click();
    else reportProblem('La réalité augmentée n’est pas disponible sur cet appareil.', null);
  }

  /** Détache tout ce que le module a ajouté à la scène et au document. */
  function dispose() {
    if (session) restoreScene();
    cancelHitTest();
    renderer.xr.removeEventListener('sessionstart', handleSessionStart);
    renderer.xr.removeEventListener('sessionend', handleSessionEnd);
    reticle.dispose();
    button.remove();
    hint.remove();
  }

  renderer.xr.addEventListener('sessionstart', handleSessionStart);
  renderer.xr.addEventListener('sessionend', handleSessionEnd);

  if (typeof navigator !== 'undefined' && navigator.xr) {
    navigator.xr
      .isSessionSupported('immersive-ar')
      .then((value) => (supported = value))
      .catch(() => (supported = false));
  }

  return { button, start, stop: endSession, dispose, isSupported: () => supported, update };
}
