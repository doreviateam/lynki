# Plan d'implémentation — Tenant o19 (Odoo 19 + Vault + Linky)

**Date** : 2026-03-04  
**Référence** : `ZeDocs/web39/SP19.md`  
**Tenant** : o19  
**Durée estimée** : 4,5–6,5 jours  
**Prérequis** : DNS créés pour `*.o19.doreviateam.com`

**Racine du projet** : `/opt/dorevia-plateform` — toutes les commandes sont exécutées depuis ce répertoire.

### État implémentation (2026-03-06)

| Élément | Statut |
|---------|--------|
| Tenant o19 + manifest | ✅ |
| Odoo 19 + base initialisée | ✅ |
| Linky déployé | ✅ |
| Gateway agrégée | ✅ |
| **dorevia_vault_connector** | ✅ Adapté (sans account_reconcile_oca, fallback write + backfill) |
| **dorevia_session_guard** | ✅ Adapté (sans web_session_auto_close, res.groups user_ids) |
| **web_responsive** | ✅ Installé (custom-addons v19.0.1.0.1) |
| **Validation Linky** | ✅ `/api/tenant` → o19 ; `/api/cockpit/cards` → schéma v1 |
| **5.5 Réconciliation bancaire** | ✅ Endpoint `linky_bank_reconciliation` répond (JSON valide) |
| **5.2 Vaulting paiements** | ✅ Paiement PBNK1/2026/00001 → vaulted (dorevia_vault_id) |
| **5.3 Lettrage** | ✅ Script `test_lettrage_reconcil.py` ; backfill OK ; lettrage manuel requis (Odoo 19 sans OCA) |

**Prochaine étape** : 5.4 Linky ; ou installer queue_job (voir `RUNBOOK_QUEUE_JOB_O19.md`).

**Correctifs appliqués** : `idempotency_key` omis quand vide ; URLs internes Docker ; base DVIG recréée + migrations 001–006 ; vaulting factures ✅ (3 factures protégées) ; revue code v1.1.2 (datetime, next_retry_at, source_model/source_id, action non bloquante).

---

## 0. Vue d'ensemble

| Phase | Périmètre | Estimation | Dépendance |
|-------|-----------|------------|-------------|
| **Phase 1** | Créer le tenant o19 et manifest | 0,5 j | DNS ✅ |
| **Phase 2** | Vérifier OCA et image Odoo 19 | 0,5 j | — |
| **Phase 3** | Branche 19.0 du connecteur Vault | 1–3 j | Phase 2 |
| **Phase 4** | Déployer et tester sur base vierge | 1 j | Phase 1, 3 |
| **Phase 5** | Validation flux complet (Vault, Linky) | 1 j | Phase 4 |

**Principe :** Réutiliser l'infrastructure partagée (Vault, DVIG core-stinger). Créer Odoo 19 + Linky LAB dédiés au tenant `o19`. Branche 19.0 des addons Dorevia — ne pas modifier la branche 18.0.

### Architecture (ERP-agnostic)

```
                 Vault (ERP-agnostic)
                   │
                  DVIG (collecteur d'événements)
                   │
        ┌──────────┴──────────┐
        │                     │
    Odoo 18 tenants       Odoo 19 tenant (o19)
        │                     │
        └──────────┬──────────┘
                   │
                 Linky (cockpit unique)
```

**Résultat :** Vault reste ERP-agnostic, DVIG reste collecteur, Linky reste cockpit unique — architecture fintech cible.

### Rôle du tenant o19

Le tenant o19 est le **tenant laboratoire universel** : demain on pourra y connecter ERPNext, Pennylane, API bancaire, Shopify et vérifier que Vault, DVIG et Linky fonctionnent. Il devient la **sandbox fintech Dorevia**.

---

## Checks go/no-go

| # | Quand | Check | Commande |
|---|-------|-------|----------|
| 1 | Avant Phase 1 | DNS résout | `dig +short odoo.lab.o19.doreviateam.com` |
| 2 | Avant Phase 2 | Image Odoo 19 disponible | `docker pull odoo:19.0-20260205` |
| 3 | Avant Phase 3 | OCA 19.0 existe | Vérifier GitHub OCA account-reconcile, queue |
| 4 | Après Phase 4 | Conteneurs up | `docker ps -f name=odoo_lab_o19 --format '{{.Names}}: {{.Status}}'` |
| 5 | Après Phase 5 | Linky répond | `curl -sS https://ui.lab.o19.doreviateam.com/api/tenant \| head` |
| 6 | Après Phase 5 | Vaulting fonctionne | Créer facture → statut « Protégée » dans Odoo |

---

## Phase 1 — Créer le tenant o19

### 1.1 Créer la structure

```bash
cd /opt/dorevia-plateform
mkdir -p tenants/o19/{state,secrets,platform,apps/odoo/{lab,stinger,prod},apps/ui/{lab,stinger,prod}}
```

### 1.2 Créer le manifest

**Fichier** : `/opt/dorevia-plateform/tenants/o19/state/manifest.json`

```json
{
  "version": "1.0",
  "tenant_id": "o19",
  "tenant_mode": "lab",
  "erp": "odoo",
  "created_at": "2026-03-04T00:00:00Z",
  "universes": ["odoo", "ui"],
  "environments": ["lab"],
  "domain_mode": "saas",
  "units": {
    "odoo": ["odoo", "postgres"],
    "ui": ["linky"]
  },
  "images": {
    "odoo": "odoo:19.0-20260205",
    "postgres": "postgres:16",
    "linky": "dorevia/linky:governance-2026-03-03"
  },
  "linky_vault_url": "http://vault-core-stinger:8080",
  "linky_company_display_names": {"odoo:1": "Ma Société"},
  "linky_dvig_url": "http://dvig-core-stinger:8080",
  "linky_dvig_internal_token": "dvig_internal_core-stinger_stinger"
}
```

**Champs ajoutés :**
- `tenant_mode`: "lab" — mode du tenant (lab, stinger, prod)
- `erp`: "odoo" — ERP producteur des événements (futur : ERPNext, Pennylane, Shopify)
- Image Odoo : tag **épinglé** `odoo:19.0-20260205` pour éviter upgrade silencieux → changement pip → bug OCA

### 1.3 Valider et rendre

```bash
cd /opt/dorevia-plateform
./bin/dorevia.sh validate o19
./bin/dorevia.sh render o19 --env lab
```

### 1.4 Copier les fichiers vers apps (si nécessaire)

Le `apply` utilise les fichiers rendered. Si le render ne copie pas automatiquement vers `apps/`, vérifier que `tenants/o19/rendered/lab/odoo/docker-compose.yml` et `tenants/o19/rendered/lab/ui/docker-compose.yml` existent.

### 1.5 Créer odoo.conf (si non généré)

**Fichier** : `/opt/dorevia-plateform/tenants/o19/apps/odoo/lab/odoo.conf` (ou `tenants/o19/rendered/lab/odoo/odoo.conf`)

Adapter depuis `/opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab/odoo.conf` :
- `db_name = o19` ou `^odoo_lab_o19$`
- `dbfilter` si nécessaire
- **addons_path** (critique si `custom-addons-19`) :

```ini
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons-19
```

Sinon : `module not found` — à prévoir 2 h de debug.

**admin_passwd** : requis pour les opérations base (create/drop via API). Valeur dans `odoo.conf` : `admin_passwd = doreviateam@2026`.

### 1.6 Réinstallation complète (base FR + plan comptable FR)

Script automatisé pour repartir sur une base propre :

```bash
cd /opt/dorevia-plateform/tenants/o19/apps/odoo/lab
./reinstall_o19.sh
```

**Avec restauration d’un dump** (données métier) :

```bash
# Dump au format pg_dump custom (.dump) ou SQL (.sql)
DUMP_FILE=/tmp/mon_dump.dump ./reinstall_o19.sh
# ou
./reinstall_o19.sh /tmp/mon_dump.dump
```

Étapes : arrêt Odoo → drop DB → filestore → (init vierge **ou** restore dump) → config pays France → install dorevia_vault_connector, dorevia_session_guard → config Vault/DVIG.

**Filestore** : si le dump provient d’une autre instance, copier le filestore manuellement dans le volume `odoo_lab_o19_data/filestore/odoo_lab_o19/`.

**⚠️ Dump Odoo 18 (laplatine2026)** : la restauration d'un dump Odoo 18 sur o19 échoue (incompatibilités de schéma). Script dump : `dump_laplatine2026.sh`.

Token DVIG : exporter `DOREVIA_DVIG_TOKEN` ou le script tente de le lire depuis `tenants/core-stinger/secrets/dvig.tokens.yml`.

---

## Phase 2 — Vérifier OCA et image Odoo 19

### 2.1 Vérifier l'image Odoo 19

```bash
docker pull odoo:19.0-20260205
```

**Éviter le tag flottant** (`odoo:19.0`) : un rebuild peut provoquer upgrade silencieux → changement pip → bug OCA → 1 journée perdue. Toujours épingler la date.

### 2.2 Vérifier les addons OCA 19.0

| Addon | Repo OCA | Branche 19.0 |
|-------|----------|--------------|
| account_reconcile_oca | account-reconcile | À vérifier |
| account_statement_base | account-reconcile | À vérifier |
| account_reconcile_model_oca | account-reconcile | À vérifier |
| base_sparse_field | server-tools | À vérifier |
| queue_job | queue | À vérifier |

**Commandes** : `git ls-remote https://github.com/OCA/account-reconcile.git refs/heads/19.0`

### 2.3 Créer Dockerfile Odoo 19 (si besoin)

**Fichier** : `/opt/dorevia-plateform/units/odoo/Dockerfile.o19` (ou adapter `units/odoo/Dockerfile`)

```dockerfile
FROM odoo:19.0-20260205
USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3-venv \
 && python3 -m venv /opt/odoo-venv \
 && /opt/odoo-venv/bin/pip install --upgrade pip \
 && /opt/odoo-venv/bin/pip install --no-cache-dir PyJWT>=2.8.0 requests>=2.31.0 python-barcode \
 && apt-get clean && rm -rf /var/lib/apt/lists/*
ENV PATH="/opt/odoo-venv/bin:${PATH}"
USER odoo
```

---

## Phase 3 — Branche 19.0 du connecteur Vault

### 3.1 Créer la branche Git

**Git ne fonctionne pas par dossier** — la branche est au niveau du dépôt :

```bash
cd /opt/dorevia-plateform
git checkout -b odoo19-support
# ou : git checkout -b 19.0
```

Puis adapter les addons dans `units/odoo/custom-addons/`.

### 3.2 Adapter dorevia_vault_connector

*(Chemins relatifs à `units/odoo/custom-addons/`)*

| Fichier | Action |
|---------|--------|
| `dorevia_vault_connector/__manifest__.py` | Vérifier `depends` : account_reconcile_oca (version 19.0) |
| `dorevia_vault_connector/models/account_move.py` | Adapter API si changements Odoo 19 |
| `dorevia_vault_connector/models/account_payment.py` | Adapter API si changements Odoo 19. **Piège** : `account.payment` a changé entre 18 et 19 — `action_post()` peut se déclencher à un moment différent. Surveiller `account_move_line_ids` (souvent là que ça casse). |
| `dorevia_vault_connector/models/account_bank_statement_line.py` | Vérifier `reconcile_bank_line()` / `unreconcile_bank_line()` OCA 19.0 |
| `dorevia_vault_connector/controllers/linky_bank_reconciliation.py` | Vérifier compatibilité |

### 3.3 Adapter dorevia_session_guard

*(Chemins relatifs à `units/odoo/custom-addons/`)*

| Fichier | Action |
|---------|--------|
| `dorevia_session_guard/__manifest__.py` | Vérifier dépendances |
| `dorevia_session_guard/models/ir_http.py` | Vérifier API Odoo 19 |
| `dorevia_session_guard/controllers/main.py` | Vérifier API Odoo 19 |

### 3.4 Chemin d'addons dédié

Option A : Créer `units/odoo/custom-addons-19/` avec les addons 19.0  
Option B : Utiliser le même `custom-addons` avec la branche 19.0 (si pas de cohabitation 18/19 sur le même serveur)

Pour o19 : monter `custom-addons-19` dans le compose Odoo. **Critique** : `odoo.conf` doit contenir :

```ini
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons-19
```

Sinon : `module not found` (2 h de debug).

---

## Phase 4 — Déployer et tester sur base vierge

### 4.1 Déployer (sans platform — réutilise core-stinger)

```bash
cd /opt/dorevia-plateform
./bin/dorevia.sh apply o19 --env lab --auto-gateway
```

Ou manuellement :

```bash
cd /opt/dorevia-plateform
# Platform : o19 n'a pas units.platform — utilise core-stinger
./bin/dorevia.sh app up odoo lab o19
./bin/dorevia.sh app up ui lab o19
./bin/dorevia.sh gateway aggregate --reload
```

### 4.2 Créer la base Odoo

1. Ouvrir https://odoo.lab.o19.doreviateam.com
2. Créer une base (nom : `o19` ou `odoo_lab_o19`) — **langue : Français**, **pays : France** (pour plan comptable FR)
3. Installer les modules : `dorevia_vault_connector`, `dorevia_session_guard`, etc.

**Base existante sans plan comptable FR :**
```bash
docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http < tenants/o19/apps/odoo/lab/configure_fr_plan_comptable.py
```

### 4.3 Configurer les paramètres Odoo

| Paramètre | Valeur |
|-----------|--------|
| `dorevia.vault.url` | `http://vault-core-stinger:8080` (interne Docker) |
| `dorevia.vault.tenant` | `o19` |
| `dorevia.dvig.url` | `http://dvig-core-stinger:8080` (interne Docker) |
| `dorevia.dvig.internal.url` | `http://dvig-core-stinger:8080/internal/outbox/process` |
| `dorevia.dvig.source` | `odoo.lab.o19` |
| `dorevia_session_guard.logout_linky_url` | `https://ui.lab.o19.doreviateam.com` |

**Important** : Odoo tourne dans Docker → utiliser les hostnames internes (`dvig-core-stinger`, `vault-core-stinger`). Les URLs `https://dvig.o19...` ne résolvent pas depuis le conteneur.

**Déjà configuré** (2026-03-06). Token DVIG : `tok_lab_o19_002` dans `tenants/core-stinger/secrets/dvig.tokens.yml`.

Pour reconfigurer manuellement :
```bash
# Exporter le token puis :
docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http < tenants/o19/apps/odoo/lab/configure_vault_dvig.py
```

### 4.4 Token DVIG (o19 utilise core-stinger)

Le token o19 est dans `tenants/core-stinger/secrets/dvig.tokens.yml`. Pour régénérer :
```bash
./bin/dorevia.sh token issue odoo lab o19 --force
# Puis ajouter le nouveau token_hash à tenants/core-stinger/secrets/dvig.tokens.yml
```

---

## Phase 5 — Validation flux complet

### 5.1 Vaulting factures

1. Créer une facture client dans Odoo
2. Valider (action_post)
3. Vérifier statut « Protégée » et présence de `dorevia_vault_id`

**Test idempotence** : Créer deux fois la même facture et vérifier que `vault_event_id` n'est pas dupliqué. Sinon : double ingestion → Linky faux.

### 5.2 Vaulting paiements

1. Enregistrer un paiement
2. Valider
3. Vérifier statut vaulted

### 5.3 Lettrage

1. Effectuer un lettrage bancaire (Comptabilité → Relevés bancaires → Lettrage)
2. Vérifier émission événement RECONCIL vers DVIG : `SELECT * FROM outbox_events WHERE payload->>'event_type' IN ('bank.move.reconciled','bank.move.unreconciled')`

**Note** : Base o19 vierge = 0 lignes `account_bank_statement_line`. Script de test :
```bash
docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http < tenants/o19/apps/odoo/lab/test_lettrage_reconcil.py
```
Vérifier DVIG : `SELECT * FROM outbox_events WHERE payload->>'event_type'='bank.move.reconciled'`

### 5.4 Linky

1. Ouvrir https://ui.lab.o19.doreviateam.com
2. Vérifier `/api/tenant` → `o19`
3. **Test /api/cards** (validation complète) :

```bash
curl -sS https://ui.lab.o19.doreviateam.com/api/cockpit/cards?tenant=o19
```

Si ça marche : ✔ Linky voit DVIG, ✔ Linky voit Vault, ✔ tenant reconnu.
4. Vérifier carte réconciliation bancaire (si `linky_bank_reconciliation` configuré)

### 5.5 Réconciliation bancaire (Odoo → Linky)

```bash
curl -s "https://odoo.lab.o19.doreviateam.com/dorevia/vault/linky_bank_reconciliation?tenant=o19&date_from=2026-01-01&date_to=2026-12-31"
```

---

## 6. Récapitulatif des commandes

```bash
cd /opt/dorevia-plateform

# Phase 1
mkdir -p tenants/o19/{state,secrets,platform,apps/odoo/{lab,stinger,prod},apps/ui/{lab,stinger,prod}}
# Créer manifest.json (voir 1.2)
./bin/dorevia.sh validate o19
./bin/dorevia.sh render o19 --env lab

# Phase 4
./bin/dorevia.sh apply o19 --env lab --auto-gateway

# Vérifications
docker ps | grep o19
curl -sS https://ui.lab.o19.doreviateam.com/api/tenant
curl -sS https://ui.lab.o19.doreviateam.com/api/cockpit/cards?tenant=o19
curl -sS https://odoo.lab.o19.doreviateam.com
```

---

## 7. URLs finales (tenant o19)

| Service | URL |
|---------|-----|
| Odoo 19 | https://odoo.lab.o19.doreviateam.com |
| Linky | https://ui.lab.o19.doreviateam.com |
| Vault (partagé) | https://vault.core-stinger.doreviateam.com |
| DVIG (partagé) | https://dvig.core-stinger.doreviateam.com |

---

## 8. Références

- **Rapport MOA :** `ZeDocs/web39/RAPPORT_MOA_TENANT_O19_ODOO19_2026-03-06.md`
- **PV de recette :** `ZeDocs/web39/PV_RECETTE_TENANT_O19_2026-03-06.md`
- **queue_job o19 :** `ZeDocs/web39/RUNBOOK_QUEUE_JOB_O19.md`
- SP19 : `ZeDocs/web39/SP19.md`
- OCA account-reconcile : https://github.com/OCA/account-reconcile
- OCA queue : https://github.com/OCA/queue
- Connecteur : `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_vault_connector/`
- COMMANDES_PIEREZ.md : `/opt/dorevia-plateform/COMMANDES_PIEREZ.md` — `./bin/dorevia.sh` validate, render, apply

---

## 9. Annexe — Recréation base DVIG (si corruption)

Si la base DVIG est corrompue (IndexCorrupted, UndefinedTable) :

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose stop dvig dvig-db
docker rm -f dvig-db-core-stinger 2>/dev/null
docker volume rm dvig_db_core-stinger_data
docker compose up -d dvig-db dvig
# Attendre healthcheck, puis exécuter les migrations :
for f in 001 002 003 004 005 006; do
  docker exec -i dvig-db-core-stinger psql -U dvig_user -d dvig_db < /opt/dorevia-plateform/sources/dvig/migrations/${f}_*.sql
done
docker restart dvig-core-stinger
```
