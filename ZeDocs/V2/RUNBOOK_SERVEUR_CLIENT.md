# 🖥️ Runbook Serveur Client — Phase 3

**Version** : 1.0  
**Date** : 2026-01-02  
**Phase** : Phase 3 "Domaines & Serveurs Clients"

---

## Vue d'Ensemble

Ce document décrit les processus opérationnels pour la gestion des serveurs clients dans la plateforme Dorevia.

---

## 1. Configuration Serveur Client

### 1.1 Ajouter un Serveur

```bash
dorevia.sh server add <server_name>
```

**Fichier généré** : `servers/<server_name>.json`

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

### 1.2 Lister Serveurs

```bash
dorevia.sh server list
```

---

## 2. Préflight Serveur Client

```bash
dorevia.sh server preflight <server_name>
```

**Vérifications** :
- ✅ Accès SSH
- ✅ Docker installé et fonctionnel
- ✅ Docker Compose installé
- ✅ Ports ouverts (22, 80, 443)
- ✅ Espace disque suffisant

**Action en cas d'échec** :
- Corriger configuration serveur
- Installer prérequis manquants
- Relancer préflight

---

## 3. Déploiement Platform

```bash
dorevia.sh platform up <tenant> --server <server_name>
```

**Processus** :
1. Lecture configuration serveur
2. Copie `docker-compose.yml` et secrets via SSH
3. Exécution `docker compose up -d` à distance
4. Vérification services démarrés

**Fichiers transférés** :
- `tenants/<tenant>/platform/docker-compose.yml`
- `tenants/<tenant>/secrets/dvig.tokens.yml`

---

## 4. Déploiement App

```bash
dorevia.sh app up <univers> <env> <tenant> --server <server_name>
```

**Processus** :
1. Lecture configuration serveur
2. Copie `docker-compose.yml` et `odoo.conf` via SSH
3. Exécution `docker compose up -d` à distance
4. Vérification services démarrés

**Fichiers transférés** :
- `tenants/<tenant>/apps/<univers>/<env>/docker-compose.yml`
- `tenants/<tenant>/apps/<univers>/<env>/odoo.conf`

---

## 5. Statut Serveur Client

```bash
dorevia.sh server status <server_name>
```

**Informations affichées** :
- Configuration serveur
- Test connexion SSH
- IP publique
- Domaine canonique

---

## 6. Checklist Opérationnelle

### Avant Déploiement

- [ ] Serveur configuré (`server add`)
- [ ] Préflight OK (`server preflight`)
- [ ] DNS configuré (si domaine client)
- [ ] Secrets préparés

### Après Déploiement

- [ ] Services démarrés (`platform status`, `app status`)
- [ ] URLs accessibles
- [ ] Certificats SSL obtenus
- [ ] Healthchecks OK

---

## 7. Troubleshooting

### Problème : Échec connexion SSH

**Causes possibles** :
- Clé SSH incorrecte
- Port SSH incorrect
- Firewall bloquant

**Solution** :
1. Vérifier clé SSH : `ssh -i <key_path> <user>@<ip>`
2. Vérifier port SSH dans configuration
3. Vérifier firewall serveur

### Problème : Docker non installé

**Solution** :
```bash
# Sur serveur client
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Problème : Services non démarrés

**Solution** :
1. Vérifier logs : `docker logs <container_name>`
2. Vérifier configuration : `docker compose config`
3. Redémarrer : `docker compose up -d --force-recreate`

---

## 8. Backup/Restore

Voir `lib/backup/README.md` pour détails complets.

**Backup** :
```bash
dorevia.sh backup <tenant> --server <server_name>
```

**Restore** :
```bash
dorevia.sh restore <tenant> --server <server_name> --from <backup_dir>
```

---

**Dernière mise à jour** : 2026-01-02

