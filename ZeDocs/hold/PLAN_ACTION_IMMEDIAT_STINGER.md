# 🎯 Plan d'Action Immédiat - Déploiement STINGER

**Date** : 2025-01-28  
**Contexte** : LAB 100% validé, documentation STINGER complète  
**Objectif** : Déployer et valider DVIG P1 Auth/Token en STINGER

---

## 📊 État Actuel

### ✅ Complété

- [x] Code 100% terminé (20 fichiers)
- [x] Tests automatisés passent (35/35, 88% couverture)
- [x] Validation LAB 100% (13/13 tests)
- [x] Documentation STINGER complète
  - [x] Préconisations officielles
  - [x] Guide de déploiement détaillé
  - [x] Roadmap mise à jour

### ⏳ À Faire (STINGER)

- [ ] Préparation STINGER
- [ ] Déploiement STINGER
- [ ] Validation STINGER

---

## 🚀 Actions Immédiates (Ordre d'Exécution)

### Phase A : Préparation STINGER (30-60 min) ⚡

#### 1.1 Vérifier Version Image Docker

**Action** : Identifier la version exacte à utiliser

```bash
# Vérifier version actuelle du code
cd /opt/dorevia-plateform/sources/dvig
python -c "import dvig; print(dvig.__version__)"

# Vérifier si image Docker existe
docker images | grep dvig

# Si image n'existe pas, vérifier quelle version build
# Selon préconisations : dorevia/dvig:0.1.2-auth
```

**✅ Décision prise** :
- [x] Version confirmée : `dorevia/dvig:0.1.2-auth`
- [x] Code mis à jour : version `0.1.2`
- [ ] Image à build (prochaine étape)
- [ ] Registry Docker disponible ?

---

#### 1.2 Générer Tokens STINGER

**Action** : Créer tokens STINGER (séparés de LAB)

```bash
cd /opt/dorevia-plateform/sources/dvig
source venv/bin/activate

# Générer token STINGER
python -m dvig.cli.token_gen \
  --tenant <tenant_stinger> \
  --univers odoo \
  --output yaml
```

**Checklist** :
- [ ] Token généré
- [ ] Hash calculé et vérifié
- [ ] Token ID créé (ex: `tok_stinger_tenant_odoo_01`)
- [ ] Token brut sauvegardé de manière sécurisée (pas dans Git)

---

#### 1.3 Créer Fichier `tokens.yml` STINGER

**Action** : Créer configuration tokens STINGER

**Emplacement** : `/etc/dvig/tokens.yml` (sur serveur STINGER)

**Contenu** :
```yaml
version: 1
# Tokens DVIG STINGER - Ne jamais commiter les tokens bruts
# Généré le 2025-01-28
# ⚠️ IMPORTANT : Ne jamais stocker token brut dans les documents

tokens:
  - id: "tok_stinger_tenant_odoo_01"
    token_hash: "sha256:..."
    tenant: "<tenant_stinger>"
    univers: "odoo"
    status: "active"
    created_at: "2025-01-28T00:00:00Z"
    comment: "STINGER - Token initial"
```

**Checklist** :
- [ ] Fichier créé
- [ ] **Permissions recommandées** : `chmod 0400 /etc/dvig/tokens.yml` (lecture seule root)
- [ ] Propriétaire : `chown root:root /etc/dvig/tokens.yml`
- [ ] Format YAML valide
- [ ] Token hash correct
- [ ] **Token brut stocké hors Git** (gestionnaire de secrets, fichier local protégé, ou note temporaire chiffrée)
- [ ] **Dans les docs** : seulement `token_id` + `token_hash` + métadonnées (pas de token brut)

---

#### 1.4 Préparer Configuration Docker Compose

**Action** : Créer `docker-compose.stinger.yml`

**Fichier** : `/opt/dvig/docker-compose.stinger.yml` (sur serveur STINGER)

**Contenu** : Voir `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md` section "Déploiement STINGER"

**Checklist** :
- [ ] Fichier créé
- [ ] Image Docker correcte : `dorevia/dvig:0.1.2-auth`
- [ ] Variables d'environnement configurées
- [ ] Volume `tokens.yml` monté (read-only)
- [ ] Healthcheck configuré
- [ ] Network configuré

---

### Phase B : Déploiement STINGER (15-30 min) ⚡

#### 2.1 Préparer Serveur STINGER

**Actions** :
```bash
# Connexion serveur STINGER
ssh user@stinger.doreviateam.com

# Créer répertoires
sudo mkdir -p /opt/dvig
sudo mkdir -p /etc/dvig
sudo mkdir -p /var/log/dvig

# Copier tokens.yml
scp tokens.yml user@stinger:/etc/dvig/tokens.yml

# Copier docker-compose.stinger.yml
scp docker-compose.stinger.yml user@stinger:/opt/dvig/

# Sur serveur STINGER : Configurer permissions
sudo chmod 0400 /etc/dvig/tokens.yml  # Lecture seule root (recommandé)
sudo chown root:root /etc/dvig/tokens.yml
```

**Checklist** :
- [ ] Serveur accessible
- [ ] Répertoires créés
- [ ] `tokens.yml` copié
- [ ] **Permissions configurées** : `chmod 0400` + `chown root:root`
- [ ] Docker installé et fonctionnel

---

#### 2.2 Pull/Build Image Docker

**Action** : S'assurer que l'image Docker est disponible

```bash
# Option 1 : Pull depuis registry
docker pull dorevia/dvig:0.1.2-auth

# Option 2 : Build local (si nécessaire)
cd /opt/dorevia-plateform/sources/dvig
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.2-auth .
```

**Checklist** :
- [ ] Image disponible
- [ ] Version vérifiée
- [ ] Image taggée correctement

---

#### 2.3 Lancer Service

**Action** : Déployer le service DVIG

```bash
cd /opt/dvig
docker-compose -f docker-compose.stinger.yml up -d

# Vérifier démarrage
docker-compose -f docker-compose.stinger.yml logs -f
```

**Checklist** :
- [ ] Container démarré
- [ ] Pas d'erreur dans logs
- [ ] Health check accessible
- [ ] Port 8080 ouvert

---

### Phase C : Validation STINGER (30-60 min) ⚡

#### 3.1 Smoke Tests API (7 tests)

**Tests** : Voir `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md` section "Validation STINGER"

**Checklist** :
- [ ] Test 1 : Health (200) ✅
- [ ] Test 2 : Docs (404 - désactivé) ✅
- [ ] Test 3 : OpenAPI (404 - désactivé) ✅
- [ ] Test 4 : Ingest sans auth (401) ✅
- [ ] Test 5 : Token invalide (401) ✅
- [ ] Test 6 : Univers mismatch (403) ✅
- [ ] Test 7 : Cas nominal (201) ✅

---

#### 3.2 Validation Reload Tokens

**Tests** :
- [ ] Rotation token (overlap) ✅
- [ ] Révocation token ✅
- [ ] Reload par intervalle ✅
- [ ] Reload par SIGHUP ✅
- [ ] Continuité service (pas de downtime) ✅

---

#### 3.3 Validation Logs

**Vérifications** :
- [ ] Logs format JSON ✅
- [ ] Présence `event_id`, `tenant`, `univers`, `token_id` ✅
- [ ] Absence token brut/hash ✅
- [ ] Logs exploitables pour audit ✅

---

#### 3.4 Robustesse

**Tests** :
- [ ] `docker restart dvig-stinger` → OK ✅
- [ ] `docker stop/start` → OK ✅
- [ ] Tokens rechargés après restart ✅

---

### Phase D : Clôture (15-30 min) ⚡

#### 4.1 Consigner Validation

**Action** : Créer document de validation STINGER

**Fichier** : `VALIDATION_STINGER_P1_AUTH_TOKEN.md`

**Contenu** :
- Date validation
- Image tag : `dorevia/dvig:0.1.2-auth`
- Commit hash (si applicable)
- Résultats smoke/reload/logs/restart
- **Mention "même image que PROD"**
- Formulation officielle de validation
- Signatures (si applicable)

**Formulation officielle** :
> **DVIG P1 Auth/Token — STINGER VALIDÉ**  
> Le service a été déployé dans des conditions équivalentes à la production.  
> Les mécanismes d'authentification, de reload des tokens, de logs et de redémarrage ont été validés sans régression.

---

## 📋 Checklist Globale STINGER

### Préparation

- [ ] Version image Docker confirmée
- [ ] Tokens STINGER générés
- [ ] Fichier `tokens.yml` STINGER créé
- [ ] Configuration Docker Compose préparée
- [ ] Serveur STINGER accessible

### Déploiement

- [ ] Image Docker disponible
- [ ] Service déployé
- [ ] Health check OK
- [ ] Logs démarrage OK

### Validation

- [ ] Smoke tests API (7/7) ✅
- [ ] Reload tokens validé ✅
- [ ] Logs validés ✅
- [ ] Robustesse validée ✅
- [ ] Aucun incident bloquant ✅

### Documentation

- [ ] Validation STINGER documentée
- [ ] Formulation officielle consignée
- [ ] Roadmap mise à jour

---

## ⏱️ Timeline Estimée (Version Exécutable)

| Phase | Durée | Statut |
|-------|-------|--------|
| **Phase A : Préparation** | 30-60 min | ⏳ À faire |
| **Phase B : Déploiement** | 15-30 min | ⏳ À faire |
| **Phase C : Validation** | 30-60 min | ⏳ À faire |
| **Phase D : Clôture** | 15-30 min | ⏳ À faire |
| **TOTAL** | **1.5-3h** | ⏳ À faire |

**Note** : Timeline optimisée selon préconisations officielles.

---

## 🎯 Prochaine Action Immédiate

### Action #1 : Version Confirmée ✅

**✅ Décision prise** : Version `dorevia/dvig:0.1.2-auth`

**Actions effectuées** :
- [x] Code mis à jour : `0.1.1` → `0.1.2`
- [x] Fichiers modifiés :
  - `dvig/__init__.py`
  - `dvig/api_fastapi/app.py`
  - `dvig/api_fastapi/routes/health.py`
  - `docker/Dockerfile`

**Vérification** :
```bash
# Vérifier version code
cd /opt/dorevia-plateform/sources/dvig
python -c "import dvig; print(dvig.__version__)"
# Devrait afficher : 0.1.2
```

**Prochaine étape** : Build image Docker `dorevia/dvig:0.1.2-auth`

---

## 📝 Notes

- **Préconisations officielles** : Voir `PRECONISATIONS_EXECUTION_STINGER_P1_AUTH_TOKEN.md`
- **Ajustements production-grade** : Voir `PRECONISATIONS_AJUSTEMENTS_STINGER_v1.0.md` ⭐
- **Guide détaillé** : Voir `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md`
- **Roadmap** : Voir `ROADMAP_DEPLOIEMENT_P1_AUTH_TOKEN.md`

## 🔐 Hygiène Sécurité (Phase D)

**Après validation STINGER** :
- [ ] Révoquer les tokens de test divulgués
- [ ] Ne garder en actif que les tokens STINGER requis
- [ ] Vérifier qu'aucun token brut n'est dans les documents Git

---

**Dernière mise à jour** : 2025-01-28

