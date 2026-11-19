/**
 * @file    src/core/scene.mjs
 * @brief   Scène, caméra et éclairage « bistrot le soir » sur deux niveaux et en terrasse.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-12
 * @role    Initialise le graphe de scène et les lumières consommés par le rendu et la WebXR.
 */

import * as THREE from 'three';

import { EYE_HEIGHT, FAR, FOV, NEAR, SCENE_BACKGROUND_COLOR } from '../config/constants.mjs';

/** Couleur des lampes intérieures et de la terrasse. */
const WARM = 0xffb46b;

/**
 * Crée la scène et la caméra perspective positionnée à hauteur des yeux.
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }} La scène et sa caméra.
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);

  const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, NEAR, FAR);
  camera.position.set(0, EYE_HEIGHT, 0);

  return { scene, camera };
}

/**
 * Ajoute l'éclairage du lieu : jour froid venu de la baie, lampes chaudes au rez-de-chaussée,
 * à l'étage et sur la terrasse. La terrasse ne reçoit que deux ponctuelles : les guirlandes
 * du jardin sont émissives, jamais lumineuses, pour tenir le budget de rendu.
 * @param {THREE.Scene} scene Scène à éclairer.
 * @returns {void}
 */
export function addLighting(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.32));
  scene.add(new THREE.HemisphereLight(0x9fb6d8, 0x3a2a1c, 0.55));

  // Lumière froide de la baie (X négatif) : source principale et ombres portées. La carte
  // couvre désormais la terrasse (z jusqu'à 16) : 26 m de côté et 60 m de portée.
  const daylight = new THREE.DirectionalLight(0xbdd2ec, 1.15);
  daylight.position.set(-18, 11, 8);
  daylight.target.position.set(0, 0, 3);
  daylight.castShadow = true;
  daylight.shadow.mapSize.set(2048, 2048);
  daylight.shadow.camera.left = -26;
  daylight.shadow.camera.right = 26;
  daylight.shadow.camera.top = 24;
  daylight.shadow.camera.bottom = -24;
  daylight.shadow.camera.near = 1;
  daylight.shadow.camera.far = 60;
  daylight.shadow.bias = -0.0002;
  daylight.shadow.normalBias = 0.14;
  scene.add(daylight);
  scene.add(daylight.target);

  // Lampes chaudes : [x, y, z, intensité, portée]. Posées à 0,4–0,8 m du plafond pour éviter
  // la tache blanche qu'une lampe collée à la dalle produisait au-dessus des tables.
  [
    [-8.5, 2.5, -1.0, 7, 11],
    [-2.5, 2.5, -5.0, 7, 11],
    [8.0, 2.5, 2.0, 7, 11],
    [0.0, 4.6, 2.4, 12, 15],
    [-6.5, 5.6, -3.6, 7, 11],
    [1.5, 5.6, -3.6, 7, 11],
    [8.0, 5.6, -3.2, 6, 10],
    [-4.0, 2.4, 11.6, 9, 10],
    [3.4, 2.4, 13.4, 8, 10],
  ].forEach(([x, y, z, intensity, distance]) => {
    const lamp = new THREE.PointLight(WARM, intensity, distance, 2);
    lamp.position.set(x, y, z);
    scene.add(lamp);
  });
}
