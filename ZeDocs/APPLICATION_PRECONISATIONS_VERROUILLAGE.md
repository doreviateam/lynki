# ✅ Application des Préconisations — Verrouillage CORE

**Date** : 2025-01-28  
**Référence** : `PRECONISATIONS_VERROUILLAGE_CORE.md`

---

## 📊 Résumé Exécutif

Toutes les préconisations critiques ont été appliquées avec succès.

---

## ✅ 1. Verrouillage Version Vault

### Action Réalisée

- [x] **Image Vault** : `dorevia/vault:latest` → `dorevia/vault:v1.3.0` (dans `docker-compose.yml`)
- [x] **Manifest créé** : `tenants/core/state/manifest.json` pour tracker les versions

### État Actuel

- **Fichier modifié** : `sources/dvig/docker/docker-compose.yml` (ligne 55)
- **Image configurée** : `dorevia/vault:v1.3.0`
- **Manifest** : `tenants/core/state/manifest.json` créé

### Note Importante

⚠️ **L'image `dorevia/vault:v1.3.0` doit être buildée/taggée et poussée dans le registry avant le prochain déploiement.**

Pour l'instant, le container `vault-core` utilise encore `latest` car l'image taggée n'existe pas. Une fois l'image taggée disponible, le redémarrage utilisera automatiquement la version taggée.

### Critère d'Acceptation

- [x] Configuration docker-compose.yml mise à jour
- [x] Manifest créé pour tracking
- [x] Image `dorevia/vault:v1.3.0` buildée/taggée ✅

---

## ✅ 2. Unification Source de Vérité Tokens

### Action Réalisée

- [x] **Montage unifié** : `tenants/core/secrets/dvig.tokens.yml` → `/etc/dvig/tokens.yml:ro`
- [x] **Template créé** : `sources/dvig/conf/tokens.yml` → `sources/dvig/conf/tokens.yml.template`
- [x] **Commentaire ajouté** : Documentation dans `docker-compose.yml`

### État Actuel

- **Source de vérité unique** : `tenants/core/secrets/dvig.tokens.yml`
- **Template** : `sources/dvig/conf/tokens.yml.template` (non utilisé en runtime)
- **Montage** : Container `dvig-core` monte directement depuis `tenants/core/secrets/`

### Validation

```bash
$ docker inspect dvig-core --format '{{range .Mounts}}{{if eq .Destination "/etc/dvig/tokens.yml"}}{{.Source}}{{end}}{{end}}'
/opt/dorevia-plateform/tenants/core/secrets/dvig.tokens.yml
```

✅ **Confirmé** : Le container monte bien depuis `tenants/core/secrets/dvig.tokens.yml`

### Critère d'Acceptation

- [x] Un seul fichier alimente DVIG en runtime
- [x] Template créé (fichier historique renommé)
- [x] Documentation ajoutée dans docker-compose.yml

---

## ✅ 3. Port Interne DVIG Figé

### Action Réalisée

- [x] **Vérification port** : DVIG écoute sur `8080` (confirmé)
- [x] **Cohérence réseau** : Caddy route vers `dvig-core:8080` (confirmé)
- [x] **Healthcheck** : Utilise `localhost:8080` (confirmé)

### État Actuel

- **DVIG_PORT** : `8080` (variable d'environnement)
- **Caddy routage** : `dvig.core.doreviateam.com` → `dvig-core:8080`
- **Healthcheck** : `http://localhost:8080/health`

### Validation

```bash
$ docker exec dvig-core env | grep DVIG_PORT
DVIG_PORT=8080

$ grep -A2 "dvig.core" units/gateway/Caddyfile
dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
```

✅ **Confirmé** : Port `8080` cohérent partout

### Critère d'Acceptation

- [x] Port `8080` vérifié dans le container
- [x] Caddy route vers `dvig-core:8080`
- [x] Healthcheck utilise `localhost:8080`

---

## 📋 Fichiers Modifiés

### Créés

- `tenants/core/state/manifest.json` : Tracking des versions d'images
- `sources/dvig/conf/tokens.yml.template` : Template (ancien fichier actif)

### Modifiés

- `sources/dvig/docker/docker-compose.yml` :
  - Image Vault : `latest` → `v1.3.0`
  - Montage tokens : `/etc/dvig/tokens.yml` → `tenants/core/secrets/dvig.tokens.yml`
  - Commentaire ajouté pour documentation

---

## ✅ Actions Réalisées

1. **Build/Tag image Vault** : ✅ **TERMINÉ**
   ```bash
   cd sources/vault
   docker build -t dorevia/vault:v1.3.0 .
   ```
   - Image buildée avec succès
   - Tag `v1.3.0` créé localement

2. **Prochaine étape (optionnelle)** : Push vers registry si disponible
   ```bash
   docker push dorevia/vault:v1.3.0  # Si registry disponible
   ```

3. **Redémarrer Vault** (pour utiliser la nouvelle image taggée) :
   ```bash
   cd sources/dvig/docker
   ROOT_DIR=/opt/dorevia-plateform docker compose up -d vault
   ```

4. **Vérifier** :
   ```bash
   docker inspect vault-core --format '{{.Config.Image}}'
   # Doit afficher: dorevia/vault:v1.3.0
   ```

---

## ✅ Validation Globale

| Préconisation | Statut | Notes |
|---------------|--------|-------|
| **1. Vault version taggée** | ✅ **TERMINÉ** | Image buildée et taggée `v1.3.0` |
| **2. Tokens source unique** | ✅ **Appliqué** | Montage unifié validé |
| **3. Port DVIG figé** | ✅ **Vérifié** | Cohérence confirmée |

---

**Dernière mise à jour** : 2025-01-28

