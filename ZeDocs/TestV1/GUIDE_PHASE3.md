# 📘 Guide Phase 3 "Domaines & Serveurs Clients" — Dorevia Platform

**Version** : 1.0  
**Date** : 2026-01-02  
**Phase** : Phase 3 "Domaines & Serveurs Clients"  
**Audience** : Exploitants, développeurs plateforme, clients  
**Prérequis** : Phase 1 "Fondations" et Phase 2 "Intention/Exécution" complétées

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Nouvelles fonctionnalités Phase 3](#nouvelles-fonctionnalités-phase-3)
3. [Guide d'utilisation — Domaines Clients](#guide-dutilisation---domaines-clients)
4. [Guide d'utilisation — Serveurs Clients](#guide-dutilisation---serveurs-clients)
5. [Guide d'utilisation — Alias Multi-Services](#guide-dutilisation---alias-multi-services)
6. [Guide d'utilisation — Backup/Restore](#guide-dutilisation---backuprestore)
7. [Exemples d'utilisation](#exemples-dutilisation)
8. [FAQ](#faq)
9. [Références](#références)

---

## Vue d'ensemble

La Phase 3 "Domaines & Serveurs Clients" étend la plateforme Dorevia pour supporter :

- ✅ **Domaines clients** : Utilisation de domaines clients en production (ex: `rozas.gp`)
- ✅ **Serveurs clients** : Déploiement sur serveurs clients dédiés (IONOS, etc.)
- ✅ **Alias multi-services** : Configuration d'alias globaux et par service
- ✅ **Backup/Restore serveur client** : Sauvegarde et restauration pour serveurs clients
- ✅ **Validation DNS automatique** : Vérification DNS avant déploiement
- ✅ **Certificats SSL automatiques** : Obtention automatique pour domaines clients

### Workflow Phase 3

**Scénario A — Domaine Client (SaaS Dorevia)** :
```
1. prompt <tenant> --env prod          → Configuration domaine client
2. render <tenant> --env prod          → Génération Caddyfile avec domaine client
3. preflight <tenant> --env prod --check-dns  → Validation DNS
4. gateway aggregate --reload          → Agrégation + certificats SSL
5. apply <tenant> --env prod            → Déploiement avec domaine client
```

**Scénario B — Serveur Client** :
```
1. server add <server_name>             → Configuration serveur client
2. server preflight <server_name>      → Vérifications serveur
3. platform up <tenant> --server <server_name>  → Déploiement platform
4. app up odoo prod <tenant> --server <server_name>  → Déploiement app
```

**Scénario C — Backup/Restore** :
```
1. backup <tenant> --server <server_name>  → Backup serveur client
2. restore <tenant> --server <server_name> --from <backup_dir>  → Restore
```

---

## Nouvelles fonctionnalités Phase 3

### Commandes Nouvelles

| Commande | Description | Phase |
|----------|-------------|-------|
| `server list` | Liste serveurs configurés | 3 |
| `server add <server_name>` | Ajoute un serveur client | 3 |
| `server preflight <server_name>` | Préflight serveur client | 3 |
| `server status <server_name>` | Statut serveur client | 3 |
| `backup <tenant> --server <server_name>` | Backup serveur client | 3 |
| `restore <tenant> --server <server_name> --from <backup_dir>` | Restore serveur client | 3 |

### Extensions Commandes Existantes

| Commande | Extension | Description | Phase |
|----------|-----------|-------------|-------|
| `prompt <tenant>` | Domaine client | Configuration domaine client | 3 |
| `prompt <tenant>` | Alias | Configuration alias multi-services | 3 |
| `preflight <tenant> --env <env>` | `--check-dns` | Validation DNS automatique | 3 |
| `platform up <tenant>` | `--server <server_name>` | Déploiement distant | 3 |
| `app up <univers> <env> <tenant>` | `--server <server_name>` | Déploiement distant | 3 |

---

## Guide d'utilisation — Domaines Clients

### Configuration Domaine Client

**Via `prompt`** :
```bash
dorevia.sh prompt rozas --env prod
```

**Étapes interactives** :
1. **Mode de production** : Sélectionner "Client" ou "Hybride"
2. **Domaine client** : Saisir domaine client (ex: `rozas.gp`)
3. **Fallback** : Confirmer fallback `doreviateam.com` (recommandé)
4. **Alias** : Configurer alias optionnels (global ou par service)

**Résultat** :
- Fichier `intent-*.json` avec configuration domaines
- Manifest mis à jour avec `domains.canonical`, `domains.fallback`, `domains.aliases`

### Génération Caddyfile avec Domaine Client

```bash
dorevia.sh render rozas --env prod
```

**Résultat** :
- Caddyfile généré avec hostnames canonique + fallback + alias
- Format multi-hostname : `canonique, fallback, alias1, alias2 { ... }`

### Validation DNS

```bash
dorevia.sh preflight rozas --env prod --check-dns
```

**Vérifications** :
- Résolution DNS pour tous les hostnames (canonique, fallback, alias)
- Cohérence IP (même IP pour tous)
- TTL acceptable (< 3600 secondes)

**Rapport** :
```
✅ DNS OK: odoo.prod.rozas.rozas.gp → 85.215.206.213
✅ DNS OK: odoo.prod.rozas.doreviateam.com → 85.215.206.213
✅ DNS OK: erp.rozas.gp → 85.215.206.213
```

### Certificats SSL

Les certificats SSL sont obtenus automatiquement par Caddy via Let's Encrypt.

**Prérequis** :
- DNS propagé (validation DNS OK)
- Ports 80/443 ouverts
- Caddy accessible depuis Internet

**Vérification** :
```bash
dorevia.sh gateway status
```

---

## Guide d'utilisation — Serveurs Clients

### Configuration Serveur Client

**Ajouter un serveur** :
```bash
dorevia.sh server add ionos-rozas
```

**Fichier généré** : `servers/ionos-rozas.json`

**Configuration requise** :
```json
{
  "description": "Serveur client IONOS pour tenant rozas",
  "public_ip": "85.215.206.213",
  "ssh": {
    "user": "dorevia",
    "key_path": "~/.ssh/id_rsa_ionos_rozas",
    "port": 22
  },
  "domains": {
    "canonical": "rozas.gp",
    "dns_managed_by": "client"
  },
  "requirements": {
    "docker": true,
    "docker_compose": true,
    "ports": [22, 80, 443],
    "min_disk_gb": 50
  }
}
```

### Préflight Serveur Client

```bash
dorevia.sh server preflight ionos-rozas
```

**Vérifications** :
- ✅ Accès SSH
- ✅ Docker installé et fonctionnel
- ✅ Docker Compose installé
- ✅ Ports ouverts (22, 80, 443)
- ✅ Espace disque suffisant

### Déploiement Platform sur Serveur Client

```bash
dorevia.sh platform up rozas --server ionos-rozas
```

**Processus** :
1. Lecture configuration serveur
2. Copie `docker-compose.yml` et secrets via SSH
3. Exécution `docker compose up -d` à distance
4. Vérification services démarrés

### Déploiement App sur Serveur Client

```bash
dorevia.sh app up odoo prod rozas --server ionos-rozas
```

**Processus** :
1. Lecture configuration serveur
2. Copie `docker-compose.yml` et `odoo.conf` via SSH
3. Exécution `docker compose up -d` à distance
4. Vérification services démarrés

---

## Guide d'utilisation — Alias Multi-Services

### Configuration Alias

**Via `prompt`** :
```bash
dorevia.sh prompt rozas --env prod
```

**Étape 5 — Alias** :
- **Alias global** : Appliqué à tous les services (ex: `api.rozas.gp`)
- **Alias par service** : Spécifique à un service (ex: `erp.rozas.gp` pour Odoo)

**Format** :
```
<service> <hostname>
```

**Exemples** :
- `global api.rozas.gp` → Alias pour tous les services
- `odoo erp.rozas.gp` → Alias spécifique Odoo
- `dvig auth.rozas.gp` → Alias spécifique DVIG

### Génération Caddyfile avec Alias

```bash
dorevia.sh render rozas --env prod
```

**Résultat** :
- Caddyfile avec hostnames : `canonique, fallback, alias1, alias2 { ... }`
- Alias global appliqué à tous les services
- Alias par service appliqué uniquement au service concerné

### Validation DNS Alias

```bash
dorevia.sh preflight rozas --env prod --check-dns
```

**Vérifications** :
- Résolution DNS pour tous les alias
- Cohérence IP (même IP que canonique)

---

## Guide d'utilisation — Backup/Restore

### Backup Serveur Client

```bash
dorevia.sh backup rozas --server ionos-rozas [--output <dir>]
```

**Artefacts générés** :
- `vault-db.dump` : Dump PostgreSQL Vault
- `vault-storage.tar.gz` : Archive volume storage
- `vault-ledger.tar.gz` : Archive volume ledger (si présent)
- `vault-audit.tar.gz` : Archive volume audit (si présent)
- `secrets.tar.gz` : Archive secrets (chiffré si GPG disponible)

**Structure** :
```
backups/backup-rozas-20260102T120000Z/
└── tenants/
    └── rozas/
        ├── platform/
        │   ├── vault-db.dump
        │   ├── vault-storage.tar.gz
        │   ├── vault-ledger.tar.gz
        │   └── vault-audit.tar.gz
        └── secrets/
            └── secrets.tar.gz
```

### Restore Serveur Client

```bash
dorevia.sh restore rozas --server ionos-rozas --from <backup_dir>
```

**Processus** :
1. Restauration volumes Vault (storage, ledger, audit)
2. Restauration Vault DB
3. Restauration secrets (déchiffrement si nécessaire)
4. Validation healthchecks

**Règle d'or** : Un backup n'existe que si un restore a déjà été testé.

---

## Exemples d'utilisation

### Exemple 1 : Déploiement avec Domaine Client (SaaS)

```bash
# 1. Configuration domaine client
dorevia.sh prompt rozas --env prod
# → Sélectionner "Client" ou "Hybride"
# → Saisir domaine client : rozas.gp
# → Confirmer fallback doreviateam.com

# 2. Génération artefacts
dorevia.sh render rozas --env prod

# 3. Validation DNS
dorevia.sh preflight rozas --env prod --check-dns

# 4. Agrégation gateway
dorevia.sh gateway aggregate --reload

# 5. Déploiement
dorevia.sh apply rozas --env prod
```

### Exemple 2 : Déploiement sur Serveur Client

```bash
# 1. Configuration serveur
dorevia.sh server add ionos-rozas
# → Éditer servers/ionos-rozas.json

# 2. Préflight serveur
dorevia.sh server preflight ionos-rozas

# 3. Déploiement platform
dorevia.sh platform up rozas --server ionos-rozas

# 4. Déploiement app
dorevia.sh app up odoo prod rozas --server ionos-rozas
```

### Exemple 3 : Backup/Restore

```bash
# 1. Backup
dorevia.sh backup rozas --server ionos-rozas

# 2. Restore (après incident)
dorevia.sh restore rozas --server ionos-rozas --from backups/backup-rozas-20260102T120000Z
```

---

## FAQ

### Q1 : Puis-je utiliser un domaine client sans serveur client ?

**R :** Oui, en mode "Client" ou "Hybride" via `prompt`, le domaine client peut être utilisé en SaaS Dorevia (serveur Doreviateam).

### Q2 : Le fallback `doreviateam.com` est-il obligatoire ?

**R :** Non, mais fortement recommandé pour le support et la continuité de service.

### Q3 : Comment gérer les certificats SSL pour domaines clients ?

**R :** Caddy obtient automatiquement les certificats via Let's Encrypt. Assurez-vous que :
- DNS est propagé
- Ports 80/443 sont ouverts
- Caddy est accessible depuis Internet

### Q4 : Puis-je avoir plusieurs alias pour un même service ?

**R :** Oui, vous pouvez configurer plusieurs alias (global ou par service) via `prompt`.

### Q5 : Comment restaurer un backup sur un nouveau serveur ?

**R :** Utilisez `restore <tenant> --server <new_server_name> --from <backup_dir>` après avoir configuré le nouveau serveur.

---

## Références

- **Spécification Phase 3** : `ZeDocs/V2/SPEC_Dorevia_Phase3_Domaines_Serveurs_Clients_v1.0.md`
- **Plan d'implémentation** : `ZeDocs/V2/PLAN_IMPLEMENTATION_PHASE3_SCRUM.md`
- **Runbook DNS** : `ZeDocs/V2/RUNBOOK_DNS.md`
- **Runbook Certificats SSL** : `ZeDocs/V2/RUNBOOK_CERTIFICATS_SSL_PHASE3.md`
- **Runbook Domaines Clients** : `ZeDocs/V2/RUNBOOK_DOMAINES_CLIENTS.md`
- **Runbook Serveur Client** : `ZeDocs/V2/RUNBOOK_SERVEUR_CLIENT.md`
- **Structure Domaines** : `ZeDocs/V2/STRUCTURE_DOMAINES_PHASE3.md`

---

**Dernière mise à jour** : 2026-01-02

