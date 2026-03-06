# Plan d’implémentation — Hook write() pour vault sur transition posted (Scrum-like)

**Réf. spec** : ZeDocs/web14/SPEC_VAULT_HOOK_WRITE_POSTED_v1.0.md (v1.1)  
**Périmètre** : Hook `write()` sur `account.move` + factorisation `_vault_init_moves()` + gestion erreurs non silencieuse.  
**Objectif** : Garantir l’initialisation Vault en quasi temps réel pour tout passage à `posted` (POS, imports, API), sans régression ni récursion.

**Dernière mise à jour** : 2026-02  
**Réf. complémentaires** : Recommandations production-grade (early exit, freeze idempotency key, fallback enqueue, batch write) — à intégrer ci‑dessous.

**État** : Implémentation terminée (E1, E2, E3). Tests 59/59 OK. Voir §7 Move suivant.

---

## 1. Vue d’ensemble

| Epic | Résumé | Priorité |
|------|--------|----------|
| **E1** | Factorisation : `_vault_init_moves(moves)` + refactor `action_post()` | P0 |
| **E2** | Hook `write()` : détection transition + appel `_vault_init_moves` + anti-récursion | P0 |
| **E3** | Gestion erreurs explicite + tests + doc | P1 |

**Ordre recommandé** : E1 → E2 → E3. E2 dépend de E1 ; E3 valide le tout.

---

## 2. Epic 1 — Factorisation _vault_init_moves()

**Valeur** : Une seule logique métier d’initialisation vault, réutilisable par `action_post()` et `write()`.

### US-1.1 — Méthode _vault_init_moves(moves)

**En tant que** développeur du connecteur vault,  
**je veux** une méthode unique `_vault_init_moves(self, moves)` qui initialise le vault pour un recordset de moves éligibles,  
**afin que** `action_post()` et `write()` n’aient pas de logique dupliquée.

**Critères d’acceptation**
- [ ] `_vault_init_moves(moves)` accepte un recordset de `account.move` déjà en `state='posted'`.
- [ ] Pour chaque move : si `_should_vault(move)` et pas encore initialisé (`dorevia_vault_status` vide/False), alors calcul de la clé d’idempotence (sauf si déjà définie — **freeze idempotency key** : ne jamais recalculer ni overwrite si `dorevia_vault_idempotency_key` déjà renseignée), write des champs vault avec **contexte `dorevia_skip_posted_hook=True`**, sans déclencher le hook `write()`.
- [ ] Un **seul** appel à `_trigger_dvig_worker_async()` après avoir traité tous les moves du recordset (batch safety). **Si l’enqueue échoue** : conserver `status = todo` pour les moves initialisés (pas de passage en failed_soft) afin que le CRON reprenne ; ne pas remonter l’exception.
- [ ] Retour : nombre de moves initialisés (ou recordset des initialisés) pour que l’appelant sache si un trigger a été fait.

**Tâches techniques**
- Extraire la logique actuelle de `action_post()` (boucle sur self, idempotency_key, write champs, trigger) dans `_vault_init_moves(self, moves)`.
- **Freeze clé** : ne calculer `_compute_idempotency_key(move)` que si `not move.dorevia_vault_idempotency_key` ; ne jamais écraser une clé existante.
- Utiliser `move.with_context(dorevia_skip_posted_hook=True).write({...})` pour les champs vault. Optionnel : write par recordset lorsque les valeurs sont identiques pour tout le lot (ex. même `next_retry_at`) pour limiter le nombre de requêtes DB.
- Appeler `_trigger_dvig_worker_async()` une seule fois en fin de méthode si au moins un move a été initialisé ; en cas d’exception, logger et laisser status=todo (CRON reprendra).
- Documenter la méthode (docstring) : préconditions (moves déjà posted), contexte attendu.

**Estimation** : 2 points

---

### US-1.2 — Refactor action_post() pour appeler _vault_init_moves

**En tant que** développeur,  
**je veux** que `action_post()` délègue toute l’initialisation vault à `_vault_init_moves()`,  
**afin que** le comportement actuel soit préservé sans duplication.

**Critères d’acceptation**
- [ ] Après `super().action_post()`, `action_post()` construit le sous-ensemble des moves éligibles (state=posted, _should_vault, pas encore initialisé) et appelle `_vault_init_moves(moves)`.
- [ ] Aucun changement de comportement fonctionnel pour l’utilisateur (validation depuis l’UI reste identique).
- [ ] Les tests existants sur `action_post()` / vault init passent toujours.

**Tâches techniques**
- Remplacer la boucle et le write/trigger dans `action_post()` par un appel à `_vault_init_moves(self)` (ou `_vault_init_moves(moves_eligibles)`).
- Exécuter les tests du module (ex. test_vault_status, test_spec_v1_1_1) et corriger si besoin.

**Estimation** : 1 point

---

## 3. Epic 2 — Hook write() et anti-récursion

**Valeur** : Tout passage à `posted` (POS, import, script) déclenche l’init vault sans double trigger ni récursion.

### US-2.1 — Surcharge write() et détection transition

**En tant que** système,  
**je veux** que lorsqu’un `account.move` passe à `state='posted'` via `write(vals)`, l’initialisation vault soit exécutée,  
**afin que** les factures POS (ou autres flux hors `action_post()`) soient vaultées en quasi temps réel.

**Critères d’acceptation**
- [ ] `account.move` surcharge `write(self, vals)`.
- [ ] **Avant** `super().write(vals)` : mémoriser `pre_state = {move.id: move.state for move in self}` (nécessaire pour détecter la transition).
- [ ] **Après** `super().write(vals)` : **early exit** — si `'state' not in vals`, retourner `result` sans appeler `_vault_init_moves` ; si `vals.get('state') != 'posted'`, retourner `result` (pas de transition vers posted). Sinon, ne traiter que les moves pour lesquels `pre_state.get(move.id) != 'posted'` **et** `move.state == 'posted'` (transition stricte).
- [ ] Pour ce sous-ensemble : filtrer par `_should_vault(move)` et `dorevia_vault_status` vide/False, puis appeler `_vault_init_moves(moves_to_init)`.
- [ ] Aucune analyse de recordset ni appel à `_vault_init_moves` lorsque `state` n’est pas concerné (performance).

**Tâches techniques**
- Implémenter `def write(self, vals): result = super().write(vals); if 'state' not in vals: return result; if self.env.context.get('dorevia_skip_posted_hook'): return result; if vals.get('state') != 'posted': return result; ...` puis détection des moves en transition et appel à `_vault_init_moves`.
- Ne pas appeler `_vault_init_moves` si le recordset filtré est vide.
- S’assurer que le `write()` des champs vault dans `_vault_init_moves` utilise bien le contexte `dorevia_skip_posted_hook=True` pour ne pas reboucler.

**Estimation** : 2 points

---

### US-2.2 — Protection anti-récursion (contexte dorevia_skip_posted_hook)

**En tant que** développeur,  
**je veux** que le write des champs vault ne redéclenche pas le hook `write()`,  
**afin d’**éviter toute récursion ou double trigger.

**Critères d’acceptation**
- [ ] Au début de `write()`, si `self.env.context.get('dorevia_skip_posted_hook')` est True, retourner `result` après `super().write(vals)` sans appeler `_vault_init_moves`.
- [ ] Dans `_vault_init_moves()`, tout `move.write({...})` sur les champs vault est fait avec `with_context(dorevia_skip_posted_hook=True)`.
- [ ] Aucune boucle infinie ni double enqueue du job trigger lors des tests manuels (ex. post depuis UI, post depuis script via write).

**Tâches techniques**
- Ajouter le guard `if self.env.context.get('dorevia_skip_posted_hook'): return result` après `super().write(vals)`.
- Vérifier que tous les chemins qui écrivent les champs `dorevia_vault_*` (dans `_vault_init_moves` et ailleurs si pertinent) utilisent ce contexte lorsqu’ils ne doivent pas déclencher le hook.

**Estimation** : 1 point

---

## 4. Epic 3 — Gestion erreurs, tests et documentation

**Valeur** : Comportement prévisible en erreur, couverture de tests, doc à jour.

### US-3.1 — Gestion des erreurs (jamais silencieuse)

**En tant que** opérateur,  
**je veux** qu’en cas d’erreur lors de l’init vault (ex. exception dans `_compute_idempotency_key`), le move ait un statut explicite et un message d’erreur,  
**afin de** pouvoir diagnostiquer et laisser le CRON reprendre si c’est retriable.

**Critères d’acceptation**
- [ ] Si une exception est levée lors de l’init d’un move (dans `_vault_init_moves` ou appelée par elle), le move est mis à jour avec soit `dorevia_vault_status='failed_soft'` + `dorevia_vault_last_error` renseigné, soit `dorevia_vault_status='todo'` + message stocké (CRON reprendra).
- [ ] L’exception **ne remonte pas** à l’appelant du `write()` (ne pas bloquer la validation ou l’opération en cours).
- [ ] Les autres moves du recordset continuent d’être traités ; un seul move en erreur ne bloque pas les autres.
- [ ] Un log (warning ou error) est émis pour traçabilité.

**Tâches techniques**
- Entourer le traitement de chaque move dans `_vault_init_moves` d’un try/except.
- En cas d’exception : write du move avec `failed_soft` ou `todo` + `dorevia_vault_last_error`, logger, puis continuer.
- Ne pas reraise l’exception vers `write()` ni `action_post()`.

**Estimation** : 1 point

---

### US-3.2 — Tests unitaires / intégration

**En tant que** développeur,  
**je veux** des tests automatisés couvrant les scénarios de la spec § 9,  
**afin de** sécuriser les régressions et les évolutions.

**Critères d’acceptation**
- [ ] **Write → posted** : facture draft, `write({'state': 'posted'})` → todo, clé, trigger enqueued (ou mock).
- [ ] **Déjà posté → repost** : move déjà posté, write (repost ou autre champ) → pas de réinit, pas de second trigger.
- [ ] **Write sans state** : write sans `state` dans vals → aucune init vault.
- [ ] **vals state != posted** : write avec `state='draft'` ou autre → aucune init vault.
- [ ] **Non éligible** : move non éligible (_should_vault False) → pas d’init.
- [ ] **POS** : facture avec invoice_origin typique POS, postée via write → init OK.
- [ ] **Batch** : plusieurs moves en un write → un seul trigger.
- [ ] **Erreur compute** : mock ou stub qui lève dans _compute_idempotency_key → statut explicite (failed_soft ou todo + last_error), write() ne remonte pas.
- [ ] **Concurrence / batch POS** (optionnel mais recommandé) : simuler double write concurrent ou batch POS massif ; valider pas de double preuve (idempotence) et état final cohérent.

**Tâches techniques**
- Ajouter ou étendre un fichier de tests (ex. `tests/test_hook_write_posted.py` ou dans `test_spec_v1_1_1.py`).
- Utiliser des transactions rollback ou base de test pour ne pas polluer la DB.
- Si queue_job est mocké, vérifier le nombre d’enqueue (1 pour batch).
- Pour le test concurrence : deux writes concurrents sur le même move (ou deux moves) passant à posted, puis vérifier un seul enqueue et pas de double preuve côté Vault/DVIG.

**Estimation** : 3 points

---

### US-3.3 — Documentation et déploiement

**En tant que** équipe projet,  
**je veux** la doc et le compte rendu à jour pour refléter le hook write(),  
**afin que** le runbook et la compréhension du flux soient à jour.

**Critères d’acceptation**
- [ ] `COMPTE_RENDU_REDUCTION_DUREE_VAULT.md` ou équivalent mentionne que le passage à `posted` via `write()` déclenche l’init vault (option 2 / spec v1.1).
- [ ] `DIAGNOSTIC_FACTURE_1977.md` § Factures POS indique que le hook write() couvre désormais les factures postées sans `action_post()`.
- [ ] Docstring ou commentaire dans le code pour le contexte `dorevia_skip_posted_hook` (usage recommandé pour tout write interne des champs vault).
- [ ] Note de déploiement : mise à jour du module `dorevia_vault_connector`, redémarrage Odoo ; pas de migration de données.

**Tâches techniques**
- Éditer les fichiers doc listés.
- Ajouter en tête de `write()` ou dans la spec une phrase sur le contexte skip.

**Estimation** : 0,5 point

---

## 5. Récapitulatif et ordre de réalisation

| Id | US | Estimation |
|----|-----|------------|
| US-1.1 | _vault_init_moves(moves) | 2 |
| US-1.2 | Refactor action_post() | 1 |
| US-2.1 | Hook write() + détection transition | 2 |
| US-2.2 | Anti-récursion (contexte skip) | 1 |
| US-3.1 | Gestion erreurs explicite | 1 |
| US-3.2 | Tests | 3 |
| US-3.3 | Doc + déploiement | 0,5 |
| **Total** | | **10,5** |

**Sprint suggéré** (ex. 1 sprint de 2 semaines) :
- **J1–J3** : E1 (US-1.1, US-1.2) + démarrage E2 (US-2.1, US-2.2).
- **J4–J5** : E3 (US-3.1, US-3.2, US-3.3) et recette (post UI, post via write, facture POS).

**Definition of done** (par US) : critères d’acceptation cochés, pas de régression sur les tests existants du connecteur vault, revue de code si applicable.

---

## 6. Recommandations production-grade (référence)

Les points suivants, issus des recommandations complémentaires au plan, sont intégrés dans les US ci‑dessus ou à respecter en implémentation :

| Recommandation | Où c’est pris en compte |
|----------------|--------------------------|
| **Early exit** dans `write()` : pas d’analyse si `state` absent ou `state != 'posted'` | US-2.1 (critères + tâches) |
| **Freeze idempotency key** : ne jamais recalculer ni overwrite si clé déjà définie | US-1.1 (critères + tâches) |
| **Fallback enqueue** : si `_trigger_dvig_worker_async()` échoue, garder status=todo (CRON reprendra) | US-1.1 (critères) |
| **Batch write** des champs vault : par recordset si valeurs identiques (optionnel) | US-1.1 (tâches, optionnel) |
| **Test concurrence** : double write / batch POS, pas de double preuve | US-3.2 (critère optionnel + tâches) |

**Vision** : Hook write() = filet de sécurité universel ; action_post() = chemin principal. Vault = conséquence de l’état comptable (posted), pas dépendant du workflow UI.

---

## 7. Move suivant (après implémentation)

Le plan Hook write() est terminé. Prochaines actions possibles :

| Priorité | Action | Description |
|----------|--------|-------------|
| **P1** | **Recette manuelle** | Valider en lab/stinger : (1) validation facture depuis l'UI ; (2) facture postée via `write({'state': 'posted'})` ; (3) facture POS → init vault. |
| **P2** | **Déploiement** | Mise à jour du module en cible, redémarrage Odoo ; pas de migration de données. |
| **P3** | **Test concurrence (optionnel)** | US-3.2 optionnel : double write / batch POS, un seul enqueue, pas de double preuve. |
| **Suite** | **Autre spec / backlog** | Ex. plan Linky (filtres company), autre feature ZeDocs/web14. |
