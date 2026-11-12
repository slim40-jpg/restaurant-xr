# Mode réalité augmentée — `immersive-ar`

Le restaurant peut être posé sur une surface réelle : le téléphone ou le casque détecte
un plan (sol, table), affiche un réticule doré, et un toucher place la salle en maquette
à cet endroit. L'environnement virtuel (murs, sol, plafond) est masqué pour laisser voir
la pièce réelle ; seuls les tables, le mobilier et les couverts restent visibles.

| Élément | Réalité virtuelle (`immersive-vr`) | Réalité augmentée (`immersive-ar`) |
| --- | --- | --- |
| Fond | scène 3D opaque | caméra réelle (`scene.background = null`) |
| Environnement (murs, sol) | visible | masqué |
| Échelle | 1:1, échelle humaine | maquette × 0,12 posée sur une surface |
| Placement | caméra dans la salle | hit-test + toucher |
| Panneau d'état 3D | visible | masqué |
| Sortie | pose du casque | restauration du fond, de l'échelle et des éléments |

---

## Prérequis

- **HTTPS obligatoire** (ou `localhost`) : `immersive-ar` n'est pas exposé en contexte non sécurisé.
- Navigateur avec ARCore : **Chrome Android** récent, ou un casque compatible.
- Les fonctionnalités `immersive-ar` et `hit-test` doivent être accordées par la session.
  Dans le cas contraire, un message explique l'échec et la session se ferme proprement.

## Tester sur téléphone, sans certificat

```bash
# téléphone branché en USB, débogage activé
adb reverse tcp:8000 tcp:8000
# puis, sur le téléphone : http://localhost:8000
```

`localhost` est considéré comme un contexte sécurisé : c'est le chemin le plus court pour
tester sans déployer de certificat.

## Tester sans matériel

Un navigateur sans ARCore affiche `AR NOT SUPPORTED` sur le bouton et rien ne se passe.
`setupAR(...).isSupported()` renvoie `false`. Aucune exception n'est levée.

## Limites assumées

- **Placement non persistant** : aucune ancre (`XRAnchor`) n'est créée. Recharger la page
  ou relancer la session redemande un placement. Les ancres sont un ajout possible.
- **Pas de test sur appareil réel à ce jour** : l'implémentation est vérifiée par analyse
  statique, par la présence du bouton et par le comportement de repli ; la pose sur surface
  doit être validée sur un téléphone ARCore avant la soutenance.
- **Une seule maquette** : poser une deuxième fois ne déplace pas la première instance.

## Vérifier en une commande

```bash
npm run verify      # en-têtes, ESLint, Prettier
# puis dans le navigateur : bouton « AR » visible à côté de « Enter VR »
```
