# 🧱 Règles Fondatrices Dorevia — v1.0

**Produit** : Dorevia Vault & Billing CORE  
**Version** : 1.0  
**Statut** : 🔒 Figé (socle fondateur)  
**Date** : 2026-01-04

---

## 🎯 Objet du document

Ce document définit les **règles fondatrices irréversibles** du système Dorevia.
Il constitue le **socle de référence** pour :

* l'architecture technique,
* la facturation MRR,
* la relation contractuelle client,
* la conformité réglementaire.

Ces règles s'imposent à l'ensemble des composants (ERP, connecteurs, Vault, Billing) et **ne peuvent être remises en cause sans rupture de version majeure**.

---

## 1️⃣ Principe de vérité

### Règle

> **La vérité ne vient jamais de l'ERP. Elle vient du Vault.**

### Conséquences

* L'ERP est un **producteur d'événements**, pas un arbitre de vérité.
* Le Vault est le **registre de faits comptables opposables**.
* Toute logique de facturation, de preuve ou d'audit se base sur le Vault.

---

## 2️⃣ Immutabilité des documents comptables

### Règle

> **Tout document comptable à l'état `POSTED` est définitif et immuable.**

### Interdictions

* ❌ Modification
* ❌ Suppression
* ❌ Réécriture

### Correction autorisée

> **Toute correction passe par un nouveau document comptable.**

Exemples :

* Annulation → `out_refund`
* Rectification → nouvelle `out_invoice`

---

## 3️⃣ Annulation de facture (`out_refund`)

### Règle

> **Une facture annulée génère deux événements comptables POSTED distincts :**
>
> 1. la facture initiale (`out_invoice`)
> 2. l'écriture d'annulation (`out_refund`)

### Conséquences

* Chaque événement est :

  * vaulté
  * signé (JWS)
  * chaîné (ledger)
  * comptabilisé dans les volumes

> **Le MRR mesure l'activité réelle du système, pas le solde comptable.**

---

## 4️⃣ Fondement de la facturation MRR

### Règle

> **Dorevia facture des faits constatés, jamais des faits en cours.**

### Implémentation

* Les volumes facturés proviennent des **constats mensuels Vault**.
* Les constats portent exclusivement sur des **périodes closes**.
* Un constat n'est jamais modifié après génération.

---

## 5️⃣ Exigibilité et paiement

### Règle

> **L'exigibilité des factures MRR est régie par les conditions de paiement Odoo.**

### Conséquences

* Le constat est le **fait générateur**.
* La facture est émise par Odoo CORE.
* Les délais de paiement (30j, 45j, etc.) sont ceux du contrat client.

---

## 6️⃣ Modèle de prix

### Règle

> **Le modèle tarifaire est standard, le prix est contractuel.**

### Principes

* Un montant fixe mensuel peut être appliqué (ex : 80 € HT).
* Le montant est **configurable par règle tarifaire**.
* Chaque tenant peut disposer de conditions spécifiques.

Aucun prix n'est hard-codé dans le système.

---

## 7️⃣ Conformité Factur-X

### Règle

> **Factur-X est le standard, sans surcoût.**

### Conséquences

* La conformité est :

  * détectée
  * mesurée
  * tracée
* Elle n'entraîne **aucune majoration tarifaire en v1**.

---

## 8️⃣ Frontière tenant / base / sociétés

### Règle

> **1 tenant = 1 base de données = n sociétés.**

### Définition

* Le tenant est :

  * l'unité contractuelle
  * l'unité de vérité
* Les sociétés (`company_id`) sont une organisation interne au tenant.
* Chaque tenant dispose :

  * d'un seul Vault
  * d'un seul registre de constats

---

## 9️⃣ Gestion des cas sensibles

### Règle

> **Les constats à problème sont gérés par l'admin Dorevia.**

### Cas concernés

* `validated_with_warning`
* constat sans contrat actif
* constat sans tenant identifié

### Principe

* Traitement manuel
* Traçabilité complète
* Aucune automatisation prématurée

---

## 🔒 Statut du document

Ce document constitue la **doctrine fondatrice Dorevia v1.0**.

Toute évolution devra :

* être explicitement versionnée,
* préserver la cohérence du socle,
* être compatible avec les principes d'immutabilité, de traçabilité et de preuve.

---

**Fin du document**

