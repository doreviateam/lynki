# 💰 Réflexion — Facturation MRR basée sur la vérité Vault (v2.1 — finale consolidée)

**Statut** : Document de référence (pré‑SPEC)  
**Version** : 2.1 (finale consolidée)  
**Date** : 2026-01-03  
**Périmètre** : Plateforme Dorevia — Facturation centralisée

> **📋 Documents liés**  
> - **FACTURATION_MRR_CONSTATS_VAULT_v2.1-op.md** : Version opérationnelle (post‑réflexion, pré‑SPEC)

---

## 1. Objectif du document

Ce document constitue la **référence conceptuelle officielle** du modèle de facturation MRR de Dorevia.

Il vise à :
- clarifier les **principes non négociables**,
- fixer les **frontières de responsabilité** entre composants,
- établir le **modèle mental de facturation mensuelle**,
avant toute spécification technique ou implémentation.

---

## 2. Principe fondamental (verrou architectural)

> **Le Vault n'est pas un moteur de facturation.**  
> **Il constate et atteste des volumes.**  
> **Odoo CORE reçoit, calcule et facture.**

Conséquences directes :
- le Vault ne connaît **ni les prix**, **ni les contrats**, **ni la TVA** ;
- toute logique commerciale et comptable vit **exclusivement** dans Odoo CORE ;
- le MRR est un **résultat comptable**, jamais un calcul technique côté plateforme.

---

## 3. Architecture cible (simplifiée)

### Acteurs

- **Vaults (multiples, distribués)**  
  Producteurs de vérité technique et probatoire.
- **Tenants**  
  Unité contractuelle et facturable.
- **Odoo CORE** (`odoo.prod.core.doreviateam.com`)  
  Autorité commerciale et comptable unique.

### Schéma conceptuel

```
VAULT(S)
  └─► Constats (tenant, période, volumes, preuve)
           │
           ▼
ODOO.PROD.CORE.DOREVIATEAM
  └─► Calcul des montants
  └─► Émission des factures
```

---

## 4. Règle officielle de vaulting — Scope v1

> **Dans le scope v1, sont vaultés tous les objets Odoo liés à la facturation d'Achat et de Vente, dès lors qu'ils sont en état `posted`.**

### Objets inclus explicitement

**Vente**
- `account.move` — factures clients (`out_invoice`) — `posted`
- `account.move` — avoirs clients (`out_refund`) — `posted`

**Achat**
- `account.move` — factures fournisseurs (`in_invoice`) — `posted`
- `account.move` — avoirs fournisseurs (`in_refund`) — `posted`

### Objets exclus explicitement

- documents en `draft`, `cancel` ou états intermédiaires,
- devis, commandes, documents préparatoires,
- flux POS (tickets, sessions, Z de caisse) — **hors scope v1**.

> **Principe clé** : seuls les objets comptables finalisés, générant ou corrigeant une facture, sont vaultés.

Cette règle garantit l'auditabilité et l'opposabilité des pièces comptables, conformément aux exigences de conformité actuelles et à venir.

---

## 5. Unité de vérité

L'unité de vérité facturable est :

> **1 tenant × 1 période × 1 constat Vault**

Un constat Vault est :
- horodaté,
- signé (preuve cryptographique),
- autonome,
- opposable,
- strictement descriptif (volumes uniquement, aucun montant).

---

## 6. Rôle détaillé des composants

### 6.1 Vault

Le Vault :
- collecte les événements,
- garantit leur unicité, leur intégrité et leur chronologie,
- agrège par **tenant** et par **période**,
- produit un **constat de volumes**,
- transmet ce constat à Odoo CORE.

Le Vault **ne fait jamais** :
- de calcul de prix,
- de règle commerciale,
- de calcul ou stockage du MRR.

---

### 6.2 Odoo CORE (facturation centrale)

Odoo CORE :
- reçoit les constats Vault,
- rattache chaque constat à un tenant et à un contrat,
- applique les règles contractuelles et fiscales via les objets standards Odoo,
- calcule les montants,
- génère **une facture par tenant et par période**.

Odoo CORE est **l'unique source de vérité commerciale et financière**.

---

## 7. Flux mental mensuel (rituel de facturation)

Pour **n tenants**, chaque mois :

1. La période se termine.
2. Chaque Vault constate les volumes par tenant.
3. Chaque Vault transmet les constats à Odoo CORE.
4. Odoo CORE :
   - reçoit les constats,
   - applique les règles contractuelles,
   - calcule les montants,
   - génère une facture par tenant.

> **Chaque tenant est facturable indépendamment des autres.**

---

## 8. Modèle de facturation (conceptuel)

Sans figer les tarifs, le modèle cible repose sur :

- **un abonnement fixe mensuel** (par tenant),
- **un usage variable**, calculé à partir des volumes attestés par Vault.

Exemple conceptuel :
- Ligne 1 : Abonnement plateforme
- Ligne 2 : Volume d'événements vaultés — période donnée

---

## 9. Positionnement du MRR

Le **MRR n'est pas un mécanisme technique**.

Il est :
- un **résultat comptable**,
- produit exclusivement par Odoo CORE,
- fondé sur des faits attestés par le Vault.

Il n'est :
- ni stocké,
- ni calculé,
- ni estimé côté Vault.

---

## 10. Ce qui est volontairement hors scope (v2.1)

Sont explicitement exclus à ce stade :

- moteur de calcul MRR hors Odoo,
- règles tarifaires stockées côté plateforme ou Vault,
- snapshots MRR techniques,
- recalcul rétroactif automatique,
- BI ou dashboards avancés,
- intégration POS (prévue en extension ultérieure).

Ces exclusions sont **assumées** pour garantir simplicité, auditabilité et robustesse.

---

## 11. Bénéfices du modèle retenu

- séparation stricte entre **preuve** et **business**,
- facturation opposable et audit‑ready,
- résilience multi‑Vault,
- simplicité d'exploitation,
- évolutivité sans refonte architecturale.

---

## 12. Prochaine étape logique

Une fois ce document validé, l'ordre naturel des spécifications est :

**SPEC 1** : Vaulting `account.move` `posted`  
**SPEC 2** : Vault → Constat mensuel  
**SPEC 3** : Module `dorevia_billing_core` (CORE only)

Implémentation progressive côté Odoo CORE.

---

## 13. Conclusion

> **Dorevia facture sur la base de faits attestés,  
> et non sur des déclarations applicatives.**

Ce document constitue la **référence conceptuelle finale v2.1**,  
base de toutes les spécifications et implémentations futures.
