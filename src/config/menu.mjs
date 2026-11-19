/**
 * @file    src/config/menu.mjs
 * @brief   Carte du restaurant : tapas, riz et braise, desserts et boissons de Barcelone.
 * @author  Wassim Hajji — Logique de réservation / tests
 * @date    2026-11-17
 * @role    Fournit les données de la carte, sans DOM ni Three.js.
 */

// Carte inspirée d'El Nacional (Barcelona), d'après les cartes officielles 2025-2026.
// Les prix sont ceux relevés sur ces cartes ; il s'agit d'une reconstitution de démonstration,
// pas d'une carte commerciale. Les prix de bar peuvent dater de cartes plus anciennes.

/** Sections de la carte, dans l'ordre d'affichage. */
export const MENU_COURSES = Object.freeze([
  { id: 'tapas-frias', label: 'Tapas frías' },
  { id: 'tapas-calientes', label: 'Tapas calientes' },
  { id: 'arroz-brasa', label: 'Arroces y brasa' },
  { id: 'postres', label: 'Postres' },
  { id: 'bebidas', label: 'Bebidas' },
]);

/** Plats et boissons. `tags` restent en français, pour l'interface. */
export const MENU_ITEMS = Object.freeze([
  // --- Tapas froides
  {
    id: 'pan-de-coca',
    course: 'tapas-frias',
    name: 'Pan de coca con tomate',
    description: 'Pain de coca, tomate frotté, huile d’olive, sel de mer',
    price: 4.5,
    tags: ['vegetarien'],
  },
  {
    id: 'jamon-iberico',
    course: 'tapas-frias',
    name: 'Jamón ibérico de bellota',
    description: '80 g, coupé à la main au comptoir',
    price: 16.25,
    tags: ['signature'],
  },
  {
    id: 'pulpo-gallega',
    course: 'tapas-frias',
    name: 'Pulpo a la gallega',
    description: 'Poulpe, pomme de terre, pimentón, huile d’olive',
    price: 21.5,
    tags: ['signature'],
  },
  {
    id: 'boquerones',
    course: 'tapas-frias',
    name: 'Boquerones en vinagre',
    description: 'Anchois marinés au vinaigre, ail et persil',
    price: 9.75,
    tags: [],
  },

  // --- Tapas chaudes
  {
    id: 'croquetas',
    course: 'tapas-calientes',
    name: 'Croquetas de jamón ibérico',
    description: 'Béchamel, jambon ibérique, panure croustillante',
    price: 7.5,
    tags: [],
  },
  {
    id: 'bravas',
    course: 'tapas-calientes',
    name: 'Patatas bravas',
    description: 'Pommes de terre, sauce brava, ail',
    price: 7.5,
    tags: ['vegetarien', 'epice'],
  },
  {
    id: 'bomba',
    course: 'tapas-calientes',
    name: 'Bomba de la Barceloneta',
    description: 'Croquette de pomme de terre, viande, sauce brava et aïoli',
    price: 7.5,
    tags: ['signature'],
  },
  {
    id: 'gambas-ajillo',
    course: 'tapas-calientes',
    name: 'Gambas al ajillo',
    description: 'Crevettes sautées à l’ail et au piment, huile d’olive',
    price: 15.75,
    tags: ['epice'],
  },

  // --- Riz et braise
  {
    id: 'paella',
    course: 'arroz-brasa',
    name: 'Paella de marisco',
    description: 'Riz, fruits de mer, safran — pour deux',
    price: 36,
    tags: ['signature'],
  },
  {
    id: 'fideua',
    course: 'arroz-brasa',
    name: 'Fideuá con alioli',
    description: 'Vermicelles, fruits de mer, aïoli — par personne, min. 2',
    price: 26,
    tags: [],
  },
  {
    id: 'arroz-negro',
    course: 'arroz-brasa',
    name: 'Arroz negro de pescado y marisco',
    description: 'Riz à l’encre de seiche, poisson et fruits de mer — par personne',
    price: 26.5,
    tags: ['signature'],
  },
  {
    id: 'entrecot',
    course: 'arroz-brasa',
    name: 'Entrecot de ternera',
    description: 'Entrecôte grillée à la braise, sel de mer',
    price: 30.5,
    tags: [],
  },

  // --- Desserts
  {
    id: 'crema-catalana',
    course: 'postres',
    name: 'Crema catalana',
    description: 'Crème catalane, sucre caramélisé à la flamme',
    price: 7.5,
    tags: ['signature'],
  },
  {
    id: 'tarta-santiago',
    course: 'postres',
    name: 'Tarta de Santiago',
    description: 'Gâteau aux amandes, croix de sucre glace',
    price: 6.75,
    tags: ['sans-gluten'],
  },

  // --- Boissons
  {
    id: 'vermut',
    course: 'bebidas',
    name: 'Vermut Yzaguirre',
    description: 'Rouge ou blanc, olive et zeste d’orange',
    price: 6.5,
    tags: ['signature'],
  },
  {
    id: 'cava',
    course: 'bebidas',
    name: 'Cava brut, au verre',
    description: 'Penedès, servi frais',
    price: 7,
    tags: [],
  },
  {
    id: 'gin-tonic',
    course: 'bebidas',
    name: 'Gin-tonic',
    description: 'Gin de la maison, tonic, citron — spécialité barcelonaise',
    price: 10,
    tags: ['signature'],
  },
  {
    id: 'cana',
    course: 'bebidas',
    name: 'Caña Estrella Damm',
    description: 'Bière pression, 20 cl',
    price: 3.5,
    tags: [],
  },
]);

/**
 * Formate un prix en euros, à la française.
 * @param {number} value Montant en euros.
 * @returns {string} Prix du type `7,50 €`.
 */
export function formatPrice(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(2).replace('.', ',')} €`;
}

/**
 * Renvoie les plats d'une section, dans l'ordre de déclaration.
 * @param {string} courseId Identifiant de section (`MENU_COURSES[].id`).
 * @returns {Array<object>} Plats de la section, éventuellement vide.
 */
export function itemsByCourse(courseId) {
  return MENU_ITEMS.filter((item) => item.course === courseId);
}
