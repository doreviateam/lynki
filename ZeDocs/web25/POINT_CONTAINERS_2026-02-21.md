# Point sur les conteneurs — 2026-02-21

**Objet :** Inventaire des conteneurs Docker de la plateforme Dorevia.

---

## 1. Résumé exécutif

| Service | sarl-la-platine | lglz | conceptsun97139 | core (lab) |
|---------|-----------------|------|-----------------|------------|
| **Odoo app** | ✅ Up | ✅ Up | ✅ Up | ✅ Up |
| **Odoo DB** | ❌ **ABSENT** | ✅ Up | ✅ Up | ✅ Up |
| **Linky** | ✅ Up (lab + stinger) | — | — | — |

**Problème identifié :** `odoo_db_stinger_sarl-la-platine` n'existe pas. L'Odoo stinger sarl-la-platine tourne sans sa base → sélecteur de bases affiché.

---

## 2. Conteneurs Odoo actifs (Up)

| App Odoo | Base PostgreSQL | Statut |
|----------|-----------------|--------|
| odoo_stinger_sarl-la-platine | **odoo_db_stinger_sarl-la-platine** | ❌ DB **manquante** |
| odoo_stinger_lglz | odoo_db_stinger_lglz | ✅ OK |
| odoo_stinger_conceptsun97139 | odoo_db_stinger_conceptsun97139 | ✅ OK |
| odoo_lab_core | odoo_db_lab_core | ✅ OK |
| odoo_lab_lglz | — (partage?) | ✅ OK |
| odoo_lab_lglz44 | odoo_db_lab_lglz44 | ✅ OK |

---

## 3. Conteneurs Linky (sarl-la-platine)

| Conteneur | Image | Statut |
|-----------|-------|--------|
| linky_stinger_sarl-la-platine | dorevia/linky:v1.31-no-apps-buttons | Up 11 h |
| linky_lab_sarl-la-platine | dorevia/linky:v1.31-no-apps-buttons | Up 11 h |

---

## 4. Bases de données PostgreSQL (Up)

| Conteneur | Statut |
|-----------|--------|
| odoo_db_stinger_lglz | Up (healthy) |
| odoo_db_stinger_conceptsun97139 | Up (healthy) |
| odoo_db_lab_core | Up (healthy) |
| odoo_db_lab_lglz44 | Up (healthy) |
| vault-db-core | Up (healthy) |
| vault-db-core-stinger | Up (healthy) |
| dvig-db-core | Up (healthy) |
| sylius_lab_core_postgres | Up (healthy) |
| sylius_lab_lovable44_postgres | Up (healthy) |

**Absent :** `odoo_db_stinger_sarl-la-platine`

---

## 5. Conteneurs stoppés (à nettoyer ?)

- `lab-*`, `prod-*`, `core-*` (hors core-stinger) : nombreux conteneurs Exited depuis 7–8 semaines
- `n8n_*`, `suitecrm_*` : Exited 4 jours
- `rdo18-*`, `dorevia-caddy-lab`, `anythingllm`, `ollama`, `qdrant`, etc.

---

## 6. Action corrective — sarl-la-platine

Pour restaurer Odoo stinger sarl-la-platine :

```bash
cd /opt/dorevia-plateform/tenants/sarl-la-platine/apps/odoo/stinger
docker compose up -d db

# Puis restaurer depuis backup si la base est vide :
cd /opt/dorevia-plateform
docker exec -i odoo_db_stinger_sarl-la-platine psql -U odoo -c "CREATE DATABASE \"odoo_stinger_sarl-la-platine\" OWNER odoo;" 2>/dev/null || true
docker exec -i odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine < backup_odoo_stinger_sarl-la-platine_20260205_183112.sql
docker restart odoo_stinger_sarl-la-platine
```

---

**Fin du document**
