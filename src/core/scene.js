/**
 * @file    src/core/scene.js
 * @brief   Création de la scène, de la caméra et de l'éclairage « bistrot le soir ».
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
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
 * Ajoute l'éclairage de la salle : ambiance basse, lumière froide de la baie vitrée et
 * lampes chaudes ponctuelles au-dessus des zones.
 * @param {THREE.Scene} scene Scène à éclairer.
 * @returns {void}
 */
export function addLighting(scene) {
  // Ambiante faible et hémisphérique pour garder les ombres lisibles sans écraser le décor.
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));
  scene.add(new THREE.HemisphereLight(0x9fb6d8, 0x3a2a1c, 0.5));

  // Lumière froide venant de la baie vitrée (X négatif) : source principale et ombres.
  const windowLight = new THREE.DirectionalLight(0xbdd2ec, 1.5);
  windowLight.position.set(-14, 6, 2);
  windowLight.target.position.set(2, 0, -1);
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(2048, 2048);
  windowLight.shadow.camera.left = -14;
  windowLight.shadow.camera.right = 14;
  windowLight.shadow.camera.top = 10;
  windowLight.shadow.camera.bottom = -10;
  windowLight.shadow.camera.near = 1;
  windowLight.shadow.camera.far = 40;
  windowLight.shadow.bias = -0.0002;
  // Biais de normale élevé + carte 2048 : la boîte d'ombre couvre 28 m, et une
  // résolution insuffisante produisait des traînées diagonales sur les murs.
  windowLight.shadow.normalBias = 0.14;
  windowLight.shadow.mapSize.set(2048, 2048);
  scene.add(windowLight);
  scene.add(windowLight.target);

  // Lampes chaudes au-dessus des zones (fenêtre, centre, banquette, bar).
  // Posées à 2,5 m et non 2,9 m : à 50 cm du plafond, une lampe ponctuelle
  // produisait une tache blanche écrasée au-dessus de la salle.
  const warm = 0xffb46b;
  [
    [-8.5, 2.5, -1.0, 8],
    [0, 2.5, 0.5, 9],
    [-2.5, 2.5, -5.0, 7],
    [8.0, 2.5, 2.0, 8],
  ].forEach(([x, y, z, intensity]) => {
    const lamp = new THREE.PointLight(warm, intensity, 11, 2);
    lamp.position.set(x, y, z);
    scene.add(lamp);
  });
}
