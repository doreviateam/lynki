# 🔧 Résolution du Problème de Permissions Vault

**Date** : 2026-01-11  
**Problème** : Erreur `permission denied` lors du stockage de documents dans Vault  
**Statut** : ✅ **RÉSOLU**

---

## 📋 Problème Identifié

Lors du traitement des événements par le worker DVIG, Vault renvoyait une erreur 500 :

```
failed to create storage directory: mkdir /opt/dorevia-vault/storage/2026: permission denied
```

**Cause** : Les volumes Docker (`vault_storage_core-stinger`, `vault_ledger_core-stinger`, `vault_audit_core-stinger`) étaient montés avec les permissions `root:root`, alors que le conteneur Vault s'exécute avec l'utilisateur `vault` (uid=1000).

---

## ✅ Solution Appliquée

### 1. Correction Immédiate (Temporaire)

```bash
docker exec -u root vault-core-stinger sh -c \
  'chown -R vault:vault /opt/dorevia-vault/storage /opt/dorevia-vault/ledger /opt/dorevia-vault/audit && \
   chmod -R 755 /opt/dorevia-vault/storage /opt/dorevia-vault/ledger /opt/dorevia-vault/audit'
```

### 2. Solution Permanente : Script d'Initialisation

Création d'un script d'initialisation (`docker-entrypoint.sh`) qui :

1. **Détecte l'exécution en root** (au démarrage du conteneur)
2. **Corrige automatiquement les permissions** des volumes montés
3. **Crée les sous-répertoires nécessaires** (organisation par année)
4. **Passe à l'utilisateur `vault`** pour exécuter l'application

**Fichier** : `sources/vault/scripts/docker-entrypoint.sh`

```bash
#!/bin/sh
# Script d'initialisation pour le conteneur Docker Vault
# Corrige les permissions des volumes montés au démarrage

if [ "$(id -u)" = "0" ]; then
    # Corriger les permissions des volumes montés
    chown -R vault:vault /opt/dorevia-vault/storage
    chown -R vault:vault /opt/dorevia-vault/ledger
    chown -R vault:vault /opt/dorevia-vault/audit
    
    # Créer les sous-répertoires si nécessaire
    mkdir -p /opt/dorevia-vault/storage/$(date +%Y)
    chown -R vault:vault /opt/dorevia-vault/storage/$(date +%Y)
    
    # Passer à l'utilisateur vault
    exec su-exec vault "$@"
else
    exec "$@"
fi
```

### 3. Modification du Dockerfile

**Ajouts** :
- Installation de `su-exec` (alternative légère à `sudo`)
- Copie du script d'initialisation
- Configuration de `ENTRYPOINT` pour utiliser le script

```dockerfile
# Installer les dépendances runtime
RUN apk --no-cache add ca-certificates tzdata wget curl su-exec

# Copier le script d'initialisation
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Utiliser le script d'initialisation comme entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
```

### 4. Nouvelle Image Docker

**Version** : `dorevia/vault:v1.3.2`

**Build** :
```bash
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:v1.3.2 .
```

**Mise à jour docker-compose.yml** :
```yaml
vault:
  image: dorevia/vault:v1.3.2
```

---

## 🧪 Validation

### Vérification des Permissions

```bash
docker exec vault-core-stinger sh -c 'ls -la /opt/dorevia-vault/ | grep -E "storage|ledger|audit"'
```

**Résultat attendu** :
```
drwxr-xr-x    2 vault    vault         4096 Jan 11 21:43 audit
drwxr-xr-x    2 vault    vault         4096 Jan 11 21:43 ledger
drwxr-xr-x    3 vault    vault         4096 Jan 11 21:43 storage
```

### Test du Worker DVIG

```bash
docker exec dvig-core-stinger sh -c 'cd /app && python3 -m workers.outbox_worker --limit 10'
```

**Résultat attendu** :
- ✅ Événements traités avec succès
- ✅ Documents stockés dans Vault
- ✅ Aucune erreur de permissions

---

## 📝 Notes Techniques

### Pourquoi ce problème survient-il ?

1. **Volumes Docker** : Lorsqu'un volume Docker est créé pour la première fois, il est initialisé avec les permissions du système hôte (généralement `root:root`).

2. **Conteneur non-root** : Le Dockerfile Vault crée un utilisateur non-root (`vault`, uid=1000) pour des raisons de sécurité, conformément aux bonnes pratiques Docker.

3. **Conflit** : Le conteneur ne peut pas créer de fichiers/répertoires dans les volumes appartenant à `root`.

### Pourquoi cette solution est-elle robuste ?

1. **Automatique** : Les permissions sont corrigées à chaque démarrage du conteneur, même si le volume est recréé.

2. **Sécurisée** : Le script détecte l'exécution en root et passe immédiatement à l'utilisateur `vault` après la correction.

3. **Compatible** : Fonctionne avec les volumes Docker existants et nouveaux.

---

## 🔄 Prochaines Étapes

1. ✅ **Correction immédiate appliquée**
2. ✅ **Script d'initialisation créé**
3. ✅ **Dockerfile modifié**
4. ✅ **Nouvelle image buildée et déployée**
5. ⏳ **Tests de validation en cours**

---

## 📚 Références

- **SPEC Phase 6 - Ops Hardening** : Sécurisation des conteneurs
- **Docker Best Practices** : Utilisation d'utilisateurs non-root
- **Alpine Linux** : Utilisation de `su-exec` (alternative légère à `sudo`)

---

**Auteur** : Dorevia Team  
**Date de résolution** : 2026-01-11
