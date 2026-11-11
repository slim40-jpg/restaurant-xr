/**
 * @file    src/ui/backend-badge.js
 * @brief   Badge discret indiquant le backend de rendu réellement utilisé.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-11
 * @role    Rend vérifiable à l'écran la promesse « WebGPU avec repli WebGL2 ».
 */

import * as THREE from 'three/webgpu';

/**
 * Décrit le backend actif d'un renderer Three.js.
 * @param {THREE.WebGPURenderer} renderer Renderer à inspecter.
 * @returns {{ label: string, detail: string, isWebGPU: boolean }} Libellé affiché et nature du backend.
 */
function describeBackend(renderer) {
  const backend = renderer && renderer.backend;

  if (backend && backend.isWebGPUBackend) {
    return { label: 'WebGPU', detail: 'actif', isWebGPU: true };
  }

  if (backend && backend.isWebGLBackend) {
    return { label: 'WebGL 2', detail: 'repli', isWebGPU: false };
  }

  // Backend non encore initialisé : on se rabat sur le nom du constructeur.
  const isWebGPU = Boolean(renderer && /WebGPU/.test(renderer.constructor.name));
  return { label: isWebGPU ? 'WebGPU' : 'WebGL 2', detail: 'initialisation', isWebGPU };
}

/**
 * Crée le badge de backend et l'ajoute au document.
 * @returns {{ element: HTMLElement, update: (renderer: THREE.WebGPURenderer) => void }}
 *   L'élément créé et une fonction de rafraîchissement idempotente.
 */
export function createBackendBadge() {
  const element = document.createElement('div');
  element.id = 'backend-badge';
  Object.assign(element.style, {
    position: 'fixed',
    right: '14px',
    bottom: '14px',
    zIndex: '100',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    borderRadius: '999px',
    background: 'rgba(12, 12, 22, 0.78)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    color: '#e8e8f2',
    font: '12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    letterSpacing: '0.02em',
    pointerEvents: 'none',
  });

  const dot = document.createElement('span');
  Object.assign(dot.style, {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#8a8aa3',
    flex: '0 0 auto',
  });

  const text = document.createElement('span');
  text.textContent = 'initialisation…';

  element.append(dot, text);
  document.body.appendChild(element);

  let lastSignature = '';
  element.title = 'Backend de rendu actif. WebGPU est utilisé quand le navigateur le permet ; WebGL2 sinon.';

  /**
   * Met à jour le badge si le backend a changé.
   * @param {THREE.WebGPURenderer} renderer Renderer courant (peut changer après une session XR).
   * @returns {void}
   */
  function update(renderer) {
    const { label, detail, isWebGPU } = describeBackend(renderer);
    const signature = `${label}|${detail}|${THREE.REVISION}`;

    if (signature === lastSignature) {
      return;
    }

    lastSignature = signature;
    text.textContent = `${label} · ${detail} · three r${THREE.REVISION}`;
    dot.style.background = isWebGPU ? '#4ade80' : '#fbbf24';
  }

  return { element, update };
}
