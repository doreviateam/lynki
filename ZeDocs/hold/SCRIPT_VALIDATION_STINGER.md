# 🧪 Script de Validation STINGER - DVIG P1 Auth/Token

**Date** : 2025-01-28  
**Script** : `scripts/validate_stinger.sh`  
**Version** : 1.0

---

## 📋 Vue d'Ensemble

Script bash automatisé pour valider complètement l'environnement STINGER.

### Fonctionnalités

- ✅ Vérification service actif
- ✅ Vérification chargement tokens
- ✅ Smoke tests API (7 tests)
- ✅ Validation logs (format, champs, sécurité)
- ✅ Validation reload tokens (SIGHUP)
- ✅ Validation robustesse (restart)
- ✅ Résumé avec statistiques

---

## 🚀 Utilisation

### Prérequis

- Service STINGER déployé et actif
- Container `dvig-stinger` en cours d'exécution
- Port accessible (défaut : 8082)
- Token brut disponible (optionnel, pour tests 6-7)

### Exécution Simple

```bash
cd /opt/dorevia-plateform/sources/dvig
./scripts/validate_stinger.sh
```

### Configuration (Variables d'Environnement)

```bash
# Personnaliser host/port si nécessaire
export STINGER_HOST=stinger.doreviateam.com
export STINGER_PORT=8082

./scripts/validate_stinger.sh
```

---

## 📊 Tests Exécutés

### 1. Vérifications Préalables

- Container actif
- Health check OK
- Tokens chargés

### 2. Smoke Tests API (7 tests)

1. **Health Check** → 200 OK
2. **Docs** → 404 Not Found (désactivé)
3. **OpenAPI** → 404 Not Found (désactivé)
4. **Ingest sans Auth** → 401 Unauthorized
5. **Token Invalide** → 401 Unauthorized
6. **Univers Mismatch** → 403 Forbidden (nécessite token valide)
7. **Cas Nominal** → 201 Created (nécessite token valide)

### 3. Validation Logs

- Format JSON (si disponible)
- Présence champs requis (event_id, tenant, univers)
- Absence token brut/hash

### 4. Validation Reload

- Reload SIGHUP fonctionne

### 5. Validation Robustesse

- Restart OK (health check après restart)

---

## 📝 Exemple de Sortie

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Validation STINGER - DVIG P1 Auth/Token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] Vérification du service STINGER...
[✓] Container dvig-stinger actif
[✓] Health check OK
[INFO] Vérification chargement tokens...
[✓] Tokens chargés: Tokens rechargés: 1 tokens chargés

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🧪 Smoke Tests API (7 tests)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] Test: Test 1: Health Check
[✓] Test 1: Health Check: 200 (attendu: 200)
[INFO] Test: Test 2: Docs (désactivé)
[✓] Test 2: Docs (désactivé): 404 (attendu: 404)
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 Résumé Validation STINGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tests exécutés : 10
Tests réussis : 10
Tests échoués : 0

✅ VALIDATION STINGER RÉUSSIE

Prochaine étape : Documenter la validation
```

---

## 🔧 Détails Techniques

### Token Brut

Le script cherche le token brut dans :
- `/opt/dorevia-plateform/sources/dvig/conf/token_stinger_brut.txt`

**Format attendu** :
```bash
TOKEN_BRUT=dvig_...
```

Si le token n'est pas disponible, les tests 6-7 seront skippés.

### Tests Conditionnels

- **Tests 6-7** : Nécessitent token valide
  - Si token non disponible → SKIP (avec warning)
  - Si token disponible → Exécution normale

---

## ✅ Checklist Après Exécution

### Si Tous Tests Passent

- [x] Validation STINGER réussie
- [ ] Documenter validation (`VALIDATION_STINGER_P1_AUTH_TOKEN.md`)
- [ ] Consigner formulation officielle
- [ ] Mettre à jour roadmap

### Si Certains Tests Échouent

- [ ] Vérifier logs : `docker logs dvig-stinger`
- [ ] Vérifier permissions : `ls -la /etc/dvig/tokens.yml`
- [ ] Vérifier configuration : `docker exec dvig-stinger env | grep DVIG`
- [ ] Corriger problèmes identifiés
- [ ] Ré-exécuter script

---

## 🐛 Dépannage

### Erreur : "Container dvig-stinger n'est pas actif"

```bash
# Vérifier container
docker ps -a | grep dvig-stinger

# Si arrêté, démarrer
cd /opt/dvig
docker compose -f docker-compose.stinger.yml up -d
```

### Erreur : "Health check échoué"

```bash
# Vérifier port
curl http://localhost:8082/health

# Vérifier logs
docker logs dvig-stinger | tail -20
```

### Erreur : "Permission denied" dans logs

```bash
# Corriger permissions
sudo chmod 0440 /etc/dvig/tokens.yml
sudo chgrp docker /etc/dvig/tokens.yml
sudo chown root:docker /etc/dvig/tokens.yml
docker restart dvig-stinger
```

### Tests 6-7 Skippés

```bash
# Vérifier token brut disponible
cat /opt/dorevia-plateform/sources/dvig/conf/token_stinger_brut.txt

# Si manquant, régénérer
cd /opt/dorevia-plateform/sources/dvig
source venv/bin/activate
python -m dvig.cli.token_gen --tenant stinger --univers odoo --output token
```

---

## 📝 Notes

- Le script est **idempotent** : peut être exécuté plusieurs fois
- **Tests conditionnels** : Certains tests nécessitent token valide
- **Résumé automatique** : Statistiques en fin d'exécution

---

## 🔗 Références

- **Guide déploiement** : `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md`
- **Plan d'action** : `PLAN_ACTION_IMMEDIAT_STINGER.md`
- **Prochain move** : `PROCHAIN_MOVE_STINGER.md`

---

**Dernière mise à jour** : 2025-01-28

