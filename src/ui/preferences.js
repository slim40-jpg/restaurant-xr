/**
 * @file    src/ui/preferences.js
 * @brief   Panneau DOM de préférences qui recommande et met en évidence les places disponibles.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-11
 * @role    Traduire les critères du client en appels au moteur de recommandation.
 */

import {
  FEATURE_LABELS_FR,
  PARTY_SIZES,
  TABLE_FEATURES,
  ZONES,
  ZONE_LABELS_FR,
} from '../config/constants.js';
import { describeTable, findMatchingTables } from '../interaction/recommend.js';

/** Nombre maximal de recommandations listées. */
const MAX_RESULTS = 5;
/**
 * Drapeau du premier rendu : au chargement, on affiche la liste mais on ne met
 * rien en évidence. Sans cela, une dizaine de tables s'allument avant que
 * l'utilisateur n'ait exprimé la moindre préférence, ce qui donne l'impression
 * de marqueurs de débogage plutôt que de recommandations.
 */
let initialRender = true;
/** Compteur d'identifiants uniques pour les labels associés. */
let panelCounter = 0;

/** Zones proposées comme préférence (toutes sauf le centre, qui est le défaut). */
const ZONE_CHOICES = Object.values(ZONES)
  .filter((zone) => zone !== ZONES.CENTER)
  .map((zone) => ({ id: zone, label: ZONE_LABELS_FR[zone] }));

/** Feuille de style locale du panneau, préfixée pour éviter toute collision. */
const STYLE_TEXT = `
.pref-panel { position: relative; width: 100%; max-height: 46vh;
  overflow-y: auto; box-sizing: border-box; padding: 10px 12px; border: 1px solid rgba(122, 215, 255, 0.35);
  border-radius: 10px; background: rgba(12, 12, 26, 0.9); color: #e8e8f0; font: 12px/1.4 system-ui, sans-serif;
  z-index: 100; }
.pref-panel .pref-title { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase;
  color: #9fd8ff; }
.pref-panel .pref-party { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.pref-panel .pref-select { flex: 1; padding: 2px 4px; border-radius: 4px; border: 1px solid #3a3a55;
  background: #1a1a2e; color: #e8e8f0; font: inherit; }
.pref-panel fieldset { margin: 0 0 6px; padding: 0; border: 0; }
.pref-panel legend { padding: 0; margin-bottom: 2px; color: #9a9ab0; font-size: 11px; }
.pref-panel .pref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 8px; }
.pref-panel .pref-item { display: flex; align-items: center; gap: 5px; cursor: pointer; }
.pref-panel .pref-wide { grid-column: 1 / -1; }
.pref-panel input[type='checkbox'] { accent-color: #7ad7ff; margin: 0; }
.pref-panel .pref-results { list-style: none; margin: 4px 0 0; padding: 0; border-top: 1px solid #2a2a3d; }
.pref-panel .pref-result { display: block; width: 100%; padding: 3px 4px; border: 0; border-radius: 4px;
  background: none; color: #e8e8f0; font: inherit; text-align: left; cursor: pointer; }
.pref-panel .pref-result:hover { background: rgba(122, 215, 255, 0.12); }
.pref-panel .pref-empty { padding: 4px; color: #ffb4b4; }
.pref-panel input:focus-visible, .pref-panel select:focus-visible, .pref-panel .pref-result:focus-visible {
  outline: 2px solid #7ad7ff; outline-offset: 2px; }
`;

/**
 * Crée le panneau de préférences et son rendu des recommandations.
 * @param {{ container?: HTMLElement, getTables?: () => Array<Object>, onHighlight?: (ids: string[]) => void }} [deps]
 *   Dépendances : conteneur DOM, lecture des tables vivantes et rappel de mise en évidence.
 * @returns {{ element: HTMLElement, refresh: () => void }} Panneau monté et fonction de recalcul.
 */
export function createPreferencesPanel({ container, getTables, onHighlight } = {}) {
  const host = container || document.body;
  const readTables = typeof getTables === 'function' ? getTables : () => [];
  const notify = typeof onHighlight === 'function' ? onHighlight : () => {};
  const uid = `pref-${++panelCounter}`;

  const element = document.createElement('section');
  element.className = 'pref-panel';
  element.setAttribute('aria-label', 'Préférences de réservation');
  element.innerHTML = `
    <style>${STYLE_TEXT}</style>
    <h2 class="pref-title">Trouver une place</h2>
    <label class="pref-party" for="${uid}-party">Couverts
      <select class="pref-select" id="${uid}-party">
        ${PARTY_SIZES.map((size) => `<option value="${size}">${size} couverts</option>`).join('')}
      </select>
    </label>
    <fieldset>
      <legend>Emplacement</legend>
      <div class="pref-grid">
        ${ZONE_CHOICES.map(
          (zone) =>
            `<label class="pref-item"><input type="checkbox" data-zone="${zone.id}" aria-pressed="false"> ${zone.label}</label>`
        ).join('')}
      </div>
    </fieldset>
    <fieldset>
      <legend>Ambiance</legend>
      <div class="pref-grid">
        <label class="pref-item"><input type="checkbox" data-pref="quiet" aria-pressed="false"> ${FEATURE_LABELS_FR.quiet}</label>
        <label class="pref-item"><input type="checkbox" data-pref="private" aria-pressed="false"> ${FEATURE_LABELS_FR.private}</label>
        <label class="pref-item pref-wide"><input type="checkbox" data-pref="avoidWc" aria-pressed="false"> Loin des WC</label>
      </div>
    </fieldset>
    <ul class="pref-results" aria-live="polite"></ul>
  `;

  const partySelect = element.querySelector(`#${uid}-party`);
  const zoneInputs = Array.from(element.querySelectorAll('input[data-zone]'));
  const quietInput = element.querySelector('input[data-pref="quiet"]');
  const privateInput = element.querySelector('input[data-pref="private"]');
  const avoidWcInput = element.querySelector('input[data-pref="avoidWc"]');
  const resultList = element.querySelector('.pref-results');

  /**
   * Lit l'état courant des contrôles et le traduit en préférences du moteur.
   * @returns {{ partySize: number, zone: string | null, features: string[], quiet: boolean,
   *   avoidWc: boolean }} Préférences courantes.
   */
  function readPrefs() {
    const activeZone = zoneInputs.find((input) => input.checked);
    return {
      partySize: Number(partySelect.value) || PARTY_SIZES[0],
      zone: activeZone ? activeZone.dataset.zone : null,
      features: privateInput.checked ? [TABLE_FEATURES.PRIVATE] : [],
      quiet: quietInput.checked,
      avoidWc: avoidWcInput.checked,
    };
  }

  /**
   * Affiche la liste courte des recommandations et met en évidence toutes les tables éligibles.
   * @param {Array<{ table: Object, score: number, reasons: string[] }>} matches Correspondances triées.
   * @returns {void}
   */
  function render(matches) {
    resultList.replaceChildren();

    if (matches.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'pref-empty';
      empty.textContent = 'Aucune table disponible pour ces critères — élargissez la recherche';
      resultList.appendChild(empty);
      notify([]);
      return;
    }

    for (const match of matches.slice(0, MAX_RESULTS)) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pref-result';
      button.dataset.id = match.table.id;
      button.title = match.reasons.join(' · ');
      button.textContent = `${describeTable(match.table)} · ${match.score} pts`;
      item.appendChild(button);
      resultList.appendChild(item);
    }

    if (!initialRender) notify(matches.map((match) => match.table.id));
  }

  /**
   * Recalcule les recommandations depuis les tables vivantes et l'état courant des contrôles.
   * @returns {void}
   */
  function refresh() {
    const tables = readTables();
    render(findMatchingTables(Array.isArray(tables) ? tables : [], readPrefs()));
  }

  /**
   * Applique l'exclusivité des zones et synchronise `aria-pressed`, puis recalcule.
   * @param {Event} event Événement `change` d'un contrôle du panneau.
   * @returns {void}
   */
  function handleChange(event) {
    const target = event.target;
    if (target.matches('input[data-zone]')) {
      for (const input of zoneInputs) {
        if (input !== target) input.checked = false;
        input.setAttribute('aria-pressed', String(input.checked));
      }
    } else if (target.matches('input[data-pref]')) {
      target.setAttribute('aria-pressed', String(target.checked));
    }
    refresh();
  }

  element.addEventListener('change', handleChange);
  resultList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (button) notify([button.dataset.id]);
  });

  host.appendChild(element);
  refresh();
  initialRender = false;

  return { element, refresh };
}
