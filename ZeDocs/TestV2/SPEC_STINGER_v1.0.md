# SPEC — Plateforme Dorevia en STINGER (Simulation PROD-like)

**Version** : v1.0.0  
**Statut** : Draft  
**Date** : 2026-01-10  
**Auteur** : Dorevia Team

---

## 1. Objectif

Mettre en place un environnement STINGER permettant de simuler la production (prod-like) sans impacter la PROD.

**Objectifs** :
- Valider les flux Odoo → DVIG → Vault
- Vérifier l'intégrité et la traçabilité
- Tester la génération des constats mensuels
- Tester la facturation MRR dans Odoo core
- Tester les modules `dorevia_*` avant déploiement PROD

---

## 2. Périmètre

**Inclus** :
- Odoo core STINGER
- Odoo clients STINGER
- DVIG STINGER (instance dédiée)
- Vault STINGER (instance dédiée)
- DNS, reverse proxy, TLS
- Logs et sauvegardes

**Exclus** :
- Haute dispo avancée
- SSO
- Paiement réel

**Note** : Cette spécification concerne le tenant `core` uniquement. Les autres tenants conservent l'architecture v2.0 (DVIG/Vault partagés).

---

## 3. Concepts

- **LAB** = expérimentation (développement)
- **STINGER** = pré-prod (prod-like, simulation)
- **PROD** = production (clients réels)

**Isolation** :
- Un tenant = un client = une base Odoo
- **DVIG et Vault sont séparés par environnement** (LAB, STINGER, PROD) pour le tenant `core`
- Chaque environnement a ses propres instances DVIG/Vault pour isoler complètement les données

**Workflow** :
- Développement des modules `dorevia_*` sur LAB
- Test en STINGER (simulation prod-like)
- Déploiement en PROD (clients réels → `dvig.prod.core.doreviateam.com`)

---

## 4. URLs

### Core STINGER

- `https://odoo.stinger.core.doreviateam.com`
- `https://dvig.stinger.core.doreviateam.com`
- `https://vault.stinger.core.doreviateam.com`

### Clients STINGER

- `https://odoo.stinger.sarl-la-platine.doreviateam.com`
- `https://odoo.stinger.sweet-manihot.doreviateam.com`

**Note** : Les clients STINGER vontulteront vers `dvig.stinger.core.doreviateam.com` (isolation complète).

---

## 5. DNS

Créer des records A vers le serveur STINGER :

- `odoo.stinger.core.doreviateam.com`
- `dvig.stinger.core.doreviateam.com`
- `vault.stinger.core.doreviateam.com`
- `odoo.stinger.sarl-la-platine.doreviateam.com`
- `odoo.stinger.sweet-manihot.doreviateam.com`

---

## 6. Reverse Proxy

Chaque FQDN pointe vers :

- **Odoo** → port `8069`
- **DVIG** → port `8080`
- **Vault** → port `8080`

**Headers requis** :
- `X-Forwarded-Proto: https`
- `Host: <fqdn>`

---

## 7. Architecture

### Core (Platform — tenant `core`)

**STINGER** :
- `dvig_stinger_core` (container DVIG)
- `vault_stinger_core` (container Vault)
- `vault_db_stinger_core` (container PostgreSQL Vault)

**LAB** (référence) :
- `dvig_lab_core`
- `vault_lab_core`
- `vault_db_lab_core`

**PROD** (référence) :
- `dvig_prod_core`
- `vault_prod_core`
- `vault_db_prod_core`

### Odoo core (Apps)

**STINGER** :
- `odoo_stinger_core` (container Odoo)
- `odoo_db_stinger_core` (container PostgreSQL Odoo)

### Clients (Apps)

**STINGER** :
- `odoo_stinger_<tenant>` (ex: `odoo_stinger_sarl-la-platine`)
- `odoo_db_stinger_<tenant>` (ex: `odoo_db_stinger_sarl-la-platine`)

---

## 8. Configuration Odoo

### Fichier `odoo.conf`

Dans `tenants/core/apps/odoo/stinger/odoo.conf` :

```ini
[options]
# Base de données
db_host = odoo_db_stinger_core
db_port = 5432
db_user = odoo
db_password = odoo
dbfilter = ^odoo_stinger_core$

# Mot de passe maître
admin_passwd = doreviateam@2026

# Addons
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons

# Data
data_dir = /var/lib/odoo

# Proxy mode (obligatoire derrière reverse proxy HTTPS)
proxy_mode = True
```

### Paramètres DB requis

Dans la base de données Odoo (`odoo_stinger_core`) :

```sql
-- web.base.url (HTTPS obligatoire)
UPDATE ir_config_parameter 
SET value = 'https://odoo.stinger.core.doreviateam.com' 
WHERE key = 'web.base.url';

-- report.url (HTTPS obligatoire pour PDF)
UPDATE ir_config_parameter 
SET value = 'https://odoo.stinger.core.doreviateam.com' 
WHERE key = 'report.url';
```

---

## 9. Volumes Docker

### Platform (tenant `core`)

**STINGER** :
- `vault_db_stinger_core_data` : Base de données Vault
- `vault_storage_stinger_core` : Stockage fichiers Vault
- `vault_ledger_stinger_core` : Ledger Vault
- `vault_audit_stinger_core` : Audit Vault
- `dvig_logs_stinger_core` : Logs DVIG

**LAB** (référence) :
- `vault_db_lab_core_data`
- `vault_storage_lab_core`
- `vault_ledger_lab_core`
- `vault_audit_lab_core`
- `dvig_logs_lab_core`

**PROD** (référence) :
- `vault_db_prod_core_data`
- `vault_storage_prod_core`
- `vault_ledger_prod_core`
- `vault_audit_prod_core`
- `dvig_logs_prod_core`

### Apps

**STINGER** :
- `odoo_stinger_core_db` : Base de données Odoo core
- `odoo_stinger_core_data` : Filestore Odoo core
- `odoo_stinger_<tenant>_db` : Base de données Odoo client
- `odoo_stinger_<tenant>_data` : Filestore Odoo client
- `oca_extra_addons` : Modules OCA (partagé entre tous les tenants/envs)

---

## 10. Bases de Données

### Platform (tenant `core`)

**STINGER** :
- `dorevia_vault_stinger` : Base de données Vault STINGER

**LAB** (référence) :
- `dorevia_vault_lab` : Base de données Vault LAB

**PROD** (référence) :
- `dorevia_vault_prod` : Base de données Vault PROD

### Apps

**STINGER** :
- `odoo_stinger_core` : Base de données Odoo core
- `odoo_stinger_<tenant>` : Base de données Odoo client

---

## 11. Tokens DVIG

### Fichiers de tokens (tenant `core`)

**STINGER** :
- `tenants/core/secrets/dvig.stinger.tokens.yml`

**LAB** (référence) :
- `tenants/core/secrets/dvig.lab.tokens.yml`

**PROD** (référence) :
- `tenants/core/secrets/dvig.prod.tokens.yml`

### Format source

Format : `<univers>.stinger.<tenant>`

**Exemples** :
- `odoo.stinger.core`
- `odoo.stinger.sarl-la-platine`
- `odoo.stinger.sweet-manihot`

### Génération

```bash
# Générer token pour Odoo core STINGER
dorevia.sh token issue odoo stinger core

# Générer token pour Odoo client STINGER
dorevia.sh token issue odoo stinger sarl-la-platine
```

---

## 12. DVIG

**Rôle** :
- Authentification par tokens
- Validation tenant
- Forward vers Vault

**Endpoints** :
- `GET /health` : Health check
- `POST /api/v1/ingest` : Ingestion d'événements

**Auth** :
- Token par tenant
- Source : `odoo.stinger.<tenant>`
- Scope : `universe=stinger`

**Configuration** :
- Container : `dvig_stinger_core`
- Port interne : `8080`
- URL externe : `https://dvig.stinger.core.doreviateam.com`
- Tokens : `tenants/core/secrets/dvig.stinger.tokens.yml`

---

## 13. Vault

**Rôle** :
- Stockage sécurisé des documents
- Scellage (hash, signature)
- Indexation
- Génération constats mensuels

**Endpoints** :
- `GET /health` : Health check
- `POST /api/v1/vault` : Stockage document
- `GET /api/v1/constats` : Liste constats

**Configuration** :
- Container : `vault_stinger_core`
- Base de données : `vault_db_stinger_core` (PostgreSQL)
- Port interne : `8080`
- URL externe : `https://vault.stinger.core.doreviateam.com`
- Base de données : `dorevia_vault_stinger`

---

## 14. Odoo core

**Rôle** :
- Gestion des contrats
- Règles tarifaires
- Facturation MRR (Monthly Recurring Revenue)

**Flux** :
1. Récupération constats Vault STINGER
2. Calcul MRR basé sur les constats
3. Génération facture

**Configuration** :
- Container : `odoo_stinger_core`
- Base de données : `odoo_db_stinger_core` (PostgreSQL)
- Port interne : `8069`
- URL externe : `https://odoo.stinger.core.doreviateam.com`
- Base de données : `odoo_stinger_core`

---

## 15. Flux global

```
Odoo client STINGER
  → DVIG STINGER (dvig.stinger.core.doreviateam.com)
  → Vault STINGER (vault.stinger.core.doreviateam.com)
  → Constat généré
  → Odoo core STINGER
  → Facture MRR
```

**Isolation** :
- Les clients STINGER vontulteront uniquement vers DVIG/Vault STINGER
- Aucune interaction avec LAB ou PROD
- Données complètement isolées

---

## 16. Compose Projects

**Platform** :
- `dorevia_stinger_core_platform` (tenant `core`, env STINGER)

**Apps** :
- `dorevia_odoo_stinger_core` (Odoo core)
- `dorevia_odoo_stinger_<tenant>` (Odoo clients)

---

## 17. Sauvegardes

- **Dump Postgres quotidien** : Toutes les bases de données STINGER
- **Snapshot volumes Vault** : Volumes persistants Vault STINGER
- **Rétention** : 14 jours

**Bases à sauvegarder** :
- `dorevia_vault_stinger`
- `odoo_stinger_core`
- `odoo_stinger_<tenant>` (pour chaque client)

---

## 18. Sécurité

- **HTTPS partout** : Certificats Let's Encrypt automatiques
- **Tokens par tenant** : Tokens DVIG séparés par environnement
- **Secrets séparés** : Secrets STINGER/PROD isolés
- **Isolation réseau** : Réseau Docker `dorevia-network`
- **Proxy mode** : `proxy_mode = True` dans Odoo (obligatoire)

---

## 19. Tests

### Smoke tests

```bash
# Health checks
curl https://dvig.stinger.core.doreviateam.com/health
curl https://vault.stinger.core.doreviateam.com/health
curl https://odoo.stinger.core.doreviateam.com
```

### Tests fonctionnels

- **Ingest OK** : Odoo client → DVIG STINGER → Vault STINGER
- **Constat généré** : Vault STINGER génère constat mensuel
- **Facture créée** : Odoo core STINGER génère facture MRR

### Tests d'isolation

- Vérifier que les données STINGER n'apparaissent pas en PROD
- Vérifier que les données PROD n'apparaissent pas en STINGER
- Vérifier que les tokens STINGER ne fonctionnent pas en PROD

---

## 20. Décisions

- **DVIG/Vault dédiés en STINGER** : Instances séparées pour isolation complète
- **Clients ne parlent jamais directement au Vault** : Toujours via DVIG
- **Facturation basée uniquement sur le Vault** : Source de vérité unique
- **Tenant `core` uniquement** : Autres tenants conservent architecture v2.0 (partagée)

---

## 21. Backlog

1. **DNS** : Créer enregistrements DNS STINGER
2. **Reverse proxy** : Configurer Caddyfile STINGER
3. **Déploiement DVIG** : Déployer `dvig_stinger_core`
4. **Déploiement Vault** : Déployer `vault_stinger_core` + DB
5. **Odoo core** : Déployer `odoo_stinger_core` + DB
6. **Odoo clients** : Déployer instances clients STINGER
7. **Tokens** : Générer tokens DVIG STINGER
8. **Configuration Odoo** : Configurer `proxy_mode`, URLs HTTPS
9. **Tests E2E** : Valider flux complet
10. **Documentation** : Documenter procédures opérationnelles

---

## 22. Commandes utiles

### Déploiement

```bash
# Générer configs STINGER
dorevia.sh render core --env stinger

# Déployer platform STINGER
dorevia.sh platform up core stinger

# Déployer Odoo core STINGER
dorevia.sh app up odoo stinger core

# Déployer Odoo client STINGER
dorevia.sh app up odoo stinger sarl-la-platine
```

### Tokens

```bash
# Générer token Odoo core STINGER
dorevia.sh token issue odoo stinger core

# Générer token Odoo client STINGER
dorevia.sh token issue odoo stinger sarl-la-platine
```

### Configuration Odoo

```bash
# Mettre à jour web.base.url et report.url
docker exec odoo_db_stinger_core psql -U odoo -d odoo_stinger_core -c \
  "UPDATE ir_config_parameter SET value = 'https://odoo.stinger.core.doreviateam.com' WHERE key IN ('web.base.url', 'report.url');"
```

### Vérification

```bash
# Vérifier containers
docker ps | grep stinger

# Vérifier health
curl https://dvig.stinger.core.doreviateam.com/health
curl https://vault.stinger.core.doreviateam.com/health

# Vérifier logs
docker logs dvig_stinger_core
docker logs vault_stinger_core
```

---

**Note** : Cette spécification décrit une **vision future** pour le tenant `core`. L'implémentation nécessite des modifications de la plateforme (voir `ANALYSE_IMPACT_DVIG_VAULT_PAR_ENV_v1.0.md`).
