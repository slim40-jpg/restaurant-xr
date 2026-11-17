/**
 * @file    src/ui/menu-list.js
 * @brief   Rendu DOM du menu par sections, réutilisé par la fiche de table.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-17
 * @role    Isoler la composition du menu pour garder `table-card.js` lisible.
 */

import { MENU_COURSES, formatPrice, itemsByCourse } from '../config/menu.js';

/**
 * Crée un plat sous forme de ligne `nom` / `description` / `prix`.
 * @param {{ name: string, description: string, price: number, tags?: string[] }} item Plat du menu.
 * @returns {HTMLLIElement} Ligne prête à être insérée dans une section.
 */
function createItemRow(item) {
  const row = document.createElement('li');
  row.className = 'tcard-item';

  const name = document.createElement('span');
  name.className = 'tcard-item-name';
  name.textContent = item.name;

  for (const tag of Array.isArray(item.tags) ? item.tags : []) {
    const badge = document.createElement('span');
    badge.className = 'tcard-item-tag';
    badge.textContent = tag;
    name.appendChild(badge);
  }

  const description = document.createElement('span');
  description.className = 'tcard-item-desc';
  description.textContent = item.description;

  const price = document.createElement('span');
  price.className = 'tcard-item-price';
  price.textContent = formatPrice(item.price);

  row.append(name, price, description);
  return row;
}

/**
 * Construit la liste complète du menu, une section par entrée de `MENU_COURSES`.
 * Les sections sans plat sont ignorées, sans laisser de titre orphelin.
 * @returns {HTMLDivElement} Conteneur `.tcard-menu` prêt à monter dans la fiche.
 */
export function createMenuList() {
  const root = document.createElement('div');
  root.className = 'tcard-menu';

  for (const course of MENU_COURSES) {
    const items = itemsByCourse(course.id);
    if (items.length === 0) continue;

    const section = document.createElement('section');
    section.className = 'tcard-course';

    const heading = document.createElement('h3');
    heading.className = 'tcard-course-title';
    heading.textContent = course.label;

    const list = document.createElement('ul');
    list.className = 'tcard-items';
    for (const item of items) list.appendChild(createItemRow(item));

    section.append(heading, list);
    root.appendChild(section);
  }

  return root;
}
