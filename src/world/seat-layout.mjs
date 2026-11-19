/**
 * @file    src/world/seat-layout.mjs
 * @brief   Implantation des chaises autour d'un plateau, rond ou rectangulaire.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-17
 * @role    Isole la géométrie de placement pour garder `furniture.mjs` sous la limite de lignes.
 */

/**
 * Dispose `count` chaises régulièrement autour d'un plateau rond, tournées vers le centre.
 * @param {THREE.Group} group Groupe de la table.
 * @param {number} count Nombre de chaises.
 * @param {number} ringRadius Rayon du cercle d'implantation.
 * @param {() => THREE.Group} makeChair Fabrique de chaise.
 * @returns {void}
 */
export function ringChairs(group, count, ringRadius, makeChair) {
  const offset = Math.PI / count;
  for (let i = 0; i < count; i += 1) {
    const angle = offset + (i / count) * Math.PI * 2;
    const chair = makeChair();
    chair.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
    chair.rotation.y = Math.atan2(-Math.cos(angle), -Math.sin(angle));
    group.add(chair);
  }
}

/**
 * Dispose `count` chaises sur les deux grands côtés d'un plateau rectangulaire.
 * @param {THREE.Group} group Groupe de la table.
 * @param {number} count Nombre de chaises.
 * @param {number} halfLength Demi-longueur du plateau.
 * @param {number} halfBreadth Demi-largeur du plateau.
 * @param {() => THREE.Group} makeChair Fabrique de chaise.
 * @returns {void}
 */
export function sideChairs(group, count, halfLength, halfBreadth, makeChair) {
  const perSide = Math.max(1, Math.ceil(count / 2));
  const spacing = perSide > 1 ? (halfLength * 2 - 0.4) / (perSide - 1) : 0;
  let placed = 0;

  for (let i = 0; i < perSide && placed < count; i += 1) {
    const x = perSide > 1 ? -halfLength + 0.2 + i * spacing : 0;

    const front = makeChair();
    front.position.set(x, 0, halfBreadth + 0.36);
    front.rotation.y = Math.PI;
    group.add(front);
    placed += 1;

    if (placed < count) {
      const rear = makeChair();
      rear.position.set(x, 0, -(halfBreadth + 0.36));
      group.add(rear);
      placed += 1;
    }
  }
}
