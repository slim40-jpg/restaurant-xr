/**
 * @file    src/xr/ar-reticle.js
 * @brief   Réticule de visée AR : anneau posé sur la surface détectée par hit-test.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-11
 * @role    Isole la géométrie et la lecture de pose du hit-test, sans logique de session.
 */

import * as THREE from 'three/webgpu';

/**
 * Crée le réticule et l'ajoute à la scène.
 * @param {THREE.Scene} scene Scène recevant le réticule.
 * @returns {{
 *   mesh: THREE.Mesh,
 *   update: (frame: XRFrame|null, source: XRHitTestSource|null, space: XRReferenceSpace|null) => void,
 *   hide: () => void,
 *   dispose: () => void
 * }} Le maillage du réticule et ses commandes.
 */
export function createArReticle(scene) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.09, 0.12, 48),
    new THREE.MeshBasicMaterial({
      color: 0xb08d57,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  scene.add(mesh);

  return {
    mesh,

    /**
     * Positionne le réticule sur le premier résultat de hit-test de la frame.
     * @param {XRFrame|null} frame Frame XR courante.
     * @param {XRHitTestSource|null} source Source de hit-test active.
     * @param {XRReferenceSpace|null} space Espace de référence de la session.
     * @returns {void}
     */
    update(frame, source, space) {
      if (!source) return;
      const results = frame ? frame.getHitTestResults(source) : [];
      const pose = space && results.length > 0 ? results[0].getPose(space) : null;
      mesh.visible = Boolean(pose);
      if (!pose) return;
      const { position } = pose.transform;
      mesh.position.set(position.x, position.y + 0.001, position.z);
    },

    /** Masque le réticule sans le détruire. */
    hide() {
      mesh.visible = false;
    },

    /** Retire le réticule de la scène et libère ses ressources GPU. */
    dispose() {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    },
  };
}
