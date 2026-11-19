# Commandes — mode marche

Le mode marche place la caméra à hauteur d'œil (1,65 m) et la déplace comme les yeux du
visiteur : on avance, on tourne la tête, on monte l'escalier et on sort sur la terrasse.
Il s'active depuis la pastille **Marcher / Orbite** ou avec la touche `V`.

## Tableau des commandes

| Action | AZERTY | QWERTY | Autre |
| --- | --- | --- | --- |
| Avancer | `Z` | `W` | `↑` |
| Reculer | `S` | `S` | `↓` |
| Aller à gauche | `Q` | `A` | `←` |
| Aller à droite | `D` | `D` | `→` |
| Courir | `Maj` maintenue | `Shift` maintenu | — |
| Regarder | Souris (capture du curseur) | Souris (capture du curseur) | — |
| Changer de mode | `V` | `V` | Boutons de la pastille |

La reconnaissance se fait sur le caractère produit par la touche : la même position physique
donne `z` en AZERTY et `w` en QWERTY, donc aucune configuration n'est nécessaire. Les flèches
restent disponibles si la disposition est inconnue. `V` est ignoré quand le focus est dans un
champ de saisie (`input`, `select`, `textarea`, `contenteditable`) — le panneau de préférences
en contient plusieurs.

Une fois le curseur capturé, un clic sur la scène rend la main à la navigation normale de
l'application. `Échap` libère le curseur : le mode marche se coupe alors de lui-même.

## Escalier et terrasse

`src/world/walkable.mjs` expose `surfaceHeightAt(x, z)`, qui renvoie l'altitude praticable en
tout point. L'escalier n'est pas modélisé marche par marche pour le déplacement : quatre paliers
de 0,8125 m sont interpolés en une rampe continue. Le marcheur lisse ensuite sa hauteur
(`y += (sol - y) × min(1, dt × 12)`), ce qui transforme les marches en une montée souple plutôt
qu'en téléportations verticales. Le même lissage absorbe le seuil de la porte vers la terrasse.

On ne peut pas tomber de la terrasse : hors des surfaces déclarées, `surfaceHeightAt` renvoie
`null` et le pas est annulé (position précédente restaurée, inertie remise à zéro). Les haies,
poteaux et garde-corps sont par ailleurs des volumes bloquants. Ces volumes ne bloquent que si
leur intervalle vertical recouvre `[y, y + 1,65 m]` : le garde-corps de mezzanine, situé à
3,25 m, n'empêche donc pas de circuler au rez-de-chaussée.

## Ce qui n'est pas fait

- **Pas de saut** : la hauteur suit le sol, il n'y a ni gravité ni impulsion verticale.
- **Pas de téléportation VR dans ce mode** : la marche est une locomotion écran (souris +
  clavier), la session immersive garde ses propres entrées.
- **Pas de collision avec les chaises** : volontairement, pour ne pas se retrouver coincé entre
  deux tables. Les tables et le mobilier bas restent traversables ; seuls les murs, haies,
  poteaux et garde-corps bloquent.
- **Pas d'accroupissement, d'inclinaison ni de manette** : le clavier et la souris suffisent au
  parcours de démonstration.

## Limites connues

- Le **pointer lock** peut être refusé dans une iframe sans autorisation, après une perte de
  focus ou par réglage navigateur. Le mode marche reste utilisable avec un regard relatif à la
  souris (le curseur n'est simplement plus capturé) et l'utilisateur est prévenu une fois.
- La sensibilité est fixe (0,0022 rad/px) ; `invertY` est exposé par le module pour inverser
  l'axe vertical si besoin.
- `V` pendant une session VR : le module ne connaît pas l'état de session et bascule quand
  même. C'est à l'appelant d'ignorer la demande (`onChange`) tant que le casque présente.
- Le marcheur peut se coincer contre un angle si les deux axes sont bloqués en même temps ;
  reculer d'un pas suffit à s'en dégager.
- `surfaceHeightAt(x, z)` sans niveau renvoie la surface la plus haute : sous la mezzanine, la
  dalle (3,25 m) gagne sur le parquet. Un parcours au rez-de-chaussée sous la mezzanine exige
  donc que l'appelant fournisse un `surfaceHeightAt` conscient du niveau courant.

---

## Ressenti — la caméra est portée par un corps

Le regard n'est pas une caméra sur rail : cinq micro-mouvements sont appliqués **par-dessus**
la trajectoire du marcheur. Ils ne modifient jamais la position de collision.

| Effet | Réglage | Déclencheur |
| --- | --- | --- |
| Balancement du pas | 3,2 cm d'amplitude, 1,75 Hz (×1,55 en course) | indexé sur la **distance parcourue** |
| Respiration | 7 mm, 0,22 Hz | uniquement à l'arrêt (< 0,15 m/s) |
| Roulis | 0,9° max | vitesse angulaire du regard |
| Inclinaison | 0,7° max | accélération / freinage |
| Lissage du regard | 55 ms de constante | souris |

- **Bascule** : touche `M` (ignorée dans un champ de saisie) coupe ou rétablit le mouvement.
- **Accessibilité** : si le système demande `prefers-reduced-motion: reduce`, les offsets sont
  nuls par défaut. La caméra revient alors exactement à `y = sol + 1,65 m`.
- **Pourquoi la distance et non le temps** : bloqué contre un mur, le marcheur ne balance
  plus. Un balancement temporel continuerait, ce qui trahit immédiatement la simulation.
- Bornes : aucun offset ne dépasse **5 cm**, aucune inclinaison **2°**. Vérifié sous Node :
  3,18 cm de balancement, 7 mm au repos, offsets nuls quand le mouvement est coupé.
