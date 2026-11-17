# Le lieu — une nef barcelonaise

| Champ | Valeur |
| --- | --- |
| Emprise | 22 × 14 m (x ∈ [−11, 11], z ∈ [−7, 7]) |
| Hauteur sous voûte | **8,00 m** |
| Structure | **15 voûtes catalanes** surbaissées, 6 colonnes de fonte, 5 verrières zénithales |
| Tables | **20** : 16 en nef, 4 en terrasse |
| Entrée | sas sombre, portes en laiton, guirlande, puis la nef claire |

## 1. Pourquoi il n'y a plus d'étage

La version précédente proposait une mezzanine et un escalier. La recherche sur **El Nacional
(Barcelona)** montre l'inverse : c'est une **nef industrielle unique de 8 m**, à **15 voûtes
catalanes** sur colonnes métalliques, éclairée par des **verrières** — aucun étage, aucune
mezzanine. Une dalle posée dans ce volume se lisait d'ailleurs comme un décor, pas comme de
l'architecture.

La référence retenue : ancien théâtre (1870) devenu tannerie, puis garage, réouvert en 2014
comme espace gastronomique de 2 600 m². Ce qui identifie le lieu, ce sont **trois rapports** :

1. **8 m de hauteur / 15 travées de voûte** — la silhouette ;
2. **volume central traversant** avec circulation périphérique ;
3. **passage d'entrée sombre → nef claire et sonore** — le contraste perceptif.

## 2. Ce qui est modélisé

| Élément | Mise en œuvre |
| --- | --- |
| Voûtes | 15 sections de cylindre surbaissé (flèche 0,45 m, portée 1,47 m), nervures de séparation |
| Colonnes | 6 fûts de fonte Ø 0,30 m contre les murs, socles et chapiteaux |
| Verrières | 5 zénithales lumineuses au faîte + baies vitrées sur deux niveaux en façade |
| Vestibule | linteau et montants sombres, deux battants laiton entrouverts, 9 ampoules |
| Toiture | dalle + acrotère, pour ne jamais voir le ciel à travers la nef |
| Sol | parquet intérieur, terrasse bois, seuil |

Le décor (mosaïques, comptoirs, vitrines, enseignes) reste à faire : voir §5.

## 3. Surfaces praticables et collisions

`src/world/walkable.js` est le contrat consommé par le mode marche, sans Three.js :

```js
WALK_SURFACES   // nef, seuil, terrasse  — toutes à y = 0
WALK_COLLIDERS  // murs (avec trou de porte), 6 colonnes, bar, banquette, haies, poteaux
surfaceHeightAt(x, z, level) // -> 0 dans la nef et sur la terrasse, null hors zone
```

- Le paramètre `level` est conservé pour l'interface du mode marche, mais **il n'a plus
  d'effet** : le lieu n'a qu'un niveau intérieur.
- Les **tables ne sont pas des colliders** : on doit pouvoir passer entre elles. On peut donc
  traverser une chaise — compromis assumé.

## 4. Environnement de référence

| Élément | Source |
| --- | --- |
| 8 m, 15 voûtes, verrières, colonnes | dossier de presse officiel El Nacional, El Periódico |
| Ancien théâtre (1870) → tannerie → garage → restaurant (2014) | revue officielle El Nacional |
| 2 600 m², 700 couverts | site officiel |
| Sol hexagonal en bois à l'entrée, carreaux de Valence en chevrons | ProfesionalHoreca, dossier de presse |
| Mosaïque hexagonale ivoire/vert (Hisbalit 103-A / 221-A) | Hisbalit |
| Luminaires (lanternes noires, octogones crème, laiton vieilli) | Dajor |
| Menu, prix, boissons | cartes officielles 2025–2026 (voir `docs/MENU.md`) |

## 5. Reste à faire — par ordre d'impact

1. **Trois îlots de bar centraux** (marbre clair, piètement bois/fer, rail laiton, tabourets)
   avec la circulation ovale autour — c'est le deuxième marqueur du lieu.
2. **Zones différenciées** : braseria (boiseries noyer, banquettes bordeaux, roues suspendues,
   vitrine de maturation), llotja (carreaux blancs et bleu cobalt, présentoir à poisson sur
   glace), taperia (mosaïque ivoire/vert, comptoir de tapas).
3. **Sol hexagonal en bois** dans la zone d'entrée.
4. **Couche d'éclairage** : lanternes noires au hall, octogones crème, plafonniers laiton,
   2400–2700 K, ampoules visibles.
5. **Signalétique** : enseignes émaillées, portes laiton, casiers, cartes imprimées.
6. **Silhouettes de clients** (densité variable) — un lieu de 700 couverts ne peut pas être vide.

## 6. Limites connues

- Aucune **capture de contrôle** : le rendu WebGPU ne produit pas de frame en headless.
  `tools/preview.html` permet un aperçu WebGL du même monde.
- Pas de personnages, pas de bruit, pas de foule : la crédibilité repose sur l'architecture.
- La terrasse reste un ajout personnel, absente de la référence.
