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
| **A** | Radio / alarme (aiguille mal tracée, incidents à bord) |
| **E** | Descendre manœuvrer une aiguille en panne |
| **V** | Annonces voyageurs |
| **M** | Missions |
| **?** | Aide (jeu en pause) |
| **F** | Plein écran |
| **Échap** | Pause (Q pour quitter la partie) |

## Aiguillages

- **Bifurcation** : le PCC annonce l'itinéraire (direct ou dévié). Vérifiez l'indicateur ; s'il est faux, prévenez le PCC (**A**) avant l'aiguille, sinon c'est le retour en marche arrière.
- **Voie déviée** : 30 km/h sur l'aiguille, annoncé par un panneau jaune.
- **Convergence** : un train arrive de l'autre branche. Au signal jaune, ralentissez pour arriver quand le signal passe au vert (bonus si vous ne vous arrêtez pas).
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
