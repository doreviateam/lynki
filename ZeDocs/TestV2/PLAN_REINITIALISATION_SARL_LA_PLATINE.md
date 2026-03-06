# 🔄 Plan de Réinitialisation - Tenant sarl-la-platine

**Date** : 2026-01-11  
**Tenant** : `sarl-la-platine`  
**Environnement** : `stinger`  
**⚠️ ATTENTION** : Cette opération va **supprimer toutes les données** de la base de données Odoo.

---

## 📋 Éléments à Réinitialiser

### Containers
- `odoo_stinger_sarl-la-platine` (container Odoo)
- `odoo_db_stinger_sarl-la-platine` (container PostgreSQL)

### Volumes Docker
- `odoo_stinger_sarl-la-platine_db` (base de données PostgreSQL)
- `odoo_stinger_sarl-la-platine_data` (filestore Odoo)

---

## 🔄 Phases de Réinitialisation

### Phase 0 : Vérification de l'État Actuel

```bash
# Vérifier si les containers existent
docker ps -a --format "{{.Names}}" | grep "sarl-la-platine"

# Vérifier si les volumes existent
docker volume ls --format "{{.Name}}" | grep "sarl-la-platine"
```

### Phase 1 : Arrêt des Containers (si existants)

```bash
# Arrêter les containers Odoo et DB
docker stop odoo_stinger_sarl-la-platine odoo_db_stinger_sarl-la-platine 2>/dev/null || echo "Containers déjà arrêtés ou inexistants"
```

### Phase 2 : Suppression des Containers (si existants)

```bash
# Supprimer les containers
docker rm odoo_stinger_sarl-la-platine odoo_db_stinger_sarl-la-platine 2>/dev/null || echo "Containers déjà supprimés ou inexistants"
```

### Phase 3 : Suppression des Volumes

```bash
# Supprimer les volumes (⚠️ Données perdues définitivement)
docker volume rm odoo_stinger_sarl-la-platine_db odoo_stinger_sarl-la-platine_data 2>/dev/null || echo "Volumes déjà supprimés ou inexistants"
```

### Phase 4 : Création du docker-compose.yml (si nécessaire)

Si le docker-compose.yml n'existe pas, il doit être créé. Voir la structure dans `tenants/core/apps/odoo/stinger/docker-compose.yml` comme référence.

### Phase 5 : Recréation des Containers

Les containers seront recréés automatiquement au prochain démarrage via `dorevia.sh` ou docker-compose.

Si un docker-compose.yml existe :
```bash
cd /opt/dorevia-plateform/tenants/sarl-la-platine/apps/odoo/stinger
docker compose up -d
```

Sinon, utiliser `dorevia.sh` :
```bash
dorevia.sh app up odoo stinger sarl-la-platine
```

### Phase 5 : Vérification

```bash
# Vérifier que les containers sont démarrés
docker ps --format "{{.Names}}\t{{.Status}}" | grep sarl-la-platine

# Vérifier que les volumes sont recréés
docker volume ls --format "{{.Name}}" | grep sarl-la-platine

# Vérifier l'accès Odoo
curl -I https://odoo.stinger.sarl-la-platine.doreviateam.com
```

---

## ⚠️ Avertissements

1. **Données irréversibles** : Toutes les données de la base de données seront supprimées définitivement
2. **Filestore** : Tous les fichiers stockés (pièces jointes, images, etc.) seront supprimés
3. **Configuration** : La configuration Odoo (`odoo.conf`) sera préservée
4. **Modules** : Les modules installés devront être réinstallés après réinitialisation

---

## ✅ Checklist

- [ ] Phase 1 : Containers arrêtés
- [ ] Phase 2 : Containers supprimés
- [ ] Phase 3 : Volumes supprimés
- [ ] Phase 4 : Containers recréés
- [ ] Phase 5 : Vérification complète
- [ ] Réinstallation des modules nécessaires (dorevia_posted_lock, dorevia_vault_connector)
- [ ] Reconfiguration des paramètres système (dorevia.vault.url, dorevia.vault.token, etc.)

---

## 📝 Notes

- Après réinitialisation, Odoo démarrera avec une base de données vide
- Il faudra créer une nouvelle base de données via l'interface web Odoo
- Les modules devront être réinstallés
- Les paramètres système devront être reconfigurés
