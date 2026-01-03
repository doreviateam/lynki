# 🖥️ Gestion Serveurs — Phase 3

**Version** : 1.0  
**Date** : 2026-01-02  
**Phase** : Phase 3 "Domaines & Serveurs Clients"

---

## Structure

Chaque serveur client est configuré dans un fichier JSON :
```
servers/<server_name>.json
```

## Format Configuration

```json
{
  "server_name": "<server_name>",
  "description": "Description du serveur",
  "public_ip": "<IP_PUBLIQUE>",
  "ssh": {
    "user": "<user_ssh>",
    "key_path": "<chemin_cle_ssh>",
    "port": 22
  },
  "domains": {
    "canonical": "<domaine_client>",
    "dns_managed_by": "doreviateam|client"
  },
  "requirements": {
    "docker": true,
    "docker_compose": true,
    "ports": [22, 80, 443],
    "min_disk_gb": 50
  },
  "created_at": "2026-01-02T00:00:00Z",
  "version": "1.0"
}
```

## Champs

### `server_name`
- Identifiant unique du serveur (slug DNS)
- Exemple : `ionos-rozas`, `ovh-dido`

### `public_ip`
- IP publique du serveur
- Format : IPv4

### `ssh`
- Configuration SSH pour accès distant
- `user` : Utilisateur SSH (doit avoir sudo)
- `key_path` : Chemin vers la clé SSH privée
- `port` : Port SSH (défaut : 22)

### `domains`
- Configuration domaines associés au serveur
- `canonical` : Domaine canonique
- `dns_managed_by` : Qui gère le DNS (`doreviateam` ou `client`)

### `requirements`
- Prérequis système pour le serveur
- `docker` : Docker installé
- `docker_compose` : Docker Compose installé
- `ports` : Ports ouverts requis
- `min_disk_gb` : Espace disque minimal (GB)

## Exemple

Voir `servers/server.example.json`

## Utilisation

### Ajouter un serveur

```bash
# Créer fichier configuration
cp servers/server.example.json servers/ionos-rozas.json
# Éditer avec les informations du serveur
```

### Valider configuration

```bash
# Validation JSON basique
jq empty servers/ionos-rozas.json
```

### Utilisation dans dorevia.sh

```bash
# Préflight serveur
dorevia.sh server preflight ionos-rozas

# Déploiement sur serveur
dorevia.sh platform up rozas --server ionos-rozas
```

---

**Dernière mise à jour** : 2026-01-02

