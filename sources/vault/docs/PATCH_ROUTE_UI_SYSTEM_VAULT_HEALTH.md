# PATCH — Route GET /ui/system/vault-health manquante

**Date** : 2026-02-11  
**Contexte** : Badge intégrité Linky (SPEC LINKY LAYOUT v1.3) affiche « Intégrité non conforme »  
**Cause** : La route `GET /ui/system/vault-health` n'est pas enregistrée dans le point d'entrée Vault

---

## Diagnostic

| Élément | Statut |
|--------|--------|
| `internal/handlers/vault_health.go` | ✅ VaultHealthHandler existant |
| `internal/config/config.go` | ✅ DVIG_URL, DVIG_INTERNAL_TOKEN |
| Enregistrement route `/ui/system/vault-health` | ❌ **Manquant** |

Linky appelle `{VAULT_URL}/ui/system/vault-health?tenant=...` → 404 → `vaultStatus = "error"` → STATE_ALERT (Intégrité non conforme).

---

## Correction

Dans le fichier qui enregistre les routes HTTP du Vault (ex. `cmd/vault/main.go` ou équivalent), **ajouter** :

```go
// Au sein du bloc où les routes /ui/* sont enregistrées, ajouter :

app.Get("/ui/system/vault-health", handlers.VaultHealthHandler(cfg.DvigURL, cfg.DvigInternalToken))
```

**Placement recommandé** : à côté des autres routes `/ui/system/*` ou `/ui/aggregations/*`, dans la section dédiée aux routes Linky.

**Variables requises** (déjà dans config) :
- `cfg.DvigURL` : URL DVIG (ex. `http://dvig-core-stinger:8080`)
- `cfg.DvigInternalToken` : Token Bearer pour appeler `GET {DVIG_URL}/internal/vault-health`

Si `DvigURL` ou `DvigInternalToken` sont vides, le handler retourne `vault_rate: null, pending_events: 0, failed_events: 0, last_sync_at: null` (comportement stub).

---

## Vérification post-déploiement

```bash
curl -s "http://vault-core-stinger:8080/ui/system/vault-health?tenant=sarl-la-platine"
```

Réponse attendue (exemple) :
```json
{"vault_rate":1,"pending_events":0,"failed_events":0,"last_sync_at":"2026-02-11T08:42:00Z"}
```

---

## Note

Le répertoire `cmd/vault/` est actuellement vide dans cette branche. Le `main.go` qui enregistre les routes est probablement dans une autre branche ou build. Ce patch doit être appliqué dans le fichier d'enregistrement des routes du Vault déployé.
