/**
 * @file    src/xr/ar-hint.js
 * @brief   Panneau d'aide DOM affiché pendant une session de réalité augmentée.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Isole la messagerie du mode AR : aucune dépendance à Three.js ni à la session XR.
 */

/** Style du panneau, aligné sur l'interface de l'application. */
const STYLE =
  'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);' +
  'max-width:min(560px,calc(100vw - 32px));padding:10px 16px;border-radius:8px;' +
  'background:rgba(13,13,22,0.82);color:#fff;font:14px/1.4 system-ui,sans-serif;' +
  'text-align:center;pointer-events:none;z-index:1000;';

/**
 * Crée le panneau d'aide AR, masqué au départ.
 * @param {string} [initialText=''] Texte affiché au premier `show()`.
 * @returns {{ element: HTMLElement, show: (message: string) => void, hide: () => void, remove: () => void }}
 *   L'élément créé et ses commandes d'affichage.
 */
export function createArHint(initialText = '') {
  const element = document.createElement('div');
  element.style.cssText = STYLE;
  element.textContent = initialText;
  element.hidden = true;
  document.body.appendChild(element);

  return {
    element,
    /**
     * Affiche un message, même si le panneau était masqué.
     * @param {string} message Message à afficher.
     * @returns {void}
     */
    show(message) {
      element.textContent = message;
      element.hidden = false;
    },
    /**
     * Masque le panneau sans le supprimer.
     * @returns {void}
     */
    hide() {
      element.hidden = true;
    },
    /**
     * Retire le panneau du document.
     * @returns {void}
     */
    remove() {
      element.remove();
    },
  };
}
