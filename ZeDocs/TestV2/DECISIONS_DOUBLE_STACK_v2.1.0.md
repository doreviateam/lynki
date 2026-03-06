# ✅ Décisions Validées — Double Stack (v2.1.0)

**Date** : 2026-01-10  
**Statut** : ✅ **VALIDÉ**

---

## 📋 Décisions Prises

### Décision 1 : Hostnames ✅

**Option A : Conformes v2.0** — **VALIDÉE**

- `dvig.core-stinger.doreviateam.com`
- `vault.core-stinger.doreviateam.com`

**Justification** :
- ✅ Génération automatique via `render_caddyfile.sh`
- ✅ Conforme architecture v2.0
- ✅ Pas de modification manuelle nécessaire

---

### Décision 2 : Base de Données ✅

**Option A : Conforme v2.0** — **VALIDÉE**

- Nom : `dorevia_vault`
- Container : `vault-db-core-stinger`

**Justification** :
- ✅ Conforme architecture v2.0 (1 base par tenant)
- ✅ Génération automatique
- ✅ Isolation complète garantie par container séparé

---

### Décision 3 : Fichiers Tokens ✅

**Option A : Nouveau Tenant** — **VALIDÉE**

- Fichier : `tenants/core-stinger/secrets/dvig.tokens.yml`
- Format source : `odoo.stinger.core-stinger` (si app de core-stinger)
- OU : `odoo.stinger.<tenant>` (si clients sont des tenants séparés)

**Justification** :
- ✅ Conforme architecture v2.0
- ✅ Isolation complète
- ✅ Structure standard de tenant

---

## 🎯 Architecture Finale

### Hostnames

```
dvig.core-stinger.doreviateam.com
vault.core-stinger.doreviateam.com
```

### Containers

```
dvig-core-stinger
vault-core-stinger
vault-db-core-stinger
```

### Volumes

```
vault_db_core_stinger_data
vault_storage_core_stinger
vault_ledger_core_stinger
vault_audit_core_stinger
dvig_logs_core_stinger
```

### Base de Données

```
dorevia_vault (dans container vault-db-core-stinger)
```

### Fichiers

```
tenants/core-stinger/state/manifest.json
tenants/core-stinger/secrets/dvig.tokens.yml
```

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : ✅ **Décisions validées — Prêt pour implémentation**
