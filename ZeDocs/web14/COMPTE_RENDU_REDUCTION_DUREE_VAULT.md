# Compte rendu — Réduction de la durée du processus vault

**Date** : février 2026  
**Contexte** : Objectif ≤ 15–30 s entre validation d’une facture et statut « Protégée ». En pratique : 1–2 minutes.  
**Résultat** : Durée ramenée à quelques secondes après correction.

---

## 1. Contexte et objectif

- **Chaîne** : Odoo (validation facture) → DVIG → Vault → statut « Protégée » dans Odoo.
- **Objectif** : Réduire le délai perçu (cible ≤ 30 s, idéalement ≤ 15 s).
- **Constats initiaux** : Durée observée entre 1 et 2 minutes ; sentiment que « la queue ne fait pas son boulot ».

---

## 2. Investigations réalisées

### 2.1 Queue_job (Odoo)

- **Question** : Le job runner queue_job tourne-t-il et exécute-t-il les jobs vault ?
- **Vérification** : Script `scripts/check_queue_job_runner.sh` + examen des logs Odoo.
- **Résultat** : Le job runner est actif ; les jobs « Trigger DVIG worker » et « Fetch proof » sont bien enqueués et exécutés (logs « Worker DVIG déclenché via queue_job », « asking Odoo to run job », HTTP 200 sur `/queue_job/runjob`). **La queue faisait son travail.**

### 2.2 DVIG → Vault

- **Question** : Où part le temps côté DVIG ?
- **Vérification** : Script `scripts/check_dvig_forward_duration.sh` sur les logs DVIG (`outbox_event_forwarded`, `duration_seconds`).
- **Résultat** : Envoi DVIG → Vault en **~20–40 ms**. **Pas de goulot d’étranglement côté DVIG.**

### 2.3 Vault (traitement)

- **Question** : Le traitement Vault (store + JWS + ledger) est-il lent ?
- **Analyse** : Le handler `POST /api/v1/events` fait tout de façon **synchrone** ; la réponse 200 est renvoyée une fois le document stocké et « verified ». Les durées vues par DVIG (20–40 ms) incluent déjà cette étape.
- **Résultat** : **Pas de lenteur côté Vault.** Documentation ajoutée : `VAULT_DUREE_TRAITEMENT.md` ; log `duration_ms` dans le handler events (optionnel).

### 2.4 Ciblage : fetch_proof (Odoo)

- **Conclusion** : Le délai venait du **moment et de la fréquence** des tentatives de récupération de la preuve (job « fetch proof ») dans Odoo, pas de DVIG ni de Vault.
- **Piste** : Soit le job fetch_proof n’était pas enqueued juste après l’envoi à DVIG, soit le backoff entre les retries était trop espacé.

---

## 3. Modifications apportées

### 3.1 Backoff fetch_proof (account_move.py)

- **Avant** : Délais entre retries : 1 s, 2 s, 4 s, 8 s, 20 s (entiers).
- **Après** : Paliers de **+0,25 s** : 0,25 s, 0,5 s, 0,75 s, 1 s, … (plafond 10 s), avec petit jitter. Retour en float pour préserver les fractions de seconde.
- **But** : Réduire le temps d’attente entre deux tentatives quand la preuve n’est pas encore disponible.

### 3.2 Enqueue fetch_proof dans job_trigger_worker (dorevia_dvig_service.py)

- **Problème identifié** : Après envoi des factures à DVIG `/ingest`, le code mettait à jour `dorevia_vault_last_try_at`. Ensuite, l’enqueue de `job_vault_fetch_proof` (à partir de `forwarded_source_ids` renvoyé par DVIG) passait par `_can_enqueue_proof()`, qui **refuse** d’enqueuer si une tentative a eu lieu il y a moins de 10 secondes. Dans la même exécution du job, on venait de mettre `last_try_at` à l’instant T → **aucun fetch_proof n’était jamais enqueued** dans ce flux. Seul le CRON (toutes les 1 minute) lançait le fetch → délai 1–2 min.
- **Correction 1** : Dans le bloc qui enqueue fetch_proof à partir de `forwarded_source_ids`, **suppression de l’appel à `_can_enqueue_proof()`** : dans ce contexte, on est la source légitime qui vient de traiter l’outbox ; l’`identity_key` évite les doublons.
- **Correction 2** : **Filet de sécurité** : mémorisation des factures envoyées à `/ingest` dans une liste `moves_sent_to_ingest`. En fin de job, pour chaque facture de cette liste encore en `pending_proof`, enqueue d’un `job_vault_fetch_proof` si besoin (cas où `forwarded_source_ids` est vide ou incomplet). Même `identity_key` que le chemin principal → pas de doublon.

### 3.3 Documentation et scripts

- **ZeDocs/web14/RESUME_DUREE_VAULT.md** : Résumé grand public (une phrase + chaîne en 3 blocs + quoi faire pour aller plus vite).
- **ZeDocs/web14/QUEUE_JOB_NE_FAIT_PAS_SON_BOULOT.md** : Vérifications si la queue semble inactive.
- **ZeDocs/web14/DVIG_DUREE_VAULT.md** : Rôle de DVIG et vérification des durées d’envoi.
- **ZeDocs/web14/VAULT_DUREE_TRAITEMENT.md** : Traitement synchrone Vault et vérification `duration_ms`.
- **Scripts** : `check_queue_job_runner.sh`, `check_dvig_forward_duration.sh`, `check_vault_event_duration.sh` (après déploiement du log Vault).

---

## 4. Résultat

- **Avant** : Passage à « Protégée » en **1–2 minutes** (fetch_proof essentiellement déclenché par le CRON).
- **Après** : Passage à « Protégée » en **quelques secondes** (fetch_proof enqueued immédiatement après l’envoi à DVIG, retries rapprochés si besoin).

---

## 5. Fichiers modifiés / créés (résumé)

| Fichier | Action |
|--------|--------|
| `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py` | Backoff fetch_proof : paliers +0,25 s (max 10 s), retour float |
| `units/odoo/custom-addons/dorevia_vault_connector/models/dorevia_dvig_service.py` | Enqueue fetch_proof sans garde 10 s ; filet de sécurité `moves_sent_to_ingest` |
| `sources/vault/internal/handlers/events.go` | Log `duration_ms` sur « Event vaulted successfully » |
| `ZeDocs/web14/RESUME_DUREE_VAULT.md` | Résumé et leviers |
| `ZeDocs/web14/QUEUE_JOB_NE_FAIT_PAS_SON_BOULOT.md` | Guide vérification queue_job |
| `ZeDocs/web14/DVIG_DUREE_VAULT.md` | Rôle DVIG et durées |
| `ZeDocs/web14/VAULT_DUREE_TRAITEMENT.md` | Traitement synchrone Vault |
| `scripts/check_queue_job_runner.sh` | Vérif. job runner queue_job |
| `scripts/check_dvig_forward_duration.sh` | Durées DVIG → Vault |
| `scripts/check_vault_event_duration.sh` | Durées traitement Vault (logs) |

---

## 6. Hook write() — passage à « posted » sans action_post()

Depuis la **SPEC Hook write() v1.1** (voir `SPEC_VAULT_HOOK_WRITE_POSTED_v1.0.md` et `PLAN_IMPLEMENTATION_HOOK_WRITE_POSTED_SCRUM.md`), tout passage d’une facture à l’état **posted** (y compris via `write({'state': 'posted'})` sans appel à `action_post()`) déclenche l’initialisation vault : statut `todo`, clé d’idempotence, et enqueue du worker DVIG. Cela couvre notamment les factures **POS** ou autres flux qui postent via `write()`. Les tests automatisés sont dans `dorevia_vault_connector.tests.test_hook_write_posted`.

---

## 7. En cas de régression

1. Vérifier que le job runner queue_job tourne : `./scripts/check_queue_job_runner.sh`.
2. Dans les logs Odoo après validation : chercher « Enqueued fetch_proof » ou « Enqueued fetch_proof (fallback) ».
3. Si la durée remonte : exécuter `./scripts/diagnostic_vault_plus_de_120s.sh [id_facture]` et consulter `RESUME_DUREE_VAULT.md` / `QUEUE_JOB_NE_FAIT_PAS_SON_BOULOT.md`.
