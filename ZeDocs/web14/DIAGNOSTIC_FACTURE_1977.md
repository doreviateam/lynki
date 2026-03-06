# Diagnostic — Facture 1977 (FAC/2026/00045) ne se vault pas

**Date** : 2026-02-08  
**Facture** : id 1977, name FAC/2026/00045  
**Origine** : Facture issue du **POS** (invoice_origin = Boulangerie/0007, journal Factures clients).

---

## 1. État constaté

- **Odoo** : `dorevia_vault_status = pending_proof`, 2 tentatives, `next_retry_at` vers 20:15:57 (backoff CRON 4 min).
- **Vault** : Le document **existe** (odoo_id 1977, tenant sarl-la-platine, créé 20:12:04).  
  `GET /api/v1/proof/account_move/1977` depuis le conteneur Vault → **200 OK** avec preuve (id, hash, jws).

Donc la preuve est bien côté Vault ; Odoo n’a pas encore mis à jour le statut en « Protégée ».

---

## 2. Pourquoi ça a coincé

1. **Envoi vers DVIG/Vault** : La facture est passée en `pending_proof` (event_id présent), donc elle a bien été envoyée à DVIG puis à Vault.
2. **Premier fetch proof** : Un premier (ou deuxième) fetch a eu lieu **avant** que le document soit enregistré dans Vault (ou juste après un 404) → **404** → retry planifié avec le backoff du **CRON** (`_calculate_next_retry` = 2^tentative × 60 s), soit **4 min** pour la 2ᵉ tentative.
3. **Document créé après** : Le document a été créé dans Vault à **20:12:04**. La prochaine tentative CRON est à **20:15:57**, donc la facture reste en `pending_proof` en attendant.

En résumé : **décalage de timing** (fetch avant que le doc soit en Vault) + **backoff long du CRON** (4 min) = facture qui reste en « Protection en cours » alors que la preuve est déjà disponible.

---

## 3. Que faire pour 1977

- **Dans l’interface Odoo** : Ouvrir la facture FAC/2026/00045 et utiliser le bouton **« Rafraîchir la preuve »** (action `action_refresh_vault_proof`). Cela enqueue un job `fetch_proof` qui fera un GET proof ; comme le document est déjà dans Vault, la réponse sera 200 et le statut passera à **« Protégée »**.
- **Sinon** : Attendre la prochaine exécution du CRON (next_retry_at) ; à ce moment-là le GET renverra 200 et le statut sera mis à jour.

---

## 4. Pour éviter ce cas à l’avenir

Les correctifs déjà en place (enqueue systématique de `fetch_proof` après envoi à DVIG + backoff court 0,25 s, 0,5 s…) font que, en flux normal, le fetch proof est lancé juste après l’envoi et réessaie rapidement. On évite ainsi d’être dépendant du CRON et de son backoff long.

Si une facture reste en `pending_proof` alors que le document est déjà en Vault (comme 1977), c’est en général le même schéma : **premier(s) fetch trop tôt (404) + prochaine tentative CRON loin**. Dans ce cas, un clic sur « Rafraîchir la preuve » suffit pour la passer en « Protégée » sans attendre le CRON.

---

## 5. Factures issues du POS

Les factures POS sont des **account.move** (move_type out_invoice) comme les autres. Le connecteur vault les traite de la même façon : même envoi DVIG, même endpoint de preuve **GET /api/v1/proof/account_move/:id**. Aucune route spécifique POS (pos_order, pos_ticket) n’est utilisée pour cette facture.

- **Hook write() (SPEC v1.1)** : Depuis l’implémentation du hook `write()` (voir `SPEC_VAULT_HOOK_WRITE_POSTED_v1.0.md`), tout passage à `state='posted'` — y compris via `write({'state': 'posted'})` sans `action_post()` — déclenche l’initialisation vault (todo + clé + trigger). Les factures POS postées par le POS via `write()` sont donc désormais prises en charge automatiquement. Le contexte `dorevia_skip_posted_hook=True` est utilisé en interne pour éviter les récursions lors des mises à jour des champs vault.
- **Si une facture POS (ou autre) n’est toujours pas passée en « todo »** : vérifier la configuration DVIG (`dorevia.dvig.url`, token, source) et que le move est bien éligible (`_should_vault`). En dernier recours, le CRON ou une action manuelle peut remettre la facture en todo.

### 5.1 Pourquoi le vaultage POS peut sembler plus long

Le **code de vault** est le même pour les factures POS et les factures classiques (même hook write(), même worker DVIG, même fetch proof). Ce qui peut allonger la durée perçue côté POS :

1. **Batch** : Le POS peut poster plusieurs factures en peu de temps (fermeture de caisse, synchronisation). Le worker traite les moves par lot ; la **dernière** facture du lot attend que les précédentes soient envoyées à DVIG puis à Vault, donc le délai « jusqu’à Protégée » peut être plus long pour elle.
2. **File queue_job** : Si beaucoup de jobs (trigger, fetch_proof) sont en attente sur le channel `dorevia_vault`, les jobs POS passent après ; le temps jusqu’au premier enqueue puis à l’exécution augmente.
3. **Moment du post** : Si la facture est postée au moment où le CRON ou d’autres jobs sollicitent déjà DVIG/Vault, les requêtes s’enchaînent et la dernière réponse (fetch proof) arrive plus tard.

**À vérifier en cas de lenteur** : (1) nombre de jobs en attente sur le channel `dorevia_vault` ; (2) logs DVIG/Vault pour voir l’ordre des requêtes ; (3) si une seule facture POS est postée isolément, le délai devrait se rapprocher de celui d’une facture validée depuis l’UI. Voir aussi `RESUME_DUREE_VAULT.md` et `scripts/check_queue_job_runner.sh`.
