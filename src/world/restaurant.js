/**
 * @file    src/world/restaurant.js
 * @brief   Assemblage du restaurant : décor complet et tables issues de la disposition configurée.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-10
 * @role    Compose le graphe 3D du restaurant sans l'ajouter lui-même à la scène.
 */

import * as THREE from 'three';

import { TABLE_LAYOUT } from '../config/constants.js';
import { createEnvironment } from './environment.js';
import { createTable } from './furniture.js';

/**
 * Construit le groupe du restaurant et le groupe des tables sélectionnables.
 * @returns {{ restaurant: THREE.Group, tablesGroup: THREE.Group }} Le restaurant prêt pour la scène
 *   et son groupe de tables.
 */
export function buildRestaurant() {
  const restaurant = new THREE.Group();
  restaurant.add(createEnvironment());

  const tablesGroup = new THREE.Group();
  TABLE_LAYOUT.forEach(({ x, z, status }) => {
    tablesGroup.add(createTable(x, z, status));
  });
  restaurant.add(tablesGroup);

  return { restaurant, tablesGroup };
}
