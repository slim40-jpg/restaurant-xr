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
- [ ] Les prompts utilisés avec un assistant IA sont consignés dans `docs/prompts/` (voir §8).
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

## Prompts IA
<chemin du fichier de journal, ex. docs/prompts/2026-11-18-w4-teleportation.md>
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

---

## 8. Traçabilité des prompts IA (exigence pédagogique)

L'enseignant demande que **chaque prompt** utilisé avec un assistant pour produire du
code, de la documentation ou des tests soit consigné dans le dépôt. Ce journal est la
preuve du processus : il montre ce qui a été demandé, ce qui a été produit, et ce que
l'étudiant a vérifié ou corrigé ensuite. Il complète la déclaration d'usage de l'IA
de [`ATTRIBUTION.md`](ATTRIBUTION.md) §4, qui reste obligatoire.

### 8.1 Où

Un fichier par séance de travail :

```
docs/prompts/AAAA-MM-JJ-<jalon>.md
# ex. docs/prompts/2026-11-18-w4-teleportation.md
```

Si une séance couvre plusieurs jalons, suffixer : `2026-11-18-w4-w5-teleportation-backend.md`.
Le dossier est créé à la première séance qui suit la mise en place de cette règle.

### 8.2 Quand

**Au moment où le prompt est utilisé**, pas reconstitué après coup. Un prompt oublié
est un prompt non traçable : on l'indique comme tel (`non consigné`) plutôt que de
l'inventer.

### 8.3 Quoi

Une entrée par prompt, dans l'ordre chronologique :

```markdown
## 2026-11-18T14:32 — Wassim Hajji
- **Outil / modèle** : Claude, Sonnet 4.5 (mode agent)
- **Objectif** : implémenter la téléportation au joystick

### Prompt (verbatim)

> <le prompt tel qu'il a été envoyé, sans reformulation>

### Sous-tâches déléguées (le cas échéant)

| Agent | Brief (verbatim ou résumé fidèle) | Fichiers touchés |
| --- | --- | --- |
| designer | <brief> | `src/world/**` |

### Résultat produit

- `src/xr/locomotion.js` (créé), `src/main.js:42-58` (modifié)

### Vérification étudiante

- `npm run verify` → 21/21
- Téléportation testée sur Quest : OK / NOK (préciser)

### Corrections apportées au code généré

- <ce qui a été changé, et pourquoi>
```

### 8.4 Règles

1. **Verbatim** : le prompt est recopié tel quel. Une reformulation ultérieure est
   signalée comme telle.
2. **Aucune donnée sensible** : pas de clé d'API, de jeton, de mot de passe ni de
   donnée personnelle dans un prompt consigné.
3. **Même PR** : le journal accompagne le code qu'il a produit. Une PR sans son
   journal est incomplète (voir §4).
4. **Les échecs comptent** : un prompt qui n'a rien produit d'utilisable est consigné
   avec la mention `rejeté` et la raison. C'est la partie la plus crédible du journal.
5. **Référencer, pas recopier** : on cite les fichiers par `chemin:ligne`, on ne colle
   pas des fichiers entiers dans le prompt.
6. **Un modèle = une ligne** : si le modèle ou l'outil change en cours de séance,
   nouvelle entrée.
