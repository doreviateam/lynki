# Rapport détaillé — Conséquences de la SPEC_DOREVIA_PAYMENTS_v1.1 sur l'existant (Version Finale)

**Date** : 2026-02-09  
**Spec** : ZeDocs/web14/SPEC_DOREVIA_PAYMENTS_v1.1.md  
**Statut** : Version consolidée post revue architecture  
**Objectif** : Inventorier l'existant, les écarts avec la spec et définir une stratégie d'implémentation sans régression.

---

## 1. Synthèse exécutive

| Zone | Existant | Écart principal | Impact |
|------|----------|-----------------|--------|
| Connecteur Odoo | Payload sans source duale ni allocations | Ajouter business_source, technical_source, allocations | Extension payload |
| Vault API | Idempotence SHA payload | Idempotence normative par clé métier | Évolution service |
| Vault stockage | company_id string non persisté | Nécessaire pour agrégations retail | Migration + backfill |
| Agrégations | Pas d'agrégations paiements | Cards IN/OUT nécessaires | Nouvelles routes |
| Linky | Pas de vision cash | Ajout 2 cards | UI + API |
| POS | Pas unifié | Alignement ticket → receipt payment.posted | Connecteur POS |
| DVIG | Pas obligatoire | Optionnel | Aucun blocage |

---

## 2. Règles Métier Clarifiées

### Allocations — Quand obligatoires ?

- **ACCOUNT** : obligatoire si paiement réconcilié ; facultatif sinon.
- **POS** : toujours obligatoire (vers receipt / ticket).

---

## 3. Convention company_id Normative

**Format recommandé** : `technical_source:raw_company_id`

**Exemples** :
- `odoo_account:1`
- `odoo_pos:3`
- `sylius:shop_2`

---

## 4. Correction Bloquante Existante

Vault doit persister :
- **Tenant**
- **CompanyID** (string)

Sinon agrégations impossibles.

---

## 5. Idempotence — Stratégie de Transition

| Phase | Règle |
|-------|--------|
| **Phase 1** | Si `idempotency_key` fournie → utilisée ; sinon → fallback SHA payload |
| **Phase 2** | Log warnings fallback SHA |
| **Phase 3** | Idempotency normative obligatoire |

---

## 6. Temps — occurred_at vs ingested_at

- **Agrégations** : time default = `occurred_at`
- **last_proof_at** = max(`ingested_at`)

---

## 7. Plan d'Implémentation Minimal

| Step | Nom | Contenu |
|------|-----|---------|
| **Step 0 — Queryable** | Persister tenant + company_id string | Correction bloquante ; backfill si besoin |
| **Step 1 — Stable** | Idempotence normative | Clé métier ; transition hybride (Phase 1) |
| **Step 2 — Usable** | Routes agrégations payments IN/OUT | Nouvelles routes Vault + cards Linky |
| **Step 3 — Correct** | Allocations POS + ACCOUNT | Règles métier §2 ; payload connecteurs |

---

## 8. Backfill Données (Recommandé)

- Déduire `company_id` string depuis payload existant.
- Injecter `tenant` si manquant.

---

## 9. DoD Global

- ✔ Paiement visible Linky < 30 s
- ✔ Aucune duplication paiement
- ✔ Multi-store fonctionnel
- ✔ Drill document possible
- ✔ Compatible payload legacy

---

## 10. Conclusion

La spec v1.1 est compatible avec l'existant avec :
- Migration additive
- Phase idempotence hybride
- Backfill company + tenant

**Aucune refonte architecture requise.**
