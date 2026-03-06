# Résumé : pourquoi le vaultage met 1–2 minutes

**Objectif** : facture validée → statut « Protégée » en ≤ 30 s.  
**En pratique** : souvent 1–2 min.

---

## En une phrase

Le **traitement technique** (Odoo → DVIG → Vault) est rapide (quelques secondes). Le délai venait surtout du **fetch_proof** qui n’était pas enqueued tout de suite (ou bloqué par un garde 10 s) ; correction : enqueue systématique après envoi à DVIG + filet de sécurité si `forwarded_source_ids` vide. Backoff fetch_proof : paliers +0,25 s (max 10 s).

---

## La chaîne en 3 blocs

| Étape | Rôle | Vitesse observée |
|-------|------|------------------|
| **1. Odoo → DVIG** | Queue job déclenche l’envoi vers DVIG | Rapide (job + POST) |
| **2. DVIG → Vault** | Envoi de l’événement, Vault stocke + scelle | Très rapide (~20–40 ms) |
| **3. Odoo récupère la preuve** | Job « fetch proof » qui appelle GET proof jusqu’à « Protégée » | C’est ici que le temps s’accumule (retries 1, 2, 4, 8, 20 s) |

Donc : **pas de lenteur côté Vault ni DVIG** ; le temps part surtout dans l’**attente entre les tentatives** de récupération de preuve dans Odoo.

---

## Que faire si on veut aller plus vite ?

1. **Backoff fetch proof** : paliers de +0,25 s (0,25 → 0,5 → 0,75 → 1 → …), plafond 10 s. Défini dans `dorevia_vault_connector/models/account_move.py` (`_calculate_fetch_proof_retry_delay`).
2. **S’assurer que fetch proof est bien déclenché** juste après l’envoi DVIG (queue_job) — déjà le cas si le job runner tourne (voir `./scripts/check_queue_job_runner.sh`).
3. **Accepter 1–2 min** si la priorité est la robustesse (retries) plutôt que la vitesse.

---

## « Il faut attendre » — pourquoi et quoi faire

Le vaultage est **volontairement asynchrone** : la validation (ou le post POS) ne bloque pas sur un appel HTTP. Le job est **enqueued tout de suite**, mais un **worker** le prend en charge quelques secondes plus tard (poll ou NOTIFY selon la config queue_job). D’où la sensation d’attente.

**Leviers pour réduire l’attente perçue :**

| Levier | Effet |
|--------|--------|
| **Internal outbox** | `dorevia.dvig.internal.url` + token corrects → le document part vers le Vault dans la même séquence que l’ingest ; fetch_proof trouve la preuve au 1er ou 2e essai. |
| **Workers dorevia_vault** | Au moins 2 workers (`channels = root:2,dorevia_vault:2` dans odoo.conf) pour que les jobs soient pris rapidement. |
| **Runner actif** | Le processus qui exécute les jobs queue_job doit tourner (voir `./scripts/check_queue_job_runner.sh`). |

**Option UX (non implémentée)** : afficher dès l’affichage de la facture un texte du type « Sécurisation automatique en cours (quelques secondes)… » lorsque le statut est « À protéger », pour rassurer l’utilisateur que le processus est bien lancé.

---

## Scripts utiles (optionnel)

- **Queue Odoo** : `./scripts/check_queue_job_runner.sh` → le runner tourne-t-il ?
- **Durée DVIG → Vault** : `./scripts/check_dvig_forward_duration.sh` → confirmer que c’est bien ~20–40 ms.
- **Diagnostic > 120 s** : `./scripts/diagnostic_vault_plus_de_120s.sh [id_facture]` → jobs en attente, crons.

Les autres docs (QUEUE_JOB_NE_FAIT_PAS_SON_BOULOT, DVIG_DUREE_VAULT, VAULT_DUREE_TRAITEMENT) détaillent chaque bout de la chaîne si besoin.
