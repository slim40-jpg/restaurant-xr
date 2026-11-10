/**
 * @file    src/core/scene.js
 * @brief   Création de la scène, de la caméra et de l'éclairage du restaurant.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-10
 * @role    Initialise le graphe de scène et les lumières consommés par le rendu et la WebXR.
 */

import * as THREE from 'three';

import { EYE_HEIGHT, FAR, FOV, NEAR, SCENE_BACKGROUND_COLOR } from '../config/constants.js';

/**
 * Crée la scène et la caméra perspective positionnée à hauteur des yeux.
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }} La scène et sa caméra.
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR); // Fond sombre bleu nuit

  const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
  camera.position.set(0, EYE_HEIGHT, 0); // Hauteur des yeux

  return { scene, camera };
}

/**
 * Ajoute l'éclairage de la salle : ambiante, principale (avec ombres) et appoint chaude.
 * @param {THREE.Scene} scene Scène à éclairer.
 * @returns {void}
 */
export function addLighting(scene) {
  // Lumière ambiante (éclairage de base)
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // Lumière principale (simule l'éclairage du plafond)
  const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
  mainLight.position.set(2, 5, 3);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(1024, 1024);
  mainLight.shadow.camera.left = -10;
  mainLight.shadow.camera.right = 10;
  mainLight.shadow.camera.top = 10;
  mainLight.shadow.camera.bottom = -10;
  scene.add(mainLight);

  // Lumière d'appoint chaude (simule l'ambiance de lampes)
  const fillLight = new THREE.PointLight(0xffaa66, 0.8, 15);
  fillLight.position.set(-3, 2.5, 2);
  scene.add(fillLight);
}
