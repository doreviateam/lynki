# 📋 Analyse du Plan d'Implémentation Phase 6

**Version** : 1.0  
**Date** : 2025-12-28  
**Plan analysé** : PLAN Implémentation Phase 6 v1.0  
**Statut** : Analyse complète avec recommandations d'exécution

---

## 🎯 Résumé exécutif

Le plan d'implémentation est **excellent et actionnable**. Il suit logiquement l'analyse de la spécification et propose un découpage en commits clairs avec des critères d'acceptation mesurables.

**Verdict global** : ✅ **Approuvé, prêt à exécuter**

**Points forts** :
- ✅ Découpage en commits logiques (A → E)
- ✅ Critères d'acceptation clairs pour chaque commit
- ✅ Code snippets fournis (pratique)
- ✅ Ordre d'implémentation optimal
- ✅ Preuve de "DONE" bien définie

**Points d'attention** :
- ⚠️ Dépendance à `age` (à installer si absent)
- ⚠️ Validation des tags dans `platform up` (env implicite)
- ⚠️ Tests de restauration nécessitent environnement dédié

---

## 1. Analyse des commits proposés

### Commit A — Validation tags images (E02)

**Objectif** : Interdire `latest` en STINGER/PROD

**Code proposé** :
```bash
validate_image_tags() {
  local env="$1"
  local compose_file="$2"
  [[ "$env" == "stinger" || "$env" == "prod" ]] || return 0
  if grep -Eq '^\s*image:\s*[^#]+:latest\s*$' "$compose_file"; then
    error "Image ':latest' interdite en $env (E02)" "$E02"
  fi
}
```

**Analyse** :
- ✅ Regex correcte (évite les commentaires)
- ✅ Appel avant `platform up` et `app up` (bon timing)
- ⚠️ **Point d'attention** : `platform up` n'a pas d'env explicite

**Recommandation d'amélioration** :
```bash
validate_image_tags() {
  local env="$1"
  local compose_file="$2"
  
  # Validation env
  [[ "$env" == "stinger" || "$env" == "prod" ]] || return 0
  
  # Vérifier que le fichier existe
  [[ -f "$compose_file" ]] || {
    error "Fichier compose introuvable: $compose_file (E03)" "$E03"
  }
  
  # Détecter latest (évite commentaires et variables)
  if grep -Eq '^\s*image:\s*[^#${]+:latest\s*($|#)' "$compose_file"; then
    error "Image ':latest' interdite en $env (E02) — utilisez un tag (ex: v1.3.0, 18.0)" "$E02"
  fi
  
  # Vérifier aussi les variables d'environnement qui pourraient contenir latest
  if grep -Eq '^\s*image:\s*\$\{[^}]+\}' "$compose_file"; then
    echo "⚠️  Image via variable d'environnement détectée — vérifiez manuellement"
  fi
}
```

**Intégration dans `dorevia.sh`** :
```bash
# Dans cmd_app_up()
validate_image_tags "$env" "$compose_file"

# Dans cmd_platform_up()
# Problème : pas d'env explicite pour platform
# Solution : valider tous les services (DVIG, Vault) comme "prod" par défaut
# OU : détecter l'env depuis le contexte (tenant)
```

**Priorité** : 🔴 **Critique** — À implémenter en premier

---

### Commit B — Rotation logs Docker

**Objectif** : Configurer rotation automatique des logs

**Code proposé** :
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

**Analyse** :
- ✅ Configuration standard Docker
- ✅ Taille raisonnable (10m × 3 = 30m max par container)
- ⚠️ **Point d'attention** : À ajouter dans tous les templates

**Fichiers à modifier** :
1. `tenants/*/platform/docker-compose.yml.template`
2. `tenants/*/apps/odoo/*/docker-compose.yml.template`
3. `units/gateway/docker-compose.yml` (pas de template)

**Recommandation** :
- Appliquer aussi aux containers existants (migration)
- Documenter la configuration dans README

**Priorité** : 🟡 **Important** — Prévenir saturation disque

---

### Commit C — Permissions secrets

**Objectif** : Vérifier et corriger les permissions des secrets

**Code proposé** :
```bash
secrets_check() {
  local tenant="${1:-}"
  # ... code fourni
}
```

**Analyse** :
- ✅ Fonction claire
- ✅ Support multi-tenant
- ⚠️ **Amélioration** : Ajouter option `--fix` pour correction automatique

**Recommandation d'amélioration** :
```bash
cmd_secrets_check() {
  local tenant="$1"
  shift || true
  local fix=false
  
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --fix)
        fix=true
        ;;
      *)
        error "Flag inconnu: $1 (E01)" "$E01"
        ;;
    esac
    shift
  done
  
  secrets_check "$tenant" "$fix"
}

secrets_check() {
  local tenant="${1:-}"
  local fix="${2:-false}"
  local paths
  
  if [[ -n "$tenant" ]]; then
    paths=("tenants/$tenant/secrets")
  else
    paths=(tenants/*/secrets)
  fi
  
  local issues=0
  for p in "${paths[@]}"; do
    [[ -d "$p" ]] || continue
    while IFS= read -r f; do
      local mode
      mode="$(stat -c "%a" "$f" 2>/dev/null)" || continue
      if [[ "$mode" != "400" && "$mode" != "440" ]]; then
        echo "⚠️  Permissions incorrectes ($mode): $f"
        ((issues++))
        if [[ "$fix" == "true" ]]; then
          chmod 0400 "$f"
          echo "✅ Corrigé: $f → 0400"
        fi
      fi
    done < <(find "$p" -type f 2>/dev/null)
  done
  
  if [[ $issues -eq 0 ]]; then
    echo "✅ Tous les secrets ont les bonnes permissions"
    return 0
  else
    echo "⚠️  $issues fichier(s) avec permissions incorrectes"
    if [[ "$fix" != "true" ]]; then
      echo "💡 Utilisez --fix pour corriger automatiquement"
    fi
    return 1
  fi
}
```

**Priorité** : 🟡 **Bonne pratique** — Sécurité

---

### Commit D — Scripts backup/restore/health

**Objectif** : Implémenter les scripts opérationnels

#### D1 — backup.sh

**Contrat** :
- `--tenant <tenant>` (obligatoire)
- `--env <env>` (optionnel)
- `--out <dir>` (optionnel)
- `--include-secrets` (optionnel)
- `--encrypt` (optionnel)

**Analyse** :
- ✅ Contrat clair
- ⚠️ **Recommandations** :
  - Ajouter `--dry-run` (comme suggéré dans bonus)
  - Ajouter `--exclude-filestore` pour backups rapides
  - Gérer les erreurs (DB inaccessible, container down)

**Structure recommandée** :
```bash
#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_ROOT="${BACKUP_ROOT:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
TENANT=""
ENV=""
OUT_DIR=""
INCLUDE_SECRETS=false
ENCRYPT=false
DRY_RUN=false

# Parsing arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tenant)
      TENANT="$2"
      shift 2
      ;;
    --env)
      ENV="$2"
      shift 2
      ;;
    --out)
      OUT_DIR="$2"
      shift 2
      ;;
    --include-secrets)
      INCLUDE_SECRETS=true
      shift
      ;;
    --encrypt)
      ENCRYPT=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Usage: $0 --tenant <tenant> [--env <env>] [--out <dir>] [--include-secrets] [--encrypt] [--dry-run]"
      exit 1
      ;;
  esac
done

# Validation
[[ -z "$TENANT" ]] && { echo "❌ --tenant requis"; exit 1; }
[[ -d "tenants/$TENANT" ]] || { echo "❌ Tenant $TENANT introuvable"; exit 1; }

# Déterminer OUT_DIR
if [[ -z "$OUT_DIR" ]]; then
  OUT_DIR="$BACKUP_ROOT/$DATE"
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "🔍 DRY RUN - Aucune écriture"
  echo "Tenant: $TENANT"
  echo "Env: ${ENV:-all}"
  echo "Out: $OUT_DIR"
  exit 0
fi

# Créer structure
mkdir -p "$OUT_DIR/tenants/$TENANT/platform"
mkdir -p "$OUT_DIR/tenants/$TENANT/apps/odoo"

# Backup Odoo DB
backup_odoo_db() {
  local env="$1"
  local db_container="odoo_db_${env}_${TENANT}"
  
  if ! docker ps --format "{{.Names}}" | grep -q "^${db_container}$"; then
    echo "⚠️  Container $db_container non trouvé (skip)"
    return 0
  fi
  
  echo "📦 Backup DB Odoo $env..."
  docker exec "$db_container" pg_dump -U odoo -Fc odoo_${env}_${TENANT} > \
    "$OUT_DIR/tenants/$TENANT/apps/odoo/${env}/odoo_db.dump" || {
    echo "❌ Échec backup DB Odoo $env"
    return 1
  }
}

# Backup Vault DB
backup_vault_db() {
  local db_container="vault-db-${TENANT}"
  
  if ! docker ps --format "{{.Names}}" | grep -q "^${db_container}$"; then
    echo "⚠️  Container $db_container non trouvé (skip)"
    return 0
  fi
  
  echo "📦 Backup DB Vault..."
  docker exec "$db_container" pg_dump -U vault -Fc dorevia_vault > \
    "$OUT_DIR/tenants/$TENANT/platform/vault-db.dump" || {
    echo "❌ Échec backup DB Vault"
    return 1
  }
}

# Backup filestore
backup_filestore() {
  local env="$1"
  local volume="odoo_${env}_${TENANT}_data"
  
  echo "📦 Backup filestore Odoo $env..."
  docker run --rm \
    -v "$volume":/data:ro \
    -v "$(pwd)/$OUT_DIR/tenants/$TENANT/apps/odoo/$env":/backup \
    alpine tar czf /backup/filestore.tar.gz -C /data . || {
    echo "❌ Échec backup filestore"
    return 1
  }
}

# Backup secrets
backup_secrets() {
  if [[ "$INCLUDE_SECRETS" != "true" ]]; then
    return 0
  fi
  
  local tokens_file="tenants/$TENANT/secrets/dvig.tokens.yml"
  if [[ ! -f "$tokens_file" ]]; then
    echo "⚠️  Fichier tokens introuvable: $tokens_file"
    return 0
  fi
  
  if [[ "$ENCRYPT" == "true" ]]; then
    if ! command -v age &> /dev/null; then
      echo "❌ age non installé (requis pour --encrypt)"
      return 1
    fi
    if [[ -z "${AGE_PUBLIC_KEY:-}" ]]; then
      echo "❌ AGE_PUBLIC_KEY non défini"
      return 1
    fi
    echo "🔐 Chiffrement secrets..."
    age -r "$AGE_PUBLIC_KEY" -o \
      "$OUT_DIR/tenants/$TENANT/platform/dvig.tokens.yml.enc" \
      "$tokens_file" || {
      echo "❌ Échec chiffrement"
      return 1
    }
  else
    echo "⚠️  Secrets copiés en clair (utilisez --encrypt pour production)"
    cp "$tokens_file" "$OUT_DIR/tenants/$TENANT/platform/dvig.tokens.yml"
  fi
}

# Backup gateway
backup_gateway() {
  echo "📦 Backup Gateway..."
  cp "units/gateway/Caddyfile" "$OUT_DIR/gateway/Caddyfile" || {
    echo "❌ Échec backup Caddyfile"
    return 1
  }
}

# Générer manifest
generate_manifest() {
  echo "📝 Génération manifest..."
  local manifest="$OUT_DIR/manifest.json"
  cat > "$manifest" <<EOF
{
  "backup_date": "$DATE",
  "tenant": "$TENANT",
  "env": "${ENV:-all}",
  "includes_secrets": $INCLUDE_SECRETS,
  "encrypted": $ENCRYPT,
  "checksums": {}
}
EOF
  
  # Calculer checksums
  find "$OUT_DIR" -type f -not -name "manifest.json" | while read -r f; do
    local checksum
    checksum=$(sha256sum "$f" | awk '{print $1}')
    local rel_path="${f#$OUT_DIR/}"
    # Ajouter au JSON (nécessite jq ou manipulation manuelle)
    echo "  $rel_path: $checksum"
  done
}

# Main
main() {
  echo "🚀 Démarrage backup tenant: $TENANT"
  
  # Backup gateway
  backup_gateway
  
  # Backup platform
  backup_vault_db
  backup_secrets
  
  # Backup apps
  if [[ -n "$ENV" ]]; then
    backup_odoo_db "$ENV"
    backup_filestore "$ENV"
  else
    for env in lab stinger prod; do
      backup_odoo_db "$env" || true
      backup_filestore "$env" || true
    done
  fi
  
  # Manifest
  generate_manifest
  
  echo "✅ Backup terminé: $OUT_DIR"
}

main
```

**Priorité** : 🔴 **Critique** — Core functionality

---

#### D2 — restore.sh

**Contrat** :
- `--tenant <tenant>`
- `--env <env>`
- `--from <backup-dir>`
- `--target-tenant` (optionnel)
- `--target-env` (optionnel)
- `--purge` (obligatoire)

**Analyse** :
- ✅ Sécurité avec `--purge` obligatoire
- ⚠️ **Recommandations** :
  - Ajouter `--validate-backup` (comme suggéré)
  - Vérifier l'intégrité avant restauration
  - Confirmation interactive si `--purge` (sécurité supplémentaire)

**Structure recommandée** :
```bash
#!/bin/bash
set -euo pipefail

TENANT=""
ENV=""
FROM_DIR=""
TARGET_TENANT=""
TARGET_ENV=""
PURGE=false
VALIDATE_BACKUP=false

# Parsing
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tenant)
      TENANT="$2"
      shift 2
      ;;
    --env)
      ENV="$2"
      shift 2
      ;;
    --from)
      FROM_DIR="$2"
      shift 2
      ;;
    --target-tenant)
      TARGET_TENANT="$2"
      shift 2
      ;;
    --target-env)
      TARGET_ENV="$2"
      shift 2
      ;;
    --purge)
      PURGE=true
      shift
      ;;
    --validate-backup)
      VALIDATE_BACKUP=true
      shift
      ;;
    *)
      echo "Usage: $0 --tenant <tenant> --env <env> --from <backup-dir> [--target-tenant <tenant>] [--target-env <env>] --purge [--validate-backup]"
      exit 1
      ;;
  esac
done

# Validation
[[ "$PURGE" == "true" ]] || {
  echo "❌ --purge obligatoire pour sécurité"
  exit 1
}
[[ -d "$FROM_DIR" ]] || {
  echo "❌ Backup introuvable: $FROM_DIR"
  exit 1
}

TARGET_TENANT="${TARGET_TENANT:-$TENANT}"
TARGET_ENV="${TARGET_ENV:-$ENV}"

# Validation backup
if [[ "$VALIDATE_BACKUP" == "true" ]]; then
  validate_backup "$FROM_DIR"
fi

# Confirmation interactive
echo "⚠️  ATTENTION: Cette opération va PURGER les données existantes"
echo "Tenant source: $TENANT"
echo "Tenant cible: $TARGET_TENANT"
echo "Env: $TARGET_ENV"
read -p "Continuer? (yes/no): " confirm
[[ "$confirm" == "yes" ]] || {
  echo "❌ Annulé"
  exit 1
}

# Purge
purge_target() {
  echo "🗑️  Purge données cible..."
  # Stop containers
  cd "tenants/$TARGET_TENANT/apps/odoo/$TARGET_ENV" || exit 1
  docker compose down || true
  
  # Remove volumes
  docker volume rm "odoo_${TARGET_ENV}_${TARGET_TENANT}_db" || true
  docker volume rm "odoo_${TARGET_ENV}_${TARGET_TENANT}_data" || true
}

# Restore DB
restore_db() {
  echo "📥 Restauration DB..."
  local db_container="odoo_db_${TARGET_ENV}_${TARGET_TENANT}"
  local dump_file="$FROM_DIR/tenants/$TENANT/apps/odoo/$ENV/odoo_db.dump"
  
  # Recréer container si nécessaire
  cd "tenants/$TARGET_TENANT/apps/odoo/$TARGET_ENV"
  docker compose up -d db
  
  # Attendre DB ready
  sleep 5
  
  # Restore
  docker exec -i "$db_container" pg_restore -U odoo -d odoo_${TARGET_ENV}_${TARGET_TENANT} < "$dump_file"
}

# Restore filestore
restore_filestore() {
  echo "📥 Restauration filestore..."
  local volume="odoo_${TARGET_ENV}_${TARGET_TENANT}_data"
  local archive="$FROM_DIR/tenants/$TENANT/apps/odoo/$ENV/filestore.tar.gz"
  
  docker run --rm \
    -v "$volume":/data \
    -v "$(pwd)/$archive":/backup/filestore.tar.gz:ro \
    alpine sh -c "cd /data && tar xzf /backup/filestore.tar.gz"
}

# Restore secrets
restore_secrets() {
  local encrypted_file="$FROM_DIR/tenants/$TENANT/platform/dvig.tokens.yml.enc"
  local plain_file="$FROM_DIR/tenants/$TENANT/platform/dvig.tokens.yml"
  
  if [[ -f "$encrypted_file" ]]; then
    if [[ -z "${AGE_PRIVATE_KEY_FILE:-}" ]]; then
      echo "❌ AGE_PRIVATE_KEY_FILE non défini"
      return 1
    fi
    echo "🔓 Déchiffrement secrets..."
    age -d -i "$AGE_PRIVATE_KEY_FILE" "$encrypted_file" > \
      "tenants/$TARGET_TENANT/secrets/dvig.tokens.yml"
  elif [[ -f "$plain_file" ]]; then
    echo "⚠️  Secrets en clair détectés"
    cp "$plain_file" "tenants/$TARGET_TENANT/secrets/dvig.tokens.yml"
  fi
}

# Healthcheck après restore
healthcheck_after_restore() {
  echo "🏥 Healthcheck post-restore..."
  cd "$ROOT_DIR"
  ./infra/ops/health/healthcheck.sh --tenant "$TARGET_TENANT" --env "$TARGET_ENV" || {
    echo "⚠️  Healthcheck échoué — vérifiez manuellement"
  }
}

# Main
main() {
  purge_target
  restore_db
  restore_filestore
  restore_secrets
  
  # Redémarrer
  cd "tenants/$TARGET_TENANT/apps/odoo/$TARGET_ENV"
  docker compose up -d
  
  sleep 10
  healthcheck_after_restore
  
  echo "✅ Restauration terminée"
}

main
```

**Priorité** : 🔴 **Critique** — Core functionality

---

#### D3 — healthcheck.sh

**Contrat** : Vérifier gateway, platform, apps

**Analyse** :
- ✅ Checks essentiels couverts
- ⚠️ **Recommandations** :
  - Ajouter paramètres `--tenant` et `--env`
  - Retourner codes d'erreur appropriés
  - Format JSON optionnel pour intégration monitoring

**Structure recommandée** :
```bash
#!/bin/bash
set -euo pipefail

TENANT=""
ENV=""
JSON_OUTPUT=false

# Parsing
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tenant)
      TENANT="$2"
      shift 2
      ;;
    --env)
      ENV="$2"
      shift 2
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *)
      echo "Usage: $0 [--tenant <tenant>] [--env <env>] [--json]"
      exit 1
      ;;
  esac
done

check_gateway() {
  if ! docker ps --filter "name=gateway-caddy" --format "{{.Status}}" | grep -q "Up"; then
    return 1
  fi
  # Test HTTPS (optionnel, nécessite DNS)
  return 0
}

check_platform() {
  local tenant="$1"
  local dvig_ok=false
  local vault_ok=false
  
  # DVIG
  if docker ps --filter "name=dvig-${tenant}" --format "{{.Status}}" | grep -q "Up"; then
    if docker exec "dvig-${tenant}" wget -qO- http://127.0.0.1:8080/health > /dev/null 2>&1; then
      dvig_ok=true
    fi
  fi
  
  # Vault
  if docker ps --filter "name=vault-${tenant}" --format "{{.Status}}" | grep -q "Up"; then
    if docker exec "vault-${tenant}" wget -qO- http://127.0.0.1:8080/health > /dev/null 2>&1; then
      vault_ok=true
    fi
  fi
  
  [[ "$dvig_ok" == "true" && "$vault_ok" == "true" ]]
}

check_app() {
  local env="$1"
  local tenant="$2"
  local container="odoo_${env}_${tenant}"
  
  if ! docker ps --filter "name=${container}" --format "{{.Status}}" | grep -q "Up"; then
    return 1
  fi
  
  # Test via réseau Docker (plus fiable que HTTPS externe)
  docker exec "$container" wget -qO- http://127.0.0.1:8069/web/login > /dev/null 2>&1
}

# Main
main() {
  local all_ok=true
  
  if [[ -z "$TENANT" ]]; then
    # Check global (gateway uniquement)
    check_gateway || all_ok=false
  else
    # Check tenant spécifique
    check_platform "$TENANT" || all_ok=false
    
    if [[ -n "$ENV" ]]; then
      check_app "$ENV" "$TENANT" || all_ok=false
    else
      # Check tous les envs
      for env in lab stinger prod; do
        check_app "$env" "$TENANT" || all_ok=false
      done
    fi
  fi
  
  if [[ "$all_ok" == "true" ]]; then
    echo "✅ Tous les checks passent"
    exit 0
  else
    echo "❌ Certains checks échouent"
    exit 1
  fi
}

main
```

**Priorité** : 🟡 **Important** — Monitoring

---

### Commit E — Chiffrement secrets (AGE)

**Objectif** : Chiffrer les secrets dans les backups

**Analyse** :
- ✅ `age` est simple et moderne
- ⚠️ **Dépendance** : À installer si absent
- ⚠️ **Gestion des clés** : À documenter

**Recommandations** :
1. **Installation** :
   ```bash
   # Ubuntu/Debian
   apt-get install age
   
   # Ou depuis source
   wget https://github.com/FiloSottile/age/releases/latest/download/age-v1.1.1-linux-amd64.tar.gz
   tar xzf age-v1.1.1-linux-amd64.tar.gz
   sudo mv age /usr/local/bin/
   ```

2. **Génération des clés** :
   ```bash
   # Générer paire de clés
   age-keygen -o age-key.txt
   # Extraire clé publique
   age-keygen -y age-key.txt > age-key.pub
   ```

3. **Configuration** :
   ```bash
   # infra/ops/backup/config.example.env
   AGE_PUBLIC_KEY="age1xxxxxxxxxxxxx"
   AGE_PRIVATE_KEY_FILE="/path/to/age-key.txt"
   ```

**Priorité** : 🟡 **Important** — Sécurité

---

## 2. Analyse de l'ordre d'implémentation

### Ordre proposé : A → B → C → D → E

**Analyse** :
- ✅ **A (Validation tags)** : Fondamental, bloque les erreurs
- ✅ **B (Rotation logs)** : Préventif, non bloquant
- ✅ **C (Permissions)** : Sécurité, non bloquant
- ✅ **D (Scripts)** : Core functionality, dépend de A
- ✅ **E (Chiffrement)** : Amélioration, dépend de D

**Recommandation** : L'ordre est optimal

**Alternative possible** (si urgence backup) :
- D1 (backup.sh) → A → D2 (restore.sh) → D3 (healthcheck) → B → C → E

---

## 3. Analyse des critères d'acceptation

### Commit A
✅ **AC** : `dorevia.sh app up odoo prod core` échoue si `latest`

**Test recommandé** :
```bash
# Test 1: Latest en prod (doit échouer)
sed -i 's/odoo:18.0-20250819/odoo:latest/' tenants/core/apps/odoo/prod/docker-compose.yml
dorevia.sh app up odoo prod core  # Doit retourner E02
sed -i 's/odoo:latest/odoo:18.0-20250819/' tenants/core/apps/odoo/prod/docker-compose.yml

# Test 2: Tag valide (doit passer)
dorevia.sh app up odoo prod core  # Doit passer
```

### Commit D
✅ **AC** : Backup créé + Restore validé + Healthcheck OK

**Tests recommandés** :
```bash
# Test backup
./infra/ops/backup/backup.sh --tenant core --env lab --include-secrets --encrypt
ls -la backups/*/manifest.json  # Doit exister

# Test restore (sur tenant test)
./infra/ops/backup/restore.sh --tenant core --env lab --from backups/YYYYMMDD_HHMMSS --purge
./infra/ops/health/healthcheck.sh --tenant core --env lab  # Doit passer
```

---

## 4. Points d'attention et risques

### 4.1 Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| `age` non installé | Moyenne | 🟡 Élevé | Vérifier dans script + doc installation |
| Backup corrompu | Faible | 🔴 Critique | Validation checksums + tests |
| Restore échoue | Moyenne | 🔴 Critique | Tests réguliers + rollback possible |
| Validation tags rate des variables | Faible | 🟡 Élevé | Améliorer regex (voir Commit A) |

### 4.2 Dépendances

| Dépendance | État | Action |
|------------|------|--------|
| `age` | ⚠️ À vérifier | Installer si absent |
| `jq` (pour manifest.json) | ⚠️ Optionnel | Utiliser alternative si absent |
| `sha256sum` | ✅ Standard | Aucune action |

---

## 5. Améliorations suggérées (bonus)

### 5.1 `--dry-run` dans backup.sh
✅ **Recommandé** : Permet de valider la discovery sans écrire

**Implémentation** : Déjà suggérée dans le plan (bonus)

### 5.2 `--validate-backup` dans restore.sh
✅ **Recommandé** : Vérifie checksums avant restauration

**Implémentation** :
```bash
validate_backup() {
  local backup_dir="$1"
  local manifest="$backup_dir/manifest.json"
  
  [[ -f "$manifest" ]] || {
    echo "❌ Manifest introuvable"
    return 1
  }
  
  # Vérifier checksums (nécessite jq ou parsing manuel)
  # ...
}
```

### 5.3 Runbooks supplémentaires
✅ **Recommandé** : `INCIDENT_SSL.md`, `INCIDENT_DATABASE.md`, `INCIDENT_NETWORK.md`

**Priorité** : 🟢 Basse (amélioration continue)

---

## 6. Plan d'exécution recommandé

### Semaine 1 : Fondations

**Jour 1-2** : Commit A (Validation tags)
- Implémenter `validate_image_tags()`
- Intégrer dans `dorevia.sh`
- Tests unitaires

**Jour 3** : Commit B (Rotation logs)
- Modifier tous les templates
- Tester sur un tenant

**Jour 4** : Commit C (Permissions secrets)
- Implémenter `secrets_check()`
- Tests

**Jour 5** : Validation et documentation

### Semaine 2 : Core functionality

**Jour 1-3** : Commit D1 (backup.sh)
- Implémenter script complet
- Tests sur tenant LAB

**Jour 4-5** : Commit D2 (restore.sh)
- Implémenter script complet
- Tests de restauration

**Jour 6** : Commit D3 (healthcheck.sh)
- Implémenter script
- Tests

### Semaine 3 : Améliorations

**Jour 1-2** : Commit E (Chiffrement)
- Installer `age`
- Implémenter chiffrement
- Tests

**Jour 3-4** : Bonus (dry-run, validate-backup)
- Implémenter améliorations
- Tests

**Jour 5** : Documentation complète + validation finale

---

## 7. Checklist de validation finale

### Preuve "Phase 6 DONE"

- [ ] Validation tags fonctionne (test avec `latest` en prod)
- [ ] Rotation logs configurée (vérifier `docker inspect`)
- [ ] Permissions secrets vérifiées (`dorevia.sh secrets check`)
- [ ] Backup créé avec manifest.json
- [ ] Restore validé (healthcheck OK après restore)
- [ ] Chiffrement fonctionne (secrets en `.enc`)
- [ ] Documentation complète (README.md)

---

## 8. Conclusion

### 8.1 Verdict

✅ **Le plan est excellent et prêt à être exécuté.**

**Points forts** :
- Découpage clair en commits
- Code snippets fournis
- Critères d'acceptation mesurables
- Ordre d'implémentation optimal

**Points à améliorer** :
- Validation tags : améliorer regex (variables env)
- Backup/Restore : gérer erreurs gracieusement
- Chiffrement : documenter installation `age`

### 8.2 Recommandation finale

**Approuver le plan avec les améliorations suivantes** :

1. **Immédiat** : Améliorer `validate_image_tags()` (gérer variables env)
2. **Court terme** : Ajouter gestion d'erreurs dans backup/restore
3. **Court terme** : Documenter installation `age`
4. **Moyen terme** : Implémenter bonus (dry-run, validate-backup)

### 8.3 Prochaines étapes

1. ✅ Valider cette analyse
2. ✅ Créer issues GitHub pour chaque commit
3. ✅ Commencer Commit A (Validation tags)
4. ✅ Tests réguliers à chaque commit

---

**Document généré le** : 2025-12-28  
**Auteur** : Analyse automatique  
**Version** : 1.0

