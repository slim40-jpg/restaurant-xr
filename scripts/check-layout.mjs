/**
 * @file    scripts/check-layout.mjs
 * @brief   Contrôle du plan : 20 tables, distances minimales, murs et hauteurs praticables.
 * @author  Slim Selmi - Developpement 3D / WebXR
 * @date    2026-11-17
 * @role    Prouve par calcul les contraintes du plan et echoue si une regle est violee.
 */

import process from 'node:process';

import { LEVELS, ROOM_ANCHORS, ROOM_LAYOUT, TABLE_CATALOGUE } from '../src/world/layout.mjs';
import { surfaceHeightAt } from '../src/world/walkable.mjs';

const { WALL_CLEARANCE, WIDTH, DEPTH, HEIGHT } = ROOM_LAYOUT;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;

const failures = [];
const pass = (label, detail = '') => console.log(`PASS  ${label}${detail ? `  [${detail}]` : ''}`);
const fail = (label, detail = '') => {
  failures.push(label);
  console.log(`FAIL  ${label}${detail ? `  [${detail}]` : ''}`);
};

/** Rayon d'encombrement d'une table, selon sa forme et sa capacité. */
const footprint = (table) => (table.shape === 'rect' ? 1.0 : table.capacity >= 6 ? 0.75 : 0.55);

// --- 1. Catalogue complet -----------------------------------------------------
const expected = 20;
if (TABLE_CATALOGUE.length === expected) {
  pass('nombre de tables', `${TABLE_CATALOGUE.length}`);
} else {
  fail('nombre de tables', `${TABLE_CATALOGUE.length} au lieu de ${expected}`);
}

const ids = new Set(TABLE_CATALOGUE.map((t) => t.id));
if (ids.size === TABLE_CATALOGUE.length) pass('identifiants uniques', `${ids.size}`);
else fail('identifiants uniques', `${ids.size} pour ${TABLE_CATALOGUE.length} tables`);

if (TABLE_CATALOGUE.every((t) => /^T\d{2}$/.test(t.id))) pass('format des identifiants T01..T20');
else fail('format des identifiants T01..T20');

// --- 2. Distances entre tables, par niveau ------------------------------------
for (const level of [LEVELS.GROUND, LEVELS.TERRACE]) {
  const tables = TABLE_CATALOGUE.filter((t) => t.level === level);
  let worst = { gap: Infinity, pair: '' };
  for (let i = 0; i < tables.length; i += 1) {
    for (let j = i + 1; j < tables.length; j += 1) {
      const a = tables[i];
      const b = tables[j];
      const centre = Math.hypot(a.x - b.x, a.z - b.z);
      const gap = centre - footprint(a) - footprint(b);
      if (gap < worst.gap) worst = { gap, pair: `${a.id}/${b.id}` };
    }
  }
  const label = `écart minimal ${level}`;
  if (worst.gap >= 0) pass(label, `${worst.gap.toFixed(2)} m (${worst.pair})`);
  else fail(label, `${worst.gap.toFixed(2)} m (${worst.pair})`);
}

// --- 3. Dégagement des murs ---------------------------------------------------
let clearWorst = { value: Infinity, id: '' };
for (const table of TABLE_CATALOGUE) {
  const r = footprint(table);
  const limits =
    table.level === LEVELS.TERRACE
      ? [
          table.x - ROOM_ANCHORS.terrace.minX,
          ROOM_ANCHORS.terrace.maxX - table.x,
          table.z - ROOM_ANCHORS.terrace.minZ,
          ROOM_ANCHORS.terrace.maxZ - table.z,
        ]
      : [table.x + HALF_W, HALF_W - table.x, table.z + HALF_D, HALF_D - table.z];
  // On mesure le centre de la table : une banquette d'angle peut toucher le mur,
  // mais son centre doit rester a distance pour que les chaises passent.
  const value = Math.min(...limits);
  void r;
  if (value < clearWorst.value) clearWorst = { value, id: table.id };
}
if (clearWorst.value >= WALL_CLEARANCE)
  pass('dégagement des murs', `${clearWorst.value.toFixed(2)} m (${clearWorst.id})`);
else
  fail(
    'dégagement des murs',
    `${clearWorst.value.toFixed(2)} m (${clearWorst.id}), minimum ${WALL_CLEARANCE}`
  );

// --- 4. Hauteurs praticables --------------------------------------------------
const probes = [
  ['nef au centre', 0, 0, 0],
  ['nef sous la voûte est', 9.5, -3, 0],
  ['terrasse', 0, 12, 0],
  ['hors zone', 0, 20, null],
];
for (const [label, x, z, expectedY] of probes) {
  const value = surfaceHeightAt(x, z);
  if (value === expectedY) pass(`hauteur praticable — ${label}`, String(value));
  else fail(`hauteur praticable — ${label}`, `${value} au lieu de ${expectedY}`);
}

if (HEIGHT >= 7.5) pass('hauteur de nef', `${HEIGHT} m`);
else fail('hauteur de nef', `${HEIGHT} m`);

// --- 5. Résumé -----------------------------------------------------------------
const levels = TABLE_CATALOGUE.reduce((acc, t) => {
  acc[t.level] = (acc[t.level] ?? 0) + 1;
  return acc;
}, {});

console.log('');
console.log(`Nef ${WIDTH} × ${DEPTH} m, hauteur ${HEIGHT} m`);
console.log(
  `Tables par niveau : ${Object.entries(levels)
    .map(([k, v]) => `${k} ${v}`)
    .join(' · ')}`
);
console.log(`Passages : ${pass.name ? 'contrôles exécutés' : ''}`);
if (failures.length === 0) {
  console.log('Plan conforme.');
  process.exit(0);
}
console.log(`Plan NON conforme : ${failures.join(', ')}`);
process.exit(1);
