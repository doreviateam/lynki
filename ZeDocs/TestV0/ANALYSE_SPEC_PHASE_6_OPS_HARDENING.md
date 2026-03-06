# 📊 Analyse de la Spécification Phase 6 "Ops Hardening"

**Version** : 1.0  
**Date** : 2025-12-28  
**Spécification analysée** : SPEC Phase 6 Ops Hardening v1.0  
**Statut** : Analyse complète avec recommandations

---

## 🎯 Résumé exécutif

La spécification Phase 6 est **bien structurée et alignée** avec l'architecture actuelle de la plateforme. Elle couvre les aspects essentiels pour passer en production : sauvegardes, restauration, monitoring minimal, sécurité opérationnelle et runbooks.

**Verdict global** : ✅ **Approuvé avec recommandations mineures**

**Points forts** :
- ✅ Couverture complète des besoins opérationnels
- ✅ Alignement avec l'architecture multi-tenant existante
- ✅ Invariants clairs et non négociables
- ✅ Critères d'acceptation mesurables

**Points d'attention** :
- ⚠️ Validation des tags d'images à implémenter dans `dorevia.sh`
- ⚠️ Chiffrement des secrets dans les backups (recommandation à préciser)
- ⚠️ Rotation des logs (configuration à documenter)

---

## 1. Analyse de cohérence avec l'architecture actuelle

### 1.1 ✅ Architecture référencée

La spécification référence correctement :
- ✅ Gateway globale : `units/gateway` (Caddy)
- ✅ Réseau Docker : `dorevia-network`
- ✅ Platform par tenant : `dvig-<tenant>`, `vault-<tenant>`
- ✅ Apps par tenant + env : `odoo_<env>_<tenant>`
- ✅ Tokens : `tenants/<tenant>/secrets/dvig.tokens.yml`

**Verdict** : Parfaitement aligné avec l'implémentation actuelle.

### 1.2 ✅ Structure des répertoires

La proposition de structure `infra/ops/` est cohérente :
```
infra/
  ops/
    backup/
    health/
    runbooks/
```

**Recommandation** : Créer cette structure à la racine du projet, au même niveau que `units/`, `tenants/`, `sources/`.

---

## 2. Analyse des invariants Ops

### 2.1 Images taggées (STINGER/PROD)

**Spécification** : Interdire `latest` en STINGER/PROD, erreur `E02` si violation.

**État actuel** :
- ✅ **Odoo** : Tous les docker-compose utilisent `odoo:18.0-20250819` (taggé)
- ✅ **DVIG** : `dorevia/dvig:0.1.2-auth` (taggé)
- ✅ **Vault** : `dorevia/vault:v1.3.0` (taggé)
- ✅ **PostgreSQL** : `postgres:16` (taggé)

**Gap identifié** :
- ❌ **Aucune validation automatique** dans `dorevia.sh`
- ⚠️ Risque : Un développeur pourrait modifier un docker-compose pour utiliser `latest`

**Recommandation** :
```bash
# À ajouter dans dorevia.sh avant app up / platform up
validate_image_tags() {
  local env="$1"
  local compose_file="$2"
  
  if [[ "$env" == "stinger" || "$env" == "prod" ]]; then
    if grep -q "image:.*:latest" "$compose_file"; then
      error "Image 'latest' interdite en $env (E02)" "$E02"
    fi
  fi
}
```

**Priorité** : 🔴 **Haute** (sécurité opérationnelle)

---

### 2.2 Secrets

**Spécification** :
- Aucun secret en repo (déjà `.gitignore`)
- Permissions minimales : `0400` ou `0440`

**État actuel** :
- ✅ `.gitignore` ignore `tenants/*/secrets/`
- ⚠️ Permissions non vérifiées systématiquement

**Recommandation** :
```bash
# Script de vérification des permissions
check_secrets_permissions() {
  find tenants/*/secrets -type f -exec stat -c "%a %n" {} \; | \
    awk '$1 !~ /^[04]/ {print "⚠️  Permissions incorrectes: " $2}'
}
```

**Priorité** : 🟡 **Moyenne** (bonne pratique)

---

### 2.3 Restauration testée

**Spécification** : Une sauvegarde n'existe que si une restauration a été validée.

**État actuel** : ❌ Aucun mécanisme de validation

**Recommandation** :
- Ajouter un champ `validated: true/false` dans `manifest.json`
- Script de validation : `backup.sh --validate <backup-dir>`

**Priorité** : 🟡 **Moyenne** (qualité)

---

## 3. Analyse des livrables

### 3.1 Scripts de backup/restore

**Spécification** : `backup.sh` et `restore.sh` avec contrats clairs.

**Analyse** :
- ✅ Contrats bien définis (paramètres, comportement)
- ✅ Format de sauvegarde structuré
- ⚠️ Chiffrement mentionné mais pas détaillé

**Recommandations techniques** :

#### 3.1.1 Format de sauvegarde

**Spécification propose** :
```
backups/
  <YYYYMMDD>/
    gateway/
    tenants/
      <tenant>/
        platform/
        apps/
```

**Amélioration suggérée** :
```
backups/
  <YYYYMMDD>_<HHMMSS>/
    manifest.json          # Métadonnées globales
    gateway/
      Caddyfile
    tenants/
      <tenant>/
        platform/
          vault-db.dump
          dvig.tokens.yml.enc
        apps/
          odoo/
            <env>/
              odoo_db.dump
              filestore.tar.gz
              odoo.conf
```

#### 3.1.2 Chiffrement

**Spécification** : Recommande `age` ou `gpg` pour secrets.

**Recommandation détaillée** :
```bash
# Utiliser age (plus simple que GPG)
# Installation : apt-get install age

encrypt_secret() {
  local file="$1"
  local public_key="$2"
  age -r "$public_key" -o "${file}.enc" "$file"
}

decrypt_secret() {
  local file="$1"
  local private_key="$2"
  age -d -i "$private_key" "$file" > "${file%.enc}"
}
```

**Priorité** : 🟡 **Moyenne** (sécurité)

---

### 3.2 Healthcheck script

**Spécification** : `healthcheck.sh` pour sanity checks.

**Recommandation d'implémentation** :
```bash
#!/bin/bash
# healthcheck.sh --tenant <tenant> [--env <env>]

check_gateway() {
  docker ps --filter "name=gateway-caddy" --format "{{.Status}}" | grep -q "Up" || return 1
  curl -sf https://odoo.lab.core.doreviateam.com > /dev/null || return 1
}

check_platform() {
  local tenant="$1"
  docker ps --filter "name=dvig-${tenant}" --format "{{.Status}}" | grep -q "Up" || return 1
  curl -sf http://localhost:8080/health > /dev/null || return 1  # Via port mapping ou réseau Docker
}

check_app() {
  local env="$1"
  local tenant="$2"
  docker ps --filter "name=odoo_${env}_${tenant}" --format "{{.Status}}" | grep -q "Up" || return 1
  curl -sf https://odoo.${env}.${tenant}.doreviateam.com/web/login > /dev/null || return 1
}
```

**Priorité** : 🟢 **Basse** (monitoring minimal)

---

## 4. Analyse des procédures backup/restore

### 4.1 Contrat `backup.sh`

**Spécification** :
- `--tenant <tenant>` (obligatoire)
- `--env <lab|stinger|prod>` (optionnel)
- `--out <dir>` (optionnel)
- `--include-secrets` (optionnel)
- `--encrypt` (optionnel)

**Analyse** : ✅ Contrat clair et complet

**Recommandation d'amélioration** :
- Ajouter `--dry-run` pour tester sans exécuter
- Ajouter `--exclude-filestore` pour backups rapides (DB uniquement)

---

### 4.2 Contrat `restore.sh`

**Spécification** :
- `--tenant <tenant>`
- `--env <env>`
- `--from <backup-dir>`
- `--target-tenant` (optionnel)
- `--target-env` (optionnel)
- `--purge` (obligatoire)

**Analyse** : ✅ Contrat clair, sécurité avec `--purge`

**Recommandation** :
- Ajouter `--validate-backup` pour vérifier l'intégrité avant restauration
- Ajouter `--skip-healthcheck` pour restauration rapide (debug)

---

## 5. Analyse du monitoring minimal

### 5.1 Santé système

**Spécification** : `docker ps`, `df -h`, `uptime`, taille backups.

**Recommandation** :
```bash
# healthcheck.sh --system
check_system() {
  # Espace disque (alerte si < 20%)
  local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  if [[ $disk_usage -gt 80 ]]; then
    echo "⚠️  Espace disque critique: ${disk_usage}%"
    return 1
  fi
  
  # Charge système
  local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
  # Alerte si load > nombre de CPUs
  # ...
}
```

**Priorité** : 🟢 **Basse**

---

### 5.2 Santé service

**Spécification** : Endpoints `/health` pour DVIG/Vault, `/web/login` pour Odoo.

**État actuel** :
- ✅ DVIG : `/health` disponible
- ✅ Vault : `/health` disponible
- ✅ Odoo : `/web/login` accessible
- ✅ Healthchecks Docker configurés

**Verdict** : ✅ Déjà en place, juste besoin de script wrapper

---

### 5.3 Logs

**Spécification** : Rotation + niveaux appropriés.

**État actuel** :
- ✅ DVIG : logs JSON structurés
- ⚠️ Rotation non configurée explicitement
- ⚠️ Niveaux de log non documentés

**Recommandation** :
```yaml
# docker-compose.yml - Ajouter logging
services:
  dvig:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Priorité** : 🟡 **Moyenne**

---

## 6. Analyse de la sécurité opérationnelle

### 6.1 Rotation tokens

**Spécification** : `dorevia.sh token rotate` comme procédure standard.

**État actuel** :
- ✅ Commande `token rotate` implémentée dans `dorevia.sh`
- ✅ Flag `--revoke-old` disponible

**Verdict** : ✅ Déjà implémenté

---

### 6.2 Accès administration

**Spécification** : SSH clé, user non-root, restrictions secrets.

**Recommandation** :
- Documenter dans runbook
- Script de vérification : `check_access.sh`

**Priorité** : 🟡 **Moyenne** (documentation)

---

### 6.3 Least privilege Docker

**Spécification** : Pas d'exposition de ports internes.

**État actuel** :
- ✅ Aucun port exposé pour Odoo/DVIG/Vault (routage via Caddy uniquement)
- ✅ Seuls ports publics : 80/443 (gateway)

**Verdict** : ✅ Déjà conforme

---

## 7. Analyse des runbooks incidents

### 7.1 Runbooks proposés

**Spécification** : 4 runbooks (Gateway, DVIG, Vault, Odoo)

**Analyse** : ✅ Structure claire et actionnable

**Recommandation d'amélioration** :

#### 7.1.1 Format standardisé

Chaque runbook devrait suivre :
```markdown
# INCIDENT_<SERVICE>.md

## Symptômes
- Description des symptômes observés

## Diagnostic rapide
1. Commande 1
2. Commande 2

## Solutions par ordre de probabilité
### Solution 1 (80% des cas)
- Étapes
- Validation

### Solution 2 (15% des cas)
- Étapes

### Solution 3 (5% des cas - escalade)
- Quand contacter
- Informations à fournir
```

#### 7.1.2 Runbooks supplémentaires recommandés

- `INCIDENT_DATABASE.md` : Problèmes PostgreSQL
- `INCIDENT_NETWORK.md` : Problèmes réseau Docker
- `INCIDENT_SSL.md` : Problèmes certificats Let's Encrypt

**Priorité** : 🟡 **Moyenne**

---

## 8. Analyse des critères d'acceptation

### 8.1 Critères proposés

1. ✅ Backup complet généré
2. ✅ Restauration validée
3. ✅ Healthcheck OK
4. ✅ Pas de `latest` en stinger/prod
5. ✅ Secrets protégés

**Analyse** : ✅ Critères mesurables et réalistes

**Recommandation** : Ajouter un critère de performance :
- Backup complet < 30 minutes (pour tenant avec données réelles)
- Restauration complète < 1 heure

---

## 9. Gaps identifiés et recommandations

### 9.1 Gaps critiques (à implémenter)

| Gap | Impact | Priorité | Solution |
|-----|--------|----------|----------|
| Validation tags images dans `dorevia.sh` | 🔴 Haute | Critique | Fonction `validate_image_tags()` |
| Scripts backup/restore | 🔴 Haute | Critique | Implémenter `backup.sh` et `restore.sh` |
| Healthcheck script | 🟡 Moyenne | Important | Implémenter `healthcheck.sh` |
| Rotation logs Docker | 🟡 Moyenne | Important | Configurer dans docker-compose |
| Permissions secrets | 🟡 Moyenne | Bonne pratique | Script de vérification |

### 9.2 Améliorations recommandées (non bloquantes)

| Amélioration | Impact | Priorité | Effort |
|--------------|--------|----------|--------|
| Chiffrement backups secrets | 🟡 Moyenne | Sécurité | Faible (age) |
| Validation backups (checksums) | 🟢 Basse | Qualité | Faible |
| Runbooks supplémentaires | 🟡 Moyenne | Opérationnel | Moyen |
| Monitoring alertes (disque, load) | 🟡 Moyenne | Préventif | Moyen |

---

## 10. Plan d'implémentation recommandé

### Phase 1 : Fondations (Semaine 1)

1. ✅ Créer structure `infra/ops/`
2. ✅ Implémenter validation tags images dans `dorevia.sh`
3. ✅ Script de vérification permissions secrets
4. ✅ Configuration rotation logs Docker

**Livrables** :
- `infra/ops/backup/backup.sh` (squelette)
- `infra/ops/backup/restore.sh` (squelette)
- Validation tags fonctionnelle

### Phase 2 : Backup/Restore (Semaine 2)

1. ✅ Implémenter `backup.sh` complet
2. ✅ Implémenter `restore.sh` complet
3. ✅ Tests sur tenant LAB
4. ✅ Validation restauration

**Livrables** :
- Scripts backup/restore opérationnels
- Documentation README.md

### Phase 3 : Monitoring & Runbooks (Semaine 3)

1. ✅ Implémenter `healthcheck.sh`
2. ✅ Créer 4 runbooks incidents
3. ✅ Tests end-to-end
4. ✅ Documentation complète

**Livrables** :
- Scripts monitoring
- Runbooks incidents
- Documentation complète

---

## 11. Risques identifiés

### 11.1 Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Backup corrompu | Faible | 🔴 Critique | Validation checksums + tests restauration |
| Restauration échoue | Moyenne | 🔴 Critique | Tests réguliers + runbook détaillé |
| Secrets compromis | Faible | 🔴 Critique | Chiffrement + rotation régulière |
| Espace disque saturé | Moyenne | 🟡 Élevé | Monitoring + alertes |

### 11.2 Risques opérationnels

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Runbooks non suivis | Moyenne | 🟡 Élevé | Formation + documentation claire |
| Backups non testés | Moyenne | 🔴 Critique | Automatisation tests restauration |
| Tags images non validés | Faible | 🟡 Élevé | Validation automatique dans `dorevia.sh` |

---

## 12. Conclusion

### 12.1 Verdict global

✅ **La spécification Phase 6 est solide et prête à être implémentée.**

**Points forts** :
- Architecture bien comprise
- Contrats clairs
- Critères d'acceptation mesurables
- Alignement avec l'existant

**Points à améliorer** :
- Détails techniques du chiffrement
- Validation automatique des tags
- Runbooks format standardisé

### 12.2 Recommandation finale

**Approuver la spécification avec les améliorations suivantes** :

1. **Immédiat** : Ajouter validation tags images dans `dorevia.sh`
2. **Court terme** : Préciser format chiffrement (age recommandé)
3. **Court terme** : Standardiser format runbooks
4. **Moyen terme** : Ajouter runbooks supplémentaires (DB, Network, SSL)

### 12.3 Prochaines étapes

1. ✅ Valider cette analyse avec l'équipe
2. ✅ Créer issues GitHub pour chaque phase
3. ✅ Commencer Phase 1 (Fondations)
4. ✅ Tests réguliers sur tenant LAB

---

**Document généré le** : 2025-12-28  
**Auteur** : Analyse automatique  
**Version** : 1.0

