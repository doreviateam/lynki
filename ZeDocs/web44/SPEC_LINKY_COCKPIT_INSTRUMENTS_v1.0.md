# SPEC — Linky Cockpit Instruments

**Version :** 1.0  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Spécification fonctionnelle cockpit

---

## 1. Objectif

Définir la structure du cockpit financier **Linky** basé sur une logique d’**instruments financiers**, inspirée des terminaux de trading et des cockpits de supervision.

**Linky n'est pas un dashboard ERP.**

Linky est un **terminal de lecture du registre financier probant maintenu par le Dorevia Vault**.

Il ne constitue pas un système de gestion ni un système comptable, mais une **interface d'observation et d'analyse financière basée sur des événements vérifiables**.

Chaque instrument :

- est représenté par une **tuile dans le cockpit**
- possède une **card détaillée accessible au clic**
- est calculé à partir **d'événements financiers scellés dans le Vault**
- peut afficher **un indicateur synthétique en temps réel**

Le cockpit vise à permettre au dirigeant de :

- comprendre la situation financière en **moins de 5 secondes**
- détecter immédiatement **les anomalies et tensions**
- naviguer vers une **analyse détaillée**

---

## 2. Architecture des données

### 2.1 Principe

Toutes les données affichées dans Linky proviennent **exclusivement du Dorevia Vault**.

Linky ne lit **aucune donnée directement depuis les systèmes métiers**.

Les systèmes métiers (ERP, POS, facturation, paiement) **ne constituent pas la source de vérité**. Ils sont uniquement **émetteurs d'événements financiers** vers le Vault via DVIG.

**Architecture :**

```
ERP / POS / autres systèmes
        ↓
événements financiers
        ↓
DVIG
        ↓
VAULT (registre financier probant)
        ↓
LINKY (cockpit)
```

Le Vault constitue la **source unique de vérité financière** pour le cockpit.

### 2.2 Instrument financier

Un instrument Linky est défini comme :

> **Instrument = vue calculée d'événements financiers scellés dans le Vault**

Les instruments agrègent :

- événements de facturation
- paiements
- transactions POS
- écritures financières
- preuves associées

### 2.3 Calcul des instruments

Les instruments affichés dans Linky sont calculés à partir :

- d'événements financiers scellés dans le Vault
- d'agrégations financières réalisées par les services analytiques Linky

Ces calculs peuvent inclure :

- agrégations temporelles
- regroupements par partenaire
- indicateurs financiers
- ratios et métriques dérivées

---

## 3. Structure du cockpit

Le cockpit Linky est composé de **12 instruments organisés en grille**.

### 3.1 Disposition recommandée

```
TRÉSORERIE   BUSINESS   CASH        BFR
PAIEMENTS    ENCOURS    TAXES       POS
CRÉDITS      REMB.      Z CAISSE    EBE
```

### 3.2 Grille

| Caractéristique | Valeur |
|-----------------|--------|
| Lignes          | 3      |
| Colonnes        | 4      |
| Instruments     | 12     |

Cette structure permet :

- une lecture rapide
- une cohérence visuelle
- un équilibre fonctionnel

---

## 4. Typologie des instruments

Les instruments sont regroupés en **5 familles fonctionnelles**.

### 4.1 Liquidité

- Trésorerie
- Cash
- BFR

### 4.2 Activité

- Business
- POS
- Paiements

### 4.3 Risque

- Encours
- Taxes

### 4.4 Ajustements

- Notes de crédit
- Remboursements
- Z de caisse

### 4.5 Performance

- EBE

---

## 5. Description détaillée des instruments

---

### 5.1 TRÉSORERIE

#### Rôle

Indicateur principal de liquidité financière. Permet de comparer :

- solde comptable reconstruit à partir des événements financiers
- position financière validée par le Vault
- niveau de couverture probante des flux

#### Tuile

```
🏦 TRÉSORERIE
118 179 €
```

#### Card détaillée

Affiche :

- solde comptable reconstruit
- position validée Vault
- couverture probante des flux
- couverture structurelle

| Libellé                | Valeur      |
|------------------------|-------------|
| Solde reconstruit      | 96 679 €    |
| Position Vault         | 118 179 €   |
| Couverture probante    | 25 %        |
| Couverture structurelle| — mois      |

#### Source

Vault

---

### 5.2 BUSINESS

#### Rôle

Indicateur de performance commerciale.

#### Tuile

```
📊 BUSINESS
+ 94 663 €
```

#### Calcul

```
Ventes HT – Achats HT
```

#### Card détaillée

Affiche :

- ventes
- achats
- marge
- évolution mensuelle

#### Source

Vault

---

### 5.3 CASH

#### Rôle

Mesure du flux net de trésorerie.

#### Tuile

```
💳 CASH
+ 4 387 €
```

#### Calcul

```
Encaissements – décaissements
```

#### Source

Vault

---

### 5.4 BFR

#### Rôle

Mesure la tension financière opérationnelle.

#### Tuile

```
📦 BFR
+ 18 500 €
```

#### Calcul

```
Créances clients
+ stocks
– dettes fournisseurs
```

#### Card détaillée

Affiche :

- créances clients
- dettes fournisseurs
- stocks
- évolution BFR

#### Source

Vault

---

### 5.5 PAIEMENTS

#### Rôle

Suivi des encaissements.

#### Tuile

```
💰 PAIEMENTS
3 391 €
```

#### Card

- paiements reçus
- répartition par moyen de paiement

#### Source

Vault

---

### 5.6 ENCOURS

#### Rôle

Suivi du risque client.

#### Tuile

```
👥 ENCOURS
50 200 €
```

#### Card

Affiche :

- encours total
- retard
- top clients

| Client           | Montant   |
|------------------|-----------|
| EMD              | 20 871 €  |
| EXPORT MY ISLAND | 19 139 €  |
| SAVEUR KARAYB    | 8 888 €   |

#### Source

Vault

---

### 5.7 TAXES

#### Rôle

Suivi des obligations fiscales.

#### Tuile

```
🧾 TAXES
604 €
```

#### Card

Affiche :

- TVA collectée
- TVA déductible
- TVA à payer

#### Source

Vault

---

### 5.8 POS

#### Rôle

Suivi de l'activité des points de vente.

#### Tuile

```
🏪 POS
0 €
```

#### Card

Affiche :

- chiffre d'affaires POS
- sessions ouvertes
- performances par point de vente

#### Source

Vault

---

### 5.9 NOTES DE CRÉDIT

#### Tuile

```
📄 CRÉDITS
961 €
```

#### Card

Affiche :

- notes de crédit émises
- impact sur chiffre d'affaires

#### Source

Vault

---

### 5.10 REMBOURSEMENTS

#### Tuile

```
↩ REMBOURSEMENTS
0 €
```

#### Source

Vault

---

### 5.11 Z DE CAISSE

#### Tuile

```
🧾 Z CAISSE
—
```

#### Card

Affiche :

- clôtures de caisse
- écarts éventuels

#### Source

Vault

---

### 5.12 EBE

#### Rôle

Indicateur de performance économique.

#### Tuile

```
📈 EBE
+ 12 400 €
```

#### Calcul

```
EBE = CA – achats – charges opérationnelles
```

#### Source

Vault

---

## 6. Interaction utilisateur

Chaque instrument permet :

- **clic** → ouverture card détaillée
- navigation vers analyse détaillée
- exploration des événements Vault associés

---

## 7. Différenciation produit

Contrairement aux dashboards SaaS classiques, Linky fonctionne comme un **terminal financier basé sur un registre probant**.

Les instruments sont calculés à partir :

- d'événements financiers scellés
- de preuves cryptographiques
- d'un historique financier immuable

---

## 8. Évolutions futures

Instruments potentiels :

- marge nette
- rotation stock
- délai moyen de paiement
- score de risque client

---

## 9. Temporalité des instruments

Les instruments Linky représentent des **vues temporelles des événements financiers du Vault**.

Selon l'instrument, la période observée peut être :

- temps réel
- journée en cours
- période comptable
- mois
- historique

Les filtres de période permettent d'appliquer cette temporalité à l'ensemble du cockpit.

---

*Fin de la spécification*
