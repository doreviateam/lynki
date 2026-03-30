# User Stories — Écran détail Trésorerie

**Version :** 1.0  
**Date :** 30 mars 2026  
**Norme produit :** [`SPEC_DETAIL_TRESO.md`](./SPEC_DETAIL_TRESO.md) · [`SPEC_TUILE_TRESO.md`](./SPEC_TUILE_TRESO.md) · [`WIREFRAME_DETAIL_TRESO.md`](./WIREFRAME_DETAIL_TRESO.md)  
**Exécution :** [`EXECUTION_TICKETS_DETAIL_TRESO.md`](./EXECUTION_TICKETS_DETAIL_TRESO.md) · **Recette :** [`RECETTE_MANUELLE_DETAIL_TRESO.md`](./RECETTE_MANUELLE_DETAIL_TRESO.md)

---

# US-TRESO-DETAIL-A — Bandeau de synthèse

## Objectif

Donner au lecteur, dès l’arrivée sur l’écran, la lecture de référence de la trésorerie et son niveau de confiance.

## User Story

**En tant que** contrôleur de gestion,  
**je veux** voir immédiatement le solde validé, l’état principal, la couverture probante, le montant à rapprocher et l’écart à confirmer,  
**afin de** comprendre en un regard la position de trésorerie retenue et son niveau de robustesse.

## Valeur métier

* continuité avec la tuile cockpit ;
* lecture immédiate ;
* cadrage du périmètre et de la fraîcheur.

## Contenu attendu

* Solde validé
* Badge d’état
* Couverture probante
* Montant à rapprocher
* Écart à confirmer
* Périmètre
* Date/heure d’arrêté
* Synchro

## Critères d’acceptation

* le montant principal est dominant ;
* les 5 lectures cœur sont visibles ;
* l’ordre est cohérent avec la tuile ;
* l’écart à confirmer est affiché en valeur absolue ;
* la couverture probante est affichée en % ;
* le périmètre et la fraîcheur sont visibles sans surcharge.

## Notes

* version desktop complète ;
* version tactile compacte ;
* cohérence stricte avec `SPEC_TUILE_TRESO.md`.

**Renvoi spec :** §7, §13.1, §17.1 · §17.2, §19 (Bloc A).

---

# US-TRESO-DETAIL-B — Décomposition de la trésorerie

## Objectif

Montrer de quoi est composé le solde validé.

## User Story

**En tant que** contrôleur de gestion,  
**je veux** voir quels comptes, journaux ou instruments composent la trésorerie affichée, avec leur poids et leur couverture,  
**afin de** identifier les comptes majeurs et ceux qui concentrent le risque de lecture.

## Valeur métier

* compréhension de la composition du solde ;
* visibilité sur la concentration du risque ;
* repérage des comptes structurants.

## Contenu attendu

* compte / journal / instrument
* solde retenu
* couverture probante
* contribution au solde
* éventuellement dernier relevé / synchro / opérations ouvertes

## Critères d’acceptation

* la composition du solde est lisible ;
* les comptes majeurs sont identifiables ;
* le poids relatif au solde total est visible ;
* la couverture par composante est visible ;
* un compte fortement pondéré mais peu couvert ressort.

## Notes

* tri par contribution décroissante recommandé ;
* version phone recentrée sur les lignes principales.

**Renvoi spec :** §8, §13.2, §17.3, §19 (Bloc B).

---

# US-TRESO-DETAIL-C — Rapprochement bancaire

## Objectif

Montrer ce qui reste à traiter pour améliorer la qualité de lecture.

## User Story

**En tant que** contrôleur de gestion,  
**je veux** voir le montant à rapprocher, le nombre d’opérations ouvertes, leur ancienneté et les principaux éléments non rapprochés,  
**afin de** savoir où se concentre le travail de rapprochement et quelle masse reste à traiter.

## Valeur métier

* lecture opérationnelle du backlog de rapprochement ;
* identification des plus gros sujets ;
* priorisation des efforts.

## Contenu attendu

* montant à rapprocher
* opérations ouvertes
* part non couverte
* répartition par ancienneté
* principaux éléments non rapprochés
* filtres / vues utiles

## Critères d’acceptation

* la masse à rapprocher est visible immédiatement ;
* l’ancienneté est lisible ;
* les principaux éléments ouverts sont visibles ;
* le bloc reste cohérent avec le bandeau et la tuile ;
* le détail ne commence pas par une table brute sans synthèse.

## Notes

* bloc central pour expliquer `Partiel` ou `À confirmer`.

**Renvoi spec :** §9, §13.3, §17.4, §19 (Bloc C).

---

# US-TRESO-DETAIL-D — Écart à confirmer

## Objectif

Expliquer le décalage résiduel dans la lecture du solde.

## User Story

**En tant que** contrôleur de gestion,  
**je veux** comprendre l’écart entre la lecture ERP et la position validée, ainsi que les causes principales de cet écart,  
**afin de** savoir s’il s’agit d’un décalage transitoire ou d’un sujet à investiguer.

## Valeur métier

* compréhension du doute résiduel ;
* passage d’un chiffre opaque à un écart expliqué ;
* arbitrage entre normalité de clôture et anomalie.

## Contenu attendu

* écart à confirmer
* solde ERP
* position validée
* écart signé
* qualification simple
* principaux postes explicatifs
* CTA vers le détail

## Critères d’acceptation

* l’écart est visible et compréhensible ;
* la comparaison ERP / position validée est lisible ;
* la valeur absolue et le sens signé sont distingués ;
* une qualification simple est possible ;
* le bloc n’utilise pas `Écart ERP − Vault` comme titre principal.

## Notes

* garder le jargon technique hors premier niveau.

**Renvoi spec :** §10, §13.4, §17.5, §19 (Bloc D).

---

# US-TRESO-DETAIL-E — Évolution de la trésorerie

## Objectif

Montrer la trajectoire de la trésorerie et de sa qualité de lecture.

## User Story

**En tant que** contrôleur de gestion,  
**je veux** voir l’évolution de la trésorerie, de la couverture probante, du montant à rapprocher et la vélocité du rapprochement,  
**afin de** savoir si la situation s’améliore, stagne ou se dégrade.

## Valeur métier

* mise en perspective temporelle ;
* visibilité sur la progression réelle ;
* lecture de tendance et non simple photo.

## Contenu attendu

* évolution de la trésorerie
* évolution de la couverture
* évolution du montant à rapprocher
* vélocité du rapprochement
* fenêtres temporelles
* marqueurs de rupture si utiles

## Critères d’acceptation

* la trajectoire de la trésorerie est lisible ;
* la progression ou non de la couverture est lisible ;
* la baisse ou non du montant à rapprocher est lisible ;
* la vélocité récente est visible ;
* amélioration / stagnation / dégradation peuvent être distinguées.

## Notes

* éviter une galerie de graphiques ;
* hiérarchie stricte des visualisations.

**Renvoi spec :** §11, §13.5, §17.6, §19 (Bloc E).

---

# US-TRESO-DETAIL-F — Vigilances et actions

## Objectif

Transformer la lecture en priorités de traitement.

## User Story

**En tant que** contrôleur de gestion,  
**je veux** voir les vigilances hiérarchisées et les actions prioritaires associées,  
**afin de** savoir immédiatement quoi faire ensuite et sur quels comptes ou flux agir.

## Valeur métier

* passage de la lecture à l’action ;
* hiérarchisation des sujets ;
* réduction du temps de décision.

## Contenu attendu

* vigilances critiques
* vigilances importantes
* informations d’amélioration
* actions prioritaires
* liens vers écrans de traitement

## Critères d’acceptation

* les vigilances sont hiérarchisées ;
* 3 à 5 vigilances max visibles d’emblée ;
* 3 actions max en priorité ;
* les actions sont concrètes et reliées aux sujets affichés ;
* le bloc reste cohérent avec A, C, D et E.

## Notes

* ne pas devenir un mur d’alertes ;
* orienté décision, pas inventaire.

**Renvoi spec :** §12, §13.6, §17.7, §19 (Bloc F).

---

# US-TRESO-DETAIL-RESPONSIVE — Adaptation desktop / tablette / phone

## Objectif

Garantir une lecture cohérente de l’écran détail Trésorerie selon le régime responsive.

## User Story

**En tant que** utilisateur Lynki sur desktop, tablette ou phone,  
**je veux** retrouver les mêmes informations essentielles de l’écran détail Trésorerie avec une hiérarchie adaptée à mon format,  
**afin de** garder une lecture fiable et actionnable quel que soit mon terminal.

## Valeur métier

* continuité multi-support ;
* cohérence produit ;
* réduction des pertes d’information sur tactile.

## Règles attendues

### Desktop

* les 6 blocs visibles selon la composition complète ;
* double colonne possible ;
* densité plus forte.

### Tablette

* blocs conservés dans un ordre vertical clair ;
* synthèse forte ;
* tableaux simplifiés ;
* CTA vers le détail complet.

### Phone

* priorité à :

  1. bandeau de synthèse
  2. vigilances / actions
  3. rapprochement
  4. écart à confirmer
  5. décomposition
  6. évolution

## Critères d’acceptation

* aucune rupture de sens entre desktop / tablette / phone ;
* les indicateurs clés restent visibles ;
* les blocs tactiles sont lisibles sans surcharge ;
* les CTA vers les détails complets existent sur tactile ;
* l’ordre des blocs sur phone suit la logique de priorité.

## Notes

* responsive guidé par usage, pas par simple empilement.

**Renvoi spec :** §11.18 (tactile), `WIREFRAME_DETAIL_TRESO.md` (version tactile), §17 et §18 (recette transversale).

---

# Vue synthétique des 7 US

| US | Bloc | Finalité |
|----|------|----------|
| US-TRESO-DETAIL-A | Bandeau | lecture de référence |
| US-TRESO-DETAIL-B | Décomposition | composition du solde |
| US-TRESO-DETAIL-C | Rapprochement | travail restant |
| US-TRESO-DETAIL-D | Écart | explication du doute |
| US-TRESO-DETAIL-E | Évolution | trajectoire |
| US-TRESO-DETAIL-F | Vigilances | priorisation |
| US-TRESO-DETAIL-RESPONSIVE | Responsive | cohérence multi-support |

---

## Suite logique

Découpage en **tickets d’exécution dev** : voir [`EXECUTION_TICKETS_DETAIL_TRESO.md`](./EXECUTION_TICKETS_DETAIL_TRESO.md) (**T-TR-DETAIL-001** à **008**), avec références croisées `SPEC_DETAIL_TRESO.md` §7–§12, §17, §19. Conserver les identifiants **US-TRESO-DETAIL-*** comme parent fonctionnel dans l’outil de suivi.
