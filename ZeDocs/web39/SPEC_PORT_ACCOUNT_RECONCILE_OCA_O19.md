# Spécification — Port complet account_reconcile_oca vers Odoo 19

**Date :** 2026-03-07  
**Statut :** Budget accordé par la comptable (MOA)  
**Objectif :** Garantir l'ergonomie du rapprochement bancaire sur Odoo 19 — prérequis pour adoption production  
**Référence :** `RECOMMANDATION_STRATEGIE_RAPPROCHEMENT_BANCAIRE_O19.md`, `PROPOSITION_ACCOUNT_RECONCILE_OCA_O19.md`

---

## 1. Contexte

La comptable considère **crucial** de ne pas perdre l'ergonomie du widget OCA (suggestions, règles, interface avancée) lors du passage à Odoo 19. Le module OCA `account_reconcile_oca` n'est pas disponible en 19.0. Un **port complet** est donc spécifié et budgété.

---

## 2. Périmètre

### 2.1 Modules à porter (ordre de dépendance)

| # | Module | Dépendances | Source | Effort estimé |
|---|--------|-------------|--------|---------------|
| 1 | base_sparse_field | — | OCA/server-tools 19.0 | 0,5 j (vérification, déjà en 19.0) |
| 2 | account_statement_base | account, mail | OCA/account-reconcile 19.0 | ✅ Déjà fait (addons-o19) |
| 3 | account_reconcile_model_oca | account | OCA/account-reconcile 18.0 → 19.0 | 2–4 j |
| 4 | account_reconcile_oca | account_statement_base, account_reconcile_model_oca, base_sparse_field | OCA/account-reconcile 18.0 → 19.0 | 5–10 j |

*Note :* account_statement_base dépend aussi de `mail` et `account` — déjà satisfait dans notre cas.

### 2.2 Modules hors périmètre (optionnels)

- account_reconcile_analytic_tag — tags analytiques (à évaluer si besoin)
- account_in_payment — mode « en paiement » (à évaluer si besoin)

---

## 3. Livrables attendus

### 3.1 Fonctionnel

- [ ] **Widget OCA de rapprochement** — interface visuelle de sélection des lignes
- [ ] **Suggestions automatiques** — factures / paiements proposés
- [ ] **Règles de rapprochement** — invoice_matching, writeoff_suggestion (modèle `account.reconcile.model`)
- [ ] **API programmatique** — `reconcile_bank_line()`, `unreconcile_bank_line()`
- [ ] **Gestion des écarts** — write-off, modèles de rapprochement

### 3.2 Technique

- [ ] Modules dans `units/odoo/addons-o19/` (ou structure dédiée)
- [ ] Intégration dans `reinstall_o19.sh`
- [ ] Réactivation de la dépendance `account_reconcile_oca` dans `dorevia_vault_connector` (si pertinent)
- [ ] Tests de non-régression (lettrage, backfill DVIG)

### 3.3 Recette

- [ ] Validation par la comptable — workflow identique à Odoo 18
- [ ] Vérification émission événements DVIG (bank.move.reconciled / unreconciled)

---

## 4. Approche technique

### 4.1 Méthode (itérative)

Souvent 80 % du port se fait en corrigeant les erreurs au runtime. Méthode recommandée :

1. **Copier** les modules OCA 18.0 dans addons-o19
2. **Adapter** les manifests (version 19.0.x.x.x, dépendances Odoo 19)
3. **Installer** les modules — faire émerger les erreurs
4. **Corriger** les erreurs runtime (Python, XML)
5. **Adapter** le JS (voir 4.3)
6. **Ajouter** / exécuter les tests

### 4.2 Points d'attention Odoo 18 → 19

- `_sql_constraints` → `model.Constraint` (déprécié en 19)
- Changements API `account.move`, `account.move.line`
- Assets OWL / ESM
- Champs calculés, `store`, `compute`

### 4.3 Widget JS reconciliation — point critique

Le widget de rapprochement repose sur `static/src/js/reconciliation` et des composants JS. En Odoo 19 : **framework OWL v2 + ES modules**.

**Risque :** migration legacy JS → OWL — même si le module compile, le widget peut casser en runtime.

**Mitigation :** une **validation visuelle complète** est requise lors de la recette. La comptable doit valider : rapidité, ergonomie, workflow.

### 4.4 Emplacement des modules

```
units/odoo/addons-o19/
├── base_sparse_field/          # si nécessaire (vérifier server-tools 19.0)
├── account_statement_base/     # ✅ déjà présent
├── account_reconcile_model_oca/ # à porter
└── account_reconcile_oca/      # à porter
```

---

## 5. Estimation et planning

| Phase | Tâche | Effort | Cumul |
|-------|-------|--------|-------|
| 1 | base_sparse_field (vérif / copie) | 0,5 j | 0,5 j |
| 2 | account_reconcile_model_oca | 2–4 j | 3–4,5 j |
| 3 | account_reconcile_oca — modèles Python | 2–3 j | 5–7,5 j |
| 4 | account_reconcile_oca — vues XML | 1–2 j | 6–9,5 j |
| 5 | account_reconcile_oca — widget JS | 3–5 j | 9–14,5 j |
| 6 | Tests, corrections, recette | 2–3 j | 11–17,5 j |

**Répartition indicative :** modèles Python 2–3 j | vues XML 1–2 j | JS widget 3–5 j | tests 2–3 j.

**Total estimé :** 9–15 jours (selon complexité des adaptations Odoo 19).

---

## 6. Critères d'acceptation

| # | Critère | Validation |
|---|---------|------------|
| 1 | La comptable peut rapprocher une ligne de relevé avec le widget OCA | Recette MOA |
| 2 | Les suggestions automatiques fonctionnent | Recette MOA |
| 3 | Les règles de rapprochement (invoice_matching, writeoff) fonctionnent | Recette MOA |
| 4 | `reconcile_bank_line()` / `unreconcile_bank_line()` opérationnels | Test technique |
| 5 | Événements DVIG émis correctement (dorevia_vault_connector) | Test technique |
| 6 | Aucune régression sur le flux Vault / Linky | Test technique |
| 7 | **Aucune duplication d'événement DVIG** lors des rapprochements | Test technique |

*Critère 7 :* Le flux reconcile → partial_reconcile → full_reconcile est sensible. Le connecteur doit éviter de produire `bank.move.reconciled` en double.

---

## 7. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Changements API Odoo 19 importants | Moyenne | Élevé | Analyser les changements 18→19 avant port |
| Assets JS complexes | Moyenne | Moyen | S'appuyer sur la doc OWL 19, tests visuels |
| Dépendances cachées | Faible | Moyen | Tester chaque module isolément |
| Régressions comptables | Faible | Élevé | Recette comptable détaillée, jeux de données |
| Widget JS (OWL v2) | Moyenne | Élevé | Validation visuelle complète par la comptable |

---

## 8. Contribution OCA potentielle

Après stabilisation du port :

- **Proposer une PR** vers OCA/account-reconcile (branche 19.0)
- **Maintenir** une branche temporaire interne en parallèle
- **Objectif :** ne pas maintenir ce module seul à long terme

---

## 9. Références

- **Plan d'implémentation :** `PLAN_IMPLEMENTATION_PORT_ACCOUNT_RECONCILE_OCA_O19.md`
- OCA account-reconcile 18.0 : `sources/oca/account-reconcile/`
- OCA account-reconcile 19.0 (partiel) : https://github.com/OCA/account-reconcile (branche 19.0)
- OCA server-tools 19.0 : https://github.com/OCA/server-tools (base_sparse_field)
- dorevia_vault_connector : `units/odoo/custom-addons/dorevia_vault_connector/`
- Changelog Odoo 19 : https://www.odoo.com/documentation/19.0/

---

## 10. Décision

| Élément | Décision |
|---------|----------|
| **Option retenue** | Option A — Port complet OCA |
| **Budget** | Accordé par la comptable (MOA) |
| **Priorité** | Haute — prérequis adoption Odoo 19 production |
| **Livraison cible** | Tenant o19 opérationnel avec ergonomie équivalente Odoo 18 |
