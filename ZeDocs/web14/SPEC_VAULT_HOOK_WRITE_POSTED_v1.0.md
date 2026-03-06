# Spécification — Hook write() pour vault sur passage à « posted »

**Version** : 1.1  
**Date** : 2026-02  
**Contexte** : Odoo 18 + POS et flux ne passant pas par `action_post()` (imports, scripts, API).  
**Objectif** : Garantir l’initialisation Vault en quasi temps réel pour tout `account.move` passant à `posted`, sans régression, double trigger, récursion ni incohérence.

---

## 1. Contexte technique (Odoo 18 + POS)

- En Odoo 18, le flux standard de validation passe par **`action_post()`**.
- Certains flux (POS, imports, scripts, API) peuvent poster via **`write({'state': 'posted'})`** et ne pas appeler l’override custom de `action_post()`.

**Conséquence** : factures initialisées uniquement au passage du CRON → latence dégradée, incohérence avec la promesse « temps réel ».

**Solution** : Hook dans `write()` sur **transition effective** vers `posted`, tout en gardant **`action_post()`** comme voie principale.

---

## 2. Principes d’architecture

### Règle fondamentale

Le hook doit être :
- **déterministe**
- **idempotent**
- **non bloquant** (pas d’appel réseau synchrone)
- **aligné métier** avec `action_post()`

### Pattern cible

```
action_post()  →  _vault_init_moves(moves)
write() [transition posted]  →  _vault_init_moves(moves)
```

La logique métier d’initialisation (clé d’idempotence, write champs vault, trigger) est centralisée dans **une seule méthode** `_vault_init_moves(moves)`, appelée depuis `action_post()` et depuis `write()`.

---

## 3. Règles obligatoires

### 3.1 Détection stricte de la transition

- **Avant** `super().write(vals)` : mémoriser `pre_state = {move.id: move.state for move in self}`.
- **Après** `super().write(vals)` : traiter un move **uniquement si**  
  `pre_state.get(move.id) != 'posted'` **et** `move.state == 'posted'`.

Cela évite toute réinitialisation ou re-trigger lorsque le move était déjà `posted` (ex. write ne modifiant que d’autres champs, ou second write interne sur champs vault).

### 3.2 Protection anti-récursion

- Le **write des champs vault** (todo, idempotency_key, etc.) doit être effectué avec  
  **`with_context(dorevia_skip_posted_hook=True)`**.
- Dans le hook `write()` : **ne rien faire** si `self.env.context.get('dorevia_skip_posted_hook')` est True.

Ainsi le second `write()` (champs vault uniquement) ne redéclenche pas le hook.

**Documentation** : tout code interne qui met à jour uniquement des champs vault sans changer `state` devrait utiliser ce contexte pour éviter tout effet de bord.

### 3.3 Factorisation de la logique métier

- **Méthode unique** : `_vault_init_moves(self, moves)`  
  - Prend un recordset de moves éligibles (déjà en `posted`, `_should_vault(move)` True, pas encore initialisés).  
  - Pour chaque move : calcul clé d’idempotence, write des champs vault (avec contexte `dorevia_skip_posted_hook=True`), puis **un seul** appel à `_trigger_dvig_worker_async()` pour le lot.
- **Appelée depuis** :  
  - `action_post()` (après `super().action_post()`) ;  
  - `write()` (après `super().write(vals)`, pour les moves en transition draft → posted).

### 3.4 Gestion des erreurs (jamais silencieuse)

- **Ne jamais** se contenter de logger et continuer sans mettre à jour le statut.
- En cas d’erreur lors de l’initialisation d’un move (ex. exception dans `_compute_idempotency_key`) :  
  - soit **`dorevia_vault_status = 'failed_soft'`** + **`dorevia_vault_last_error`** renseigné ;  
  - soit **`dorevia_vault_status = 'todo'`** + **retry** (le CRON reprendra) et message stocké si besoin.  
- Le `write()` principal **ne doit pas** remonter l’exception (ne pas bloquer l’opération de l’appelant). Les autres moves du recordset continuent d’être traités.

---

## 4. Spécifique POS et batch

### Batch safety

- Si plusieurs moves passent à `posted` dans le même `write(vals)` : **un seul** appel à `_trigger_dvig_worker_async()` après avoir initialisé tous les moves concernés (déjà garanti par `_vault_init_moves(moves)`).

### Pas de latence artificielle

- Ne pas introduire de délai (sleep, delay) par défaut ; n’en ajouter que si un problème réel (ex. charge, concurrence) l’exige et est documenté.

---

## 5. Performance

- **Interdit** dans le hook : appels réseau synchrones, appel direct à DVIG, `sleep` / délai.
- **Autorisé** : calcul de la clé d’idempotence, write des champs, enqueue du job (queue_job).

---

## 6. Concurrence

- Une race (plusieurs writes / triggers pour le même move) est **acceptable** si DVIG reste **idempotent** et que la **clé d’idempotence** est **stable** pour un même move. Aucun verrou supplémentaire n’est exigé par la spec.

---

## 7. CRON

- Les CRON (Vault Send DVIG, Vault Fetch Proof, Reconciler, etc.) restent **toujours actifs** : fallback, retry et sécurité. Le hook `write()` ne les remplace pas.

---

## 8. Périmètre et cas exclus

- **Modèle** : `account.move` (module `dorevia_vault_connector`, `models/account_move.py`).
- **Cas exclus** : move déjà initialisé (`dorevia_vault_status` déjà renseigné) ; write sans `state` ; `state` passé à une valeur autre que `posted` ; move non éligible selon `_should_vault`.

---

## 9. Tests à prévoir

| Scénario | Résultat attendu |
|----------|------------------|
| `write({'state': 'posted'})` sur facture draft | Init OK : todo, clé, trigger enqueued |
| Move déjà posté → nouveau write (repost ou autre champ) | Rien (pas de réinit, pas de second trigger) |
| Write sans `state` | Aucune initialisation vault |
| Move non éligible (_should_vault False) | Rien |
| Facture POS (invoice_origin typique) postée via write | Init OK comme facture classique |
| Batch mixte (plusieurs moves en un write) | Un seul trigger pour le lot |
| Erreur dans _compute_idempotency_key (ou init) | Statut explicite (failed_soft + last_error, ou todo + retry) ; write() ne remonte pas l’exception |

---

## 10. Décision et vision

- **Hook `write()`** = filet de sécurité universel pour toute transition vers `posted`, quelle que soit l’origine (UI, POS, import, API, script).
- **`action_post()`** = chemin principal ; il appelle `_vault_init_moves()` comme le hook.

**Vision Dorevia** : l’événement métier est la **transition comptable réelle** (`posted`), indépendante de l’UI ou du chemin d’appel.

---

## 11. Documentation et déploiement

- Mettre à jour le compte rendu / doc connecteur (ex. `COMPTE_RENDU_REDUCTION_DUREE_VAULT.md`, `DIAGNOSTIC_FACTURE_1977.md` § Factures POS) pour indiquer que le passage à `posted` via `write()` déclenche l’initialisation vault (option 2 / spec v1.1).
- **Compatibilité** : comportement additif ; aucune migration de données requise pour les moves déjà initialisés.
- **Déploiement** : mise à jour du module `dorevia_vault_connector`, redémarrage Odoo.

---

## 12. Références

- Logique actuelle : `account_move.py`, `action_post()` (~450–488), `_trigger_dvig_worker_async()` (~490–544), `_should_vault()` (~727–752).
- Contexte factures POS : `ZeDocs/web14/DIAGNOSTIC_FACTURE_1977.md` § 5.
