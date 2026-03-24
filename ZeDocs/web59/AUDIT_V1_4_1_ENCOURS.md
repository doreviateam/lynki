# Audit court — V1.4-1 `/encours`

**Date** : 24 mars 2026  
**Entrée** : `units/dorevia-linky/app/(cockpit)/encours/page.tsx` + dépendances réelles.  
**Référence backlog** : [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md) (grille d’audit V1.4-1).

---

## 1. Surface actuelle

| Élément | État |
|--------|------|
| **TopBar** | Titre générique *« Lynki Desktop Cockpit »* + score de confiance cockpit (pas un header métier « Encours » ni périmètre explicite). |
| **Fil d’Ariane** | Présent : Pilotage → Détail Encours clients. |
| **KPI principal** | Carte *« Créances clients ouvertes »* : `dashboardMetrics.encours` (`formatted` / valeur), `status_reason` si présent, `ConfidenceScore`. |
| **Synthèse** | Bloc *« Synthèse des créances »* : montants **Ouvert** / **Échu**, compteurs **Factures** / **Échues**, alerte **factures sans date d’échéance** si `missing_due_date_count > 0`. |
| **Table par client** | Affichée si `ar_by_partner.partners.length > 0` : client, **Ouvert**, **Échu**, **Part %** ; `meta.warnings` en pied. |
| **Sans `ar_by_partner`** | Encadré en pointillés : *« Détail des créances non disponible pour cette période. »* |
| **Sans `encoursKpi`** (après chargement) | Grand état vide : *« Encours clients non disponibles »* + mention Vault. |
| **Chargement** | Skeletons sur KPI et synthèse. |

**Conclusion** : ce n’est **plus un simple shell** : il y a déjà **KPI + agrégats ouvert/échu + table partenaires** lorsque `_details.business.ar_by_partner` est peuplé. Il manque en revanche une **couche « page détail V1.4 »** : périmètre (période, société, source), états **erreur réseau** explicites, alignement avec la **grammaire d’états** V1.3.

---

## 2. Données tenues (chaîne réelle)

| Source | Rôle |
|--------|------|
| **`useDashboardData`** | Contexte tenant / société / période ; fetch **`/api/dashboard-metrics`** (ou `/api/instruments` si `NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE=1`). |
| **`GET /api/dashboard-metrics`** | Construit `encours` (montant AR ouvert) et `_details.business.ar_by_partner` à partir des appels Vault (dont `arByPartnerRes`, fusion possible avec `arDivaContextRes` pour liste partenaires / totaux — voir commentaires dans `route.ts`). |
| **Type `ArByPartnerDetail`** | `totals` : `open_amount`, `overdue_amount`, `open_count_invoices`, `overdue_count_invoices`, `missing_due_date_count` ; `partners[]` : `partner_id`, `partner_name?`, `open_amount`, `overdue_amount`, `share_percent` ; `meta.freshness`, `meta.warnings?`. |

| Question | Réponse |
|----------|---------|
| **KPI principal** | **Oui** : `encours` (AR ouvert), formaté côté API. |
| **Détail par client** | **Oui** si `ar_by_partner` présent : une ligne par partenaire avec ouvert / échu / part. |
| **Échéances / ancienneté fines** | **Non** dans ce payload : pas de colonnes type date d’échéance ni tranches 0–30j / 31–60j comme sur `/api/accounting/aged-receivables` (synthèse). Seulement **binaire ouvert vs échu** + comptage factures sans échéance au global. |
| **Trous de périmètre** | La page **n’affiche pas** période / société / fraîcheur de source en une ligne lisible ; **`metricsError`** du hook **n’est pas consommé** sur cette page → risque d’état « vide » indistinct d’« erreur ». |

---

## 3. Segmentation honnête possible

| Option | Faisabilité avec données actuelles |
|--------|-------------------------------------|
| **Ouvert / Échu** (agrégat + par ligne) | **Déjà aligné** sur les champs `open_amount` / `overdue_amount`. |
| **À échoir / Échu / Critique** | **« Critique »** n’a **pas** de champ dédié dans `ArByPartnerDetail` : il faudrait une **définition dérivée** (ex. part des échus, seuil) **sans** la présenter comme une vérité métier absolue, ou **s’abstenir** et garder une segmentation **à deux buckets** + mention des **warnings** API. |
| **Version plus sobre** | **Recommandée** si pas de règle métier écrite : renforcer **Ouvert vs Échu**, **missing due date**, **warnings**, éventuellement **tri** partenaires par `overdue_amount`. |

---

## 4. Écart à la structure cible (backlog V1.4-1)

| Bloc cible | Écart |
|------------|--------|
| **En-tête de page** | Pas de titre périmètre type « Encours » + **période / société / source** (comme `AccountingBlockPerimeterLine`). |
| **Indicateur principal** | **Proche du cible** (à compléter par périmètre et gestion erreur). |
| **Répartition / statut** | **Partiel** : ouvert/échu oui ; pas de troisième segment **honnete** sans règle ou donnée supplémentaire. |
| **Exposition par client** | **Oui** (sans échéances ligne à ligne). |
| **États homogènes** | **Écart** : pas de `AccountingBlockUnavailable` / message erreur explicite ; pas de **partial** structuré si une sous-partie manque. |

---

## 5. Verdict — première version crédible (sans faux signal ni backend implicite)

> **On peut livrer une V1 « crédible » en restant sur `dashboard-metrics` + `ar_by_partner` : clarifier le périmètre en en-tête, traiter explicitement l’erreur réseau / indisponibilité, homogénéiser les états (chargement / vide / partiel / indisponible), et calibrer la segmentation sur Ouvert / Échu (+ alertes factures sans échéance + warnings) sans inventer un troisième bucket « critique » sans définition produit.**

**Hors scope tacite pour cette première salve** : colonnes d’**ancienneté détaillée** par facture ou par client — cela pointerait plutôt vers **réutilisation ou alignement** avec les données **`/api/accounting/aged-receivables`** (décision **explicite** + éventuellement double appel, donc hors « backend implicite »).

---

*Audit rédigé pour débloquer l’implémentation V1.4-1 sans rapport lourd.*
