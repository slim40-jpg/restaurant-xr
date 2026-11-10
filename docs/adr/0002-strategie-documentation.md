# ADR-0002 — Séparation README / documentation technique

- **Statut** : Accepté
- **Date** : 2026-11-10
- **Décideurs** : Slim Selmi, Hazem Bellili, Wassim Hajji
- **Jalon** : W1

---

## Contexte

Le `README.md` faisait 452 lignes et cumulait six documents différents :

1. présentation du projet ;
2. cours sur les APIs WebXR / WebGL / Gamepad ;
3. procédure d'installation ;
4. guide de dépannage ;
5. feuille de route ;
6. notes internes (« Points à vérifier avant de rendre », `[À REMPLIR]`).

Deux problèmes en découlaient :

- **lisibilité** : un correcteur ne trouve pas en dix secondes ce qu'il cherche ;
- **sincérité documentaire** : le README décrivait des fonctionnalités absentes du
  code (chargement GLTF, clonage d'un personnage assis, panneau « RÉSERVÉ » en
  texture canvas, détection des tables par nom de mesh, téléportation). Une
  documentation qui décrit un autre logiciel est plus dommageable qu'une
  documentation incomplète.

L'enseignant a explicitement demandé d'extraire la documentation technique vers
`docs/technical_specs.md` et `docs/PLANNING.md`.

## Décision

Séparer les documents par **public et par cycle de vie** :

| Fichier | Public | Contenu | Fréquence de mise à jour |
| --- | --- | --- | --- |
| `README.md` | nouvel arrivant, correcteur pressé | ce que fait le projet, comment le lancer, où trouver le reste | à chaque jalon |
| `docs/technical_specs.md` | jury technique, développeurs | exigences, architecture, modèle de données, APIs, dette | à chaque changement de structure |
| `docs/PLANNING.md` | jury, équipe | jalons, critères d'acceptation, risques, feuille de route | chaque semaine |
| `docs/ARCHITECTURE.md` | développeurs | graphe de modules, flux, invariants | à chaque nouveau module |
| `docs/adr/*.md` | jury, futurs mainteneurs | décisions et alternatives écartées | à chaque décision structurante |
| `docs/DEMO_LOG.md` | jury | preuve hebdomadaire de l'avancement | chaque semaine |

Règles associées :

1. Le README ne décrit **que** des fonctionnalités présentes dans le code ; ce qui
   est planifié est marqué 🔄 et renvoie au jalon.
2. Aucune note interne (« à remplir », brouillon) ne reste dans un document publié.
3. Un changement de comportement met à jour la documentation **dans la même PR**
   (critère de *Definition of Done*).
4. Chaque décision structurante produit un ADR de moins d'une page.

## Alternatives écartées

| Alternative | Raison du rejet |
| --- | --- |
| Garder un README unique très long | Ne répond pas à la demande explicite du jury ; reste illisible |
| Wiki GitHub | Hors du dépôt, donc non versionné avec le code, et non clonable hors ligne |
| Générer la documentation depuis le code (JSDoc → HTML) | Utile plus tard, mais ne remplace pas les exigences, le planning et les ADR |
| Documentation en anglais uniquement | Le jury et l'enseignant évaluent en français ; le code reste commenté en français pour rester cohérent |

## Conséquences

**Positives**

- Le correcteur accède en un clic à la pièce qu'il cherche.
- La documentation devient vérifiable : chaque affirmation est adossée à un fichier.
- L'historique des décisions est conservé (les ADR ne se réécrivent pas, ils s'ajoutent).

**Négatives / coûts**

- Six fichiers à maintenir au lieu d'un : coût réel, assumé, borné par la règle
  « mise à jour dans la même PR ».
- Risque de duplication entre README et spécifications : limité en gardant le
  README factuel et court (installation + liens).

## Vérification

- `README.md` ≤ 150 lignes, sans section de cours.
- Toute fonctionnalité marquée ✅ est démontrable en suivant la recette de
  `technical_specs.md` §10.
- `docs/` contient les six documents listés ci-dessus.
