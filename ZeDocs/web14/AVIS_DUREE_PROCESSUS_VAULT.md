# Avis — Durée du processus de vault « humainement » trop longue

**Constat** : La durée entre « Je valide une facture » et « Je vois Protégée / les chiffres dans Linky » peut sembler longue pour un utilisateur.

**Date** : 2026-02-08

---

## 1. Où part le temps ?

### Avec queue_job (recommandé)

| Étape | Qui | Délai typique |
|-------|-----|----------------|
| Validation facture → job enqueued | Odoo | quasi immédiat |
| job_trigger_worker : /ingest + /internal/outbox/process | Odoo worker | 1–5 s |
| DVIG → Vault (dans la même requête outbox/process) | DVIG | inclus ci‑dessus |
| job_vault_fetch_proof (1re tentative) | Odoo worker | 0–2 s |
| Si 404 : retry (backoff 5, 10, 20, 40, 120 s) | queue_job | **+5 s** (1er retry) puis plus si 404 répété |

**Résultat typique** : ~5–15 s jusqu’à « Protégée » en Odoo, si tout va bien. Dès que la preuve n’est pas dispo au premier GET (404), on ajoute **au moins 5 s** (premier retry).

### Sans queue_job (CRON uniquement)

| Étape | Délai |
|-------|--------|
| CRON #1 (Send DVIG) | **jusqu’à 1 min** (intervalle actuel) |
| DVIG scheduler (outbox → Vault) | **jusqu’à 30 s** (DVIG_SCHEDULER_INTERVAL=30) |
| CRON #2 (Fetch Proof) | **jusqu’à 1 min** |

**Résultat** : en pire cas **~2 à 2,5 minutes** entre validation et « Protégée ». C’est effectivement long pour un usage « humain » (attente devant l’écran).

### Côté Linky

- Polling des cartes : **30 s**. Donc même une fois la facture vaultée, le dashboard Linky peut mettre jusqu’à 30 s à afficher la mise à jour (ou au prochain rafraîchissement manuel).

---

## 2. Avis

**Oui, le processus peut être perçu comme trop long**, surtout si :

- **queue_job n’est pas activé** → attente CRON (1 min + 30 s + 1 min) très palpable.
- **Premier GET proof en 404** → ajout d’au moins 5 s (backoff actuel).
- **Linky** → jusqu’à 30 s avant de voir la nouvelle donnée.

Pour un utilisateur qui valide une facture et reste sur l’écran, un objectif raisonnable serait : **« Protégée » en Odoo en &lt; 10 s**, et **chiffres à jour dans Linky en &lt; 30 s** (ou dès rafraîchissement).

---

## 3. Objectifs de durée à se fixer

Cibles proposées, **de la validation de la facture** jusqu'à la visibilité du résultat :

| Métrique | Conservateur | Cible | Stretch |
|----------|--------------|--------|---------|
| **Odoo : statut « Protégée »** | ≤ 30 s | **≤ 15 s** | ≤ 10 s |
| **Linky : facture reflétée dans les cartes** | ≤ 60 s | **≤ 30 s** | ≤ 20 s |

**Recommandation** : viser la **cible** (15 s Odoo, 30 s Linky). Le stretch (10 s / 20 s) suppose queue_job actif + premier retry proof à 2 s + polling Linky à 15 s.

- **Odoo ≤ 15 s** : atteignable avec queue_job + backoff proof réduit (ex. 1er retry à 2 s). Les CRON restent un filet de sécurité, pas le chemin nominal.
- **Linky ≤ 30 s** : une fois la facture vaultée, le prochain cycle de polling (30 s aujourd'hui) ou un rafraîchissement manuel affiche la donnée ; avec polling à 15 s, on tend vers ≤ 20 s.

**Mesure** : timestamp à la validation (`action_post` / `dorevia_vault_status = 'todo'`) et au passage en `vaulted` ; côté Linky, timestamp de la réponse Vault qui inclut la facture (ou premier poll après vault). Objectif opérationnel : **P95 ≤ 15 s** (Odoo) et **P95 ≤ 30 s** (Linky) en environnement nominal (queue_job actif, DVIG/Vault disponibles).

---

## 4. Pistes d'amélioration (sans changer le contrat métier)


### 4.1 Déjà en place / à vérifier

- **Activer queue_job** (channel `dorevia_vault`, workers dédiés) pour éviter d’attendre les CRON. C’est le levier principal pour passer de ~2 min à ~5–15 s.
- **CRON à 1 min** (déjà le cas dans `ir_cron.xml`) : correct pour le fallback ; en prod on peut garder 1 min ou monter à 2–5 min si la charge CRON doit être réduite.

### 4.2 Réduire le délai perçu

| Levier | Où | Effet |
|--------|-----|--------|
| **Premier retry fetch_proof** | `_calculate_fetch_proof_retry_delay` : **Appliqué** `[2, 5, 10, 20, 60]` | Si 404 au 1er GET, retry après 2 s au lieu de 5 s. |
| **DVIG scheduler** | `DVIG_SCHEDULER_INTERVAL=30` → **15 ou 10** (config déploiement) | Réduit le délai quand on ne passe pas par le job (CRON seul ou autre). |
| **Linky polling** | **Appliqué** : `POLL_INTERVAL_MS = 15_000` (15 s) | Les cartes se mettent à jour plus souvent. |

### 4.3 Optionnel (plus invasif)

- **Feedback immédiat en Odoo** : après validation, afficher un message du type « Facture en cours de protection… » puis notification ou mise à jour du statut quand `vaulted` (polling léger ou bus).
- **Rafraîchissement Linky** : bouton « Actualiser » visible pour mettre à jour sans attendre le prochain cycle de 30 s.

---

## 5. Synthèse

- La lenteur perçue vient surtout de : **CRON 1 min** (sans queue_job), **scheduler DVIG 30 s**, **premier retry proof 5 s**, **polling Linky 30 s**.
- **Priorité 1** : s’assurer que **queue_job** est bien activé et utilisé pour le vault (trigger_worker + fetch_proof), pour viser **&lt; 15 s** jusqu’à « Protégée » dans le cas nominal.
- **Priorité 2** : réduire le **premier retry** de la preuve (ex. 5 s → 2 s) et, si souhaité, **intervalle DVIG** (ex. 30 s → 15 s) et **polling Linky** (ex. 30 s → 15 s) pour un ressenti plus réactif.

**Modifications appliquées (2026-02-08)** : backoff fetch_proof `[2, 5, 10, 20, 60]` (Odoo connecteur) ; polling Linky 15 s ; route Vault `/api/v1/proof/*` ; DVIG_SCHEDULER_INTERVAL=10. **En pratique** : vaultage en **entre 1 et 2 minutes (moins de 2 min)** après validation (test facture 1965 ; objectif long terme ≤ 15 s). Voir REDUCTION_DUREE_VAULT_ACTIONS.md §4.

---

## 6. Pourquoi pas systématiquement ≤ 30 s ?

**Objectif** : on peut viser **≤ 30 s** (cible « conservatrice » du §3). Voici ce qui peut faire dépasser 30 s et comment s’en approcher.

### Ce qui retarde le flux

| Cause | Effet | Levier |
|-------|--------|--------|
| **Appel `/internal/outbox/process` absent ou en échec** (URL/token, timeout, réseau) | Le document n’arrive au Vault que lors du **scheduler DVIG** (toutes les 10 s). Puis fetch_proof peut enchaîner des 404 et des retries (2, 5, 10, 20 s). | Vérifier **dorevia.dvig.internal.url** et **dorevia.dvig.internal.token** dans Odoo ; s’assurer que l’URL est joignable depuis le serveur Odoo. |
| **Queue_job** : le job n’est pas pris tout de suite | Délai = intervalle de poll du worker (souvent 2–5 s) + attente si les workers sont occupés. | Garder au moins **2 workers** sur le channel `dorevia_vault` (déjà le cas en stinger). Optionnel : réduire l’intervalle de poll du worker si la config OCA le permet. |
| **Premier GET proof en 404** | Backoff : 1 s, 2 s, 4 s, 8 s, 20 s (réduit pour limiter l’accumulation). | S’assurer que l’outbox est bien traitée **avant** que fetch_proof ne s’exécute (voir première ligne). Backoff : `[1, 2, 4, 8, 20]` s. |
| **CRON seul** (sans queue_job) | Jusqu’à 1 min (CRON #1) + 10 s (scheduler) + 1 min (CRON #2) → bien au-delà de 30 s. | **Activer queue_job** et le channel `dorevia_vault` pour que le flux soit déclenché juste après la validation. |

### En résumé

- **≤ 30 s est atteignable** si : queue_job actif, **internal outbox** appelé avec succès (document dans le Vault dans la même séquence que l’ingest), puis fetch_proof qui trouve la preuve au 1er ou 2e essai.
- **Au-dessus de 30 s** vient le plus souvent de : internal non appelé ou en échec → attente scheduler 10 s + plusieurs retries proof, ou de jobs qui attendent derrière d’autres.
- **Action prioritaire** pour tendre vers ≤ 30 s : vérifier et corriger **dorevia.dvig.internal.url** et **dorevia.dvig.internal.token** (et atteignabilité de l’URL), puis confirmer que les workers `dorevia_vault` tournent bien.

**Application de la config** : `./scripts/set_odoo_config_duree_vault_30s.sh` (à lancer une fois par instance Odoo) — définit `dorevia.dvig.internal.url` et `dorevia.dvig.internal.token`. **Vérification** : `./scripts/check_config_duree_vault_30s.sh` (contrôle des paramètres + test POST `/internal/outbox/process`).

**Si le vaultage dépasse 120 s** : en général les **jobs queue_job ne sont pas exécutés** (workers absents ou channel `dorevia_vault` non traité), donc seul le CRON tourne (≈ 1 min + 10 s + 1 min → 2 min et plus). Lancer `./scripts/diagnostic_vault_plus_de_120s.sh [id_facture]` pour lister les jobs récents et ceux bloqués en pending. **Logs Odoo** : en cas de non-enqueue à la validation, le connecteur écrit un **WARNING** `[Vault] Trigger DVIG worker non enqueued :` suivi de la cause (queue_job non disponible, token manquant, ou exception). Vérifier la config Odoo (workers, `channels = root:2,dorevia_vault:2`) et que le processus qui exécute les jobs est bien démarré.
