# 💾 Backup/Restore Serveur Client — Phase 3

**Version** : 1.0  
**Date** : 2026-01-02  
**Phase** : Phase 3 "Domaines & Serveurs Clients"

---

## Vue d'Ensemble

Ce module gère le backup et restore pour les serveurs clients via SSH.

---

## Structure

```
lib/backup/
├── backup_remote.sh    # Backup serveur client (volumes + DB + secrets)
├── restore_remote.sh   # Restore serveur client (volumes + DB + secrets)
└── README.md           # Cette documentation
```

---

## Backup

### Commande

```bash
dorevia.sh backup <tenant> --server <server_name> [--output <dir>]
```

### Artefacts Générés

Pour un tenant sur serveur client, le backup génère :

**Platform (Vault)** :
- `vault-db.dump` : Dump PostgreSQL Vault
- `vault-storage.tar.gz` : Archive volume storage (obligatoire)
- `vault-ledger.tar.gz` : Archive volume ledger (recommandé)
- `vault-audit.tar.gz` : Archive volume audit (recommandé)

**Secrets** :
- `secrets.tar.gz` : Archive secrets (chiffré si GPG disponible)

### Structure Répertoire Backup

```
backups/backup-<tenant>-<timestamp>/
└── tenants/
    └── <tenant>/
        ├── platform/
        │   ├── vault-db.dump
        │   ├── vault-storage.tar.gz
        │   ├── vault-ledger.tar.gz
        │   └── vault-audit.tar.gz
        └── secrets/
            └── secrets.tar.gz
```

### Chiffrement Secrets

Si `gpg` est disponible et qu'une clé GPG "dorevia" existe, l'archive `secrets.tar.gz` est automatiquement chiffrée en `secrets.tar.gz.gpg`.

Sinon, l'archive reste non chiffrée (avec permissions 600/640).

---

## Restore

### Commande

```bash
dorevia.sh restore <tenant> --server <server_name> --from <backup_dir>
```

### Processus

1. **Restore volumes Vault** : Restaure `vault-storage`, `vault-ledger`, `vault-audit`
2. **Restore Vault DB** : Restaure le dump PostgreSQL Vault
3. **Restore secrets** : Déchiffre et restaure les secrets

### Déchiffrement Secrets

Si l'archive `secrets.tar.gz.gpg` existe, elle est automatiquement déchiffrée avant restauration.

---

## Exemple d'Utilisation

### Backup

```bash
# Backup tenant rozas sur serveur ionos-rozas
dorevia.sh backup rozas --server ionos-rozas

# Backup avec répertoire de sortie personnalisé
dorevia.sh backup rozas --server ionos-rozas --output /backups/rozas-2026-01-02
```

### Restore

```bash
# Restore tenant rozas depuis backup
dorevia.sh restore rozas --server ionos-rozas --from /backups/backup-rozas-20260102T120000Z
```

---

## Sécurité

### Permissions

- Archives secrets : `600` ou `640`
- Répertoires backup : `700` (recommandé)

### Chiffrement

- **Recommandé** : Utiliser GPG avec clé "dorevia"
- **Alternative** : Chiffrement manuel avec `gpg --symmetric`

---

## Validation

### Intégrité Archives

Chaque archive est validée après création :
- Test `tar -tzf` pour vérifier l'intégrité
- Vérification taille non vide

### Healthchecks Post-Restore

Après restore, vérifier manuellement :
```bash
# Vérifier services Vault
dorevia.sh platform status rozas --server ionos-rozas

# Vérifier healthcheck Vault
curl https://vault.rozas.rozas.gp/health
```

---

## Règle d'Or

**Un backup n'existe que si un restore a déjà été testé** (au moins une fois sur une sandbox).

---

**Dernière mise à jour** : 2026-01-02

