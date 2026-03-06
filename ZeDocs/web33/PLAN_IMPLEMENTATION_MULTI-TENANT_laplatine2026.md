# Plan d'implémentation — Démo Multi-Tenant laplatine2026

**Date :** 2026-02-28  
**Référence :** `ZeDocs/web33/SPEC_MULTI-TENANT.md`  
**Durée estimée :** 1 journée  
**Prérequis :** Dump `/tmp/laplatine_20260228.dump` sur le serveur, DNS en place

---

## 0. Vue d'ensemble

| Phase | Périmètre | Estimation | Dépendance |
|-------|-----------|------------|-------------|
| **Phase 1** | Provisionner le tenant `laplatine2026` | 1 h | — |
| **Phase 2** | Préparer Odoo LAB et restaurer le dump | 1 h | Phase 1 |
| **Phase 3** | Déployer Linky LAB + Caddy | 0,5 h | Phase 1 |
| **Phase 4** | Configurer DVIG et lancer backfill | 0,5 h | Phase 2 |
| **Phase 5** | Validation et neutralisation clone | 0,5 h | Phase 4 |

**Principe :** Réutiliser l'infrastructure partagée (Vault, DVIG core-stinger). Créer uniquement Odoo LAB + Linky LAB dédiés au tenant `laplatine2026`. Pas de filestore. **Démo orientée données + preuves + cockpit, pas orientée documents PDF** — ne jamais cliquer dans l'historique des pièces jointes.

**Convention de nom :** Utiliser `laplatine2026` (sans tiret) partout : DNS, TENANT_ID, Vault, DVIG, db_name. Moins de surprises dans scripts, labels, regex.

---

## Checks anti-weekend (go/no-go)

À valider avant de continuer. Si un check échoue → corriger avant la phase suivante.

| # | Quand | Check | Commande |
|---|-------|-------|----------|
| 1 | Avant Phase 1 | DNS résout | `dig +short ui.lab.laplatine2026.doreviateam.com` |
| 2 | Avant Phase 2 | Dump lisible | `file /tmp/laplatine_20260228.dump` |
| 3 | Après restore (Phase 2) | Signature Odoo (ir_module_module) | Voir section 2.3 |
| 4 | Après Odoo up (Phase 2) | Conteneur Odoo up | `docker ps -f name=odoo_lab_laplatine2026 --format '{{.Names}}: {{.Status}}'` |
| 5 | Après Linky up (Phase 3) | `/api/tenant` répond 200 + laplatine2026 | `curl -sS -i .../api/tenant \| head` |
| 6 | Avant backfill (Phase 4) | Token DVIG valide | `curl -s http://dvig-core-stinger:8080/health` |
| 7 | Après backfill (Phase 4) | Compteur documents vault > 0 | Voir section 4.3 |

---

## Phase 1 — Provisionner le tenant laplatine2026

**Check go/no-go n°1 :** `dig +short ui.lab.laplatine2026.doreviateam.com` doit résoudre.

### 1.1 Créer la structure du tenant

Créer les répertoires et fichiers (sur le serveur, depuis `/opt/dorevia-plateform`) :

```
tenants/laplatine2026/
├── state/manifest.json
├── apps/odoo/lab/
│   ├── docker-compose.yml
│   └── odoo.conf
└── apps/ui/lab/
    └── docker-compose.yml
```

**manifest.json** (adapter depuis sarl-la-platine) :

```json
{
  "version": "1.0",
  "tenant_id": "laplatine2026",
  "created_at": "2026-02-28T00:00:00Z",
  "universes": ["odoo", "ui"],
  "environments": ["lab"],
  "domain_mode": "saas",
  "units": {"odoo": ["odoo", "postgres"], "ui": ["linky"]},
  "images": {"odoo": "odoo:18.0-20250819", "postgres": "postgres:16", "linky": "dorevia/linky:confirmation-v1.3"},
  "linky_vault_url": "http://vault-core-stinger:8080",
  "linky_company_display_names": {},
  "linky_dvig_url": "http://dvig-core-stinger:8080"
}
```

**Note :** `linky_company_display_names` peut rester vide ou être renseigné après inspection de la base restaurée.

### 1.2 docker-compose Odoo LAB

Copier `tenants/core/apps/odoo/lab/docker-compose.yml` et adapter :
- `odoo_lab_core` → `odoo_lab_laplatine2026`
- Volumes : `odoo_lab_laplatine2026_db`, `odoo_lab_laplatine2026_data`
- **POSTGRES_DB** : fixer `POSTGRES_DB=postgres` pour que le conteneur crée uniquement la base système ; on crée `laplatine2026` à la main (plan déterministe)

### 1.3 odoo.conf LAB

Copier `tenants/core/apps/odoo/lab/odoo.conf` (ou `tenants/sarl-la-platine/apps/odoo/stinger/odoo.conf`) et adapter :
- `db_host = odoo_db_lab_laplatine2026`
- `db_name = laplatine2026` (ou nom de la base dans le dump — à vérifier avec `pg_restore -l`)

### 1.4 docker-compose Linky LAB

Copier `tenants/sarl-la-platine/apps/ui/lab/docker-compose.yml` et adapter :
- `TENANT_ID: laplatine2026`
- `container_name: linky_lab_laplatine2026`
- `VAULT_URL`, `DVIG_URL` inchangés (Vault/DVIG partagés)

### 1.5 Générer token DVIG

```bash
cd /opt/dorevia-plateform
./bin/dorevia.sh token issue odoo lab laplatine2026
```

Ajouter l'entrée dans `tenants/core-stinger/secrets/dvig.tokens.yml` (format id, token_hash, tenant, univers, status). **Attention :** si DVIG charge les tokens au démarrage, redémarrer DVIG après ajout ; vérifier la doc du projet.

### 1.6 Rendre Caddyfile

```bash
./bin/dorevia.sh render laplatine2026 --env lab
```

Puis agréger et recharger la gateway :

```bash
./bin/dorevia.sh gateway aggregate --reload
```

---

## Phase 2 — Odoo LAB et restauration du dump

**Check go/no-go n°2 :** `file /tmp/laplatine_20260228.dump` → confirmer format (data, ASCII, etc.).

### 2.1 Démarrer la base PostgreSQL (sans Odoo au départ)

```bash
cd /opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab
docker compose up -d db
```

Attendre que `odoo_db_lab_laplatine2026` soit healthy.

### 2.2 Créer la base cible (obligatoire)

Avec `POSTGRES_DB=postgres`, le conteneur crée uniquement la base système. Il faut **créer explicitement** la base `laplatine2026` avant le `pg_restore` :

```bash
docker exec -i odoo_db_lab_laplatine2026 psql -U odoo -d postgres -c "CREATE DATABASE laplatine2026;"
```

### 2.3 Restaurer le dump

**Méthode robuste (docker cp)** — évite les galères stdin / format custom compressé :

```bash
docker cp /tmp/laplatine_20260228.dump odoo_db_lab_laplatine2026:/tmp/dump.dump
```

**Vérifier le format (dans le conteneur, l'hôte peut ne pas avoir pg_restore) :**

```bash
docker exec -i odoo_db_lab_laplatine2026 pg_restore -l /tmp/dump.dump | head -20
```

**Format .dump (pg_dump custom) :**

```bash
docker exec -i odoo_db_lab_laplatine2026 pg_restore -U odoo -d laplatine2026 --clean --if-exists --no-owner --no-privileges /tmp/dump.dump
```

**Format .sql (plain)** — si le dump est en SQL, copier puis :

```bash
docker exec -i odoo_db_lab_laplatine2026 psql -U odoo -d laplatine2026 -f /tmp/dump.dump
```

**Check go/no-go n°3 (après restore) :** `docker exec -i odoo_db_lab_laplatine2026 psql -U odoo -d laplatine2026 -c "SELECT COUNT(*) FROM ir_module_module;"` → si ça répond, base Odoo OK.

### 2.4 Adapter odoo.conf

S'assurer que `db_name` dans `odoo.conf` correspond à la base restaurée.

### 2.5 Démarrer Odoo

```bash
cd /opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab
docker compose up -d
```

**Check go/no-go n°4 (après Odoo up) :** `docker ps -f name=odoo_lab_laplatine2026 --format '{{.Names}}: {{.Status}}'` → doit afficher `odoo_lab_laplatine2026: Up ...`.

---

## Phase 3 — Linky LAB

### 3.1 Démarrer Linky

```bash
cd /opt/dorevia-plateform/tenants/laplatine2026/apps/ui/lab
docker compose up -d
```

### 3.2 Vérifier Caddy

S'assurer que `ui.lab.laplatine2026.doreviateam.com` route vers `linky_lab_laplatine2026:3000`.

```bash
curl -sI https://ui.lab.laplatine2026.doreviateam.com
```

**Check go/no-go n°5 :** `curl -sS -i https://ui.lab.laplatine2026.doreviateam.com/api/tenant | head` → status 200 et corps `laplatine2026`.

---

## Phase 4 — DVIG et backfill

**Check go/no-go n°6 (avant backfill) :** `curl -s http://dvig-core-stinger:8080/health` → DVIG doit répondre. Token dans `tenants/core-stinger/secrets/dvig.tokens.yml` ; si reload DVIG nécessaire, le faire avant.

### 4.1 Configurer Odoo pour DVIG

Dans Odoo (paramètres ou `ir.config_parameter`) :
- `dorevia.dvig.url` → URL DVIG (ex. `http://dvig-core-stinger:8080`)
- `dorevia.dvig.token` → token brut généré en 1.5
- `dorevia.tenant` → `laplatine2026`

### 4.2 Lancer le backfill

**Sécuriser l'idempotence / double run :**
- Si disponible : backfill en **dry-run** ou **fenêtre réduite** (10 factures) d'abord.
- Ne pas relancer tant que le backfill n'est pas terminé.
- Si relance nécessaire : option de purge tenant `laplatine2026` côté Vault documents avant.

Via l'interface Odoo (menu Vault / Backfill) ou l'endpoint replay :

```bash
curl -X POST "http://dvig-core-stinger:8080/api/v1/replay/backfill" \
  -H "Content-Type: application/json" \
  -d '{"tenant": "laplatine2026", ...}'
```

Ou via l'action manuelle Odoo si disponible (dorevia_vault_connector).

### 4.3 Vérifier les événements Vault

**Check go/no-go n°7 (après backfill) :** Compteur documents Vault > 0.

```bash
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT tenant, COUNT(*) FROM documents WHERE tenant = 'laplatine2026' GROUP BY tenant;
"
```

---

## Phase 5 — Validation et neutralisation

### 5.1 Neutraliser le clone (STEP 5 SPEC) — checklist exécutable

| Élément | Action |
|---------|--------|
| **SMTP** | `mail.catchall.domain` vide ; serveur sortant supprimé ou désactivé |
| **Crons** | Désactiver ceux qui envoient / synchronisent : marketing, mail, webhooks |
| **Webhooks** | Couper ce qui appelle l'extérieur : paiement, shipping, API tierces |

Option SQL désactivation globale (si accepté) :

```sql
UPDATE ir_mail_server SET active = false;
UPDATE ir_cron SET active = false WHERE name ILIKE '%mail%' OR name ILIKE '%webhook%' OR name ILIKE '%marketing%';
```

### 5.2 Filestore — périmètre démo

Pas de filestore restauré. Démo orientée **données + preuves + cockpit**, pas orientée documents PDF. **Ne jamais cliquer** dans l'historique des pièces jointes (risque 404).

### 5.3 Validation isolation (STEP 8 SPEC)

- Ouvrir `ui.lab.sarl-la-platine.doreviateam.com` → données sarl-la-platine
- Ouvrir `ui.lab.laplatine2026.doreviateam.com` → données laplatine2026
- Créer une facture test dans laplatine2026 → visible uniquement dans laplatine2026
- **Ne pas** cliquer sur documents/attachments historiques (pas de filestore)

---

## Plan de rollback

```bash
# Stop services
cd /opt/dorevia-plateform/tenants/laplatine2026/apps/odoo/lab && docker compose down
cd /opt/dorevia-plateform/tenants/laplatine2026/apps/ui/lab && docker compose down

# Retirer token DVIG de dvig.tokens.yml
# Re-render Caddy sans laplatine2026
# Supprimer tenants/laplatine2026/ si besoin
```

**Aucun impact sur sarl-la-platine (prod).**

---

## Références

- SPEC : `ZeDocs/web33/SPEC_MULTI-TENANT.md`
- Checklist : `ZeDocs/web33/CHECKLIST_DEMO_MULTI-TENANT.md`
- Avis expert : `ZeDocs/web33/RAPPORT_AVIS_EXPERT_SPEC_MULTI-TENANT.md`

---

*Document créé le 2026-02-28.*
