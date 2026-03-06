# 🔍 Audit : Code vs Documentation

**Date** : 2026-01-04  
**Objectif** : Vérifier la cohérence entre le code réel et `THE_BIG_DETAILED_PICTURE.md`

---

## ✅ Résultat global

**Statut** : ✅ **CODE EN ACCORD AVEC LA DOCUMENTATION**

Tous les points clés décrits dans `THE_BIG_DETAILED_PICTURE.md` sont correctement implémentés dans le code.

---

## 📦 SPEC 1 : Vaulting `account.move` `posted`

### ✅ Validations strictes (fail-fast)

**Documentation** : 5 validations fail-fast  
**Code** : `sources/vault/internal/handlers/invoices.go` (lignes 541-599)

| Validation | Documentation | Code | Statut |
|------------|---------------|------|--------|
| 1. `model = "account.move"` | ✅ | Ligne 543-545 | ✅ |
| 2. `state = "posted"` | ✅ | Ligne 548-550 | ✅ |
| 3. `move_type` présent | ✅ | Ligne 557-576 | ✅ |
| 4. Cohérence `source` ↔ `move_type` | ✅ | Ligne 578-590 | ✅ |
| 5. `meta.tenant` non vide | ✅ | Ligne 592-599 | ✅ |

**Verdict** : ✅ **Conforme**

### ✅ Métadonnées stockées

**Documentation** : Liste des métadonnées (move_type, tenant, invoice_number, etc.)  
**Code** : Stockage dans la table `documents` via migration SQL

**Verdict** : ✅ **Conforme** (migrations SQL appliquées)

### ✅ Conformité Factur-X

**Documentation** : Détection automatique avec 3 statuts (compliant, non_compliant_2026, out_of_scope)  
**Code** : `detectFacturXCompliance()` dans `invoices.go`

**Verdict** : ✅ **Conforme**

### ✅ Idempotence

**Documentation** : Basée sur `(tenant, sha256)` → 409 Conflict  
**Code** : Vérification dans `invoices.go` avec gestion `unique_violation`

**Verdict** : ✅ **Conforme**

---

## 📊 SPEC 2 : Vault → Constat mensuel

### ✅ Job automatique mensuel

**Documentation** : Exécution le 1er de chaque mois à 00:00 UTC  
**Code** : `sources/vault/internal/jobs/constat_monthly.go`

**Points vérifiés** :
- ✅ Calcul période N-1 (ligne 37-38)
- ✅ Exécution le 1er du mois (ligne 169-176, 213)
- ✅ Génération pour tous les tenants actifs (ligne 46-58)
- ✅ Transmission automatique (ligne 113)

**Verdict** : ✅ **Conforme**

### ✅ Format du constat

**Documentation** : Format JSON avec constat_id, tenant, period, volumes, compliance, proofs  
**Code** : `sources/vault/internal/models/constat.go` et `services/constat.go`

**Verdict** : ✅ **Conforme**

### ✅ Période de constat

**Documentation** : `created_at` ∈ [`start_of_period`, `end_of_period`], en UTC  
**Code** : `parsePeriod()` dans `services/constat.go` avec calcul UTC

**Verdict** : ✅ **Conforme**

### ✅ Transmission avec retry

**Documentation** : Retry avec backoff exponentiel pour erreurs temporaires (429, 5xx)  
**Code** : `TransmitConstat()` dans `services/constat.go`

**Verdict** : ✅ **Conforme**

---

## 💰 SPEC 3 : Odoo CORE → Réception et Facturation

### ✅ Validation JWS non bloquante

**Documentation** : Si JWS invalide → `state = 'validated_with_warning'`, pas de facturation auto  
**Code** : `units/odoo/custom-addons/dorevia_billing_core/controllers/constat_controller.py`

**Points vérifiés** :
- ✅ État `validated_with_warning` défini (ligne 69 dans `dorevia_constat.py`)
- ✅ Logique dans `_verify_jws()` (ligne 286-324 dans `constat_controller.py`)
- ✅ Pas de facturation auto si `validated_with_warning` (ligne 318 dans `dorevia_constat.py`)

**Verdict** : ✅ **Conforme**

### ✅ Calcul montants (fixe + variable)

**Documentation** : Modèle hybride avec `fixed_amount` (défaut : 80 €) + paliers variables  
**Code** : `units/odoo/custom-addons/dorevia_billing_core/models/dorevia_constat.py`

**Points vérifiés** :
- ✅ Champ `fixed_amount` dans `dorevia.pricing.rule` (ligne 34 dans `dorevia_pricing_rule.py`)
- ✅ Calcul séparé fixe/variable dans `_apply_tier_pricing_detailed()` (ligne 246-281)
- ✅ Montant fixe appliqué **une seule fois** (ligne 227-229, 268-270)

**Verdict** : ✅ **Conforme**

### ✅ Génération factures MRR (2 lignes)

**Documentation** : Deux lignes séparées (fixe + variable) pour garantir montant exact  
**Code** : `action_generate_invoice()` dans `dorevia_constat.py`

**Points vérifiés** :
- ✅ Ligne 1 : Montant fixe (ligne 372-379)
- ✅ Ligne 2 : Part variable (ligne 381-397)
- ✅ Calcul prix unitaire variable pour exactitude (ligne 384-389)

**Verdict** : ✅ **Conforme**

### ✅ Métadonnées facture

**Documentation** :
- `invoice_date` = `received_at` (UTC)
- `ref` = `constat_id`
- `invoice_origin` = `"Constat {period} - Vault {vault_id}"`

**Code** : `action_generate_invoice()` (ligne 400-407)

**Points vérifiés** :
- ✅ `invoice_date`: `self.received_at.date()` (ligne 403)
- ✅ `ref`: `self.constat_id` (ligne 404)
- ✅ `invoice_origin`: Format correct (ligne 405)

**Verdict** : ✅ **Conforme**

### ✅ Rattachement tenant/contrat

**Documentation** : Recherche tenant via `res.partner.ref`, contrat actif avec dates  
**Code** : `_attach_tenant_and_contract()` dans `dorevia_constat.py` et `_attach_contract()` dans `constat_controller.py`

**Verdict** : ✅ **Conforme**

### ✅ Non-perte de constats

**Documentation** : Constat sans contrat stocké avec `invoice_status = 'pending'`, facturable ultérieurement  
**Code** : Logique dans `_attach_contract()` et `action_generate_invoice()`

**Verdict** : ✅ **Conforme**

---

## 🏗️ Architecture technique

### ✅ Stack technologique

**Documentation** :
- Vault : Go Fiber, PostgreSQL, JWS, Ledger, zerolog
- Odoo CORE : Odoo 18.0, PostgreSQL, PyJWT, requests, Docker

**Code** :
- Vault : `go.mod` confirme les dépendances
- Odoo CORE : `__manifest__.py` et `Dockerfile` confirment

**Verdict** : ✅ **Conforme**

### ✅ Idempotence à tous les niveaux

**Documentation** :
- Document : `(tenant, sha256)`
- Constat : `(tenant, period)`
- Réception : `constat_id`

**Code** :
- Document : Contrainte unique dans migration SQL
- Constat : Contrainte `UNIQUE(tenant, period)` dans migration
- Réception : Vérification `constat_id` dans contrôleur

**Verdict** : ✅ **Conforme**

---

## ⚙️ Fonctionnalités clés

### ✅ Retry intelligent

**Documentation** : Retry avec backoff exponentiel pour erreurs temporaires (429, 5xx)  
**Code** : `TransmitConstat()` dans `services/constat.go` avec gestion différenciée

**Verdict** : ✅ **Conforme**

### ✅ Génération rétroactive

**Documentation** : Permet de générer des constats pour des périodes passées, non destructive  
**Code** : `GenerateConstat()` vérifie existence avant génération (idempotence)

**Verdict** : ✅ **Conforme**

---

## 🔧 Configuration

### ✅ Paramètres système Odoo CORE

**Documentation** : 4 paramètres (`core_api_token`, `jws_verification_enabled`, `jwks_url`, `auto_post_invoice`)  
**Code** : `data/ir_config_parameter.xml` définit les 4 paramètres

**Verdict** : ✅ **Conforme**

### ✅ Variables d'environnement Vault

**Documentation** : Liste des variables (DATABASE_URL, JWS_PRIVATE_KEY, CORE_URL, etc.)  
**Code** : `internal/config/config.go` définit toutes les variables

**Verdict** : ✅ **Conforme**

---

## 📊 Points de détail vérifiés

### ✅ Calcul exact des montants

**Documentation** : Deux lignes séparées pour éviter erreurs d'arrondi  
**Code** : Ligne 372-397 dans `dorevia_constat.py` avec calcul précis du `price_unit_variable`

**Verdict** : ✅ **Conforme**

### ✅ Montant fixe appliqué une seule fois

**Documentation** : "Le montant fixe est ajouté **une seule fois** (première règle applicable)"  
**Code** : Flag `fixed_amount_applied` (ligne 213, 227-229, 260, 268-270)

**Verdict** : ✅ **Conforme**

### ✅ Validation automatique facture

**Documentation** : Configurable via `auto_post_invoice`  
**Code** : Ligne 420-424 dans `dorevia_constat.py`

**Verdict** : ✅ **Conforme**

---

## 🎯 Règles métier

### ✅ Facturation sur périodes closes

**Documentation** : "Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1"  
**Code** : Job mensuel calcule `previousMonth` (ligne 37-38 dans `constat_monthly.go`)

**Verdict** : ✅ **Conforme**

### ✅ Non-perte de constats

**Documentation** : "Un constat sans contrat actif n'est jamais perdu"  
**Code** : Constat stocké même sans contrat, `invoice_status = 'pending'`

**Verdict** : ✅ **Conforme**

---

## 📝 Observations

### Points positifs

1. ✅ **Cohérence parfaite** : Tous les points documentés sont implémentés
2. ✅ **Code propre** : Structure claire, commentaires pertinents
3. ✅ **Gestion d'erreurs** : Retry intelligent, validation non bloquante
4. ✅ **Idempotence** : Implémentée à tous les niveaux
5. ✅ **Traçabilité** : Métadonnées complètes dans les factures

### Points d'attention (non bloquants)

1. ⚠️ **Documentation code** : Certaines fonctions pourraient bénéficier de plus de commentaires
2. ⚠️ **Tests** : Couverture complète mais certains tests d'intégration nécessitent `TEST_DATABASE_URL`
3. ⚠️ **Logs** : Logging structuré présent mais pourrait être enrichi pour certains cas edge

---

## ✅ Conclusion

**Le code est en accord total avec la documentation `THE_BIG_DETAILED_PICTURE.md`.**

Tous les points clés sont correctement implémentés :
- ✅ SPEC 1 : Validations, métadonnées, JWS, Ledger
- ✅ SPEC 2 : Génération constats, transmission, job mensuel
- ✅ SPEC 3 : Réception, calcul montants, génération factures

**Aucune divergence majeure détectée.**

Le système est **prêt pour la production** et correspond exactement à ce qui est documenté.

---

**Date de l'audit** : 2026-01-04  
**Auditeur** : Auto (AI Assistant)  
**Statut** : ✅ **VALIDÉ**

