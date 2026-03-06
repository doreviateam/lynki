# 📘 Plan d'Implémentation Dorevia Posted Lock — Mode Scrum

**Version** : 1.0  
**Date** : 2026-01-04  
**Base** : SPEC Dorevia Posted Lock v1.0 + Analyse Expert  
**Durée estimée** : 2 sprints (2 semaines)  
**Équipe** : Dev plateforme / Odoo CORE

> **Prérequis** : 
> - Odoo 18.0 CE installé
> - Module `account` activé
> - Module `mail` activé (si `allow_chatter=True`)

---

## 📋 Vue d'Ensemble

### Objectif du Module

Implémenter un verrouillage WORM-like (Write Once / Read Many) pour les factures `account.move` à l'état `posted`, empêchant toute modification métier après validation comptable, conformément à la **Règle Fondatrice Dorevia #2** : *"Tout document comptable à l'état `POSTED` est définitif et immuable."*

### Principe Fondamental

> **Une facture postée est immuable dans Odoo. Toute correction doit passer par un mécanisme standard : annulation, avoir, ou contre-passation.**

### Alignement avec les Règles Fondatrices

✅ **Règle Fondatrice #2** : Immutabilité des documents comptables `POSTED`  
✅ **Règle Fondatrice #3** : Annulation de facture (`out_refund`) — Compatible avec le verrou

### Définition de "Fait" (DoD)

Le module est terminé si :
- ✅ `write()` sur `account.move` posted bloque les champs protégés
- ✅ `write()` sur `account.move.line` d'un move posted bloque les champs protégés
- ✅ `unlink()` sur move/line posted est bloqué
- ✅ Réconciliation fonctionne normalement (champs techniques modifiables)
- ✅ `button_draft()` est bloqué (ou configurable)
- ✅ Bypass migration fonctionne (`skip_posted_lock` context)
- ✅ Chatter/attachments fonctionnent si activés
- ✅ Tests unitaires et d'intégration passent
- ✅ Documentation utilisateur et technique complète

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 1** : Structure module + Verrouillage `account.move` (1 semaine)
- **Sprint 2** : Verrouillage lignes + Edge cases + Tests (1 semaine)

**Total** : 2 semaines (13 points)

---

## 📦 Sprint 1 : Structure module + Verrouillage `account.move` (1 semaine)

**Points** : 8 points  
**Objectif** : Créer la structure du module, implémenter le verrouillage sur `account.move`, et gérer les cas edge (réconciliation, button_draft, bypass).

### User Stories

#### US-PL-1.1 : Structure du module et configuration

**En tant que** développeur Odoo CORE  
**Je veux** créer la structure de base du module `dorevia_posted_lock`  
**Afin de** préparer l'implémentation du verrouillage

**Points** : 2

**Critères d'acceptation** :
- [ ] Module créé avec `__manifest__.py` correct
- [ ] Dépendances : `account`, `mail` (optionnel)
- [ ] Paramètres système créés :
  - `dorevia_posted_lock.enabled` (bool, défaut: True)
  - `dorevia_posted_lock.allow_chatter` (bool, défaut: True)
  - `dorevia_posted_lock.apply_to_entries` (bool, défaut: False)
  - `dorevia_posted_lock.allow_draft` (bool, défaut: False)
- [ ] Fichiers de base créés : `models/`, `security/`, `data/`
- [ ] Module installable et activable dans Odoo

**Tâches techniques** :
- [ ] Créer structure `units/odoo/custom-addons/dorevia_posted_lock/`
- [ ] Créer `__init__.py`, `__manifest__.py`
- [ ] Créer `models/__init__.py`
- [ ] Créer `data/ir_config_parameter.xml` avec les 4 paramètres
- [ ] Créer `security/ir.model.access.csv` (si nécessaire)
- [ ] Tester installation du module

**Livrables** :
- ✅ Structure module complète
- ✅ Paramètres système configurés
- ✅ Module installable

---

#### US-PL-1.2 : Verrouillage `write()` sur `account.move`

**En tant que** utilisateur Odoo  
**Je veux** que toute modification d'une facture `posted` soit bloquée  
**Afin de** garantir l'immutabilité des documents comptables

**Points** : 5

**Critères d'acceptation** :
- [ ] Override de `write()` sur `account.move`
- [ ] Détection des champs protégés modifiés
- [ ] Vérification `state == 'posted'` et `move_type` dans scope
- [ ] Whitelist chatter/attachments si `allow_chatter=True`
- [ ] Whitelist réconciliation (champs techniques)
- [ ] Bypass si context `skip_posted_lock=True`
- [ ] Message d'erreur contextuel et prescriptif
- [ ] Performance optimisée (early exit si pas de champs protégés)

**Tâches techniques** :
- [ ] Créer `models/account_move.py`
- [ ] Définir constantes :
  - `PROTECTED_FIELDS` (champs comptables)
  - `RECONCILIATION_FIELDS` (champs techniques réconciliation)
  - `CHATTER_FIELDS` (chatter/attachments)
  - `INVOICE_TYPES` (out_invoice, in_invoice, out_refund, in_refund)
- [ ] Implémenter `write()` avec :
  - Early exit si lock désactivé
  - Early exit si pas de champs protégés
  - Vérification state + move_type
  - Filtrage whitelist (chatter si activé, réconciliation)
  - `UserError` si champs protégés modifiés
- [ ] Implémenter `_is_lock_enabled()`, `_is_chatter_allowed()`
- [ ] Implémenter `_get_lock_error_message()` (contextuel)

**Livrables** :
- ✅ `write()` bloquant les modifications de factures posted
- ✅ Gestion whitelist (chatter, réconciliation)
- ✅ Bypass migration fonctionnel
- ✅ Messages d'erreur contextuels

---

#### US-PL-1.3 : Blocage `button_draft()` et `unlink()` sur `account.move`

**En tant que** utilisateur Odoo  
**Je veux** que le reset to draft et la suppression de factures `posted` soient bloqués  
**Afin de** forcer l'utilisation de mécanismes comptables (annulation, avoir)

**Points** : 3

**Critères d'acceptation** :
- [ ] Override de `button_draft()` bloquant si `posted` et `move_type` dans scope
- [ ] Override de `unlink()` bloquant si `posted` et `move_type` dans scope
- [ ] Message d'erreur prescriptif (suggérer annulation/avoir)
- [ ] Respect du paramètre `allow_draft` (si True, autoriser `button_draft()`)

**Tâches techniques** :
- [ ] Implémenter `button_draft()` dans `models/account_move.py`
- [ ] Vérifier `state == 'posted'` et `move_type` dans scope
- [ ] Vérifier paramètre `allow_draft` (si False, bloquer)
- [ ] `UserError` avec message prescriptif
- [ ] Implémenter `unlink()` avec même logique
- [ ] Implémenter `_get_unlink_error_message()`

**Livrables** :
- ✅ `button_draft()` bloqué (ou configurable)
- ✅ `unlink()` bloqué
- ✅ Messages d'erreur prescriptifs

---

#### US-PL-1.4 : Gestion des One2many (`invoice_line_ids`, `line_ids`)

**En tant que** utilisateur Odoo  
**Je veux** que les modifications de lignes via `Command.UPDATE/DELETE` soient bloquées  
**Afin de** empêcher les contournements du verrouillage

**Points** : 3

**Critères d'acceptation** :
- [ ] Détection des `Command.UPDATE` sur `invoice_line_ids` / `line_ids`
- [ ] Détection des `Command.DELETE` sur `invoice_line_ids` / `line_ids`
- [ ] Blocage si move `posted` et `move_type` dans scope
- [ ] Message d'erreur spécifique pour modifications de lignes

**Tâches techniques** :
- [ ] Dans `write()`, détecter `vals['invoice_line_ids']` et `vals['line_ids']`
- [ ] Parser les `Command` (UPDATE, DELETE)
- [ ] Vérifier si move est `posted` et dans scope
- [ ] `UserError` si modification détectée
- [ ] Tester avec différents scénarios (create, update, delete, unlink)

**Livrables** :
- ✅ Détection et blocage des `Command.UPDATE/DELETE`
- ✅ Protection complète contre les contournements

---

## 📦 Sprint 2 : Verrouillage lignes + Edge cases + Tests (1 semaine)

**Points** : 5 points  
**Objectif** : Implémenter le verrouillage sur `account.move.line`, gérer les edge cases, et créer les tests complets.

### User Stories

#### US-PL-2.1 : Verrouillage `write()` et `unlink()` sur `account.move.line`

**En tant que** utilisateur Odoo  
**Je veux** que les modifications directes de lignes d'une facture `posted` soient bloquées  
**Afin de** garantir l'immutabilité complète des factures

**Points** : 3

**Critères d'acceptation** :
- [ ] Override de `write()` sur `account.move.line`
- [ ] Vérification du parent move (`move_id.state == 'posted'`)
- [ ] Vérification du `move_type` du parent
- [ ] Détection des champs protégés modifiés
- [ ] Override de `unlink()` bloquant
- [ ] Message d'erreur contextuel

**Tâches techniques** :
- [ ] Créer `models/account_move_line.py`
- [ ] Définir `PROTECTED_LINE_FIELDS` :
  - `account_id`, `debit`, `credit`, `balance`
  - `quantity`, `price_unit`, `discount`
  - `tax_ids`, `tax_line_id`, `tax_tag_ids`
  - `product_id`, `analytic_*`
  - `currency_id`, `amount_currency`
  - `partner_id`
- [ ] Implémenter `write()` :
  - Vérifier `move_id.state == 'posted'`
  - Vérifier `move_id.move_type` dans scope
  - Détecter champs protégés modifiés
  - `UserError` si modification
- [ ] Implémenter `unlink()` avec même logique

**Livrables** :
- ✅ `write()` bloquant les modifications de lignes
- ✅ `unlink()` bloquant la suppression de lignes
- ✅ Protection complète des factures posted

---

#### US-PL-2.2 : Champ `dorevia_vaulted` et verrouillage renforcé

**En tant que** développeur Dorevia  
**Je veux** un champ `dorevia_vaulted` pour identifier les factures vaultées  
**Afin de** préparer le verrouillage renforcé v1.1 (WORM total)

**Points** : 2

**Critères d'acceptation** :
- [ ] Champ `dorevia_vaulted` ajouté à `account.move`
- [ ] Champ visible dans la vue formulaire (readonly)
- [ ] Si `dorevia_vaulted=True` et `posted` : verrouillage renforcé (même chatter interdit)
- [ ] Préparation pour v1.1 (logique prête, non activée)

**Tâches techniques** :
- [ ] Ajouter champ `dorevia_vaulted = fields.Boolean()` dans `account_move.py`
- [ ] Ajouter champ dans vue formulaire (`views/account_move_views.xml`)
- [ ] Modifier `write()` pour vérifier `dorevia_vaulted` :
  - Si `True` et `posted` : whitelist chatter désactivée (même si `allow_chatter=True`)
- [ ] Documenter le comportement pour v1.1

**Livrables** :
- ✅ Champ `dorevia_vaulted` fonctionnel
- ✅ Verrouillage renforcé préparé (v1.1)

---

#### US-PL-2.3 : Tests unitaires complets

**En tant que** développeur Odoo CORE  
**Je veux** des tests unitaires couvrant tous les cas d'usage  
**Afin de** garantir la robustesse du module

**Points** : 3

**Critères d'acceptation** :
- [ ] Tests pour `write()` sur move posted (champs protégés)
- [ ] Tests pour `write()` sur move posted (chatter si activé)
- [ ] Tests pour `write()` sur move posted (réconciliation OK)
- [ ] Tests pour `button_draft()` bloqué
- [ ] Tests pour `unlink()` bloqué
- [ ] Tests pour `write()` sur lignes posted
- [ ] Tests pour `Command.UPDATE/DELETE` sur One2many
- [ ] Tests pour bypass migration (`skip_posted_lock`)
- [ ] Tests pour draft → write autorisé
- [ ] Tests pour entries (si `apply_to_entries=False`)

**Tâches techniques** :
- [ ] Créer `tests/__init__.py`
- [ ] Créer `tests/test_account_move_lock.py`
- [ ] Créer `tests/test_account_move_line_lock.py`
- [ ] Implémenter tous les tests unitaires
- [ ] Vérifier couverture de code (> 90%)

**Livrables** :
- ✅ Tests unitaires complets
- ✅ Couverture de code > 90%

---

#### US-PL-2.4 : Tests d'intégration

**En tant que** développeur Odoo CORE  
**Je veux** des tests d'intégration couvrant les workflows Odoo standards  
**Afin de** garantir la compatibilité avec les processus métier

**Points** : 2

**Critères d'acceptation** :
- [ ] Test : Posted + paiement + réconciliation complète
- [ ] Test : Posted + avoir généré automatiquement
- [ ] Test : Posted + reverse entry
- [ ] Test : Posted + annulation (`button_cancel`)
- [ ] Test : Posted + module OCA `account_global_discount` (si disponible)
- [ ] Test : Performance avec grands volumes (100+ factures)

**Tâches techniques** :
- [ ] Créer `tests/test_integration.py`
- [ ] Implémenter test réconciliation
- [ ] Implémenter test avoir
- [ ] Implémenter test reverse entry
- [ ] Implémenter test annulation
- [ ] Implémenter test performance

**Livrables** :
- ✅ Tests d'intégration complets
- ✅ Compatibilité workflows Odoo validée

---

#### US-PL-2.5 : Documentation utilisateur et technique

**En tant que** utilisateur/admin Odoo  
**Je veux** une documentation claire sur l'utilisation et la configuration du module  
**Afin de** comprendre le comportement et configurer correctement

**Points** : 2

**Critères d'acceptation** :
- [ ] Documentation utilisateur (README.md) :
  - Objectif du module
  - Configuration des paramètres
  - Comportement attendu
  - Messages d'erreur expliqués
- [ ] Documentation technique (DEVELOPER.md) :
  - Architecture du module
  - Liste des champs protégés
  - Whitelist réconciliation
  - Bypass migration (`skip_posted_lock`)
  - Extension pour v1.1
- [ ] Documentation dans le code (docstrings)

**Tâches techniques** :
- [ ] Créer `README.md` avec guide utilisateur
- [ ] Créer `DEVELOPER.md` avec guide technique
- [ ] Ajouter docstrings dans le code
- [ ] Documenter les paramètres système
- [ ] Documenter les cas edge (réconciliation, bypass)

**Livrables** :
- ✅ Documentation utilisateur complète
- ✅ Documentation technique complète
- ✅ Code documenté

---

## 📊 Récapitulatif des Points

| User Story | Points | Sprint | Statut |
|------------|--------|--------|--------|
| US-PL-1.1 | 2 | Sprint 1 | ⏳ En attente |
| US-PL-1.2 | 5 | Sprint 1 | ⏳ En attente |
| US-PL-1.3 | 3 | Sprint 1 | ⏳ En attente |
| US-PL-1.4 | 3 | Sprint 1 | ⏳ En attente |
| US-PL-2.1 | 3 | Sprint 2 | ⏳ En attente |
| US-PL-2.2 | 2 | Sprint 2 | ⏳ En attente |
| US-PL-2.3 | 3 | Sprint 2 | ⏳ En attente |
| US-PL-2.4 | 2 | Sprint 2 | ⏳ En attente |
| US-PL-2.5 | 2 | Sprint 2 | ⏳ En attente |
| **TOTAL** | **25** | **2 sprints** | **0%** |

---

## 🎯 Critères d'Acceptation Globaux

### Fonctionnels

- [ ] Write champs protégés sur facture posted ⇒ bloqué
- [ ] Write lignes facture posted ⇒ bloqué
- [ ] Unlink move/line posted ⇒ bloqué
- [ ] Réconciliation fonctionne normalement (champs techniques modifiables)
- [ ] `button_draft()` est bloqué (ou configurable via `allow_draft`)
- [ ] Flux de correction comptable restent possibles (annulation, avoir, reverse)
- [ ] Exceptions (chatter/attachments) fonctionnent si activées
- [ ] Bypass migration fonctionne (`skip_posted_lock` context)

### Techniques

- [ ] Tests unitaires passent (couverture > 90%)
- [ ] Tests d'intégration passent (réconciliation, avoir, reverse)
- [ ] Performance acceptable (pas de dégradation significative)
- [ ] Compatibilité Odoo 18.0 CE validée
- [ ] Compatibilité modules OCA standards testée

### Documentation

- [ ] Documentation utilisateur complète
- [ ] Documentation technique complète
- [ ] Code documenté (docstrings)

---

## ⚠️ Points d'Attention (Recommandations Analyse Expert)

### ⚠️ CRITIQUE : Gestion réconciliation

**Action** : ⚠️ **OBLIGATOIRE** — Ajouter whitelist `RECONCILIATION_FIELDS` en v1.0

**Champs à whitelister** :
- `line_ids.matched_debit_ids`
- `line_ids.matched_credit_ids`
- `line_ids.amount_residual`
- `line_ids.amount_residual_currency`
- `line_ids.full_reconcile_id`

---

### ⚠️ IMPORTANT : `button_draft()`

**Action** : ⚠️ **RECOMMANDÉ** — Bloquer explicitement `button_draft()` (US-PL-1.3)

**Solution** : Override de `button_draft()` avec vérification `state == 'posted'` et paramètre `allow_draft`.

---

### ⚠️ IMPORTANT : Bypass migration

**Action** : ⚠️ **RECOMMANDÉ** — Prévoir bypass via context `skip_posted_lock` (US-PL-1.2)

**Solution** : Vérifier `self.env.context.get('skip_posted_lock')` dans `write()` et `unlink()`.

---

### ⚠️ IMPORTANT : `Command.UPDATE/DELETE` sur One2many

**Action** : ⚠️ **RECOMMANDÉ** — Détecter et bloquer les modifications via Command (US-PL-1.4)

**Solution** : Parser `vals['invoice_line_ids']` et `vals['line_ids']` pour détecter `Command.UPDATE` et `Command.DELETE`.

---

## 📝 Notes d'Implémentation

### Structure de code recommandée

```python
# models/account_move.py
class AccountMove(models.Model):
    _inherit = 'account.move'
    
    # Constantes
    PROTECTED_FIELDS = {...}
    RECONCILIATION_FIELDS = {...}
    CHATTER_FIELDS = {...}
    INVOICE_TYPES = {...}
    
    def write(self, vals):
        # Early exits + vérifications
        ...
    
    def button_draft(self):
        # Blocage si posted
        ...
    
    def unlink(self):
        # Blocage si posted
        ...
```

### Ordre d'implémentation recommandé

1. **US-PL-1.1** : Structure module (base solide)
2. **US-PL-1.2** : Verrouillage `write()` (cœur du module)
3. **US-PL-1.3** : Blocage `button_draft()` et `unlink()` (complément)
4. **US-PL-1.4** : Gestion One2many (protection contre contournements)
5. **US-PL-2.1** : Verrouillage lignes (complément)
6. **US-PL-2.2** : Champ `dorevia_vaulted` (préparation v1.1)
7. **US-PL-2.3** : Tests unitaires (validation)
8. **US-PL-2.4** : Tests d'intégration (validation workflows)
9. **US-PL-2.5** : Documentation (finalisation)

---

## 🚀 Checklist de Déploiement

### Pré-déploiement

- [ ] Tous les tests passent
- [ ] Documentation complète
- [ ] Code review effectué
- [ ] Tests de performance validés
- [ ] Compatibilité modules OCA testée

### Déploiement

- [ ] Module installé en environnement de test
- [ ] Paramètres système configurés
- [ ] Tests de régression effectués
- [ ] Formation utilisateurs (si nécessaire)

### Post-déploiement

- [ ] Monitoring des erreurs (messages `UserError`)
- [ ] Feedback utilisateurs collecté
- [ ] Ajustements si nécessaire

---

## 📚 Références

- **SPEC** : Dorevia Posted Lock v1.0
- **Analyse Expert** : `ANALYSE_EXPERT_DOREVIA_POSTED_LOCK.md`
- **Règles Fondatrices** : `REGLES_FONDATRICES_DOREVIA_v1.0.md` (Règle #2)

---

**Date de création** : 2026-01-04  
**Version** : 1.0  
**Statut** : 📋 **Plan prêt pour implémentation**

