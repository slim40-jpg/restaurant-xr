/**
 * @file    src/ui/status-panel-3d.js
 * @brief   Panneau d'état immersif dessiné sur un canvas puis projeté sur un plan Three.js.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-11
 * @role    Remplacer le panneau DOM en session VR tout en conservant son contrat d'interface.
 */

import * as THREE from 'three';

import {
  INITIAL_STATUS_MESSAGE,
  STATUS_LABELS_FR,
  STATUS_TEXT_COLORS,
  TABLE_STATUS,
} from '../config/constants.js';
import { formatTableAttributes } from '../interaction/recommend.js';

/** Géométrie du canvas en pixels, cadre arrondi, polices, interligne et lignes maximales. */
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 200;
const PADDING_X = 36;
const PADDING_Y = 24;
const BORDER_WIDTH = 3;
const BORDER_RADIUS = 24;
const MAX_FONT_SIZE = 30;
const MIN_FONT_SIZE = 20;
const LINE_HEIGHT_RATIO = 1.25;
const MAX_LINES = 3;
const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Trace un rectangle à coins arrondis dans le contexte courant. */
function roundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/** Découpe un texte en lignes selon la largeur disponible, en respectant les sauts explicites. */
function splitLines(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    let current = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/** Tronque un texte trop large en ajoutant une ellipse. */
function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(`${truncated.trimEnd()}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated.trimEnd()}…`;
}

/**
 * Choisit la taille de police et les lignes pour faire tenir le texte.
 * @param {CanvasRenderingContext2D} ctx Contexte 2D. @param {string} text Texte à disposer.
 * @param {number} maxWidth Largeur utile, en pixels. @param {number} maxHeight Hauteur utile.
 * @returns {{ lines: string[], lineHeight: number, fontSize: number }} Disposition retenue.
 */
function fitText(ctx, text, maxWidth, maxHeight) {
  for (let size = MAX_FONT_SIZE; size >= MIN_FONT_SIZE; size -= 2) {
    const lineHeight = size * LINE_HEIGHT_RATIO;
    ctx.font = `600 ${size}px ${FONT_STACK}`;
    const lines = splitLines(ctx, text, maxWidth);
    const fitsHeight = lines.length <= MAX_LINES && lines.length * lineHeight <= maxHeight;
    const fitsWidth = lines.every((line) => ctx.measureText(line).width <= maxWidth);
    if (fitsHeight && fitsWidth) return { lines, lineHeight, fontSize: size };
  }
  ctx.font = `600 ${MIN_FONT_SIZE}px ${FONT_STACK}`;
  const lineHeight = MIN_FONT_SIZE * LINE_HEIGHT_RATIO;
  const raw = splitLines(ctx, text, maxWidth);
  const kept = raw.slice(0, MAX_LINES);
  if (raw.length > MAX_LINES) kept[MAX_LINES - 1] += ` ${raw.slice(MAX_LINES).join(' ')}`;
  const lines = (kept.length > 0 ? kept : [text]).map((line) => ellipsize(ctx, line, maxWidth));
  return { lines, lineHeight, fontSize: MIN_FONT_SIZE };
}

/**
 * Redessine le cadre arrondi et le texte centré.
 * @param {CanvasRenderingContext2D} ctx Contexte 2D. @param {string} text Texte. @param {string} color Couleur.
 * @returns {void}
 */
function drawPanel(ctx, text, color) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const boxWidth = CANVAS_WIDTH - BORDER_WIDTH;
  const boxHeight = CANVAS_HEIGHT - BORDER_WIDTH;
  roundedRectPath(ctx, BORDER_WIDTH / 2, BORDER_WIDTH / 2, boxWidth, boxHeight, BORDER_RADIUS);
  ctx.fillStyle = 'rgba(10, 10, 22, 0.82)';
  ctx.fill();
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.stroke();
  const maxWidth = CANVAS_WIDTH - PADDING_X * 2;
  const maxHeight = CANVAS_HEIGHT - PADDING_Y * 2;
  const { lines, lineHeight, fontSize } = fitText(ctx, text, maxWidth, maxHeight);
  ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const startY = CANVAS_HEIGHT / 2 - (lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, startY + index * lineHeight);
  });
}

/**
 * Crée un panneau d'état lisible en VR, adossé à un plan orienté vers la caméra.
 * @param {{ position?: number[], size?: number[] }} [options] Position monde du plan et dimensions monde.
 * @returns {{ object3D: THREE.Mesh, setMessage: function, showTable: function, showReserved: function,
 *   showNoTarget: function, update: function }} Méthodes du panneau DOM, plus le maillage 3D.
 */
export function createWorldStatusPanel({ position = [0, 2.3, -5.85], size = [1.9, 0.6] } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const object3D = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  object3D.position.set(position[0], position[1], position[2]);
  object3D.renderOrder = 10;
  const cameraWorldPosition = new THREE.Vector3();
  /**
   * Affiche un message libre avec la couleur demandée.
   * @param {string} text Contenu textuel. @param {string} [color] Couleur CSS du texte.
   * @returns {void}
   */
  function setMessage(text, color = STATUS_TEXT_COLORS.neutral) {
    drawPanel(ctx, String(text), color);
    texture.needsUpdate = true;
  }

  /**
   * Affiche la table sélectionnée et son libellé d'état.
   * @param {{ id: string, status: string }} tableData Données de la table visée.
   * @returns {void}
   */
  function showTable(tableData) {
    const label = STATUS_LABELS_FR[tableData.status] || tableData.status;
    const attributes = formatTableAttributes(tableData);
    const heading = attributes ? `Table ${tableData.id} — ${attributes}` : `Table ${tableData.id}`;
    const { available, unavailableStatus } = STATUS_TEXT_COLORS;
    const color = tableData.status === TABLE_STATUS.AVAILABLE ? available : unavailableStatus;
    setMessage(`${heading}\n${label}`, color);
  }

  /**
   * Affiche la confirmation de réservation de la table qui vient d'être mutée.
   * @param {{ id: string }} tableData Données de la table réservée.
   * @returns {void}
   */
  function showReserved(tableData) {
    const text = `${tableData.id} — ${STATUS_LABELS_FR.available} → ${STATUS_LABELS_FR.reserved} !`;
    setMessage(text, STATUS_TEXT_COLORS.available);
  }

  /**
   * Signale qu'aucune table n'est visée par le rayon du contrôleur.
   * @returns {void}
   */
  function showNoTarget() {
    setMessage('Aucune table visée', STATUS_TEXT_COLORS.neutral);
  }

  /**
   * Oriente le panneau vers la position monde de la caméra pour qu'il reste lisible.
   * @param {THREE.Camera} camera Caméra en cours de rendu.
   * @returns {void}
   */
  function update(camera) {
    if (!camera) return;
    camera.getWorldPosition(cameraWorldPosition);
    object3D.lookAt(cameraWorldPosition);
  }

  setMessage(INITIAL_STATUS_MESSAGE);
  return { object3D, setMessage, showTable, showReserved, showNoTarget, update };
}
