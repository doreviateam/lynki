# 🔄 Validation LAB en Cours - DVIG P1 Auth/Token

**Date de démarrage** : 2025-01-28  
**Statut** : ⏳ En cours

---

## 📋 Checklist de Validation

### 1️⃣ Préparation

- [x] Environnement virtuel créé
- [x] Dépendances installées
- [x] Tests automatisés passent (35/35)
- [ ] Token LAB généré
- [ ] Fichier tokens.yml créé

### 2️⃣ Démarrage DVIG

- [ ] Variables d'environnement configurées
- [ ] Service démarré
- [ ] Health check OK

### 3️⃣ Smoke Tests API

- [ ] Health (200 OK)
- [ ] Docs (200 OK)
- [ ] OpenAPI (200 OK)
- [ ] Ingest sans auth (401 AUTH_MISSING)
- [ ] Ingest token invalide (401 INVALID_TOKEN)
- [ ] Ingest univers mismatch (403 UNIVERSE_MISMATCH)
- [ ] Ingest cas nominal (201 Created)

### 4️⃣ Vérification Logs

- [ ] Logs structurés (JSON ou console)
- [ ] Présence event_id, tenant, univers, token_id
- [ ] Absence token brut/hash

### 5️⃣ Validation Reload

- [ ] Rotation tokens
- [ ] Révocation tokens
- [ ] Reload SIGHUP (si disponible)

### 6️⃣ Tests Automatisés

- [x] Tests unitaires (21/21 PASSED)
- [x] Tests intégration (14/14 PASSED)
- [x] Couverture 88%

---

## 📝 Notes de Validation

### Commandes Utiles

```bash
# Générer token
cd /opt/dorevia-plateform/sources/dvig
source venv/bin/activate
python -m dvig.cli.token_gen --tenant rehtse --univers odoo

# Lancer DVIG
export DVIG_AUTH_ENABLED=1
export DVIG_TOKENS_FILE=./conf/tokens.yml
export DVIG_DOCS_ENABLED=1
export DVIG_OPENAPI_ENABLED=1
python -m dvig.api_fastapi
```

### Tests Curl

```bash
# Health
curl -i http://127.0.0.1:8080/health

# Ingest sans auth
curl -i -X POST http://127.0.0.1:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.lab.core","data":{}}'

# Ingest avec token
curl -i -X POST http://127.0.0.1:8080/ingest \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.lab.core","data":{}}'
```

---

**Dernière mise à jour** : 2025-01-28

