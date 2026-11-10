# Contribuer — Restaurant XR

Ce document fixe les règles de collaboration. Elles sont volontairement simples
et vérifiables : un correcteur doit pouvoir les contrôler en deux minutes.

---

## 1. Modèle de branches

```
main  ──●──────────●──────────●──────────●──────►  (protégée, toujours démontrable)
         \        / \        / \        /
          ●──●──●    ●──●──●    ●──●──●
        feat/…     feat/…     feat/…              (une branche par jalon)
```

- `main` est **protégée** : aucun commit direct, une Pull Request et une revue
  sont obligatoires.
- Une branche par jalon, nommée `type/sujet` :
  - `chore/engineering-baseline` (W1)
  - `feat/three-r187` (W2)
  - `feat/pwa` (W3)
  - `feat/teleportation` (W4)
  - `feat/multiuser-backend` (W5)
- Fusion en **squash merge** pour garder un historique lisible sur `main`.
- Un tag par jalon : `w1-baseline`, `w2-r187`, … puis `v1.0.0`.

---

## 2. Convention de commits

Format : `type(portée): description à l'impératif`

| Type | Usage |
| --- | --- |
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de comportement |
| `refactor` | Réorganisation sans changement de comportement |
| `docs` | Documentation uniquement |
| `test` | Ajout ou correction de tests |
| `chore` | Outillage, dépendances, configuration |
| `perf` | Amélioration de performance |

Portées utilisées : `xr`, `world`, `core`, `ui`, `interaction`, `config`,
`docs`, `ci`, `pwa`, `net`.

Exemples valides :

```
feat(xr): ajouter la téléportation au joystick gauche
fix(ui): rendre le panneau de statut lisible en session immersive
docs(specs): extraire la documentation technique du README
chore(tooling): ajouter ESLint et le vérificateur d'en-têtes
```

Règles : un commit = un changement cohérent. Ne jamais mélanger formatage massif
et changement de comportement. Ne jamais committer `node_modules/`, un secret ou
un fichier `.env`.

---

## 3. Périmètres d'écriture

Voir `CODEOWNERS`. En résumé :

| Membre | Périmètre |
| --- | --- |
| Slim Selmi | `src/core/**`, `src/world/**`, `src/xr/**` |
| Hazem Bellili | `src/ui/**`, `assets/**`, `index.html` (styles) |
| Wassim Hajji | `src/main.js`, `src/config/**`, `src/interaction/**`, `scripts/**`, tests |

Une modification hors de son périmètre exige l'accord explicite du propriétaire
dans la Pull Request. Cela évite les conflits et rend la contribution de chacun
lisible dans l'historique Git.

---

## 4. Definition of Done (avant d'ouvrir une PR)

- [ ] Le code s'exécute sans erreur console.
- [ ] `npm run verify` passe (en-têtes + ESLint + Prettier).
- [ ] Chaque nouveau fichier `src/**` porte l'en-tête `@file / @author / @date / @role`.
- [ ] Chaque fonction exportée est documentée en JSDoc (`@param`, `@returns`).
- [ ] La documentation concernée est mise à jour dans la même PR.
- [ ] Une preuve est fournie : commande + sortie, capture, ou URL.

---

## 5. Description de Pull Request

```markdown
## Objectif
<ce que la PR change, en une phrase>

## Pourquoi
<le problème résolu ou l'exigence couverte — référencer docs/technical_specs.md>

## Comment vérifier
```bash
npm run verify
python -m http.server 8000
```
<résultat observé : sortie de commande, capture, comportement>

## Risques / dette
<ce qui reste ouvert, ce qui a été reporté>
```

---

## 6. Revue

- Une PR est relue par un membre qui n'a pas écrit le code concerné.
- La revue porte sur : justesse, respect des règles de dépendance
  (`docs/ARCHITECTURE.md` §2), lisibilité, documentation.
- Un commentaire bloquant doit être résolu ou explicitement écarté avec justification.
- Pas de fusion sans `npm run verify` vert.

---

## 7. Style de code

- ES Modules, `const` par défaut, pas de `var`.
- 2 espaces, guillemets simples, point-virgule — appliqués par Prettier.
- Une fonction fait une chose ; au-delà de 40 lignes, la découper.
- Commentaires en français, orientés **pourquoi**, jamais une paraphrase du code.
- Aucun `console.log` laissé dans le code livré.
