# Rapport d’avancement — ADR-001 Linky → Vault only

**Date :** 2026-03-15  
**Référence :** PLAN_IMPLEMENTATION_ADR001_LINKY_VAULT_ONLY_v1.0.md

---

## Lots réalisés

### Lot 0 — Prérequis Vault ✅

- **V0.1** Config : `DLP_URL`, `DIVA_URL`, `DLP_TIMEOUT_MS`, `DIVA_TIMEOUT_MS`, `DIVA_PREWARM_TIMEOUT_MS`, `DIVA_REFRESH_TIMEOUT_MS` ajoutés dans `sources/vault/internal/config/config.go`.
- **V0.2–V0.4** Contraintes gateway, erreurs normalisées (`code`, `message`, `request_id`), journalisation sans body : documentées et implémentées dans `handlers/dlp_ui.go` et `handlers/diva_ui.go`.

### Lot 1 — Vault routes Palier 1 ✅

- **V1.1** GET `/ui/dlp/energy-summary` : handler `DLPEnergySummaryHandler` dans `internal/handlers/dlp_ui.go`, enregistré dans `server/replay.go`.
- **V1.2** Routes DIVA : GET `/ui/diva/insights`, POST `/ui/diva/generate`, POST `/ui/diva/explain`, POST `/ui/diva/explain/async`, GET `/ui/diva/jobs/:contextHash` dans `internal/handlers/diva_ui.go`, enregistrées dans `server/replay.go`.

### Lot 2 — Linky Palier 1 ✅

- **L2.1** `app/api/dashboard-metrics/route.ts` : tuile strategic_energy appelle `VAULT_URL + "/ui/dlp/energy-summary"` ; suppression de `DLP_URL`.
- **L2.2** `app/api/dlp/energy-summary/route.ts` : appelle `VAULT_URL + "/ui/dlp/energy-summary"` ; suppression de `DLP_URL`.
- **L2.3** Toutes les routes `app/api/diva/*` (insight, prewarm, refresh, jobs, explain, explain/async) : appellent `VAULT_URL + "/ui/diva/..."` ; plus aucune référence à `DIVA_URL` dans `app/api`.
- **L2.4** La grille et la tuile Énergie passent par le Vault (via dashboard-metrics et energy-summary).

**Vérification :** `grep -r "DLP_URL\|DIVA_URL" units/dorevia-linky/app/api` → aucun résultat.

### Lot 3 — Vault routes admin DLP ✅

- **V3.1** Routes Vault : GET/POST `/ui/dlp/companies`, GET/POST `/ui/dlp/dlps`, GET/PATCH `/ui/dlp/dlps/:id`, GET/POST `/ui/dlp/perimeters`, PATCH `/ui/dlp/perimeters/:id`, GET/POST `/ui/dlp/project-perimeter-map`, DELETE `/ui/dlp/project-perimeter-map/:id`. Handlers `DLPProxyHandler` et `DLPProxyIDHandler` dans `dlp_ui.go`, enregistrement dans `server/replay.go`.

### Lot 4 — Linky admin DLP → Vault ✅

- **L4.1** Toutes les routes `app/api/dlp/*` (companies, dlps, perimeters, project-perimeter-map, decisions, sync-companies) passent par le Vault via `dlpClient.ts`.
- **L4.2** `app/lib/dlpClient.ts` : réécriture vers `VAULT_URL` ; transformation des chemins `/api/v1/xxx` → `/ui/dlp/xxx` ; plus aucune référence à `DLP_URL`.

**Vérification :** `grep -r "DLP_URL\|DIVA_URL" units/dorevia-linky` (fichiers .ts, .tsx, .js, .jsx) → aucun résultat. Conformité ADR-001 côté code Linky atteinte pour DLP/DIVA.

---

### Lot 5 — Nettoyage et contrôle CI ✅ (partiel)

- **L5.3** Script `units/dorevia-linky/scripts/check-adr001-no-dlp-diva.sh` + `npm run check:adr001` ; workflow `.github/workflows/adr001-linky-conformity.yml` qui échoue si `DLP_URL` ou `DIVA_URL` apparaît dans le code source Linky.
- **L5.1** Note `ZeDocs/web51/NOTE_LOT5_NETTOYAGE_ENV_LINKY.md` : liste des variables à retirer des runbooks/doc Linky, et sort de `DIVA_PREWARM_ENABLED` à trancher.

**Reste Lot 5 (optionnel) :** mise à jour explicite des runbooks/doc déploiement existants ; mise à jour des tests unit/e2e si des mocks référencent encore DLP/DIVA.

---

## Déploiement

- **Vault** : définir `DLP_URL` et `DIVA_URL` (et timeouts optionnels) pour activer les gateways. Si vides, les routes retournent 503 `gateway_unconfigured`.
- **Linky** : seul `VAULT_URL` est requis ; `DLP_URL` et `DIVA_URL` ne sont plus lus nulle part dans le code Linky (Palier 1 + admin DLP).

---

*ZeDocs/web51 — 2026-03-15.*
