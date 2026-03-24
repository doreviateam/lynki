# Lot 5 — Nettoyage env Linky (ADR-001)

**Référence :** PLAN_IMPLEMENTATION_ADR001_LINKY_VAULT_ONLY_v1.0.md, Lot 5 (L5.1).

---

## Variables à ne plus exiger pour Linky

Après implémentation des Lots 0 à 4, **Linky ne lit plus** les variables de connectivité suivantes. Elles doivent être **retirées des runbooks et de la doc de déploiement** Linky :

- `DLP_URL`
- `DIVA_URL`
- `DIVA_TIMEOUT_MS`
- `DIVA_PREWARM_TIMEOUT_MS`
- `DIVA_REFRESH_TIMEOUT_MS`

**Variable à trancher (feature flag vs connectivité) :**

- `DIVA_PREWARM_ENABLED` : flag fonctionnel (activer/désactiver le prewarm). La feature reste pilotée côté Linky sans URL directe vers DIVA. À documenter : soit on conserve ce flag dans la config Linky, soit on le migre côté Vault, soit on le supprime selon la décision produit.

---

## Contrôle CI (L5.3)

- **Script :** `units/dorevia-linky/scripts/check-adr001-no-dlp-diva.sh`
- **Commande :** `npm run check:adr001` (dans `units/dorevia-linky`)
- **Workflow :** `.github/workflows/adr001-linky-conformity.yml` — s’exécute sur push/PR touchant `units/dorevia-linky/**` ; échoue si `DLP_URL` ou `DIVA_URL` apparaît dans le code source (hors `.next`, `node_modules`).

---

*ZeDocs/web51 — 2026-03-15.*
