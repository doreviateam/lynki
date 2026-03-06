# Runbook — Complétude avant affichage (Phase DVIG)

**Référence :** SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1, GUIDE_RECETTE_PHASE_DVIG  
**Objectif :** Mise en production et dépannage du flux Odoo → DVIG → Vault → Linky

---

## 1. Démarrage des services

### Ordre recommandé

1. **PostgreSQL** (si Vault en local)
2. **Vault** — `http://localhost:8080` ou URL configurée
3. **DVIG** — `http://localhost:8000` ou URL configurée
4. **Odoo** — avec connecteur `dorevia_vault_connector`
5. **Linky** — `http://localhost:3000` ou URL configurée

### Variables d'environnement clés

| Service | Variable | Exemple |
|---------|----------|---------|
| Linky | `VAULT_URL` | `http://vault:8080` |
| Linky | `TENANT_ID` | `core` |
| Odoo | (Paramètres techniques) | cf. CONFIG_CRON_EXPECTED_COUNTS.md |

---

## 2. Vérification rapide

### 2.1 Vault opérationnel

```bash
curl -s "http://localhost:8080/health" | jq
```

### 2.2 Completeness snapshot

```bash
curl -s "http://localhost:8080/ui/completeness-snapshot?tenant=core&date_debut=2026-01-01&date_fin=2026-01-31" | jq
```

**Attendu :** `sealed_count`, `complete`, `expected_count` (si Phase DVIG alimentée).

### 2.3 CRON Odoo

Odoo → Paramètres → Technique → Actions planifiées → **Expected Counts Push (Phase DVIG)** = Actif.

---

## 3. Dépannage

### Symptôme : « X / — preuves » (Y absent)

**Cause :** CRON Expected Counts non exécuté ou config Odoo incomplète.

**Action :**
1. Vérifier `dorevia.dvig.url`, `dorevia.dvig.internal.token`, `dorevia.tenant`
2. Exécuter manuellement le CRON Expected Counts Push
3. Consulter les logs Odoo pour `push_expected_counts_skip` ou `expected_counts_push_failed`

### Symptôme : SyncInProgress ne disparaît jamais

**Cause :** Vault indisponible, timeout, ou une des 5 sources ne répond pas.

**Action :**
1. Vérifier que le Vault répond (cf. §2.1)
2. Vérifier les logs Next.js (Linky) : `[dashboard-metrics]` ou erreurs fetch
3. Timeout snapshot : 5 s (SPEC §5.1) — si dépassé, cartes bloquées

### Symptôme : Cartes visibles alors qu'incomplet

**Cause :** Comportement anormal (régression).

**Action :**
1. Vérifier `sealed_count_complete` dans la réponse `/api/dashboard-metrics`
2. Vérifier le cache sessionStorage (invalidation au changement de scope)

---

## 4. Logs utiles

| Composant | Où chercher |
|-----------|-------------|
| Odoo | `push_expected_counts_skip`, `expected_counts_pushed`, `expected_counts_push_failed` |
| Vault | Logs HTTP, erreurs DB |
| Linky (Next.js) | `[dashboard-metrics] Error`, `[platform/status]` |
| DVIG | Logs POST /internal/expected-counts |

---

## 5. Rollback

En cas de régression :

1. Désactiver le CRON Expected Counts Push dans Odoo (évite des envois inutiles)
2. Linky continuera d'utiliser le fallback 5 endpoints si snapshot indisponible
3. Le blocage strict reste actif : aucune carte si incomplet

---

*Runbook Complétude avant affichage — Phase DVIG.*
