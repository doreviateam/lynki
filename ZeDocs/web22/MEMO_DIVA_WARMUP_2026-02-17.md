# Mémo — DIVA Warmup Runner (mémoire rapide)

**Date** : 2026-02-17  
**Rapport détaillé** : `RAPPORT_IMPLEMENTATION_DIVA_WARMUP_DETAILLE_2026-02-17.md`

---

## En bref

- **Prewarm** : appel fire-and-forget à DIVA à chaque chargement Linky (réduit latence perçue)
- **Runner** : pré-calcul des contextes CODIR (mois courant, exercice à date) toutes les 2 min
- **Store Postgres** : analyses persistantes (plus de perte au redémarrage)
- **Company 0** : « Tout » dans Linky = `company_id=0` — runner doit inclure 0 et 1

---

## Déploiement lab

```bash
# 1. Migration (une fois)
docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault < sources/vault/migrations/025_create_diva_analysis.sql

# 2. units/diva/.env
DIVA_DATABASE_URL=postgres://vault:vault_password@vault-db-core-stinger:5432/dorevia_vault
RUNNER_ENABLED=true
RUNNER_TENANT_CONFIG=sarl-la-platine:0,1
LINKY_URL=http://linky_lab_sarl-la-platine:3000
DIVA_URL=http://diva:8010

# 3. Démarrer
cd units/diva && docker compose up -d diva diva-runner
```

---

## UX Linky (DivaFlashBlock)

| Élément | Détail |
|---------|--------|
| Données utilisées | 2 colonnes, bloc `<details>` replié par défaut |
| Bouton Rafraîchir | Visible, force recalcul |
| Cache navigateur | 5 min, conservé si 404/timeout au refresh |
| « Analyse déjà en cours » | Non mise en cache (état transitoire) |

---

## Périodes alignées Linky

- **YTD** : 1er janv → **dernier jour du mois** (pas today) — correspond à « Exercice à date »
- **current_month** : 1er du mois → today

---

## Commandes utiles

```bash
./scripts/diagnostic_diva_async.sh
./scripts/redeploy_diva_stack.sh --linky
```

---

**Fin du mémo.**
