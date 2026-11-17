# La carte — Barcelone

Carte de démonstration inspirée d'**El Nacional (Barcelona)**, reconstituée à partir des
cartes officielles 2025–2026. Les prix sont ceux relevés sur ces cartes ; ce n'est pas une
carte commerciale. Les prix de bar proviennent parfois de cartes plus anciennes.

| Section | Plats |
| --- | --- |
| **Tapas frías** | Pan de coca con tomate 4,50 € · Jamón ibérico 16,25 € · Pulpo a la gallega 21,50 € · Boquerones en vinagre 9,75 € |
| **Tapas calientes** | Croquetas de jamón 7,50 € · Patatas bravas 7,50 € · Bomba de la Barceloneta 7,50 € · Gambas al ajillo 15,75 € |
| **Arroces y brasa** | Paella de marisco 36,00 € · Fideuá con alioli 26,00 € · Arroz negro 26,50 € · Entrecot de ternera 30,50 € |
| **Postres** | Crema catalana 7,50 € · Tarta de Santiago 6,75 € |
| **Bebidas** | Vermut Yzaguirre 6,50 € · Cava au verre 7,00 € · Gin-tonic 10,00 € · Caña Estrella Damm 3,50 € |

Fourchette réaliste sur place : **50 à 100 € par personne** selon l'espace et le vin.

---

## Choix de conception

**Sélectionner n'est pas réserver.** Cliquer une table ouvre sa fiche (zone, capacité,
statut) et la carte. La réservation passe par un bouton explicite, désactivé avec un libellé
motivé quand la table n'est pas libre. Sans cette séparation, un client réservait en lisant.

**Les prix sont en euros**, pas en dinars : le lieu simulé est à Barcelone, et un prix
incohérent avec la ville casse l'illusion plus sûrement qu'une texture manquante.

**Les libellés de section restent en catalan/espagnol** (`Tapas frías`, `Arroces y brasa`),
les descriptions en français : c'est ce que fait une carte bilingue de restaurant touristique,
et cela garde l'interface lisible pour le jury.

**La carte est une donnée, pas du code** : `MENU_ITEMS` est un tableau gelé, consommé par
`ui/menu-list.js`. Un plat s'ajoute en une entrée ; un prix change sur une ligne.

## Ce qui n'est pas fait

- Pas de **photo de plat** (aucune image externe dans le projet).
- Pas de **filtre allergènes** : `tags` existe (`vegetarien`, `sans-gluten`, `epice`,
  `signature`) mais n'est pas encore cliquable.
- Pas de **panier** ni de commande : la fiche sert à choisir une place, pas à commander.
- Pas de **traduction** catalan/anglais de la carte.

## Vérifier

```bash
npm run verify                     # en-têtes, plan, lint, format
# puis dans l'application : cliquer une table → la fiche affiche la carte
```
