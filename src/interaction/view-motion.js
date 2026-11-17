/**
 * @file    src/interaction/view-motion.js
 * @brief   Micro-mouvements de caméra : pas, respiration, roulis et inclinaison d'accélération.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-17
 * @role    Donne un poids humain au regard sans jamais modifier la trajectoire du marcheur.
 */

/** Réglages par défaut, en unités SI et radians. */
export const VIEW_MOTION_DEFAULTS = Object.freeze({
  bobAmplitude: 0.032,
  bobFrequency: 1.75,
  bobRunFactor: 1.55,
  speedReference: 3.2,
  rollMax: 0.016,
  rollGain: 0.02,
  leanMax: 0.012,
  leanGain: 0.004,
  breathAmplitude: 0.007,
  breathFrequency: 0.22,
  blendSeconds: 0.4,
  dampingSeconds: 0.14,
  maxOffsetY: 0.05,
});

/** Offsets nuls, renvoyés quand le mouvement est coupé. */
const STILL = Object.freeze({ offsetY: 0, roll: 0, pitchOffset: 0 });

/**
 * Vrai si le système demande moins d'animations.
 * @returns {boolean} `true` si `prefers-reduced-motion: reduce` est actif.
 */
function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Écrête une valeur dans un intervalle symétrique.
 * @param {number} value Valeur à écrêter.
 * @param {number} limit Borne positive.
 * @returns {number} Valeur dans `[-limit, limit]`.
 */
function clamp(value, limit) {
  return Math.min(limit, Math.max(-limit, value));
}

/**
 * Crée le générateur de micro-mouvements.
 * @param {object} [options] Surcharges de `VIEW_MOTION_DEFAULTS`, plus `enabled`.
 * @returns {{
 *   update: (dt: number, sample: { speed: number, distance: number, yawVelocity: number,
 *     acceleration: number }) => { offsetY: number, roll: number, pitchOffset: number },
 *   setEnabled: (value: boolean) => void,
 *   isEnabled: () => boolean,
 *   reset: () => void
 * }} Générateur d'offsets de caméra.
 */
export function createViewMotion(options = {}) {
  const cfg = { ...VIEW_MOTION_DEFAULTS, ...options };
  let enabled = options.enabled ?? !prefersReducedMotion();

  let phase = 0;
  let breathPhase = 0;
  let blend = 0;
  let roll = 0;
  let lean = 0;

  return {
    /**
     * Avance d'une image et renvoie les offsets à appliquer à la caméra.
     *
     * Le balancement est indexé sur la **distance parcourue**, pas sur le temps : bloqué
     * contre un mur, le marcheur ne balance plus, ce qui est le comportement attendu.
     *
     * @param {number} dt Temps écoulé en secondes (déjà écrêté par l'appelant).
     * @param {{ speed?: number, distance?: number, yawVelocity?: number, acceleration?: number }} sample
     *   Mesures du frame courant.
     * @returns {{ offsetY: number, roll: number, pitchOffset: number }} Offsets en mètres et radians.
     */
    update(dt, sample) {
      if (!enabled || !(dt > 0)) return STILL;

      const speed = Number.isFinite(sample?.speed) ? Math.max(0, sample.speed) : 0;
      const distance = Number.isFinite(sample?.distance) ? sample.distance : 0;
      const yawVelocity = Number.isFinite(sample?.yawVelocity) ? sample.yawVelocity : 0;
      const acceleration = Number.isFinite(sample?.acceleration) ? sample.acceleration : 0;

      // Fondu marche ↔ arrêt : évite un saut entre balancement et respiration.
      const target = speed > 0.15 ? 1 : 0;
      blend += (target - blend) * Math.min(1, dt / cfg.blendSeconds);

      // Pas : la fréquence suit la vitesse, la phase suit la distance.
      const speedRatio = Math.min(1, speed / cfg.speedReference);
      const frequency = cfg.bobFrequency * (speedRatio > 0.75 ? cfg.bobRunFactor : 1);
      phase = (distance / cfg.speedReference) * Math.PI * 2 * frequency;
      const bob = Math.sin(phase) * cfg.bobAmplitude * speedRatio * blend;

      // Respiration : seulement à l'arrêt, jamais cumulative avec le pas.
      breathPhase += dt * Math.PI * 2 * cfg.breathFrequency;
      const breath = Math.sin(breathPhase) * cfg.breathAmplitude * (1 - blend);

      // Roulis dans les virages, tangage à l'accélération : ramenés à zéro en douceur.
      const damping = Math.min(1, dt / cfg.dampingSeconds);
      roll += (clamp(-yawVelocity * cfg.rollGain, cfg.rollMax) - roll) * damping;
      lean += (clamp(-acceleration * cfg.leanGain, cfg.leanMax) - lean) * damping;

      return {
        offsetY: clamp(bob + breath, cfg.maxOffsetY),
        roll,
        pitchOffset: lean,
      };
    },

    /**
     * Active ou coupe les micro-mouvements.
     * @param {boolean} value Nouvel état.
     * @returns {void}
     */
    setEnabled(value) {
      enabled = Boolean(value);
      if (!enabled) {
        roll = 0;
        lean = 0;
        blend = 0;
      }
    },

    /** @returns {boolean} `true` si les micro-mouvements sont actifs. */
    isEnabled: () => enabled,

    /** Remet les phases à zéro (changement de mode, téléportation). */
    reset() {
      phase = 0;
      breathPhase = 0;
      blend = 0;
      roll = 0;
      lean = 0;
    },
  };
}
