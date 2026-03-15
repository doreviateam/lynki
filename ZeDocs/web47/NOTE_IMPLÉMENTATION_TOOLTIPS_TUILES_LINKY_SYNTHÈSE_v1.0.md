NOTE_IMPLÉMENTATION_TOOLTIPS_TUILES_LINKY_SYNTHÈSE_v1.0

Produit : Dorevia Linky
Date : 14 mars 2026
Objet : Définition des notes explicatives associées à chaque tuile de la vue Synthèse

1. Objectif

Chaque tuile de la vue Synthèse doit proposer un tooltip d’aide court accessible via une icône “i” placée en haut à droite.

Ce tooltip a trois objectifs :

expliquer ce que mesure la tuile ;

préciser comment la lire ;

indiquer si la valeur correspond à une position à date ou à une période sélectionnée.

Le tooltip n’est pas une documentation métier complète.
C’est une aide de lecture immédiate.

2. Règle de rédaction commune

Chaque tooltip doit rester court, stable et homogène.

Structure recommandée :

phrase 1 : définition de la tuile ;

phrase 2 : périmètre temporel / règle de lecture.

Contraintes UX recommandées :

2 phrases maximum ;

ton simple, métier, sans jargon inutile ;

pas de formule technique brute ;

ne pas dépasser environ 180 à 220 caractères si possible.

3. Convention temporelle à expliciter
3.1 Types de lecture

Deux grandes familles existent dans la synthèse :

Position à date : indicateur de stock ou de situation actuelle

Période sélectionnée : indicateur calculé sur la période filtrée

3.2 Convention actuelle proposée

Sous réserve de validation backend, la lecture recommandée est la suivante :

À date

Trésorerie

Encours

BFR

Période sélectionnée

Business

Flux net

Paiements

Taxes

Notes de crédit

Remboursements

Points de vente

Z de caisse

EBE

Quand une métrique n’est pas encore pleinement fiabilisée, le tooltip doit rester honnête et ne pas promettre plus que ce qui est réellement calculé.

4. Notes par tuile
4.1 Trésorerie
Objet

Indiquer la position actuelle de trésorerie disponible.

Lecture

Cette tuile exprime un stock et non un flux.
Elle ne doit pas être interprétée comme “la trésorerie du mois filtré” si le calcul périodisé n’est pas disponible.

Tooltip recommandé

Trésorerie disponible à date.
Cette valeur correspond à une position actuelle et ne suit pas nécessairement la période sélectionnée.

Intention UX

Lever toute ambiguïté entre stock courant et valeur de période.

4.2 Business
Objet

Représenter le volume d’activité reconnu sur la période.

Lecture

Cette tuile donne une lecture de dynamique d’activité, distincte de la trésorerie.

Tooltip recommandé

Volume d’activité enregistré sur la période sélectionnée.
À lire comme un indicateur d’activité, distinct des encaissements et de la trésorerie.

Intention UX

Éviter que l’utilisateur assimile “Business” à de la trésorerie encaissée.

4.3 Flux net
Objet

Montrer la respiration nette de cash sur la période.

Lecture

Indicateur central de pilotage.
Une valeur négative signifie que la période consomme plus de cash qu’elle n’en génère.

Tooltip recommandé

Différence entre les entrées et les sorties sur la période sélectionnée.
Un montant négatif indique une consommation nette de cash sur la période.

Intention UX

Rendre la lecture immédiate sans jargon financier supplémentaire.

4.4 Paiements
Objet

Montrer le montant des paiements constatés sur la période.

Lecture

À lire comme un flux d’encaissement ou de règlement selon le périmètre effectivement retenu dans le modèle.

Tooltip recommandé

Montant total des paiements constatés sur la période sélectionnée.
Cet indicateur reflète les règlements enregistrés, distincts du niveau global de trésorerie.

Intention UX

Bien distinguer paiements et trésorerie.

Point de vigilance

Si le périmètre inclut seulement certains canaux de paiement, il faudra l’indiquer plus tard dans une version enrichie.

4.5 BFR
Objet

Donner une lecture synthétique du besoin en fonds de roulement.

Lecture

Aujourd’hui, si la valeur est calculée à partir d’un état courant ou proche de l’encours, il faut rester prudent sur la formulation.

Tooltip recommandé

Estimation du besoin en fonds de roulement à date.
À lire comme un indicateur de liquidités mobilisées par l’activité, et non comme un flux de période.

Intention UX

Garder une définition juste sans survendre un calcul encore imparfait.

Point de vigilance

Si BFR = Encours dans l’implémentation actuelle, il faudra plus tard affiner soit la formule, soit le libellé.

4.6 Encours
Objet

Afficher le montant encore en attente d’encaissement ou restant exposé.

Lecture

Cette tuile est un indicateur de stock.

Tooltip recommandé

Montant d’encours observé à date.
Il s’agit d’une position restant à encaisser ou à suivre, pas d’un flux de la période.

Intention UX

Clarifier que l’utilisateur regarde un stock de situation.

4.7 Taxes
Objet

Montrer le montant des taxes rattachées à la période.

Lecture

Indicateur secondaire de compréhension de la charge fiscale liée à l’activité.

Tooltip recommandé

Montant des taxes calculées sur la période sélectionnée.
Cet indicateur aide à comprendre la part fiscale associée à l’activité observée.

Intention UX

Donner une lecture métier sans complexifier la notion.

Point de vigilance

Si plusieurs natures de taxes sont agrégées, ce détail relèvera d’une vue Détails, pas du tooltip synthèse.

4.8 EBE
Objet

Afficher l’excédent brut d’exploitation lorsque la donnée est disponible.

Lecture

Cette tuile peut rester vide tant que le calcul n’est pas encore fiabilisé ou alimenté.

Tooltip recommandé

Excédent brut d’exploitation sur la période sélectionnée.
Lorsque la donnée n’est pas disponible, la tuile reste en attente de calcul ou d’alimentation.

Intention UX

Éviter qu’un tiret soit interprété comme une erreur d’écran.

4.9 Notes de crédit
Objet

Suivre le montant des avoirs émis sur la période.

Lecture

Indicateur de correction commerciale ou comptable.

Tooltip recommandé

Montant total des notes de crédit émises sur la période sélectionnée.
Cet indicateur reflète les avoirs et corrections venant réduire l’activité facturée.

Intention UX

Faire comprendre immédiatement le lien avec les ajustements d’activité.

4.10 Remboursements
Objet

Afficher les remboursements effectués sur la période.

Lecture

Permet de suivre les sorties liées à des restitutions, retours ou corrections.

Tooltip recommandé

Montant total des remboursements constatés sur la période sélectionnée.
Cet indicateur mesure les restitutions effectivement enregistrées.

Intention UX

Éviter l’ambiguïté avec notes de crédit ou annulations théoriques.

4.11 Points de vente
Objet

Restituer l’activité ou le volume lié aux points de vente sur la période.

Lecture

Le périmètre exact dépend du modèle retenu : sessions, ventes, ou activité POS agrégée.

Tooltip recommandé

Indicateur d’activité des points de vente sur la période sélectionnée.
La tuile synthétise le périmètre POS actuellement remonté dans Linky.

Intention UX

Rester juste tant que le contenu exact de la métrique n’est pas définitivement figé.

Point de vigilance

Quand la définition sera stabilisée, il faudra préciser davantage : volume, encaissement, nombre de sessions ou total consolidé.

4.12 Z de caisse
Objet

Afficher les clôtures de caisse remontées sur la période.

Lecture

Cette tuile documente la partie caisse / POS lorsqu’elle est alimentée.

Tooltip recommandé

Montant ou indicateur issu des clôtures de caisse sur la période sélectionnée.
La valeur dépend des Z effectivement remontés et consolidés dans le périmètre POS.

Intention UX

Ne pas surpromettre tant que la donnée n’est pas pleinement branchée.

5. Règles UI d’implémentation
5.1 Placement

icône “i” discrète ;

position recommandée : coin supérieur droit de la tuile ;

ne pas concurrencer l’icône métier principale.

5.2 Comportement

affichage au survol desktop ;

clic/tap sur mobile ;

fermeture simple hors focus.

5.3 Style

tooltip sobre, fond sombre, cohérent avec Linky ;

largeur fixe modérée ;

texte lisible, interligne confortable ;

pas d’animation envahissante.

5.4 Accessibilité

zone cliquable suffisante ;

libellé accessible type Informations sur la tuile Trésorerie ;

support clavier souhaitable.

5.5 Placement de la bulle (tooltip)

Règles de placement intelligent pour que la bulle reste rattachée au « i » et ne perturbe pas la grille :

**Selon la colonne (grille 4 colonnes)**  
- Colonne 1 : ouvrir vers la droite (bulle ancrée à gauche de la tuile).  
- Colonne 4 : ouvrir vers la gauche (bulle ancrée à droite de la tuile).  
- Colonnes centrales (2 et 3) : ouvrir sous le « i », avec léger décalage ; afficher un caret discret pointant vers le « i ».

**Selon la rangée**  
- Rangée du haut : éviter de faire remonter la bulle vers la zone des filtres / header.  
- Rangées du bas : éviter que la bulle sorte de l’écran ; privilégier l’ouverture vers le haut ou le recentrage si besoin.

**Objectif**  
La bulle doit sembler naître de la tuile concernée ; on doit comprendre immédiatement quelle tuile « parle ». Un léger empiètement sur la tuile voisine reste acceptable tant que la compréhension de la grille n’est pas cassée.

6. Recommandation produit

Le système de tooltip doit être vu comme une couche d’explicabilité du cockpit.

Il ne sert pas seulement à “aider l’utilisateur”.
Il sert à matérialiser la promesse Linky :

des données vérifiables, mais aussi compréhensibles et bien interprétées.

7. Version courte exploitable par le front

Format recommandé par tuile :

type TileHelp = {
  key: string
  title: string
  tooltip: string
  timeScope: "current" | "period"
}

Exemple :

{
  key: "treasury",
  title: "Trésorerie",
  tooltip: "Trésorerie disponible à date. Cette valeur correspond à une position actuelle et ne suit pas nécessairement la période sélectionnée.",
  timeScope: "current"
}