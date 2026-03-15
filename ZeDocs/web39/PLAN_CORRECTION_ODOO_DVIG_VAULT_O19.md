# Plan de correction optimal — Chaîne Odoo → DVIG → Vault (tenant o19)

**Objectif** : rétablir le processus pour que les paiements Odoo soient correctement vaultés et que Linky affiche les mêmes montants que l’ERP.

**Constat** : Vérification mars 2026 — Odoo 4 paiements / 4 387 €, Vault 4 docs / 1 297 €, `missing_odoo_ids: [1,2,3,4]`. La chaîne ne fonctionne pas.

### Pas de queue_job

**Nous nous passons de queue_job.** La chaîne Odoo → DVIG → Vault repose uniquement sur les **CRONs** :

- **CRON « Vault Send Payments »** (toutes les 2 min) : envoie vers DVIG `/ingest` les paiements en statut `todo` ou `failed_soft`.
- **CRON « Vault Fetch Proof Payments »** (toutes les 1 min) : récupère les preuves côté Vault pour les paiements en `pending_proof`.

Sans queue_job, `_enqueue_send_to_dvig()` ne fait rien ; les paiements marqués `todo` (après `action_post` ou backfill) sont pris en charge par le cron. Délai typique : jusqu’à 2 minutes avant envoi vers DVIG.

---

## Phase 1 — Diagnostic (identifier le maillon en défaut)

### 1.1 Token DVIG pour le tenant o19

- **Fichier** : `tenants/core-stinger/secrets/dvig.tokens.yml` — un token **o19** existe (`tok_lab_o19_003`).
- **Obligatoire** : Odoo doit utiliser le **token en clair** qui correspond à ce tenant (le fichier ne contient que le hash).
- **Vérification** : depuis la machine où tourne Odoo, le token doit être passé en `ODOO_DVIG_TOKEN` (ou `DVIG_TOKEN_O19` dans le compose). Si vide ou erroné, les appels à DVIG `/ingest` renvoient **401** et aucun événement n’entre dans l’outbox.

**Action** : S’assurer que `tenants/o19/apps/odoo/lab/docker-compose.yml` reçoit bien le token (ex. `DVIG_TOKEN_O19` défini dans l’environnement d’exécution ou dans un fichier `.env`). Régénérer un token pour o19 si besoin : `python -m dvig.cli.token_gen --tenant o19 --univers odoo`, puis ajouter le token dans le fichier des secrets et donner la valeur en clair à Odoo (variable d’environnement uniquement, jamais en dur dans le dépôt).

### 1.2 Configuration DVIG dans Odoo

- Odoo lit en priorité `ir.config_parameter`, puis les variables d’environnement **ODOO_DVIG_URL**, **ODOO_DVIG_TOKEN**, **ODOO_DVIG_SOURCE**, **ODOO_DVIG_TENANT**.
- **Vérification** : en shell Odoo (`docker compose exec odoo odoo shell -d odoo_lab_o19 ...`) exécuter :
  ```python
  cfg = env['dorevia.dvig.service'].get_dvig_config()
  print('dvig_url:', cfg['dvig_url'])
  print('token (présent):', bool(cfg['dvig_token']))
  print('source:', cfg['dvig_source'])
  print('tenant:', cfg['tenant'])
  ```
- **Attendu** : `dvig_url` non vide (ex. `http://dvig-core-stinger:8080`), `dvig_token` non vide, `dvig_source` = `odoo.lab.o19`, `tenant` = `o19`.

### 1.3 Envoi des paiements vers DVIG (cron uniquement)

- **Sans queue_job**, seul le **CRON « Vault Send Payments »** envoie les paiements (`todo` / `failed_soft`) vers DVIG. Il doit être **actif** et s’exécuter toutes les 2 min.
- **Vérification** : en shell Odoo, compter les paiements par statut vault :
  ```python
  Payment = env['account.payment'].sudo()
  domain = [('state', 'in', ('posted', 'paid', 'in_process', 'sent', 'reconciled'))]
  all_p = Payment.search(domain)
  from collections import Counter
  print(Counter(all_p.mapped('dorevia_vault_status')))
  # False/todo → backfill puis attendre le cron. pending_proof → attendre cron fetch proof ou worker DVIG.
  ```
- **Cron** : Paramètres → Technique → Actions planifiées — « Vault Send Payments » et « Vault Fetch Proof Payments ». Vérifier qu’ils sont **actifs** et exécutés récemment.

### 1.4 Outbox DVIG et worker

- DVIG traite l’outbox via un **scheduler** dans le même process (pas de container worker séparé). Les événements acceptés par `/ingest` sont traités par ce scheduler ou par l’appel **POST /internal/outbox/process** (déclenché par Odoo après envoi).
- **Vérification** : si possible, interroger la base DVIG (`outbox_events`) pour le tenant `o19` : nombre d’événements `accepted` ou `pending`, et statut après traitement. Ou consulter les **logs DVIG** (forward_success / forward_failed, erreurs Vault).

### 1.5 Vault et tenant

- Les événements sont envoyés au Vault avec le header **X-Tenant: o19**. Le Vault stocke les documents avec `tenant = 'o19'`. Linky appelle avec `tenant=o19`.
- **Vérification** : après correction, rappeler **GET /ui/aggregations/payments-completeness?tenant=o19&date_from=...&date_to=...&list_missing=1** et vérifier `erp_count == payments_count`, somme alignée, `missing_odoo_ids` vide.

---

## Phase 2 — Corrections (ordre recommandé)

### 2.1 Token O19 dans l’environnement Odoo

1. Obtenir ou régénérer un token DVIG pour le tenant **o19** (voir §1.1).
2. Définir **DVIG_TOKEN_O19** (ou **ODOO_DVIG_TOKEN**) dans l’environnement du conteneur Odoo o19 (fichier `.env` ou clés de déploiement), **sans** le commiter dans le dépôt.
3. Dans `tenants/o19/apps/odoo/lab/docker-compose.yml`, la variable est déjà prévue : `ODOO_DVIG_TOKEN: ${DVIG_TOKEN_O19:-}`. S’assurer que `DVIG_TOKEN_O19` est bien renseigné au moment du `docker compose up`.
4. Redémarrer le conteneur Odoo o19 après modification.

### 2.2 Backfill des paiements dans Odoo

1. Ouvrir un shell Odoo (voir §1.3).
2. Exécuter :
   ```python
   count = env['account.payment'].backfill_vault_todo()
   print('Paiements initialisés pour envoi:', count)
   ```
3. Cela marque en `todo` les paiements postés qui n’ont pas encore de `dorevia_vault_idempotency_key`, et les rend éligibles au cron « Vault Send Payments ».

### 2.3 Déclencher l’envoi et le worker

- **Option A** : Attendre le prochain passage du cron « Vault Send Payments » (toutes les 2 min).
- **Option B** : Exécuter manuellement le cron depuis Odoo (Paramètres → Technique → Actions planifiées → « Vault Send Payments » → Exécuter).
- Après chaque envoi réussi vers DVIG, le connecteur Odoo appelle **POST /internal/outbox/process** pour déclencher le traitement de l’outbox. Le scheduler DVIG traite aussi l’outbox périodiquement. Aucune action supplémentaire côté DVIG si le service tourne.

### 2.4 Vérifier DVIG et Vault

- **DVIG** : santé `GET /health`, logs sans erreur 401/403 sur `/ingest`, et sans erreur 5xx sur le forwarding vers le Vault.
- **Vault** : `ODOO_BANK_RECONCILIATION_URL_O19` déjà configuré dans le compose platform (appel Odoo pour payments-completeness). Aucun changement nécessaire si l’URL est correcte.

---

## Phase 3 — Validation

1. **Attendre 2–5 minutes** après le backfill et l’exécution du cron (et éventuellement un ou deux cycles du scheduler DVIG).
2. **Relancer la vérification** :
   ```bash
   docker run --rm --network dorevia-network curlimages/curl:latest -s \
     "http://vault-core-stinger:8080/ui/aggregations/payments-completeness?tenant=o19&date_from=2026-01-01&date_to=2030-12-31&list_missing=1"
   ```
   ou utiliser le script : `VAULT_URL=http://vault-core-stinger:8080 ./scripts/verifier_vaultage_o19.sh` (depuis un hôte ayant accès au réseau).
3. **Critères de succès** : `ok === true`, `erp_count === payments_count`, `erp_sum_amount_signed` proche de `payments_sum_amount_signed` (tolérance 0,01 €), `missing_odoo_ids` absent ou vide.
4. **Linky** : rafraîchir la carte Cash ; les encaissements/décaissements doivent refléter les montants Odoo (4 387 € pour la période concernée si c’est le cas dans l’ERP).

---

## Synthèse des causes probables (ordre de probabilité)

| Priorité | Cause | Action |
|----------|--------|--------|
| 1 | **Token DVIG manquant ou incorrect** dans l’environnement Odoo | Définir `DVIG_TOKEN_O19` (token en clair pour tenant o19), redémarrer Odoo. |
| 2 | **Paiements jamais marqués pour envoi** (pas de backfill après mise en place du connecteur) | Exécuter `env['account.payment'].backfill_vault_todo()` en shell Odoo. |
| 3 | **Cron « Vault Send Payments » inactif ou non exécuté** | Activer le cron, l’exécuter une fois à la main. Indispensable (pas de queue_job). |
| 4 | **Source / tenant incohérents** (source ≠ odoo.lab.o19 ou token ≠ tenant o19) | Vérifier `ODOO_DVIG_SOURCE=odoo.lab.o19` et token o19. |
| 5 | **Erreur réseau ou Vault** (DVIG ne peut pas joindre le Vault, ou 4xx/5xx) | Consulter les logs DVIG, vérifier l’URL et le header X-Tenant. |

---

## Implémentation (scripts)

- **Backfill + crons** : `tenants/o19/apps/odoo/lab/run_correction_vaultage_o19.sh` lance `run_correction_vaultage_o19.py` dans le shell Odoo (backfill_vault_todo + exécution des crons « Vault Send Payments » et « Vault Fetch Proof Payments »). Option `--verify` : attente 90 s puis `scripts/verifier_vaultage_o19.sh`.

## Références

- `DOCUMENT_REVUE_CODE_LINKY_VAULT_O19_2026-03.md` (§1.2 Diagnostic)
- `VERIFICATION_VAULTAGE_ODOO_O19.md`
- `scripts/verifier_vaultage_o19.sh`
- Connecteur Odoo : `units/odoo/custom-addons/dorevia_vault_connector/` (README, GUIDE_VAULTING_AUTO, dorevia_dvig_service.py)
