# Backlog d’implémentation — Lynki V1

*Ce document matérialise le passage des livrables de cadrage vers des **tickets d’exécution**. Il complète le [plan de lots dev](./PLAN_LOTS_DEV_LYNKI_V1.md), le [mapping front ↔ données](./MAPPING_FRONT_DONNEES_LYNKI_V1.md) et la [checklist de recette](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md). Chaque ligne est un **candidat ticket** (ou sous-ticket) : à copier ou importer dans l’outil de suivi. **Template de ticket** : [`TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md`](./TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md).*

---

## 1. Objet du document

Ce backlog a pour objet de :

* proposer un **découpage ticketisable** aligné sur les **lots 0 à 6** ;
* rappeler pour chaque item : **lot**, **écran canon**, **composant**, **source de donnée visée**, **états** à couvrir, **priorité** ;
* fixer une **Definition of Done (DoD)** commune et des **DoD spécifiques** là où c’est utile.

Ce document **n’est pas** :

* la vérité unique des numéros de ticket outil (Jira, Linear, etc.) ;
* un substitut à l’[**annexe endpoints / champs**](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md) — à tenir à jour pour lever les `TBD` (cf. § 3.2 et [mapping § 9](./MAPPING_FRONT_DONNEES_LYNKI_V1.md)).

---

## 2. Statut du document

* **Version** : V1
* **Statut** : backlog de référence — à dupliquer / ajuster dans l’outil projet ; les IDs `BL-xx-yy` sont **internes** à ce fichier jusqu’à import
* **Auteur / responsable** : équipe produit / intégration Lynki (Dorevia)
* **Dernière mise à jour** : 23 mars 2026
* **Documents parents** :

  * [`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md)
  * [`CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md`](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)
  * [`PLAN_LOTS_DEV_LYNKI_V1.md`](./PLAN_LOTS_DEV_LYNKI_V1.md)
  * [`MAPPING_FRONT_DONNEES_LYNKI_V1.md`](./MAPPING_FRONT_DONNEES_LYNKI_V1.md)
  * [`CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md`](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md)
  * [`TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md`](./TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md)
  * [`ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md`](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md)
  * [`PLAN_EXECUTION_LYNKI_V1.md`](./PLAN_EXECUTION_LYNKI_V1.md) (suivi sprint / owner)

---

## 3. Schéma d’une ligne backlog

| Champ | Description |
|-------|-------------|
| **ID** | Identifiant stable dans ce document (`BL-lot-séquence`) |
| **Owner** | Responsable du ticket dans l’outil (nom ou rôle) — **à remplir à l’import** ; `—` tant que non assigné |
| **Dépend de** | Autre(s) `BL-…` ou ticket outil dont le démarrage doit précéder ou bloquer la livraison |
| **Lot** | 0 à 6 (cf. plan de lots) |
| **Écran canon** | Dossier Stitch `*_canon_v5` ou équivalent (`—` si transverse) |
| **Composant / périmètre** | Composant UI, route, ou chantier technique |
| **Source donnée (visée)** | Agrégat, API, mock — *à préciser* avec l’annexe mapping ; `TBD` autorisé **dans ce fichier** jusqu’à cadrage |
| **États donnée** | Sous-ensemble pertinent (cf. mapping § 6) |
| **États UI** | loading, vide, erreur, partiel, placeholder… |
| **Priorité** | P0 / P1 / P2 (alignée [CDC § 18](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)) |
| **DoD** | Réf. § 4 + colonne « Notes DoD » (incl. **Bloquant lot** si applicable) |

### 3.1 Règle de granularité des tickets

Un ticket doit être :

* **assez petit** pour être développé et recetté clairement dans un sprint ou une fraction de sprint ;
* **assez grand** pour produire une **valeur visible** ou une **brique réutilisable** (composant, page, flux cohérent) ;
* **aligné** sur un composant, une page, ou un **sous-ensemble d’écran** lisible.

**Éviter** :

* un ticket « faire tout le cockpit » sans découpage ;
* un ticket « ajuster 2 paddings » sans regroupement avec d’autres finitions du même périmètre.

### 3.2 Règle — sources de données `TBD`

> Tout ticket dont la colonne **Source donnée** reste **`TBD`** ne doit être **pris en développement effectif** qu’après **complétion** de la source, soit dans une **annexe endpoints / champs** (cf. [mapping § 9](./MAPPING_FRONT_DONNEES_LYNKI_V1.md)), soit **directement dans le ticket importé** (contrat validé produit). Sinon : risque de refactor inutile ou de faux « done ».

Les mocks / fixtures sont autorisés pour **Lot 1** et **prototypes** tant que c’est explicitement le périmètre du ticket.

### 3.3 Règles de ticketisation

1. Chaque **ID** peut devenir **un ticket** ou être **découpé** en sous-tickets (préciser le lien parent dans l’outil).
2. Tout ticket doit **référencer** : lot, écran canon, composant, états (cf. [CDC § 17](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)) — utiliser le [template](./TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md) à l’import.
3. Après implémentation, la **sortie de recette** suit [checklist § 10](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md).

---

## 4. Definition of Done — modèle commun

Sauf mention contraire dans le tableau, un item est **done** lorsque :

* le code est revu (pair / lead) ;
* les **états donnée** et **UI** prévus pour l’item sont **visibles** et **non régressifs** ;
* la **hiérarchie de lecture** du périmètre n’est pas dégradée (KPI > graphe quand applicable) ;
* les **références design** (`code.html` / `screen.png` du canon) ont été **contrôlées** ;
* la **checklist** du lot concerné est **passée** ou les écarts sont **tracés** ;
* pas de **KO** sur les items **[Critique]** de la checklist sans arbitrage produit écrit.

---

## 5. Backlog — Lot 0 (cadrage)

| ID | Owner | Dépend de | Écran | Composant / périmètre | Source | États donnée | États UI | P | Notes DoD |
|----|-------|-----------|-------|----------------------|--------|--------------|----------|---|-----------|
| BL-00-01 | — | — | — | Lecture + atelier : handoff, CDC, plan, mapping | — | — | — | P0 | Compte-rendu + liste d’actions |
| BL-00-02 | — | — | — | Inventaire `units/dorevia-linky/` vs cible V1 | — | — | — | P0 | Document d’écart partagé |
| BL-00-03 | — | BL-00-02 | — | Conventions : nommage, dossiers composants, états | — | — | — | P0 | ADR court ou wiki |
| BL-00-04 | — | BL-00-03 | — | Stratégie responsive + graphes (principes) | — | — | — | P0 | Aligné handoff § 11 / CDC |
| BL-00-05 | — | BL-00-01…04 | — | Backlog outil : import des BL-01+ ou équivalent | — | — | — | P0 | Première colonne sprint |

---

## 6. Backlog — Lot 1 (fondations UI)

| ID | Owner | Dépend de | Écran | Composant / périmètre | Source | États donnée | États UI | P | Notes DoD |
|----|-------|-----------|-------|----------------------|--------|--------------|----------|---|-----------|
| BL-01-01 | — | BL-00-05 | — | Layout app (shell, zones, navigation de base) | TBD | — | loading, vide | P0 | **Bloquant lot** ; cohérent lots suivants |
| BL-01-02 | — | BL-01-01 | — | Tokens / thème utilitaires (couleurs sémantiques confiance) | TBD | — | — | P0 | Alignement [CDC § 15](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md) points ouverts |
| BL-01-03 | — | BL-01-01 | — | Tuile maîtresse | Mock / fixture | fiable, partiel, proxy, à rapprocher, indispo, anomalie | loading, placeholder | P0 | **Bloquant lot** ; réutilisée Lot 2–5 |
| BL-01-04 | — | BL-01-03 | — | Tuile secondaire B | Mock | idem | idem | P0 | — |
| BL-01-05 | — | BL-01-04 | — | Tuile secondaire C + variante placeholder | Mock | placeholder | placeholder | P0 | Z de caisse |
| BL-01-06 | — | BL-01-01 | — | Bloc de confiance | Mock qualité | fiable → anomalie | partiel | P0 | **Bloquant lot** ; jamais décoratif |
| BL-01-07 | — | BL-01-01 | — | Bloc d’alerte | Mock | — | vigilance, critique | P0 | Distinction métier / donnée |
| BL-01-08 | — | BL-01-01 | — | Bloc insight | Mock | — | — | P0 | — |
| BL-01-09 | — | BL-01-01 | — | Badges statut / confiance | Mock | — | — | P0 | — |
| BL-01-10 | — | BL-01-01 | — | Filtres + sélecteurs période / entité | TBD | — | indispo | P0 | § 3.2 si TBD |
| BL-01-11 | — | BL-01-01 | — | Tableau analytique de base | Mock | partiel, vide | loading | P0 | Montants alignés |
| BL-01-12 | — | BL-01-03 | — | Sparkline | Mock série | partiel, indispo | — | P0 | KPI prioritaire |
| BL-01-13 | — | BL-01-12 | — | Barres + double série | Mock | idem | — | P0 | — |
| BL-01-14 | — | BL-01-13 | — | Breakdown simple | Mock | idem | — | P1 | — |

---

## 7. Backlog — Lot 2 (pilotage mobile Max)

*Écran canon :* `pilotage_mobile_max_canon_v5`

| ID | Owner | Dépend de | Composant / périmètre | Source donnée | États donnée | États UI | P | Notes DoD |
|----|-------|-----------|----------------------|---------------|--------------|----------|---|-----------|
| BL-02-01 | — | BL-01-01, BL-01-03, BL-01-06 | Route / page cockpit mobile | Agrégats dashboard / cockpit | mixte tuiles | loading, partiel | P0 | **Bloquant lot** |
| BL-02-02 | — | BL-01-10, BL-02-01 | Header + contexte période / entité | Filtres API | — | indispo | P0 | — |
| BL-02-03 | — | BL-01-06, BL-02-01 | Bandeau / statut confiance global | Agrégat intégrité | fiable → anomalie | partiel | P0 | — |
| BL-02-04 | — | BL-01-03 | Tuile Trésorerie (maîtresse) | Position / rapprochement | à rapprocher, partiel | — | P0 | — |
| BL-02-05 | — | BL-01-03 | Tuile Business (maîtresse) | Activité période | proxy, partiel | — | P0 | — |
| BL-02-06 | — | BL-01-03 | Tuile Flux net (maîtresse) | Flux période | partiel, à rapprocher | — | P0 | — |
| BL-02-07 | — | BL-01-04 | Tuiles secondaires compactes | Agrégats par domaine | partiel | placeholder | P0 | — |
| BL-02-08 | — | BL-01-08, BL-02-01 | Bloc insight / priorité | Agrégat ou règle métier | — | vide | P0 | — |
| BL-02-09 | — | BL-02-01 | Navigation mobile | — | — | — | P0 | — |

---

## 8. Backlog — Lot 2 bis (alertes / signaux Max)

*Écran canon :* `alertes_signaux_max_canon_v5`

| ID | Owner | Dépend de | Composant / périmètre | Source donnée | États donnée | États UI | P | Notes DoD |
|----|-------|-----------|----------------------|---------------|--------------|----------|---|-----------|
| BL-02b-01 | — | BL-01-07, BL-02-01 | Liste / cartes alertes hiérarchisées | Agrégat alertes | métier vs qualité donnée | critique, partiel | P0 | — |
| BL-02b-02 | — | BL-02b-01 | Badges criticité + filtre lecture | — | — | indispo liste | P0 | — |
| BL-02b-03 | — | BL-02b-01 | Liens vers détail / cockpit | — | — | — | P0 | — |
| BL-02b-04 | — | BL-02b-01 | État « aucune alerte majeure » | — | — | vide explicite | P0 | — |

---

## 9. Backlog — Lot 3 (pilotage desktop Véréna)

*Écran canon :* `pilotage_desktop_v_r_na_canon_v5`

| ID | Owner | Dépend de | Composant / périmètre | Source donnée | États donnée | États UI | P | Notes DoD |
|----|-------|-----------|----------------------|---------------|--------------|----------|---|-----------|
| BL-03-01 | — | BL-01-01, BL-01-03, BL-01-06, BL-01-10 | Page cockpit desktop + grille 12 tuiles | Multi-agrégats | mixte par tuile | loading partiel | P0 | **Bloquant lot** |
| BL-03-02 | — | BL-03-01 | Header enrichi + filtres | — | — | — | P0 | — |
| BL-03-03 | — | BL-01-06, BL-03-01 | Bloc confiance transverse | Qualité globale | fiable → anomalie | partiel | P0 | — |
| BL-03-04 | — | BL-01-03 | Tuiles maîtresses (×3) | cf. mapping § 7.3 | idem mobile + densité | — | P0 | — |
| BL-03-05 | — | BL-01-04 | Tuiles B (×5) | cf. mapping | partiel, proxy | — | P0 | — |
| BL-03-06 | — | BL-01-05 | Tuiles C (×4) dont Z caisse placeholder | — | placeholder | placeholder | P0 | — |
| BL-03-07 | — | BL-03-01 | Navigation vers détail (trésorerie, etc.) | — | — | — | P0 | — |
| BL-03-08 | — | BL-01-12…14, BL-03-04 | Cohérence graphes inter-tuiles | — | partiel | — | P0 | — |

---

## 10. Backlog — Lot 4 (synthèse comptable Esther)

*Écran canon :* `synth_se_desktop_esther_canon_v5`

| ID | Owner | Dépend de | Composant / périmètre | Source donnée | États donnée | États UI | P | Notes DoD |
|----|-------|-----------|----------------------|---------------|--------------|----------|---|-----------|
| BL-04-01 | — | BL-01-01, BL-01-06 | Page synthèse + résumé exécutif | Agrégats compta | fiable, partiel, proxy | loading | P1 | — |
| BL-04-02 | — | BL-04-01 | Blocs de synthèse structurés | — | partiel | — | P1 | — |
| BL-04-03 | — | BL-01-11 | Tableaux (CR, masses, échéances) | API / vault TBD | vide, partiel | — | P1 | § 3.2 si TBD |
| BL-04-04 | — | BL-01-06, BL-04-01 | Blocs confiance par section | — | anomalie | — | P1 | — |
| BL-04-05 | — | BL-01-14, BL-04-03 | Graphes breakdown / aging si prévus | — | partiel, indispo graphe seul | — | P1 | — |
| BL-04-06 | — | BL-04-01 | Entrées vers détail | — | — | — | P1 | — |

---

## 11. Backlog — Lot 5 (détail Trésorerie)

*Écran canon :* `d_tail_tr_sorerie_v_r_na_canon_v5`

| ID | Owner | Dépend de | Composant / périmètre | Source donnée | États donnée | États UI | P | Notes DoD |
|----|-------|-----------|----------------------|---------------|--------------|----------|---|-----------|
| BL-05-01 | — | BL-03-01 | Page détail + KPI principal | Position tréso | à rapprocher, fiable | — | P1 | — |
| BL-05-02 | — | BL-01-12, BL-05-01 | Graphe évolution / contexte | Séries TBD | partiel | — | P1 | § 3.2 si TBD |
| BL-05-03 | — | BL-01-11, BL-05-01 | Tableau / détail contextuel | Lignes TBD | partiel, anomalie | — | P1 | § 3.2 si TBD |
| BL-05-04 | — | BL-01-06, BL-05-01 | Bloc rapprochement / confiance | — | à rapprocher | — | P1 | — |
| BL-05-05 | — | BL-05-01 | Retour cockpit | — | — | — | P1 | — |

---

## 12. Backlog — Lot 6 (stabilisation)

| ID | Owner | Dépend de | Composant / périmètre | Source donnée | États donnée | États UI | P | Notes DoD |
|----|-------|-----------|----------------------|---------------|--------------|----------|---|-----------|
| BL-06-01 | — | Lots 2 à 5 livrés (écrans canon) | Passage checklist transverse § 6–8 | — | — | — | P0 | — |
| BL-06-02 | — | BL-06-01 | Alignement cross-screen (badges, graphes, confiance) | — | — | — | P0 | — |
| BL-06-03 | — | BL-06-01 | Alignement cross-device (Max vs Véréna / Esther) | — | — | — | P0 | — |
| BL-06-04 | — | BL-06-02…03 | Dette résiduelle + liste V2 | — | — | — | P0 | — |
| BL-06-05 | — | BL-06-04 | Démo / prod interne — gate § 8 checklist | — | — | — | P0 | — |

---

## 13. Synthèse priorités

| Priorité | Périmètre |
|----------|-----------|
| **P0** | Lots 0–3 + stabilisation critique (BL-06-xx) + fondations |
| **P1** | Lots 4–5 + breakdown Lot 1 |
| **P2** | Enrichissements non bloquants V1 (hors tableau — à tracer à part) |

---

## 14. Formule opérationnelle

> Un backlog utile est un backlog **branché** : lot, écran canon, composant, états, DoD, **dépendances**, **owner**. Le reste est de la bonne volonté.

---

*Backlog V1 Lynki — à importer dans l’outil de suivi avec le [template de ticket](./TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md) ; synchroniser avec l’annexe endpoints / champs quand elle existe.*
