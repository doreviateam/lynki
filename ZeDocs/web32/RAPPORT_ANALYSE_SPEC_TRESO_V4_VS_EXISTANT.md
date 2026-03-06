# Rapport d'analyse — Spécification Carte Trésorerie v4.0 vs existant

**Date :** 25 février 2026  
**Référent :** SPEC `Carte_Trésorerie_Validée_v4.0.md`  
**Objet :** Comparaison avec l'implémentation actuelle, écarts identifiés, amendements et questions

---

## 1. Synthèse exécutive

La SPEC v4.0 introduit un **modèle financier différent** de l'actuel : position nette signée vs volumétrie. **Recommandation stratégique :** la v4.0 comme **complément**, pas remplacement. Conserver le volume (santé opérationnelle) et ajouter la position (vision financière probante). Structure cible : **2 axes** — Position (validated, exposure, erp) et Fiabilité process (volume rapproché, volume en attente, taux de traitement).

---

## 2. Comparatif des modèles

### 2.1 Modèle SPEC v4.0

| Concept | Formule | Source |
|---------|---------|--------|
| **Trésorerie validée** | `validated_balance = SUM(signed_amount)` | Vault (événements `reconciliation.validated`) |
| **Solde comptable ERP** | `erp_balance = odoo.bank_account.balance` | Odoo |
| **Exposition non validée** | `unvalidated_exposure = erp_balance - validated_balance` | Calculé |
| **Fiabilité bancaire** | `bank_reliability = ABS(validated_balance) / ABS(erp_balance)` | Calculé (100 % si erp_balance = 0) |
| **Règles de signe** | Encaissement +, décaissement − | Tous montants signés |

### 2.2 Modèle existant (implémentation actuelle)

| Concept | Formule | Source |
|---------|---------|--------|
| **Trésorerie validée** | `reconciled = Σ ABS(amount)` des lignes rapprochées | Vault (projection RECONCIL) |
| **En attente** | `unreconciled = Σ ABS(amount)` des lignes non rapprochées | Vault |
| **Fiabilité** | `reliability = reconciled / (reconciled + unreconciled)` | Calculé (volume des relevés) |
| **Solde comptable ERP** | — | Non affiché |
| **Règles** | Montants signés en base, agrégation en |amount| pour l'affichage | — |

---

## 3. Écarts identifiés

### 3.1 Sémantique des montants

| Spéc v4.0 | Existant | Écart |
|-----------|----------|-------|
| `validated_balance` = **somme algébrique** (position nette validée) | `reconciled` = **somme des valeurs absolues** (volume rapproché) | Modèles différents : net vs volume |
| `unvalidated_exposure` = `erp_balance - validated_balance` (écart comptable) | `unreconciled` = Σ |amount| des lignes non rapprochées | Calcul différent : écart global vs volume non rapproché |
| `erp_balance` affiché | Pas de solde ERP | Donnée manquante dans l'UI |

**Exemple :** Lignes rapprochées : +100 €, -50 €, -480 000 €  
- **Spec v4** : validated_balance = 100 - 50 - 480 000 = **-479 950 €** (position nette)  
- **Existant** : reconciled = 100 + 50 + 480 000 = **480 150 €** (volume)

### 3.2 Fiabilité bancaire

| Spéc v4.0 | Existant | Écart |
|-----------|----------|--------|
| `\|validated\| / \|erp_balance\|` | `reconciled / (reconciled + unreconciled)` | Référentiel différent : ERP vs volume des relevés |
| Si `erp_balance = 0` → 100 % | Pas de cas explicite | À traiter en spec |
| Barre de progression | Pourcentage texte | Adaptation UI |

### 3.3 Nommage des événements

| Spéc v4.0 | Existant | Écart |
|-----------|----------|-------|
| `reconciliation.validated` | `bank.move.reconciled` / `bank.move.unreconciled` | Nommage différent, sémantique équivalente |

### 3.4 Structure UI

| Bloc SPEC v4.0 | Existant | Écart |
|----------------|----------|-------|
| Trésorerie validée | ✓ (identique) | — |
| Exposition non validée | En attente de rapprochement | Libellé et formule différents |
| Fiabilité bancaire | ✓ (identique) | Formule et référentiel à aligner |
| Solde comptable ERP | — | À ajouter |
| Journaux concernés | ✓ (Odoo) | — |
| Dernier relevé importé | ✓ (Odoo) | — |

### 3.5 Cas limites

| Cas | Spéc v4.0 | Existant |
|-----|-----------|----------|
| Aucun flux | validated=0, erp=0, fiabilité 100 % | — |
| Écart important | Badge alerte si \|unvalidated_exposure\| > seuil | Non implémenté |

---

## 4. Données disponibles côté Odoo

L'endpoint `linky_bank_reconciliation` expose déjà :
- `bank_balance` (via `_get_bank_balance`) : solde des comptes bancaires (somme des `balance` des account.move.line)  
- Utilisable comme **erp_balance** après exposition dans l'API

**Actuellement** : `bank_balance` n'est pas renvoyé dans la réponse standard (uniquement en `_debug`).

---

## 5. Amendements proposés à la SPEC v4.0

### 5.1 Alignement sur les événements existants

**Amendement :** Préciser que la source Vault correspond aux événements `bank.move.reconciled` (équivalent fonctionnel de `reconciliation.validated`).

### 5.2 Périmètre multi-société

**Amendement :** La SPEC ne traite pas le filtrage `company_id`. Proposer d'aligner sur l'existant : paramètre `company_id` optionnel (0 ou vide = consolidé).

### 5.3 Période (date_debut, date_fin)

**Amendement :** La SPEC ne précise pas si les agrégations sont filtrées par période. Actuellement, la projection RECONCIL n'est pas filtrée par date (état courant). Valider si `validated_balance` et `erp_balance` doivent être :
- sans filtre date (état courant), ou  
- filtrés par période pour cohérence avec le reste du cockpit.

### 5.4 Cas erp_balance = 0

**Amendement :** Spécifier explicitement : si `erp_balance = 0`, alors `bank_reliability = 100 %` (comportement déjà défini, à confirmer dans la SPEC).

### 5.5 Seuil d'alerte « Écart important »

**Amendement :** Définir le seuil (ex. configurable par tenant, ou pourcentage du \|erp_balance\|) et le libellé du badge d'alerte.

---

## 6. Cadrage stratégique — Net vs volume

### 6.1 Le choix structurant

Ces deux modèles ne racontent **pas** la même chose :

| Modèle | Formule | Mesure |
|--------|---------|--------|
| **Volume** (Σ \|amount\|) | Activité bancaire | Santé opérationnelle du rapprochement — « Mes relevés sont-ils traités ? » (process) |
| **Net** (Σ signed_amount) | Position bancaire | Position financière validée — « Quelle est ma trésorerie confirmée ? » (financier) |

### 6.2 Recommandation : complément, pas remplacement

**Ne pas supprimer le volume.** Changer le rôle des indicateurs :

| Indicateur | Type | Rôle |
|------------|------|------|
| `validated_balance` (net signé) | Financier | Position confirmée par la banque |
| `reconciled_volume` (Σ ABS) | Opérationnel | Charge bancaire traitée |
| `reliability_volume` | Process | Qualité du rapprochement |
| `erp_balance` | Comptable | Référence ERP |

La v4.0 doit devenir un **complément**, pas un remplacement brutal — sinon la sémantique du cockpit change sans le dire.

### 6.3 Deux fiabilités distinctes

| Indicateur | Formule | Mesure |
|------------|---------|--------|
| **reliability_volume** (existant) | reconciled_volume / (reconciled + unreconciled) | Qualité du traitement bancaire (process) |
| **reliability_position** (v4.0) | \|validated_balance\| / \|erp_balance\| | Écart comptable (position) |

**Recommandation :** garder les deux, ne pas les mélanger.

### 6.4 Décalage erp_balance vs Vault — à documenter

Oui, un décalage structurel peut exister : écritures d'ouverture, OD manuelles, régularisations, différences de base (ledger vs statement lines). **Documenter cette limite** pour éviter : « Pourquoi mon Vault ne correspond pas exactement à Odoo ? » — ce sera normal.

### 6.5 Multi-société — conserver l'existant

Conserver : `company_id` optionnel, `0` = consolidé. La SPEC doit l'indiquer explicitement.

### 6.6 Période — carte = état courant

Ne pas mélanger : position bancaire (stock) vs flux sur période. **Carte = état courant** (non filtrée par date). Sinon `erp_balance` devient incohérent avec le filtre période.

### 6.7 Cas signes opposés — badge alerte

Si `erp_balance = -100` et `validated_balance = +50` → `unvalidated_exposure = -150`.  
**Interprétation :** 150 € d'écart non confirmé dans le sens opposé à la position ERP. Ce cas doit déclencher un **badge ⚠️** — ce n'est pas un bug, c'est une alerte.

---

## 7. Phase 0 — Décision stratégique (avant dev)

**Décider officiellement :**
- ajoute-t-on la v4.0 en complément du modèle existant ?
- ou remplace-t-on le modèle existant ?

Cela change la **narration produit** : on passe d'une carte « Qualité de rapprochement » à une carte « Position bancaire probante ». Ce n'est pas un détail technique, c'est un repositionnement.

---

## 8. Version stable recommandée — 2 axes

### Carte Trésorerie = 2 axes

| Axe | Blocs | Rôle |
|-----|-------|------|
| **Axe 1 — Position** | Trésorerie validée (net signé), Exposition non validée, Solde ERP | Vision financière et probante |
| **Axe 2 — Fiabilité process** | Volume rapproché, Volume non rapproché, Taux de traitement | Vision opérationnelle |

Résultat : vision financière + opérationnelle + probante, cohérente avec Dorevia.

---

## 9. Plan de mise en œuvre (révisé)

| Phase | Tâche | Impact |
|-------|-------|--------|
| **0. Décision** | Valider : complément (2 axes) vs remplacement | Produit |
| **1. Données** | Vault : ajouter `validated_balance_signed` (SUM signé) ET conserver `reconciled_volume` (SUM ABS) | `bank_reconciliation.go`, `aggregations_treasury.go` |
| **2. Données** | Odoo : exposer `erp_balance` (bank_balance) | `linky_bank_reconciliation.py` |
| **3. Données** | Vault : propager `erp_balance` | `bank_reconciliation_health.go` |
| **4. API** | Linky : exposer les deux axes (position + volume) | `treasury/route.ts` |
| **5. UI** | Linky : structure 2 axes (Position / Fiabilité process), badge alerte signes opposés | `TreasuryCardWithPolling.tsx` |
| **6. Doc** | Documenter limite erp vs Vault (écritures d'ouverture, OD, régularisations) | Spéc ou guide utilisateur |

---

## 10. Fichiers concernés

| Fichier | Modification prévue |
|---------|---------------------|
| `sources/vault/internal/storage/bank_reconciliation.go` | Retourner à la fois SUM(amount) et SUM(ABS(amount)) pour reconciled/unreconciled |
| `sources/vault/internal/handlers/aggregations_treasury.go` | Exposer validated_balance (net), reconciled_volume, unreconciled_volume, erp_balance, unvalidated_exposure, reliability_volume, reliability_position |
| `units/odoo/.../linky_bank_reconciliation.py` | Ajouter `erp_balance` (bank_balance) dans la réponse |
| `sources/vault/internal/handlers/bank_reconciliation_health.go` | Propager erp_balance |
| `units/dorevia-linky/app/api/treasury/route.ts` | Mapper les deux axes (position + volume) |
| `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` | Structure 2 axes, badge alerte signes opposés |

---

*Rapport mis à jour le 25 février 2026. Cadrage stratégique intégré (Net vs Volume, 2 axes, Phase 0).*
