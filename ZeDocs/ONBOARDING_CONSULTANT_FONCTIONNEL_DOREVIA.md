# Guide d’onboarding — Consultant fonctionnel Dorevia

**Date** : 2026-02-23  
**Public** : Nouveau consultant fonctionnel rejoignant l’équipe  
**Objectif** : Comprendre la plateforme Dorevia, ses concepts métier et son fonctionnement  
**Durée de lecture** : 45–60 min

---

## Table des matières

1. [Bienvenue](#1-bienvenue)
2. [Qu’est-ce que Dorevia ?](#2-quest-ce-que-dorevia-)
3. [Positionnement commercial](#3-positionnement-commercial)
4. [La règle des 3V](#4-la-règle-des-3v)
5. [Concepts métier clés](#5-concepts-métier-clés)
6. [Architecture vue fonctionnelle](#6-architecture-vue-fonctionnelle)
7. [Les composants et leur rôle](#7-les-composants-et-leur-rôle)
8. [Flux de données principaux](#8-flux-de-données-principaux)
9. [Tenants et environnements](#9-tenants-et-environnements)
10. [Maturité produit](#10-maturité-produit)
11. [Cas d’usage typiques](#11-cas-dusage-typiques)
12. [Où trouver l’information](#12-où-trouver-linformation)
13. [Pièges courants et FAQ](#13-pièges-courants-et-faq)
14. [Premiers pas recommandés](#14-premiers-pas-recommandés)
15. [Glossaire](#15-glossaire)

---

## 1. Bienvenue

Ce document est conçu pour vous donner une vision complète de la plateforme Dorevia lorsque vous rejoignez l’équipe en tant que consultant fonctionnel. Vous y trouverez :

- La vision et la proposition de valeur
- Les concepts métier essentiels (vaultage, preuve, tenant…)
- Une vue fonctionnelle de l’architecture (sans entrer dans le détail technique)
- Les flux de données et cas d’usage
- Les liens vers la documentation détaillée
- Les points de vigilance et pièges courants

---

## 2. Qu’est-ce que Dorevia ?

### 2.1 En une phrase

**Dorevia** est une plateforme B2B SaaS qui transforme chaque document financier (facture, vente, paiement) en **preuve cryptographique irréfutable**, permettant aux dirigeants de piloter leur activité avec des données **attestées** en temps réel.

### 2.2 Promesse produit

> *« De la vente à la banque, chaque décision devient une preuve »*

### 2.3 Philosophie Dorevia

> **🏛 Une entreprise ne se pilote pas sur des chiffres.  
> Elle se pilote sur des chiffres prouvables.**

C’est l’ADN de Dorevia. C’est sa colonne vertébrale.

### 2.4 Ce que Dorevia n’est PAS

| ❌ Non | Explication |
|--------|-------------|
| Un ERP | Dorevia ne remplace pas Odoo ni un autre ERP |
| Un logiciel de comptabilité | La comptabilité reste dans l’ERP |
| Un outil de BI classique | La BI classique mixe données brutes et estimées ; Dorevia ne lit que des données scellées |
| Un stockage de PDF | Ce n’est pas une simple GED ou archive documentaire |

➡️ **Dorevia est une infrastructure de preuve financière.**  
Comprendre cette limite évite les attentes irréalistes côté client.

### 2.5 Objectifs métier

| Objectif | Explication |
|----------|-------------|
| **Conformité réglementaire** | Préparation PDP/PPF 2026, NF525, Factur-X |
| **Traçabilité immuable** | Ledger hash-chaîné pour auditabilité |
| **Intégrité cryptographique** | Signatures JWS (RS256) conformes aux standards |
| **Multi-tenant** | Isolation stricte des données par client (tenant) |
| **Maîtrise financière** | Tableau de bord fondé sur des données scellées |

### 2.6 Cibles

- **TPE / Artisans** : entrée 30 €/mois
- **PME** (1–50 sal.) : cœur de cible 80–150 €/mois
- **Scale / Enterprise** : 150 €+ et sur devis

---

## 3. Positionnement commercial

**Dorevia ne vend pas Odoo.** Dorevia ne vend pas de la BI. **Dorevia vend de la confiance certifiable.**

- Le client garde son ERP ; Dorevia ajoute la couche de preuve.
- Linky ne décide rien : il lit **uniquement** des données scellées.
- Face à Pennylane, Agicap ou une BI classique : Dorevia se différencie par l’**attestation cryptographique** et le principe « aucune décision sur données non scellées ».

---

## 4. La règle des 3V

La règle des 3V est le fil conducteur du fonctionnement de Dorevia.

| Étape | Signification | Qui est responsable ? | Ce que l’utilisateur voit |
|-------|---------------|------------------------|---------------------------|
| **Validé** | Le document est officiel et engageant (ex. facture comptabilisée dans l’ERP) | Odoo (ERP) | Facture en état « Comptabilisée » |
| **Vaulté** | Le document est scellé : hash SHA-256, signature JWS, entrée dans le ledger immuable | Vault (via DVIG) | Statut « Protégé » sur la facture |
| **Vérifiable** | La preuve d’intégrité est consultable à tout moment | Vault | Attestation téléchargeable, badge intégrité |

**Important** : La preuve est **immuable** une fois vaultée — c’est ce qui garantit l’intégrité.  
*Nuance fonctionnelle* : le document source dans l’ERP peut être annulé ou remplacé (avoir, écriture inverse) ; la preuve, elle, reste figée. Dorevia ne « bloque » pas l’ERP.

---

## 5. Concepts métier clés

### 5.1 Vaultage

Le **vaultage** est l’action de sceller un document dans Dorevia Vault. Une fois vaulté :

- Le document reçoit un hash SHA-256
- Il est signé (JWS RS256)
- Une entrée est ajoutée au **ledger** (chaîne de hash immuable)
- La preuve est consultable via une attestation

**Types de documents vaultables** : factures (client/fournisseur), avoirs, paiements, tickets POS, Z-Reports.

### 5.2 Preuve

La **preuve** est la garantie cryptographique qu’un document n’a pas été altéré. Elle comprend :

- L’identifiant du document dans le Vault
- Le hash SHA-256
- La signature JWS (evidence)
- La référence au ledger

L’utilisateur peut **télécharger l’attestation** directement depuis Odoo (facture ou paiement).

### 5.3 Tenant

Un **tenant** est un client ou une entité logique isolée. Chaque tenant a :

- Ses propres données (factures, paiements, etc.)
- Son ERP (Odoo) configuré
- Son cockpit Linky (lecture des agrégats)
- Des identifiants de type slug : `core`, `sarl-la-platine`, `dido`, etc.

**Point critique** : Le tenant doit être cohérent dans tout le flux (Odoo → DVIG → Vault → Linky). Une erreur de tenant est une cause fréquente de « preuve non trouvée » ou de données vides.

### 5.4 Source

La **source** identifie l’origine des données. Format typique : `unit.env.tenant`  
Exemples : `odoo.stinger.sarl-la-platine`, `odoo.lab.core`.

### 5.5 Agrégats

Les **agrégats** sont des synthèses calculées à partir des documents vaultés (ventes HT, achats, trésorerie, encaissements, décaissements, ajustements, sessions POS). Ils alimentent le cockpit Linky.

### 5.6 Badge d’intégrité

Le **badge d’intégrité** (ou « Indicateur Confiance Vaultage ») indique le ratio de documents scellés vs documents source. Il permet au dirigeant de savoir à quel point ses indicateurs sont fondés sur des preuves.

---

## 6. Architecture vue fonctionnelle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DOREVIA PLATFORM — Vue fonctionnelle                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [ERP Odoo]          [Passerelle DVIG]         [Cœur Dorevia Vault]             │
│   Factures            Normalisation             Stockage + Scellement             │
│   Paiements     ───►  Multi-tenant         ───►  + Preuves                        │
│   POS                 Résilience                 + Agrégats                        │
│                                                                                  │
│                                                                   │               │
│                                                                   ▼               │
│                                                        [Cockpit Linky]            │
│                                                        Lecture agrégats           │
│                                                        Badge intégrité            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Ordre des flux** :

1. **Écriture** : Odoo → DVIG → Vault (ingestion et scellement)
2. **Lecture** : Linky → Vault (agrégats, preuves, santé)

---

## 7. Les composants et leur rôle

### 7.1 Odoo (ERP)

- **Rôle** : Source des documents (factures, paiements, POS)
- **Module** : `dorevia_vault_connector` — envoie vers DVIG, récupère les preuves
- **Points fonctionnels** :
  - Validation d’une facture → statut `todo` → envoi asynchrone
  - CRON #1 : envoi batch vers DVIG
  - CRON #2 : récupération des preuves
  - Statuts : `todo` → `pending_proof` → `vaulted` (ou `failed_soft` / `failed_hard`)

### 7.2 DVIG (Passerelle)

- **Rôle** : Passerelle entre Odoo et Vault
- **Fonctions** :
  - Reçoit les événements Odoo (`POST /ingest`)
  - Les stocke dans une **outbox**
  - Un worker asynchrone les envoie au Vault (`POST /api/v1/events`)
  - Gère les retries et la résilience
- **Important** : DVIG ne stocke pas les documents à long terme ; il les transmet au Vault.

**Pourquoi DVIG existe ?**  
DVIG est une **passerelle de résilience**. Vault est le **cœur cryptographique**. Sans DVIG : perte de résilience, pas d’outbox, pas de retry. Cette distinction est clé.

### 7.3 Vault (Cœur cryptographique)

- **Rôle** : Stockage sécurisé, scellement, preuves, agrégats
- **Fonctions principales** :
  - Ingestion : factures, paiements, events DVIG
  - Scellement : hash, JWS, ledger
  - Preuves : `GET /api/v1/proof/account_move/:id`
  - Agrégats : ventes, achats, trésorerie, paiements, etc.
  - Indicateur confiance : `GET /ui/system/vault-health`
- **Principe** : données immuables, lecture seule après écriture

### 7.4 Linky (Cockpit)

- **Rôle** : Tableau de bord en lecture seule sur données scellées
- **Principe** : Linky ne lit **que** le Vault. Aucune décision sur données non scellées.
- **Contenu** : KPIs (trésorerie, ventes, encaissements, décaissements, taxes, ajustements, POS…), badge intégrité, filtres société/période

### 7.5 DIVA (optionnel, en cours)

- **Rôle prévu** : Synthèse IA des agrégats, qualification, gouvernance (DLP)
- **Statut** : Non implémenté à ce jour pour la chaîne complète

---

## 8. Flux de données principaux

### 8.1 Flux de vaultage d’une facture

```
1. Utilisateur valide une facture dans Odoo
2. Odoo : statut = todo, CRON ou job enqueue
3. CRON #1 : Odoo envoie vers DVIG (POST /ingest)
4. DVIG : stocke en outbox (accepted)
5. Worker DVIG : envoie vers Vault (POST /api/v1/events)
6. Vault : crée document, scelle, enregistre
7. CRON #2 : Odoo récupère la preuve (GET /api/v1/proof/account_move/:id)
8. Odoo : statut = vaulted, attestation disponible
9. Utilisateur : voit « Protégé » + peut télécharger l’attestation
```

**Tout ce flux est asynchrone** : aucun appel réseau bloquant lors de la validation de la facture.

### 8.2 Flux de consultation (Linky)

```
1. Utilisateur ouvre Linky
2. Linky appelle les APIs Vault (agrégats, health)
3. Vault retourne les données pré-calculées
4. Linky affiche les KPIs et le badge intégrité
```

---

## 9. Tenants et environnements

### 9.1 Tenants

Les tenants actifs incluent notamment :

- **core** / **core-stinger** : environnement interne
- **sarl-la-platine** : client-pilote
- **dido**, **rozas** : autres tenants
- **lab** : laboratoire / démo

Chaque tenant a un `manifest.json` dans `tenants/<tenant>/state/`.

### 8.2 Environnements

| Environnement | Usage | Exemple URL |
|---------------|-------|-------------|
| **lab** | Développement, tests | `*.lab.*.doreviateam.com` |
| **stinger** | Pré-production, validation | `*.stinger.*.doreviateam.com` |
| **prod** | Mise en production | `*.doreviateam.com` (sans lab/stinger) |

### 9.3 Architecture multi-tenant

- **Services partagés** : DVIG, Vault (plateforme core-stinger) peuvent servir plusieurs tenants
- **Données isolées** : Chaque document est associé à un `tenant` ; les requêtes sont filtrées
- **Point de vigilance** : Odoo, DVIG et Vault doivent utiliser le **même tenant** pour un flux cohérent

---

## 10. Maturité produit

| Composant | État actuel | Commentaire |
|-----------|-------------|-------------|
| **Vault** | Opérationnel | Scellement, preuves, agrégats |
| **DVIG** | Opérationnel | Outbox, forward, résilience |
| **Linky** | Opérationnel | Cockpit lecture, KPIs |
| **DIVA** | Expérimental | Synthèse IA, gouvernance |
| **DLP** | En réflexion | Marqueur d’intention métier |

⚠️ Un nouvel arrivant ne doit pas présumer que tout est « full production grade ». DIVA et DLP sont en cours de définition.

---

## 11. Cas d’usage typiques

### 11.1 Dirigeant consulte son tableau de bord

- Ouvre Linky
- Voit trésorerie, ventes, encaissements, etc.
- Le badge intégrité lui indique le taux de documents scellés
- Tous les indicateurs sont basés sur des données vaultées

### 11.2 Comptable valide une facture

- Valide la facture dans Odoo
- Quelques minutes plus tard, la facture passe en « Protégée »
- Peut télécharger l’attestation depuis la fiche facture
- En cas de contrôle, la preuve cryptographique est disponible

### 11.3 Contrôle fiscal

- L’entreprise fournit les attestations (JWS + ledger)
- Le contrôleur peut vérifier l’intégrité via les mécanismes standards (JWKS, hash)
- La chaîne de preuves est traçable et immuable

### 11.4 Diagnostic « Preuve non trouvée »

- Cause fréquente : tenant incohérent (Odoo envoie avec tenant A, Vault interrogé avec tenant B)
- Autre cause : DVIG n’a pas encore transmis au Vault (outbox en retard, erreur)
- Vérifier : `X-Tenant` dans les appels, configuration Odoo (`dorevia.dvig.source`), logs DVIG/Vault

---

## 12. Où trouver l’information

### 12.1 Documentation projet

| Document | Chemin | Contenu |
|----------|--------|---------|
| Description détaillée | `ZeDocs/TestV0/DESCRIPTION_DETAILLEE_PROJET_DOREVIA_PLATEFORM.md` | Architecture, composants, flux, stack |
| Vision technique | `ZeDocs/web22/VISION_TECHNIQUE_DOREVIA_v1.0.md` | Architecture cible, flux, principes |
| Pitch Business Angel | `ZeDocs/web20/RAPPORT_DOREVIA_POUR_INCONNU.md` | Vision produit, modèle économique |
| Observabilité trace_id | `ZeDocs/web30/SPEC_OBSERVABILITE_TRACE_ID_v1.0.md` | Traçage, logs, diagnostic |

### 12.2 Specs et guides métier

| Document | Contenu |
|----------|---------|
| `units/odoo/custom-addons/dorevia_vault_connector/README.md` | Connecteur Odoo, configuration, flux |
| `ZeDocs/web14/FLUX_VAULTAGE_ODOO_STINGER_SARL_LA_PLATINE.md` | Flux détaillé vaultage facture |
| `ZeDocs/web30/retest.md` | Procédure de retest du flux vaultage |
| `ZeDocs/web30/AUDIT_FLUX_VAULTAGE_2026-02-22.md` | Audit et correctifs flux |

### 12.3 Composants techniques (pour aller plus loin)

| Composant | Documentation |
|-----------|---------------|
| Vault | `sources/vault/README.md`, `sources/vault/docs/` |
| DVIG | `sources/dvig/README.md` |
| Linky | `units/dorevia-linky/README.md` |
| CLI dorevia.sh | `bin/dorevia.sh`, `COMMANDES_PIEREZ.md` |

---

## 13. Pièges courants et FAQ

### 13.1 « Linky affiche 0 € alors que des factures sont vaultées »

- **Cause** : Linky interroge un Vault différent de celui alimenté par DVIG
- **Exemple** : DVIG alimente `vault-core-stinger`, Linky lit `vault-sarl-la-platine` (vide)
- **Action** : Vérifier la configuration `VAULT_URL` de Linky et `VAULT_HOST` de DVIG

### 13.2 « Facture reste en todo ou pending_proof »

- **Causes possibles** : token DVIG invalide, DVIG down, Vault 404/500, tenant incorrect
- **Actions** : Vérifier logs Odoo, DVIG, Vault ; tables `outbox_events` et `documents`

### 13.3 « Preuve non trouvée » (404 sur GET proof)

- **Cause principale** : tenant absent ou incorrect dans l’appel (header `X-Tenant`)
- **Action** : Vérifier que Odoo envoie le bon tenant, et que la requête proof utilise le même

### 13.4 Format de la source

- Doit être `unit.env.tenant` (ex. `odoo.stinger.sarl-la-platine`)
- Une erreur de format peut bloquer l’authentification DVIG

### 13.5 Où sont stockées les données vaultées ?

- **Métadonnées** : PostgreSQL du Vault (table `documents`)
- **Fichiers** : stockage filesystem du Vault
- **Ledger** : PostgreSQL + filesystem (chaîne de hash)
- **Côté Odoo** : seules les preuves (id, hash, JWS, ledger_ref) sont stockées — pas les fichiers complets

---

## 14. Premiers pas recommandés

### Semaine 1

1. Lire ce document en entier
2. Parcourir `DESCRIPTION_DETAILLEE_PROJET_DOREVIA_PLATEFORM.md`
3. Comprendre la règle des 3V et le flux de vaultage
4. Identifier les tenants et environnements (lab, stinger, prod)
5. Demander un accès Odoo stinger (ex. sarl-la-platine) et valider une facture de test
6. Consulter Linky et observer les agrégats

### Semaine 2

1. Lire le README du connecteur Odoo
2. Lire le flux vaultage détaillé (`FLUX_VAULTAGE_ODOO_STINGER_SARL_LA_PLATINE.md`)
3. Comprendre les statuts (`todo`, `pending_proof`, `vaulted`, `failed_soft`, `failed_hard`)
4. Participer à une démo technique (DVIG outbox, Vault documents, API proof)

### Semaine 3+

1. Se familiariser avec la documentation des specs (payments, events, proof)
2. Identifier les contacts clés (technique, produit, déploiement)
3. Participer aux revues de specs et ateliers fonctionnels
4. Consulter les ZeDocs régulièrement pour les évolutions

---

## 15. Glossaire

| Terme | Définition simple |
|-------|-------------------|
| **Vaultage** | Action de sceller un document (hash + JWS + ledger) |
| **Ledger** | Chaîne de hash immuable, append-only |
| **JWS** | Signature standard (JSON Web Signature) |
| **Tenant** | Client isolé, entité logique (ex. `sarl-la-platine`) |
| **Agrégat** | Synthèse calculée à partir des documents vaultés (ventes, trésorerie, etc.) |
| **Source** | Identité technique d’origine (`unit.env.tenant`) |
| **Outbox** | File d’attente DVIG avant envoi au Vault |
| **Preuve** | Garantie cryptographique d’intégrité (hash, JWS, ref ledger) |

---

## Annexe : Schéma récapitulatif des statuts Odoo

| Statut | Signification |
|--------|---------------|
| `todo` | À envoyer vers DVIG |
| `pending_proof` | Envoyé, en attente de la preuve du Vault |
| `vaulted` | Preuve reçue, document protégé |
| `failed_soft` | Échec temporaire, retry prévu |
| `failed_hard` | Échec bloquant, intervention manuelle possible |

---

**Document maintenu par** : Équipe Dorevia  
**Dernière mise à jour** : 2026-02-23  
**Feedback** : N’hésitez pas à proposer des améliorations à ce guide.
