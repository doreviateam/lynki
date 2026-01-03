# ✅ Préconisations & Ajustements — Plan d'Action STINGER (DVIG P1 Auth/Token)

**Version** : v1.0  
**Date** : 2025-01-28  
**Entrée** : Plan d'action immédiat (user)  
**Sortie** : Décisions + corrections "production-grade" + plan exécutable

---

## 0) Décision immédiate — Version image Docker à utiliser

### ✅ Règle d'or
**STINGER doit tester EXACTEMENT la même image que PROD.**

### ✅ Décision recommandée (sans ambiguïté)
- **Image (P1 Auth/Token)** : `dorevia/dvig:0.1.2-auth`
- **Version Python package (`dvig.__version__`)** : peut rester `0.1.1` (version "base FastAPI"), **mais** la release "capacité" doit être taggée séparément.

📌 En clair :
- `0.1.1` = base FastAPI (P0)
- `0.1.2-auth` = packaging/release image incluant P1 auth/token + durcissement docs/openapi

**Donc pour STINGER :** `dorevia/dvig:0.1.2-auth` (même image que PROD).

---

## 1) Ajustements essentiels (sécurité & gouvernance)

### 1.1 Tokens : séparation stricte et gestion des fuites
- ✅ Tu as raison : tokens STINGER séparés de LAB.
- ⚠️ Ne pas conserver de *token brut* dans des documents de suivi.  
  **Action** : considérer tout token brut copié dans un doc comme "compromis" et le **révoquer** dès que les tests sont finis.

**Préco pratique**
- Stocker le token brut **hors Git** :
  - gestionnaire de secrets (idéal),
  - fichier local protégé (minimisé),
  - ou note temporaire chiffrée.
- Dans les docs : ne garder que `token_id` + `token_hash` + métadonnées.

### 1.2 Permissions tokens.yml
Ton plan dit `chmod 600`. C'est OK, mais je recommande :
- `chmod 0400 /etc/dvig/tokens.yml`
- `chown root:root /etc/dvig/tokens.yml`

Si docker tourne sous un user non-root, adapter le groupe (`0440`) et group ownership.

### 1.3 Ne pas "build" une image différente pour STINGER
Tu as une ligne :
```bash
docker build ... -t dorevia/dvig:0.1.1-stinger .
```
❌ À éviter.  
✅ STINGER doit être une **config**, pas une **version**.

**Préco :**
- Build une seule fois l'image "release"
  - `dorevia/dvig:0.1.2-auth`
- Déployer cette même image sur STINGER puis PROD.

---

## 2) Préconisation Compose STINGER (baseline)

### 2.1 Variables d'environnement STINGER (PROD-like)
Recommandé :

```yaml
environment:
  DVIG_AUTH_ENABLED: "1"
  DVIG_TOKENS_FILE: "/etc/dvig/tokens.yml"

  DVIG_DOCS_ENABLED: "0"
  DVIG_OPENAPI_ENABLED: "0"

  DVIG_LOG_FORMAT: "json"
  DVIG_LOG_LEVEL: "info"

  DVIG_TOKENS_RELOAD_INTERVAL: "60"
  DVIG_TOKENS_RELOAD_ON_SIGHUP: "1"

  DVIG_HEALTH_PROTECTED: "0"
```

### 2.2 Volume tokens (read-only)
```yaml
volumes:
  - /etc/dvig/tokens.yml:/etc/dvig/tokens.yml:ro
```

### 2.3 Healthcheck (recommandé)
```yaml
healthcheck:
  test: ["CMD", "sh", "-lc", "wget -qO- http://127.0.0.1:8080/health >/dev/null"]
  interval: 10s
  timeout: 3s
  retries: 10
```

---

## 3) Plan STINGER — version "exécutable" (ordre strict)

### Phase A — Préparation (objectif : 30–60 min)

1. **Générer token STINGER**
```bash
python -m dvig.cli.token_gen --tenant <tenant_stinger> --univers odoo --output yaml
```

2. **Écrire `/etc/dvig/tokens.yml` sur serveur STINGER**
- permissions `0400`
- owner `root:root`

3. **Préparer `docker-compose.stinger.yml`**
- image `dorevia/dvig:0.1.2-auth`
- docs/openapi OFF
- logs json

### Phase B — Déploiement (objectif : 15–30 min)

4. **Rendre l'image disponible**
- Option 1 (préférée) : `docker pull dorevia/dvig:0.1.2-auth`
- Option 2 : `docker load` (si airgap)
- Option 3 : build local (dernier recours)

5. **Lancer**
```bash
docker compose -f docker-compose.stinger.yml up -d
docker compose -f docker-compose.stinger.yml ps
docker compose -f docker-compose.stinger.yml logs -f
```

### Phase C — Validation STINGER (objectif : 30–60 min)

6. **Smoke tests (PROD-like)**
- `/health` → 200
- `/docs` → 404
- `/openapi.json` → 404
- `/ingest` sans token → 401
- `/ingest` token invalide → 401
- `/ingest` univers mismatch → 403
- `/ingest` nominal → 201

7. **Logs**
- présents via `docker logs`
- contiennent `event_id`, `tenant`, `univers`, `token_id`
- ne contiennent pas token brut / hash

8. **Reload**
- rotation + overlap (ancien + nouveau acceptés)
- révocation (ancien → 401 TOKEN_REVOKED)
- reload intervalle + SIGHUP (`docker kill --signal=HUP <container>`)

9. **Robustesse**
- `docker restart` → OK
- tokens rechargés après restart

### Phase D — Clôture (objectif : 15–30 min)

10. **Documenter**
Créer `VALIDATION_STINGER_P1_AUTH_TOKEN.md` avec :
- date, image tag, commit hash
- résultats smoke/reload/logs/restart
- mention "même image que PROD"
- formulation officielle

11. **Hygiène sécurité**
- révoquer les tokens de test divulgués
- ne garder en actif que les tokens STINGER requis

---

## 4) Comment trancher tes "décisions requises" (sans bloquer)

### "Image existe déjà ou à build ?"
✅ **Si un registry est dispo → pull.**  
Sinon → build local puis pousser (ou load).

### "Registry Docker disponible ?"
✅ Si GitLab registry interne existe, c'est l'idéal.  
Sinon, à défaut : build sur machine STINGER (dernier recours) mais **geler un digest**.

### "Version code = 0.1.1, image = 0.1.2-auth ?"
✅ Oui, c'est acceptable et même recommandé :  
- **version package** = base
- **tag image release** = capacité

---

## 5) Résultat attendu

À la fin :
- ✅ **STINGER VALIDÉ**
- ✅ **PROD AUTORISÉ**
- 🏷️ Release gelée (tag image immuable)
- 🔐 Tokens STINGER propres

---

**Fin du document**

