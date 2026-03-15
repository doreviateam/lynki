# Rapport MOA — Tenant o19 (Odoo 19 + Vault + Linky)

**Destinataire :** Maîtrise d'Ouvrage  
**Date :** 2026-03-06  
**Objet :** Bilan d'implémentation du tenant laboratoire o19 — Odoo 19, Vault, DVIG, Linky  
**Référence :** `ZeDocs/web39/PLAN_IMPLEMENTATION_O19_ODOO19_SCRUM.md`  
**Statut :** Phase 5 validée (flux Vault, DVIG, réconciliation bancaire)

---

## 1. Synthèse exécutive

Le tenant **o19** est le **tenant laboratoire universel** de la plateforme Dorevia. Il permet de valider l'architecture fintech sur Odoo 19 et de préparer l'évolution vers des ERP et sources de données diversifiés (ERPNext, Pennylane, API bancaire, etc.).

| Indicateur | État |
|------------|------|
| **Tenant o19** | ✅ Opérationnel |
| **Odoo 19** | ✅ Déployé (image 19.0) |
| **Linky** | ✅ Déployé |
| **Connecteur Vault (dorevia_vault_connector)** | ✅ Adapté Odoo 19 (sans OCA) |
| **Vaulting factures** | ✅ 3 factures protégées |
| **Vaulting paiements** | ✅ Paiement vaulted (dorevia_vault_id) |
| **Réconciliation bancaire (Odoo → Linky)** | ✅ Endpoint `linky_bank_reconciliation` opérationnel |
| **Lettrage / RECONCIL** | ✅ Flux validé (backfill + événements DVIG) |

**Conclusion :** Le tenant o19 valide la compatibilité de la plateforme Dorevia avec Odoo 19. Les flux Vault, DVIG et réconciliation bancaire sont opérationnels.

---

## 2. Objectif stratégique

| Besoin | Réponse |
|--------|---------|
| **Problème** | La plateforme Dorevia reposait sur Odoo 18. Il fallait valider la montée en version et préparer l'ouverture à d'autres ERP. |
| **Objectif** | Créer un tenant laboratoire o19 (Odoo 19) pour valider l'architecture sans impacter les tenants en production. |
| **Impact** | Plateforme prête pour Odoo 19 ; base de test pour futurs connecteurs (ERPNext, Pennylane, etc.). |

---

## 3. Architecture

```
                 Vault (ERP-agnostic, partagé core-stinger)
                   │
                  DVIG (collecteur d'événements, partagé core-stinger)
                   │
        ┌──────────┴──────────┐
        │                     │
    Odoo 18 tenants       Odoo 19 tenant (o19)
    (laplatine, etc.)     (laboratoire)
        │                     │
        └──────────┬──────────┘
                   │
                 Linky (cockpit unique)
```

**Principe :** Réutilisation de l'infrastructure partagée (Vault, DVIG). Odoo 19 et Linky dédiés au tenant o19.

---

## 4. Réalisations

### 4.1 Infrastructure

| Élément | Détail |
|--------|--------|
| **Base Odoo** | `odoo_lab_o19` — conteneur `odoo_lab_o19` |
| **Linky** | `linky_lab_o19` — `TENANT_ID=o19` |
| **DVIG** | Token dédié `tok_lab_o19_002` (core-stinger) |
| **Vault** | Partagé — partition par `tenant=o19` |
| **URLs** | `odoo.lab.o19.doreviateam.com`, `ui.lab.o19.doreviateam.com` |

### 4.2 Connecteur Vault (dorevia_vault_connector)

Adaptations pour Odoo 19 **sans** le module OCA `account_reconcile_oca` (non disponible en 19.0) :

| Fonctionnalité | Adaptation |
|----------------|------------|
| **Lettrage bancaire** | Fallback sur `write()` pour détecter les changements `is_reconciled` ; backfill pour lignes déjà rapprochées |
| **Vaulting factures / paiements** | Inchangé (API Odoo 19 compatible) |
| **Revue code v1.1.2** | `datetime.now()` → `fields.Datetime.now()` ; respect de `next_retry_at` ; contrôle `source_model/source_id` ; action non bloquante |

### 4.3 Validation des flux (Phase 5)

| Flux | Statut | Vérification |
|------|--------|--------------|
| **5.1 Vaulting factures** | ✅ | 3 factures protégées (dorevia_vault_id) |
| **5.2 Vaulting paiements** | ✅ | Paiement PBNK1/2026/00001 → vaulted |
| **5.3 Lettrage** | ✅ | Script `test_lettrage_reconcil.py` ; backfill 2 lignes → DVIG ; événements `bank.move.reconciled` / `bank.move.unreconciled` |
| **5.4 Linky** | ✅ | `/api/tenant` → o19 ; `/api/cockpit/cards` → schéma v1 |
| **5.5 Réconciliation bancaire** | ✅ | Endpoint `linky_bank_reconciliation` répond (JSON valide) |

### 4.4 Événements DVIG (RECONCIL)

Vérification dans la base DVIG (2026-03-06) :

| ID | Type | Date |
|----|------|------|
| 6 | bank.move.reconciled | 2026-03-06 23:44:40 |
| 7 | bank.move.unreconciled | 2026-03-06 23:46:14 |
| 8 | bank.move.unreconciled | 2026-03-06 23:46:14 |

Les événements 7 et 8 proviennent du backfill (lignes de relevé créées par le script de test).

---

## 5. Points d'attention

### 5.1 Lettrage — Odoo 19 sans OCA

En Odoo 19 standard, **aucune API programmatique** n'est documentée pour le rapprochement bancaire. Le module OCA `account_reconcile_oca` n'est pas disponible en 19.0.

| Conséquence | Mitigation |
|-------------|------------|
| Lettrage non automatisable par script | Le connecteur Dorevia détecte les changements `is_reconciled` lors du lettrage manuel dans l'UI Odoo |
| Backfill | Envoie l'état courant des lignes (reconciled / unreconciled) vers DVIG — opérationnel |

**Recommandation :** Pour une automatisation complète du lettrage, évaluer la disponibilité future d'OCA account-reconcile en 19.0 ou une alternative native Odoo.

### 5.2 Image Odoo 19

**Recommandation :** Utiliser une image épinglée (ex. `odoo:19.0-20260205`) plutôt que `odoo:19.0` flottant, pour éviter les mises à jour silencieuses.

---

## 6. Prochaines étapes

| Priorité | Action |
|----------|--------|
| **P1** | Lettrage manuel dans l'UI Odoo pour valider l'émission temps réel de `bank.move.reconciled` |
| **P2** | Vérifier la carte réconciliation bancaire dans Linky (si configurée) |
| **P3** | Évaluer OCA account-reconcile 19.0 pour automatisation lettrage |
| **P4** | Préparer le connecteur pour d'autres ERP (ERPNext, Pennylane) — tenant o19 comme sandbox |

---

## 7. Commandes de référence

```bash
# Exécuter le script de test lettrage
docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http \
  < tenants/o19/apps/odoo/lab/test_lettrage_reconcil.py

# Vérifier les événements RECONCIL dans DVIG
docker exec dvig-db-core-stinger psql -U dvig_user -d dvig_db -c \
  "SELECT id, payload->>'event_type', created_at FROM outbox_events 
   WHERE payload->>'event_type' IN ('bank.move.reconciled','bank.move.unreconciled') 
   ORDER BY created_at DESC LIMIT 10;"

# Endpoint réconciliation bancaire
curl -s "https://odoo.lab.o19.doreviateam.com/dorevia/vault/linky_bank_reconciliation?tenant=o19&date_from=2026-01-01&date_to=2026-12-31"
```

---

## 8. Annexes

- **PV de recette :** `ZeDocs/web39/PV_RECETTE_TENANT_O19_2026-03-06.md`
- **Plan détaillé :** `ZeDocs/web39/PLAN_IMPLEMENTATION_O19_ODOO19_SCRUM.md`
- **Spécification Odoo 19 :** `ZeDocs/web39/SP19.md`
- **Connecteur :** `units/odoo/custom-addons/dorevia_vault_connector/`
