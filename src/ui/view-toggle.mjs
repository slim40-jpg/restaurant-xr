/**
 * @file    src/ui/view-toggle.mjs
 * @brief   Pastille de bascule entre la marche à la première personne et l'orbite.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-17
 * @role    Exposer deux boutons accessibles et le raccourci V, sans piloter la caméra.
 */

/** Modes proposés, dans l'ordre d'affichage des boutons. */
const MODES = Object.freeze([
  { id: 'walk', label: 'Marcher' },
  { id: 'orbit', label: 'Orbite' },
]);

/** Feuille de style locale, préfixée pour éviter toute collision avec le reste de l'interface. */
const STYLE_TEXT = `
.view-toggle { display: inline-flex; gap: 2px; padding: 3px; box-sizing: border-box;
  border: 1px solid rgba(176, 140, 87, 0.45); border-radius: 999px; background: #0d0d16;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); font: 12px/1 system-ui, sans-serif; }
.view-toggle button { appearance: none; border: 0; border-radius: 999px; padding: 6px 14px;
  background: transparent; color: #cfc6b6; font: inherit; letter-spacing: 0.03em; cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease; }
.view-toggle button:hover { color: #f1e8da; }
.view-toggle button[aria-pressed='true'] { background: #b08c57; color: #16110a; font-weight: 600; }
.view-toggle button:focus-visible { outline: 2px solid #b08c57; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .view-toggle button { transition: none; } }
`;

/**
 * Vérifie qu'un mode appartient au contrat, sinon renvoie le mode par défaut.
 * @param {string} mode Mode demandé.
 * @returns {'walk'|'orbit'} Mode valide.
 */
function normalizeMode(mode) {
  const known = MODES.some((entry) => entry.id === mode);
  return known ? mode : MODES[MODES.length - 1].id;
}

/**
 * Indique si un événement clavier provient d'un champ de saisie.
 * @param {EventTarget|null} target Cible de l'événement.
 * @returns {boolean} `true` quand la frappe doit être ignorée.
 */
function isEditableTarget(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable === true) return true;
  if (typeof target.closest !== 'function') return false;
  return target.closest('input, select, textarea, [contenteditable]') !== null;
}

/**
 * Crée la pastille « Marcher / Orbite ».
 *
 * L'élément n'impose aucune position : il se place dans le conteneur fourni, pour ne pas
 * chevaucher les boutons VR/AR. `onChange` n'est appelé que sur un vrai changement de mode,
 * afin qu'un second clic sur le mode actif ne réinitialise pas la position du marcheur.
 * Le raccourci `V` bascule entre les deux modes et ignore la frappe dans un champ de saisie.
 *
 * @param {{ container?: HTMLElement, initial?: 'walk'|'orbit', onChange?: (mode: string) => void }} [options]
 *   Conteneur d'accueil, mode initial et réaction au changement.
 * @returns {{ element: HTMLElement, setMode: (mode: string) => void }} Pastille montée et
 *   synchronisation visuelle sans rappel.
 */
export function createViewToggle({ container, initial = 'orbit', onChange } = {}) {
  const host = container || document.body;
  const notify = typeof onChange === 'function' ? onChange : () => {};
  let current = normalizeMode(initial);

  const element = document.createElement('div');
  element.className = 'view-toggle';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', 'Mode de caméra');
  element.innerHTML =
    `<style>${STYLE_TEXT}</style>` +
    MODES.map(
      (mode) => `<button type="button" data-mode="${mode.id}" aria-pressed="false">${mode.label}</button>`
    ).join('');

  const buttons = Array.from(element.querySelectorAll('button[data-mode]'));

  /**
   * Met à jour l'état visuel et `aria-pressed`, sans appeler `onChange`.
   * @param {string} mode Mode à afficher comme actif.
   * @returns {void}
   */
  // Réticule : matérialise le point visé quand le curseur est capturé par le pointer lock.
  const crosshair = document.createElement('div');
  crosshair.setAttribute('aria-hidden', 'true');
  Object.assign(crosshair.style, {
    position: 'fixed',
    left: '50%',
    top: '50%',
    width: '12px',
    height: '12px',
    marginLeft: '-6px',
    marginTop: '-6px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.9)',
    pointerEvents: 'none',
    zIndex: '130',
    display: 'none',
  });
  document.body.appendChild(crosshair);

  function setMode(mode) {
    current = normalizeMode(mode);

    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === current));
    }

    crosshair.style.display = current === 'walk' ? 'block' : 'none';
  }

  /**
   * Bascule vers le mode cliqué quand il diffère du mode courant.
   * @param {MouseEvent} event Événement de clic dans la pastille.
   * @returns {void}
   */
  function handleClick(event) {
    const button = event.target.closest('button[data-mode]');
    if (!button || !element.contains(button)) return;

    const mode = normalizeMode(button.dataset.mode);
    if (mode === current) return;

    setMode(mode);
    notify(mode);
  }

  /**
   * Raccourci `V` : alterne entre marche et orbite.
   * @param {KeyboardEvent} event Événement `keydown` global.
   * @returns {void}
   */
  function handleKeyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isEditableTarget(event.target)) return;
    if ((event.key || '').toLowerCase() !== 'v') return;

    const index = MODES.findIndex((entry) => entry.id === current);
    const next = MODES[(index + 1) % MODES.length].id;
    setMode(next);
    notify(next);
  }

  element.addEventListener('click', handleClick);
  window.addEventListener('keydown', handleKeyDown);

  setMode(current);
  host.appendChild(element);

  return { element, setMode };
}
