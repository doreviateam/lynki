# SPEC — Auto‑Renew Tokens DVIG (Caddy‑like) v1.0

**Produit** : Dorevia Platform — DVIG  
**Document** : Spécification Fonctionnelle & Technique  
**Version** : v1.0.0  
**Date** : 2026-01-03  
**Statut** : DRAFT (prête à implémenter)  
**Objectif** : Mettre en place un mécanisme d'**expiration** + **renouvellement automatique** des tokens DVIG, "à la Caddy" (pre‑renew + grace).

---

## 0. Résumé exécutif

Aujourd'hui, un token DVIG reste valide indéfiniment tant qu'il n'est pas révoqué manuellement.  
Cette spec introduit :

1. **Expiration** (`expires_at`)  
2. **Renouvellement anticipé** (pre‑renew) avant expiration  
3. **Période de chevauchement** (grace) permettant **zéro interruption**  
4. **Mode pull** (l'univers applicatif récupère le nouveau token), robuste et agnostique ERP

Le système doit rester :
- simple,
- rétrocompatible,
- exploitable,
- auditable.

---

## 1. Portée

### 1.1 In scope
- Ajout des champs DB nécessaires (expiration, statut, grace).
- Nouvelles règles de validation dans `bearer.py`.
- Endpoints DVIG pour **renouveler** / **consulter** l'état token.
- CLI `dorevia.sh token` : issue / renew / status / rotate (côté plateforme).
- Politique de rotation (TTL, renew_before, grace_period).
- Logs structurés + événements audit.
- Tests unitaires & tests d'intégration DVIG.

### 1.2 Out of scope (v1.0)
- Webhooks "push" DVIG → applications.
- UI dédiée.
- HSM/KMS, rotation de secrets multi‑facteurs.
- Rotation automatique orchestrée côté applications (ex. Odoo) — seulement les hooks/contrats d'API.

---

## 2. Concepts & Terminologie

- **Scope token** : tuple `(tenant, univers, env)`  
- **TTL** : durée de vie d'un token (ex. 365 jours)  
- **Renew_before** : fenêtre avant expiration où l'on émet un successeur (ex. 30 jours)  
- **Grace_period** : période pendant laquelle l'ancien token reste accepté après émission du nouveau (ex. 7 jours)  
- **Active token** : token de référence "courant" d'un scope  
- **Grace token** : token précédent, encore accepté temporairement

---

## 3. Exigences (non‑fonctionnelles)

- **Zéro downtime** lors d'un renouvellement planifié.
- **Rétrocompatibilité** : tokens legacy (sans expiration) doivent continuer à fonctionner (mode compat).
- **Idempotence** : un renouvellement répété ne doit pas générer une infinité de tokens.
- **Observabilité** : logs structurés + métriques simples.
- **Sécurité** : réduction du risque en cas de fuite (tokens à durée finie, rotation, limitation du nombre de tokens acceptés).

---

## 4. Politique de rotation (valeurs recommandées)

### 4.1 Valeurs par défaut (prod)
- `TTL = 365 jours`
- `renew_before = 30 jours`
- `grace_period = 7 jours`
- `max_accepted_tokens_per_scope = 2` (active + grace)

### 4.2 Valeurs recommandées (lab/stinger)
- `TTL = 90 jours`
- `renew_before = 14 jours`
- `grace_period = 3 jours`

### 4.3 Configuration
Les valeurs doivent être configurables via :
- variables d'environnement DVIG **ou**
- config YAML/JSON DVIG

---

## 5. Modèle de données

### 5.1 Table `dvig_tokens` (évolution)
Ajouter :

- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `expires_at TIMESTAMPTZ NULL`
- `status TEXT NOT NULL DEFAULT 'active'`  
  valeurs : `active | grace | revoked | legacy`
- `grace_until TIMESTAMPTZ NULL`
- `replaces_token_id UUID NULL` (ou PK type actuel)

**Notes**
- Les tokens existants (avant migration) peuvent être marqués `legacy` avec `expires_at = NULL`.
- Un token `revoked` est toujours refusé, peu importe les dates.

### 5.2 Index recommandés
- index sur `(tenant, univers, env, status)`
- index sur `expires_at`
- index sur `grace_until`

---

## 6. Règles de validation (DVIG bearer)

Pseudo‑logique :

1. Charger le token (hash) + scope attendu.
2. Si `status == revoked` → refuser.
3. Si `expires_at IS NOT NULL` et `now >= expires_at` → refuser (`token_expired`).
4. Si `status == grace` :
   - si `grace_until IS NULL` → refuser (token incohérent)
   - si `now >= grace_until` → refuser (`grace_ended`)
5. Sinon (active/legacy) → accepter.

### 6.1 Réponses HTTP
- token expiré / grace terminée → **401 Unauthorized**
- scope mismatch → **403 Forbidden** (déjà existant)
- token inconnu → **401 Unauthorized**

### 6.2 Logs structurés (événements)
Émettre un log JSON :
- `event=token_expired`
- `event=token_grace_ended`
- `event=token_revoked`
- `event=token_accepted`
avec : `tenant, univers, env, token_id, expires_at, grace_until, request_id`

---

## 7. API DVIG (contrat "pull")

### 7.1 Endpoint — Consulter le token actif & l'état de rotation
`GET /auth/token-status`

**Auth** : nécessite un token valide (scope)  
**Réponse** (exemple) :

```json
{
  "tenant": "pierez",
  "univers": "odoo",
  "env": "prod",
  "active": {
    "token_id": "…",
    "expires_at": "2027-01-03T00:00:00Z"
  },
  "renewal": {
    "should_renew": true,
    "renew_after": "2026-12-04T00:00:00Z",
    "renew_before": "30d",
    "grace_period": "7d"
  }
}
```

### 7.2 Endpoint — Renouveler (pre‑renew) explicitement
`POST /auth/renew`

**Auth** : nécessite un token valide (scope)  
**Comportement** :
- si un successeur existe déjà et est valide → retourner le même (idempotent)
- sinon → créer un nouveau token (active) + basculer l'ancien en (grace)

**Réponse** :

```json
{
  "issued": true,
  "new_token": "<PLAINTEXT_TOKEN_ONCE>",
  "new_token_id": "…",
  "expires_at": "2027-01-03T00:00:00Z",
  "grace_until": "2026-01-10T00:00:00Z"
}
```

**Important (sécurité)** :
- `new_token` n'est renvoyé **qu'une seule fois**.
- la valeur en clair ne doit jamais être loggée.

### 7.3 Endpoint — Révoquer (optionnel v1.0)
`POST /auth/revoke`  
Requiert un rôle/claim admin (si existant), sinon hors scope.

---

## 8. Algorithme de rotation (serveur DVIG)

### 8.1 Condition `should_renew`
Un token est éligible au pre‑renew si :

- `expires_at IS NOT NULL`
- `expires_at - now <= renew_before`
- et aucun token "successor" actif récent n'existe pour ce scope

### 8.2 Transition d'état
Lors d'un renew :

- ancien token :
  - `status = grace`
  - `grace_until = now + grace_period`
- nouveau token :
  - `status = active`
  - `expires_at = now + TTL`
  - `replaces_token_id = <old>`

### 8.3 Nettoyage (garbage collection)
Un job périodique (ou au démarrage) peut :
- révoquer/archiver les tokens `grace` dont `grace_until < now`
- option : supprimer (policy à définir), recommandé : conserver "revoked/expired" pour audit

---

## 9. CLI (dorevia.sh)

### 9.1 Émission initiale
```bash
dorevia.sh token issue <univers> <env> <tenant> --ttl 365d
```

### 9.2 Statut token (scope)
```bash
dorevia.sh token status <univers> <env> <tenant>
```

### 9.3 Renouvellement (pre‑renew)
```bash
dorevia.sh token renew <univers> <env> <tenant>
```

### 9.4 Rotation "forcée" (équivalent renew immédiat)
```bash
dorevia.sh token rotate <univers> <env> <tenant> --force
```

**Note** : `rotate` peut être un alias de `renew --force`.

---

## 10. Intégration côté univers applicatif (Odoo) — contrat minimal

### 10.1 Recommandation "pull"
L'application (ex. Odoo) doit :

- appeler périodiquement `GET /auth/token-status`
- si `should_renew == true` :
  - appeler `POST /auth/renew`
  - stocker le nouveau token
  - basculer l'usage sur le nouveau token

### 10.2 Stockage
- Dans Odoo : `ir.config_parameter` ou secret file monté dans container.
- Ne jamais stocker le token en clair dans des logs.

**Out of scope v1.0** : implémentation complète du module Odoo de rotation, mais la spec d'API est stable.

---

## 11. Rétrocompatibilité

### 11.1 Tokens legacy
- `expires_at = NULL`
- `status = legacy`
- Validés comme aujourd'hui

### 11.2 Politique de migration
Option recommandée :
- laisser les legacy fonctionner
- forcer la rotation vers "expiring tokens" à la prochaine émission (`token issue` ou `renew --force`)

---

## 12. Sécurité & conformité

- Limiter à 2 tokens acceptés par scope.
- Ne jamais logger de token en clair.
- Logs d'audit pour les événements :
  - token issued
  - token renewed
  - token revoked
  - token expired
- Option future : lier tokens à un "machine identity" (hors scope v1.0).

---

## 13. Tests

### 13.1 Unit tests
- validation : active valide
- validation : revoked refusé
- validation : expiré refusé
- validation : grace accepté puis refusé après `grace_until`
- renew : idempotence (2 calls = 1 token new)
- renew : transitions correctes (old→grace, new→active)

### 13.2 Intégration
- parcours :
  1. issue token TTL court (ex. 2 min)
  2. advance time / mock clock
  3. `token-status` → should_renew true
  4. `renew` → renvoie token new
  5. accès via old token pendant grace → OK
  6. après grace → old refusé, new OK

---

## 14. Critères d'acceptation (DoD)

- DB migrée, rétrocompat OK.
- `bearer.py` applique les règles d'expiration et grace.
- Endpoints `token-status` et `renew` disponibles, testés.
- CLI `token renew/status` opérationnelle.
- Logs structurés (events) présents.
- Tests unit + intégration passent.
- Aucun token en clair dans les logs.

---

## 15. Décisions ouvertes (à trancher pendant implémentation)

1. Identifiant token : UUID vs PK existante
2. Stockage/présentation du token en clair (une seule fois) : format exact
3. Job de nettoyage : cron interne DVIG ou commande CLI
4. Valeurs par défaut TTL/renew/grace selon env (hardcode vs config)

---

## ANNEXE A — Évaluation de Faisabilité

Voir document séparé : `EVALUATION_FAISABILITE_AUTO_RENEW_TOKENS_DVIG.md`

**Résumé exécutif de l'évaluation** :

✅ **Verdict global** : **FAISABLE** — La spécification est techniquement réalisable et s'intègre bien avec l'architecture existante.

**Complexité estimée** : 🟡 **Moyenne** (3-4 sprints)

**Estimation d'effort** :
- Migration DB : 0.5j
- Validation (bearer.py) : 1j
- API DVIG (endpoints) : 2j
- CLI (dorevia.sh) : 1j
- Tests : 3j
- Documentation : 1j
- **TOTAL (DVIG)** : **8.5j**
- Module Odoo (hors scope v1.0) : 3-5j

**Recommandation** : ✅ **Approuver** avec planification en **Phase 4**

**Planning recommandé** :
- **Phase 4.1 — DVIG (Sprint 1-2)** : Semaine 1 (Migration DB + Validation), Semaine 2 (API + CLI + Tests)
- **Phase 4.2 — Intégration Odoo (Sprint 3)** : Semaine 3 (Module Odoo + Tests)

**Total** : 3 sprints (3 semaines)

Pour les détails complets de l'évaluation technique, voir : `ZeDocs/V2/EVALUATION_FAISABILITE_AUTO_RENEW_TOKENS_DVIG.md`

---

**Fin de la spécification**

