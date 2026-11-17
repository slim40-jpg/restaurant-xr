/**
 * @file    src/config/menu.js
 * @brief   Données pures du menu de démonstration, sans DOM ni dépendance Three.js.
 * @author  Hazem Bellili — Intégration assets / UI
 * @date    2026-11-17
 * @role    Fournir les sections, les plats, les prix et les tags affichés par la fiche de table.
 *
 * Menu fictif de démonstration : aucun plat, prix ou provenance ne prétend refléter
 * une carte réelle. Les valeurs servent uniquement à illustrer l'interface.
 */

/** Sections du menu, dans l'ordre d'affichage. */
export const MENU_COURSES = Object.freeze([
  { id: 'entrees', label: 'Entrées' },
  { id: 'plats', label: 'Plats' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'boissons', label: 'Boissons' },
]);

/**
 * Plats du menu fictif. `course` référence toujours un `MENU_COURSES.id`.
 * `tags` sont des clés françaises destinées à l'affichage ou au filtrage futur.
 */
export const MENU_ITEMS = Object.freeze([
  {
    id: 'salade-mechouia',
    course: 'entrees',
    name: 'Salade méchouia',
    description: 'Poivrons et tomates grillés, thon, œuf dur',
    price: 8.5,
    tags: ['epice'],
  },
  {
    id: 'bruschetta',
    course: 'entrees',
    name: 'Bruschetta tomate-basilic',
    description: 'Pain grillé, tomates confites, basilic frais',
    price: 9.5,
    tags: ['vegetarien'],
  },
  {
    id: 'soupe-du-jour',
    course: 'entrees',
    name: 'Soupe du jour',
    description: 'Légumes de saison, croûtons maison',
    price: 7,
    tags: ['vegetarien'],
  },
  {
    id: 'brik-a-l-oeuf',
    course: 'entrees',
    name: "Brik à l'œuf",
    description: 'Feuille de malsouka, œuf, thon, câpres',
    price: 6.5,
    tags: ['signature'],
  },
  {
    id: 'couscous-poisson',
    course: 'plats',
    name: 'Couscous au poisson',
    description: 'Semoule, dorade, légumes de saison, harissa',
    price: 26,
    tags: ['signature', 'epice'],
  },
  {
    id: 'entrecote',
    course: 'plats',
    name: 'Entrecôte grillée',
    description: "300 g, beurre maître d'hôtel, frites maison",
    price: 28,
    tags: ['sans-gluten'],
  },
  {
    id: 'risotto-cepes',
    course: 'plats',
    name: 'Risotto aux cèpes',
    description: 'Riz carnaroli, cèpes, parmesan',
    price: 21,
    tags: ['vegetarien'],
  },
  {
    id: 'dorade-grillee',
    course: 'plats',
    name: 'Dorade grillée',
    description: "Filet entier, citron, huile d'olive",
    price: 24,
    tags: ['sans-gluten'],
  },
  {
    id: 'poulet-citron-olive',
    course: 'plats',
    name: 'Poulet rôti citron-olive',
    description: 'Demi-poulet, citron confit, olives',
    price: 19.5,
    tags: ['signature'],
  },
  {
    id: 'tarte-fine-pommes',
    course: 'desserts',
    name: 'Tarte fine aux pommes',
    description: 'Pâte feuilletée, pommes caramélisées',
    price: 8,
    tags: ['vegetarien'],
  },
  {
    id: 'fondant-chocolat',
    course: 'desserts',
    name: 'Fondant au chocolat',
    description: 'Cœur coulant, crème vanillée',
    price: 9,
    tags: ['vegetarien'],
  },
  {
    id: 'salade-oranges',
    course: 'desserts',
    name: "Salade d'oranges",
    description: "Orange, cannelle, fleur d'oranger",
    price: 7,
    tags: ['vegetarien', 'sans-gluten'],
  },
  {
    id: 'citronnade-menthe',
    course: 'boissons',
    name: 'Citronnade à la menthe',
    description: 'Citron pressé, menthe fraîche',
    price: 5,
    tags: ['vegetarien', 'sans-gluten'],
  },
  {
    id: 'the-menthe',
    course: 'boissons',
    name: 'Thé à la menthe',
    description: 'Thé vert, menthe, pignons',
    price: 4,
    tags: ['vegetarien', 'sans-gluten'],
  },
  {
    id: 'vin-rouge',
    course: 'boissons',
    name: 'Vin rouge (verre)',
    description: 'Rouge de Tunisie, 12 cl',
    price: 9,
    tags: ['sans-gluten'],
  },
  {
    id: 'eau-minerale',
    course: 'boissons',
    name: 'Eau minérale',
    description: '50 cl, plate ou pétillante',
    price: 3,
    tags: ['sans-gluten'],
  },
]);

/**
 * Formate un prix en dinars avec la virgule décimale française.
 * @param {number} value Montant en dinars.
 * @returns {string} Prix du type `9,50 DT`, ou `—` si le montant n'est pas numérique.
 */
export function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toFixed(2).replace('.', ',')} DT`;
}

/**
 * Liste les plats d'une section, dans l'ordre de `MENU_ITEMS`.
 * @param {string} courseId Identifiant de section (`entrees`, `plats`, `desserts`, `boissons`).
 * @returns {Array<Object>} Plats dont `course` correspond à `courseId` (vide si inconnu).
 */
export function itemsByCourse(courseId) {
  return MENU_ITEMS.filter((item) => item.course === courseId);
}
