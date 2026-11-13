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
| **1** à **5** | Service normal, à quai : fermer (ou rouvrir) les portes d'une seule voiture |
| **Espace** | Veille automatique (quand elle sonne ; elle se tait pendant les bifurcations et les grills d'aiguillages) |
| **B** | Frein d'urgence (le « coup de poing » rouge à droite du pupitre) : un seul coup, la rame s'arrête, puis 2 s de réarmement. En mode feu, quand des zombies sont sur la vitre, une jauge apparaît : frappez B quand l'aiguille est **dans la zone rouge** pour un freinage violent qui les arrache (au-dessus de 20 km/h) ; à côté, simple freinage, ils restent. En service normal, il bouscule les voyageurs (−30) |
| **K** | Klaxon |
| **A** | Radio / alarme (incidents à bord) |
| **← / →** | Choisir la direction à la bifurcation (direct / dévié) |
| **M** | Missions |
| **?** | Aide (jeu en pause) |
| **F** | Plein écran |
| **Échap** | Pause (Q pour quitter la partie) |

## Remplissage des voitures (service normal)

À quai, le remplissage se lit **directement sur la voiture filmée** par chaque caméra : un niveau coloré monte dans la caisse, avec un gros pourcentage au centre. Bleu : il reste de la place ; vert (« DANS LE VERT ») : la bonne zone, entre les deux pointillés verts. Le trait rouge marque les 100 %.

- Chaque voiture a 40 places et ne dépasse jamais 100 %. Une fois pleine, les voyageurs restent **bloqués devant ses portes** : fermez-la (touche 1 à 5) pour qu'ils comprennent et filent vers la porte ouverte la plus proche, dans la voiture voisine. Visez la **zone verte** (60 à 85 %, soit 24 à 34 voyageurs).
- Touches **1 à 5** : fermer les portes d'une seule voiture (« 🔒 FERMÉE » sur la caméra). La touche est dessinée en bas de chaque caméra (« 3 FERMER ») et clignote quand c'est le moment de s'en servir ; une astuce le rappelle au premier arrêt. Ceux qui attendaient devant se rabattent sur les voitures voisines : c'est ainsi qu'on oriente la foule vers les voitures encore vides. Rappuyez pour rouvrir. Marche aussi sur un clavier AZERTY, sans Maj.
- Au départ : +25 par voiture dans le vert, **+100 de plus pour un DOSAGE PARFAIT** (les 5 dans le vert).
- En mode Vague de feu, même affichage et mêmes touches 1 à 5, mais sans dosage : pas de zone verte ni de bonus, on embarque un maximum de monde (le niveau passe du bleu au jaune puis à l'orange). Fermer une voiture sert à envoyer la foule vers les autres, par exemple pour équilibrer la rame et garder de la traction.

## Aiguillages

- **Bifurcation** : la voie se sépare dans une salle d'aiguillage en deux tubes, DIRECT et DÉVIÉ ; la voie à ne pas prendre est fermée par une barrière « FIN DE VOIE ». Aucune direction n'est tracée d'avance : tant que vous n'avez pas choisi, le signal reste fermé. Le sélecteur d'itinéraire du pupitre montre le schéma de la bifurcation et la direction demandée par le PCC : choisissez-la avec **←** (direct) ou **→** (dévié) avant d'arriver à 20 m de l'aiguille ; le signal reste fermé pendant le mouvement (3 s). Le PCC peut changer d'itinéraire en route. Mauvaise direction : retour en marche arrière.
- **Voie déviée** : 30 km/h sur l'aiguille, annoncé par un panneau jaune.
- **Traversée** : un train venu d'une voie latérale coupe votre voie en oblique, puis repart de l'autre côté. Au signal jaune, ralentissez pour arriver quand le signal passe au vert (bonus si vous ne vous arrêtez pas).
- **Aiguille en panne** : arrêtez-vous avant le signal ; la commande de secours s'ouvre en cabine. Des flèches montent vers la ligne cible, comme sur un tapis de danse : appuyez sur la bonne direction (**← ↓ ↑ →** ou **Q S Z D**) quand elles l'atteignent. 6 flèches justes sur 8 calent l'aiguille (+10 par PARFAIT, +5 par BIEN, +40 pour un sans-faute) ; sinon on recommence une série (−20).

## Virages

Un tunnel a soit des virages, soit des aiguillages, jamais les deux. Les tunnels sans aiguillage enchaînent une série de virages serrés (jusqu'à sept, en S ou en épingle). Chaque virage a sa vitesse limite (15 à 40 km/h), annoncée par un panneau rond à l'entrée et par des chevrons jaunes sur la paroi extérieure.

- À l'approche, un **profil de vitesse** s'affiche en bas de l'écran, sur 150 m autour de la rame : la vitesse permise descend avant chaque virage, reste à plat dans le virage, puis remonte. Restez **sous le profil, dans la zone verte** ; le repère « FREINEZ ICI » indique où commencer à freiner.
- **Sortir de la zone verte fait dérailler**, à l'approche comme dans le virage : le seuil (ligne rouge pointillée) épouse le profil, 9 km/h au-dessus, et un écart de moins d'une demi-seconde se rattrape. Dès que vous passez au-dessus du profil, une alarme crisse : freinez. Après le virage, la remontée est libre.
- Entrer dans un virage en zone verte rapporte +20. L'horaire tient compte du temps perdu dans les virages.

## Mode Vague de feu

Sur l'écran titre, **▲ ▼** choisit le mode : *Service normal* ou *Vague de feu*.

Une vague de feu remonte la ligne derrière la rame. La première fuite est **guidée** : un bandeau en bas de l'écran donne une consigne à la fois (attendre ou partir, foncer, le défi du tunnel en cours, la station infestée, les touches 1 à 5). L'aide (**?**) a une page propre à chaque mode.

Il n'y a plus d'horaire ni de descente : les voyageurs montent, et le but est d'en amener un maximum jusqu'à l'abri du terminus.

- **Attendre ou partir** : à chaque station, plus vous restez, plus de voyageurs montent (ils dévalent les escaliers par vagues)… mais le feu se rapproche. La pastille VAGUE DE FEU, la **caméra arrière** (affichée pendant les 3 secondes qui suivent chaque départ) et le panneau à quai donnent sa distance et le temps restant ; l'écran rougeoie quand elle est tout près.
- **Rattrapé** : si la vague atteint l'arrière de la rame, c'est perdu. Elle accélère si vous la distancez trop : impossible de la semer.
- **Foule** : toute la ville se réfugie dans le métro. Les quais sont bondés (jusqu'à 300 personnes), les renforts dévalent les escaliers par grosses vagues, et les voitures n'ont **aucune limite** : on s'entasse, seul le poids de la rame freine.
- **Perdus** : les voyageurs laissés sur un quai sont perdus quand la vague l'atteint.
- **Le poids** : chaque voyageur alourdit la rame. Plus elle est chargée, moins elle accélère (jusqu'à environ −50 %). La traction s'affiche sur le panneau à quai (⚙) et sous la pastille VAGUE DE FEU.
- **La répartition compte** : une rame mal répartie (une voiture bien plus chargée que la moyenne) est pénalisée de trois façons :
  - jusqu'à **−55 % de traction**, en plus du poids ;
  - la montée **ralentit fortement** dans les voitures surchargées (« SURCHARGÉE » sur leur caméra) ;
  - dans les virages, la rame penche et **déraille jusqu'à 6 km/h plus tôt**.
  Un bandeau « RAME DÉSÉQUILIBRÉE » et un conseil indiquent la voiture à fermer (touches 1 à 5) pour envoyer la foule vers les autres. Partir avec une rame bien équilibrée rapporte +40.
- **Stations infestées** ☣ : certaines stations ne contiennent que des zombies. Le PCC prévient au départ : **ne vous arrêtez pas**, traversez (+50). Si vous vous arrêtez, fermez les portes au plus vite : chaque zombie qui monte contamine 6 voyageurs.
- **Zombies sur le pare-brise** : en traversant une station infestée, des zombies sautent sur le pare-brise (1 à 3, d'autant plus qu'on passe lentement) et masquent la vue. Le **frein d'urgence** (B) les projette tous d'un coup (+15 chacun), à condition de le donner **au bon moment** : une aiguille balaie une jauge, il faut frapper quand elle est dans la zone rouge, à 20 km/h ou plus. Réussi : la cabine plonge, l'écran tremble, les roues crachent des étincelles, mais la rame s'arrête et doit repartir de zéro. Un virage pris vite en décroche un aussi. Ceux qui sont encore agrippés à la station suivante se faufilent dans la rame : chacun contamine 6 voyageurs (−40).
- **Virages dans chaque tunnel sans aiguillage**, avec leur limite (25 à 40 km/h, jamais plus lents que la vague) et le même profil de vitesse qu'en service normal. Seul le virage se négocie : en ligne droite, aucune limite, le profil n'est qu'un guide pour freiner à temps (on ne déraille qu'en entrant trop vite dans la courbe). Aux stations infestées, pas de courbe d'arrêt : on traverse.
- **Défis de tunnel** : chaque tunnel a un seul défi, à parts égales : des virages, des aiguillages, ou une barricade. Les longs tunnels ont un grill d'aiguillages.
- **Barricade de zombies** : une barricade en bois, gardée par des zombies, bloque le tunnel. Le PCC prévient au départ ; le bandeau donne la vitesse requise (60 km/h) et la vôtre. **Foncez à fond** : au-dessus de la vitesse requise, elle vole en éclats (+60), mais 1 ou 2 de ses gardes s'agrippent au pare-brise (à éjecter au frein d'urgence, comme ceux des stations). Trop lent : la rame rebondit et recule de 60 m pour reprendre de l'élan, mais la barricade est fissurée : plus le choc a été fort, moins il faudra de vitesse au coup suivant. Attention au poids : une rame bondée accélère mal et aura du mal à l'atteindre.
- **Grill d'aiguillages** : certains tunnels, plus longs, enchaînent 5 à 7 aiguilles très rapprochées. Les aiguilles se suivent tous les ~65 m et chacune s'annonce au dernier moment (AIGUILLE 2/5 · → DÉVIÉ 30 · puis ←) : choisissez ← direct ou → dévié. En mode feu, l'aiguille bascule instantanément (on peut changer d'avis sans faire passer le signal au rouge) jusqu'à son verrouillage, à 1,5 m seulement (on peut corriger au tout dernier moment) ; dès qu'une aiguille est passée (ou verrouillée), le bandeau annonce la suivante (« AIGUILLE 3/5 · → DÉVIÉ · CHOISISSEZ ! ») et ← / → la règlent tout de suite : il reste alors environ 4 secondes. Son signal, visible au bout du tube, est rouge tant qu'aucune direction n'est choisie ; le franchir déclenche un freinage d'urgence. En mode feu, la voie déviée n'a pas de limite de vitesse : il suffit de choisir la bonne direction, et un tunnel à aiguillages n'a ni virage ni profil de vitesse. +25 par aiguille bien prise, +60 pour un grill sans faute ; une erreur oblige à reculer. Bifurcations et traversées restent présentes (pas d'aiguille à manœuvrer à pied).
- **Ni veille automatique ni klaxon** (et donc plus de chien sur la voie).
- **Fin du monde, plus de service** : aucun incident voyageur (malaise, bagage, bagarre, pickpocket, fêtard, alarme, voyageur sur la voie), ni travaux ni régulation du PCC. Restent la foule de réfugiés, les coupures d'éclairage et les signaux.
- Le feu se voit : boules de feu et fumée sur la caméra arrière, braises qui dépassent la rame, fumée sous la voûte, flammes au bas de l'écran quand il est tout près, et la rame engloutie si elle est rattrapée.
- **Portes blindées de l'abri** : au terminus, on quitte la rame : vue de l'intérieur de l'abri, deux mains tournent le volant de manœuvre et les deux battants d'acier se rejoignent pendant que la vague grossit au fond du tunnel. Fermez les portes blindées en tapant les flèches en rythme (← ↓ ↑ → ou Q S Z D), comme sur un tapis de danse : de 18 à 32 flèches justes avant l'arrivée du feu (13 à 24 s selon l'avance prise : plus on a de temps, plus la manœuvre est longue). Réussi : portes scellées (+100). Trop tard : le feu s'engouffre et emporte une partie des derniers voyageurs, d'autant plus que les portes étaient ouvertes.
- Le bilan n'apparaît qu'à l'écran de fin : il compare les voyageurs sauvés au **total de ceux qu'il fallait sauver** (à bord, plus ceux restés sur les quais ou perdus en route), avec une barre verte (sauvés) et rouge (perdus). La note sur 20 suit cette part : 90 % de sauvés valent 20/20, 64 % environ 14/20.
- Score : +5 par voyageur embarqué, +10 par voyageur sauvé au terminus. Médailles : bronze 6000, argent 12000, or 18000. Records et classement sont séparés de ceux du service normal.

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

Le jeu est en HTML et JavaScript, sans dépendance ni étape de construction :

| Fichier | Contenu |
|---|---|
| `index.html` | la page : le canvas et la liste des scripts |
| `css/style.css` | la mise en page et les polices |
| `js/config.js` | constantes, données des lignes, profils de voyageurs |
| `js/etat.js` | état de la partie, missions, barème et médailles |
| `js/audio.js` | sons et musique |
| `js/quai.js` | voyageurs, portes, montée et descente, remplissage des voitures |
| `js/entrees.js` | clavier et pause |
| `js/logique.js` | arrivée en station, tutoriels, horaire, train précédent, veille, game over |
| `js/feu.js` | mode Vague de feu : la vague, la caméra arrière, les incidents de tunnel |
| `js/tunnel.js` | défis de tunnel : aiguillages, grills, virages, barricade, aiguille en panne |
| `js/partie.js` | abri du mode feu, fin de service, boucle de mise à jour |
| `js/textures.js` | textures générées au démarrage : béton, carrelage, ballast, dallage |
| `js/rendu.js` | rendu 3D du tunnel et des stations, voyageurs, publicités |
| `js/cameras.js` | caméras de quai |
| `js/interface.js` | pupitre, aide, messages, écrans de fin |
| `js/accueil.js` | écran d'accueil et démarrage |

Les scripts sont chargés dans cet ordre et partagent leurs variables. À chaque publication, augmentez le numéro `?v=` des liens dans `index.html` pour que les navigateurs rechargent les fichiers.

Ouvrez `index.html` dans un navigateur, ou servez le dossier :

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

