# Rapport Avis Expert — SPEC Confirmation Bancaire Stricte v1.2

**Date :** 2026-02-25  
**Document analysé :** `ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.2`  
**Rédacteur :** Équipe Développement

---

## 1. Synthèse de l'avis

La SPEC propose une évolution structurante et alignée avec la vision « confirmation bancaire des événements financiers ». L'architecture (table `financial_recon_deltas`, payload enrichi `impacted_documents`) est **cohérente et implémentable**.  
Plusieurs **amendements** et **clarifications** sont toutefois nécessaires pour sécuriser l'implémentation et la migration depuis l'existant.

**Verdict :** Spec recevable sous réserve des amendements ci-dessous.

---

## 2. Points positifs

| Élément | Avis |
|--------|------|
| **Modèle détaillé par document** | Les statuts `full` / `partial` / `none` et le `clamp` permettent une représentation fine des rapprochements partiels |
| **Indépendance post-ingestion** | Le Vault devient source de vérité sans dépendance runtime à Odoo — objectif atteignable |
| **Idempotence** | Principe `event_uid` compris ; la formule doit être précisée (voir amendements) |
| **Compatibilité avec métriques CFO** | X, Y, Z, taux alignés avec la redéfinition produit |
| **Plan de migration** | Étapes 1–5 lisibles ; le backfill nécessite un prérequis Odoo (voir questions) |

---

## 3. Amendements proposés

### 3.1 §2.1 — Champs requis « documents »

**Constat :** La spec exige `amount_signed (NUMERIC(16,2))`. La table `documents` actuelle n'a pas ce champ ; les montants sont dans `payload_json->>'amount'` ou `total_ttc`.

**Amendement :** ✔ **Acté**
```
- Ajouter amount_signed NUMERIC(16,2) sur documents (obligatoire — amendement critique A)
- Backfill depuis payload_json->>'amount' ou total_ttc
- Convention de signe stricte : encaissement = +, décaissement = -
```

### 3.2 §3.1 — Table financial_recon_deltas : odoo_move_id

**Constat :** Le rapprochement Odoo lie `account.bank.statement.line` à `account.move.line`, pas directement à `account.move`. Une ligne de relevé peut être rapprochée avec plusieurs move lines issus de mouvements différents.

**Amendement :**
```
- Clarifier sémantique de odoo_move_id :
  - Option A : account.move.id (mouvement comptable) — aligné avec payment.move_id
  - Option B : account.move.line.id (ligne de mouvement) — granularité maximale
- Recommandation : Option A pour faciliter la jointure document (payment) ↔ delta (move)
- Ajouter si pertinent : odoo_move_line_id (INT, nullable) pour traçabilité
```

### 3.3 §4.1 — Payload bank.move.reconciled

**Constat :** Le payload actuel (Odoo → DVIG → Vault) ne contient pas `impacted_documents`. Il contient `move_id` (= bank_statement_line.id), `amount`, `occurred_at`. C'est un **changement de contrat** majeur pour Odoo et DVIG.

**Amendement :** ✔ **Acté**
```
- impacted_documents obligatoire en v1.2 — pas optionnel, pas de fallback silencieux (amendement critique B)
- Construit par Odoo uniquement (Q1 actée)
- Documenter le format attendu côté Odoo : 
  account.bank.statement.line.reconciled_move_line_ids → account.move.line → account.move → account.payment ?
```

### 3.4 §4.2 — Événement bank.move.unreconciled

**Constat :** « Même structure, direction '-' » — une unreconcile peut concerner **une partie** des montants précédemment rapprochés. L’idempotence doit distinguer un événement reconcile d’un unreconcile sur la même ligne.

**Amendement :**
```
- L'event_uid pour unreconcile doit être distinct de celui du reconcile correspondant.
- Proposition : inclure event_type dans le hash :
  event_uid = hash(tenant + event_type + bank_statement_line_id + sorted(impacted_ids) + occurred_at)
  où impacted_ids = [(odoo_model, odoo_id, amount_abs) for d in impacted_documents]
- Pour unreconcile partiel : préciser si amount_abs dans impacted_documents représente le montant à retirer (cohérent avec direction '-')
```

### 3.5 §5 — Formule confirmed_abs

**Constat :** La formule `clamp(SUM(delta_amount_abs * sign(direction)), 0, ABS(amount_signed))` est correcte pour un seul document. Préciser que la SUM porte sur les deltas **de ce document** (`document_id`).

**Amendement :**
```
- Formule explicite :
  confirmed_abs(document_id) = clamp(
    SUM(delta_amount_abs * CASE direction WHEN '+' THEN 1 ELSE -1 END)
    WHERE document_id = :document_id,
    0,
    ABS(d.amount_signed)
  )
- Pas de réordonnancement : le modèle delta + clamp est résilient (Q6 actée). SUM des deltas suffit.
```

### 3.6 §6 — Métriques : périmètre de X

**Constat :** X_abs = SUM(ABS(amount_signed)) — sur quels documents ? La spec mentionne « événements financiers » mais ne liste pas les `odoo_model` / `source` éligibles.

**Amendement :** ✔ **Acté**
```
- Périmètre X en V1 (amendement critique C) :
  X = documents WHERE odoo_model IN ('account.payment', 'pos.payment')
       AND tenant = :tenant AND company_id = :company_id
- OD manuelles et écritures techniques exclues en V1
- Élargissement possible ultérieurement
```

### 3.7 §8 — Formule event_uid

**Constat :** `sorted(move_ids)` — les `move_ids` ne sont pas définis dans le payload actuel. Le payload utilise `impacted_documents` avec `odoo_id` par modèle.

**Amendement :**
```
- Remplacer par une définition exploitable :
  event_uid = hash(
    tenant + "|" +
    event_type + "|" +
    str(bank_statement_line_id) + "|" +
    "|".join(sorted(f"{d.odoo_model}:{d.odoo_id}:{d.amount_abs}" for d in impacted_documents)) + "|" +
    occurred_at
  )
- Ou utiliser idempotency_key fourni par l'émetteur (Odoo/DVIG) si garanti unique
```

### 3.8 §10 — Plan de migration : Backfill

**Constat :** Le backfill historique nécessite de connaître, pour chaque rapprochement existant, les paires (document_id, amount_abs). Odoo doit exposer cette donnée.

**Amendement :**
```
- Ajouter étape 0 : Exposer côté Odoo un endpoint ou script de backfill :
  GET /dorevia/vault/reconciled_payments?tenant=X
  Retourne : [{odoo_model, odoo_id, amount_abs, bank_statement_line_id, occurred_at}, ...]
- Ou : CRON/action manuelle Odoo qui envoie des événements bank.move.reconciled au format v1.2 
  pour l'état courant (reconstitution depuis reconciled_move_line_ids)
```

---

## 4. Questions ouvertes

### 4.1 Chaîne d'émission (Odoo → DVIG → Vault)

| # | Question | Impact |
|---|----------|--------|
| Q1 | Qui construit `impacted_documents` ? Odoo (recommandé) ou DVIG (nécessiterait un enrichissement DVIG avec appel Odoo) ? | Charge Odoo vs charge DVIG |
| Q2 | Le flux temps réel actuel (reconcile_bank_line → _emit_reconciliation_event) envoie un payload sans impacted_documents. Faut-il une phase de transition (nouveau format en parallèle, double écriture) ? | Stratégie de déploiement |
| Q3 | En cas de rapprochement avec une écriture non vaultée (ex. OD manuelle, virement manuel), comment traiter ? Ignorer ce document ? Créer un placeholder ? | Comportement attendu |

### 4.2 Modèle de données

| # | Question | Impact |
|---|----------|--------|
| Q4 | La table `bank_reconciliation_projection` doit-elle être conservée après migration ? Elle sert aujourd'hui à `validated_balance` (Position). La spec mentionne « Retrait proxy » — s'agit-il du retrait du proxy Process uniquement, ou aussi de la projection ? | Architecture finale |
| Q5 | Un même document peut-il avoir plusieurs deltas pour la même bank_statement_line (ex. reconcile 300€ puis unreconcile 100€) ? La spec le permet (SUM des deltas) ; confirmer. | Logique métier |
| Q6 | Ordre de traitement : si deux événements arrivent hors ordre (occurred_at A < B, ingestion B avant A), comment garantir la cohérence ? Réordonnancement par occurred_at avant agrégation ? | Robustesse |

### 4.3 API et affichage

| # | Question | Impact |
|---|----------|--------|
| Q7 | L'objet `confirmation` dans l'API Treasury doit-il coexister avec `position` et `process` (v4.1) ou les remplacer ? | Rétrocompatibilité Linky |
| Q8 | Les compteurs `full_count`, `partial_count`, `unconfirmed_count` portent-ils sur les documents (événements financiers) ou sur les lignes de relevé ? Préconisation : documents. | Sémantique |

### 4.4 Cas limites

| # | Question | Impact |
|---|----------|--------|
| Q9 | **Underflow :** Si unreconcile enlève plus que confirmed_abs, le clamp à 0 suffit-il ? Ou faut-il rejeter l'événement ? Recommandation : clamp + log warning. | Traitement d'erreur |
| Q10 | **Multi-split :** Un paiement 1000€ rapproché en 3 fois (400+350+250). Trois événements reconcile ou un seul avec impacted_documents contenant trois entrées ? La spec semble privilégier un événement par bank_statement_line — donc une ligne de relevé peut être rapprochée avec plusieurs paiements (split inversé). Clarifier. | Format payload |

---

## 5. Recommandations

### 5.1 Avant implémentation

1. **Valider les amendements** §3.1 à §3.8 avec l'auteur de la spec.
2. **Répondre aux questions** Q1–Q10 (ou acter les choix par défaut).
3. **Spécifier le contrat Odoo** : format exact du payload avec `impacted_documents`, et API/script de backfill.
4. **Produire le « Contrat Odoo v1.2 »** : exemples de payload, **répartition multi-split** (§7.5), **règles de backfill** (§7.6).

### 5.2 Implémentation

1. **Migration SQL** : création de `financial_recon_deltas` ; ajout de `amount_signed NUMERIC(16,2)` sur `documents` (obligatoire, cf. amendement A).
2. **Handler Vault** : nouvel endpoint ou évolution de `POST /api/v1/bank-reconciliation/events` pour accepter le format v1.2 (impacted_documents obligatoire).
3. **Tests** : couvrir les cas §9 (Partiel, Full, Unreconcile, Double ingestion, Underflow, Multi-split) + scénarios de réordonnancement.

### 5.3 Migration

1. **Phase 1** : Déploiement handler v1.2 en parallèle (double écriture : projection + deltas) pour recette.
2. **Phase 2** : Backfill Odoo → envoi événements historiques.
3. **Phase 3** : Bascule API Treasury sur métriques strictes (confirmation).
4. **Phase 4** : Retrait ancien proxy pour Process (confirmation). **Conserver** `bank_reconciliation_projection` pour Position, audit, forensic et traçabilité.

---

## 6. Conclusion

La SPEC Confirmation Bancaire Stricte v1.2 pose les bonnes fondations pour une métrique fiable et indépendante. Les amendements proposés visent à :

- **Clarifier** les champs, formules et périmètres ;
- **Sécuriser** l’idempotence et les cas limites ;
- **Cadrer** la contribution Odoo (payload enrichi, backfill).

Une fois ces points traités, l’implémentation est **réalisable en 2–3 sprints** (estimation : handler + migrations + Odoo + backfill + tests). Les décisions actées en addendum (§7) sécurisent les trois pivots critiques et la conservation de la projection RECONCIL.

---

## 7. Addendum — Décisions actées (2026-02-25)

Suite à la relecture, les décisions ci-dessous sont actées pour sécuriser l'implémentation.

### 7.1 Les trois amendements critiques (structurants)

| Amendement | Décision | Motif |
|------------|----------|-------|
| **(A) amount_signed matérialisé** | ✔ **Obligatoire** | Éviter une dette technique invisible. Ajouter `amount_signed NUMERIC(16,2)` sur `documents`, backfill depuis payload, imposer convention de signe stricte (encaissement = +, décaissement = −). Pivot architectural propre. |
| **(B) impacted_documents obligatoire** | ✔ **Obligatoire en v1.2** | Pas optionnel. Pas de fallback silencieux. Sinon deux logiques maintenues en parallèle. Changement de contrat majeur — acté. |
| **(C) Périmètre X explicitement borné** | ✔ **Défini en V1** | `X = documents WHERE odoo_model IN ('account.payment', 'pos.payment') AND tenant = :tenant AND company_id = :company_id`. OD manuelles et écritures techniques exclues en V1. Élargissement possible ultérieurement. |

### 7.2 Réponses actées aux questions clés

| Question | Décision |
|----------|----------|
| **Q1** — Qui construit impacted_documents ? | **Odoo.** Toujours. Le Vault ne doit pas appeler Odoo pour reconstruire un lien — sinon perte de l'indépendance. |
| **Q3** — Rapprochement avec écriture non vaultée ? | **Ignorer** + log warning. Ne pas créer de placeholder. L'indicateur porte sur les événements vaultés uniquement. |
| **Q6** — Ordre des événements (réordonnancement) ? | **Ne pas réordonner.** Le modèle delta + clamp est naturellement résilient. La SUM des deltas donne le bon résultat même en cas d'ingestion hors ordre. Pas de séquenceur. |
| **Q9** — Underflow (unreconcile > confirmed_abs) ? | **Clamp + log warning.** Ne jamais rejeter l'événement. La banque reste la réalité. |

### 7.3 Point stratégique : projection RECONCIL

**Question :** La projection `bank_reconciliation_projection` doit-elle être conservée ?

**Décision :** ✔ **OUI — conserver.**

Elle sert à :
- **Position** (net, validated_balance)
- **Audit**
- **Forensic**
- **Traçabilité**

On retire le **proxy pour confirmation** (Process), pas la projection elle-même.

### 7.4 Architecture à deux axes

Les deux couches sont désormais clairement séparées :

| Couche | Rôle |
|--------|------|
| **RECONCIL** (`bank_reconciliation_projection`) | Position nette bancaire — réalité brute des relevés |
| **financial_recon_deltas** | Confirmation des événements financiers — engagement validé par la banque |

- **Axe bancaire** : réalité brute des lignes de relevé.
- **Axe événementiel** : engagement financier vaulté vs confirmé.

Architecture robuste et lisible.

### 7.5 Multi-split & répartition document — Contrat Odoo v1.2

**Point sensible :** Un document peut recevoir plusieurs deltas. Mais si Odoo envoie **un événement par bank_statement_line** et qu'une ligne est rapprochée avec **plusieurs paiements**, alors :

1. `impacted_documents` doit être **correctement « splitté »** : une entrée par paiement impacté.
2. `amount_abs` de chaque entrée doit refléter **la part exacte** attribuée à ce paiement.

Sinon, biais de répartition et agrégation fausse.

**Décision :** Ce point doit être **clarifié explicitement dans le « Contrat Odoo v1.2 »** (document ou section à produire). Exemples :
- Ligne 500 € rapprochée avec paiement A (300 €) + paiement B (200 €) → `impacted_documents: [{odoo_id: A, amount_abs: 300}, {odoo_id: B, amount_abs: 200}]`.
- Règle : `SUM(amount_abs)` sur impacted_documents = montant total de la ligne rapprochée.

### 7.6 Backfill — cohérence historique

Le backfill est le seul endroit où le risque d'incohérence est réel. Si Odoo a :
- des rapprochements partiels anciens ;
- ou des unreconcile historiques ;

le backfill doit reconstruire des deltas **cohérents**, pas seulement l'état courant. Sinon, l'historique `confirmation_rate` sera faux au moment de la migration.

**Décision :**

| Option | Recommandation |
|--------|----------------|
| Replay chronologique complet | Non — sauf si historique des événements disponible |
| Émission d'événements « reconciled » correspondant à l'**état courant** | ✔ **Oui** — simplifie, évite de dépendre d'un audit trail absent |

**Backfill = snapshot de l'état courant** : pour chaque rapprochement existant, Odoo émet un événement reconcile avec `impacted_documents` reflétant l'état actuel. Pas de reconstruction d'un passé événementiel hypothétique.

---

## 8. Références

- Spec analysée : `ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.2`
- Rapport avis développeur Trésorerie v4.1 : `ZeDocs/web32/RAPPORT_AVIS_DEVELOPPEUR_TRESO_V4.1_2026-02-25.md`
- Implémentation actuelle RECONCIL : `sources/vault/internal/handlers/bank_reconciliation_events.go`, `sources/vault/internal/storage/bank_reconciliation.go`

---

*Document rédigé à l'issue de l'analyse de la SPEC v1.2 (2026-02-25).*
