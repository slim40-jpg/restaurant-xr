/**
 * @file    src/interaction/move-keys.js
 * @brief   Lecture du clavier pour la marche : AZERTY, QWERTY et flèches.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-17
 * @role    Tenir la table des touches hors du contrôleur caméra, qui reste focalisé sur le mouvement.
 */

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
 * Vrai si la cible est un champ de saisie : le panneau de préférences en contient plusieurs.
 * @param {EventTarget|null} target Cible de l'événement.
 * @returns {boolean} `true` si le clavier doit être ignoré.
 */
export function isEditableTarget(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable === true) return true;
  if (typeof target.closest !== 'function') return false;
  return target.closest('input, select, textarea, [contenteditable]') !== null;
}

/**
 * Traduit une touche en intention de déplacement.
 * @param {KeyboardEvent} event Événement clavier.
 * @returns {'forward'|'back'|'left'|'right'|'run'|null} Intention reconnue, ou `null`.
 */
export function actionFor(event) {
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') return 'run';
  const key = typeof event.key === 'string' ? event.key.toLowerCase() : '';
  return key === 'shift' ? 'run' : (KEY_ACTIONS[key] ?? null);
}
