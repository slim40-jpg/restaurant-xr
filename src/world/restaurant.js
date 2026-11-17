/**
 * @file    src/world/restaurant.js
 * @brief   Assemblage du lieu : architecture, décor intérieur, jardin et 24 tables sur trois niveaux.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-12
 * @role    Compose le graphe 3D du restaurant sans l'ajouter lui-même à la scène.
 */

import * as THREE from 'three';

import { createArchitecture } from './architecture.js';
import { createDecor } from './decor.js';
import { createElNacional } from './elnacional.js';
import { createEnvironment } from './environment.js';
import { createTable } from './furniture.js';
import { createGarden } from './garden.js';
import { LEVEL_HEIGHT, LEVELS, TABLE_CATALOGUE } from './layout.js';
import { createProps } from './props.js';

/**
 * Construit le groupe du restaurant et le groupe des tables sélectionnables.
 *
 * L'architecture est imbriquée dans le groupe d'environnement : un seul groupe
 * `isEnvironment` masque alors toute la coquille quand la caméra doit s'effacer,
 * sans qu'aucun consommateur n'ait à connaître le découpage interne.
 *
 * @returns {{ restaurant: THREE.Group, tablesGroup: THREE.Group }} Le restaurant prêt pour la scène
 *   et son groupe de 24 tables.
 */
export function buildRestaurant() {
  const restaurant = new THREE.Group();
  const environment = createEnvironment();
  environment.userData.isEnvironment = true;
  environment.add(createArchitecture());

  const { garden, tables: terraceTables } = createGarden();
  restaurant.add(environment, garden, createProps(), createElNacional(), createDecor());

  const tablesGroup = new THREE.Group();
  TABLE_CATALOGUE.filter((entry) => entry.level !== LEVELS.TERRACE).forEach((entry) => {
    const table = createTable(entry);
    table.position.y = LEVEL_HEIGHT[entry.level];
    tablesGroup.add(table);
  });
  terraceTables.children.slice().forEach((table) => {
    tablesGroup.add(table);
  });
  restaurant.add(tablesGroup);

  return { restaurant, tablesGroup };
}
