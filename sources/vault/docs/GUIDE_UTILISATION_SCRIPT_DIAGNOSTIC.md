# 📖 Guide d'Utilisation - Script de Diagnostic FAC/2025/00020

**Date** : 2025-12-11  
**Script** : `scripts/diagnostic_fac_00020.sh`

---

## 🎯 Objectif

Le script de diagnostic automatisé permet d'exécuter toutes les vérifications nécessaires pour diagnostiquer le document FAC/2025/00020 en une seule commande.

---

## 📋 Prérequis

### 1. Variables d'Environnement

Le script nécessite la variable `DATABASE_URL` :

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/dorevia_vault?sslmode=disable"
```

### 2. Permissions

Le script nécessite :
- ✅ Accès à la base de données PostgreSQL
- ✅ Accès en lecture au répertoire `/opt/dorevia-vault/storage`
- ✅ Permissions sudo pour consulter les logs systemd (optionnel)

---

## 🚀 Utilisation

### Exécution Simple

```bash
cd /opt/dorevia-vault
export DATABASE_URL="postgres://user:password@localhost:5432/dorevia_vault"
./scripts/diagnostic_fac_00020.sh
```

### Exécution avec Variables d'Environnement

```bash
# Charger les variables depuis un fichier
source /opt/dorevia-vault/.env

# Exécuter le script
./scripts/diagnostic_fac_00020.sh
```

---

## 📊 Résultats

### Répertoire de Sortie

Le script crée un répertoire temporaire avec tous les résultats :

```
/tmp/diagnostic_fac_00020_YYYYMMDD_HHMMSS/
├── sql_results.txt      # Résultats des requêtes SQL
├── log_results.txt      # Résultats de la vérification des logs
├── file_results.txt     # Résultats de la vérification des fichiers
└── diagnostic_report.md # Rapport complet au format Markdown
```

### Fichiers Générés

1. **sql_results.txt** : Résultats de toutes les requêtes SQL
2. **log_results.txt** : Logs Vault pour la période concernée
3. **file_results.txt** : Résultats de la recherche de fichiers sur disque
4. **diagnostic_report.md** : Rapport complet au format Markdown

---

## 🔍 Contenu du Diagnostic

### 1. Requêtes SQL Exécutées

Le script exécute 7 requêtes SQL :

1. **Vérification par vault_id** : Recherche directe par UUID
2. **Recherche par Odoo ID** : Recherche par `odoo_model` et `odoo_id`
3. **Documents créés autour de la date** : ±1 minute autour de 21:28:25
4. **Documents avec tenant = '1'** : Statistiques pour ce tenant
5. **Documents sans tenant** : Statistiques pour documents sans tenant
6. **Recherche par UUID partiel** : En cas d'erreur de copie
7. **Statistiques générales** : Vue d'ensemble de la journée

### 2. Vérification des Logs

Le script vérifie les logs dans :
- ✅ Systemd (journalctl) si le service est actif
- ✅ `/var/log/dorevia-vault/` si le répertoire existe
- ✅ `/opt/dorevia-vault/logs/` si le répertoire existe

### 3. Vérification des Fichiers

Le script recherche les fichiers :
- ✅ Par UUID complet
- ✅ Dans la date attendue (2025/12/10)
- ✅ Par UUID partiel

---

## 📝 Exemple de Sortie

```
============================================
DIAGNOSTIC AUTOMATISÉ - Document FAC/2025/00020
============================================

📁 Répertoire de sortie : /tmp/diagnostic_fac_00020_20251211_090000

[1/5] Vérification des prérequis...
✅ DATABASE_URL défini
✅ psql disponible
✅ Connexion à la base de données réussie

[2/5] Exécution des requêtes SQL...
✅ Requêtes SQL exécutées
   Résultats sauvegardés dans : /tmp/.../sql_results.txt

[3/5] Vérification des logs Vault...
✅ Vérification des logs terminée
   Résultats sauvegardés dans : /tmp/.../log_results.txt

[4/5] Vérification des fichiers sur disque...
✅ Vérification des fichiers terminée
   Résultats sauvegardés dans : /tmp/.../file_results.txt

[5/5] Génération du rapport...
✅ Rapport généré
   Rapport sauvegardé dans : /tmp/.../diagnostic_report.md

============================================
✅ DIAGNOSTIC TERMINÉ
============================================
```

---

## 🔧 Personnalisation

### Modifier les Paramètres

Pour diagnostiquer un autre document, modifiez les variables au début du script :

```bash
VAULT_ID="85852790-be9e-4432-84c0-a3f00ed2353e"
ODOO_ID="1521"
ODOO_MODEL="account.move"
TENANT="1"
DATE_START="2025-12-10 21:27:25"
DATE_END="2025-12-10 21:29:25"
TIMESTAMP_LOG="2025-12-10 21:28:25"
```

### Changer le Répertoire de Sortie

Modifiez la variable `OUTPUT_DIR` :

```bash
OUTPUT_DIR="/opt/dorevia-vault/diagnostics/diagnostic_fac_00020_$(date +%Y%m%d_%H%M%S)"
```

---

## ⚠️ Dépannage

### Erreur : DATABASE_URL non défini

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/dorevia_vault"
```

### Erreur : psql non trouvé

Installer PostgreSQL client :
```bash
sudo apt-get install postgresql-client  # Debian/Ubuntu
sudo yum install postgresql            # CentOS/RHEL
```

### Erreur : Connexion à la base de données échouée

Vérifier :
- ✅ La variable `DATABASE_URL` est correcte
- ✅ La base de données est accessible
- ✅ Les credentials sont valides

### Aucun log trouvé

C'est normal si :
- Les logs sont dans un autre répertoire
- Les logs ont été archivés
- Le service n'utilise pas systemd

---

## 📞 Support

Si vous rencontrez des problèmes avec le script, vérifiez :
1. Les permissions d'exécution : `chmod +x scripts/diagnostic_fac_00020.sh`
2. Les variables d'environnement
3. Les logs d'erreur dans les fichiers de sortie

---

**Fin du Guide**
