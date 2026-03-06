# Avis expert — SPEC v1.0 Carte Paiements (Rapprochement bancaire)

**Date :** 2026-03-03  
**Objet :** Évaluation de la SPEC proposée et comparaison avec l’implémentation actuelle  
**Référence :** Spécification Carte Paiements fournie (intention produit, définitions, KPI, source de vérité)

---

## 1. Synthèse

La SPEC v1.0 est **solide sur le plan métier** et corrige un décalage fondamental entre la question CFO (« Quelle part de mes paiements ERP est confirmée par la banque ? ») et l’architecture actuelle. L’implémentation actuelle est **centrée sur les lignes de relevé**, pas sur les **paiements**.

**Recommandation :** Valider la SPEC et planifier une évolution vers le modèle payment-centric.

---

## 2. Écart architectural principal

| Aspect | Implémentation actuelle | SPEC v1.0 |
|--------|-------------------------|-----------|
| **Objet mesuré** | Lignes de relevé bancaire (`bank_statement_line`) | Paiements ERP vaultés |
| **Événements** | `bank.move.reconciled` / `bank.move.unreconciled` (BSL) | `payment.posted`, `payment.reconciled`, `payment.unreconciled` |
| **Projection** | `move_id` = BSL id, `is_reconciled`, `amount` | Statut `reconciled` par paiement |
| **Question métier** | « Quelle part de l’activité bancaire est rapprochée ? » | « Quelle part de mes paiements est confirmée par la banque ? » |

---

## 3. Ce qui existe aujourd’hui

### 3.1 Projection `bank_reconciliation_projection`

- **move_id** = ID de la ligne de relevé bancaire (BSL)
- Agrégation : Σ montants par `is_reconciled` (lignes rapprochées vs non rapprochées)
- Source : événements `bank.move.reconciled` / `bank.move.unreconciled`

### 3.2 Table `financial_recon_deltas` (Confirmation Bancaire v1.3)

- Stocke les **paiements** impactés (`document_id`, `odoo_model`, `odoo_id`, `amount_abs`)
- Source : `impacted_documents` des événements `bank.move.reconciled`
- Permet un calcul de `confirmed_abs` par document (paiement)
- **Non utilisée** pour la carte Trésorerie (suspension Décision Produit 2026-02-25)

### 3.3 Table `documents`

- Aucun champ `reconciled` ni `reconciled_at`

---

## 4. Évaluation de la SPEC

### 4.1 Points forts

| Élément | Avis |
|---------|------|
| **Intention produit** | « Quelle part de mes paiements ERP est confirmée par la banque ? » — question CFO pertinente et bien formulée |
| **Définitions A / B** | `reconciled=false` → À traiter, `reconciled=true` → Traité — claire |
| **Couverture probante** | `B / (A + B)` — cohérent avec la sémantique |
| **Règle A+B=0** | Couverture = — (ni 100 %, ni 0 %) — évite les interprétations erronées |
| **Source de vérité** | Statut stocké dans le Vault, pas dérivé — bon pour la gouvernance |
| **Immutabilité** | Events `payment.reconciled` / `payment.unreconciled` au lieu de modifier l’event `posted` — aligné avec l’event sourcing |
| **Diagnostic « pas de A »** | Les 3 causes (événements, périmètre, filtres) sont pertinentes |

### 4.2 Points à préciser

| Élément | Question | Proposition |
|---------|----------|-------------|
| **Événements** | `payment.reconciled` n’existe pas aujourd’hui | Définir comment Odoo l’émet (hook sur `reconcile_bank_line` si le paiement est dans `impacted_documents`) |
| **Réutilisation** | `impacted_documents` fournit déjà paiement + montant | Peut-on dériver des events `payment.reconciled` à partir de `bank.move.reconciled` + `impacted_documents` ? (enrichissement DVIG ou Vault) |
| **Partiel** | Un paiement peut être partiellement rapproché | Préciser : `reconciled=true` uniquement si `confirmed_abs >= amount_signed` (full), sinon un statut `partial` ? |
| **Fallback** | Si aucun événement `payment.reconciled` reçu | Les paiements restent `reconciled=false` par défaut ; A = total des paiements vaultés, B = 0 |

### 4.3 Incohérence dans la SPEC (§5)

La SPEC indique :

- Exposition non validée = A  
- Traité = B  
- **À traiter = A** (doublon)

Proposition de libellé unique :

- **À traiter** = A (montant des paiements non rapprochés)  
- **Traité** = B (montant des paiements rapprochés)

---

## 5. Stratégie d’implémentation

### Option A — Dérivation à partir de l’existant (court terme)

Réutiliser `financial_recon_deltas` et `impacted_documents` :

1. Réactiver l’agrégation **confirmation** (actuellement suspendue)
2. Pour la carte Paiements : A = `unconfirmed_amount_abs`, B = `confirmed_amount_abs`
3. Périmètre : documents `source=payment` avec `amount_signed` renseigné

**Avantages :** Pas de nouveau flux Odoo, données déjà présentes  
**Limites :** Dépend de `impacted_documents` correctement renseigné par Odoo

### Option B — Nouveau flux payment.reconciled (moyen terme)

Conformément à la SPEC :

1. **Odoo** : émettre `payment.reconciled` / `payment.unreconciled` quand un rapprochement impacte un paiement
2. **Vault** : table `payment_reconciliation_events` ou champ `reconciled` sur `documents`
3. **Agrégation** : A = Σ paiements avec `reconciled=false`, B = Σ paiements avec `reconciled=true`

**Avantages :** Modèle cohérent avec la SPEC, source de vérité explicite  
**Charge :** Développement Odoo (hooks) + Vault (stockage et agrégation)

### Option C — Hybride

1. Court terme : Option A pour aligner les indicateurs
2. Moyen terme : Option B pour consolider le modèle

---

## 6. Cohérence avec le bug observé

Le problème signalé (Position validée à -21 500 € vs 0 % rapproché) vient de :

1. **Bug technique** : inversion rv/uv (corrigé)
2. **Modèle métier** : la projection actuelle est BSL-centric ; pour des paiements 100 % rapprochés, elle donne une cohérence acceptable si le mapping BSL ↔ paiement est 1:1, mais la question CFO reste celle des **paiements**

La SPEC v1.0 corrige ce décalage en plaçant les **paiements** au centre du modèle.

---

## 7. Definition of Done — vérification

| Critère SPEC | État actuel | Action |
|--------------|-------------|--------|
| Tous les paiements ERP « posted » sont vaultés | Partiel (vaulting payant) | Vérifier exhaustivité |
| Chaque paiement a un état `reconciled` exploitable | Non | Implémenter (Option A ou B) |
| Le rapprochement met à jour cet état via events immuables | Partiel (via `impacted_documents` → confirmation) | Exploiter ou compléter le flux |
| A et B cohérents avec Odoo | Non (source = projection BSL) | Basculer sur modèle payment |
| Pas de 100 % si paiements non rapprochés existent | Risque avec projection BSL incomplète | Garantir avec modèle payment |

---

## 8. Recommandation finale

1. **Valider** la SPEC v1.0 comme référence métier
2. **Court terme** : exploiter `financial_recon_deltas` (Option A) pour aligner la carte Paiements sur la question CFO
3. **Moyen terme** : implémenter les events `payment.reconciled` / `payment.unreconciled` (Option B) pour un modèle propre et gouvernable
4. **Documenter** la clarification « validé » = « rapproché » (alignement terminologique)

---

**Fin de l’avis expert**
