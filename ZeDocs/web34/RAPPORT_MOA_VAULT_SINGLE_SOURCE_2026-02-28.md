# Rapport MOA — Vault comme source unique pour Linky (Phase 1)

**Date :** 2026-02-28  
**Objet :** Migration incrémentale vers Vault comme source unique de données pour Linky  
**Statut :** Phase 1 réalisée

---

## 1. Contexte

Suite à l’analyse des sources de données de Linky, la MOA a validé l’objectif de **Vault comme seule source** pour Linky, afin de :
- Renforcer la cohérence et la traçabilité
- Simplifier l’intégration et la maintenance
- Aligner le produit sur le principe « Décidez sur des données vérifiables »

---

## 2. Travail réalisé (Phase 1)

### 2.1 Ratios certifiés : source Vault

**Problème :** Les ratios certifiés (ventes / achats) utilisaient `ODOO_METRICS_URL` pour récupérer `posted_sales_count` et `posted_purchases_count` depuis Odoo.

**Solution :** Le Vault fournit désormais ces comptages directement dans les agrégats ventes et achats :

| Modification | Fichier | Détail |
|--------------|---------|--------|
| Vault — Modèle | `sources/vault/internal/models/aggregations.go` | Ajout des champs `posted_sales_count`, `posted_purchases_count` dans `SalesAggregationResponse` |
| Vault — Storage | `sources/vault/internal/storage/aggregations_sales.go` | `PostedSalesCount` = nombre de factures vaultées (dédupliquées) |
| Vault — Storage | `sources/vault/internal/storage/aggregations_purchases.go` | `PostedPurchasesCount` = nombre de factures vaultées (dédupliquées) |
| Linky — BusinessCard | `units/dorevia-linky/components/BusinessCardWithPolling.tsx` | Transmission de `postedSalesCount` et `postedPurchasesCount` depuis les réponses API |

**Sémantique :** En mode single-source Vault, le ratio certifié est calculé sur la base des factures connues du Vault. Lorsque la synchronisation Odoo → Vault est complète, ce ratio est aligné avec la réalité Odoo.

**Compatibilité :** Aucune modification côté contrat API. Les clients existants qui consomment ces champs continuent de fonctionner.

---

### 2.2 Suppression de la dépendance Odoo directe

- `ODOO_METRICS_URL` et `odoo-metrics.ts` ne sont plus nécessaires pour les ratios certifiés.
- Les cartes Ventes et Achats s’appuient uniquement sur les réponses `/api/sales` et `/api/purchases`, qui transitent par le Vault.

---

## 3. Phases suivantes (à planifier)

| Phase | Périmètre | Statut |
|-------|-----------|--------|
| **Phase 2** | Proxy DLP via Vault | À planifier |
| **Phase 3** | Proxy DIVA via Vault | À planifier |

**Objectif des phases 2 et 3 :** Exposer DLP et DIVA via des routes Vault (`/ui/dlp/*`, `/ui/diva/*`) afin que Linky n’appelle que le Vault.

---

## 4. Déploiement

### Vault

1. Reconstruire l’image :  
   `docker build -t dorevia/vault:single-source-phase1 ./sources/vault`
2. Mettre à jour le `docker-compose` pour utiliser cette image.
3. Redémarrer le service Vault.

### Linky

Aucune variable d’environnement supplémentaire. Les modifications sont rétrocompatibles.

---

## 5. Vérifications

- [ ] Vault : `GET /ui/aggregations/sales?tenant=...&date_debut=...&date_fin=...` retourne `posted_sales_count`.
- [ ] Vault : `GET /ui/aggregations/purchases?tenant=...&date_debut=...&date_fin=...` retourne `posted_purchases_count`.
- [ ] Linky : Les cartes Business affichent correctement le ratio certifié.

---

## 6. Références

- Correction AR (clients en retard) : `ZeDocs/web34/FIX_LINKY_ODOO_CLIENTS_RETARD_2026-02-28.md`
- Discussions : cohérence Odoo/Linky, source unique Vault
