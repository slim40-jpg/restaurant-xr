/**
 * @file    src/interaction/walk-math.mjs
 * @brief   Déplacement du marcheur : orientation, inertie et collisions, sans DOM ni Three.js.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-17
 * @role    Logique pure et déterministe du mode marche, testable sous Node.
 */

/** Réglages par défaut du marcheur (mètres, radians, m/s et m/s²). */
export const WALK_DEFAULTS = Object.freeze({
  eyeHeight: 1.65,
  radius: 0.28,
  speed: 3.2,
  runSpeed: 5.5,
  acceleration: 12,
  maxPitch: (80 * Math.PI) / 180,
});

/** Multiplicateur d'accélération quand aucune touche de déplacement n'est pressée. */
const STOP_FACTOR = 1.6;

/** Raideur du lissage vertical : `y` rejoint le sol en environ 1/12 s. */
const GROUND_SMOOTHING = 12;

/**
 * Borne une valeur entre deux extrêmes.
 * @param {number} value Valeur à borner.
 * @param {number} min Borne basse.
 * @param {number} max Borne haute.
 * @returns {number} Valeur bornée.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Crée l'état d'un marcheur posé au sol, sans vitesse initiale.
 * @param {{ x?: number, y?: number, z?: number, yaw?: number, pitch?: number }} [start] Position et regard initiaux.
 * @returns {{ x: number, y: number, z: number, yaw: number, pitch: number, vx: number, vz: number }}
 *   État mutable, réutilisé à chaque frame pour éviter toute allocation.
 */
export function createWalkerState({ x = 0, y = 0, z = 0, yaw = 0, pitch = 0 } = {}) {
  return { x, y, z, yaw, pitch, vx: 0, vz: 0 };
}

/**
 * Indique si un volume croise la tranche verticale occupée par le marcheur.
 * @param {{ minY: number, maxY: number }} collider Volume candidat.
 * @param {number} feetY Altitude des pieds.
 * @param {number} headY Altitude des yeux.
 * @returns {boolean} `true` si les deux intervalles se chevauchent.
 */
function overlapsVertically(collider, feetY, headY) {
  return collider.maxY > feetY && collider.minY < headY;
}

/**
 * Teste le disque du marcheur contre une boîte sur le plan horizontal.
 * @param {number} x Abscisse du centre du disque.
 * @param {number} z Ordonnée du centre du disque.
 * @param {number} radius Rayon du disque.
 * @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} box Boîte de collision.
 * @returns {boolean} `true` si le disque pénètre la boîte.
 */
function circleHitsBox(x, z, radius, box) {
  const nearestX = clamp(x, box.minX, box.maxX);
  const nearestZ = clamp(z, box.minZ, box.maxZ);
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}

/**
 * Cherche un volume bloquant actif à la hauteur du marcheur.
 * @param {number} x Abscisse testée.
 * @param {number} z Ordonnée testée.
 * @param {number} radius Rayon du marcheur.
 * @param {number} feetY Altitude des pieds.
 * @param {number} headY Altitude des yeux.
 * @param {Array<Object>} colliders Volumes bloquants du lieu.
 * @returns {boolean} `true` dès qu'un volume actif à cette hauteur est touché.
 */
function isBlocked(x, z, radius, feetY, headY, colliders) {
  for (let index = 0; index < colliders.length; index += 1) {
    const collider = colliders[index];
    if (!overlapsVertically(collider, feetY, headY)) continue;
    if (circleHitsBox(x, z, radius, collider)) return true;
  }
  return false;
}

/**
 * Avance le marcheur d'un pas de temps.
 *
 * L'état est muté en place puis renvoyé : aucune allocation par frame. Le regard est appliqué
 * avant le déplacement. Chaque axe est testé séparément : l'axe bloqué est annulé et l'autre
 * progresse, ce qui fait glisser le long des murs. Un pas refusé par le sol
 * (`surfaceHeightAt` renvoyant `null`) restaure la position précédente et annule l'inertie.
 *
 * @param {{ x: number, y: number, z: number, yaw: number, pitch: number, vx: number, vz: number }} state
 *   État à faire avancer, muté en place.
 * @param {{ forward?: number, strafe?: number, run?: boolean, dYaw?: number, dPitch?: number }} input
 *   Intentions de la frame : axes dans [-1, 1], course et deltas de regard.
 * @param {number} dt Intervalle en secondes.
 * @param {{ colliders?: Array<Object>, surfaceHeightAt?: (x: number, z: number) => number|null,
 *   defaults?: Object }} world Univers de collision et de sol.
 * @returns {typeof state} Le même état, avancé.
 */
export function stepWalker(state, input, dt, world) {
  const { forward = 0, strafe = 0, run = false, dYaw = 0, dPitch = 0 } = input || {};
  const defaults = (world && world.defaults) || WALK_DEFAULTS;
  const colliders = (world && world.colliders) || [];
  const surfaceHeightAt = world && typeof world.surfaceHeightAt === 'function' ? world.surfaceHeightAt : null;

  if (!(dt > 0)) return state;

  state.yaw += dYaw;
  state.pitch = clamp(state.pitch + dPitch, -defaults.maxPitch, defaults.maxPitch);

  const sinYaw = Math.sin(state.yaw);
  const cosYaw = Math.cos(state.yaw);
  // Avant de la caméra en rotation YXZ : (-sin yaw, -cos yaw) ; droite : (cos yaw, -sin yaw).
  let dirX = -sinYaw * forward + cosYaw * strafe;
  let dirZ = -cosYaw * forward - sinYaw * strafe;
  const dirLength = Math.hypot(dirX, dirZ);
  if (dirLength > 1) {
    dirX /= dirLength;
    dirZ /= dirLength;
  }

  const speed = run ? defaults.runSpeed : defaults.speed;
  const targetVx = dirX * speed;
  const targetVz = dirZ * speed;
  const rate = defaults.acceleration * (dirLength === 0 ? STOP_FACTOR : 1) * dt;
  const dvx = targetVx - state.vx;
  const dvz = targetVz - state.vz;
  const dvLength = Math.hypot(dvx, dvz);

  if (dvLength > rate && dvLength > 0) {
    state.vx += (dvx / dvLength) * rate;
    state.vz += (dvz / dvLength) * rate;
  } else {
    state.vx = targetVx;
    state.vz = targetVz;
  }

  const previousX = state.x;
  const previousY = state.y;
  const previousZ = state.z;
  const feetY = state.y;
  const headY = state.y + defaults.eyeHeight;

  const nextX = state.x + state.vx * dt;
  if (isBlocked(nextX, state.z, defaults.radius, feetY, headY, colliders)) {
    state.vx = 0;
  } else {
    state.x = nextX;
  }

  const nextZ = state.z + state.vz * dt;
  if (isBlocked(state.x, nextZ, defaults.radius, feetY, headY, colliders)) {
    state.vz = 0;
  } else {
    state.z = nextZ;
  }

  const ground = surfaceHeightAt ? surfaceHeightAt(state.x, state.z) : null;
  if (ground === null || Number.isNaN(ground)) {
    state.x = previousX;
    state.y = previousY;
    state.z = previousZ;
    state.vx = 0;
    state.vz = 0;
    return state;
  }

  state.y += (ground - state.y) * Math.min(1, dt * GROUND_SMOOTHING);
  return state;
}
