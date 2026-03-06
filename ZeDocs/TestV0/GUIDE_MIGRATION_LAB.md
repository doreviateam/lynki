# 📘 Guide Migration LAB — Vers Orchestrateur `dorevia.sh`

**Version** : 1.0  
**Date** : 2025-01-28  
**Contexte** : Migration de l'environnement LAB existant vers la nouvelle architecture orchestrée

---

## 🎯 Objectif

Migrer l'environnement Odoo LAB existant (géré manuellement ou via ancien `docker-compose.lab.yml`) vers la nouvelle architecture orchestrée par `dorevia.sh`.

---

## ⚠️ Prérequis

- ✅ Phases 0-5 terminées
- ✅ Gateway opérationnelle
- ✅ Platform démarrée (`dorevia.sh platform up core`)
- ✅ Backup des données LAB (recommandé)

---

## 📋 Étapes de Migration

### Étape 1 : Vérification État Actuel

```bash
# Lister containers Odoo LAB existants
docker ps -a | grep -E "(odoo.*lab|db.*lab)"

# Lister volumes existants
docker volume ls | grep -E "(odoo.*lab|db.*lab)"
```

**Identifier** :
- Containers : `odoo_lab`, `odoo_db_lab`, etc.
- Volumes : `odoo_lab_data`, `db_lab_data`, etc.

---

### Étape 2 : Backup Données (Recommandé)

```bash
# Backup volumes (exemple)
docker run --rm \
  -v odoo_lab_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/odoo_lab_data_backup.tar.gz /data

docker run --rm \
  -v db_lab_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db_lab_data_backup.tar.gz /data
```

---

### Étape 3 : Arrêt Ancien LAB

```bash
# Arrêter containers LAB existants
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.lab.yml down

# OU si containers lancés manuellement
docker stop odoo_lab odoo_db_lab 2>/dev/null || true
```

---

### Étape 4 : Migration Volumes (Optionnel)

Si vous souhaitez conserver les données existantes :

```bash
# Option A : Réutiliser volumes existants (renommage)
# Les nouveaux containers utiliseront les volumes avec les nouveaux noms
# (odoo_lab_core_data, odoo_lab_core_db)

# Option B : Copie de volumes
docker run --rm \
  -v odoo_lab_data:/source:ro \
  -v odoo_lab_core_data:/dest \
  alpine sh -c "cp -a /source/* /dest/"

docker run --rm \
  -v db_lab_data:/source:ro \
  -v odoo_lab_core_db:/dest \
  alpine sh -c "cp -a /source/* /dest/"
```

**⚠️ Note** : Si vous ne migrez pas les volumes, un nouveau LAB vierge sera créé.

---

### Étape 5 : Démarrage Nouveau LAB via Orchestrateur

```bash
# Démarrage via dorevia.sh
dorevia.sh app up odoo lab core
```

**Résultat attendu** :
- Containers créés : `odoo_lab_core`, `odoo_db_lab_core`
- Volumes créés : `odoo_lab_core_data`, `odoo_lab_core_db`
- Réseau : Connecté à `dorevia-network`
- URL : `https://odoo.lab.core.doreviateam.com`

---

### Étape 6 : Vérification Migration

```bash
# Statut app
dorevia.sh app status odoo lab core

# Vérifier containers
docker ps | grep -E "(odoo_lab_core|odoo_db_lab_core)"

# Vérifier volumes
docker volume ls | grep -E "(odoo_lab_core|db_lab_core)"

# Vérifier réseau
docker network inspect dorevia-network | grep -E "(odoo_lab_core|odoo_db_lab_core)"
```

---

### Étape 7 : Test Intégration

```bash
# Test health check
curl -k https://odoo.lab.core.doreviateam.com

# Test DVIG (si configuré)
curl -k https://dvig.core.doreviateam.com/health
```

---

### Étape 8 : Nettoyage Anciens Containers/Volumes (Optionnel)

**⚠️ ATTENTION** : Ne supprimer que si la migration est validée.

```bash
# Supprimer anciens containers
docker rm odoo_lab odoo_db_lab 2>/dev/null || true

# Supprimer anciens volumes (UNIQUEMENT si données migrées)
docker volume rm odoo_lab_data db_lab_data 2>/dev/null || true
```

---

## 🔄 Rollback (Si Nécessaire)

Si la migration échoue :

```bash
# Arrêter nouveau LAB
dorevia.sh app down odoo lab core

# Restaurer ancien LAB
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.lab.yml up -d

# OU restaurer depuis backup
docker run --rm \
  -v odoo_lab_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/odoo_lab_data_backup.tar.gz -C /
```

---

## 📊 Checklist Migration

- [ ] Backup données LAB effectué
- [ ] Anciens containers LAB arrêtés
- [ ] Volumes migrés (si nécessaire)
- [ ] Nouveau LAB démarré via `dorevia.sh app up odoo lab core`
- [ ] Containers nouveaux créés et running
- [ ] Volumes nouveaux créés
- [ ] Réseau `dorevia-network` connecté
- [ ] URL `https://odoo.lab.core.doreviateam.com` accessible
- [ ] Intégration DVIG/Vault testée
- [ ] Anciens containers/volumes supprimés (si validé)

---

## ⚠️ Points d'Attention

### Volumes
- **Nouveaux noms** : `odoo_lab_core_data`, `odoo_lab_core_db`
- **Anciens noms** : `odoo_lab_data`, `db_lab_data`
- Si vous ne migrez pas, un LAB vierge sera créé

### Containers
- **Nouveaux noms** : `odoo_lab_core`, `odoo_db_lab_core`
- **Anciens noms** : `odoo_lab`, `odoo_db_lab`
- Les anciens containers doivent être arrêtés avant migration

### Réseau
- **Nouveau** : Tous les services sur `dorevia-network`
- **Ancien** : Peut être sur réseau par défaut ou réseau dédié

### Configuration
- **Nouveau** : Généré depuis templates (`tenants/core/apps/odoo/lab/`)
- **Ancien** : `units/odoo/conf/odoo.lab.conf`

---

## 🎯 Résultat Attendu

Après migration réussie :

- ✅ LAB accessible via `https://odoo.lab.core.doreviateam.com`
- ✅ Containers nommés : `odoo_lab_core`, `odoo_db_lab_core`
- ✅ Volumes isolés : `odoo_lab_core_data`, `odoo_lab_core_db`
- ✅ Gestion via `dorevia.sh app * odoo lab core`
- ✅ Intégration DVIG/Vault opérationnelle

---

**Dernière mise à jour** : 2025-01-28

