# SPEC — DVIG FastAPI P1 — Auth / Token
Version : v1.0  
Date : 2025-12-27  
Statut : DRAFT (prêt à implémenter)  
Cible : DVIG `api_fastapi` (FastAPI) — suite de `spec_fastDiv.md` P0

---

## 0) Contexte & objectifs

P0 a livré une API d’ingestion minimale (`/health`, `/ingest`) sans sécurité.  
P1 ajoute une **authentification par token** simple, robuste et auditable, sans complexifier le runtime.

### Objectifs (P1)
- Empêcher toute ingestion non autorisée.
- Permettre des tokens **scopés** (tenant + univers/app).
- Supporter la **rotation** et la **révocation**.
- Conserver l’API P0 (mêmes payloads), en ajoutant uniquement l’en-tête d’auth.
- Rester “deploy-friendly” (config YAML/env), sans DB obligatoire.

### Non-objectifs (P1)
- OAuth2 complet, SSO, gestion utilisateurs.
- JWT signé par IdP externe.
- Chiffrement applicatif des payloads.
- mTLS (éventuel P2/P3).

---

## 1) Définitions

- **Tenant** : identifiant logique client (ex. `rehtse`, `laplatine`, `dorevia`).
- **Univers** : application/source métier (ex. `odoo`, `sylius`, `pos`, etc.).
- **Scope** : couple `(tenant, univers)` associé à un token.
- **Token** : secret présenté par le client (Odoo, worker, etc.) pour appeler DVIG.

---

## 2) Exigences fonctionnelles

### 2.1 Auth obligatoire
- `POST /ingest` : **auth obligatoire**.
- `GET /health` : peut rester **public** (configurable), ou protégé en option.
- `GET /openapi.json` et `GET /docs` : **désactivables** ou **protégés** (recommandé en prod).

### 2.2 Mode d’auth
- Auth via **HTTP Bearer Token** :
  - `Authorization: Bearer <token>`
- Si l’en-tête est absent ou invalide → `401 Unauthorized`.

### 2.3 Scoping
Chaque token a :
- `tenant` (obligatoire)
- `univers` (obligatoire)
- `status` (active/disabled/revoked)
- `created_at`, `rotated_at` (optionnel)
- `comment` (optionnel)

Le DVIG doit :
- Valider le token.
- Injecter dans le contexte de requête : `auth.tenant`, `auth.univers`, `auth.token_id`.
- Logguer l’événement d’ingest avec `tenant` + `univers` (sans jamais logguer le token brut).

### 2.4 Rotation / révocation
- Rotation : possibilité d’avoir **2 tokens actifs** simultanément pour un même scope (old + new) pendant une fenêtre.
- Révocation : désactivation immédiate d’un token spécifique.

---

## 3) Exigences non fonctionnelles

- **Aucun secret en clair dans les logs**.
- Comparaison token en **constant time** (évite timing leaks).
- Stockage des tokens côté DVIG :
  - P1 : fichier de config (YAML) + variables d’env pour chemin/override.
- Résilience :
  - Si le fichier tokens est manquant/illisible → DVIG démarre mais refuse `/ingest` avec `503` (ou fail-fast selon option).
- Performances :
  - Lookup en mémoire (chargement au boot) + reload optionnel (SIGHUP ou intervalle).

---

## 4) Spécification API

### 4.1 POST /ingest (protégé)

#### Request
- Header requis :
  - `Authorization: Bearer <token>`
- Body : inchangé (P0).

#### Réponses
- `201 Created` : inchangé (P0) si token valide.
- `401 Unauthorized` : token absent/invalide
```json
{
  "detail": "Unauthorized"
}
```
- `403 Forbidden` : token valide mais **scope non autorisé** (cas rare : token connu mais interdit pour cet endpoint)
```json
{
  "detail": "Forbidden"
}
```
- `429 Too Many Requests` : (optionnel P1) rate-limit déclenché
- `503 Service Unavailable` : backend auth non prêt (ex. config tokens indisponible)

### 4.2 GET /health
- Par défaut : public (P0)
- Option : protégé par env `DVIG_HEALTH_PROTECTED=1`

### 4.3 /docs & /openapi.json
- Par défaut :
  - LAB : ouvert
  - PROD : protégé ou désactivé
- Contrôle par variables :
  - `DVIG_DOCS_ENABLED=1|0`
  - `DVIG_OPENAPI_ENABLED=1|0`
  - `DVIG_DOCS_PROTECTED=1|0` (si activé)

---

## 5) Modèle de configuration

### 5.1 Fichier tokens (YAML) — P1

**Chemin** (ordre de priorité) :
1. `DVIG_TOKENS_FILE`
2. `/etc/dvig/tokens.yml`
3. `./conf/tokens.yml` (dev)

**Format recommandé** :

```yaml
version: 1
tokens:
  - id: "tok_001"
    token_hash: "sha256:3b6c...hex..."
    tenant: "rehtse"
    univers: "odoo"
    status: "active"     # active|disabled|revoked
    created_at: "2025-12-27T00:00:00Z"
    comment: "Odoo LAB rehtse"
  - id: "tok_002"
    token_hash: "sha256:9a10...hex..."
    tenant: "rehtse"
    univers: "odoo"
    status: "active"
    comment: "Rotation token (new)"
```

### 5.2 Token brut vs hash (important)
- DVIG **ne stocke jamais** le token brut.
- Stockage uniquement d’un `token_hash`.
- Algorithme P1 : `SHA-256(token)` (simple, suffisant pour P1 si tokens longs et aléatoires)
- Recommandation : tokens générés en base64url (32+ bytes).

> Note : P2 pourra migrer vers `argon2id` (hachage “password-grade”). En P1, SHA-256 est acceptable si tokens sont high-entropy.

---

## 6) Génération des tokens

### 6.1 Format
- Token : `dvig_<base64url>` (lisible, prefixable)
- Longueur : >= 32 bytes aléatoires (avant encodage)

### 6.2 Commande de génération (référence)
Exemple (Linux/macOS) :
```bash
python - << 'PY'
import secrets, base64, hashlib
raw = secrets.token_bytes(32)
token = "dvig_" + base64.urlsafe_b64encode(raw).rstrip(b"=").decode()
h = hashlib.sha256(token.encode()).hexdigest()
print("TOKEN=", token)
print("HASH = sha256:" + h)
PY
```

---

## 7) Contrôles & règles d’autorisation

### 7.1 Validation du header
- Si `Authorization` absent → 401
- Si schéma != `Bearer` → 401
- Si token vide → 401

### 7.2 Lookup
- Calculer `sha256(token)` et comparer avec `token_hash` (constant time).
- Si non trouvé → 401
- Si trouvé mais `status != active` → 401

### 7.3 Contexte injecté
Dans le handler `/ingest`, conserver la réponse P0 **inchangée**, mais :
- associer l’événement à `tenant` + `univers`
- enrichir les logs :
  - `event_id`, `tenant`, `univers`, `source`, `event_type`

---

## 8) Observabilité & logs

### 8.1 Logs d’accès (recommandé)
- Log minimal par requête : `method`, `path`, `status_code`, `latency_ms`, `tenant`, `univers`
- Jamais le token brut.

### 8.2 Logs d’ingestion
Au moment d’accepter un event :
- `event_id`
- `tenant`, `univers`
- `source`, `event_type`
- `ts`

---

## 9) Sécurité & durcissement (P1)

- `DVIG_DOCS_ENABLED=0` en prod.
- CORS désactivé par défaut (sauf besoin).
- Body size limit (option P1) via middleware / reverse proxy.
- Rate limit (option P1) : simple token-bucket par `token_id` (sinon P2).

---

## 10) Critères d’acceptation (DoD P1)

### 10.1 Cas OK
- `POST /ingest` avec token valide → `201`
- Les logs contiennent `tenant` + `univers` + `event_id`

### 10.2 Cas KO
- Sans header → `401`
- Bearer invalide → `401`
- Token révoqué/disabled → `401`
- Docs désactivés en prod → `/docs` retourne `404` (ou `403` si protégé)

### 10.3 Audit minimal
- Le fichier tokens.yml est versionné (ou géré via secret manager), avec traçabilité des rotations.
- Aucun token brut en repo.

---

## 11) Plan d’implémentation

1. Ajouter module `dvig/api_fastapi/auth/`
   - `auth.py` : dépendance FastAPI (Depends) pour valider le token
   - `tokens_store.py` : chargement YAML + cache mémoire
2. Middleware / dependency injection sur `/ingest`
3. Variables d’environnement (ci-dessous)
4. Tests (pytest) :
   - `test_ingest_auth_missing`
   - `test_ingest_auth_invalid`
   - `test_ingest_auth_ok`
5. Docker/compose :
   - Monter `tokens.yml` en volume read-only en prod

---

## 12) Variables d’environnement (P1)

- `DVIG_TOKENS_FILE` : chemin vers `tokens.yml`
- `DVIG_AUTH_ENABLED` : `1|0` (default `1`)
- `DVIG_HEALTH_PROTECTED` : `1|0` (default `0`)
- `DVIG_DOCS_ENABLED` : `1|0` (default `1` en lab, `0` en prod)
- `DVIG_OPENAPI_ENABLED` : `1|0` (default `1` en lab, `0` en prod)
- `DVIG_DOCS_PROTECTED` : `1|0` (default `0`)
- `DVIG_MAX_BODY_BYTES` : (option) limite taille payload

---

## 13) Notes d’intégration Odoo (P1)

Côté Odoo (ou worker) :
- Stocker le token dans une configuration sécurisée (param système, secret, env)
- Appeler DVIG avec :
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

---

## 14) Migration / compatibilité

- P0 reste fonctionnel en lab si `DVIG_AUTH_ENABLED=0` (temporaire).
- En prod, P1 impose `DVIG_AUTH_ENABLED=1`.

---

## 15) Annexes

### 15.1 Exemple curl protégé
```bash
TOKEN="dvig_xxxxxxxxx"
curl -X POST http://127.0.0.1:18120/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"manual.test","source":"odoo.lab.core","data":{"msg":"hello"}}'
```

---

Fin du document.
