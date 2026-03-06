# DoD P0 — Validation staging E2E

**Prochaine étape critique.** Une fois fait → P0 acté.

**Durée estimée :** 1–2 h

---

## Script automatisé

```bash
./scripts/run_dod_p0_validation.sh
```

Le script démarre Postgres, seed le dataset, Odoo, Vault, et crée le job apply.  
**⚠️ Prérequis :** créer la base `dorevia_p0` avec `account,dorevia_core,dorevia_adapter_odoo18` (voir §1 ci-dessous).  
**Alternative :** installer dorevia_core + dorevia_adapter_odoo18 dans une base existante, puis adapter `odoo_database` dans le script.

---

## Procédure manuelle

### 1. Créer la base Odoo avec account (OBLIGATOIRE)

**L’installation explicite de `account` est nécessaire** pour initialiser la comptabilité (journaux, séquences, plan comptable). Sinon, les factures et paiements échouent.

```bash
cd units/odoo
docker compose stop odoo 2>/dev/null
docker compose run --rm odoo odoo -c /etc/odoo/odoo.conf -d dorevia_p0 \
  -i account,dorevia_core,dorevia_adapter_odoo18 \
  --stop-after-init --without-demo=all
docker compose start odoo
```

Cela crée la base `dorevia_p0` avec la config lab (`dbfilter = ^dorevia_p0$` dans `conf/odoo.lab.conf`).

### 2. Installer modules Dorevia (si base créée manuellement)

- Apps → Update Apps List
- Rechercher « Dorevia Core » → Install
- Rechercher « Dorevia Adapter Odoo 18 » → Install
- Configurer `dorevia.adapter.auth_user` / `auth_password` si ≠ admin/admin

### 3. Backfill

- Vault avec `DATABASE_URL` configuré
- Exécuter backfill sur les données existantes (documents, payments)
- Ou charger le dataset régression : `SeedRegressionDataset` (10 invoices, 5 payments, 3 partners)

### 4. Job apply

```bash
curl -X POST http://localhost:8080/api/v1/replay/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": "regression-tenant",
    "mode": "apply",
    "range": {"from": "2026-01-01", "to": "2026-02-01"},
    "options": {
      "odoo_url": "http://localhost:18069",
      "odoo_database": "dorevia_p0",
      "odoo_user": "admin",
      "odoo_password": "admin"
    }
  }'
```

### 5. Vérifications

| Critère | Attendu |
|---------|---------|
| Partners | 3 créés (P001, P002, P003) |
| Factures | 10 |
| Paiements | 5 |
| Relance job | Aucun doublon (skipped) |
| Logs | Propres, pas d'erreur |
| Report | Cohérent (applied/skipped/failed) |

### 6. Relance (idempotence)

- Relancer le même job apply
- Vérifier : tous les événements → `skipped` (pas de doublon côté Odoo)

---

## Checklist

- [ ] Odoo vierge + modules installés
- [ ] Backfill / dataset chargé
- [ ] Job apply créé et traité
- [ ] 3 partners, 10 factures, 5 paiements dans Odoo
- [ ] Relance → pas de doublon
- [ ] Logs et report OK

**→ P0 acté**
