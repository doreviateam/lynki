# Installation Docker — Module Dorevia Billing CORE

## 🐳 Solution Docker avec PyJWT

Cette solution utilise un **Dockerfile personnalisé** qui étend l'image `odoo:18.0-20250819` et installe PyJWT + requests.

---

## 📋 Fichiers créés/modifiés

### 1. Dockerfile (`units/odoo/Dockerfile`)

```dockerfile
FROM odoo:18.0

# Installer les dépendances Python pour dorevia_billing_core
RUN pip3 install --no-cache-dir PyJWT>=2.8.0 requests>=2.31.0

# Vérifier l'installation
RUN python3 -c "import jwt; import requests; print('✅ PyJWT et requests installés')"
```

### 2. docker-compose.yml (modifié)

Le service `odoo` utilise maintenant le Dockerfile au lieu de l'image directe :

```yaml
odoo:
  build:
    context: ../../units/odoo
    dockerfile: Dockerfile
  image: odoo:18.0-dorevia
  # ... reste de la configuration
```

---

## 🚀 Installation

### Étape 1 : Reconstruire l'image Docker

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Reconstruire l'image avec les dépendances
docker-compose build odoo
```

**Temps estimé** : 2-3 minutes (téléchargement et installation des packages)

### Étape 2 : Redémarrer le service Odoo

```bash
# Arrêter le service actuel
docker-compose stop odoo

# Redémarrer avec la nouvelle image
docker-compose up -d odoo
```

### Étape 3 : Vérifier l'installation

```bash
# Vérifier que PyJWT est installé dans le conteneur
docker exec odoo_lab_core python3 -c "import jwt; import requests; print('✅ OK')"
```

**Résultat attendu** : `✅ OK`

---

## ✅ Installation du module dans Odoo

Une fois le conteneur redémarré :

1. **Accéder à Odoo CORE**
   - URL : https://odoo.lab.core.doreviateam.com

2. **Recharger la page Odoo Apps**

3. **Rechercher "dorevia"**

4. **Cliquer sur "Activer"**

Le module devrait s'installer **sans erreur** car PyJWT est maintenant disponible.

---

## 🔄 Mise à jour pour autres environnements

### Pour Stinger

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/stinger

# Modifier docker-compose.yml (même modification que lab)
# Puis reconstruire
docker-compose build odoo
docker-compose up -d odoo
```

### Pour Production

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/prod

# Modifier docker-compose.yml (même modification que lab)
# Puis reconstruire
docker-compose build odoo
docker-compose up -d odoo
```

---

## 📝 Modification du docker-compose.yml

Pour chaque environnement (lab, stinger, prod), modifier le service `odoo` :

**Avant** :
```yaml
odoo:
  image: odoo:18.0
  container_name: odoo_lab_core
```

**Après** :
```yaml
odoo:
  build:
    context: ../../units/odoo
    dockerfile: Dockerfile
  image: odoo:18.0-dorevia
  container_name: odoo_lab_core
```

**Note** : Le `context` doit pointer vers `../../units/odoo` depuis le répertoire du docker-compose.yml.

---

## 🧪 Vérification complète

### 1. Vérifier que l'image est construite

```bash
docker images | grep odoo:18.0-dorevia
```

**Résultat attendu** :
```
odoo  18.0-dorevia  abc123def456  2 minutes ago  1.2GB
```

### 2. Vérifier que le conteneur utilise la nouvelle image

```bash
docker inspect odoo_lab_core | grep Image
```

**Résultat attendu** : `"Image": "sha256:abc123..."` (correspond à odoo:18.0-dorevia)

### 3. Vérifier que PyJWT est disponible

```bash
docker exec odoo_lab_core python3 -c "import jwt; print('PyJWT version:', jwt.__version__)"
```

**Résultat attendu** : `PyJWT version: 2.x.x`

### 4. Vérifier que requests est disponible

```bash
docker exec odoo_lab_core python3 -c "import requests; print('requests version:', requests.__version__)"
```

**Résultat attendu** : `requests version: 2.x.x`

---

## 🐛 Dépannage

### Erreur : "Cannot locate Dockerfile"

**Solution** :
- Vérifier que le `context` dans docker-compose.yml pointe vers `../../units/odoo`
- Vérifier que le Dockerfile existe dans `units/odoo/Dockerfile`

### Erreur : "Module still shows PyJWT error"

**Solution** :
1. Vérifier que le conteneur utilise la nouvelle image :
   ```bash
   docker inspect odoo_lab_core | grep Image
   ```
2. Redémarrer Odoo complètement :
   ```bash
   docker-compose restart odoo
   ```
3. Vérifier les logs :
   ```bash
   docker-compose logs odoo | tail -50
   ```

### Erreur : "pip install failed"

**Solution** :
- Vérifier la connexion Internet du conteneur
- Vérifier que pip3 est disponible dans l'image odoo:18.0
- Essayer de reconstruire l'image :
  ```bash
  docker-compose build --no-cache odoo
  ```

---

## 📚 Documentation

- **Guide d'installation complet** : `README_INSTALLATION.md`
- **Guide rapide** : `INSTALLATION_RAPIDE.md`
- **Étapes après activation** : `ETAPES_APRES_ACTIVATION.md`
- **Installation sans Docker** : `INSTALLATION_SANS_PYJWT.md`

---

## ✅ Checklist

- [ ] Dockerfile créé dans `units/odoo/Dockerfile`
- [ ] docker-compose.yml modifié (service odoo avec build)
- [ ] Image Docker reconstruite (`docker-compose build odoo`)
- [ ] Service Odoo redémarré (`docker-compose up -d odoo`)
- [ ] PyJWT vérifié dans le conteneur
- [ ] Module installé dans Odoo Apps
- [ ] Module activé sans erreur

---

**Date de création** : 2026-01-04

