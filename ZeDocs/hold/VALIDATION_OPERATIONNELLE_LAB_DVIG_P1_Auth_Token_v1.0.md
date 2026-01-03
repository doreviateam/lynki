# ✅ Validation opérationnelle LAB — DVIG P1 Auth / Token
Version : v1.0  
Date : 2025-01-28  
Portée : Validation **LAB** avant passage PROD  
Statut attendu : **100% VALIDÉ**

---

## 🎯 Objectif

Ce document décrit la **procédure complète de validation opérationnelle en environnement LAB** pour DVIG P1 (Auth / Token).

👉 À l’issue de cette checklist :
- le **code P1 est prouvé fonctionnel**,
- les **tests critiques sont validés**,
- la release peut être **gelée et promue en PROD**.

---

## 1️⃣ Préparation — Génération des tokens

### 1.1 Générer un token LAB

```bash
python -m dvig.cli.token_gen --tenant rehtse --univers odoo --output yaml
```

### 1.2 Créer le fichier `tokens.yml`

- Copier le bloc YAML généré
- Créer (ou compléter) le fichier :

```yaml
version: 1
tokens:
  - id: "tok_rehtse_odoo_01"
    token_hash: "sha256:xxxxxxxx"
    tenant: "rehtse"
    univers: "odoo"
    status: "active"
    comment: "LAB initial"
```

📌 Le token **brut** n’est **jamais** stocké dans le fichier.

---

## 2️⃣ Démarrage DVIG en mode LAB

### 2.1 Variables d’environnement requises

- `DVIG_AUTH_ENABLED=1`
- `DVIG_TOKENS_FILE=/etc/dvig/tokens.yml`
- `DVIG_DOCS_ENABLED=1`
- `DVIG_OPENAPI_ENABLED=1`

### 2.2 Lancement via Docker

```bash
docker run --rm -p 18120:8080 \
  -v ./tokens.yml:/etc/dvig/tokens.yml:ro \
  -e DVIG_AUTH_ENABLED=1 \
  -e DVIG_TOKENS_FILE=/etc/dvig/tokens.yml \
  -e DVIG_DOCS_ENABLED=1 \
  -e DVIG_OPENAPI_ENABLED=1 \
  dorevia/dvig:0.1.1
```

**Note** : La version Docker doit correspondre à la version du code (`0.1.1`).  
Si vous utilisez un tag personnalisé, ajustez en conséquence.

---

## 3️⃣ Smoke tests API (preuves minimales)

### 3.1 Health

```bash
curl -i http://127.0.0.1:18120/health
```

✔️ Attendu : `200 OK`

---

### 3.2 Documentation (LAB uniquement)

```bash
curl -i http://127.0.0.1:18120/docs
curl -i http://127.0.0.1:18120/openapi.json
```

✔️ Attendu : `200 OK`

---

### 3.3 Ingest — Auth absente

```bash
curl -i -X POST http://127.0.0.1:18120/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"t","source":"odoo.lab.core","data":{}}'
```

✔️ Attendu : `401 AUTH_MISSING`

---

### 3.4 Ingest — Token invalide

```bash
curl -i -X POST http://127.0.0.1:18120/ingest \
  -H "Authorization: Bearer dvig_invalid" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"t","source":"odoo.lab.core","data":{}}'
```

✔️ Attendu : `401 INVALID_TOKEN`

---

### 3.5 Ingest — Univers non cohérent

```bash
curl -i -X POST http://127.0.0.1:18120/ingest \
  -H "Authorization: Bearer <TOKEN_VALIDE>" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"t","source":"sylius.lab.core","data":{}}'
```

✔️ Attendu : `403 UNIVERSE_MISMATCH`

---

### 3.6 Ingest — Cas nominal

```bash
curl -i -X POST http://127.0.0.1:18120/ingest \
  -H "Authorization: Bearer <TOKEN_VALIDE>" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"manual.test","source":"odoo.lab.core","data":{"msg":"hello"}}'
```

✔️ Attendu : `201 Created`

---

## 4️⃣ Vérification des logs

- [ ] Présence de :
  - `event_id`
  - `tenant`
  - `univers`
  - `token_id`
- [ ] Absence totale :
  - token brut
  - hash du token

📌 Les logs doivent être structurés (JSON ou console selon config).

---

## 5️⃣ Validation du reload des tokens

### 5.1 Rotation

- Ajouter un **nouveau token actif** (même tenant/univers) dans `tokens.yml`
- Attendre `DVIG_TOKENS_RELOAD_INTERVAL` (défaut: 60s) **ou** envoyer un `SIGHUP`

**Note** : Pour tester SIGHUP, identifier le PID du processus Docker :
```bash
docker exec <container_id> ps aux | grep uvicorn
kill -HUP <pid>
```

Ou depuis l'hôte :
```bash
docker kill --signal=HUP <container_id>
```

### 5.2 Vérifications

- [ ] Nouveau token accepté
- [ ] Ancien token toujours accepté (overlap)

### 5.3 Révocation

- Passer l’ancien token en `status: revoked`
- Reload
- [ ] Ancien token → `401 TOKEN_REVOKED`
- [ ] Nouveau token → `201`

---

## 6️⃣ Exécution des tests automatisés

### 6.1 Lancer les tests

```bash
cd /opt/dorevia-plateform/sources/dvig
pytest tests/ -v
```

**Tests attendus** :
- `tests/unit/test_token_store.py` : 11 tests
- `tests/unit/test_auth.py` : 6 tests
- `tests/unit/test_source_validation.py` : 4 tests
- `tests/integration/test_ingest_auth.py` : 6 tests
- `tests/integration/test_token_reload.py` : 4 tests
- `tests/integration/test_docs.py` : 4 tests

**Total** : 35 tests

✔️ Attendu : **0 échec**

### 6.2 Couverture (optionnel mais recommandé)

```bash
cd /opt/dorevia-plateform/sources/dvig
pytest --cov=dvig.api_fastapi --cov-report=term-missing tests/
```

📊 Noter la couverture obtenue.  
**Objectif** : > 80% pour les modules P1 (`dvig.api_fastapi.auth`, `dvig.api_fastapi.routes`)

---

## 7️⃣ Critères de validation LAB (DoD)

La validation LAB est **ACQUISE** si :

- [ ] Tous les smoke tests API sont conformes
- [ ] Les logs sont corrects et sans fuite de secret
- [ ] Le reload des tokens fonctionne
- [ ] Les tests automatisés passent
- [ ] Aucune erreur critique au runtime

---

## 8️⃣ Décision

- [ ] **LAB VALIDÉ**
- [ ] Tag de release possible
- [ ] Passage en PROD autorisé

---

## 🏁 Conclusion

Une fois ce document entièrement validé et coché :

👉 **DVIG P1 Auth / Token est officiellement VALIDÉ.**  
👉 Toute évolution ultérieure relève du **P2**.

---

Fin du document.
