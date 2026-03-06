# SPEC — Ajout des units SuiteCRM et n8n dans Dorevia-Plateforme (SaaS managé)

**Version** : v1.0.0  
**Date** : 2026-02-01  
**Auteur** : David Baron (SPEC) — alignement plateforme : dorevia-plateforme  
**Cible** : `dorevia-plateforme` (architecture multi-tenant / units / manifest / render)  
**Objectif** : intégrer **SuiteCRM** (CRM dédié) et **n8n** (orchestration workflows) comme *units first-class* dans la plateforme, au même titre qu’Odoo/Sylius, avec alignement sur les conventions existantes (manifest, render, Caddy, CLI).

---

## 0) Résumé exécutif

- **SuiteCRM** : CRM primaire (pipeline commercial, contacts, activités, campagnes).
- **n8n** : colle d’intégration (webhooks, sync, transformations, appels API).
- **Odoo** : ERP (ventes, factures, stock, compta).
- **Dorevia (DVIG + Vault)** : couche de preuve (événements scellés, vérifiables).

**Chaîne cible** :

```
Site/Formulaires → SuiteCRM → n8n → Odoo → DVIG → Vault
                         ↘ (autres sources : POS, banque, emails) ↗
```

**Alignement plateforme** : hostnames `<service>.<env>.<tenant>.doreviateam.com`, conteneurs `<service>_<env>_<tenant>`, réseau `dorevia-network`, CLI `dorevia.sh app up <univers> <env> <tenant>`.

---

## 1) Périmètre

### 1.1 Inclus
- Création de deux units : `units/suitecrm/` et `units/n8n/`
- Déploiement Docker (compose) + intégration gateway (Caddy)
- Nommage DNS et conteneurs **alignés sur la plateforme** (voir §3)
- Extension du **manifest** (universes `suitecrm`, `n8n`) et des scripts de **render** (port par univers, blocs compose)
- Gestion des secrets (`.env` par tenant/env, non committés)
- Stratégie backup minimale (DB + volumes)
- Observabilité minimale (healthchecks + logs)
- Premiers workflows n8n (templates) : *web-to-lead* + *opportunity won → Odoo quotation*

### 1.2 Exclu (v1.0)
- SSO (Keycloak / OIDC) — v1.1+
- Haute dispo n8n (queue mode + workers) — v1.1+
- Migration data depuis CRM existant — hors scope
- Custom modules SuiteCRM — hors scope (vanilla + config)
- Vaulting d’événements CRM — préparation des points d’extension uniquement

---

## 2) Principes d’architecture

1. **Units first-class** : même gouvernance que `odoo/`, `sylius/`, `gateway/`.
2. **Isolation** : DB dédiée par unit (MariaDB SuiteCRM, PostgreSQL n8n) ; aucun partage de DB.
3. **Agnosticité** : CRM remplaçable ; n8n orchestre via API ; Vault indépendant.
4. **Souveraineté** : auto-hébergement ; aucun SaaS externe requis.
5. **Sécurité by default** : admin protégé, secrets non committés, TLS via Caddy.
6. **Conformité plateforme** : conventions manifest, render, Caddy et CLI respectées.

---

## 3) Conventions de nommage (alignées plateforme)

La plateforme utilise déjà les conventions suivantes (Odoo, Sylius, gateway). SuiteCRM et n8n les respectent.

### 3.1 Réseau Docker
- **Nom** : **`dorevia-network`** (external).
- Tous les conteneurs app (Odoo, SuiteCRM, n8n) et leurs DB sont attachés à ce réseau.

### 3.2 Hostnames (DNS)
**Format** :

```
<service>.<env>.<tenant>.doreviateam.com
```

- `<service>` ∈ `{odoo, suitecrm, n8n, sylius, ...}` (nom d’univers pour les apps)
- `<env>` ∈ `{lab, stinger, prod}`
- `<tenant>` = identifiant tenant (slug, ex. `sarl-la-platine`, `lglz`, `core`)

**Exemples** :
- `suitecrm.stinger.sarl-la-platine.doreviateam.com`
- `n8n.stinger.sarl-la-platine.doreviateam.com`
- `odoo.stinger.sarl-la-platine.doreviateam.com`

**Services cœur (sans `<env>` dans le hostname actuel)** : `dvig.<tenant>.doreviateam.com`, `vault.<tenant>.doreviateam.com` (inchangé).

### 3.3 Noms de conteneurs
**Format** : `<service>_<env>_<tenant>` pour l’app ; `<service>_db_<env>_<tenant>` pour la DB.

**Exemples** (tenant `sarl-la-platine`, env `stinger`) :
- SuiteCRM app : **`suitecrm_stinger_sarl-la-platine`**
- SuiteCRM DB : **`suitecrm_db_stinger_sarl-la-platine`**
- n8n app : **`n8n_stinger_sarl-la-platine`**
- n8n DB : **`n8n_db_stinger_sarl-la-platine`**
- Odoo app : **`odoo_stinger_sarl-la-platine`** (existant)

### 3.4 Ports par service (Caddy → conteneur)
| Service   | Port conteneur | Remarque     |
|-----------|----------------|--------------|
| odoo      | 8069           | Existant     |
| suitecrm  | 80             | HTTP         |
| n8n       | 5678           | Port par défaut n8n |

Le rendu Caddy doit produire pour chaque univers le bon `reverse_proxy <container>:<port>` (voir §7).

### 3.5 Chemins applicatifs
- SuiteCRM : `/` (root)
- n8n : `/` (root)
- Odoo : `/` (root)

---

## 4) Manifest et rendu (extensions requises)

### 4.1 Schéma manifest
- **universes** : ajouter **`suitecrm`** et **`n8n`** à l’enum (actuellement `["odoo", "pos", "sylius"]`).
- **units** : définir pour chaque nouvel univers la liste des services du compose, ex. :
  - `units.suitecrm` : `["suitecrm", "mariadb"]` (ou noms de services équivalents)
  - `units.n8n` : `["n8n", "postgres"]`
- **images** (optionnel) : `images.suitecrm`, `images.mariadb`, `images.n8n`, `images.postgres` avec valeurs par défaut si non présentes.

### 4.2 render_app_compose.sh
- Pour l’univers **suitecrm** : générer les services `db` (MariaDB) et `suitecrm` (app), avec :
  - `container_name` : `suitecrm_db_<env>_<tenant>`, `suitecrm_<env>_<tenant>`
  - réseau `dorevia-network`, volumes dédiés, healthcheck MariaDB.
- Pour l’univers **n8n** : générer les services `db` (PostgreSQL) et `n8n` (app), avec :
  - `container_name` : `n8n_db_<env>_<tenant>`, `n8n_<env>_<tenant>`
  - réseau `dorevia-network`, volumes dédiés, healthcheck PostgreSQL.
- Réutiliser la logique existante (comme pour odoo + postgres) en paramétrant image, port, commande et variables d’environnement par univers.

### 4.3 render_caddyfile.sh
- **Port par univers** : ne plus coder en dur `8069` pour tous les univers. Introduire un mapping, ex. :
  - `odoo` → 8069
  - `suitecrm` → 80
  - `n8n` → 5678
- Pour chaque univers du manifest, générer :
  - hostname : `${universe}.${ENV}.${TENANT_ID}.${CANONICAL_DOMAIN}`
  - bloc : `reverse_proxy ${universe}_${ENV}_${TENANT_ID}:<port>` avec `<port>` lu depuis le mapping.

### 4.4 dorevia.sh
- **validate_univers** : accepter **`suitecrm`** et **`n8n`** en plus de `odoo`.
- **_get_app_container_name** (et helpers associés) : gérer les units **suitecrm**, **suitecrm_db**, **n8n**, **n8n_db** (pattern identique à odoo/db).

### 4.5 Commandes CLI (alignement)
La plateforme utilise **`app up / down / status`** (pas `unit up`). Convention retenue :

- `dorevia.sh app up suitecrm <env> <tenant>`
- `dorevia.sh app up n8n <env> <tenant>`
- `dorevia.sh app status suitecrm <env> <tenant>`
- `dorevia.sh app down suitecrm <env> <tenant>`

Le répertoire de déploiement reste **`tenants/<tenant>/apps/<univers>/<env>/`** (compose + config), comme pour Odoo.

---

## 5) Unit `suitecrm`

### 5.1 Stack technique
- **SuiteCRM** (PHP + Apache/Nginx selon image)
- **MariaDB** (obligatoire pour SuiteCRM)
- Volumes : upload, config, cache selon image

### 5.2 Structure répertoire
```
units/suitecrm/
  docker-compose.yml   (template ou référence pour render)
  .env.example
  README.md
  caddy/               (optionnel : snippets)
  scripts/             (optionnel : init, backup, restore)
```

Les répertoires `volumes/` ne sont pas committés.

### 5.3 Variables d’environnement (minimum)
- `SUITECRM_DOMAIN` (ex. `suitecrm.stinger.sarl-la-platine.doreviateam.com`)
- `SUITECRM_ADMIN_USER`, `SUITECRM_ADMIN_PASSWORD`
- `SUITECRM_DB_HOST`, `SUITECRM_DB_NAME`, `SUITECRM_DB_USER`, `SUITECRM_DB_PASSWORD`
- `TZ=Europe/Paris`

### 5.4 Ports et exposition
- Conteneur web : **port 80** en interne ; **pas d’exposition** directe sur l’hôte.
- Exposition **uniquement via Caddy** (TLS + hostname).
- MariaDB : réseau interne Docker uniquement.

### 5.5 Noms de conteneurs (rappel)
- App : **`suitecrm_<env>_<tenant>`**
- DB : **`suitecrm_db_<env>_<tenant>`**

### 5.6 Healthcheck
- App : HTTP 200 sur `/` ou endpoint dédié selon image.
- MariaDB : healthcheck interne (ping / mysqladmin).

### 5.7 Backup / Restore
- **Backup DB** : `mysqldump` horodaté.
- **Backup volumes** : au minimum `uploads/`.
- RPO minimal v1.0 : 24h (backup daily).

---

## 6) Unit `n8n`

### 6.1 Stack technique
- **n8n** (app)
- **PostgreSQL** (DB n8n)
- (v1.1+) Redis + queue mode + workers : optionnel

### 6.2 Structure répertoire
```
units/n8n/
  docker-compose.yml   (template ou référence pour render)
  .env.example
  README.md
  workflows/           (templates export JSON)
  caddy/               (optionnel)
  scripts/             (backup, restore)
```

### 6.3 Variables d’environnement (minimum)
- `N8N_DOMAIN` (ex. `n8n.stinger.sarl-la-platine.doreviateam.com`)
- `N8N_ENCRYPTION_KEY` (obligatoire, stable — ne jamais perdre)
- `N8N_USER_MANAGEMENT_DISABLED=false`
- `N8N_BASIC_AUTH_ACTIVE=true` (si pas de SSO)
- `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`
- `DB_TYPE=postgresdb`
- `DB_POSTGRESDB_HOST`, `DB_POSTGRESDB_DATABASE`, `DB_POSTGRESDB_USER`, `DB_POSTGRESDB_PASSWORD`
- `TZ=Europe/Paris`

### 6.4 Sécurité n8n (minimum v1.0)
- Basic auth (ou user management n8n) + TLS via Caddy.
- Option : allowlist IP pour l’admin (snippet Caddy).
- Secrets chiffrés via `N8N_ENCRYPTION_KEY`.

### 6.5 Ports et conteneurs
- n8n : **port 5678** en interne.
- Conteneurs : **`n8n_<env>_<tenant>`**, **`n8n_db_<env>_<tenant>`**.

### 6.6 Backup / Restore
- Backup DB PostgreSQL (`pg_dump`).
- Volume n8n : optionnel si la DB contient l’essentiel ; conserver `~/.n8n` si utilisé.

---

## 7) Gateway (Caddy)

### 7.1 Objectifs
- TLS automatique.
- Routage par host (sans exposition directe des conteneurs).
- Headers sécurité (HSTS, etc.).
- Option : allowlist IP pour n8n (admin).

### 7.2 Règles de routage (alignées plateforme)
Pour chaque **univers** présent dans le manifest du tenant, le Caddyfile généré doit contenir un bloc de la forme :

- **Hostname** : `<univers>.<env>.<tenant>.doreviateam.com` (ou `domains.canonical` si défini).
- **Reverse proxy** : vers le **conteneur** `<univers>_<env>_<tenant>` sur le **port** associé à l’univers.

**Mapping univers → port** (à utiliser dans `render_caddyfile.sh`) :

| Univers  | Port |
|----------|------|
| odoo     | 8069 |
| suitecrm | 80   |
| n8n      | 5678 |

**Exemple généré** (tenant `sarl-la-platine`, env `stinger`) :
- `suitecrm.stinger.sarl-la-platine.doreviateam.com` → `reverse_proxy suitecrm_stinger_sarl-la-platine:80`
- `n8n.stinger.sarl-la-platine.doreviateam.com` → `reverse_proxy n8n_stinger_sarl-la-platine:5678`
- `odoo.stinger.sarl-la-platine.doreviateam.com` → `reverse_proxy odoo_stinger_sarl-la-platine:8069`

Les blocs DVIG/Vault restent inchangés (`dvig.<tenant>...`, `vault.<tenant>...` → conteneurs `dvig-<tenant>:8080`, `vault-<tenant>:8080`).

---

## 8) Workflows n8n — templates v1.0

### 8.1 Template A — Web-to-Lead
- **Trigger** : webhook (landing page / formulaire).
- **Actions** : normaliser payload (nom, email, société, téléphone, source) ; upsert dans SuiteCRM (Lead/Contact/Account selon règle) ; notifier (email/Slack) optionnel.

### 8.2 Template B — Opportunity Won → Odoo Partner + Quotation (MVP)
- **Trigger** : webhook SuiteCRM (ou polling planifié).
- **Actions** : récupérer opportunité + compte ; créer/mettre à jour `res.partner` dans Odoo ; créer devis (`sale.order`) draft ; tag/trace `origin=suitecrm`.

### 8.3 Template C — Facture Odoo postée → DVIG/Vault (préparation v1.1+)
- **Trigger** : webhook Odoo (quand `account.move` passe `posted`).
- **Actions** : construire payload canonique (SPEC Canonical Payload CFO) ; envoyer à DVIG ; stocker receipt/statut dans Odoo.
- Implémentation hors scope v1.0 ; structure prête.

---

## 9) Gouvernance des secrets

- Aucun secret committé.
- `.env` local par tenant/env (ex. `tenants/<tenant>/apps/suitecrm/<env>/.env`).
- Rotation : au minimum annuelle (ou à l’incident).
- **N8N_ENCRYPTION_KEY** : ne jamais perdre (backup sécurisé recommandé).

---

## 10) Exploitation (Runbook minimal)

### 10.1 Commandes (alignées CLI plateforme)
- `dorevia.sh app up suitecrm <env> <tenant>`
- `dorevia.sh app up n8n <env> <tenant>`
- `dorevia.sh app status suitecrm <env> <tenant>`
- `dorevia.sh app status n8n <env> <tenant>`
- `dorevia.sh app down suitecrm <env> <tenant>` (idem n8n)

Rendu préalable : `dorevia.sh render <tenant> --env <env>` puis, si besoin, `dorevia.sh gateway aggregate [--reload]`.

### 10.2 Monitoring minimal
- Healthcheck HTTP via Caddy.
- Logs (centralisation type Loki/ELK et alerting type Prometheus : v1.1+).

---

## 11) Critères d’acceptation (DoD)

### SuiteCRM
- [ ] URL `suitecrm.<env>.<tenant>.doreviateam.com` accessible en TLS.
- [ ] Admin SuiteCRM créé et login OK.
- [ ] DB MariaDB persistante (conteneur `suitecrm_db_<env>_<tenant>`).
- [ ] Backup DB scriptable et testé (dump + restore en lab).

### n8n
- [ ] URL `n8n.<env>.<tenant>.doreviateam.com` accessible en TLS.
- [ ] Auth activée + encryption key stable.
- [ ] DB PostgreSQL persistante (conteneur `n8n_db_<env>_<tenant>`).
- [ ] Import d’un workflow template A réussi.
- [ ] Exécution webhook → création lead SuiteCRM OK.

### Intégration
- [ ] Un flow « web-to-lead » opérationnel.
- [ ] Un flow « opportunity won → Odoo draft quotation » MVP opérationnel (même manuel).

### Plateforme
- [ ] Manifest accepte `universes` contenant `suitecrm` et `n8n`.
- [ ] `render_app_compose.sh` génère un compose valide pour suitecrm et n8n.
- [ ] `render_caddyfile.sh` génère les blocs avec les bons ports (80, 5678).
- [ ] `dorevia.sh app up suitecrm/n8n <env> <tenant>` démarre les conteneurs sur `dorevia-network`.

---

## 12) ADR (décisions d’architecture)

- **ADR-001** : SuiteCRM choisi comme CRM dédié (maturité, API, communauté) — DB MariaDB acceptée.
- **ADR-002** : n8n choisi comme orchestrateur (auto-hébergé, visuel, API-first) — DB PostgreSQL.
- **ADR-003** : Dorevia-Vault reste la source de vérité probante ; CRM/ERP sont des sources d’événements.
- **ADR-004** : Convention plateforme conservée : hostname `<service>.<env>.<tenant>.doreviateam.com`, conteneurs `<service>_<env>_<tenant>`, réseau `dorevia-network`, CLI `app up/down/status`.

---

## 13) Next steps (v1.1+)

- SSO (Keycloak/OIDC) pour n8n, SuiteCRM, Odoo.
- n8n queue mode (Redis) + workers.
- Observabilité (traces, métriques, dashboards).
- Vaulting d’événements CRM (ex. `opportunity.won` scellé).
- Templates n8n packagés par verticale (B2B, retail, services).

---

## Annexes

### A) Checklist « tenant onboarding » (stinger)
1. Provision DNS : `suitecrm.stinger.<tenant>.doreviateam.com`, `n8n.stinger.<tenant>.doreviateam.com`, `odoo.stinger.<tenant>.doreviateam.com`.
2. Manifest : ajouter `suitecrm` et `n8n` dans `universes` et définir `units.suitecrm` et `units.n8n`.
3. `dorevia.sh render <tenant> --env stinger` puis `dorevia.sh gateway aggregate --reload`.
4. `dorevia.sh app up suitecrm stinger <tenant>` + init admin.
5. `dorevia.sh app up n8n stinger <tenant>` + init auth/encryption.
6. Import des workflows templates n8n.
7. Test webhook end-to-end.

### B) Fichiers plateforme à étendre (résumé)
| Fichier | Modification |
|---------|--------------|
| `schemas/manifest.schema.json` | `universes` : ajouter `suitecrm`, `n8n` ; `units` : ajouter `suitecrm`, `n8n`. |
| `lib/render/render_app_compose.sh` | Blocs compose pour univers `suitecrm` (MariaDB + app) et `n8n` (PostgreSQL + app). |
| `lib/render/render_caddyfile.sh` | Mapping univers → port (80, 5678, 8069) ; utiliser le port dans `reverse_proxy`. |
| `bin/dorevia.sh` | `validate_univers` : accepter `suitecrm`, `n8n`. `_get_app_container_name` : gérer `suitecrm`, `suitecrm_db`, `n8n`, `n8n_db`. |
