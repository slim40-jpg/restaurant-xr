/**
 * @file    src/world/textures.js
 * @brief   Textures de carrelage générées en canvas : mosaïque hexagonale et carreaux.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Fournir des motifs au décor sans aucune image externe.
 */

import * as THREE from 'three/webgpu';

/**
 * Dessine un carrelage répétable et le renvoie sous forme de texture.
 *
 * Aucune texture externe n'est utilisée dans le projet : les motifs sont dessinés en
 * code, ce qui garde le rendu identique hors-ligne et évite tout problème de licence.
 *
 * @param {string[]} palette Couleurs des carreaux, appliquées en damier.
 * @param {number} cells Nombre de carreaux par côté du motif.
 * @param {'hex'|'square'} shape Forme du motif.
 * @returns {THREE.CanvasTexture} Texture prête pour un matériau standard.
 */
export function makeTileTexture(palette, cells, shape) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Joint sombre visible entre les carreaux.
  ctx.fillStyle = '#cfc6b4';
  ctx.fillRect(0, 0, size, size);

  const step = size / cells;
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.fillStyle = palette[(x + y) % palette.length];

      if (shape === 'square') {
        ctx.fillRect(x * step + 1, y * step + 1, step - 2, step - 2);
        continue;
      }

      const cx = x * step + step / 2;
      const cy = y * step + step / 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const px = cx + (step / 2 - 1) * Math.cos(angle);
        const py = cy + (step / 2 - 1) * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
