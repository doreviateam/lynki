# Procédure SuiteCRM — Admin et backup/restore (Sprint 3 US-3.1)

**DoD SuiteCRM** : URL TLS, admin créé et login OK, DB persistante, backup scriptable et testé.

---

## 1. Prérequis

- SuiteCRM déployé via `dorevia.sh app up suitecrm <env> <tenant>` (image fournie dans le manifest ou .env).
- Accès à l’URL `https://suitecrm.<env>.<tenant>.doreviateam.com` (DNS ou /etc/hosts configuré).

---

## 2. Premier déploiement — admin

### 2.1 Image Bitnami (si utilisée)

- Au premier démarrage, Bitnami crée un admin avec les variables d’environnement (ex. `SUITECRM_USERNAME`, `SUITECRM_PASSWORD`).
- Se connecter avec ces identifiants ; changer le mot de passe admin après la première connexion.

### 2.2 Image avec install wizard

- Ouvrir l’URL SuiteCRM dans le navigateur.
- Suivre l’assistant d’installation (licence, vérifications, base de données, compte admin).
- **Base de données** : host `db`, base `suitecrm`, user/password selon le compose (ex. `suitecrm` / `suitecrm` ou valeurs du .env).
- Ne pas committer les identifiants ; les documenter dans un .env local ou un secret manager.

### 2.3 Identifiants par env

- Documenter dans `tenants/<tenant>/apps/suitecrm/<env>/.env` (ou équivalent) : `SUITECRM_ADMIN_USER`, `SUITECRM_ADMIN_PASSWORD` (ou équivalent selon image).
- Ne jamais committer le fichier `.env`.

---

## 3. Backup DB (MariaDB)

### 3.1 Dump depuis le conteneur DB

```bash
# Remplacer <env> et <tenant> par les valeurs (ex. lab, lab)
CONTAINER="suitecrm_db_<env>_<tenant>"
BACKUP_DIR="/tmp/backup-suitecrm"
mkdir -p "$BACKUP_DIR"
docker exec "$CONTAINER" mysqldump -u root -p"${MARIADB_ROOT_PASSWORD:-root}" \
  --single-transaction --routines --triggers \
  suitecrm > "$BACKUP_DIR/suitecrm_$(date +%Y%m%d_%H%M%S).sql"
```

- `MARIADB_ROOT_PASSWORD` : même valeur que dans le compose ou .env du tenant.

### 3.2 Backup volumes (uploads)

- Volume de données SuiteCRM : nom `suitecrm_<env>_<tenant>_data` (ou montage `/bitnami/suitecrm` selon image).
- Sauvegarde optionnelle : `docker run --rm -v suitecrm_<env>_<tenant>_data:/data -v /tmp/backup:/backup alpine tar czf /backup/suitecrm-data-$(date +%Y%m%d).tar.gz -C /data .`

---

## 4. Restore DB (lab)

### 4.1 Restaurer un dump

```bash
CONTAINER="suitecrm_db_<env>_<tenant>"
DUMP_FILE="/path/to/suitecrm_YYYYMMDD_HHMMSS.sql"
docker exec -i "$CONTAINER" mysql -u root -p"${MARIADB_ROOT_PASSWORD:-root}" suitecrm < "$DUMP_FILE"
```

- En cas de restauration « à blanc », recréer la base si nécessaire : `CREATE DATABASE IF NOT EXISTS suitecrm;` puis restore.

### 4.2 Après restore

- Redémarrer le conteneur app si besoin : `docker restart suitecrm_<env>_<tenant>`.
- Vérifier le login admin.

---

## 5. Checklist DoD SuiteCRM

- [ ] URL `suitecrm.<env>.<tenant>.doreviateam.com` accessible en TLS.
- [ ] Admin SuiteCRM créé et login OK.
- [ ] DB MariaDB persistante (conteneur `suitecrm_db_<env>_<tenant>`).
- [ ] Procédure backup (mysqldump) documentée et exécutée une fois en lab.
- [ ] Procédure restore testée en lab (optionnel mais recommandé).
