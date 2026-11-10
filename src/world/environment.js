/**
 * @file    src/world/environment.js
 * @brief   Construction du décor de la salle : sol, murs, plafond, tapis, tableaux et lampes.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-10
 * @role    Produit la coquille statique du restaurant, indépendante des tables et de la logique.
 */

import * as THREE from 'three';

import { ROOM } from '../config/constants.js';

/**
 * Crée le groupe de décor complet de la salle.
 * @returns {THREE.Group} Groupe contenant le sol, les murs, le plafond, le tapis, les tableaux et les lampes.
 */
export function createEnvironment() {
  const environment = new THREE.Group();

  // --- Sol (parquet) ---
  const floorGeo = new THREE.PlaneGeometry(ROOM.WIDTH, ROOM.DEPTH);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b, // Brun bois
    roughness: 0.7,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  environment.add(floor);

  // --- Murs (3 murs, côté ouvert vers l'utilisateur) ---
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.9 }); // Beige
  const wallHeight = ROOM.HEIGHT;

  // Mur du fond
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM.WIDTH, wallHeight, 0.2), wallMat);
  backWall.position.set(0, wallHeight / 2, -ROOM.DEPTH / 2);
  backWall.receiveShadow = true;
  environment.add(backWall);

  // Mur gauche
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallHeight, ROOM.DEPTH), wallMat);
  leftWall.position.set(-ROOM.WIDTH / 2, wallHeight / 2, 0);
  leftWall.receiveShadow = true;
  environment.add(leftWall);

  // Mur droit
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallHeight, ROOM.DEPTH), wallMat);
  rightWall.position.set(ROOM.WIDTH / 2, wallHeight / 2, 0);
  rightWall.receiveShadow = true;
  environment.add(rightWall);

  // --- Plafond ---
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.WIDTH, ROOM.DEPTH),
    new THREE.MeshStandardMaterial({ color: 0xf5f0e8, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallHeight;
  environment.add(ceiling);

  // --- Tapis central (décoration) ---
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 3),
    new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 1 }) // Rouge foncé
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.01, -2);
  carpet.receiveShadow = true;
  environment.add(carpet);

  // --- Tableaux aux murs ---
  const artMat1 = new THREE.MeshStandardMaterial({ color: 0x2e4053 });
  const art1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), artMat1);
  art1.position.set(-4, 2, -5.88);
  art1.castShadow = true;
  environment.add(art1);

  const artMat2 = new THREE.MeshStandardMaterial({ color: 0x922b21 });
  const art2 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.05), artMat2);
  art2.position.set(4, 2, -5.88);
  art2.castShadow = true;
  environment.add(art2);

  // --- Lampes suspendues ---
  environment.add(createLamp(-2, -1));
  environment.add(createLamp(2, -1));

  return environment;
}

/**
 * Assemble une lampe suspendue simplifiée (fil, abat-jour, ampoule, lumière ponctuelle).
 * @param {number} x Position horizontale de la lampe.
 * @param {number} z Position en profondeur de la lampe.
 * @returns {THREE.Group} Groupe de la lampe positionné à (x, 0, z).
 */
function createLamp(x, z) {
  const lampGroup = new THREE.Group();

  // Fil
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.8, 6),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  wire.position.y = 2.6;
  lampGroup.add(wire);

  // Abat-jour
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.3, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf5f5dc, side: THREE.DoubleSide })
  );
  shade.position.y = 2.2;
  lampGroup.add(shade);

  // Ampoule (émettrice)
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffaa44, emissiveIntensity: 1 })
  );
  bulb.position.y = 2.1;
  lampGroup.add(bulb);

  // Petite lumière ponctuelle
  const pointLight = new THREE.PointLight(0xffaa66, 0.5, 5);
  pointLight.position.y = 2.0;
  lampGroup.add(pointLight);

  lampGroup.position.set(x, 0, z);
  return lampGroup;
}
