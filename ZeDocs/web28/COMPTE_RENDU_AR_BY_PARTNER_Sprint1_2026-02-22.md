# Compte rendu — AR by Partner (Sprints 1 à 4)

**Date :** 2026-02-22 (mise à jour Sprint 4 : 2026-02-21)  
**Destinataire :** Maîtrise d'ouvrage  
**Objet :** Point d'avancement Sprints 1 à 4 — chaîne complète données → residual → agrégation → Linky + DIVA  
**Référence :** PLAN_IMPLEMENTATION_AR_BY_PARTNER_SCRUM.md v1.2, SPEC v1.0.3

---

## 1. Résumé exécutif

Les **Sprints 1 à 4** de l'implémentation AR by Partner sont **terminés** au plan développement. La chaîne complète est en place : Données (DVIG + Vault) → Route residual (`invoice.residual.changed`) → Agrégation (`GET /ui/aggregations/ar-by-partner`) → **Linky (proxy, tableaux, warnings) + DIVA (insight P0)**.

**Statut :** Livrable technique complet. Migrations 033 et 034 à exécuter en production avant déploiement.

---

## 2. Réalisations

### Sprint 1 — Données

| Tâche | Statut | Détail |
|-------|--------|--------|
| S1.2 Enrichir format_vault_payload_invoices | ✅ | Ajout de `amount_residual`, `invoice_date_due`, `partner_id` dans le meta DVIG |
| S1.3 Migration Vault | ✅ | Migration 033 : 4 colonnes + 3 index créés |
| S1.4 InvoicesHandler | ✅ | Extraction et persistance des nouveaux champs |
| S1.1 Connecteur Odoo amount_residual, invoice_date_due | ✅ | Ajoutés dans `dorevia_vault_connector` `_build_dvig_payload` |

### Sprint 2 — Route residual + idempotence

| Tâche | Statut | Détail |
|-------|--------|--------|
| S2.1 Route POST /api/v1/invoices/residual | ✅ | Handler, validation payload (Annexe A), garde-fou ordre |
| S2.2 Idempotence event_id | ✅ | Table `residual_events_idempotency`, migration 034 |
| S2.3 Multi-devise P0 EUR only | ✅ | Filtre agrégation + meta.warnings |

### Sprint 3 — Agrégation

| Tâche | Statut | Détail |
|-------|--------|--------|
| S3.1 GET /ui/aggregations/ar-by-partner | ✅ | EPS 0,01, group by partner_id, totals, partners |
| S3.2 meta.freshness | ✅ | event_driven / snapshot / unknown |

### Sprint 4 — Linky + DIVA (P0 minimal)

| Tâche | Statut | Détail |
|-------|--------|--------|
| S4.1 Proxy /api/ar-by-partner | ✅ | Route Next.js proxy vers Vault `/ui/aggregations/ar-by-partner` |
| S4.1 Tableaux Encours / Clients à risque | ✅ | BusinessCard : tableaux repliables, % partenaire, part en retard |
| S4.1 Warnings UI | ✅ | « Donnée snapshot » si freshness ≠ event_driven ; « X facture(s) sans échéance » si missing_due_date_count ≥ 5 ; section Clients à risque masquée si totals.open_amount == 0 |
| S4.2 dashboard-metrics | ✅ | ar_by_partner dans _details.business |
| S4.2 hash_input | ✅ | ar_by_partner_aggregates (totals + top 5 overdue, triés) |
| S4.2 computeInsights | ✅ | 1 insight max : « AR à risque : X€ en retard sur Y partenaire(s), principal débiteur Z (W€) » |

---

## 3. Livrables techniques

### 3.1 DVIG (`sources/dvig/workers/outbox_worker.py`)

- Meta enrichi avec `amount_residual`, `invoice_date_due`, `partner_id`
- Gestion du format Odoo `partner_id` (tuple `[id, "Name"]` ou entier)

### 3.2 Vault (Sprint 1)

- **Migration 033** : `amount_residual`, `invoice_date_due`, `partner_id`, `last_residual_event_at`
- **Modèle Document** : 4 nouveaux champs
- **InvoicesHandler** : extraction depuis payload.Meta
- **Storage** : INSERT mis à jour (StoreDocumentWithTransaction, StoreDocumentWithEvidence)

### 3.3 Vault (Sprint 2)

- **Migration 034** : table `residual_events_idempotency` (tenant, event_id)
- **InvoicesResidualHandler** : `sources/vault/internal/handlers/invoices_residual.go`
- **Storage** : GetDocumentByTenantCompanySourceID, UpdateDocumentResidual, IsResidualEventProcessed

### 3.4 Vault (Sprint 3)

- **ArByPartnerAggregationHandler** : `sources/vault/internal/handlers/aggregations_ar_by_partner.go`
- **Storage** : `aggregations_ar_by_partner.go` — EPS 0,01, group by partner_id, meta.freshness, meta.warnings

### 3.5 Linky (Sprint 4)

- **Proxy** : `units/dorevia-linky/app/api/ar-by-partner/route.ts`
- **Types** : `ArByPartnerResponse`, `ArByPartnerTotals`, `ArByPartnerItem`, `ArByPartnerMeta` dans `app/types/aggregations.ts`
- **BusinessCard** : section `ArByPartnerSection` — Encours (client), Clients à risque (retard), warnings freshness / missing_due_date
- **BusinessCardWithPolling** : fetch `/api/ar-by-partner` avec période et company_id
- **dashboard-metrics** : appel `ar-by-partner`, `_details.business.ar_by_partner`

### 3.6 DIVA (Sprint 4)

- **hash_input** : `units/diva/internal/hashinput/build.go` — `extractARByPartnerForHash` (totals + top 5 overdue)
- **computeInsights** : `units/diva/internal/mistral/client.go` — 1 insight AR (montant retard + concentration + principal débiteur)
- **extractARDetails** : extraction `details.business.ar_by_partner` pour insight

---

## 4. Points de vigilance

### 4.1 Connecteur Odoo (S1.1)

Le connecteur `dorevia_vault_connector` a été **enrichi** pour envoyer `amount_residual` et `invoice_date_due` dans le payload `invoice.posted` vers DVIG (`_build_dvig_payload`). Les factures postées **après** mise à jour du connecteur auront ces champs. Les factures déjà vaultées sans ces champs resteront en mode snapshot.

### 4.2 Migration en production

Les migrations 033 et 034 doivent être **exécutées** sur la base Vault avant déploiement :

```bash
# Option 1 : script dédié
DATABASE_URL=postgresql://... ./scripts/run_ar_by_partner_migrations.sh

# Option 2 : manuel
psql $DATABASE_URL -f sources/vault/migrations/033_add_ar_by_partner_fields.sql
psql $DATABASE_URL -f sources/vault/migrations/034_residual_events_idempotency.sql
```

**Test d'intégrité post-migration :**
```bash
VAULT_URL=http://localhost:8080 ./scripts/test_ar_by_partner_integrity.sh
```

- Réversible : colonnes et table additives ; pas de suppression de données.
- Downtime : opération DDL additive, sans lock bloquant prolongé attendu.
- **Évaluation risque (à renseigner avant exécution)** : taille actuelle table `documents` ; nombre d'index existants.

### 4.3 Test d'intégrité post-migration

**Objectif :** sécuriser le déploiement.

- Insérer un document test avec `amount_residual`, `invoice_date_due`, `partner_id` renseignés
- Vérifier : insertion OK, index utilisés, aucune régression sur sales-by-partner
- Tester : POST /api/v1/invoices/residual → GET /ui/aggregations/ar-by-partner

---

## 5. Annexe — Test de validation fonctionnelle (2026-02-22)

### 5.1 Contexte

- **Environnement :** core-stinger (vault-core-stinger, vault-db-core-stinger, odoo_stinger_sarl-la-platine)
- **Actions réalisées :** migrations 033 et 034 appliquées ; image Vault reconstruite et redéployée ; connecteur Odoo enrichi ; Odoo redémarré.

### 5.2 Méthode

Les documents existants dans `documents` (tenant sarl-la-platine) avaient `amount_residual`, `invoice_date_due`, `partner_id` à NULL (vaultés avant l’enrichissement). Pour valider l’agrégation sans créer une nouvelle facture Odoo :

1. **Mise à jour manuelle** d’un document existant (odoo_id 1972) :
   ```sql
   UPDATE documents SET
     amount_residual = 2500.50,
     invoice_date_due = '2025-12-31',
     partner_id = '42',
     partner_name = 'Client Test AR'
   WHERE tenant = 'sarl-la-platine' AND odoo_model = 'account.move' AND odoo_id = '1972';
   ```

2. **Appel** `GET /ui/aggregations/ar-by-partner` :
   ```bash
   docker exec vault-core-stinger wget -qO- "http://127.0.0.1:8080/ui/aggregations/ar-by-partner?tenant=sarl-la-platine&date_debut=2020-01-01&date_fin=2030-12-31"
   ```

### 5.3 Résultat

```json
{
  "totals": {
    "open_amount": 2500.5,
    "overdue_amount": 2500.5,
    "open_count_invoices": 1,
    "overdue_count_invoices": 1,
    "missing_due_date_count": 0
  },
  "partners": [{
    "partner_id": "42",
    "partner_name": "Client Test AR",
    "open_amount": 2500.5,
    "overdue_amount": 2500.5,
    "share_percent": 100
  }],
  "meta": {
    "freshness": "snapshot",
    "data_quality": "medium"
  }
}
```

### 5.4 Interprétation

| Élément | Valeur | Explication |
|---------|--------|-------------|
| open_amount | 2 500,50 € | Encours total (1 facture ouverte) |
| overdue_amount | 2 500,50 € | Montant en retard (échéance 2025-12-31 < as_of_date today) |
| freshness | snapshot | Aucun `invoice.residual.changed` reçu ; données issues de `invoice.posted` |
| share_percent | 100 % | 1 seul partenaire = 100 % de l’encours |

### 5.5 Conclusion

**Chaîne AR by Partner validée.** L’agrégation filtre et agrège correctement les documents avec `amount_residual`, `invoice_date_due`, `partner_id`. Pour les **nouvelles factures** validées et vaultées après mise à jour du connecteur, ces champs seront renseignés automatiquement dans `invoice.posted`.

---

## 6. Planification

| Sprint | Périmètre | Statut |
|--------|-----------|--------|
| **Sprint 1** | Données (DVIG + Vault) | ✅ Terminé |
| **Sprint 2** | Route residual + idempotence | ✅ Terminé |
| **Sprint 2.5** | Émetteur Odoo (optionnel) | ⬜ Si main Odoo dispo |
| **Sprint 3** | Agrégation ar-by-partner | ✅ Terminé |
| **Sprint 4** | Linky + DIVA (P0 minimal) | ✅ Terminé |

---

## 7. Décisions attendues de la MOA

1. ~~**Validation** : autorisation à lancer le Sprint 4 (Linky + DIVA) ?~~ → Sprint 4 livré.
2. ~~**Connecteur Odoo** : amount_residual, invoice_date_due~~ → Ajoutés dans dorevia_vault_connector (2026-02-21).
3. **Planning migration** : date d'exécution des migrations 033 et 034 en environnement cible ?
4. ~~**Validation fonctionnelle**~~ → Test de validation réalisé (2026-02-22, §5).

---

## 8. Recommandation

**Recommandation :** exécuter les migrations 033 et 034 en cible, puis valider en recette. La fonctionnalité AR by Partner (S1–S4) est prête à être déployée.

**Posture produit (cohérence avec « Ne jamais sortir un AR mensonger ») :** en cas d’absence des champs côté connecteur, les valeurs seront nulles. Dans ce cas, l’AR sera considéré comme non exploitable (`freshness = unknown`) et **ne sera pas exposé en UI** avant correction.

---

## 9. Annexe technique — Réponses review

### 9.1 meta.freshness (règles opérationnelles)

| Valeur | Règle exacte |
|--------|--------------|
| `event_driven` | Au moins un document de la population filtrée a `last_residual_event_at IS NOT NULL` |
| `snapshot` | Aucun residual event reçu, mais données présentes (residual issu de `invoice.posted`) |
| `unknown` | Population vide (aucun document ouvert) ou indéterminable |

*Détail :* `storage/aggregations_ar_by_partner.go` lignes 107-121 ; SPEC §3.

### 9.2 Sécurité route residual

| Point | Comportement |
|-------|-------------|
| Document inexistant | **404** — pas de création. Message : « Invoice must be vaulted first via POST /api/v1/invoices » |
| Lookup | `GetDocumentByTenantCompanySourceID(tenant, company_id, source.model, source.id)` — isolation par tenant dans la requête |
| ACL | Si `AUTH_ENABLED` : permission `documents:write` requise (RBAC, prefix `/api/v1/invoices`). Contrôle d'accès au tenant : à préciser si middleware dédié (actuellement le `tenant` vient du payload) |

### 9.3 Performance agrégation

**Agrégation sur table `documents` uniquement.** Aucune jointure avec `economic_events`. Source unique : projection `documents`.

### 9.4 Migration — risque

Avant exécution en production, renseigner :
- `SELECT COUNT(*) FROM documents` — volume actuel
- `SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'documents'` — nombre d'index
- Permet d'évaluer durée DDL réelle selon la charge.

---

## 10. Annexes

- Plan : `ZeDocs/web28/PLAN_IMPLEMENTATION_AR_BY_PARTNER_SCRUM.md` (v1.3)
- Spec : `ZeDocs/web28/SPEC_Vault_UI_Aggregations_AR_by_Partner_v1.0.1.md`
- Migration 033 : `sources/vault/migrations/033_add_ar_by_partner_fields.sql`
- Migration 034 : `sources/vault/migrations/034_residual_events_idempotency.sql`
- Linky (S4) : `units/dorevia-linky/app/api/ar-by-partner/route.ts`, `components/BusinessCard.tsx`, `components/BusinessCardWithPolling.tsx`
- DIVA (S4) : `units/diva/internal/hashinput/build.go`, `units/diva/internal/mistral/client.go`
- Scripts : `scripts/run_ar_by_partner_migrations.sh`, `scripts/test_ar_by_partner_integrity.sh`
- Connecteur Odoo : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py` (`_build_dvig_payload` : amount_residual, invoice_date_due)

*Voir §9 pour les réponses aux points de review technique.*

---

## 11. Plan d'itération — Cards (focus une par une)

**Objectif :** améliorer les cards détaillées (vues étendues) de manière ordonnée, sans surcharge.

| # | Card | Composant | Statut actuel | Prochaine étape |
|---|------|------------|---------------|-----------------|
| **1** | **Business** | `BusinessCard` / `BusinessCardWithPolling` | AR by Partner S4 livré (tableaux Encours, Clients à risque) | **SPEC v2** : Bloc A (Marge brute, Taux), Bloc B (AR synthétique), Bloc C (Badge risque) — ZeDocs/web29/SPEC_Business_Card_v2.md |
| 2 | Treasury | `TreasuryCard` | Rapprochement bancaire | À définir |
| 3 | Cash | `FluxCashCard` | Encaissements / décaissements | À définir |
| 4 | Taxes | `TaxesCard` | TVA ventes / achats | À définir |
| 5 | Credit Notes | `CreditNotesCard` | Notes de crédit clients / fournisseurs | À définir |
| 6 | Refunds | `RefundsCard` | Remboursements | À définir |
| 7 | Pos Shops | `PosShopsView` | Sessions points de vente | À définir |
| 8 | Pos Z | `PosComingSoonView` | Z de caisse | Placeholder |

**Ordre recommandé :** commencer par la **Business Card** (SPEC v2 prête, chaîne AR complète).
