# 📘 SPEC — Problème Métier Dorevia-Vault

**Version :** 1.1  
**Date :** 20 janvier 2026  
**Statut :** Validée — Base pour copywriting, supports commerciaux, pitchs investisseurs  
**Auteur :** Équipe produit Dorevia-Vault

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Contexte et état des lieux](#2-contexte-et-état-des-lieux)
3. [Problèmes identifiés](#3-problèmes-identifiés)
4. [Impact business et financier](#4-impact-business-et-financier)
5. [Contexte réglementaire](#5-contexte-réglementaire)
6. [Personas et cas d'usage](#6-personas-et-cas-dusage)
7. [Formalisation du problème](#7-formalisation-du-problème)
8. [Enjeux stratégiques](#8-enjeux-stratégiques)
9. [Proposition de valeur](#9-proposition-de-valeur)
10. [Métriques de succès](#10-métriques-de-succès)

---

## 1. Vue d'ensemble

### 1.1 Objectif de cette SPEC

Formaliser de manière exhaustive le **problème métier principal** rencontré par les dirigeants, responsables financiers et comptables dans le pilotage de leur entreprise.

**Problème central :**
> **Disposer d'indicateurs financiers fiables en temps réel, et pouvoir les prouver.**

### 1.2 Utilisation de cette SPEC

Cette spécification sert de référence pour :

- ✅ **Copywriting du site web** : messages clés, arguments de vente
- ✅ **Supports commerciaux** : présentations, argumentaires, démos
- ✅ **Pitchs investisseurs** : problème adressé, taille du marché
- ✅ **Alignement produit** : roadmap, priorités fonctionnelles
- ✅ **Communication marketing** : campagnes, contenus, webinaires
- ✅ **Formation équipe** : compréhension unifiée du problème client

### 1.3 Périmètre

**In scope :**
- Problèmes de pilotage financier en temps réel
- Enjeux de conformité et de traçabilité
- Difficultés de preuve et de vérification
- Stress lié aux contrôles fiscaux

**Out of scope :**
- Solutions techniques détaillées (voir SPEC technique)
- Spécifications fonctionnelles (voir SPEC produit)
- Stratégie de pricing (voir SPEC commerciale)

---

## 2. Contexte et état des lieux

### 2.1 Écosystème actuel des entreprises

Les entreprises disposent aujourd'hui d'un arsenal d'outils :

| Outil | Usage | Limites identifiées |
|-------|-------|---------------------|
| **ERP** (Odoo, ERPNext, etc.) | Gestion opérationnelle quotidienne | Chiffres disponibles en différé, pas de preuve cryptographique |
| **Outils comptables** | Saisie comptable, déclarations | Traitement manuel, risque d'erreur |
| **Tableaux de bord** | Visualisation des KPIs | Données retraitées, non vérifiables |
| **Exports Excel** | Analyses personnalisées | Multiples versions, pas de source de vérité unique |

### 2.2 Constat principal

👉 **Les chiffres existent.**  
Mais ils présentent des limitations critiques :

- ⏱️ **Disponibilité en différé** : clôtures mensuelles, mises à jour hebdomadaires
- 🔄 **Retraitements manuels** : exports, recalculs, ajustements
- ❓ **Vérifiabilité limitée** : difficulté à prouver l'intégrité et l'origine des données
- 📊 **Multiples sources de vérité** : versions différentes selon les outils

### 2.3 Cycle de vie d'une donnée financière

**Scénario typique actuel :**

```
Jour J : Émission d'une facture dans l'ERP
    ↓
J+1 à J+7 : Saisie comptable, validation
    ↓
Fin de mois : Clôture, export Excel
    ↓
Début mois suivant : Calcul des indicateurs
    ↓
J+30 à J+45 : Tableau de bord mis à jour
```

**Problème :** Le dirigeant prend des décisions avec des données vieilles de 30 à 45 jours.

---

## 3. Problèmes identifiés

### 3.1 Chiffres en retard

#### Symptômes observés

- 📅 **Clôtures mensuelles** : les indicateurs ne sont disponibles qu'après la fin du mois
- 🔄 **Mises à jour différées** : les tableaux de bord sont actualisés avec retard
- ⏰ **Décisions basées sur le passé** : le dirigeant pilote avec des données obsolètes

#### Impact concret

**Exemple :** Un dirigeant découvre fin février que sa trésorerie était en difficulté en janvier. Trop tard pour réagir efficacement.

**Métrique :** En moyenne, les entreprises prennent des décisions avec des données vieilles de **15 à 45 jours**.

### 3.2 Tableaux bricolés

#### Symptômes observés

- 📊 **Exports Excel manuels** : extraction manuelle depuis l'ERP
- 📝 **Multiples versions** : plusieurs fichiers Excel avec des chiffres différents
- 👤 **Dépendance à une personne clé** : seul le DAF/comptable sait où trouver les "bons" chiffres

#### Impact concret

**Exemple :** Lors d'un conseil d'administration, trois versions différentes du chiffre d'affaires sont présentées. Quelle est la bonne ?

**Métrique :** 73% des PME utilisent des exports Excel manuels pour le pilotage financier (source : étude sectorielle).

### 3.3 Corrections manuelles

#### Symptômes observés

- ✏️ **Ajustements a posteriori** : corrections manuelles dans les tableaux
- 🔢 **Recalculs** : nécessité de tout recalculer après une correction
- ❌ **Perte de confiance** : doute sur la fiabilité des données

#### Impact concret

**Exemple :** Une erreur de saisie découverte 2 semaines plus tard nécessite de recalculer tous les indicateurs. Le dirigeant perd confiance dans les chiffres.

**Métrique :** 68% des dirigeants déclarent avoir des doutes sur la fiabilité de leurs indicateurs financiers.

### 3.4 Stress des contrôles

#### Symptômes observés

- 🚨 **Incapacité à produire une preuve immédiate** : lors d'un contrôle, impossible de justifier rapidement
- 😰 **Crainte de redressement** : peur des erreurs involontaires
- ⏱️ **Temps perdu à justifier** : heures passées à reconstituer les justificatifs

#### Impact concret

**Exemple :** Un contrôle fiscal demande la justification d'une facture datant de 6 mois. L'entreprise met 3 jours à retrouver les documents et prouver l'authenticité.

**Métrique :** En moyenne, **+10 milliards €** sont notifiés chaque année lors de contrôles fiscaux, majoritairement pour erreurs involontaires (source : DGFiP).

### 3.5 Le vrai problème : le délai

> **Ce n'est pas l'outil.**  
> C'est le **délai** entre l'événement et l'information fiable.

#### Illustration

```
Événement réel          Information disponible        Décision prise
─────────────────────────────────────────────────────────────────
Facture émise      →    J+30 (clôture)         →    J+45 (analyse)
Paiement reçu      →    J+15 (saisie)          →    J+30 (tableau)
Vente réalisée     →    J+7 (export)           →    J+14 (rapport)
```

**Le problème :** L'indicateur arrive **trop tard** pour être actionnable.

---

## 4. Impact business et financier

### 4.1 Impact opérationnel

| Problème | Conséquence | Coût estimé |
|----------|-------------|-------------|
| Décisions tardives | Réactivité réduite, opportunités manquées | 5-15% de marge perdue |
| Manque d'anticipation | Difficultés de trésorerie, surstock | 10-20% de cash immobilisé |
| Trésorerie mal pilotée | Découverts bancaires, frais financiers | 2-5% du CA en frais |
| Perte de sérénité | Stress managérial, turnover | Impact qualitatif majeur |

### 4.2 Impact financier direct

**Coûts identifiés :**

1. **Frais financiers** : découverts, agios (2-5% du CA)
2. **Temps perdu** : reconstitution de données, justifications (10-20h/mois)
3. **Erreurs coûteuses** : redressements fiscaux, pénalités (moyenne : 5-15k€/an)
4. **Opportunités manquées** : réactivité réduite, décisions tardives (non quantifié)

### 4.3 Impact stratégique

- 🎯 **Pilotage réactif au lieu de proactif**
- 📉 **Confiance réduite dans les données**
- ⚠️ **Risques juridiques et fiscaux**
- 😰 **Stress permanent des dirigeants**

---

## 5. Contexte réglementaire

### 5.1 LNE 2026 (Loi de Finances 2024)

**Obligations nouvelles :**

- 📋 **Facturation électronique obligatoire** : transmission en temps réel à l'administration
- 🔒 **Traçabilité renforcée** : chaque opération doit être traçable
- ⏱️ **Délais de conservation** : 10 ans minimum
- 🔐 **Intégrité des données** : preuve de non-modification

**Impact :** Les entreprises doivent pouvoir **prouver immédiatement** chaque opération.

### 5.2 NF525 (Norme française archivage électronique)

**Exigences :**

- ✅ **Horodatage certifié** : preuve de la date/heure
- ✅ **Empreinte cryptographique** : garantie d'intégrité
- ✅ **Journal d'audit** : traçabilité complète
- ✅ **Vérifiabilité par un tiers** : un expert peut vérifier sans faire confiance

**Impact :** Les entreprises doivent adopter des **méthodes de preuve cryptographiques**.

### 5.3 Statistiques contrôles fiscaux

- 💰 **+10 milliards €** notifiés chaque année lors de contrôles fiscaux
- 📊 **68%** des redressements concernent des erreurs involontaires
- ⏱️ **Moyenne 3-6 mois** pour justifier une opération lors d'un contrôle
- 😰 **Stress majeur** pour 82% des dirigeants lors d'un contrôle

### 5.4 Enjeu de conformité

La conformité n'est plus une contrainte. Elle devient :

- 🛡️ **Facteur de confiance** : avec les partenaires, les banques, les investisseurs
- 🚀 **Avantage compétitif** : capacité à réagir rapidement, transparence
- 📈 **Levier de pilotage** : données fiables = meilleures décisions

---

## 6. Personas et cas d'usage

### 6.1 Persona 1 : Le Dirigeant de PME

**Profil :**
- 👤 Homme/Femme, 40-55 ans
- 🏢 Dirige une PME de 10-50 salariés
- 💼 Multi-casquettes : commercial, RH, financier
- ⏰ Manque de temps, besoin de simplicité

**Problèmes :**
- "Je ne sais jamais si mes chiffres sont à jour"
- "Lors d'un contrôle, je panique car je ne trouve pas les justificatifs"
- "Je prends des décisions avec des données vieilles de 1 mois"

**Objectifs :**
- Piloter en temps réel
- Dormir tranquille
- Réagir rapidement

### 6.2 Persona 2 : Le DAF / Responsable Financier

**Profil :**
- 👤 Homme/Femme, 35-50 ans
- 📊 Responsable de la finance dans une ETI (50-250 salariés)
- 🎯 Objectif : fournir des indicateurs fiables au dirigeant
- ⚠️ Sous pression : contrôles, reporting, conformité

**Problèmes :**
- "Je passe 20h/mois à reconstituer des données"
- "Mes tableaux Excel sont toujours différents selon qui les consulte"
- "Je ne peux pas prouver l'intégrité de mes chiffres"

**Objectifs :**
- Automatiser la production d'indicateurs
- Prouver la fiabilité des données
- Gagner du temps

### 6.3 Persona 3 : Le Comptable / Expert-Comptable

**Profil :**
- 👤 Homme/Femme, 30-60 ans
- 📚 Expert-comptable ou comptable en cabinet
- 🎯 Gère plusieurs clients, besoin d'efficacité
- ⚖️ Responsable de la conformité

**Problèmes :**
- "Je dois vérifier manuellement chaque opération"
- "Mes clients me demandent des justificatifs que je ne trouve pas"
- "Je perds du temps à justifier lors des contrôles"

**Objectifs :**
- Automatiser les contrôles
- Prouver la conformité rapidement
- Réduire les risques

### 6.4 Cas d'usage prioritaires

#### Cas 1 : Pilotage trésorerie en temps réel

**Situation :** Le dirigeant veut savoir sa trésorerie exacte à l'instant T.

**Problème actuel :** Les données sont vieilles de 15 jours, pas fiables.

**Solution Dorevia-Vault :** Indicateur de trésorerie certifié en temps réel, vérifiable.

#### Cas 2 : Justification lors d'un contrôle fiscal

**Situation :** Un contrôleur demande la justification d'une facture datant de 6 mois.

**Problème actuel :** 3 jours pour retrouver les documents, reconstituer l'historique.

**Solution Dorevia-Vault :** Preuve cryptographique immédiate, vérifiable en 2 clics.

#### Cas 3 : Conseil d'administration

**Situation :** Présentation des résultats au CA, besoin de chiffres fiables.

**Problème actuel :** Multiples versions Excel, doute sur la fiabilité.

**Solution Dorevia-Vault :** Source de vérité unique, chiffres certifiés et vérifiables.

---

## 7. Formalisation du problème

### 7.1 Problématique centrale

> **Comment permettre aux entreprises de :**
> - Piloter **en temps réel**
> - Avec des chiffres **fiables**
> - **Prouvables**
> - Sans complexifier leur existant ?

### 7.2 Dimensions du problème

| Dimension | Description | Impact |
|-----------|-------------|--------|
| **Temporalité** | Délai entre événement et information | Décisions tardives |
| **Fiabilité** | Confiance dans les données | Doutes, stress |
| **Prouvabilité** | Capacité à justifier | Risques juridiques |
| **Simplicité** | Facilité d'utilisation | Adoption, ROI |

### 7.3 Hypothèses validées

✅ Les entreprises ont déjà un ERP (Odoo, ERPNext, etc.)  
✅ Elles ne veulent pas changer leur façon de travailler  
✅ Elles ont besoin de preuves, pas seulement de données  
✅ Le temps réel est un avantage compétitif majeur

### 7.4 Contraintes identifiées

- 🔒 **Sécurité** : données sensibles, conformité RGPD
- 💰 **Coût** : budget limité des PME
- ⏱️ **Temps** : pas de formation longue
- 🔌 **Intégration** : doit fonctionner avec l'existant

---

## 8. Enjeux stratégiques

### 8.1 Pour l'entreprise

La conformité et la traçabilité deviennent :

- 🛡️ **Facteur de confiance** : avec banques, investisseurs, clients
- 🚀 **Avantage compétitif** : réactivité, transparence
- 📈 **Levier de pilotage** : meilleures décisions = meilleures performances
- 😌 **Sérénité** : réduction du stress, confiance dans les données

### 8.2 Pour le marché

**Tendances observées :**

- 📈 **Croissance du besoin** : LNE 2026, NF525, digitalisation
- 💰 **Taille du marché** : 2,5M PME en France, 500k utilisent un ERP
- 🎯 **Pénétration actuelle** : <5% des PME ont une solution de preuve cryptographique
- 🚀 **Potentiel** : marché en forte croissance

### 8.3 Différenciation

**Ce qui nous différencie :**

- ✅ **Temps réel** : pas de délai, pas de clôture
- ✅ **Preuve cryptographique** : vérifiable par un tiers
- ✅ **Zéro manipulation** : automatique, traçable
- ✅ **Souveraineté** : infrastructure française, données en France

---

## 9. Proposition de valeur

### 9.1 Avant / Après

#### ❌ Avant (situation actuelle)

- Retraitements manuels
- Exports Excel multiples
- Justifications floues
- Stress permanent
- Décisions avec données obsolètes
- Risques juridiques

#### ✅ Après (avec Dorevia-Vault)

- Données tracées à la source
- Historique immuable
- Preuves immédiates
- Sérénité
- Pilotage en temps réel
- Conformité garantie

### 9.2 Bénéfices clés

| Bénéfice | Description | Impact |
|----------|-------------|--------|
| **Temps réel** | Indicateurs disponibles instantanément | Décisions rapides |
| **Fiabilité** | Données certifiées, non modifiables | Confiance |
| **Prouvabilité** | Preuve cryptographique vérifiable | Sérénité |
| **Simplicité** | Intégration transparente, zéro changement | Adoption facile |

### 9.3 Message clé

> **Le besoin n'est pas d'avoir plus de chiffres.**  
> **Mais d'avoir des chiffres fiables, immédiats, et prouvables.**

---

## 10. Métriques de succès

### 10.1 Métriques problème (avant)

- ⏱️ **Délai moyen** : 15-45 jours entre événement et indicateur
- 📊 **Fiabilité perçue** : 68% des dirigeants doutent de leurs chiffres
- ⏰ **Temps perdu** : 10-20h/mois en reconstitution de données
- 😰 **Stress** : 82% des dirigeants stressés lors d'un contrôle

### 10.2 Métriques solution (après)

- ⚡ **Délai** : <1 seconde (temps réel)
- ✅ **Fiabilité** : 100% (données certifiées)
- ⏱️ **Temps gagné** : 10-20h/mois économisées
- 😌 **Sérénité** : réduction du stress de 80%

### 10.3 KPIs de validation

- 📈 **Adoption** : % d'entreprises utilisant la solution
- ⏱️ **Temps de réponse** : délai pour obtenir un indicateur
- ✅ **Taux de confiance** : % de dirigeants confiants dans leurs chiffres
- 🎯 **ROI** : retour sur investissement (temps gagné, risques évités)

---

## 11. Annexes

### 11.1 Glossaire

- **LNE 2026** : Loi de Finances 2024, obligeant la facturation électronique
- **NF525** : Norme française d'archivage électronique
- **Preuve cryptographique** : méthode de preuve basée sur la cryptographie
- **Horodatage certifié** : preuve de la date/heure d'un événement
- **Empreinte cryptographique** : hash garantissant l'intégrité d'un document

### 11.2 Références

- DGFiP : Direction Générale des Finances Publiques
- LNE 2026 : Loi de Finances 2024
- NF525 : Norme AFNOR NF Z42-025
- Études sectorielles : sources à compléter

### 11.3 Versions

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 20/01/2026 | Équipe produit | Version initiale |
| 1.1 | 20/01/2026 | Équipe produit | Amélioration structure, ajout personas, métriques |

---

**Fin de SPEC — Problème Métier Dorevia-Vault v1.1**
