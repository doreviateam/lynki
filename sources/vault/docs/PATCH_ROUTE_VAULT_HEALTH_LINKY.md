# PATCH — Route GET /ui/system/vault-health (Linky Integrity Badge)

**Date** : 2026-02-11  
**Contexte** : SPEC LINKY LAYOUT v1.3, Integrity State Machine — badge « Intégrité non conforme » affiché car la route n’existe pas.  
**Réf** : SPEC_INDICATEUR_CONFIANCE_VAULTAGE_LINKY_v1.0, ZeDocs/web21/SPEC_LINKY_LAYOUT_HEADER_FOOTER_v0.1.md

---

## 1. Problème

Linky appelle `GET {VAULT_URL}/ui/system/vault-health?tenant={tenant}` pour alimenter le badge d’intégrité (IntegrityBadge).  
Si cette route n’est pas enregistrée → 404 → `vault_status = "error"` → badge **✖ Intégrité non conforme**.

Le handler `VaultHealthHandler` existe dans `internal/handlers/vault_health.go` mais **n’est pas enregistré** dans l’application Fiber.

---

## 2. Correction à appliquer

### 2.1 Emplacement

Dans le **point d’entrée** du service Vault qui construit l’app Fiber et enregistre les routes (ex. `cmd/vault/main.go`), au même endroit que les autres routes `/ui/*` (aggregations, companies, bank-reconciliation-health).

### 2.2 Code à ajouter

**Import** (si pas déjà présent) :
```go
"github.com/doreviateam/dorevia-vault/internal/handlers"
```

**Enregistrement de la route** (dans le bloc où les routes UI sont enregistrées) :
```go
// SPEC Indicateur Confiance Vaultage Linky v1.0 + SPEC LINKY LAYOUT v1.3
app.Get("/ui/system/vault-health", handlers.VaultHealthHandler(cfg.DvigURL, cfg.DvigInternalToken))
```

### 2.3 Variables d’environnement

Le handler utilise :
- `DVIG_URL` — URL du DVIG (ex. `http://dvig-core-stinger:8080`)
- `DVIG_INTERNAL_TOKEN` — Token Bearer pour appeler `GET {DVIG_URL}/internal/vault-health`

Si `DVIG_URL` ou `DVIG_INTERNAL_TOKEN` est vide, le handler retourne une réponse stub (vault_rate: null, pending_events: 0, etc.) avec HTTP 200.

### 2.4 RBAC (optionnel)

Si le Vault utilise RBAC pour les routes `/ui/*`, ajouter dans `internal/auth/rbac.go` :
```go
"/ui/system/vault-health": PermissionReadDocuments,
```

---

## 3. Vérification après déploiement

```bash
curl -s "http://vault-core-stinger:8080/ui/system/vault-health?tenant=sarl-la-platine"
```

Réponse attendue (exemple) :
```json
{
  "vault_rate": 1.0,
  "pending_events": 0,
  "failed_events": 0,
  "last_sync_at": "2026-02-11T14:30:00Z"
}
```

Ou stub si DVIG non configuré :
```json
{
  "vault_rate": null,
  "pending_events": 0,
  "failed_events": 0,
  "last_sync_at": null
}
```

---

## 4. Chaîne d’appel

```
Linky (IntegrityBadge)
  → GET /api/platform/status?tenant=...
  → Linky API route.ts fetch VAULT_URL/ui/system/vault-health?tenant=...
  → Vault VaultHealthHandler
  → GET {DVIG_URL}/internal/vault-health?tenant=... (Authorization: Bearer DVIG_INTERNAL_TOKEN)
  → DVIG retourne vault_rate, pending_events, failed_events, last_sync_at
  → Vault renvoie JSON à Linky
```

**Note** : Linky accepte `vault_rate` en ratio 0–1 ou en % 0–100 (normalisation automatique). Le calcul `integrity_state` utilise 0–1 (STATE_OK si >= 0.98 en LAB, 1.0 en PROD).

---

## 5. Fichiers concernés

| Fichier | Action |
|---------|--------|
| `cmd/vault/main.go` | Ajouter `app.Get("/ui/system/vault-health", ...)` |
| `internal/auth/rbac.go` | Optionnel : mapper la route à PermissionReadDocuments |
| `internal/handlers/vault_health.go` | Existant, aucune modification |
| `internal/config/config.go` | Existant, `DvigURL` et `DvigInternalToken` déjà définis |

---

---

## 6. Implémentation réalisée (2026-02-11)

### 6.1 Package minimal `internal/server/minimal.go`

Handlers autonomes sans dépendance storage : `Health`, `Version`, `Home`, `VaultHealthHandler`.

### 6.2 Point d'entrée `cmd/vault/main.go`

Main minimal qui expose uniquement :
- `/`, `/health`, `/version`
- `/ui/system/vault-health`

### 6.3 Image de test

```bash
docker build -t dorevia/vault:v1.8.0-vault-health .
```

**Attention** : cette image est **minimale** (4 routes uniquement). Elle ne peut **pas** remplacer le Vault de production (manque events, proof, aggregations, etc.). Utilisable pour tester la route vault-health en isolation.

### 6.4 Intégration au Vault complet

Pour ajouter la route au Vault de production (v1.9.x, v1.8.x, etc.), dans le `main.go` complet qui enregistre toutes les routes, ajouter :

```go
app.Get("/ui/system/vault-health", handlers.VaultHealthHandler(cfg.DvigURL, cfg.DvigInternalToken))
```

Puis rebuild et redéployer. Les variables `DVIG_URL` et `DVIG_INTERNAL_TOKEN` doivent être définies dans le compose du Vault.

---

## 7. Fallback Linky (solution immédiate sans rebuild Vault)

Lorsque le Vault en production n’a pas la route `/ui/system/vault-health` (404), Linky peut **appeler directement le DVIG** en fallback. Cela permet au badge d’intégrité de fonctionner sans attendre le rebuild du Vault complet.

### 7.1 Principe

1. Linky appelle d’abord `{VAULT_URL}/ui/system/vault-health` (comportement standard).
2. Si **404** et que `DVIG_URL` + `DVIG_INTERNAL_TOKEN` sont configurés → appel direct `{DVIG_URL}/internal/vault-health` avec `Authorization: Bearer {token}`.
3. Le DVIG retourne le même format JSON (vault_rate, pending_events, etc.).

### 7.2 Configuration

**Manifest** (`tenants/<tenant>/state/manifest.json`) — ajouter `linky_dvig_url` :
```json
"linky_dvig_url": "http://dvig-core-stinger:8080"
```

**Variable d’environnement** : au déploiement du compose Linky, définir `DVIG_INTERNAL_TOKEN` (même valeur que dans le compose platform du Vault) :
- Via `.env` dans le répertoire du projet UI
- Ou `export DVIG_INTERNAL_TOKEN=xxx` avant `docker compose up`

### 7.3 Régénération et déploiement

```bash
# Régénérer les compose UI (lab + stinger)
./lib/render/render_app_compose.sh sarl-la-platine ui lab
./lib/render/render_app_compose.sh sarl-la-platine ui stinger

# Copier le rendu vers apps si votre workflow l'exige
# cp tenants/sarl-la-platine/rendered/lab/ui/docker-compose.yml tenants/sarl-la-platine/apps/ui/lab/

# Avec DVIG_INTERNAL_TOKEN défini (même valeur que platform core-stinger)
cd tenants/sarl-la-platine/apps/ui/lab  # ou utiliser rendered/.../ui/
export DVIG_INTERNAL_TOKEN=<valeur_du_compose_platform>
docker compose up -d linky
```

### 7.4 Build image Linky avec fallback

```bash
cd units/dorevia-linky
docker build -t dorevia/linky:v1.3-layout .
```

### 7.5 Fallback étendu (2026-02-16)

Le fallback s’active également si :
- Le Vault renvoie une **erreur HTTP** autre que 404 (500, 503, etc.)
- Une **erreur réseau** survient (timeout, connexion refusée)

Dans ces cas, Linky tente immédiatement l’appel direct au DVIG.

### 7.6 Persistance de la configuration

Créer un fichier `.env` dans chaque environnement UI pour éviter de ré-exporter le token à chaque redémarrage :

```
# tenants/sarl-la-platine/apps/ui/lab/.env
# tenants/sarl-la-platine/apps/ui/stinger/.env
DVIG_INTERNAL_TOKEN=<valeur_identique_compose_platform>
```

---

## 8. Limitations connues (2026-02-16)

| Composant | Image | Limitation |
|-----------|-------|------------|
| **DVIG** | 0.1.6 | Ne contient pas `/internal/vault-health` → fallback Linky inefficace si seul DVIG est utilisé |
| **DVIG** | 0.1.7+ | Build échoue : `workers/outbox_worker.py` absent du dépôt (présent uniquement dans l’image 0.1.6) |
| **Vault** | v1.8.x | Route `/ui/system/vault-health` non enregistrée dans le main complet (main minimal uniquement dans ce dépôt) |

**Solution actuelle** : le badge « Données scellées » fonctionne lorsque la chaîne Vault ou DVIG expose une route répondant au format attendu (vault_rate, pending_events, failed_events, last_sync_at). La configuration Linky (fallback + .env) reste en place pour les déploiements futurs.

---

## 9. État final (2026-02-16)

- **IntegrityBadge** : affiche ✔ Données scellées lorsque les données sont conformes
- **Linky** : image `dorevia/linky:v1.3-layout` avec fallback Vault → DVIG
- **Configuration** : manifest `linky_dvig_url`, compose avec `DVIG_URL` et `DVIG_INTERNAL_TOKEN`, fichiers `.env` pour persistance

---

**Fin du patch**
