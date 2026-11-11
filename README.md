# Dernier Métro

Simulateur de conduite de métro parisien, à l'heure de pointe, jouable directement dans le navigateur.

**▶ Jouer : https://tcacciatore.github.io/dernier-metro/**

Transportez un maximum de voyageurs, à l'heure, en vous arrêtant pile sur la marque.
Mais chaque seconde passée à quai pour faire monter du monde se paie en retard…

## Les lignes

| Ligne | Difficulté | Trajet |
|---|---|---|
| 1 | Facile | Château de Vincennes → Châtelet |
| 6 | Moyen | Nation → Place d'Italie |
| 4 | Difficile | Simplon → Les Halles |
| 13 | Extrême | Saint-Lazare → Plaisance |

## Commandes

| Touche | Action |
|---|---|
| **Z** / **S** | Accélérer / freiner (plus l'appui est long, plus ça freine) |
| **P** | Signal sonore de fermeture des portes |
| **Entrée** | Fermer les portes |
| **Espace** | Veille automatique (quand elle sonne) |
| **K** | Klaxon |
| **A** | Radio / alarme (incidents à bord) |
| **← / →** | Choisir la direction à la bifurcation (direct / dévié) |
| **E** | Descendre manœuvrer une aiguille en panne |
| **V** | Annonces voyageurs |
| **M** | Missions |
| **?** | Aide (jeu en pause) |
| **F** | Plein écran |
| **Échap** | Pause (Q pour quitter la partie) |

## Aiguillages

- **Bifurcation** : l'écran ITINÉRAIRE de la cabine affiche la direction demandée par le PCC. Sélectionnez-la avec **←** (direct) ou **→** (dévié) avant d'arriver à 20 m de l'aiguille ; le signal reste fermé pendant le mouvement (3 s). Le PCC peut changer d'itinéraire en route. Mauvaise direction : retour en marche arrière.
- **Voie déviée** : 30 km/h sur l'aiguille, annoncé par un panneau jaune.
- **Traversée** : un train venu d'une voie latérale coupe votre voie en oblique, puis repart de l'autre côté. Au signal jaune, ralentissez pour arriver quand le signal passe au vert (bonus si vous ne vous arrêtez pas).
- **Aiguille en panne** : arrêtez-vous avant le signal, descendez (**E**), marchez jusqu'au levier et calez l'aiguille en rythme (**Espace**).

## Fin de partie

- voyageur percuté sur la voie ;
- déraillement : plus de 20 km/h au-dessus d'une limitation de vitesse (travaux, voie déviée) ;
- collision avec le train qui vous précède ;
- 3 arrêts ratés ;
- trafic de la ligne saturé à 100 %.

## Vos propres publicités

Déposez vos affiches dans le dossier [`pubs/`](pubs/) et listez-les dans `pubs/pubs.json` :
elles apparaissent sur les murs des quais. Le mode d'emploi et le cahier des charges (format 1500 × 600 px)
sont dans [`pubs/README.md`](pubs/README.md).

## Lancer en local

Le jeu tient dans un seul fichier, `index.html`, sans dépendance.
Ouvrez-le dans un navigateur, ou servez le dossier :

```bash
python3 -m http.server 8000
```

puis rendez-vous sur http://localhost:8000.

---

Jeu de fiction, sans lien avec la RATP. Les noms de stations sont ceux des vraies lignes du métro de Paris ; les marques et publicités affichées sont imaginaires.

## Classement et médailles

- Chaque service terminé entre dans le **classement de la ligne** (5 meilleurs scores, avec la date). Sur l'écran d'accueil, **C** l'affiche.
- En plus de la médaille de score, trois **médailles de catégorie** sont attribuées à chaque service (bronze 50 %, argent 75 %, or 95 %) :
  - **Ponctualité** : part des arrivées à l'heure ;
  - **Aiguillages** : part des aiguillages passés sans faute ;
  - **Voyageurs** : voyageurs embarqués et sécurité.
- La meilleure médaille obtenue dans chaque catégorie est conservée par ligne.

