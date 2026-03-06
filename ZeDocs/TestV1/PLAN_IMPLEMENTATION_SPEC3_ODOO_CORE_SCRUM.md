# 📘 Plan d'Implémentation SPEC 3 — Odoo CORE : Réception des Constats et Facturation — Mode Scrum

**Version** : 1.0  
**Date** : 2026-01-04  
**Base** : `SPEC3_ODOO_CORE_RECEPTION_CONSTATS_FACTURATION_v1.0.md`  
**Durée estimée** : 2 sprints (2 semaines)  
**Équipe** : Dev plateforme / Odoo CORE

> **Prérequis** : 
> - SPEC 1 complétée (vaulting `account.move` `posted`)
> - SPEC 2 complétée (génération et transmission des constats depuis le Vault)

---

## 📋 Vue d'Ensemble

### Objectif SPEC 3

Implémenter dans **Odoo CORE** la réception des constats mensuels transmis par Dorevia Vault, le rattachement aux tenants et contrats, l'application des règles contractuelles et fiscales, le calcul des montants facturables, et la génération automatique des factures MRR.

Cette SPEC définit :
- L'endpoint de réception des constats (`POST /api/v1/constats`)
- Le modèle de données pour stocker les constats reçus
- Le processus de facturation basé sur les volumes constatés
- Les règles de calcul (prix unitaires, paliers, remises)
- La génération automatique des factures MRR

### Principe Fondamental

> **Odoo CORE calcule et facture à partir des constats Vault. Le Vault constate et atteste des volumes.**

Odoo CORE applique les règles métier (prix, contrats, TVA). Le Vault ne connaît ni les prix, ni les contrats, ni la TVA.

### Règle de Facturation MRR

> **⚠️ IMPORTANT** :  
> La facturation MRR est basée sur des **constats mensuels établis sur des périodes closes**.  
> Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1.  
> Dorevia facture des **faits constatés**, jamais des **faits en cours**.

**Exemple** :
- Constat pour période `2026-01` (janvier, **close**) → Reçu en février 2026
- Facture de février 2026 → Porte sur les volumes de janvier 2026 (période close)
- Les documents du mois en cours (février) ne sont pas facturés avant mars

### Définition de "Fait" (DoD)

La SPEC 3 est terminée si :
- ✅ L'endpoint `POST /api/v1/constats` est implémenté et testé
- ✅ Le modèle `dorevia_constat` est créé avec toutes les migrations
- ✅ Le rattachement tenant + contrat fonctionne
- ✅ Le calcul des montants avec règles tarifaires est correct
- ✅ La génération de factures MRR est automatique
- ✅ Les tests AC-1..AC-6 passent
- ✅ La documentation API est à jour
- ✅ Le déploiement en environnement de test est validé

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 1** : Migration DB + Modèles + Endpoint Réception (1 semaine)
- **Sprint 2** : Calcul + Facturation + Tests (1 semaine)

**Total** : 2 semaines

---

## 📦 Sprint 1 : Migration DB + Modèles + Endpoint Réception (1 semaine)

**Points** : 13 points  
**Objectif** : Préparer la base de données, créer les modèles Odoo, et implémenter l'endpoint de réception des constats.

### User Stories

#### US-3.1 : Migration base de données — Tables constats, contrats, règles tarifaires

**En tant que** développeur Odoo CORE  
**Je veux** créer les tables `dorevia_constat`, `dorevia_contract`, et `dorevia_pricing_rule`  
**Afin de** stocker les constats reçus, les contrats de facturation, et les règles tarifaires

**Points** : 5

**Critères d'acceptation** :
- [ ] Migration SQL créée pour `dorevia_constat`
- [ ] Migration SQL créée pour `dorevia_contract`
- [ ] Migration SQL créée pour `dorevia_pricing_rule`
- [ ] Toutes les colonnes nécessaires sont présentes
- [ ] Index créés pour optimiser les requêtes
- [ ] Contraintes UNIQUE sur `(constat_id)` et `(tenant_id, period)`
- [ ] Migrations testées et réversibles

**Tâches techniques** :
- [ ] Créer migration `dorevia_billing_core/migrations/1.0.0/post-migration.py` (ou équivalent)
- [ ] Table `dorevia_constat` :
  - `id INTEGER PRIMARY KEY`
  - `constat_id VARCHAR(36) UNIQUE NOT NULL`
  - `tenant_id Many2one(res.partner)`
  - `period VARCHAR(7) NOT NULL` (YYYY-MM)
  - `generated_at DATETIME NOT NULL`
  - `received_at DATETIME NOT NULL`
  - `vault_id VARCHAR(255)`
  - `volumes_out_invoice INTEGER DEFAULT 0`
  - `volumes_in_invoice INTEGER DEFAULT 0`
  - `volumes_out_refund INTEGER DEFAULT 0`
  - `volumes_in_refund INTEGER DEFAULT 0`
  - `compliance_compliant INTEGER DEFAULT 0`
  - `compliance_non_compliant_2026 INTEGER DEFAULT 0`
  - `compliance_out_of_scope INTEGER DEFAULT 0`
  - `proofs_jws TEXT`
  - `proofs_ledger_hash VARCHAR(255)`
  - `proofs_documents_count INTEGER DEFAULT 0`
  - `contract_id Many2one(dorevia.contract)`
  - `invoice_id Many2one(account.move)`
  - `invoice_status Selection('pending', 'invoiced', 'cancelled')`
  - `state Selection('draft', 'validated', 'validated_with_warning', 'invoiced', 'cancelled')`
- [ ] Table `dorevia_contract` :
  - `id INTEGER PRIMARY KEY`
  - `name VARCHAR(255) NOT NULL`
  - `tenant_id Many2one(res.partner)`
  - `start_date DATE NOT NULL`
  - `end_date DATE`
  - `active BOOLEAN DEFAULT TRUE`
  - `tax_rate FLOAT` (taux TVA)
  - `tax_exempt BOOLEAN DEFAULT FALSE`
- [ ] Table `dorevia_pricing_rule` :
  - `id INTEGER PRIMARY KEY`
  - `contract_id Many2one(dorevia.contract)`
  - `move_type Selection('out_invoice', 'in_invoice', 'out_refund', 'in_refund')`
  - `price_unit MONETARY NOT NULL`
  - `currency_id Many2one(res.currency)`
  - `tier_from INTEGER DEFAULT 0`
  - `tier_to INTEGER` (null = infini)
  - `discount_percent FLOAT DEFAULT 0`
  - `sequence INTEGER DEFAULT 10`
  - `active BOOLEAN DEFAULT TRUE`
- [ ] Index :
  - `idx_constat_tenant_period` : `(tenant_id, period)`
  - `idx_constat_period` : `(period)`
  - `idx_constat_invoice_status` : `(invoice_status)`
  - `idx_constat_state` : `(state)`
- [ ] Contraintes :
  - `UNIQUE(constat_id)`
  - `UNIQUE(tenant_id, period)` (idempotence)
  - `CHECK(period ~ '^\d{4}-\d{2}$')`

**Livrables** :
- ✅ Migrations SQL complètes
- ✅ Tables créées avec toutes les colonnes
- ✅ Index et contraintes configurés

---

#### US-3.2 : Modèles Odoo — dorevia_constat, dorevia_contract, dorevia_pricing_rule

**En tant que** développeur Odoo CORE  
**Je veux** créer les modèles Odoo pour gérer les constats, contrats et règles tarifaires  
**Afin de** avoir une interface Odoo pour gérer ces entités

**Points** : 5

**Critères d'acceptation** :
- [ ] Modèle `dorevia.constat` créé avec tous les champs
- [ ] Modèle `dorevia.contract` créé avec tous les champs
- [ ] Modèle `dorevia.pricing.rule` créé avec tous les champs
- [ ] Relations Many2one configurées correctement
- [ ] Relations One2many configurées correctement
- [ ] Vues list et form créées pour chaque modèle
- [ ] Droits d'accès configurés (`ir.model.access.csv`)

**Tâches techniques** :
- [ ] Créer `dorevia_billing_core/models/dorevia_constat.py`
  - Classe `DoreviaConstat(models.Model)`
  - Champs : `constat_id`, `tenant_id`, `period`, `generated_at`, `received_at`, `vault_id`, volumes, compliance, proofs, `contract_id`, `invoice_id`, `invoice_status`, `state`
  - Méthodes : `_check_period_format()`, `_compute_total_volumes()`, `action_generate_invoice()`
- [ ] Créer `dorevia_billing_core/models/dorevia_contract.py`
  - Classe `DoreviaContract(models.Model)`
  - Champs : `name`, `tenant_id`, `start_date`, `end_date`, `active`, `tax_rate`, `tax_exempt`, `pricing_rule_ids`
  - Méthodes : `_check_dates()`, `_get_active_contract(tenant_id, period)`
- [ ] Créer `dorevia_billing_core/models/dorevia_pricing_rule.py`
  - Classe `DoreviaPricingRule(models.Model)`
  - Champs : `contract_id`, `move_type`, `price_unit`, `currency_id`, `tier_from`, `tier_to`, `discount_percent`, `sequence`, `active`
  - Méthodes : `_check_tiers()`, `_compute_amount(volume)`
- [ ] Créer vues XML :
  - `dorevia_billing_core/views/dorevia_constat_views.xml`
  - `dorevia_billing_core/views/dorevia_contract_views.xml`
  - `dorevia_billing_core/views/dorevia_pricing_rule_views.xml`
- [ ] Configurer droits d'accès :
  - `dorevia_billing_core/security/ir.model.access.csv`
- [ ] Ajouter menus dans `dorevia_billing_core/views/menus.xml`

**Livrables** :
- ✅ Modèles Odoo complets
- ✅ Vues list et form
- ✅ Droits d'accès configurés

---

#### US-3.3 : Endpoint de réception — POST /api/v1/constats

**En tant que** développeur Odoo CORE  
**Je veux** un endpoint API REST pour recevoir les constats du Vault  
**Afin de** stocker les constats et déclencher la facturation

**Points** : 3

**Critères d'acceptation** :
- [ ] Endpoint `POST /api/v1/constats` créé
- [ ] Validation du payload JSON (champs obligatoires, types, format période)
- [ ] Vérification idempotence (`constat_id` unique)
- [ ] Stockage dans `dorevia_constat`
- [ ] Gestion des erreurs (400, 409, 422, 500)
- [ ] Authentification (token Bearer)
- [ ] Logs structurés

**Tâches techniques** :
- [ ] Créer `dorevia_billing_core/controllers/constat_controller.py`
  - Classe `ConstatController(http.Controller)`
  - Méthode `@http.route('/api/v1/constats', methods=['POST'], auth='api_key', csrf=False)`
  - Validation payload JSON
  - Vérification idempotence
  - Création `dorevia.constat` record
  - Retour JSON (201 Created ou 409 Conflict)
- [ ] Créer `dorevia_billing_core/security/security.xml`
  - Configuration API Key authentication
- [ ] Ajouter paramètre système `dorevia_billing.core_api_token`
- [ ] Gestion erreurs :
  - 400 : Payload invalide
  - 401 : Token invalide
  - 409 : Constat déjà reçu (idempotence)
  - 422 : Validation échouée
  - 500 : Erreur serveur
- [ ] Logs structurés avec `_logger`

**Livrables** :
- ✅ Endpoint API fonctionnel
- ✅ Validation et gestion d'erreurs
- ✅ Tests d'intégration endpoint

---

## 📦 Sprint 2 : Calcul + Facturation + Tests (1 semaine)

**Points** : 12 points  
**Objectif** : Implémenter le rattachement tenant + contrat, le calcul des montants, la génération de factures, et les tests.

### User Stories

#### US-3.4 : Rattachement tenant + contrat

**En tant que** développeur Odoo CORE  
**Je veux** rattacher automatiquement chaque constat à un tenant et un contrat actif  
**Afin de** appliquer les règles tarifaires correctes

**Points** : 2

**Critères d'acceptation** :
- [ ] Identification du tenant par `tenant` (correspond à `res.partner.code`)
- [ ] Recherche du contrat actif pour le tenant et la période
- [ ] Si aucun contrat actif, `contract_id = null` et `invoice_status = 'pending'`
- [ ] Si plusieurs contrats actifs, sélection du plus récent
- [ ] Règle : Un constat sans contrat actif n'est jamais perdu et peut être facturé ultérieurement

**Tâches techniques** :
- [ ] Modifier `dorevia_billing_core/models/dorevia_constat.py`
  - Méthode `_attach_tenant_and_contract()`
  - Recherche tenant : `res.partner.search([('code', '=', tenant)])`
  - Recherche contrat actif : `dorevia.contract.search([('tenant_id', '=', tenant_id), ('active', '=', True), ('start_date', '<=', period_end), ('|', ('end_date', '=', False), ('end_date', '>=', period_start))])`
  - Si plusieurs : prendre le plus récent (`order='start_date desc'`)
  - Mise à jour `constat.tenant_id` et `constat.contract_id`
- [ ] Appeler `_attach_tenant_and_contract()` lors de la création du constat (dans le controller)
- [ ] Gérer le cas `contract_id = null` : `invoice_status = 'pending'`

**Livrables** :
- ✅ Rattachement automatique tenant + contrat
- ✅ Gestion des cas sans contrat actif

---

#### US-3.5 : Calcul des montants avec règles tarifaires

**En tant que** développeur Odoo CORE  
**Je veux** calculer les montants facturables en appliquant les règles tarifaires (paliers, remises)  
**Afin de** facturer correctement selon les contrats

**Points** : 5

**Critères d'acceptation** :
- [ ] Application des règles tarifaires dans l'ordre (`sequence`)
- [ ] Calcul par paliers (tranches de volumes)
- [ ] Application des remises après calcul par palier
- [ ] Application de la TVA selon règles contractuelles
- [ ] Calcul correct des montants HT et TTC

**Tâches techniques** :
- [ ] Créer `dorevia_billing_core/models/dorevia_constat.py`
  - Méthode `_compute_amounts()`
  - Pour chaque `move_type` (out_invoice, in_invoice, out_refund, in_refund) :
    - Récupérer règles tarifaires : `contract.pricing_rule_ids.filtered(lambda r: r.move_type == move_type and r.active).sorted('sequence')`
    - Appliquer règles par palier :
      - Tranche 0-100 : `volume × price_unit × (1 - discount_percent / 100)`
      - Tranche 100-200 : `volume × price_unit × (1 - discount_percent / 100)`
      - etc.
    - Agrégation montants HT par `move_type`
  - Application TVA :
    - Si `contract.tax_exempt` : TVA = 0
    - Sinon : `montant_ht × (1 + contract.tax_rate / 100)`
  - Retour : dict avec montants HT et TTC par `move_type`
- [ ] Créer méthode `_get_pricing_rules(contract_id, move_type)`
- [ ] Créer méthode `_apply_tier_pricing(volume, rules)`
- [ ] Créer méthode `_apply_discount(amount, discount_percent)`
- [ ] Créer méthode `_apply_tax(amount_ht, tax_rate, tax_exempt)`

**Livrables** :
- ✅ Calcul des montants avec paliers et remises
- ✅ Application TVA correcte
- ✅ Tests unitaires de calcul

---

#### US-3.6 : Génération de factures MRR

**En tant que** développeur Odoo CORE  
**Je veux** générer automatiquement des factures MRR à partir des constats  
**Afin de** facturer les tenants selon les volumes constatés

**Points** : 3

**Critères d'acceptation** :
- [ ] Création `account.move` (type: `out_invoice`) à partir d'un constat
- [ ] Lignes de facturation correspondant aux volumes constatés
- [ ] Rattachement `constat.invoice_id`
- [ ] Mise à jour `constat.invoice_status = 'invoiced'`
- [ ] Métadonnées incluses (constat_id, period, vault_id)
- [ ] Date de facture = `received_at` (UTC)
- [ ] Validation automatique optionnelle (`auto_post_invoice`)

**Tâches techniques** :
- [ ] Modifier `dorevia_billing_core/models/dorevia_constat.py`
  - Méthode `action_generate_invoice()`
  - Vérifier `state = 'validated'` et `contract_id` présent
  - Vérifier `invoice_status = 'pending'` (pas déjà facturé)
  - Calcul montants : `_compute_amounts()`
  - Création `account.move` :
    - `type = 'out_invoice'`
    - `partner_id = tenant_id`
    - `invoice_date = received_at.date()`
    - `ref = constat_id`
    - Lignes de facturation :
      - Une ligne par `move_type` (ou par palier selon config)
      - `product_id` : Produit MRR configuré
      - `quantity` : Volume constaté
      - `price_unit` : Prix unitaire calculé
      - `discount` : Remise appliquée
      - `tax_ids` : Taxes selon contrat
  - Rattachement : `constat.invoice_id = invoice.id`
  - Mise à jour : `constat.invoice_status = 'invoiced'`
  - Si `auto_post_invoice` : `invoice.action_post()`
- [ ] Créer champ personnalisé `x_period` dans `account.move` (stockage période)
- [ ] Créer champ personnalisé `x_vault_id` dans `account.move` (stockage vault_id)
- [ ] Appeler `action_generate_invoice()` automatiquement après réception si `contract_id` présent

**Livrables** :
- ✅ Génération automatique de factures MRR
- ✅ Lignes de facturation correctes
- ✅ Métadonnées de traçabilité

---

#### US-3.7 : Vérification JWS (non bloquante) + Tests complets

**En tant que** développeur Odoo CORE  
**Je veux** vérifier la signature JWS des constats (non bloquant en v1) et avoir des tests complets  
**Afin de** garantir l'intégrité tout en évitant de bloquer la chaîne

**Points** : 2

**Critères d'acceptation** :
- [ ] Vérification JWS optionnelle (si activée)
- [ ] Si JWS invalide : stocker avec `state = 'validated_with_warning'`, ne pas facturer automatiquement
- [ ] Tests unitaires pour validation payload, calcul montants, idempotence
- [ ] Tests d'intégration pour réception complète, génération facture, gestion erreurs

**Tâches techniques** :
- [ ] Créer `dorevia_billing_core/models/dorevia_constat.py`
  - Méthode `_verify_jws(jws_token)` (optionnel)
  - Si vérification activée :
    - Récupérer JWKS du Vault (`ir.config_parameter.get_param('dorevia_billing.jwks_url')`)
    - Vérifier signature JWS
    - Si valide : `state = 'validated'`
    - Si invalide : `state = 'validated_with_warning'`, alerter, ne pas facturer
- [ ] Créer `dorevia_billing_core/tests/test_constat_reception.py`
  - `test_validate_payload_json()` : Validation champs obligatoires, types, format période
  - `test_idempotence()` : Doublons retournent 409
  - `test_attach_tenant_contract()` : Rattachement correct
  - `test_compute_amounts_tiers()` : Calcul avec paliers
  - `test_compute_amounts_discounts()` : Calcul avec remises
  - `test_compute_amounts_tax()` : Application TVA
  - `test_generate_invoice()` : Génération facture complète
  - `test_jws_verification_valid()` : JWS valide
  - `test_jws_verification_invalid()` : JWS invalide (warning, pas de facturation)
- [ ] Créer `dorevia_billing_core/tests/test_constat_integration.py`
  - `test_reception_complete_flow()` : Endpoint → stockage → facturation
  - `test_generate_invoice_with_pricing_rules()` : Facturation avec règles tarifaires
  - `test_error_handling()` : Gestion erreurs (validation, doublons)

**Livrables** :
- ✅ Vérification JWS non bloquante
- ✅ Tests unitaires complets
- ✅ Tests d'intégration complets

---

## 📊 Récapitulatif des Points

| User Story | Points | Sprint | Statut |
|:-----------|:-------|:-------|:-------|
| US-3.1 | 5 | Sprint 1 | ⏳ En attente |
| US-3.2 | 5 | Sprint 1 | ⏳ En attente |
| US-3.3 | 3 | Sprint 1 | ⏳ En attente |
| US-3.4 | 2 | Sprint 2 | ⏳ En attente |
| US-3.5 | 5 | Sprint 2 | ⏳ En attente |
| US-3.6 | 3 | Sprint 2 | ⏳ En attente |
| US-3.7 | 2 | Sprint 2 | ⏳ En attente |
| **Total** | **25** | **2 sprints** | **0%** |

---

## 🔗 Dépendances

### Externes

- **SPEC 1** : Doit être complétée et déployée (vaulting `account.move` `posted`)
- **SPEC 2** : Doit être complétée et déployée (génération et transmission des constats)
- **Odoo CORE** : Instance Odoo CORE accessible et configurée
- **Module `account`** : Module comptable Odoo activé
- **Module `contacts`** : Module contacts Odoo activé

### Internes

- **US-3.1** → **US-3.2** : Les migrations doivent être appliquées avant de créer les modèles
- **US-3.2** → **US-3.3** : Les modèles doivent exister avant l'endpoint
- **US-3.3** → **US-3.4** : L'endpoint doit fonctionner avant le rattachement
- **US-3.4** → **US-3.5** : Le rattachement doit fonctionner avant le calcul
- **US-3.5** → **US-3.6** : Le calcul doit fonctionner avant la facturation
- **US-3.6** → **US-3.7** : La facturation doit fonctionner avant les tests finaux

---

## 🧪 Stratégie de Tests

### Tests Unitaires

- Validation payload JSON
- Calcul montants (paliers, remises, TVA)
- Idempotence (doublons)
- Rattachement tenant + contrat
- Vérification JWS

### Tests d'Intégration

- Réception complète (endpoint → stockage → facturation)
- Génération facture avec règles tarifaires
- Gestion erreurs (validation, doublons, JWS invalide)

### Tests Manuels

- Création contrat avec règles tarifaires
- Réception constat via API
- Vérification facture générée
- Vérification métadonnées de traçabilité

---

## 📝 Notes d'Implémentation

### Règle de Facturation MRR

> **⚠️ IMPORTANT** :  
> La facturation MRR est basée sur des **constats mensuels établis sur des périodes closes**.  
> Chaque facture émise au mois N porte sur les volumes constatés durant le mois N-1.  
> Dorevia facture des **faits constatés**, jamais des **faits en cours**.

### Validation JWS Non Bloquante

En v1, la vérification JWS est **non bloquante** :
- Si JWS invalide : stocker avec `state = 'validated_with_warning'`, ne pas facturer automatiquement
- Permet d'éviter d'interrompre la chaîne en cas de problème crypto transitoire
- Permet facturation manuelle ultérieure après vérification

### Date de Facture

La date de facture est toujours `received_at` (date de réception du constat en UTC). Cette règle garantit la cohérence avec la facturation N-1/N et l'opposabilité.

### Constats sans Contrat Actif

Un constat sans contrat actif (`contract_id = null`) n'est jamais perdu et peut être facturé ultérieurement sans régénération (après création/activation du contrat).

### Lignes de Facture

Les lignes de facturation peuvent être **agrégées** (une ligne par `move_type`) ou **détaillées par palier** (une ligne par tranche) selon la configuration CORE. La SPEC n'impose pas un format unique.

---

## ✅ Checklist de Déploiement

### Pré-déploiement

- [ ] Toutes les migrations SQL testées
- [ ] Tous les modèles Odoo créés et testés
- [ ] Endpoint API testé avec différents scénarios
- [ ] Tests unitaires et d'intégration passent
- [ ] Documentation API à jour
- [ ] Configuration paramètres système (`ir.config_parameter`)

### Déploiement

- [ ] Installer module `dorevia_billing_core` dans Odoo CORE
- [ ] Appliquer migrations SQL
- [ ] Configurer paramètres système :
  - `dorevia_billing.core_api_token`
  - `dorevia_billing.jws_verification_enabled`
  - `dorevia_billing.jwks_url`
  - `dorevia_billing.auto_post_invoice`
- [ ] Créer au moins un contrat de test avec règles tarifaires
- [ ] Tester réception constat via API
- [ ] Vérifier génération facture

### Post-déploiement

- [ ] Monitoring des erreurs API
- [ ] Vérification logs structurés
- [ ] Validation factures générées
- [ ] Documentation utilisateur (si nécessaire)

---

## 📈 Métriques de Succès

- ✅ Taux de réception constats : 100% (tous les constats transmis sont reçus)
- ✅ Taux de facturation automatique : ≥ 95% (constats avec contrat actif)
- ✅ Temps de traitement : < 5 secondes par constat (réception → facturation)
- ✅ Taux d'erreurs : < 1% (erreurs de validation, doublons, etc.)

---

**Date de création** : 2026-01-04  
**Dernière mise à jour** : 2026-01-04

*Plan d'implémentation Scrum pour SPEC 3 — Odoo CORE : Réception des Constats et Facturation*

