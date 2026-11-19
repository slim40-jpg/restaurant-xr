/**
 * @file    src/ui/backend-badge.js
 * @brief   Badge vérifiant à l'écran que le rendu tourne bien sur WebGPU.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Affiche l'état du backend unique ; l'état « repli » n'existe plus.
 */

import * as THREE from 'three/webgpu';

/**
 * Décrit l'état affichable du backend.
 * @param {THREE.WebGPURenderer|null} renderer Renderer courant, éventuellement non initialisé.
 * @param {string|null} [reason] Cause d'indisponibilité rapportée par `init()`.
 * @returns {{ label: string, detail: string, color: string, title: string }} État complet du badge.
 */
function describeState(renderer, reason) {
  const backend = renderer && renderer.backend;

  // Un backend WebGL2 est ici un état assumé : c'est le repli des sessions immersives.
  if (reason === 'webgl-fallback' || (backend && backend.isWebGLBackend === true)) {
    return {
      label: 'WebGL 2',
      detail: 'repli XR',
      color: '#fbbf24',
      title: 'Rendu sur le backend WebGL2 : WebGPU-XR n’est pas exposé sur cet appareil.',
    };
  }

  if (reason) {
    return {
      label: 'WebGPU',
      detail: 'indisponible',
      color: '#f87171',
      title: 'WebGPU est indisponible et aucun backend de secours n’a été obtenu.',
    };
  }

  if (backend && backend.isWebGPUBackend === true && renderer.hasInitialized?.() === true) {
    return {
      label: 'WebGPU',
      detail: 'actif',
      color: '#4ade80',
      title: 'Backend WebGPU actif : la scène est rendue par le backend WebGPU.',
    };
  }

  return {
    label: 'WebGPU',
    detail: 'initialisation',
    color: '#8a8aa3',
    title: 'WebGPU : initialisation du renderer en cours.',
  };
}

/**
 * Crée le badge de backend et l'ajoute au document.
 * @returns {{ element: HTMLElement, update: (renderer: THREE.WebGPURenderer, reason?: string|null) => void }}
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

  element.append(dot, text);
  document.body.appendChild(element);

  let lastSignature = '';

  /**
   * Met à jour le badge si l'état affiché a changé.
   * @param {THREE.WebGPURenderer|null} renderer Renderer courant, éventuellement non initialisé.
   * @param {string|null} [reason] Cause d'indisponibilité rapportée par `init()`.
   * @returns {void}
   */
  function update(renderer, reason = null) {
    const state = describeState(renderer, reason);
    const signature = `${state.label}|${state.detail}|${THREE.REVISION}`;

    if (signature === lastSignature) {
      return;
    }

    lastSignature = signature;
    text.textContent = `${state.label} · ${state.detail} · three r${THREE.REVISION}`;
    dot.style.background = state.color;
    element.title = state.title;
  }

  update(null);

  return { element, update };
}
