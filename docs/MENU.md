# Menu de démonstration — Restaurant XR

> **Menu fictif de démonstration.** Aucun plat, prix ou provenance ne prétend
> refléter une carte réelle. Les données servent uniquement à illustrer la fiche
> de table et ne doivent pas être présentées comme une offre commerciale.

Source unique : `src/config/menu.js` (`MENU_COURSES`, `MENU_ITEMS`). Aucune donnée
n'est dupliquée dans le DOM : `src/ui/menu-list.js` lit ces tableaux et
`formatPrice` produit l'affichage.

---

## 1. Contenu

16 plats répartis en 4 sections. Prix en dinars tunisiens (DT).

### Entrées (4)

| Plat | Description | Prix |
| --- | --- | ---: |
| Salade méchouia | Poivrons et tomates grillés, thon, œuf dur | 8,50 DT |
| Bruschetta tomate-basilic | Pain grillé, tomates confites, basilic frais | 9,50 DT |
| Soupe du jour | Légumes de saison, croûtons maison | 7,00 DT |
| Brik à l'œuf | Feuille de malsouka, œuf, thon, câpres | 6,50 DT |

### Plats (5)

| Plat | Description | Prix |
| --- | --- | ---: |
| Couscous au poisson | Semoule, dorade, légumes de saison, harissa | 26,00 DT |
| Entrecôte grillée | 300 g, beurre maître d'hôtel, frites maison | 28,00 DT |
| Risotto aux cèpes | Riz carnaroli, cèpes, parmesan | 21,00 DT |
| Dorade grillée | Filet entier, citron, huile d'olive | 24,00 DT |
| Poulet rôti citron-olive | Demi-poulet, citron confit, olives | 19,50 DT |

### Desserts (3)

| Plat | Description | Prix |
| --- | --- | ---: |
| Tarte fine aux pommes | Pâte feuilletée, pommes caramélisées | 8,00 DT |
| Fondant au chocolat | Cœur coulant, crème vanillée | 9,00 DT |
| Salade d'oranges | Orange, cannelle, fleur d'oranger | 7,00 DT |

### Boissons (4)

| Boisson | Description | Prix |
| --- | --- | ---: |
| Citronnade à la menthe | Citron pressé, menthe fraîche | 5,00 DT |
| Thé à la menthe | Thé vert, menthe, pignons | 4,00 DT |
| Vin rouge (verre) | Rouge de Tunisie, 12 cl | 9,00 DT |
| Eau minérale | 50 cl, plate ou pétillante | 3,00 DT |

Tags disponibles : `vegetarien`, `sans-gluten`, `epice`, `signature`.

---

## 2. Choix de conception — sélection ≠ réservation

Avant cette évolution, viser une table avec la manette ou la souris la réservait
immédiatement. Deux problèmes :

1. **Réservation accidentelle.** Regarder la salle suffisait à bloquer une table,
   sans intention ni confirmation.
2. **Consultation impossible.** Le client ne pouvait pas voir le menu ni les
   caractéristiques d'une table avant de s'engager.

La séparation est donc explicite :

- `select(ray)` met à jour le panneau d'état et signale la table visée, sans
  jamais toucher à `status`. Il peut notifier l'appelant via `onSelect` pour
  ouvrir la fiche.
- `reserve(tableOrId)` est la seule fonction qui applique
  `available → reserved`, recolore le marqueur et confirme sur le panneau. Elle
  refuse toute autre transition et renvoie `{ ok: false, reason }` sans mutation.

La fiche (`src/ui/table-card.js`) ne modifie rien elle-même : son bouton appelle
`onReserve(table)` et c'est le service de sélection qui décide. Cette frontière
garde une seule machine à états, testable sans DOM ni événement XR.

---

## 3. Ajouter ou modifier un plat

**Ajouter un plat** — une entrée dans `MENU_ITEMS` (`src/config/menu.js`) :

```js
{
  id: 'pastilla-crevettes',
  course: 'entrees',
  name: 'Pastilla aux crevettes',
  description: 'Feuille croustillante, crevettes, citron confit',
  price: 11,
  tags: ['signature'],
}
```

Contraintes :

- `id` unique, en `kebab-case` ;
- `course` doit valoir exactement un `MENU_COURSES.id` (`entrees`, `plats`,
  `desserts`, `boissons`) — sinon le plat n'apparaît nulle part ;
- `price` en dinars, nombre (pas de chaîne) ;
- `tags` optionnel, valeurs françaises ci-dessus.

**Changer un prix** — modifier `price` dans l'entrée concernée. L'affichage
(`9,50 DT`) est calculé par `formatPrice`, ne jamais écrire le prix formaté à la
main. Un prix non numérique affiche `—`.

**Ajouter une section** — ajouter `{ id, label }` à `MENU_COURSES` puis utiliser
cet `id` dans `course`. L'ordre du tableau est l'ordre d'affichage.

---

## 4. Ce qui n'est pas fait

- **Pas de photo de plat** : le menu est textuel pour rester léger et lisible en
  XR ; aucune ressource image n'est chargée.
- **Pas de filtre allergènes** : les `tags` sont affichés, pas encore combinés à
  une recherche ni à un avertissement médical.
- **Pas de panier ni de commande** : la fiche sert à consulter et à réserver une
  table, pas à passer commande.
- **Pas de disponibilité par plat** : un plat listé est toujours affiché, quel
  que soit le service.
