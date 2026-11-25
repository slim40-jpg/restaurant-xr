/**
 * @file    src/world/table-colors.mjs
 * @brief   Applique la couleur d'état aux tables (vert / jaune / rouge).
 * @author  Slim Selmi
 * @date    2026-11-25
 * @role    Isole la peinture des matériaux dans le module monde.
 */

const COLORS = {
  free: 0x22c55e,     // Vert
  reserved: 0xeab308, // Jaune
  occupied: 0xef4444, // Rouge
};

export function applyTableStateColors(tablesGroup, states = null) {
  for (const child of tablesGroup.children) {
    const id = child.userData?.id;
    if (id === undefined) continue;

    if (states && states.has(id)) {
      child.userData.state = states.get(id);
    }

    const state = child.userData.state ?? 'free';
    const color = COLORS[state] ?? COLORS.free;

    // Finds the actual mesh to color (assuming tables are meshes or groups of meshes)
    const targets = [];
    child.traverse((node) => {
      if (node.isMesh && node.material && !Array.isArray(node.material)) {
        targets.push(node);
      }
    });

    for (const mesh of targets) {
      // We only color the tabletop, leaving the metal base alone
      if (mesh.material.name !== 'table_base') {
        mesh.material.color.setHex(color);
        mesh.material.needsUpdate = true;
      }
    }
  }
}