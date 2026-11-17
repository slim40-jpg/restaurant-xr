/**
 * @file    src/interaction/first-person.js
 * @brief   Caméra à hauteur d'œil : pointer lock, clavier AZERTY/QWERTY et pas du marcheur.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-17
 * @role    Traduire souris et clavier en intentions, puis déléguer le mouvement à walk-math.
 */

import { createWalkerState, stepWalker, WALK_DEFAULTS } from './walk-math.js';

/** Sensibilité de la souris, en radians par pixel parcouru. */
const LOOK_SENSITIVITY = 0.0022;
/** Pas de temps maximal : un onglet en arrière-plan produirait un saut de plusieurs mètres. */
const MAX_STEP_SECONDS = 0.05;

/** Vrai si la cible est un champ de saisie : le panneau de préférences en contient plusieurs. */
function isEditableTarget(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable === true) return true;
  if (typeof target.closest !== 'function') return false;
  return target.closest('input, select, textarea, [contenteditable]') !== null;
}

/** Touches de déplacement ; `event.key` couvre AZERTY (`z`, `q`) et QWERTY (`w`, `a`). */
const KEY_ACTIONS = {
  w: 'forward',
  z: 'forward',
  arrowup: 'forward',
  s: 'back',
  arrowdown: 'back',
  a: 'left',
  q: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
};

/**
 * Traduit une touche en intention de déplacement.
 * @param {KeyboardEvent} event Événement clavier.
 * @returns {'forward'|'back'|'left'|'right'|'run'|null} Intention reconnue, ou `null`.
 */
function actionFor(event) {
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') return 'run';
  const key = typeof event.key === 'string' ? event.key.toLowerCase() : '';
  return key === 'shift' ? 'run' : (KEY_ACTIONS[key] ?? null);
}

/**
 * Crée le mode marche : la caméra se déplace comme les yeux du visiteur. Ce module ne touche
 * ni à OrbitControls ni aux tables ; c'est l'appelant qui arbitre entre les modes de caméra.
 * @param {{ camera: Object, domElement: HTMLElement, colliders: Array<Object>,
 *   surfaceHeightAt: (x: number, z: number) => number|null, start?: { x?: number, z?: number },
 *   invertY?: boolean }} options Caméra, écouteur, volumes et point d'apparition.
 * @returns {{ enable: () => void, disable: () => void, isEnabled: () => boolean,
 *   update: (dt: number) => void, reset: () => void, dispose: () => void }} Contrôleur du mode marche.
 */
export function createFirstPerson({
  camera,
  domElement,
  colliders,
  surfaceHeightAt,
  start = { x: 0, z: 6 },
  invertY = false,
}) {
  const state = createWalkerState({ x: start.x ?? 0, z: start.z ?? 0, y: 0 });
  const world = {
    colliders: Array.isArray(colliders) ? colliders : [],
    surfaceHeightAt,
    defaults: WALK_DEFAULTS,
  };
  const keys = { forward: false, back: false, left: false, right: false, run: false };
  const input = { forward: 0, strafe: 0, run: false, dYaw: 0, dPitch: 0 };
  let enabled = false;
  let pendingYaw = 0;
  let pendingPitch = 0;
  let lockWarned = false;

  /** Applique l'état du marcheur à la caméra (yeux à 1,65 m, orientation YXZ). */
  function syncCamera() {
    camera.rotation.order = 'YXZ';
    camera.position.set(state.x, state.y + WALK_DEFAULTS.eyeHeight, state.z);
    camera.rotation.set(state.pitch, state.yaw, 0);
  }
  /** Replace l'état au point d'apparition et, si actif, la caméra. */
  function placeAt(x, z) {
    const height = typeof surfaceHeightAt === 'function' ? surfaceHeightAt(x, z) : null;
    state.x = x;
    state.z = z;
    state.y = typeof height === 'number' && !Number.isNaN(height) ? height : 0;
    state.yaw = 0;
    state.pitch = 0;
    state.vx = 0;
    state.vz = 0;
    pendingYaw = 0;
    pendingPitch = 0;
    if (enabled) syncCamera();
  }
  /** Signale une seule fois le repli sans pointer lock. */
  function warnLockRefused() {
    if (lockWarned) return;
    lockWarned = true;
    console.warn('Mode marche : pointer lock refusé — regard relatif à la souris, curseur non capturé.');
  }
  /** Demande le pointer lock et bascule en regard relatif dégradé s'il est refusé. */
  function requestLock() {
    if (!domElement || typeof domElement.requestPointerLock !== 'function') {
      warnLockRefused();
      return;
    }
    try {
      const request = domElement.requestPointerLock();
      if (request && typeof request.catch === 'function') request.catch(warnLockRefused);
    } catch {
      warnLockRefused();
    }
  }
  /** Active le mode marche : caméra à `start` puis capture du curseur. */
  function enable() {
    if (enabled) return;
    enabled = true;
    keys.forward = keys.back = keys.left = keys.right = keys.run = false;
    placeAt(start.x ?? 0, start.z ?? 0);
    requestLock();
  }
  /** Quitte le mode marche : relâche le pointer lock et neutralise les touches. */
  function disable() {
    if (!enabled) return;
    enabled = false;
    keys.forward = keys.back = keys.left = keys.right = keys.run = false;
    pendingYaw = 0;
    pendingPitch = 0;
    if (document.pointerLockElement === domElement && typeof document.exitPointerLock === 'function') {
      document.exitPointerLock();
    }
  }
  /** Applique les intentions de la frame au marcheur puis à la caméra, dt écrêté à 50 ms. */
  function update(dt) {
    if (!enabled) return;
    const raw = Number(dt);
    const step = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), MAX_STEP_SECONDS) : 0;
    if (step === 0) return;
    input.forward = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
    input.strafe = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    input.run = keys.run;
    input.dYaw = pendingYaw;
    input.dPitch = pendingPitch;
    pendingYaw = 0;
    pendingPitch = 0;
    stepWalker(state, input, step, world);
    syncCamera();
  }
  /** Enregistre une touche pressée ; les flèches ne doivent pas faire défiler la page. */
  function handleKeyDown(event) {
    if (!enabled || isEditableTarget(event.target)) return;
    const action = actionFor(event);
    if (action === null) return;
    if (action === 'run') keys.run = true;
    else keys[action] = true;
    if (typeof event.code === 'string' && event.code.startsWith('Arrow')) event.preventDefault();
  }
  /** Enregistre une touche relâchée, même si le focus a changé entre-temps. */
  function handleKeyUp(event) {
    if (!enabled) return;
    const action = actionFor(event);
    if (action === null) return;
    if (action === 'run') keys.run = false;
    else keys[action] = false;
  }
  /** Accumule le regard souris ; `invertY` retourne l'axe vertical. */
  function handleMouseMove(event) {
    if (!enabled) return;
    pendingYaw -= event.movementX * LOOK_SENSITIVITY;
    pendingPitch += (invertY ? 1 : -1) * event.movementY * LOOK_SENSITIVITY;
  }
  /** Coupe le mode dès que le navigateur relâche le pointer lock (Échap, perte de focus). */
  function handlePointerLockChange() {
    if (enabled && document.pointerLockElement !== domElement) disable();
  }
  const handlePointerLockError = () => enabled && warnLockRefused();
  /** Replace le marcheur au point d'apparition. */
  const reset = () => placeAt(start.x ?? 0, start.z ?? 0);
  /** Retire tous les écouteurs et quitte le mode marche. */
  function dispose() {
    disable();
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    domElement.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('pointerlockchange', handlePointerLockChange);
    document.removeEventListener('pointerlockerror', handlePointerLockError);
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  domElement.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('pointerlockchange', handlePointerLockChange);
  document.addEventListener('pointerlockerror', handlePointerLockError);

  return { enable, disable, isEnabled: () => enabled, update, reset, dispose };
}
