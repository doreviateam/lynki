# Correction divergence Linky / Odoo — Clients en retard

**Date :** 2026-02-28  
**Contexte :** Linky affichait 1 client en retard (EXPORT MY ISLAND, 5 323 €) alors qu'Odoo en affichait 3 (EXPORT MY ISLAND, JRS DISTRIBUTION, SAVEUR KARAYB, 11 671 € HT).

---

## Cause identifiée

L'agrégation AR by Partner (`GET /ui/aggregations/ar-by-partner`) filtrait les factures par `invoice_date` dans la période `[date_debut, date_fin]`. Pour l'exercice 2025, seules les factures **émises** en 2025 étaient incluses.

- **EXPORT MY ISLAND** : factures en retard émises en 2025 → visibles
- **SAVEUR KARAYB** et **JRS DISTRIBUTION** : factures en retard émises en 2026 → exclues

Odoo, lui, affiche toutes les factures en retard sans filtre d'exercice.

---

## Correction appliquée

**Fichier :** `sources/vault/internal/storage/aggregations_ar_by_partner.go`

La date de fin effective est étendue jusqu'à `as_of_date` lorsque celle-ci est postérieure à `date_fin` :

```go
toEffective := to
if asOf.After(to) {
    toEffective = asOf
}
```

Résultat : pour une vue « exercice 2025 » avec `as_of_date = 2026-02-28`, les factures émises en janvier–février 2026 déjà en retard sont désormais incluses.

---

## Vérification

Après correction et redéploiement du Vault, Linky doit afficher les 3 clients en retard avec des montants alignés sur Odoo.

---

## Point d’attention : doublons

La table `documents` peut contenir plusieurs lignes pour une même facture (ré-ingestion). L’agrégation ne déduplique pas encore par `odoo_id`, ce qui peut gonfler légèrement les montants. Une évolution ultérieure pourrait ajouter une déduplication (ex. `DISTINCT ON (odoo_id)` ou sous-requête avec `ROW_NUMBER()`).
