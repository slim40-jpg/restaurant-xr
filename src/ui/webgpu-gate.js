/**
 * @file    src/ui/webgpu-gate.js
 * @brief   Écran de blocage explicite quand WebGPU est indisponible.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Remplace un écran noir silencieux par un diagnostic lisible et une action de relance.
 */

const GATE_ID = 'webgpu-gate';

const STEPS = [
  'Ouvrez l’application dans Chrome ou Edge 113 ou plus récent.',
  'Allez sur chrome://gpu et vérifiez que « WebGPU : Hardware accelerated » est indiqué.',
  'Si besoin, activez chrome://flags/#enable-unsafe-webgpu puis relancez le navigateur.',
];

/**
 * Explique en une phrase l'échec constaté.
 * @param {string|null} reason Cause rapportée par le renderer.
 * @returns {string} Explication concrète en français.
 */
function explain(reason) {
  if (reason === 'no-navigator-gpu') {
    return 'Ce navigateur est trop ancien ou WebGPU y est désactivé : l’API navigator.gpu est absente.';
  }

  if (reason === 'no-adapter') {
    return 'WebGPU existe mais aucun adaptateur GPU n’a été accordé : GPU non exposé ou pilote désactivé.';
  }

  if (reason === 'unsupported-backend') {
    return 'Le pilote a refusé le backend WebGPU et aucun autre backend de rendu n’est autorisé.';
  }

  return 'Le rendu WebGPU n’a pas pu démarrer.';
}

/**
 * Affiche l'écran de blocage plein cadre, une seule fois par page.
 * @param {{ reason?: string|null, container?: HTMLElement }} [options] Cause de l'échec et hôte d'insertion.
 * @returns {HTMLElement} L'écran de blocage, créé ou déjà présent.
 */
export function showWebGPUUnavailable({ reason = null, container = document.body } = {}) {
  const existing = document.getElementById(GATE_ID);

  if (existing) {
    return existing;
  }

  const gate = document.createElement('div');
  gate.id = GATE_ID;
  gate.setAttribute('role', 'alert');
  gate.setAttribute('aria-live', 'assertive');
  Object.assign(gate.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '1000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#0d0d16',
    color: '#e8e8f2',
    font: '15px/1.6 system-ui, sans-serif',
    overflow: 'auto',
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    width: '100%',
    maxWidth: '560px',
    padding: '28px 30px',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '10px',
    background: '#13131f',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
  });

  const title = document.createElement('h1');
  title.textContent = 'WebGPU requis';
  Object.assign(title.style, {
    margin: '0 0 12px',
    fontSize: '22px',
    fontWeight: '600',
    letterSpacing: '0.01em',
  });

  const explanation = document.createElement('p');
  explanation.textContent = explain(reason);
  Object.assign(explanation.style, {
    margin: '0 0 18px',
    color: '#c9c9dc',
  });

  const stepsTitle = document.createElement('p');
  stepsTitle.textContent = 'À faire :';
  Object.assign(stepsTitle.style, {
    margin: '0 0 8px',
    fontWeight: '600',
  });

  const list = document.createElement('ol');
  Object.assign(list.style, {
    margin: '0 0 22px',
    paddingLeft: '20px',
    color: '#b9b9cc',
  });

  for (const step of STEPS) {
    const item = document.createElement('li');
    item.textContent = step;
    item.style.marginBottom = '6px';
    list.appendChild(item);
  }

  const action = document.createElement('button');
  action.type = 'button';
  action.textContent = 'Réessayer';
  Object.assign(action.style, {
    padding: '9px 18px',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    borderRadius: '6px',
    background: '#232338',
    color: '#f2f2fa',
    font: 'inherit',
    cursor: 'pointer',
  });
  action.addEventListener('click', () => {
    window.location.reload();
  });

  card.append(title, explanation, stepsTitle, list, action);
  gate.appendChild(card);
  container.appendChild(gate);
  action.focus();

  return gate;
}
