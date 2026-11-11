/**
 * @file    src/world/restaurant.js
 * @brief   Assemblage du restaurant : enveloppe, accessoires fixes et tables du plan de salle.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Compose le graphe 3D du restaurant sans l'ajouter lui-même à la scène.
 */

import * as THREE from 'three';

import { createEnvironment } from './environment.js';
import { createTable } from './furniture.js';
import { TABLE_CATALOGUE } from './layout.js';
import { createProps } from './props.js';

/**
 * Construit le groupe du restaurant et le groupe des tables sélectionnables.
 * @returns {{ restaurant: THREE.Group, tablesGroup: THREE.Group }} Le restaurant prêt pour la scène
 *   et son groupe de tables.
 */
export function buildRestaurant() {
  const restaurant = new THREE.Group();
  restaurant.add(createEnvironment());
  restaurant.add(createProps());

  const tablesGroup = new THREE.Group();
  TABLE_CATALOGUE.forEach((entry) => {
    tablesGroup.add(createTable(entry));
  });
  restaurant.add(tablesGroup);

  return { restaurant, tablesGroup };
}
