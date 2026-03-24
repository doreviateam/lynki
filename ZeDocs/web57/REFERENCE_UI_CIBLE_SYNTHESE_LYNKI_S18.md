# Référence UI cible — Synthèse comptable (Sprint 18)

**Fichier canonique :** `REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md`  
**Version :** 0.3.1 — mars 2026  
**Plan :** [PLAN_SPRINT_18_LYNKI.md](PLAN_SPRINT_18_LYNKI.md) v1.0  
**Tickets :** [EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1 *(gel canonique — base d’exécution)*  

---

## 1. Objet

Ce document **ancre** la **north star visuelle** du Sprint 18 dans l’écosystème ZeDocs : **composition**, **check produit**, **emplacement de la maquette HTML** (ou export figé), **matrice d’adaptation** (sortie T99).

**Le HTML ne doit pas être codé tel quel** : il doit être **traduit** en Lynki mature, vérifiable et sobre ([plan §3](PLAN_SPRINT_18_LYNKI.md)).

---

## 2. Statut de la maquette (identique au plan §3.0)

La **maquette HTML** cible est une **référence de composition visuelle**.  
Elle ne constitue **ni** un contrat de données, **ni** une obligation de reprise **bloc à bloc à l’identique**.

---

## 3. Fichier maquette — emplacement

| Artefact | Emplacement |
|----------|-------------|
| Maquette HTML figée | **`ZeDocs/web57/ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html`** — *versionnée dans le dépôt (mars 2026)* |
| Variante ou lien interne | *À renseigner si une maquette « source » existe ailleurs (Figma, drive)* |

### 3.1 Libellés dans le HTML — avertissement

Le fichier annexe contient des **wordings de démonstration** (*Vault certifié*, *Base certifiée*, *Certifié* sur snapshot, *Analyse contrôlée*, hash court, etc.). **Ils ne constituent pas un engagement produit** : en implémentation, appliquer le [plan Sprint 18 §3.2–3.3](PLAN_SPRINT_18_LYNKI.md) et la matrice T99 (§5.1) — **reformuler ou retirer** tout niveau de preuve non porté par le backend.

---

## 4. Check de cohérence produit (par bloc maquette)

Pour **chaque** bloc repris ou adapté, poser **trois questions** :

1. **Est-ce que Lynki sait vraiment afficher ça ?** (données, routes, états)
2. **Est-ce que le backend le porte ?** (preuve, agrégations, idempotence)
3. **Le wording est-il honnête ?** (plan §3.2, §3.3 — pas plus fort que la réalité)

Si une réponse est **non** → **adapter**, **simplifier**, **reporter** ou **interdire** jusqu’à capacité explicite.

---

## 5. Lien avec les tickets

| Ticket | Usage de ce document |
|--------|----------------------|
| **T99** | Inventaire + matrice plan §3.1 + check §4 ; **remplir §5.1** (ou renvoyer vers annexe / note liée) |
| **T100–T102** | Référence spacing / hiérarchie sans copier le HTML |
| **T103** | Blocs « pleins » vs **états vides nobles** (plan §8.4) |
| **T104** | Archivage du chemin maquette + lien vers **§5.1** si la matrice est ici ; écarts dans le rapport S18 |

### 5.1 Matrice d’adaptation maquette → Lynki *(sortie obligatoire T99)*

La **matrice bloc par bloc** doit résider dans **un seul artefact « vivant »** référencé depuis le **rapport S18** et depuis ce fichier. **Emplacement privilégié :** ce tableau (à compléter en fin de T99) ; **alternatives :** annexe au rapport S18, ou note `ZeDocs/web57/…` avec lien bidirectionnel. **Règle :** pas de **deuxième copie** à jour ailleurs — les autres documents ne font que **pointer** vers l’artefact canonique ([EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) T99 §2bis).

| # | Bloc maquette | Décision S18 | Équivalent Lynki | Écarts assumés | Reformulations wording | Réf. maquette (lignes HTML) |
|---|---------------|-------------|------------------|----------------|----------------------|----------------------------|
| 1 | **Header** (titre, actions, badges, onglets, filtres) | **Repris** — enrichir hiérarchie typo, pas de refonte nav globale | `AccountingSummaryView` en-tête (h1 + sélecteurs période / société) | Pas d'onglets Pilotage/Synthèse (déjà dans `DashboardWithFilters`) ; pas de segmented control ; boutons CSV/DOCX reportés dans blocs existants | « Vault certifié » → **interdit** ; remplacer par badge réel d'état source (ex. *Source : Vault*, *Dernière sync*) | l.82–124 |
| 2 | **Vue d'ensemble / chaîne de lecture** | **Repris** (version sobre) | Nouveau : bandeau intro léger sous le header | Pas le texte marketing « surface de lecture probante » ; garder seulement la chaîne de drill-down | Texte sobre : *Chaîne de lecture : Synthèse → BG → GL → Écriture* | l.126–139 |
| 3 | **4 KPI cards** (Bilan, CdR, Tiers, BG) | **Repris** | `AccountingSummaryKpiCards` existant | Orbes décoratifs non repris (blur-3xl) ; montants de démonstration → données réelles | Libellés actuels conservés (honnêtes) ; pas de badge « Équilibré » sans check backend Actif=Passif — déjà implémenté | l.141–256 |
| 4 | **Tendance 12 mois** (line chart) | **Repris** | `AccountingSummaryTrendChart` existant (T93) | SVG maquette → Recharts ; badges « Base certifiée » → supprimé | Légende : *Résultat CdR mensuel* (conservé S17) ; supprimer « Base certifiée » | l.261–337 |
| 5 | **Répartition charges** (donut) | **Repris** | `AccountingSummaryBreakdownChart` existant (T94) | Donut CSS maquette → Recharts PieChart ; couleurs propres conservées | Légendes existantes S17 conservées | l.339–374 |
| 6 | **Lecture Diva** | **Repris** | `AccountingInsightBlock` existant (T95) | Layout grille Diva + Preuve côte à côte (maquette) → appliqué | « Analyse contrôlée » → **interdit** ; garder *Diva* / *Analyse comptable* (neutre) | l.338–366 |
| 7 | **Statut de preuve / intégrité** | **Repris** | `AccountingSummaryProofBlock` existant (T96) | 4 lignes preuve maquette → structure actuelle conservée (cohérence + horodatage + statut + hash) | « Certifié » / « Snapshot certifié » → **interdit** ; garder *Consolidé sur périmètre* / *Partiel* / *Non exposé* (S17) ; hash court = libellé transparent existant | l.368–399 |
| 8 | **Points d'attention** | **Repris partiellement** (T103) | Nouveau composant : `AccountingSummaryAlerts` (V1 ou état vide noble) | Pas de faux contenu ; si pas de matière → vide noble (message + périmètre) | Pas de libellé fort | l.401–453 |
| 9 | **Préparation CODIR / documentation** | **Repris partiellement** (T103) | Nouveau composant : `AccountingSummaryCodirBlock` (V1 — lien vers DOCX existant) | Pas de checkboxes « Inclure la BG » si le backend ne les gère pas encore ; lien simple vers export existant | Pas de promesse « rapport CODIR complet » — V1 honnête | l.455–479 |
| 10 | **Nav bottom mobile** | **Reporté** | Aucun — pas en S18 | Navigation globale Lynki inchangée (plan §3.1) | — | l.484–503 |
| 11 | **Bloc confiance** (rapprochement bancaire) | **Repris** (existe déjà) | `BankReconciliationBlock` existant (S15) | Pas dans la maquette HTML mais dans l'ossature S15–17 → **conservé en tête** (plan §1.1) | Libellés existants honnêtes conservés | — (hors maquette, mais §1.1) |

*(Croiser avec [plan §3.1](PLAN_SPRINT_18_LYNKI.md).)*

---

## 6. Historique

| Version | Date | Changement |
|---------|------|------------|
| 0.1 | 2026-03 | Création : statut maquette, emplacement, check à 3 questions, lien tickets. |
| 0.2 | 2026-03 | **§5.1** — emplacement canonique de la **matrice T99** ; lien tickets **[EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1**. |
| 0.3 | 2026-03 | Dépôt **`ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html`** ; **§3.1** avertissement libellés démo vs honnêteté produit. |
| 0.3.1 | 2026-03 | **§5.1** — rappel **source de vérité unique** pour la matrice T99 (pointeurs ailleurs, pas de copies parallèles). |

---

*Annexe de référence Sprint 18 — à maintenir quand la maquette HTML est déposée dans le dépôt.*
