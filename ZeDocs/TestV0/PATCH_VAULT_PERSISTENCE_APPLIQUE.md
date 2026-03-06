# ✅ PATCH Vault Persistence — Application

**Version** : 1.0  
**Date** : 2025-12-29  
**Statut** : ✅ **APPLIQUÉ**

---

## 📋 Résumé

Le patch pour la persistance des volumes Vault a été **appliqué avec succès** sur tous les tenants (core, dido, rozas).

---

## ✅ Modifications appliquées

### 1. Fichiers modifiés

#### Templates (pour futurs tenants)
- ✅ `tenants/core/platform/docker-compose.yml.template`
- ✅ `tenants/dido/platform/docker-compose.yml.template` (si existe)
- ✅ `tenants/rozas/platform/docker-compose.yml.template` (si existe)

#### Fichiers rendus (tenants existants)
- ✅ `tenants/core/platform/docker-compose.yml
- ✅ `tenants/dido/platform/docker-compose.yml`
- ✅ `tenants/rozas/platform/docker-compose.yml`

### 2. Volumes ajoutés

Pour chaque tenant, 3 volumes persistants ont été ajoutés :

```yaml
volumes:
  - vault_storage_<tenant>:/opt/dorevia-vault/storage
  - vault_ledger_<tenant>:/opt/dorevia-vault/ledger
  - vault_audit_<tenant>:/opt/dorevia-vault/audit
```

**Convention de nommage** :
- `vault_storage_<tenant>` : Stockage des documents (obligatoire)
- `vault_ledger_<tenant>` : Ledger filesystem (recommandé)
- `vault_audit_<tenant>` : Logs d'audit (recommandé)

### 3. Volumes créés

**Tenant core** :
- ✅ `vault_storage_core`
- ✅ `vault_ledger_core`
- ✅ `vault_audit_core`

**Tenant dido** :
- ✅ `vault_storage_dido`
- ✅ `vault_ledger_dido`
- ✅ `vault_audit_dido`

**Tenant rozas** :
- ✅ `vault_storage_rozas`
- ✅ `vault_ledger_rozas`
- ✅ `vault_audit_rozas`

---

## 🔄 Migration

**État** : ✅ **Aucune migration nécessaire**

**Raison** : Aucun fichier n'existait dans le storage éphémère du container (0 fichiers détectés).

**Si migration nécessaire à l'avenir** :
```bash
# 1. Créer volumes
docker volume create vault_storage_<tenant>
docker volume create vault_ledger_<tenant>
docker volume create vault_audit_<tenant>

# 2. Copier depuis container
docker run --rm \
  --volumes-from vault-<tenant> \
  -v vault_storage_<tenant>:/dst \
  alpine sh -lc 'cp -a /opt/dorevia-vault/storage/. /dst/ || true'

# 3. Redéployer avec volumes
cd tenants/<tenant>/platform
docker compose up -d --force-recreate vault
```

---

## ✅ Vérifications

### Containers Vault

Tous les containers Vault ont les volumes montés :

```bash
# Vérifier montage
docker inspect vault-<tenant> --format '{{range .Mounts}}{{.Name}} -> {{.Destination}}{{"\n"}}{{end}}'
```

**Résultat attendu** :
- `vault_storage_<tenant>` -> `/opt/dorevia-vault/storage`
- `vault_ledger_<tenant>` -> `/opt/dorevia-vault/ledger`
- `vault_audit_<tenant>` -> `/opt/dorevia-vault/audit`

### Test de persistance

**Test recommandé** :
1. Ingest un document via Vault API
2. Vérifier que le fichier existe dans le volume :
   ```bash
   docker run --rm -v vault_storage_<tenant>:/data alpine ls -la /data
   ```
3. Recréer le container :
   ```bash
   docker compose -f tenants/<tenant>/platform/docker-compose.yml up -d --force-recreate vault
   ```
4. Vérifier que le fichier existe toujours

---

## 📝 Impact sur Phase 6 (Backup/Restore)

### Backup

Les scripts `backup.sh` doivent maintenant inclure :

1. **Vault DB** : `pg_dump` (déjà prévu)
2. **Vault Storage** : Archive du volume `vault_storage_<tenant>` (nouveau)
3. **Vault Ledger** : Archive du volume `vault_ledger_<tenant>` (optionnel)
4. **Vault Audit** : Archive du volume `vault_audit_<tenant>` (optionnel)

**Exemple de fonction à ajouter** :
```bash
backup_vault_volumes() {
  local tenant="$1"
  local base="$OUT_DIR/tenants/${tenant}/platform"
  mkdir -p "$base"

  # Storage (obligatoire)
  docker run --rm \
    -v "vault_storage_${tenant}:/data:ro" \
    -v "$(pwd)/$base:/out" \
    alpine sh -lc "cd /data && tar -czf /out/vault-storage.tar.gz ."
  
  # Ledger (optionnel)
  if docker volume inspect "vault_ledger_${tenant}" &>/dev/null; then
    docker run --rm \
      -v "vault_ledger_${tenant}:/data:ro" \
      -v "$(pwd)/$base:/out" \
      alpine sh -lc "cd /data && tar -czf /out/vault-ledger.tar.gz ."
  fi
  
  # Audit (optionnel)
  if docker volume inspect "vault_audit_${tenant}" &>/dev/null; then
    docker run --rm \
      -v "vault_audit_${tenant}:/data:ro" \
      -v "$(pwd)/$base:/out" \
      alpine sh -lc "cd /data && tar -czf /out/vault-audit.tar.gz ."
  fi
}
```

### Restore

Les scripts `restore.sh` doivent restaurer :

1. **Vault DB** : `pg_restore` (déjà prévu)
2. **Vault Storage** : Restaurer `vault-storage.tar.gz` dans le volume (nouveau)
3. **Vault Ledger** : Restaurer `vault-ledger.tar.gz` (optionnel)
4. **Vault Audit** : Restaurer `vault-audit.tar.gz` (optionnel)

**Exemple de fonction à ajouter** :
```bash
restore_vault_volume() {
  local tarfile="$1"
  local vol="$2"
  [[ -f "$tarfile" ]] || return 0
  [[ -n "$vol" ]] || return 0

  echo "📥 Restauration volume Vault: $vol"
  docker run --rm \
    -v "${vol}:/data" \
    -v "$(realpath "$tarfile"):/in.tgz:ro" \
    alpine sh -lc "cd /data && rm -rf ./* && tar -xzf /in.tgz"
}

# Appel
restore_vault_volume "$FROM_DIR/tenants/$TENANT/platform/vault-storage.tar.gz" "vault_storage_${TENANT}"
restore_vault_volume "$FROM_DIR/tenants/$TENANT/platform/vault-ledger.tar.gz" "vault_ledger_${TENANT}"
restore_vault_volume "$FROM_DIR/tenants/$TENANT/platform/vault-audit.tar.gz" "vault_audit_${TENANT}"
```

---

## ✅ Critères d'acceptation (Phase 6)

- [x] Vault a un volume monté sur `/opt/dorevia-vault/storage`
- [x] Volumes créés pour tous les tenants (core, dido, rozas)
- [ ] Test : `docker compose up -d --force-recreate vault` ne perd plus les fichiers (à tester avec données réelles)
- [ ] Backup produit `vault-db.dump` + `vault-storage.tar.gz` (à implémenter dans scripts Phase 6)
- [ ] Restore réinjecte DB + volumes (à implémenter dans scripts Phase 6)
- [ ] Contrôle cohérence : `stored_path` correspond au fichier après restore (à tester)

---

## 📝 Notes importantes

### 1. Volumes partagés vs isolés

**Chaque tenant a ses propres volumes** :
- ✅ Isolation complète entre tenants
- ✅ Backup/restore par tenant indépendant
- ✅ Pas de risque de collision

### 2. Convention de nommage

**Volumes** :
- Format : `vault_<type>_<tenant>`
- Exemples : `vault_storage_core`, `vault_ledger_dido`

**Noms Docker** :
- Format : `vault_<type>_<tenant>` (identique)
- Utilisation : `docker volume inspect vault_storage_core`

### 3. Migration future

Si des fichiers existent dans un container sans volume :
1. Créer les volumes
2. Copier les données (voir section Migration)
3. Redéployer avec volumes montés

---

## 🚀 Prochaines étapes

1. ✅ **Fait** : Volumes ajoutés dans docker-compose
2. ⏳ **À faire** : Implémenter backup volumes Vault dans `backup.sh` (Phase 6)
3. ⏳ **À faire** : Implémenter restore volumes Vault dans `restore.sh` (Phase 6)
4. ⏳ **À faire** : Tester backup/restore complet avec données réelles

---

**Document généré le** : 2025-12-29  
**Statut** : ✅ **PATCH APPLIQUÉ**

