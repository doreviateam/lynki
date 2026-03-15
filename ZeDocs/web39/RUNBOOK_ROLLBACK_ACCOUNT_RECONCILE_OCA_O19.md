# Runbook — Rollback port account_reconcile_oca o19

**Date :** 2026-03-07  
**Contexte :** Retour arrière après port des modules OCA (base_sparse_field, account_reconcile_model_oca, account_reconcile_oca)

## Prérequis

- Snapshot pré-port disponible : `/tmp/odoo_lab_o19_pre_port_YYYYMMDD.dump`
- Branche : `port-account-reconcile-oca-o19` (ou abandonner et revenir sur `odoo19-support`)

## Procédure de rollback

### Option A — Restauration depuis snapshot

```bash
cd /opt/dorevia-plateform/tenants/o19/apps/odoo/lab
DUMP_FILE=/tmp/odoo_lab_o19_pre_port_20260307.dump ./reinstall_o19.sh
```

### Option B — Réinstallation propre sans modules portés

1. **Supprimer les dossiers addons-o19 (modules portés uniquement) :**

```bash
cd /opt/dorevia-plateform/units/odoo/addons-o19
rm -rf base_sparse_field
rm -rf account_reconcile_model_oca
rm -rf account_reconcile_oca
# Note: base_sparse_field n'est pas dans addons-o19 (core Odoo 19)
```

2. **Retirer account_reconcile_oca de reinstall_o19.sh** (étape 7) si ajouté.

3. **Réinstaller :**

```bash
cd /opt/dorevia-plateform/tenants/o19/apps/odoo/lab
./reinstall_o19.sh
```

### Option C — Retour branche Git

```bash
cd /opt/dorevia-plateform
git checkout odoo19-support
# Puis Option A ou B selon besoin
```

## Versions modules avant port (2026-03-07)

| Module | État | Version |
|--------|------|---------|
| account_statement_base | installed | 19.0.1.0.0 |
| account_usability | installed | 19.0.1.0.0 |
| queue_job | installed | 19.0.1.1.0 |
| dorevia_vault_connector | installed | 19.0.1.1.1 |

## Emplacement snapshot

```
/tmp/odoo_lab_o19_pre_port_20260307.dump
```

---

## État d'implémentation (2026-03-07)

| Phase | Statut | Notes |
|-------|--------|------|
| Phase 0 | ✅ | Branche créée, snapshot, runbook rollback |
| Phase 1 | ✅ | base_sparse_field déjà dans Odoo 19 (core) |
| Phase 2 | ✅ | account_reconcile_model_oca installé — vue adaptée (match_label_param, trigger) |
| Phase 3 | ✅ | account_reconcile_oca installé — Python (first, CharId, rule_type→trigger) + domain manual_model_id |
| Phase 4 | 🔄 | En cours — imports OWL @odoo/owl corrigés, validation navigateur à faire |
| Phase 5 | ⏳ | En attente |
| Phase 6 | ⏳ | En attente |
