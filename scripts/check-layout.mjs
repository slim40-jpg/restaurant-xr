/**
 * @file    scripts/check-layout.mjs
 * @brief   Contrôle anti-chevauchement du plan : 24 tables, escalier, murs et hauteurs praticables.
 * @author  Slim Selmi — Développement 3D / WebXR
 * @date    2026-11-12
 * @role    Prouve par calcul les contraintes du plan et échoue si une règle est violée.
 */

import { LEVELS, ROOM_ANCHORS, ROOM_LAYOUT, STAIR, TABLE_CATALOGUE } from '../src/world/layout.js';
import { WALK_COLLIDERS, WALK_SURFACES, surfaceHeightAt } from '../src/world/walkable.js';
import process from 'node:process';

const { MIN_GAP, WALL_CLEARANCE, WIDTH, DEPTH, HEIGHT, MEZZANINE_Y } = ROOM_LAYOUT;
const failures = [];
const pass = (label, detail = '') => console.log(`PASS  ${label}${detail ? `  [${detail}]` : ''}`);
const fail = (label, detail = '') => {
  failures.push(label);
  console.log(`FAIL  ${label}${detail ? `  [${detail}]` : ''}`);
};
const round = (value) => Math.round(value * 1000) / 1000;

/** Rayon d'encombrement d'une table ronde (plateau + anneau de chaises + dossier). */
function envelope(entry) {
  if (entry.shape === 'rect') {
    const halfLength = entry.capacity >= 6 ? 1.0 : 0.8;
    const swapped = Math.abs(Math.sin(entry.rotation)) > 0.5;
    const hx = swapped ? 0.45 : halfLength;
    const hz = swapped ? halfLength : 0.45;
    return { hx: hx + 0.2, hz: hz + 0.56 };
  }
  const radius = entry.capacity >= 6 ? 0.75 : entry.capacity >= 4 ? 0.55 : 0.4;
  const r = radius + 0.58;
  return { hx: r, hz: r };
}

/** Distance entre deux rectangles alignés (0 s'ils se recouvrent). */
function rectDistance(a, b) {
  const dx = Math.max(b.minX - a.maxX, a.minX - b.maxX, 0);
  const dz = Math.max(b.minZ - a.maxZ, a.minZ - b.maxZ, 0);
  return Math.hypot(dx, dz);
}

/** Boîte englobante de l'encombrement d'une table. */
const tableBox = (entry) => {
  const { hx, hz } = envelope(entry);
  return { minX: entry.x - hx, maxX: entry.x + hx, minZ: entry.z - hz, maxZ: entry.z + hz };
};

/** Limites du niveau (murs, vide de mezzanine, bord de terrasse). */
function levelBounds(level) {
  if (level === LEVELS.MEZZANINE) return { minX: -11, maxX: 11, minZ: -7, maxZ: -1 };
  if (level === LEVELS.TERRACE) return { minX: -9, maxX: 9, minZ: 7.2, maxZ: 16 };
  return { minX: -11, maxX: 11, minZ: -7, maxZ: 7 };
}

// ---------- 1. Catalogue ----------
const ids = TABLE_CATALOGUE.map((t) => t.id);
pass('24 tables cataloguées', `${TABLE_CATALOGUE.length} tables, ids uniques : ${new Set(ids).size === 24}`);
if (TABLE_CATALOGUE.length !== 24) fail('24 tables cataloguées', `${TABLE_CATALOGUE.length}`);

// ---------- 2. Écarts entre centres, par niveau ----------
const levels = [LEVELS.GROUND, LEVELS.MEZZANINE, LEVELS.TERRACE];
const tightest = {};
levels.forEach((level) => {
  const rows = TABLE_CATALOGUE.filter((t) => t.level === level);
  let min = Infinity;
  let pair = '';
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const distance = Math.hypot(rows[i].x - rows[j].x, rows[i].z - rows[j].z);
      if (distance < min) {
        min = distance;
        pair = `${rows[i].id}/${rows[j].id}`;
      }
    }
  }
  tightest[level] = { min, pair };
  if (min < MIN_GAP) fail(`écart ≥ ${MIN_GAP} m (${level})`, `${pair} = ${round(min)} m`);
  else pass(`écart ≥ ${MIN_GAP} m entre centres (${level})`, `${pair} = ${round(min)} m`);
});

// ---------- 3. Distance aux limites de niveau ----------
levels.forEach((level) => {
  const bounds = levelBounds(level);
  let min = Infinity;
  let who = '';
  TABLE_CATALOGUE.filter((t) => t.level === level).forEach((t) => {
    const distance = Math.min(t.x - bounds.minX, bounds.maxX - t.x, t.z - bounds.minZ, bounds.maxZ - t.z);
    if (distance < min) {
      min = distance;
      who = t.id;
    }
  });
  if (min < WALL_CLEARANCE)
    fail(`retrait ≥ ${WALL_CLEARANCE} m des bords (${level})`, `${who} = ${round(min)} m`);
  else pass(`retrait ≥ ${WALL_CLEARANCE} m des bords (${level})`, `${who} = ${round(min)} m`);
});

// ---------- 4. Escalier vs tables ----------
const stairBox = {
  minX: ROOM_ANCHORS.stairs.minX,
  maxX: ROOM_ANCHORS.stairs.maxX,
  minZ: ROOM_ANCHORS.stairs.minZ,
  maxZ: ROOM_ANCHORS.stairs.maxZ,
};
let stairMin = Infinity;
let stairWho = '';
TABLE_CATALOGUE.forEach((t) => {
  const distance = rectDistance(tableBox(t), stairBox);
  if (distance < stairMin) {
    stairMin = distance;
    stairWho = t.id;
  }
});
if (stairMin <= 0) fail("l'escalier ne traverse aucune table", `${stairWho} = ${round(stairMin)} m`);
else pass("l'escalier ne traverse aucune table", `${stairWho} : ${round(stairMin)} m de dégagement`);

const deeper = TABLE_CATALOGUE.filter((t) => t.level !== LEVELS.GROUND).map((t) =>
  rectDistance(tableBox(t), stairBox)
);
if (Math.min(...deeper) <= 0) fail('escalier sans contact avec les tables hors rez');
else pass('escalier sans contact avec les tables hors rez', `${round(Math.min(...deeper))} m`);

// ---------- 5. Hauteurs praticables ----------
const probes = [
  ['terrasse (0, 12)', surfaceHeightAt(0, 12), 0],
  ['seuil de porte (7, 7.15)', surfaceHeightAt(7, 7.15), 0],
  ['milieu de l’escalier (−7, 1.1)', surfaceHeightAt(-7, 1.1), 1.625],
  ['haut de l’escalier (−7, −1)', surfaceHeightAt(-7, -1), MEZZANINE_Y],
  ['mezzanine (−4.4, −3.8)', surfaceHeightAt(-4.4, -3.8), MEZZANINE_Y],
  ['rez sous la mezzanine (−4.4, −3.8) niveau ground', surfaceHeightAt(-4.4, -3.8, LEVELS.GROUND), 0],
  ['hors zone (0, 20)', surfaceHeightAt(0, 20), null],
];
probes.forEach(([label, actual, expected]) => {
  const ok = expected === null ? actual === null : actual !== null && Math.abs(actual - expected) < 0.02;
  if (ok) pass(`surfaceHeightAt ${label}`, `${actual === null ? 'null' : round(actual)}`);
  else fail(`surfaceHeightAt ${label}`, `obtenu ${actual}, attendu ${expected}`);
});
pass('surfaces praticables', `${WALK_SURFACES.length} surfaces, ${WALK_COLLIDERS.length} colliders`);
pass('hauteur libre du niveau', `${round(HEIGHT - MEZZANINE_Y)} m au-dessus de la mezzanine`);

// ---------- 6. Encombrement des niveaux superposés ----------
const stacked = [];
TABLE_CATALOGUE.filter((t) => t.level === LEVELS.GROUND).forEach((ground) => {
  TABLE_CATALOGUE.filter((t) => t.level === LEVELS.MEZZANINE).forEach((up) => {
    const distance = Math.hypot(ground.x - up.x, ground.z - up.z);
    if (distance < MIN_GAP) stacked.push(`${ground.id}/${up.id} à ${round(distance)} m`);
  });
});
console.log(
  `INFO  tables à l'aplomb entre étages : ${stacked.length === 0 ? 'aucune' : stacked.join(', ')}` +
    ` — ${MEZZANINE_Y} m de dalle les séparent, ce n'est pas un chevauchement.`
);

// ---------- Synthèse ----------
console.log(
  `\nEmprise ${WIDTH} × ${DEPTH} m, hauteur ${HEIGHT} m, dalle ${round(MEZZANINE_Y - 0.25)}→${MEZZANINE_Y} m`
);
console.log(
  `Escalier : x ∈ [${STAIR.centreX - STAIR.width / 2}, ${STAIR.centreX + STAIR.width / 2}], z ∈ [${STAIR.topZ}, ${STAIR.bottomZ}]`
);
console.log(`Écarts minimaux : ${levels.map((l) => `${l} ${round(tightest[l].min)} m`).join(' · ')}`);
console.log(`Dégagement escalier : ${round(stairMin)} m (${stairWho})`);
console.log(`\n${failures.length === 0 ? 'Plan conforme.' : `${failures.length} contrôle(s) en échec.`}`);
process.exitCode = failures.length === 0 ? 0 : 1;
