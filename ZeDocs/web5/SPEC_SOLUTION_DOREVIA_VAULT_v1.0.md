# 📘 SPEC — Solution Dorevia-Vault

**Version :** 1.0  
**Date :** 20 janvier 2026  
**Statut :** Draft — Complément de la SPEC Problème Métier v1.1  
**Auteur :** Équipe produit Dorevia-Vault

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Positionnement de la solution](#2-positionnement-de-la-solution)
3. [Architecture et fonctionnement](#3-architecture-et-fonctionnement)
4. [Fonctionnalités clés](#4-fonctionnalités-clés)
5. [Résolution des problèmes identifiés](#5-résolution-des-problèmes-identifiés)
6. [Avantages différenciants](#6-avantages-différenciants)
7. [Intégration et compatibilité](#7-intégration-et-compatibilité)
8. [Sécurité et conformité](#8-sécurité-et-conformité)
9. [Cas d'usage détaillés](#9-cas-dusage-détaillés)
10. [ROI et bénéfices mesurables](#10-roi-et-bénéfices-mesurables)

---

## 1. Vue d'ensemble

### 1.1 Objectif de cette SPEC

Décrire de manière exhaustive **comment Dorevia-Vault résout les problèmes métier** identifiés dans la SPEC Problème Métier v1.1.

**Proposition de valeur centrale :**
> **Dorevia-Vault transforme automatiquement vos données financières en preuves vérifiables et opposables, en temps réel, sans changer votre façon de travailler.**

### 1.2 Relation avec la SPEC Problème Métier

Cette SPEC est le **complément direct** de la SPEC Problème Métier :

| Problème identifié | Solution Dorevia-Vault |
|-------------------|------------------------|
| Chiffres en retard | Temps réel, pas de délai |
| Tableaux bricolés | Source de vérité unique |
| Corrections manuelles | Zéro manipulation, automatique |
| Stress des contrôles | Preuves immédiates, vérifiables |

### 1.3 Utilisation de cette SPEC

- ✅ **Développement produit** : roadmap, priorités fonctionnelles
- ✅ **Support commercial** : argumentaires, démonstrations
- ✅ **Documentation technique** : architecture, intégrations
- ✅ **Communication** : messages clés, différenciation

---

## 2. Positionnement de la solution

### 2.1 Ce que fait Dorevia-Vault

**En une phrase :**
> Dorevia-Vault est une infrastructure de vérité financière qui sécurise automatiquement vos données financières (factures, paiements, écritures) en générant des preuves cryptographiques vérifiables et opposables, en temps réel.

### 2.2 Ce que Dorevia-Vault n'est pas

❌ **Ce n'est pas :**
- Un ERP (on s'intègre à votre ERP existant)
- Un outil comptable (on sécurise, on ne remplace pas)
- Un simple coffre-fort (on génère des preuves, pas seulement de l'archivage)
- Une solution de BI (on certifie les données, on ne les analyse pas)

✅ **C'est :**
- Une infrastructure de preuve
- Un système de certification automatique
- Une source de vérité unique et vérifiable
- Un levier de conformité et de sérénité

### 2.3 Positionnement marché

```
┌─────────────────────────────────────────────────────────┐
│                    Écosystème financier                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ERP (Odoo, ERPNext)  →  Dorevia-Vault  →  Tableaux     │
│  (Opérationnel)            (Preuve)         (Pilotage)  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Dorevia-Vault se positionne comme :**
- 🔌 **Connecteur intelligent** : entre l'ERP et le pilotage
- 🛡️ **Couche de sécurité** : garantit l'intégrité et la traçabilité
- ⚡ **Accélérateur** : transforme les données en preuves en temps réel

---

## 3. Architecture et fonctionnement

### 3.1 Principe de fonctionnement

**Flux simplifié :**

```
1. Événement dans l'ERP
   ↓
2. Dorevia-Vault capture automatiquement
   ↓
3. Génération de preuve cryptographique
   (horodatage + empreinte + journal)
   ↓
4. Stockage sécurisé (coffre-fort numérique)
   ↓
5. Disponibilité immédiate pour :
   - Indicateurs en temps réel
   - Preuves vérifiables
   - Conformité LNE 2026 / NF525
```

### 3.2 Composants techniques

| Composant | Rôle | Technologie |
|-----------|------|------------|
| **DVIG** (Dorevia-Vault Ingest Gateway) | Capture et ingestion des données | API REST, webhooks |
| **Vault** | Stockage sécurisé et génération de preuves | Base de données, cryptographie |
| **Gateway** | Point d'entrée unique, routage | Caddy, reverse proxy |
| **Interface** | Visualisation, indicateurs | Web app (future) |

### 3.3 Flux détaillé : de l'événement à la preuve

#### Étape 1 : Capture automatique

**Déclencheur :** Événement dans l'ERP (facture validée, paiement encaissé, écriture comptable)

**Action Dorevia-Vault :**
- Détection automatique via webhook ou polling
- Extraction des données (idempotence garantie)
- Validation du format et de la cohérence

**Résultat :** Données capturées, prêtes à être sécurisées

#### Étape 2 : Génération de preuve

**Processus :**
1. **Horodatage certifié** : date/heure garantie par un tiers de confiance
2. **Empreinte cryptographique** : hash SHA-256 garantissant l'intégrité
3. **Journal d'audit** : traçabilité complète de l'opération

**Résultat :** Preuve cryptographique générée, non modifiable

#### Étape 3 : Stockage sécurisé

**Caractéristiques :**
- Stockage dans un coffre-fort numérique
- Réplication pour la résilience
- Chiffrement des données sensibles
- Conformité NF525

**Résultat :** Données sécurisées, accessibles en temps réel

#### Étape 4 : Disponibilité immédiate

**Utilisations possibles :**
- Calcul d'indicateurs en temps réel (trésorerie, CA, TVA)
- Génération de preuves pour contrôles
- Vérification par un tiers (expert-comptable, contrôleur)

**Résultat :** Données disponibles instantanément, vérifiables

### 3.4 Principe de zéro manipulation

**Engagement :**
> Les données sont capturées, sécurisées et certifiées **sans aucune intervention humaine**.

**Garanties :**
- ✅ Automatisation complète
- ✅ Traçabilité totale
- ✅ Impossibilité de modification a posteriori
- ✅ Journal d'audit immuable

---

## 4. Fonctionnalités clés

### 4.1 Capture automatique

**Fonctionnalité :**
- Détection automatique des événements dans l'ERP
- Extraction des données (factures, paiements, écritures)
- Idempotence garantie (pas de doublon)

**Bénéfices :**
- ⚡ Temps réel : pas de délai
- 🔄 Automatique : zéro intervention
- ✅ Fiable : pas d'erreur humaine

### 4.2 Génération de preuves cryptographiques

**Fonctionnalité :**
- Horodatage certifié (preuve de date/heure)
- Empreinte cryptographique (preuve d'intégrité)
- Journal d'audit (preuve de traçabilité)

**Bénéfices :**
- 🛡️ Preuve opposable en justice
- ✅ Vérifiable par un tiers
- 🔒 Conforme NF525

### 4.3 Indicateurs en temps réel

**Fonctionnalité :**
- Calcul automatique d'indicateurs financiers
- Disponibilité immédiate (pas de clôture)
- Mise à jour en continu

**Indicateurs disponibles :**
- 💰 Trésorerie certifiée
- 📊 Chiffre d'affaires vérifiable
- 📈 TVA calculée et traçable
- 💵 Résultat net prouvable

**Bénéfices :**
- ⚡ Décisions en temps réel
- 📊 Pilotage proactif
- ✅ Données fiables

### 4.4 Vérification par un tiers

**Fonctionnalité :**
- Un expert-comptable peut vérifier les preuves
- Sans avoir accès aux données sensibles
- Vérification cryptographique indépendante

**Bénéfices :**
- 🔍 Transparence totale
- ✅ Confiance renforcée
- 🛡️ Conformité prouvée

### 4.5 Conformité LNE 2026 / NF525

**Fonctionnalité :**
- Horodatage certifié conforme
- Empreinte cryptographique conforme
- Journal d'audit conforme
- Conservation 10 ans minimum

**Bénéfices :**
- ✅ Conformité garantie
- 🛡️ Réduction des risques
- 😌 Sérénité

---

## 5. Résolution des problèmes identifiés

### 5.1 Problème : Chiffres en retard

**Situation avant :**
- Clôtures mensuelles
- Indicateurs disponibles avec 15-45 jours de retard
- Décisions basées sur le passé

**Solution Dorevia-Vault :**
- ✅ **Temps réel** : indicateurs disponibles instantanément
- ✅ **Pas de clôture** : mise à jour continue
- ✅ **Décisions immédiates** : données toujours à jour

**Résultat :**
- ⚡ Délai réduit de 15-45 jours à <1 seconde
- 📊 Pilotage proactif au lieu de réactif
- 🎯 Décisions basées sur l'actualité

### 5.2 Problème : Tableaux bricolés

**Situation avant :**
- Exports Excel manuels
- Multiples versions de la vérité
- Dépendance à une personne clé

**Solution Dorevia-Vault :**
- ✅ **Source de vérité unique** : données centralisées
- ✅ **Automatisation** : pas d'export manuel
- ✅ **Traçabilité** : historique complet

**Résultat :**
- 📊 Une seule source de vérité
- ⚡ Automatisation complète
- 🔍 Traçabilité totale

### 5.3 Problème : Corrections manuelles

**Situation avant :**
- Ajustements a posteriori
- Recalculs nécessaires
- Perte de confiance

**Solution Dorevia-Vault :**
- ✅ **Zéro manipulation** : données immuables
- ✅ **Pas de correction** : données certifiées à la source
- ✅ **Confiance garantie** : preuve cryptographique

**Résultat :**
- 🔒 Données non modifiables
- ✅ Confiance totale
- 🛡️ Intégrité garantie

### 5.4 Problème : Stress des contrôles

**Situation avant :**
- Incapacité à produire une preuve immédiate
- Crainte de redressement
- Temps perdu à justifier

**Solution Dorevia-Vault :**
- ✅ **Preuves immédiates** : disponibles en 2 clics
- ✅ **Vérifiables** : cryptographiquement prouvées
- ✅ **Conformité** : LNE 2026 / NF525

**Résultat :**
- ⚡ Justification en quelques secondes
- 🛡️ Réduction des risques
- 😌 Sérénité totale

---

## 6. Avantages différenciants

### 6.1 Temps réel vs. Différé

| Concurrents classiques | Dorevia-Vault |
|----------------------|---------------|
| Clôtures mensuelles | Temps réel |
| Mises à jour différées | Mise à jour continue |
| Décisions tardives | Décisions immédiates |

### 6.2 Preuve cryptographique vs. Archive simple

| Solutions d'archivage | Dorevia-Vault |
|----------------------|---------------|
| Archivage passif | Preuve active |
| Non vérifiable | Vérifiable par un tiers |
| Modifiable | Immuable |

### 6.3 Automatisation vs. Manuel

| Solutions manuelles | Dorevia-Vault |
|---------------------|---------------|
| Exports manuels | Automatique |
| Saisies répétitives | Zéro intervention |
| Risque d'erreur | Fiabilité garantie |

### 6.4 Souveraineté vs. Dépendance

| Solutions cloud US | Dorevia-Vault |
|-------------------|---------------|
| Données à l'étranger | Infrastructure française |
| RGPD complexe | Conformité native |
| Dépendance externe | Souveraineté |

---

## 7. Intégration et compatibilité

### 7.1 ERPs compatibles

**Priorité 1 (déjà intégrés) :**
- ✅ Odoo (toutes versions)
- ✅ ERPNext (en cours)

**Priorité 2 (roadmap) :**
- 📋 Dolibarr
- 📋 Tryton
- 📋 Autres ERP open-source

**Principe :**
> Toute solution ERP avec API REST peut être intégrée.

### 7.2 Méthodes d'intégration

**Option 1 : Webhooks (recommandé)**
- L'ERP envoie un événement à Dorevia-Vault
- Temps réel garanti
- Faible latence

**Option 2 : Polling**
- Dorevia-Vault interroge l'ERP périodiquement
- Compatible avec tous les ERPs
- Légère latence (quelques minutes)

**Option 3 : Import manuel**
- Export depuis l'ERP puis import dans Dorevia-Vault
- Pour cas spécifiques
- Non recommandé pour le temps réel

### 7.3 Facilité d'intégration

**Temps d'intégration :**
- ⚡ **Webhook** : 1-2 heures (configuration)
- 🔄 **Polling** : 2-4 heures (configuration + tests)
- 📋 **Import manuel** : ponctuel

**Complexité :**
- ✅ **Faible** : pas de développement nécessaire
- ✅ **Configuration** : paramétrage simple
- ✅ **Documentation** : guides détaillés

### 7.4 Compatibilité avec l'existant

**Principe :**
> Dorevia-Vault s'intègre à votre existant, sans rien changer.

**Garanties :**
- ✅ Pas de modification de l'ERP
- ✅ Pas de changement de processus
- ✅ Fonctionnement transparent
- ✅ Compatibilité totale

---

## 8. Sécurité et conformité

### 8.1 Sécurité des données

**Mesures techniques :**
- 🔒 Chiffrement des données sensibles (AES-256)
- 🔐 Authentification forte (tokens, API keys)
- 🛡️ Isolation des données par tenant
- 🔍 Journal d'audit complet

**Mesures organisationnelles :**
- 👥 Accès limité aux données
- 📋 Procédures de sécurité
- 🔄 Mises à jour régulières
- ✅ Tests de sécurité

### 8.2 Conformité réglementaire

**LNE 2026 :**
- ✅ Facturation électronique
- ✅ Traçabilité complète
- ✅ Conservation 10 ans

**NF525 :**
- ✅ Horodatage certifié
- ✅ Empreinte cryptographique
- ✅ Journal d'audit
- ✅ Vérifiabilité par un tiers

**RGPD :**
- ✅ Données en France
- ✅ Droit à l'oubli
- ✅ Portabilité des données
- ✅ Consentement explicite

### 8.3 Souveraineté

**Infrastructure :**
- 🇫🇷 Hébergement en France
- 🔒 Données non exportées
- 🛡️ Conformité souveraine
- ✅ Indépendance technologique

---

## 9. Cas d'usage détaillés

### 9.1 Cas 1 : Pilotage trésorerie en temps réel

**Contexte :**
Un dirigeant veut connaître sa trésorerie exacte à l'instant T pour prendre une décision d'investissement.

**Situation avant :**
- Données vieilles de 15 jours
- Calcul manuel nécessaire
- Doute sur la fiabilité

**Avec Dorevia-Vault :**
1. ✅ Trésorerie calculée automatiquement
2. ✅ Disponible en temps réel (<1 seconde)
3. ✅ Certifiée et vérifiable
4. ✅ Décision prise immédiatement

**Résultat :**
- ⚡ Décision en quelques minutes au lieu de plusieurs jours
- ✅ Confiance totale dans les chiffres
- 📊 Pilotage proactif

### 9.2 Cas 2 : Justification lors d'un contrôle fiscal

**Contexte :**
Un contrôleur fiscal demande la justification d'une facture datant de 6 mois.

**Situation avant :**
- 3 jours pour retrouver les documents
- Reconstruction manuelle de l'historique
- Doute sur l'authenticité

**Avec Dorevia-Vault :**
1. ✅ Recherche en 2 clics
2. ✅ Preuve cryptographique immédiate
3. ✅ Vérification par le contrôleur (empreinte)
4. ✅ Justification en quelques minutes

**Résultat :**
- ⚡ Justification en minutes au lieu de jours
- 🛡️ Preuve irréfutable
- 😌 Sérénité totale

### 9.3 Cas 3 : Conseil d'administration

**Contexte :**
Présentation des résultats au conseil d'administration, besoin de chiffres fiables et vérifiables.

**Situation avant :**
- Multiples versions Excel
- Doute sur la fiabilité
- Justification difficile

**Avec Dorevia-Vault :**
1. ✅ Source de vérité unique
2. ✅ Chiffres certifiés et vérifiables
3. ✅ Preuve cryptographique disponible
4. ✅ Présentation crédible

**Résultat :**
- 📊 Confiance renforcée
- ✅ Transparence totale
- 🎯 Décisions éclairées

### 9.4 Cas 4 : Audit comptable

**Contexte :**
Un expert-comptable doit vérifier les comptes d'une entreprise.

**Situation avant :**
- Accès complet aux données sensibles
- Vérification manuelle longue
- Doute sur l'intégrité

**Avec Dorevia-Vault :**
1. ✅ Vérification cryptographique sans accès aux données
2. ✅ Preuve d'intégrité automatique
3. ✅ Audit rapide et fiable
4. ✅ Confidentialité préservée

**Résultat :**
- 🔍 Audit efficace
- 🛡️ Confidentialité garantie
- ✅ Confiance renforcée

---

## 10. ROI et bénéfices mesurables

### 10.1 Gains de temps

| Activité | Avant | Après | Gain |
|----------|-------|-------|------|
| Reconstitution de données | 10-20h/mois | 0h | 10-20h/mois |
| Justification lors d'un contrôle | 3-6 jours | 2-5 minutes | 3-6 jours |
| Calcul d'indicateurs | 2-4h/mois | Automatique | 2-4h/mois |
| **Total** | **12-24h/mois** | **<1h/mois** | **11-23h/mois** |

**Valeur :** 11-23h/mois × coût horaire = **ROI significatif**

### 10.2 Réduction des risques

| Risque | Avant | Après | Réduction |
|--------|-------|-------|-----------|
| Redressement fiscal | Probable | Improbable | 80-90% |
| Erreurs involontaires | Fréquent | Rare | 90%+ |
| Perte de confiance | Élevé | Faible | 70-80% |

**Valeur :** Réduction des risques = **sérénité + économies**

### 10.3 Amélioration de la décision

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Délai de décision | 15-45 jours | <1 seconde | 99%+ |
| Fiabilité perçue | 32% | 100% | +68% |
| Réactivité | Faible | Élevée | +200% |

**Valeur :** Meilleures décisions = **meilleures performances**

### 10.4 ROI global estimé

**Investissement :**
- Coût mensuel Dorevia-Vault : X€/mois
- Temps d'intégration : 2-4h (une fois)

**Retour :**
- Gain de temps : 11-23h/mois
- Réduction des risques : 80-90%
- Amélioration de la décision : +200%

**ROI :**
- **Court terme** (3 mois) : Retour sur investissement
- **Moyen terme** (12 mois) : ROI 3-5x
- **Long terme** : Avantage compétitif durable

---

## 11. Annexes

### 11.1 Glossaire technique

- **Horodatage certifié** : Preuve de date/heure garantie par un tiers de confiance
- **Empreinte cryptographique** : Hash SHA-256 garantissant l'intégrité
- **Journal d'audit** : Traçabilité complète de toutes les opérations
- **Idempotence** : Garantie de non-doublon lors de la capture
- **Webhook** : Méthode d'intégration en temps réel (push)
- **Polling** : Méthode d'intégration périodique (pull)

### 11.2 Références

- SPEC Problème Métier v1.1
- SPEC Technique Dorevia-Vault
- Documentation API Dorevia-Vault
- Norme NF525 (AFNOR)

### 11.3 Versions

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 20/01/2026 | Équipe produit | Version initiale |

---

**Fin de SPEC — Solution Dorevia-Vault v1.0**
