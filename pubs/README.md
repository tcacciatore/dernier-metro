# Publicités du jeu

Les affiches de ce dossier apparaissent sur les murs des quais, dans toutes les stations.

## Ajouter une publicité

1. Déposer l'image dans ce dossier `pubs/`.
2. L'ajouter à la liste dans `pubs.json` :

```json
{
  "mode": "melanger",
  "pubs": [
    { "image": "mon-affiche.png", "nom": "Mon affiche" },
    { "image": "autre-affiche.jpg", "nom": "Une autre" }
  ]
}
```

3. Publier les changements (commit + push) : le site se met à jour en une à deux minutes.

`mode` :
- `"melanger"` : vos affiches s'ajoutent aux publicités fictives du jeu ;
- `"remplacer"` : seules vos affiches sont affichées.

## Cahier des charges pour les affiches

| | |
|---|---|
| **Format** | 2,5 × plus large que haut — **1500 × 600 px** conseillé |
| **Fichier** | PNG, JPG, WebP ou SVG |
| **Poids** | moins de 300 Ko par image |
| **Marges** | garder l'essentiel à au moins 4 % des bords (le cadre doré mange un peu) |
| **Lisibilité** | on voit l'affiche de biais et en mouvement : titre gros et court, image forte, peu de petit texte |

`exemple.svg` montre le format et la zone de sécurité (pointillés jaunes). Il n'est pas affiché dans le jeu tant qu'il n'est pas listé dans `pubs.json`.

## Tester en local

Le chargement des affiches ne fonctionne pas en ouvrant `index.html` directement depuis le disque.
Lancer un petit serveur à la racine du projet :

```bash
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.

## Droits

Le jeu est public : n'afficher que des visuels et des marques que vous avez le droit d'utiliser.
