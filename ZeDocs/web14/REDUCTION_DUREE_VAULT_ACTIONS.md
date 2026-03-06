# Réduction de la durée du process de vaultage — Actions

**Objectif** : viser **≤ 15 s** (Odoo « Protégée ») et **≤ 30 s** (Linky à jour).  
**Réf.** : ZeDocs/web14/AVIS_DUREE_PROCESSUS_VAULT.md

---

## 1. Modifications code déjà appliquées

| Fichier | Modification |
|---------|--------------|
| `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py` | Backoff fetch_proof : **`[1, 2, 4, 8, 20]`** (1er retry 1 s, puis 2 s, 4 s, 8 s, 20 s) pour viser ≤ 30 s même en cas de 404 répétés. |
| `units/dorevia-linky/components/SalesCardWithPolling.tsx` | **POLL_INTERVAL_MS = 15_000** (15 s au lieu de 30 s). |
| `units/dorevia-linky/components/PurchasesCardWithPolling.tsx` | Idem. |
| Tests | `tests/test_spec_v1_1_1.py` : délais attendus mis à jour. |

**Effet** : en cas de 404 sur le premier GET proof, le retry intervient plus tôt ; Linky rafraîchit les cartes toutes les 15 s.

---

## 2. À faire côté déploiement (Odoo + DVIG)

### 2.1 Activer queue_job pour le vault (priorité 1)

Sans queue_job, Odoo attend les CRON (1 min + 30 s DVIG + 1 min) → **~2 min**. Avec queue_job, le flux est lancé juste après la validation → **~5–15 s**.

- **Odoo** : module **queue_job** installé ; dans la config (ex. `odoo.conf`) :
  - `server_wide_modules = web,queue_job`
  - `[queue_job]` avec channel dédié, ex. `channels = root:2,dorevia_vault:2`
- **Paramètres système Odoo** : `dorevia.dvig.internal.url` et `dorevia.dvig.internal.token` renseignés pour que le job appelle DVIG `/internal/outbox/process`.
- **Workers** : au moins 1 worker pour exécuter les jobs du channel `dorevia_vault`.

Vérification : après validation d’une facture, le statut doit passer à « Protégée » en **moins de 15–20 s** (hors incident réseau/Vault).

### 2.2 Optionnel : réduire l’intervalle DVIG (priorité 2)

Si des événements passent uniquement par le scheduler DVIG (pas par le job Odoo), réduire l’intervalle réduit l’attente.

- **Variable d’environnement** du conteneur DVIG :  
  `DVIG_SCHEDULER_INTERVAL=10` (au lieu de 30). Appliqué dans `tenants/core-stinger/platform/docker-compose.yml`. Redémarrer le conteneur DVIG pour prise en compte.

---

## 3. Récapitulatif

| Action | Où | Statut |
|--------|-----|--------|
| Premier retry fetch_proof à 2 s | Connecteur Odoo | ✅ Fait |
| Polling Linky 15 s | Linky | ✅ Fait |
| queue_job actif (channel dorevia_vault) | Déploiement Odoo | À vérifier |
| DVIG_SCHEDULER_INTERVAL=10 | Déploiement DVIG (compose core-stinger) | ✅ Appliqué |
| dorevia.dvig.internal.url / .token (Odoo) | Paramètres système | ✅ Appliqué via `./scripts/set_odoo_config_duree_vault_30s.sh` |

**Diagnostic durée ~98 s** (ex. test facture 1964) : si une facture met ~90–100 s pour « Protégée », vérifier (1) appel Odoo → `/internal/outbox/process` (timeout 10 s, 401, URL) ; (2) paramètres `dorevia.dvig.internal.url` et `dorevia.dvig.internal.token` dans Odoo ; (3) workers queue_job (channel dorevia_vault). Voir §2.2 pour DVIG_SCHEDULER_INTERVAL=10 (réduit de 30 à 10 s).

---

## 4. Résultat test (2026-02-08)

| Environnement | Facture | Durée jusqu’à « Protégée » | Objectif |
|---------------|---------|-----------------------------|---------|
| sarl-la-platine stinger | 1964 (avant correctifs) | ~98 s | ≤ 15 s — dépassé |
| sarl-la-platine stinger | 1965 (après correctifs) |  **En pratique : entre 1 et 2 minutes** (validation → « Protégée ») | ≤ 15 s (objectif) ; 1–2 min (observé) |

**À noter** : le script mesure le temps entre le démarrage du script et le passage en « vaulted », pas depuis le clic « Valider ». En conditions réelles, le vaultage est observé en **entre 1 et 2 minutes (moins de 2 min)** après validation.

Commande : `./scripts/test_duree_vault_sarl_la_platine.sh 1965`.
