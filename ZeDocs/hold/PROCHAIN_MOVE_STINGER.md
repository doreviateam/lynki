# 🎯 Prochain Move - STINGER Validation

**Date** : 2025-01-28  
**Statut actuel** : Service déployé, validation en cours

---

## 📊 État Actuel

### ✅ Complété

- [x] Service STINGER déployé
- [x] Container actif : `dvig-stinger`
- [x] Image : `dorevia/dvig:0.1.2-auth`
- [x] Port : 8082 (8080 occupé par vault)
- [x] Health check : ✅ OK
- [x] Configuration Docker Compose prête

### ⚠️ À Corriger

- [ ] **Permissions tokens.yml** : Container ne peut pas lire le fichier
  - **Action** : `sudo chmod 0440 /etc/dvig/tokens.yml && sudo chgrp docker /etc/dvig/tokens.yml`
  - **Voir** : `CORRECTION_PERMISSIONS_STINGER.md`

### ⏳ À Faire (Validation STINGER)

- [ ] Vérifier chargement tokens (après correction permissions)
- [ ] Smoke tests API (7 tests)
- [ ] Validation reload tokens
- [ ] Validation logs
- [ ] Robustesse (restart, stop/start)
- [ ] Documentation validation STINGER

---

## 🚀 Prochain Move Immédiat

### Étape 0 : Script Automatisé (Alternative Rapide) ⚡

**Option recommandée** : Utiliser le script de validation automatisé

```bash
cd /opt/dorevia-plateform/sources/dvig
./scripts/validate_stinger.sh
```

Le script exécute automatiquement :
- ✅ Vérification service
- ✅ Vérification tokens
- ✅ Smoke tests (7 tests)
- ✅ Validation logs
- ✅ Validation reload
- ✅ Validation robustesse
- ✅ Résumé avec statistiques

**Voir** : `SCRIPT_VALIDATION_STINGER.md` pour détails.

---

### Étape 1 : Corriger Permissions (2 min) ⚠️ PRIORITÉ (si nécessaire)

**Problème** : Container ne peut pas lire `/etc/dvig/tokens.yml`

**Solution** :
```bash
sudo chmod 0440 /etc/dvig/tokens.yml
sudo chgrp docker /etc/dvig/tokens.yml
sudo chown root:docker /etc/dvig/tokens.yml

# Redémarrer
docker restart dvig-stinger

# Vérifier
sleep 5
docker logs dvig-stinger | grep -i "tokens rechargés"
# Devrait afficher : "Tokens rechargés: 1 tokens chargés"
```

**Vérification** :
```bash
# Ne plus avoir d'erreur "Permission denied"
docker logs dvig-stinger | grep -i "permission\|erreur"
```

---

### Étape 2 : Vérifier Chargement Tokens (1 min)

**Après correction permissions** :

```bash
# Vérifier logs
docker logs dvig-stinger | grep -i "tokens"

# Devrait afficher :
# "Tokens rechargés: 1 tokens chargés"
# "Auth activée (tokens: /etc/dvig/tokens.yml)"
```

**Tester avec token** :
```bash
# Charger token brut
source /opt/dorevia-plateform/sources/dvig/conf/token_stinger_brut.txt

# Tester
curl -X POST http://localhost:8082/ingest \
  -H "Authorization: Bearer $TOKEN_BRUT" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.stinger","source":"odoo.stinger.core","data":{}}'

# Attendu : 201 Created
```

---

### Étape 3 : Smoke Tests API (10-15 min)

**7 tests à exécuter** :

#### Test 1 : Health Check
```bash
curl -i http://localhost:8082/health
# Attendu : 200 OK
```

#### Test 2 : Docs (désactivé)
```bash
curl -i http://localhost:8082/docs
# Attendu : 404 Not Found
```

#### Test 3 : OpenAPI (désactivé)
```bash
curl -i http://localhost:8082/openapi.json
# Attendu : 404 Not Found
```

#### Test 4 : Ingest sans Auth
```bash
curl -i -X POST http://localhost:8082/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.stinger.core","data":{}}'
# Attendu : 401 Unauthorized (AUTH_MISSING)
```

#### Test 5 : Token Invalide
```bash
curl -i -X POST http://localhost:8082/ingest \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.stinger.core","data":{}}'
# Attendu : 401 Unauthorized (INVALID_TOKEN)
```

#### Test 6 : Univers Mismatch
```bash
source /opt/dorevia-plateform/sources/dvig/conf/token_stinger_brut.txt
curl -i -X POST http://localhost:8082/ingest \
  -H "Authorization: Bearer $TOKEN_BRUT" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"sylius.prod","data":{}}'
# Attendu : 403 Forbidden (UNIVERSE_MISMATCH)
```

#### Test 7 : Cas Nominal
```bash
source /opt/dorevia-plateform/sources/dvig/conf/token_stinger_brut.txt
curl -i -X POST http://localhost:8082/ingest \
  -H "Authorization: Bearer $TOKEN_BRUT" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.stinger","source":"odoo.stinger.core","data":{"test":"stinger"}}'
# Attendu : 201 Created
```

---

### Étape 4 : Validation Reload Tokens (5-10 min)

#### Rotation Token (Overlap)

```bash
# 1. Ajouter nouveau token dans /etc/dvig/tokens.yml
sudo nano /etc/dvig/tokens.yml
# Ajouter un nouveau token avec status: active

# 2. Reload (SIGHUP)
docker kill --signal=HUP dvig-stinger

# 3. Vérifier ancien token toujours accepté
# 4. Vérifier nouveau token accepté
```

#### Révocation Token

```bash
# 1. Modifier status token à "revoked" dans /etc/dvig/tokens.yml
sudo nano /etc/dvig/tokens.yml

# 2. Reload
docker kill --signal=HUP dvig-stinger

# 3. Vérifier token révoqué rejeté (401 TOKEN_REVOKED)
```

---

### Étape 5 : Validation Logs (2 min)

```bash
# Format JSON
docker logs dvig-stinger | jq . | head -20

# Présence champs requis
docker logs dvig-stinger | jq 'select(.event == "ingest_event_accepted") | {event_id, tenant, univers, token_id}'

# Absence token brut/hash
docker logs dvig-stinger | grep -i "dvig_" || echo "✅ Aucun token brut"
docker logs dvig-stinger | grep -i "sha256:" || echo "✅ Aucun hash"
```

---

### Étape 6 : Robustesse (2 min)

```bash
# Restart
docker restart dvig-stinger
sleep 5
curl http://localhost:8082/health

# Stop/Start
docker stop dvig-stinger
docker start dvig-stinger
sleep 5
curl http://localhost:8082/health
```

---

### Étape 7 : Documentation Validation (5 min)

**Créer** : `VALIDATION_STINGER_P1_AUTH_TOKEN.md`

**Contenu** :
- Date validation
- Image tag : `dorevia/dvig:0.1.2-auth`
- Résultats smoke tests (7/7)
- Résultats reload tokens
- Résultats logs
- Résultats robustesse
- **Formulation officielle** :
  > **DVIG P1 Auth/Token — STINGER VALIDÉ**  
  > Le service a été déployé dans des conditions équivalentes à la production.  
  > Les mécanismes d'authentification, de reload des tokens, de logs et de redémarrage ont été validés sans régression.

---

## 📋 Checklist Complète

### Correction Immédiate

- [ ] Permissions tokens.yml corrigées (0440, root:docker)
- [ ] Service redémarré
- [ ] Tokens chargés (vérifier logs)

### Validation STINGER

- [ ] Smoke test 1 : Health (200) ✅
- [ ] Smoke test 2 : Docs (404)
- [ ] Smoke test 3 : OpenAPI (404)
- [ ] Smoke test 4 : Ingest sans auth (401)
- [ ] Smoke test 5 : Token invalide (401)
- [ ] Smoke test 6 : Univers mismatch (403)
- [ ] Smoke test 7 : Cas nominal (201)
- [ ] Reload rotation (overlap)
- [ ] Reload révocation
- [ ] Logs format JSON
- [ ] Logs sécurisés (pas de token/hash)
- [ ] Robustesse (restart, stop/start)

### Documentation

- [ ] Validation STINGER documentée
- [ ] Formulation officielle consignée
- [ ] Roadmap mise à jour

---

## ⏱️ Timeline Estimée

| Étape | Durée | Priorité |
|-------|-------|----------|
| **Correction permissions** | 2 min | ⚠️ HAUTE |
| **Vérification tokens** | 1 min | ⚠️ HAUTE |
| **Smoke tests** | 10-15 min | HAUTE |
| **Reload tokens** | 5-10 min | HAUTE |
| **Logs** | 2 min | MOYENNE |
| **Robustesse** | 2 min | MOYENNE |
| **Documentation** | 5 min | MOYENNE |
| **TOTAL** | **25-40 min** | |

---

## 🎯 Action Immédiate Recommandée

### Maintenant (2 min)

**Corriger les permissions** :

```bash
sudo chmod 0440 /etc/dvig/tokens.yml
sudo chgrp docker /etc/dvig/tokens.yml
sudo chown root:docker /etc/dvig/tokens.yml
docker restart dvig-stinger
```

### Ensuite (30-40 min)

**Exécuter la validation STINGER complète** :
1. Vérifier chargement tokens
2. Smoke tests (7 tests)
3. Reload tokens
4. Logs
5. Robustesse
6. Documentation

---

## 🏁 Objectif Final

**STINGER VALIDÉ** → **PROD AUTORISÉ**

Une fois STINGER validé à 100%, le déploiement PROD sera autorisé.

---

## 📝 Documents de Référence

- **Correction permissions** : `CORRECTION_PERMISSIONS_STINGER.md`
- **Guide déploiement** : `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md`
- **Déploiement réussi** : `DEPLOIEMENT_STINGER_REUSSI.md`
- **Préconisations** : `PRECONISATIONS_AJUSTEMENTS_STINGER_v1.0.md`

---

**Dernière mise à jour** : 2025-01-28

