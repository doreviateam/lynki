# Test apply mode — Dataset régression (E5-US3)

**Objectif :** Valider le Runner apply sur un Odoo vierge avec le dataset de régression.

## Prérequis

1. **Odoo** : instance vide avec modules `dorevia_core`, `dorevia_adapter_odoo18` installés
2. **Vault** : compilé, `DATABASE_URL` + `TEST_DATABASE_URL` (ou identique) configurés
3. **Dataset** : `SeedRegressionDataset` chargé (10 invoices, 5 payments, 3 partners)

## Étapes

### 1. Démarrer Odoo

```bash
# Exemple docker
cd units/odoo && docker compose up -d
# Attendre qu'Odoo soit prêt (http://localhost:8069)
```

### 2. Installer les modules adapter

- Apps → Update Apps List
- Rechercher "Dorevia Core" → Install
- Rechercher "Dorevia Adapter Odoo 18" → Install
- Configurer `dorevia.adapter.auth_user` et `dorevia.adapter.auth_password` si besoin (défaut: admin/admin)

### 3. Charger le dataset + créer job apply

```bash
# Option A : via test d'intégration qui seed le dataset
cd sources/vault
TEST_DATABASE_URL="postgresql://..." go test -v -run TestReplayRegression ./tests/integration/...

# Option B : seed manuel (ajouter commande CLI ou script)
# Puis créer le job via curl :
```

```bash
curl -X POST http://localhost:8080/api/v1/replay/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": "regression-tenant",
    "mode": "apply",
    "range": {"from": "2026-01-01", "to": "2026-02-01"},
    "options": {
      "odoo_url": "http://localhost:8069",
      "odoo_user": "admin",
      "odoo_password": "admin"
    }
  }'
```

### 4. Le Runner traite le job (poll 5s)

Ou forcer exécution immédiate si test avec `ProcessOneJob`.

### 5. Vérifications

| Critère | Attendu |
|---------|---------|
| Partners | 3 créés (P001, P002, P003) |
| Factures | 10 (ligne « Vente HT (Vault) ») |
| Paiements | 5 |
| Relance job | Aucun doublon (skipped) |

### 6. Rapport

```bash
curl http://localhost:8080/api/v1/replay/jobs/{job_id}/report
```

Stats attendues : `applied: 15, skipped: 0, failed: 0` (ou skipped > 0 si relance).

---

## Points de vigilance

- **partner_ref** : stable (P001, P002, P003) — pas de génération dynamique
- **invoice/create_synth** : utilise uniquement champs canoniques (amount_untaxed, partner_ref, etc.)
- **payment/create** : idempotence par event_id (mapping Odoo)
- **Relance** : même job relancé → événements déjà dans mapping → skipped
