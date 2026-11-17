/**
 * @file    src/ui/table-card.js
 * @brief   Fiche latérale d'une table : caractéristiques, statut et menu, avec réservation explicite.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-17
 * @role    Afficher une table cliquée sans réserver, puis laisser le client confirmer via un bouton.
 */

import {
  FEATURE_LABELS_FR,
  STATUS_COLORS,
  STATUS_LABELS_FR,
  TABLE_STATUS,
  ZONE_LABELS_FR,
} from '../config/constants.js';
import { createMenuList } from './menu-list.js';

/** Libellé du bouton de réservation selon l'état courant de la table. */
const RESERVE_LABELS = Object.freeze({
  available: 'Réserver cette table',
  reserved: 'Déjà réservée',
  occupied: 'Occupée',
  unavailable: 'Indisponible',
});

/** Compteur d'identifiants uniques pour les titres de boîte de dialogue. */
let cardCounter = 0;

/** Feuille de style locale, préfixée `tcard-` pour éviter toute collision. */
const STYLE_TEXT = `
.tcard { position: fixed; top: 50%; right: 18px; transform: translateY(-50%); z-index: 200;
  width: min(360px, 34vw); max-height: 70vh; display: flex; flex-direction: column; box-sizing: border-box;
  border: 1px solid rgba(176, 140, 87, 0.55); border-radius: 14px; background: #0d0d16; color: #e8e8f0;
  font: 13px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55); overflow: hidden; }
.tcard[hidden] { display: none; } .tcard-close:hover { background: rgba(176, 140, 87, 0.14); }
.tcard-head { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(176, 140, 87, 0.28); }
.tcard-title { margin: 0; font-size: 15px; letter-spacing: 0.02em; color: #f3e7d3; }
.tcard-close { margin-left: auto; width: 28px; height: 28px; border: 1px solid rgba(176, 140, 87, 0.5); border-radius: 8px; background: transparent; color: #b08c57; font-size: 16px; line-height: 1; cursor: pointer; }
.tcard-body { padding: 12px 16px; overflow-y: auto; }
.tcard-facts { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0 0 14px; }
.tcard-facts dt { color: #9a9ab0; font-size: 12px; } .tcard-facts dd { margin: 0; }
.tcard-status { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
.tcard-dot { width: 8px; height: 8px; border-radius: 50%; } .tcard-course + .tcard-course { margin-top: 12px; }
.tcard-course-title { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #b08c57; }
.tcard-items { list-style: none; margin: 0; padding: 0; }
.tcard-item { display: grid; grid-template-columns: 1fr auto; grid-template-areas: "name price" "desc desc";
  gap: 1px 10px; padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
.tcard-item:last-child { border-bottom: 0; } .tcard-item-name { grid-area: name; color: #f0f0f6; }
.tcard-item-price { grid-area: price; color: #d8bd8f; white-space: nowrap; } .tcard-item-desc { grid-area: desc; color: #8e8ea6; font-size: 11.5px; }
.tcard-item-tag { margin-left: 6px; padding: 0 5px; border-radius: 999px; background: rgba(176, 140, 87, 0.16);
  color: #cbb489; font-size: 10px; text-transform: uppercase; }
.tcard-foot { padding: 12px 16px 14px; border-top: 1px solid rgba(176, 140, 87, 0.28); }
.tcard-reserve { width: 100%; padding: 10px 12px; border: 0; border-radius: 10px; background: #b08c57;
  color: #1a1206; font: 600 13px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; cursor: pointer; }
.tcard-reserve:hover:not(:disabled) { background: #c39d63; } .tcard-reserve:disabled {
  background: #2a2a3a; color: #7c7c92; cursor: not-allowed; }
.tcard-close:focus-visible, .tcard-reserve:focus-visible { outline: 2px solid #e6c88f; outline-offset: 2px; }
`;

/**
 * Convertit une couleur numérique de constante en valeur CSS hexadécimale.
 * @param {number|string|undefined} value Couleur `0xrrggbb` ou chaîne CSS.
 * @returns {string} Couleur CSS exploitable.
 */
function colorToCss(value) {
  if (typeof value === 'number') return `#${value.toString(16).padStart(6, '0')}`;
  return typeof value === 'string' && value ? value : '#ffffff';
}

/**
 * Crée la fiche d'une table et son panneau latéral.
 * @param {{ container?: HTMLElement, onReserve?: (table: Object) => void,
 *   onClose?: () => void }} [options] Conteneur d'accueil, rappel de réservation et rappel de fermeture
 *   déclenchée par l'utilisateur (bouton × ou touche Échap).
 * @returns {{ element: HTMLElement, open: (table: Object) => void, close: () => void,
 *   isOpen: () => boolean }} Fiche montée et son API.
 */
export function createTableCard({ container, onReserve, onClose } = {}) {
  const host = container || document.body;
  const uid = `tcard-${++cardCounter}`;
  let currentTable = null;
  let previousFocus = null;

  const element = document.createElement('aside');
  element.className = 'tcard';
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'false');
  element.setAttribute('aria-labelledby', `${uid}-title`);
  element.hidden = true;
  element.innerHTML = `
    <style>${STYLE_TEXT}</style>
    <header class="tcard-head">
      <h2 class="tcard-title" id="${uid}-title"></h2>
      <button class="tcard-close" type="button" aria-label="Fermer la fiche de table">×</button>
    </header>
    <div class="tcard-body">
      <dl class="tcard-facts"></dl>
    </div>
    <footer class="tcard-foot">
      <button class="tcard-reserve" type="button">Réserver cette table</button>
    </footer>
  `;

  const title = element.querySelector('.tcard-title');
  const closeButton = element.querySelector('.tcard-close');
  const facts = element.querySelector('.tcard-facts');
  const reserveButton = element.querySelector('.tcard-reserve');
  element.querySelector('.tcard-body').appendChild(createMenuList());

  /** Ajoute une paire terme / valeur aux caractéristiques. */
  function appendFact(term, value) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    if (value instanceof HTMLElement) dd.appendChild(value);
    else dd.textContent = value;
    facts.append(dt, dd);
  }

  /** Reconstruit intégralement le contenu pour la table fournie, sans réutiliser l'ancien. */
  function render(table) {
    const id = table.id === null || table.id === undefined ? 'Table' : String(table.id);
    const zone = ZONE_LABELS_FR[table.zone] || 'Salle';
    const capacity = Number.isFinite(table.capacity)
      ? `${table.capacity} ${table.capacity === 1 ? 'place' : 'places'}`
      : '';
    title.textContent = [id, zone, capacity].filter(Boolean).join(' · ');

    facts.replaceChildren();
    appendFact('Emplacement', zone);
    appendFact('Capacité', capacity || 'Non précisée');

    const features = (Array.isArray(table.features) ? table.features : [])
      .map((feature) => FEATURE_LABELS_FR[feature])
      .filter(Boolean);
    appendFact('Caractéristiques', features.length > 0 ? features.join(' · ') : 'Aucune');

    const statusLabel = STATUS_LABELS_FR[table.status] || 'Statut inconnu';
    const status = document.createElement('span');
    status.className = 'tcard-status';
    status.style.color = colorToCss(STATUS_COLORS[table.status]);
    const dot = document.createElement('span');
    dot.className = 'tcard-dot';
    dot.style.background = colorToCss(STATUS_COLORS[table.status]);
    status.append(dot, document.createTextNode(statusLabel));
    appendFact('Statut', status);

    reserveButton.disabled = table.status !== TABLE_STATUS.AVAILABLE;
    reserveButton.textContent = RESERVE_LABELS[table.status] || 'Indisponible';
  }

  /** Ferme la fiche et rend le focus à l'élément précédent. */
  function close() {
    if (element.hidden) return;
    element.hidden = true;
    document.removeEventListener('keydown', handleKeydown);
    const target = previousFocus;
    previousFocus = null;
    if (target && target.isConnected && typeof target.focus === 'function') target.focus();
  }

  /** Fermeture demandée par l'utilisateur : ferme puis prévient l'appelant. */
  function requestClose() {
    close();
    if (typeof onClose === 'function') onClose();
  }

  /** Ferme la fiche sur la touche Échap. */
  function handleKeydown(event) {
    if (event.key === 'Escape' && !element.hidden) requestClose();
  }

  /** Ouvre la fiche sur une table et reconstruit son contenu à chaque appel. */
  function open(table) {
    if (!table || typeof table !== 'object') return;
    if (element.hidden) {
      previousFocus = document.activeElement;
      document.addEventListener('keydown', handleKeydown);
    }
    currentTable = table;
    render(table);
    element.hidden = false;
    closeButton.focus();
  }

  /** Indique si la fiche est actuellement visible. */
  function isOpen() {
    return !element.hidden;
  }

  closeButton.addEventListener('click', requestClose);
  reserveButton.addEventListener('click', () => {
    if (currentTable && typeof onReserve === 'function') onReserve(currentTable);
  });

  host.appendChild(element);
  return { element, open, close, isOpen };
}
