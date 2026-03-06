# 📦 Guide Modules Dorevia — STINGER

**Date** : 2026-01-10  
**Contexte** : Modules disponibles dans Odoo STINGER pour `sarl-la-platine`

---

## 🎯 Vue d'Ensemble

Vous avez **6 modules Dorevia** disponibles dans votre instance Odoo STINGER. Voici leur rôle et leur importance.

---

## 📋 Modules Disponibles

### 1. **Dorevia Billing CORE** ⭐ (Principal)

**Rôle** : Reçoit des constats mensuels depuis le **Vault STINGER** et génère automatiquement des factures MRR.

**Fonctionnement** :
- Le **Vault STINGER** envoie des constats mensuels → Odoo
- Odoo calcule les montants facturables selon des règles tarifaires
- Odoo génère automatiquement des factures MRR

**⚠️ Important** : Ce module **reçoit** depuis Vault (pas d'envoi vers DVIG).

**Configuration nécessaire** :
- `dorevia_billing.core_api_token` : Token pour authentifier les requêtes du Vault
- `dorevia_billing.auto_post_invoice` : Validation automatique des factures (optionnel)

**Quand l'activer ?**
- ✅ Si vous voulez recevoir des constats mensuels depuis le Vault
- ✅ Si vous voulez générer automatiquement des factures MRR

---

### 2. **Dorevia Posted Lock** 🔒

**Rôle** : Verrouille les écritures comptables validées pour éviter les modifications.

**Fonctionnement** :
- Quand une facture est validée (`posted`), elle est verrouillée
- Impossible de modifier/supprimer une facture verrouillée
- Garantit l'intégrité comptable

**Quand l'activer ?**
- ✅ **Recommandé en production** pour éviter les erreurs
- ✅ Si vous voulez protéger vos écritures comptables

---

### 3. **Dorevia Report PDF Layout Fix** 📄

**Rôle** : Correctif pour les problèmes de mise en page des rapports PDF.

**Quand l'activer ?**
- ✅ Si vous avez des problèmes d'affichage dans les PDF Odoo
- ✅ Si les rapports PDF ne s'affichent pas correctement

---

### 4. **Dorevia Sale Proforma Report Fix** 📄

**Rôle** : Correctif pour les rapports de factures proforma.

**Quand l'activer ?**
- ✅ Si vous utilisez des factures proforma
- ✅ Si vous avez des problèmes d'affichage dans les rapports proforma

---

### 5. **Dorevia Sale Report Fix** 📄

**Rôle** : Correctif pour les rapports de ventes.

**Quand l'activer ?**
- ✅ Si vous avez des problèmes d'affichage dans les rapports de ventes

---

### 6. **Dorevia Sale Reports** 📊

**Rôle** : Améliorations et nouveaux rapports de ventes.

**Quand l'activer ?**
- ✅ Si vous voulez des rapports de ventes améliorés

---

## 🔄 Flux DVIG/Vault — Clarification

### ⚠️ Important : Deux flux différents

#### Flux 1 : Odoo → DVIG → Vault (Envoi d'événements)

**Ce que vous avez configuré** :
- ✅ `dorevia.dvig.url` = `https://dvig.core-stinger.doreviateam.com`
- ✅ `dorevia.dvig.token` = `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g`
- ✅ `dorevia.dvig.source` = `odoo.stinger.sarl-la-platine`

**À quoi ça sert ?**
- Permet à Odoo d'**envoyer** des événements financiers (factures, paiements) vers le Vault
- **Module nécessaire** : Un module qui utilise ces paramètres pour envoyer vers DVIG
- **État actuel** : Configuration prête, mais **aucun module visible** dans la liste ne fait cet envoi

**Question** : Avez-vous un module qui envoie des événements vers DVIG ? (peut-être pas encore installé ou avec un autre nom)

---

#### Flux 2 : Vault → Odoo (Réception de constats)

**Module** : `dorevia_billing_core`

**Fonctionnement** :
- Le **Vault STINGER** envoie des constats mensuels → Odoo
- Odoo reçoit via l'endpoint `/api/v1/constats`
- Odoo génère automatiquement des factures MRR

**Configuration nécessaire** :
- `dorevia_billing.core_api_token` : Token pour authentifier les requêtes du Vault

---

## ✅ Recommandations d'Activation

### Ordre recommandé

1. **Dorevia Posted Lock** 🔒
   - ✅ Activer en premier (protection comptable)
   - Impact : Verrouille les écritures validées

2. **Dorevia Billing CORE** ⭐
   - ✅ Activer si vous voulez recevoir des constats depuis Vault
   - Configuration : `dorevia_billing.core_api_token`

3. **Modules de correctifs PDF** (optionnel)
   - ✅ Activer seulement si vous avez des problèmes d'affichage PDF
   - `dorevia_report_pdf_layout_fix`
   - `dorevia_sale_proforma_report_fix`
   - `dorevia_sale_report_fix`

4. **Dorevia Sale Reports** (optionnel)
   - ✅ Activer si vous voulez des rapports améliorés

---

## ❓ Questions à Clarifier

### 1. Module d'envoi vers DVIG

**Question** : Avez-vous un module qui **envoie** des événements financiers vers DVIG/Vault ?

**Si OUI** :
- Ce module utilisera automatiquement les paramètres `dorevia.dvig.*` que vous avez configurés
- Vous pourrez tester le flux complet : Odoo → DVIG → Vault

**Si NON** :
- La configuration DVIG est prête pour quand vous installerez ce module
- Pour l'instant, vous pouvez utiliser `dorevia_billing_core` pour recevoir des constats

---

### 2. Besoin de recevoir des constats ?

**Question** : Voulez-vous que le Vault STINGER vous envoie des constats mensuels ?

**Si OUI** :
- ✅ Activer `dorevia_billing_core`
- ✅ Configurer `dorevia_billing.core_api_token`
- Le Vault pourra envoyer des constats → Odoo génère des factures

**Si NON** :
- Vous pouvez ignorer `dorevia_billing_core` pour l'instant

---

## 📊 Récapitulatif

| Module | Rôle | Nécessaire pour DVIG ? | Recommandation |
|--------|------|------------------------|----------------|
| **Dorevia Billing CORE** | Reçoit constats depuis Vault | ❌ Non (flux inverse) | ✅ Activer si besoin |
| **Dorevia Posted Lock** | Verrouille écritures | ❌ Non | ✅ **Recommandé** |
| **Dorevia Report PDF Layout Fix** | Correctif PDF | ❌ Non | ⚠️ Si problème PDF |
| **Dorevia Sale Proforma Report Fix** | Correctif proforma | ❌ Non | ⚠️ Si problème proforma |
| **Dorevia Sale Report Fix** | Correctif ventes | ❌ Non | ⚠️ Si problème ventes |
| **Dorevia Sale Reports** | Rapports améliorés | ❌ Non | ⚠️ Optionnel |

---

## 🎯 Prochaines Étapes

1. **Activer `dorevia_posted_lock`** (recommandé pour protection)
2. **Décider si vous voulez `dorevia_billing_core`** (pour recevoir des constats)
3. **Identifier le module d'envoi vers DVIG** (si vous en avez un)

---

**Version** : 1.0  
**Date** : 2026-01-10
