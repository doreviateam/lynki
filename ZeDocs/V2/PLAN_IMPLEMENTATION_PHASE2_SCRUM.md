# 🎯 Plan d'Implémentation Phase 2 "Intention/Exécution" — Mode Scrum

**Version** : 1.0  
**Date** : 2025-01-29  
**Base** : `SPEC_Dorevia_Phase2_Intention_Execution_v1.0.md`  
**Durée estimée** : 4 sprints (8 semaines)  
**Équipe** : Dev plateforme / Exploitation

---

## 📋 Vue d'Ensemble

### Objectif Phase 2

Séparer l'intention humaine de l'exécution machine : un CLI interactif capture les décisions opérateur dans une configuration déclarative, puis une exécution non interactive et déterministe matérialise cette configuration.

### Tenant de Référence

Le tenant **`core`** reste le tenant de référence interne Dorevia pour la Phase 2. Toutes les fonctionnalités Phase 2 sont d'abord implémentées et validées sur le tenant `core` avant d'être étendues aux autres tenants.

### Définition de "Fait" (DoD)

La Phase 2 est terminée si :
- ✅ CLI interactif (`prompt`) capture l'intention via questions structurées
- ✅ Configuration déclarative générée depuis intention (séparée de l'exécution)
- ✅ Agrégation gateway automatique (Caddyfile global généré et rechargé)
- ✅ Processus de mise en production structuré en 5 phases documentées
- ✅ Intentions journalisées (traçabilité complète)

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 0** : Préparation (1 semaine) — Schéma intention, structure
- **Sprint 1** : CLI Prompt Interactif (2 semaines)
- **Sprint 2** : Agrégation Gateway (1 semaine)
- **Sprint 3** : Processus Production & Journalisation (2 semaines)
- **Sprint 4** : Tests & Documentation (2 semaines)

**Total** : 8 semaines

---

## 📦 Sprint 0 : Préparation (1 semaine)

### Objectif

Préparer les fondations Phase 2 : schéma de configuration intention, structure de projet, validation.

### User Stories

#### US-0.1 : Schéma de configuration intention v2.0

**En tant que** développeur plateforme  
**Je veux** un schéma JSON Schema pour valider les configurations intention  
**Afin de** garantir la cohérence et la validité des intentions capturées

**Critères d'acceptation** :
- [ ] Schéma JSON Schema `schemas/intent.schema.json` créé
- [ ] Validation champs obligatoires
- [ ] Validation enums (mode, universes, etc.)
- [ ] Validation règles de nommage
- [ ] Documentation schéma

**Tâches techniques** :
- [ ] Créer schéma JSON Schema
- [ ] Définir structure intention (tenant, env, universes, mode, domains, alias, preflight)
- [ ] Validation enums
- [ ] Documentation

**Estimation** : 3 points

---

#### US-0.2 : Structure de projet Phase 2

**En tant que** développeur plateforme  
**Je veux** une structure de projet claire pour Phase 2  
**Afin de** organiser les fichiers intention et journaux

**Critères d'acceptation** :
- [ ] Répertoire `tenants/<tenant>/state/intents/` pour intentions
- [ ] Répertoire `tenants/<tenant>/state/logs/` pour journaux
- [ ] Documentation structure
- [ ] Exemples intention

**Tâches techniques** :
- [ ] Créer structure répertoires
- [ ] Documentation structure
- [ ] Exemples intention

**Estimation** : 2 points

---

### Backlog Sprint 0

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-0.1 | Schéma de configuration intention v2.0 | 3 | P0 |
| US-0.2 | Structure de projet Phase 2 | 2 | P0 |

**Total Sprint 0** : 5 points

---

## 📦 Sprint 1 : CLI Prompt Interactif (2 semaines)

### Objectif

Implémenter le CLI interactif pour capture d'intention via questions structurées.

### User Stories

#### US-1.1 : Commande `prompt` — Étape 1-3 (Contexte, Univers, Mode)

**En tant que** exploitant  
**Je veux** répondre aux questions de contexte, univers et mode via `dorevia.sh prompt`  
**Afin de** capturer l'intention de déploiement

**Critères d'acceptation** :
- [ ] Commande `dorevia.sh prompt <tenant> [--env <env>]` implémentée
- [ ] Étape 1 : Contexte (tenant, env, confirmation prod)
- [ ] Étape 2 : Univers (activation par univers)
- [ ] Étape 3 : Mode production (SaaS vs Client)
- [ ] Validation en temps réel
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Implémenter `cmd_prompt()` dans `dorevia.sh`
- [ ] Bibliothèque CLI interactive (Python `inquirer` ou équivalent)
- [ ] Questions structurées (étapes 1-3)
- [ ] Validation en temps réel
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-1.2 : Commande `prompt` — Étape 4-5 (Domaines, Alias)

**En tant que** exploitant  
**Je veux** configurer les domaines et alias via le prompt  
**Afin de** définir les hostnames et alias pour le déploiement

**Critères d'acceptation** :
- [ ] Étape 4 : Calcul et affichage FQDN + confirmation
- [ ] Étape 5 : Alias optionnels (par service ou global)
- [ ] Validation format domaines
- [ ] Validation format alias
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Calcul FQDN depuis intention (étapes 1-3)
- [ ] Affichage formaté FQDN
- [ ] Saisie alias
- [ ] Validation format
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-1.3 : Commande `prompt` — Étape 6-7 (Préflight, Résumé)

**En tant que** exploitant  
**Je veux** configurer le préflight et voir un résumé avant génération  
**Afin de** valider l'intention avant génération de configuration

**Critères d'acceptation** :
- [ ] Étape 6 : Préflight & installation contrôlée
- [ ] Étape 7 : Résumé final (écran de vérité)
- [ ] Confirmation finale
- [ ] Génération configuration intention
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Questions préflight
- [ ] Génération résumé formaté
- [ ] Confirmation finale
- [ ] Génération `intent-<timestamp>.json`
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-1.4 : Génération configuration intention

**En tant que** développeur plateforme  
**Je veux** générer une configuration déclarative depuis l'intention capturée  
**Afin de** séparer l'intention de l'exécution

**Critères d'acceptation** :
- [ ] Format JSON déclaratif (`intent-<timestamp>.json`)
- [ ] Validation contre schéma JSON Schema
- [ ] Fichier versionnable (Git)
- [ ] Structure complète (tenant, env, universes, mode, domains, alias, preflight)
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Fonction génération JSON
- [ ] Validation schéma
- [ ] Structure complète
- [ ] Tests unitaires

**Estimation** : 3 points

---

### Backlog Sprint 1

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-1.1 | Commande `prompt` — Étape 1-3 | 5 | P0 |
| US-1.2 | Commande `prompt` — Étape 4-5 | 5 | P0 |
| US-1.3 | Commande `prompt` — Étape 6-7 | 5 | P0 |
| US-1.4 | Génération configuration intention | 3 | P0 |

**Total Sprint 1** : 18 points

---

## 📦 Sprint 2 : Agrégation Gateway (1 semaine)

### Objectif

Automatiser l'agrégation et le rechargement du Caddyfile global.

### User Stories

#### US-2.1 : Commande `gateway aggregate`

**En tant que** exploitant  
**Je veux** agréger automatiquement tous les Caddyfiles dans le Caddyfile global  
**Afin de** éviter l'agrégation manuelle

**Critères d'acceptation** :
- [ ] Commande `dorevia.sh gateway aggregate [--reload]` implémentée
- [ ] Collecte tous les Caddyfiles dans `tenants/*/rendered/*/caddy/Caddyfile`
- [ ] Agrégation dans `units/gateway/Caddyfile`
- [ ] Déduplication (même hostname)
- [ ] Validation syntaxe Caddy
- [ ] Option `--reload` pour recharger Caddy
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Implémenter `cmd_gateway_aggregate()` dans `dorevia.sh`
- [ ] Collecte Caddyfiles
- [ ] Agrégation avec déduplication
- [ ] Validation syntaxe
- [ ] Rechargement Caddy (optionnel)
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-2.2 : Intégration agrégation dans workflow

**En tant que** exploitant  
**Je veux** que l'agrégation soit automatique après `apply`  
**Afin de** simplifier le workflow

**Critères d'acceptation** :
- [ ] Option `--auto-gateway` dans `apply`
- [ ] Agrégation automatique après déploiement réussi
- [ ] Rechargement Caddy automatique
- [ ] Logs structurés
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Ajouter option `--auto-gateway` à `cmd_apply()`
- [ ] Appel `gateway aggregate --reload` après apply
- [ ] Gestion erreurs
- [ ] Tests unitaires

**Estimation** : 3 points

---

### Backlog Sprint 2

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-2.1 | Commande `gateway aggregate` | 5 | P0 |
| US-2.2 | Intégration agrégation dans workflow | 3 | P0 |

**Total Sprint 2** : 8 points

---

## 📦 Sprint 3 : Processus Production & Journalisation (2 semaines)

### Objectif

Implémenter le processus de mise en production structuré et la journalisation des intentions.

### User Stories

#### US-3.1 : Processus de mise en production — Phases 0-2

**En tant que** exploitant  
**Je veux** un processus structuré pour la mise en production  
**Afin de** garantir la traçabilité et la validation

**Critères d'acceptation** :
- [ ] Phase 0 : Préconditions (validation)
- [ ] Phase 1 : Go/No-Go (compte-rendu)
- [ ] Phase 2 : Préflight Production (automatisé)
- [ ] Documentation processus
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Script `lib/production/phase0_preconditions.sh`
- [ ] Script `lib/production/phase1_gonogo.sh`
- [ ] Extension `preflight` pour production
- [ ] Documentation
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-3.2 : Processus de mise en production — Phases 3-5

**En tant que** exploitant  
**Je veux** compléter le processus de mise en production  
**Afin de** valider et déployer en production

**Critères d'acceptation** :
- [ ] Phase 3 : Génération Configuration (depuis intention)
- [ ] Phase 4 : Apply Prod (exécution non interactive)
- [ ] Phase 5 : Validation Post-Prod (rapport)
- [ ] Commande `dorevia.sh production <tenant> --env prod`
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Script `lib/production/phase3_config.sh`
- [ ] Extension `apply` pour production
- [ ] Script `lib/production/phase5_validation.sh`
- [ ] Commande `cmd_production()` dans `dorevia.sh`
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-3.3 : Journalisation intentions

**En tant que** exploitant  
**Je veux** que toutes les intentions soient journalisées  
**Afin de** garantir la traçabilité complète

**Critères d'acceptation** :
- [ ] Format journal structuré (`intent-<timestamp>.log`)
- [ ] Journalisation toutes les questions/réponses
- [ ] Timestamp pour chaque interaction
- [ ] Identification opérateur (si disponible)
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Fonction journalisation dans `cmd_prompt()`
- [ ] Format structuré (timestamp|step|question|answer|operator)
- [ ] Écriture fichier log
- [ ] Tests unitaires

**Estimation** : 3 points

---

#### US-3.4 : Mode `apply` depuis intention

**En tant que** exploitant  
**Je veux** déployer depuis une configuration intention  
**Afin de** séparer l'intention de l'exécution

**Critères d'acceptation** :
- [ ] Option `--intent <intent-file>` dans `apply`
- [ ] Lecture configuration intention
- [ ] Génération manifest depuis intention (si nécessaire)
- [ ] Exécution déterministe
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Ajouter option `--intent` à `cmd_apply()`
- [ ] Fonction lecture configuration intention
- [ ] Conversion intention → manifest (si nécessaire)
- [ ] Exécution déterministe
- [ ] Tests unitaires

**Estimation** : 5 points

---

### Backlog Sprint 3

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-3.1 | Processus production — Phases 0-2 | 5 | P0 |
| US-3.2 | Processus production — Phases 3-5 | 5 | P0 |
| US-3.3 | Journalisation intentions | 3 | P0 |
| US-3.4 | Mode `apply` depuis intention | 5 | P0 |

**Total Sprint 3** : 18 points

---

## 📦 Sprint 4 : Tests & Documentation (2 semaines)

### Objectif

Valider la Phase 2 avec les critères d'acceptation et documenter.

### User Stories

#### US-4.1 : Tests de conformité Scénario A (Prompt Lab)

**En tant que** développeur plateforme  
**Je veux** valider le scénario A avec prompt sur le tenant "core" en Lab  
**Afin de** vérifier que la Phase 2 fonctionne correctement

**Critères d'acceptation** :
- [ ] `prompt core --env lab` : Questions structurées, génération intent
- [ ] `render core --env lab` : Génération depuis intent
- [ ] `gateway aggregate --reload` : Agrégation + rechargement
- [ ] `apply core --env lab --intent <intent-file>` : Déploiement depuis intent
- [ ] Journal intention : Traçabilité complète
- [ ] Tests automatisés

**Tâches techniques** :
- [ ] Scripts de test Scénario A
- [ ] Tests automatisés
- [ ] Validation résultats

**Estimation** : 3 points

---

#### US-4.2 : Tests de conformité Scénario B (Processus Production)

**En tant que** développeur plateforme  
**Je veux** valider le processus de mise en production complet  
**Afin de** vérifier l'intégration complète

**Critères d'acceptation** :
- [ ] `production core --env prod` : Processus 5 phases
- [ ] Validation préconditions
- [ ] Go/No-Go documenté
- [ ] Préflight production
- [ ] Génération configuration
- [ ] Apply production
- [ ] Validation post-prod
- [ ] Tests automatisés

**Tâches techniques** :
- [ ] Scripts de test Scénario B
- [ ] Tests automatisés
- [ ] Validation résultats

**Estimation** : 3 points

---

#### US-4.3 : Documentation Phase 2

**En tant que** exploitant  
**Je veux** une documentation complète de la Phase 2  
**Afin de** comprendre et utiliser les nouvelles fonctionnalités

**Critères d'acceptation** :
- [ ] Guide utilisation commande `prompt`
- [ ] Guide utilisation `gateway aggregate`
- [ ] Guide processus de mise en production
- [ ] Documentation journalisation
- [ ] Exemples d'utilisation
- [ ] FAQ

**Tâches techniques** :
- [ ] Rédiger guide utilisation
- [ ] Documenter processus production
- [ ] Exemples
- [ ] FAQ

**Estimation** : 3 points

---

### Backlog Sprint 4

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-4.1 | Tests de conformité Scénario A (Prompt Lab) | 3 | P0 |
| US-4.2 | Tests de conformité Scénario B (Processus Production) | 3 | P0 |
| US-4.3 | Documentation Phase 2 | 3 | P0 |

**Total Sprint 4** : 9 points

---

## 📊 Backlog Global Phase 2

### Vue d'ensemble

| Sprint | Durée | Points | Objectif Principal |
|--------|-------|--------|-------------------|
| Sprint 0 | 1 semaine | 5 | Préparation (schéma, structure) |
| Sprint 1 | 2 semaines | 18 | CLI Prompt Interactif |
| Sprint 2 | 1 semaine | 8 | Agrégation Gateway |
| Sprint 3 | 2 semaines | 18 | Processus Production & Journalisation |
| Sprint 4 | 2 semaines | 9 | Tests & Documentation |
| **Total** | **8 semaines** | **58 points** | |

### Backlog par Priorité

#### P0 — Must have (Phase 2)

Toutes les user stories listées ci-dessus sont **P0** (must have) pour la Phase 2.

#### P1 — Should have (Phase 2)

| ID | User Story | Points | Sprint |
|----|------------|--------|--------|
| US-P1.1 | Validation configuration intention (schéma JSON Schema) | 2 | Sprint 1 |
| US-P1.2 | Rapport de mise en production (bundle d'audit) | 3 | Sprint 3 |

#### P2 — Nice to have (Phase 2)

| ID | User Story | Points | Sprint |
|----|------------|--------|--------|
| US-P2.1 | Smoke tests automatisés (liste fixe) | 3 | Sprint 4 |
| US-P2.2 | Export bundle d'audit (archive config + logs + versions) | 3 | Sprint 4 |

---

## 🎯 Critères d'Acceptation Globaux

### Definition of Done (DoD) Phase 2

La Phase 2 est terminée si :

1. **CLI interactif (prompt)** :
   - [ ] Commande `prompt` fonctionnelle (7 étapes)
   - [ ] Génération configuration intention
   - [ ] Validation en temps réel

2. **Séparation intention/exécution** :
   - [ ] Configuration déclarative générée depuis intention
   - [ ] Mode `apply` depuis intention
   - [ ] Exécution non interactive et déterministe

3. **Agrégation gateway** :
   - [ ] Commande `gateway aggregate` fonctionnelle
   - [ ] Agrégation automatique après `apply` (option)
   - [ ] Rechargement Caddy automatique

4. **Processus de mise en production** :
   - [ ] Processus 5 phases documenté et automatisé
   - [ ] Commande `production` fonctionnelle
   - [ ] Validation complète

5. **Journalisation intentions** :
   - [ ] Journal structuré (`intent-<timestamp>.log`)
   - [ ] Traçabilité complète
   - [ ] Support d'audit

6. **Tests de conformité** :
   - [ ] Scénario A validé (Prompt Lab)
   - [ ] Scénario B validé (Processus Production)

7. **Documentation** :
   - [ ] Guide utilisation commandes Phase 2
   - [ ] Guide processus production
   - [ ] Exemples d'utilisation

---

## 📅 Planning Détaillé

### Sprint 0 : Préparation (Semaine 1)

**Dates** : Semaine 1  
**Objectif** : Setup, schéma intention, structure

**User Stories** :
- US-0.1 : Schéma de configuration intention v2.0 (3 points)
- US-0.2 : Structure de projet Phase 2 (2 points)

**Livrables** :
- `schemas/intent.schema.json`
- Structure projet documentée
- Exemples intention

---

### Sprint 1 : CLI Prompt Interactif (Semaines 2-3)

**Dates** : Semaines 2-3  
**Objectif** : CLI interactif pour capture d'intention

**User Stories** :
- US-1.1 : Commande `prompt` — Étape 1-3 (5 points)
- US-1.2 : Commande `prompt` — Étape 4-5 (5 points)
- US-1.3 : Commande `prompt` — Étape 6-7 (5 points)
- US-1.4 : Génération configuration intention (3 points)

**Livrables** :
- Commande `prompt` fonctionnelle
- Génération configuration intention
- Tests unitaires

---

### Sprint 2 : Agrégation Gateway (Semaine 4)

**Dates** : Semaine 4  
**Objectif** : Automatisation agrégation Caddyfile

**User Stories** :
- US-2.1 : Commande `gateway aggregate` (5 points)
- US-2.2 : Intégration agrégation dans workflow (3 points)

**Livrables** :
- Commande `gateway aggregate` fonctionnelle
- Intégration dans workflow `apply`
- Tests unitaires

---

### Sprint 3 : Processus Production & Journalisation (Semaines 5-6)

**Dates** : Semaines 5-6  
**Objectif** : Processus structuré et journalisation

**User Stories** :
- US-3.1 : Processus production — Phases 0-2 (5 points)
- US-3.2 : Processus production — Phases 3-5 (5 points)
- US-3.3 : Journalisation intentions (3 points)
- US-3.4 : Mode `apply` depuis intention (5 points)

**Livrables** :
- Processus 5 phases automatisé
- Commande `production` fonctionnelle
- Journalisation intentions
- Mode `apply` depuis intention

---

### Sprint 4 : Tests & Documentation (Semaines 7-8)

**Dates** : Semaines 7-8  
**Objectif** : Valider Phase 2 et documenter

**User Stories** :
- US-4.1 : Tests de conformité Scénario A (3 points)
- US-4.2 : Tests de conformité Scénario B (3 points)
- US-4.3 : Documentation Phase 2 (3 points)

**Livrables** :
- Tests de conformité validés
- Documentation complète
- Guide utilisation
- Phase 2 terminée ✅

---

## 🚨 Risques & Mitigations

### Risque 1 : Complexité CLI Prompt

**Probabilité** : Moyenne  
**Impact** : Élevé

**Mitigation** :
- Utiliser bibliothèque CLI interactive éprouvée (Python `inquirer`)
- Tests unitaires pour chaque étape
- Documentation complète
- Approche progressive (étapes par étapes)

### Risque 2 : Intégration agrégation gateway

**Probabilité** : Faible  
**Impact** : Moyen

**Mitigation** :
- Tests unitaires validation syntaxe Caddy
- Déduplication robuste
- Gestion erreurs complète

### Risque 3 : Processus production complexe

**Probabilité** : Moyenne  
**Impact** : Élevé

**Mitigation** :
- Documentation claire des 5 phases
- Scripts modulaires (une phase = un script)
- Tests unitaires par phase
- Validation progressive

---

## 📝 Notes d'Implémentation

### Bibliothèque CLI Interactive

**Recommandation** : Python `inquirer` ou `prompt_toolkit`

**Avantages** :
- Support questions structurées
- Validation en temps réel
- Formatage sortie lisible
- Multi-plateforme

**Alternative** : Node.js `inquirer` (si Node.js déjà présent)

### Format Configuration Intention

**Structure recommandée** :
- JSON (lisible, versionnable)
- Schéma JSON Schema pour validation
- Compatible avec manifest.json (Phase 1)
- Timestamp pour traçabilité

### Agrégation Gateway

**Algorithme** :
1. Parcourir `tenants/*/rendered/*/caddy/Caddyfile`
2. Collecter tous les blocs
3. Dédupliquer (même hostname)
4. Valider syntaxe Caddy
5. Écrire dans `units/gateway/Caddyfile`
6. Recharger Caddy si demandé

---

## 🎯 Métriques de Succès

### Vélocité Cible

- **Sprint 0** : 5 points (1 semaine)
- **Sprint 1** : 18 points (2 semaines) = 9 points/semaine
- **Sprint 2** : 8 points (1 semaine)
- **Sprint 3** : 18 points (2 semaines) = 9 points/semaine
- **Sprint 4** : 9 points (2 semaines) = 4.5 points/semaine

**Vélocité moyenne** : ~7 points/semaine

### Critères de Succès

- ✅ Tous les tests de conformité passent
- ✅ Documentation complète
- ✅ Processus production validé
- ✅ Journalisation complète
- ✅ Agrégation gateway automatique

---

## 📚 Références

### Documents Phase 2

- **SPEC Phase 2** : `ZeDocs/V2/SPEC_Dorevia_Phase2_Intention_Execution_v1.0.md`
- **Plan d'implémentation** : `ZeDocs/V2/PLAN_IMPLEMENTATION_PHASE2_SCRUM.md` (ce document)

### Documents Phase 1 (Dépendances)

- **SPEC Phase 1** : `ZeDocs/V2/SPEC_Dorevia_Phase1_Fondations_v1.0.md`
- **Plan Phase 1** : `ZeDocs/V2/PLAN_IMPLEMENTATION_PHASE1_SCRUM.md`
- **Guide Phase 1** : `ZeDocs/V2/GUIDE_PHASE1.md`

---

**Dernière mise à jour** : 2025-01-29  
**Version** : 1.0  
**Statut** : Plan d'implémentation

