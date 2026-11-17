# Le lieu — plan, niveaux et surfaces praticables

| Champ | Valeur |
| --- | --- |
| Emprise bâtiment | 22 × 14 m (x ∈ [−11, 11], z ∈ [−7, 7]) |
| Hauteur totale | 6,30 m |
| Rez-de-chaussée | 0 → 3,00 m |
| Dalle de mezzanine | 3,00 → 3,25 m |
| Étage (mezzanine) | 3,25 → 6,30 m |
| Terrasse / jardin | extérieure, z ∈ [7,2 ; 16] |
| Tables | **24** : 16 au rez-de-chaussée, 4 en mezzanine, 4 en terrasse |

---

## 1. Niveaux

| Niveau (`level`) | Sol | Tables | Accès |
| --- | --- | --- | --- |
| `ground` | y = 0 | T01 – T16 | entrée z = +7 |
| `mezzanine` | y = 3,25 | T21 – T24 | escalier |
| `terrace` | y = 0 | T17 – T20 | porte d'entrée → jardin |

Le champ `level` est porté par `userData` de chaque table : il permet de filtrer, de
compter et, plus tard, de persister une réservation avec son étage.

## 2. Escalier

| Paramètre | Valeur |
| --- | --- |
| Axe | x = −7,0 (largeur 1,20 m : x ∈ [−7,6 ; −6,4]) |
| Marches | 14 marches, hauteur 0,232 m, giron 0,30 m |
| Emprise en Z | de z = −1,0 (haut) à z = +3,2 (bas) |
| Garde-corps | 1,00 m + main courante |

Il débouche sur la mezzanine côté z = −1, entre les tables T09 et T12 : aucune table
n'occupe son emprise.

## 3. Surfaces praticables et collisions

`src/world/walkable.js` est le **contrat** consommé par le mode marche, sans Three.js :

```js
WALK_SURFACES   // rectangles { minX, maxX, minZ, maxZ, y, level, kind }
WALK_COLLIDERS  // volumes { minX, maxX, minZ, maxZ, minY, maxY, kind }
surfaceHeightAt(x, z, level = null) // -> y, ou null hors zone
```

- **Surfaces** : parquet du rez, dalle de mezzanine, terrasse bois, seuil de porte,
  et quatre paliers d'escalier (interpolés pour une montée lisse).
- **Colliders** : murs périmétriques, garde-corps de mezzanine et d'escalier, bar,
  banquette, borne d'accueil, haies et poteaux de pergola.
- **Les tables ne sont pas des colliders** : on doit pouvoir passer entre deux tables
  sans rester bloqué. Conséquence assumée : on peut traverser une chaise.

> `surfaceHeightAt` renvoie par défaut la surface **la plus haute**. Sous la mezzanine,
> un même (x, z) appartient à deux niveaux : le mode marche fournit donc un filtre qui
> ne retient une surface que si elle est atteignable depuis les pieds (montée max 0,65 m).

## 4. Choix esthétiques

- Palette « bistrot le soir » centralisée dans `PALETTE` (`layout.js`) : bois chaud,
  crème, laiton, bordeaux, vert profond.
- **Baies vitrées sur deux niveaux** côté x = −11 : la salle est lisible de jour.
- **Mezzanine** sur la moitié arrière : elle crée un point de vue sur la salle et
  justifie l'escalier.
- **Jardin** : terrasse bois, pergola à poutres, guirlandes émissives, haies en bacs.
  Deux lumières ponctuelles seulement pour tout l'extérieur (budget).
- Aucune texture externe, aucun `ShaderMaterial` : tout est procédural et compatible
  WebGPU.

## 5. Budget

| Poste | Estimation |
| --- | --- |
| Architecture (deux niveaux, escalier, garde-corps) | ≈ 6 k triangles |
| Jardin (terrasse, pergola, haies) | ≈ 5 k triangles |
| Mobilier, vaisselle, props | ≈ 25 k triangles |
| **Total** | **≈ 36 k triangles** |

## 6. Limites connues

- Pas de **personnages** assis aux tables occupées : une table `occupied` se reconnaît
  à son marqueur, pas à un client.
- La terrasse n'a pas de ciel propre : `scene.background` est commun aux deux espaces.
- Pas d'**étage accessible en VR** par téléportation : le mode marche est desktop.
- Les collisions ne tiennent pas compte des chaises (choix délibéré, voir §3).
