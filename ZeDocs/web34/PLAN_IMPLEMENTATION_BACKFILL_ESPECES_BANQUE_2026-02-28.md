# Plan d'implémentation — Backfill ventilation Espèces/Banque

**Date :** 2026-02-28  
**Référence :** `ZeDocs/web34/SPEC_BACKFILL_PAIEMENTS_ESPECES_BANQUE_v1.0.md`  
**Durée estimée :** 2 à 3 jours  
**Stack :** Vault (Go), Odoo (Python), PostgreSQL

---

## 0. Vue d'ensemble

| Phase | Périmètre | Estimation | Livrable | Dépendance |
|-------|-----------|------------|----------|-------------|
| **Phase 1** | Migration + agrégation | 0,5 j | Table override, agrégation modifiée | — |
| **Phase 2** | Endpoint Odoo | 0,5 j | Route `payment_journal_types` opérationnelle | — |
| **Phase 3** | Commande backfill | 1 j | `vault backfill payment-methods` | Phase 1, 2 |
| **Phase 4** | Validation & déploiement | 0,5 j | Backfill exécuté, Linky vérifiée | Phase 3 |

**Definition of Done :** Overrides créés pour paiements cash/check historiques, carte Cash Linky affiche Espèces ~110 550 € pour laplatine2026.

---

## Phase 1 — Migration et agrégation

**Objectif :** Créer la table d'override et adapter l'agrégation pour la lire en priorité.

### Tâche 1.1 — Migration 038

| Action | Fichier | Détail |
|--------|---------|--------|
| Créer migration | `sources/vault/migrations/038_payment_method_overrides.sql` | Table `payment_method_overrides` (document_id PK, method, reason, created_at) |
| Index | Idem | `idx_payment_method_overrides_document` |
| Index documents | Idem | `idx_documents_payment_tenant_created` sur (source, tenant, created_at, id) WHERE source='payment' — curseur stable pour pagination |
| Vérifier | `migrate up` | Migration s'applique sans erreur |

**Critères d'acceptation :**
- [ ] Table `payment_method_overrides` créée avec CHECK sur method
- [ ] Colonne `reason` nullable (audit)
- [ ] Index documents utilisé pour le backfill

### Tâche 1.2 — Modifier l'agrégation

| Action | Fichier | Détail |
|--------|---------|--------|
| Joindre override | `sources/vault/internal/storage/aggregations_payments.go` | `LEFT JOIN payment_method_overrides o ON o.document_id = d.id` |
| COALESCE | Idem | `LOWER(COALESCE(o.method, NULLIF(TRIM(d.payload_json->>'method'), ''), 'transfer'))` |
| Total, séries | Idem | S'assurer que toutes les requêtes payment utilisent la même logique si besoin |

**Critères d'acceptation :**
- [ ] `PaymentsAggregation` retourne `by_method` avec override prioritaire
- [ ] Tests existants passent (ou adapter si nécessaire)
- [ ] `go build ./...` OK

---

## Phase 2 — Endpoint Odoo

**Objectif :** Exposer la route `payment_journal_types` pour que le backfill puisse récupérer le type de journal.

### Tâche 2.1 — Contrôleur Odoo

| Action | Fichier | Détail |
|--------|---------|--------|
| Créer contrôleur | `dorevia_vault_connector/controllers/payment_journal_types.py` | Nouveau fichier ou ajout dans existant |
| Route | Idem | `GET /dorevia/vault/payment_journal_types?payment_ids=1,2,3` |
| Logique | Idem | journal.type=='cash'→cash, payment_method.code=='check'→check, sinon transfer |
| Doc mapping | Spec | Documenter : CB sur journal bank → transfer (cf. spec §4.1) |
| Réponse | Idem | `request.make_response(json.dumps(result), headers=[("Content-Type", "application/json")])` |
| Token (optionnel) | Idem | Vérifier `token` si paramètre config présent |

**Critères d'acceptation :**
- [ ] Curl manuel retourne `{"1":"cash","2":"transfer"}` pour des IDs valides
- [ ] IDs invalides/inexistants → non présents dans la réponse (pas d'erreur)
- [ ] Content-Type: application/json explicite

### Tâche 2.2 — Enregistrement

| Action | Fichier | Détail |
|--------|---------|--------|
| Import | `dorevia_vault_connector/controllers/__init__.py` | Importer le nouveau contrôleur si module séparé |

---

## Phase 3 — Commande backfill

**Objectif :** Implémenter `vault backfill payment-methods`.

### Tâche 3.1 — Structure commande

| Action | Fichier | Détail |
|--------|---------|--------|
| Sous-commande | `sources/vault/cmd/vault/` ou package `cmd` | `backfill payment-methods` |
| Flags | Idem | `--tenant`, `--odoo-url`, `--dry-run`, `--batch-size`, `--limit` |
| Config | Idem | Lire DATABASE_URL, construire URL Odoo par tenant si besoin |

### Tâche 3.2 — Logique backfill

| Action | Détail |
|--------|--------|
| Pagination | `ORDER BY created_at, id LIMIT N` avec curseur stable |
| Snapshot borne max | Au démarrage : `SELECT MAX(created_at), MAX(id) WHERE ...` — ne traiter que `(created_at, id) <= snapshot` (évite paiements créés pendant le backfill) |
| Skip | `payload_json->>'method'` = cash ou check → skip |
| Skip | Override existe pour document_id → skip |
| Extract | `odoo_payment_id = payload_json->>'source_id'` |
| Batch | Grouper par lots de 50, appeler Odoo |
| UPSERT | `INSERT ... ON CONFLICT (document_id) DO UPDATE SET method, reason WHERE method IS DISTINCT FROM EXCLUDED.method` — évite réécritures inutiles |
| Logs | Tenant, docs lus, skipped, overrides créés, fallbacks (sans method), erreurs |
| Output CSV | `documents_without_odoo_payment_id.csv` — doc_id, tenant, created_at pour correction manuelle |

**Critères d'acceptation :**
- [ ] `vault backfill payment-methods --tenant laplatine2026 --odoo-url URL --dry-run` log sans INSERT
- [ ] Sans `--dry-run`, overrides insérés
- [ ] Relance idempotente (skip override exists)
- [ ] Erreurs Odoo loguées sans faire crasher le batch

### Tâche 3.3 — Intégration dorevia.sh (optionnel)

| Action | Fichier | Détail |
|--------|---------|--------|
| Wrapper | `bin/dorevia.sh` | `dorevia.sh vault backfill payment-methods --tenant X` appelle vault avec bonne config |

---

## Phase 4 — Validation et déploiement

**Objectif :** Exécuter le backfill, vérifier les résultats.

### Tâche 4.1 — Sanity-check SQL

| Action | Détail |
|--------|--------|
| Requête avant | Distribution (effective_method, COUNT, SUM amount) — exécuter **avant** backfill (cf. spec §7.2) |
| Requête après | Idem — exécuter **après** backfill |
| Comparer delta | transfer -X, cash +Y, check +Z — valider cohérence |
| Requête 1 | `SELECT COUNT(*) FROM payment_method_overrides WHERE reason='backfill_2026_02_28'` |
| Requête 2 | Distribution effective_method (cash/transfer/check) avec totaux |
| Documenter | Ajouter dans runbook ou doc déploiement |

### Tâche 4.2 — Exécution backfill

| Action | Détail |
|--------|--------|
| Dry-run | Exécuter avec `--dry-run`, vérifier logs |
| Run | Exécuter sans `--dry-run` |
| Vérifier | Requêtes sanity-check |
| Linky | Recharger carte Cash, vérifier Espèces ~110 550 €, Banque ~138 586 € |

### Tâche 4.3 — Rapport

| Action | Détail |
|--------|--------|
| Documenter | Nombre overrides créés, durée, erreurs éventuelles |
| MOA | Mettre à jour rapport si besoin |

---

## 5. Checklist pré-implémentation

- [ ] Odoo laplatine2026 accessible (URL connue)
- [ ] Accès PostgreSQL Vault (DATABASE_URL)
- [ ] SPEC relue et validée
- [ ] Migration 038 numérotée correctement (dernière migration = 037)

---

## 6. Risques et parades

| Risque | Parade |
|--------|-------|
| `source_id` absent dans anciens payloads | Fallback `payload_json->'payment'->>'id'` ; logger les documents sans pivot |
| Odoo surchargé (50k+ paiements) | Lot de 50, throttle optionnel ; roadmap export fichier |
| Multi-base Odoo | `source_id` suffit si une seule base par tenant ; sinon ajouter `db` dans l'appel |

---

## 7. Références

- Spec : `ZeDocs/web34/SPEC_BACKFILL_PAIEMENTS_ESPECES_BANQUE_v1.0.md`
- Implémentation Espèces/Banque : `ZeDocs/web34/IMPLEMENTATION_VAULT_ESPECES_BANQUE_2026-02-28.md`
- Rapport MOA : `ZeDocs/web34/RAPPORT_MOA_VAULT_ESPECES_VIREMENTS_2026-02-28.md`

---

## 8. Rapport d'exécution (2026-03-02)

| Métrique | Valeur |
|----------|--------|
| Tenant | laplatine2026 |
| Documents lus | 665 |
| Overrides créés | 253 (cash) |
| Sans source_id | 0 |
| Erreurs | 0 |
| Durée | ~1,4 s |
| Total espèces (overrides) | 165 647,40 € |

**Actions effectuées :**
- Migration 038 appliquée automatiquement au démarrage Vault
- Endpoint Odoo `payment_journal_types` opérationnel (redémarrage Odoo requis)
- Backfill exécuté avec succès
- Image Vault `dorevia/vault:backfill-especes-2026-02-28` déployée sur core-stinger

**Vérification Linky :** Recharger la carte Cash pour afficher Espèces vs Banque.

---

## 9. Sanity-check SQL — comparaison Vault / Odoo / Linky (2026-03-02)

### Requêtes exécutées

| Source | Filtre date | Champ |
|--------|-------------|-------|
| Vault | `payment_date` 2026-01-01 → 2026-03-02 | `COALESCE(override, payload->>'method', 'transfer')` |
| Odoo | `date` 2026-01-01 → 2026-03-02 | `journal.type='cash'→cash`, sinon `transfer` |

### Résultats (période 2026-01-01 → 2026-03-02)

| Direction | Method | Vault (n / €) | Odoo (n / €) | Δ |
|-----------|--------|----------------|--------------|---|
| inbound | cash | 47 / 21 085,15 | 47 / 21 085,15 | ✅ |
| inbound | transfer | 98 / 48 460,22 | 98 / 48 460,22 | ✅ |
| outbound | cash | 48 / 12 982,06 | **49 / 13 032,06** | 1 paiement, 50 € |
| outbound | transfer | 75 / 27 187,60 | 75 / 27 187,60 | ✅ |

### Écart identifié

- **Paiement Odoo non vaulté :** `PCSH1/2026/00008` (id=406), 50 € outbound, 2026-01-01. Journal Espèces.
- Ce paiement existe dans Odoo mais n'a pas été répliqué vers Vault (gap de synchronisation historique).
- Impact : Linky affiche le net espèces Vault (**+8 103,09 €**) ; Odoo aurait **+8 053,09 €** si on incluait ce paiement.

### Script reproductible

```bash
tenants/laplatine2026/scripts/sanity_check_sql_payment_methods.sh
```

### Cohérence Linky

Linky consomme l'API Vault (`/ui/aggregations/payments-in`, `payments-out`) avec `by_method`. Les totaux affichés correspondent aux constats Vault :

- **payments-in cash** : 21 085,15 €  
- **payments-in transfer** : 48 460,22 €  
- **payments-out cash** : 12 982,06 €  
- **payments-out transfer** : 27 187,60 €  
- **Net espèces** : +8 103,09 €
