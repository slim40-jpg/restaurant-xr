/**
 * @file    src/interaction/controls.js
 * @brief   Contrôles caméra à la souris pour une utilisation sans casque.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-11
 * @role    Fournit un OrbitControls borné et le neutralise pendant une session WebXR.
 */

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Crée des contrôles orbitaux cadrés sur la salle et ses six tables.
 * Les bornes de distance et d'angle empêchent de traverser le sol ou de sortir de la
 * pièce, ce qui garde la scène lisible quel que soit le geste de l'utilisateur.
 * @param {THREE.PerspectiveCamera} camera Caméra pilotée par les contrôles.
 * @param {HTMLElement} domElement Élément recevant les événements de la souris (le canvas).
 * @returns {OrbitControls} Contrôles orbitaux configurés et mis à jour une première fois.
 */
export function createOrbitControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);

  // Cible au centre de la salle : cadre les tables sans demander de réglage manuel.
  controls.target.set(0, 1.4, -2);
  controls.enableDamping = true;
  // Amortissement doux : évite les à-coups qui donnent une impression de caméra cassée.
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.5;
  controls.maxDistance = 9;
  // Jamais sous le sol : un angle polaire proche de PI placerait la caméra sous le plancher.
  controls.maxPolarAngle = Math.PI * 0.49;
  // Pas de pan : le panoramique désorienterait l'utilisateur et sortirait du cadre.
  controls.enablePan = false;

  controls.update();

  return controls;
}

/**
 * Désactive les contrôles pendant une session immersive et les réactive à la sortie.
 * En VR la pose de la caméra est imposée par le casque : laisser OrbitControls actif
 * provoquerait un conflit d'écriture sur la même caméra à chaque frame.
 * @param {THREE.WebGPURenderer} renderer Renderer exposant `xr` (source des événements).
 * @param {OrbitControls} controls Contrôles à activer/désactiver.
 * @returns {void}
 */
export function bindControlsToXR(renderer, controls) {
  renderer.xr.addEventListener('sessionstart', () => {
    controls.enabled = false;
  });

  renderer.xr.addEventListener('sessionend', () => {
    controls.enabled = true;
  });
}
