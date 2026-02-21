# Résolution des Conflits de Conteneurs Docker

## ⚠️ Erreur rencontrée

```
Error: The container name "/odoo_db_lab_core" is already in use
```

Cette erreur apparaît lorsque des conteneurs avec les mêmes noms existent déjà.

---

## ✅ Solutions

### Option 1 : Redémarrer les conteneurs existants (Recommandé)

Si les conteneurs tournent déjà, redémarrer simplement :

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Redémarrer le service Odoo (utilise la nouvelle image si rebuild)
docker compose restart odoo

# Vérifier que le conteneur utilise la nouvelle image
docker compose ps
```

**Avantage** : Rapide, ne perd pas les données

---

### Option 2 : Arrêter et redémarrer proprement

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Arrêter les conteneurs
docker compose stop odoo

# Redémarrer avec la nouvelle image
docker compose up -d odoo

# Vérifier les logs
docker compose logs odoo | tail -20
```

**Avantage** : Propre, utilise la nouvelle image

---

### Option 3 : Reconstruire complètement (si nécessaire)

Si vous voulez forcer l'utilisation de la nouvelle image :

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Arrêter et supprimer les conteneurs (⚠️ ne supprime pas les volumes)
docker compose down

# Reconstruire et redémarrer
docker compose up -d --build odoo
```

**⚠️ Attention** : `docker compose down` arrête et supprime les conteneurs, mais **préserve les volumes** (données sauvegardées).

---

### Option 4 : Utiliser le projet Docker Compose existant

Si les conteneurs ont été créés avec un autre projet Docker Compose :

```bash
# Vérifier le projet actuel
docker compose ps

# Si nécessaire, spécifier le projet
docker compose -p dorevia_odoo_lab_core up -d odoo
```

---

## 🔍 Vérification

### Vérifier que le conteneur utilise la nouvelle image

```bash
# Vérifier l'image utilisée
docker inspect odoo_lab_core | grep -A 5 "Image"

# Vérifier PyJWT dans le conteneur
docker compose exec odoo python3 -c "import jwt; print('✅ PyJWT version:', jwt.__version__)"
```

**Résultat attendu** : L'image doit être `odoo:18.0-dorevia` et PyJWT doit être disponible.

---

## 📝 Recommandation

**Pour votre cas** : Utiliser l'**Option 1** (redémarrer) ou l'**Option 2** (stop + up).

Ces options préservent les données et utilisent la nouvelle image.

---

**Date de création** : 2026-01-04

