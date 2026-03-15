# Proposition — API programmatique et interface lettrage avancée (o19)

**Date :** 2026-03-07  
**Objectif :** Obtenir une API programmatique et une interface de lettrage avancée sur Odoo 19  
**Voir aussi :** `RECOMMANDATION_STRATEGIE_RAPPROCHEMENT_BANCAIRE_O19.md`, `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`

**Décision (2026-03-07) :** **Option A — Port complet** retenue. Budget accordé par la comptable. Spécification : `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`.

---

## 1. Options envisageables

### Option A — Port complet OCA (recommandé si budget disponible)

**Périmètre :** Migrer `account_reconcile_model_oca` puis `account_reconcile_oca` de 18.0 vers 19.0.

| Module | Dépendances | Effort estimé |
|--------|-------------|---------------|
| account_reconcile_model_oca | account | 2–4 j |
| base_sparse_field | — | 0,5 j (déjà en 19.0) |
| account_reconcile_oca | account_statement_base, account_reconcile_model_oca, base_sparse_field | 5–10 j |

**Livrables :**
- API `reconcile_bank_line()` / `unreconcile_bank_line()`
- Widget OCA de lettrage (sélection lignes, modèles de rapprochement, etc.)
- Règles de rapprochement automatique (invoice_matching, writeoff_suggestion)

**Avantages :** Solution complète, maintenue par OCA (si contribution upstream).  
**Inconvénients :** Charge importante, tests comptables indispensables.

---

### Option B — API minimale custom (compromis rapide)

**Périmètre :** Module léger `dorevia_reconcile_api` exposant une API simple.

**Fonctionnalité cible :**
```python
# Rapprocher une ligne de relevé avec des account.move.line
st_line.reconcile_with_lines(aml_ids=[123, 456])
st_line.unreconcile()
```

**Principe :** Utiliser `account.move.line.reconcile()` et la structure standard Odoo (liquidity, suspense, counterpart) sans reprendre toute la logique OCA.

**Effort estimé :** 2–4 j (analyse du flux Odoo standard + implémentation + tests).

**Livrables :**
- API programmatique pour scripts / automatisation
- Pas d’interface avancée (UI standard Odoo conservée)

**Avantages :** Mise en place rapide, périmètre maîtrisé.  
**Inconvénients :** Pas de widget OCA, logique à maintenir en interne.

---

### Option C — Contribution OCA

**Périmètre :** Préparer une PR OCA pour la migration 19.0.

**Démarche :**
1. Fork OCA/account-reconcile
2. Créer une branche 19.0 à partir de 18.0
3. Migrer `account_reconcile_model_oca` (priorité)
4. Migrer `account_reconcile_oca`
5. Soumettre les PR à OCA

**Avantages :** Bénéfice pour la communauté, maintenance partagée.  
**Inconvénients :** Processus de revue OCA, délais possibles.

---

## 2. Recommandation

**Décision validée (2026-03-07) :** **Option A — Port complet** — budget accordé par la comptable. Spécification : `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`.

| Priorité | Option | Statut |
|----------|--------|--------|
| **Retenu** | Option A (port complet) | Budget accordé, SPEC rédigée |
| Alternative | Option C (contribution OCA) | Envisageable après port (upstream) |
| Non retenu | Option B (API minimale) | Insuffisant pour ergonomie comptable |
| Non retenu | Option D (attente OCA) | Contrainte comptable non satisfaite |

---

## 3. Prochaines étapes

1. **Lancer le port** — Suivre `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`.
2. **Ordre des modules** : base_sparse_field → account_reconcile_model_oca → account_reconcile_oca.
3. **Recette** — Validation par la comptable (workflow identique Odoo 18).
4. **Optionnel** — Proposer une PR OCA pour contribution upstream.

---

## 4. Références

- **Spécification port :** `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`
- **Plan d'implémentation :** `PLAN_IMPLEMENTATION_PORT_ACCOUNT_RECONCILE_OCA_O19.md`
- **Stratégie :** `RECOMMANDATION_STRATEGIE_RAPPROCHEMENT_BANCAIRE_O19.md`
- OCA account-reconcile : https://github.com/OCA/account-reconcile
- RUNBOOK_ACCOUNT_RECONCILE_OCA_O19.md
- dorevia_vault_connector (fallback actuel) : `units/odoo/custom-addons/dorevia_vault_connector/models/account_bank_statement_line.py`
