# Wireframe textuel détaillé — Écran détail Trésorerie

## Vue d’ensemble

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header global Lynki                                                         │
│ [Tenant] [Société] [Période] [Année]                                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ A. BANDEAU DE SYNTHÈSE                                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┬──────────────────────────────────────────────┐
│ B. DÉCOMPOSITION              │ C. RAPPROCHEMENT BANCAIRE                    │
└───────────────────────────────┴──────────────────────────────────────────────┘

┌───────────────────────────────┬──────────────────────────────────────────────┐
│ D. ÉCART À CONFIRMER          │ E. ÉVOLUTION DE LA TRÉSORERIE                │
└───────────────────────────────┴──────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ F. VIGILANCES ET ACTIONS                                                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Footer Lynki                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# Bloc A — Bandeau de synthèse

**Spec produit (verrou) :** `SPEC_DETAIL_TRESO.md` **§7** — structure ligne par ligne, méta secondaire, duplication C/D.

## Intention

Donner la lecture de référence en un seul regard : **position**, **qualité**, **reste à rapprocher**, **écart à confirmer**, sans surcharge.

## Wireframe — bandeau minimal (référence)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TRÉSORERIE                                                   [Partiel ●]    │
│ La Platine · Exercice à date · 2026                                          │
│ Arrêté : 30/03/2026 08:42 · Synchro OK                                       │
│                                                                              │
│  118 179,42 €                                                                │
│  Solde validé                                                                │
│                                                                              │
│  Couverture probante         Montant à rapprocher      Écart à confirmer     │
│  69 % ▓▓▓▓▓▓▓░░░             43 228,60 €               21 500,00 €          │
└──────────────────────────────────────────────────────────────────────────────┘
```

*(Barre sous la couverture : recommandée, compacte ; % obligatoire — cf. spec §7.5.)*

## Wireframe — variante dense (desktop large, optionnel)

```text
│ Arrêté : 30/03/2026 08:42 · 3 comptes · Synchro OK                           │
```

*(Comptes / opérations ouvertes : plutôt bloc C ; ici seulement si espace.)*

## Hiérarchie

1. titre + badge d’état  
2. périmètre  
3. arrêté + synchro (+ méta courte optionnelle)  
4. montant principal + *Solde validé*  
5. trois colonnes : couverture → montant à rapprocher → écart à confirmer  

## Notes UX

* le badge `Partiel` reste visible mais **secondaire** au montant principal
* la barre de couverture reste **compacte** (ne pas dominer le bandeau)
* **Montant à rapprocher** avant **Écart à confirmer** (même ordre que la tuile cockpit)

---

# Bloc B — Décomposition de la trésorerie

**Spec produit (verrou) :** `SPEC_DETAIL_TRESO.md` **§8** — quatre lectures cœur, concentration / qualité par composante, cohérence A/C/D/F.

## Intention

Répondre à : **de quoi est faite la trésorerie que je lis ?** — composition, poids, couverture par compte, risque de concentration (pas une simple liste de comptes).

## Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ DÉCOMPOSITION DE LA TRÉSORERIE                                               │
│ Ce qui compose le solde validé                                                │
│                                                                              │
│ Catégorie        Compte / Journal        Solde        Couverture   Poids     │
│ ──────────────────────────────────────────────────────────────────────────── │
│ Banque           SG Pro                  96 679,42 €   72 %         81,8 %   │
│ Banque           BNP                     19 500,00 €   100 %        16,5 %   │
│ Espèces          Caisse boutique          2 000,00 €   100 %         1,7 %   │
│                                                                              │
│ [Voir détail par compte]   [Filtrer comptes dégradés]                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Variante enrichie

Sous chaque ligne importante, possibilité d’afficher :

```text
Dernier relevé : 29/03/2026 · Statut : Partiel · 4 opérations ouvertes
```

## Notes UX

* les quatre axes **compte / solde / couverture / poids** restent prioritaires (cf. spec §8.9)
* un compte fortement pondéré mais peu couvert doit être lisible sans croiser d’autres écrans (§8.7)
* tri par défaut : **solde** ou **contribution** décroissante (§8.11)

---

# Bloc C — Rapprochement bancaire

**Spec produit (verrou) :** `SPEC_DETAIL_TRESO.md` **§9** — quatre lectures cœur, hiérarchie synthèse → détail, cohérence tuile / bandeau.

## Intention

Montrer la masse restante à traiter et les lignes qui l’expliquent — **cœur métier** du détail (fiabilisation, lien **Partiel** / **À confirmer**).

## Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ RAPPROCHEMENT BANCAIRE                                                       │
│ Ce qui reste à traiter pour améliorer la qualité de lecture                  │
│                                                                              │
│ Montant à rapprocher     Opérations ouvertes     Part non couverte           │
│ 43 228,60 €              27                      31 %                         │
│                                                                              │
│ Répartition par ancienneté                                                   │
│ 0–7 j : 18 540 €   8–30 j : 14 200 €   >30 j : 10 488,60 €                  │
│                                                                              │
│ Principaux éléments non rapprochés                                         │
│ ──────────────────────────────────────────────────────────────────────────── │
│ Date        Libellé                         Compte        Montant   Âge       │
│ 28/03/2026  VIR CLIENT X                    SG Pro        8 400 €   2 j       │
│ 25/03/2026  CB FOURNISSEUR Y                SG Pro        5 780 €   5 j       │
│ 12/03/2026  REMISE CHÈQUES                  BNP           4 200 €   18 j      │
│                                                                              │
│ [Voir toutes les opérations]   [Voir par compte]   [Voir par ancienneté]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Notes UX

* la synthèse doit précéder la table
* l’ancienneté est importante pour le pilotage
* les plus gros montants ouverts doivent être immédiatement visibles

---

# Bloc D — Écart à confirmer

**Spec produit (verrou) :** `SPEC_DETAIL_TRESO.md` **§10** — absolu vs signé, qualification, explications, cohérence tuile / bandeau.

## Intention

Expliquer le décalage résiduel dans la lecture du solde — **compréhension du doute** (entre quelles lectures, sens, causes), pas seulement un montant isolé.

## Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ÉCART À CONFIRMER                                                            │
│ Décalage résiduel dans la lecture du solde                                   │
│                                                                              │
│ Écart à confirmer                                                            │
│ 21 500,00 €                                                                  │
│                                                                              │
│ Lecture comptable (ERP)      Position validée      Écart signé               │
│ 96 679,42 €                  118 179,42 €          -21 500,00 €              │
│                                                                              │
│ Qualification : [Écart transitoire]                                          │
│                                                                              │
│ Principaux postes explicatifs                                                │
│ • Relevé en attente : 21 500,00 €                                            │
│ • Flux non rapprochés significatifs : 8 400,00 €                             │
│ • Décalage de temporalité comptable : en cours de résorption                 │
│                                                                              │
│ [Voir le détail du calcul]   [Voir les éléments explicatifs]                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Variante si plus simple en V1

Remplacer la zone “Explication possible” par :

```text
Principaux postes expliquant l’écart
- Relevé en attente : 21 500,00 €
- Flux non rapprochés significatifs : 8 400,00 €
```

## Notes UX

* garder le mot **Écart à confirmer**
* ne pas titrer le bloc `Écart ERP − Vault`
* le signé peut exister ici, pas besoin en tuile

---

# Bloc E — Évolution de la trésorerie

**Spec produit (verrou) :** `SPEC_DETAIL_TRESO.md` **§11** — quatre lectures cœur, hiérarchie trésorerie → couverture → rapprochement → vélocité, ruptures / stagnation, recette.

## Intention

Montrer la trajectoire, pas seulement la photo : position validée, qualité de lecture, effort de rapprochement et vélocité récente.

## Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ÉVOLUTION DE LA TRÉSORERIE                                                   │
│ Tendance de la position et de la qualité de lecture                          │
│                                                                              │
│ [Courbe trésorerie]                                                          │
│  130k ┤                            ●                                         │
│  120k ┤                      ●                                               │
│  110k ┤                ●                                                     │
│  100k ┤          ●                                                           │
│   90k ┤    ●                                                                 │
│       └────────────────────────────────────────────                         │
│         début période                                 aujourd’hui            │
│                                                                              │
│ Évolution de la couverture probante                                          │
│ J-30  42 %   J-15  55 %   J-7  63 %   Aujourd’hui 69 %                      │
│                                                                              │
│ Évolution du montant à rapprocher                                            │
│ 58 100 €  →  51 300 €  →  43 228,60 €                                        │
│                                                                              │
│ Vélocité du rapprochement                                                    │
│ +6 points sur 7 jours                                                        │
│                                                                              │
│ [Voir la période complète]   [Comparer à J-7]                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Notes UX

* éviter 4 graphiques lourds si 2 suffisent
* la vélocité est un résumé très utile
* il faut voir si la situation :

  * progresse
  * stagne
  * se dégrade

---

# Bloc F — Vigilances et actions

**Spec produit (verrou) :** `SPEC_DETAIL_TRESO.md` **§12** — quatre lectures cœur, 3 niveaux, CTA limités, cohérence A/C/D/E.

## Intention

Transformer la lecture en **priorités d’action** : où agir, sous quel niveau de risque, avec quels liens de traitement — sans console d’alertes illisible.

## Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ VIGILANCES ET ACTIONS                                                        │
│ Priorités opérationnelles pour améliorer la lecture de trésorerie            │
│                                                                              │
│ 🔴 Critique / bloquant                                                       │
│ • Compte SG Pro : 8 400 € non rapprochés depuis 18 jours                     │
│ • Écart à confirmer significatif sur la période courante                     │
│                                                                              │
│ 🟠 Important / à surveiller                                                  │
│ • Couverture probante inférieure à 70 %                                      │
│ • 3 opérations > 5 000 € toujours ouvertes                                   │
│                                                                              │
│ 🔵 Information / amélioration possible                                       │
│ • BNP désormais couverte à 100 %                                             │
│ • Montant à rapprocher en baisse sur 7 jours                                │
│                                                                              │
│ Actions prioritaires                                                         │
│ [Traiter les opérations non rapprochées]                                     │
│ [Ouvrir le compte SG Pro]                                                    │
│ [Voir les paiements liés]                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Notes UX

* hiérarchie : critique → important → information → CTA
* **3 à 5** vigilances visibles d’emblée, **3 actions** max en tête (cf. spec §12.10)
* les vigilances doivent rester **cohérentes** avec les blocs A, C, D, E

---

# Version desktop — composition recommandée

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ A. Bandeau de synthèse (pleine largeur)                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┬──────────────────────────────────────────────┐
│ B. Décomposition              │ C. Rapprochement bancaire                    │
│                               │                                              │
│                               │                                              │
└───────────────────────────────┴──────────────────────────────────────────────┘

┌───────────────────────────────┬──────────────────────────────────────────────┐
│ D. Écart à confirmer          │ E. Évolution de la trésorerie                │
│                               │                                              │
└───────────────────────────────┴──────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ F. Vigilances et actions                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# Version tactile — composition recommandée

## iPad

```text
A
B
C
D
E
F
```

Avec éventuellement :

* B et D regroupables en accordéons
* C et E prioritaires dans l’ordre de scroll

## Phone

```text
A
F
C
D
B
E
```

Ordre conseillé sur phone :

1. synthèse
2. actions
3. rapprochement
4. écart
5. décomposition
6. évolution

Car sur phone, il faut privilégier :

* lecture immédiate
* priorité d’action
* compréhension rapide

---

# Résumé de la logique d’écran

## Le lecteur doit sortir avec :

* **ce que vaut la trésorerie retenue**
* **ce qui porte ce solde**
* **ce qu’il reste à rapprocher**
* **quel décalage subsiste**
* **si ça progresse**
* **où agir**