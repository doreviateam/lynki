# 🎯 Plan d'Implémentation Phase 1 "Fondations" — Mode Scrum

**Version** : 1.0  
**Date** : 2025-01-29  
**Base** : `SPEC_Dorevia_Phase1_Fondations_v1.0.md`  
**Durée estimée** : 5 sprints (10 semaines)  
**Équipe** : Dev plateforme / Exploitation

---

## 📋 Vue d'Ensemble

### Objectif Phase 1

Rendre la plateforme **cohérente avec ses propres principes** : une configuration déclarative complète et des artefacts générés de manière déterministe, avant tout enrichissement (alias, domaines clients, serveur client).

### Tenant de Référence

Le tenant **`core`** est le tenant de référence interne Dorevia, utilisé comme **baseline d'implémentation et de test**. Toutes les fonctionnalités Phase 1 sont d'abord implémentées et validées sur le tenant `core` avant d'être étendues aux autres tenants (`dido`, `rozas`).

### Définition de "Fait" (DoD)

La Phase 1 est terminée si :
- ✅ Config déclarative unique décrit tenant, univers, environnements, domaines canoniques, units
- ✅ Tous les artefacts déployables sont **générés** depuis cette config
- ✅ Exécution "apply" est **non interactive** et **déterministe**
- ✅ Hostnames publiés sont **cohérents** et stables (incluant `<env>` selon le standard)
- ✅ Préflight "check" détecte les problèmes sans modifier le système

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 0** : Préparation (1 semaine) — Setup, schéma, validation
- **Sprint 1** : Configuration déclarative (2 semaines)
- **Sprint 2** : Génération déterministe (2 semaines)
- **Sprint 3** : Refactor CLI (2 semaines)
- **Sprint 4** : Préflight & Apply (2 semaines)
- **Sprint 5** : Tests & Documentation (1 semaine)

**Total** : 10 semaines

---

## 📦 Sprint 0 : Préparation (1 semaine)

### Objectif

Préparer les fondations : schéma de configuration, structure de projet, validation.

### User Stories

#### US-0.1 : Schéma de configuration v1.0

**En tant que** développeur plateforme  
**Je veux** un schéma JSON Schema pour valider les manifests  
**Afin de** garantir la cohérence et la complétude des configurations

**Critères d'acceptation** :
- [ ] Schéma JSON Schema créé (`schemas/manifest.schema.json`)
- [ ] Validation des champs obligatoires (`tenant_id`, `universes`, `environments`, `units`)
- [ ] Validation des enums (env: `lab|stinger|prod`, univers: `odoo|pos|sylius`, units: liste)
- [ ] Validation des règles de nommage (slug tenant)
- [ ] Validation de cohérence (univers activé ⇒ unit(s) requises)
- [ ] Tests unitaires du validateur

**Tâches techniques** :
- [ ] Définir structure JSON Schema
- [ ] Implémenter validateur (Python/Bash/Go)
- [ ] Tests unitaires validateur
- [ ] Documentation schéma

**Estimation** : 3 points

---

#### US-0.2 : Structure de projet Phase 1

**En tant que** développeur plateforme  
**Je veux** une structure de projet claire pour Phase 1  
**Afin de** organiser le code et les artefacts générés

**Critères d'acceptation** :
- [ ] Structure `rendered/` documentée
- [ ] Structure `lib/render/` créée (templates)
- [ ] Structure `lib/preflight/` créée
- [ ] Structure `schemas/` créée
- [ ] Documentation structure projet

**Tâches techniques** :
- [ ] Créer dossiers `lib/render/`, `lib/preflight/`, `schemas/`
- [ ] Documenter structure dans README
- [ ] Exemples de structure `rendered/`

**Estimation** : 2 points

---

### Backlog Sprint 0

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-0.1 | Schéma de configuration v1.0 | 3 | P0 |
| US-0.2 | Structure de projet Phase 1 | 2 | P0 |

**Total Sprint 0** : 5 points

---

## 📦 Sprint 1 : Configuration déclarative (2 semaines)

### Objectif

Enrichir les manifests existants avec la structure complète Phase 1 et valider.

### User Stories

#### US-1.1 : Enrichir manifest tenant "core" (tenant de référence)

**En tant que** développeur plateforme  
**Je veux** enrichir le manifest du tenant "core" (tenant de référence interne Dorevia) avec la structure Phase 1  
**Afin de** avoir un exemple de référence conforme et une baseline pour les autres tenants

**Critères d'acceptation** :
- [ ] Manifest `core` enrichi avec :
  - `tenant_id` : "core"
  - `universes` : ["odoo"]
  - `environments` : ["lab", "stinger", "prod"]
  - `domain_mode` : "saas"
  - `units` : { "platform": ["dvig", "vault", "postgres"], "odoo": ["odoo", "postgres"] }
  - `secrets_refs` : { "dvig_tokens": "tenants/core/secrets/dvig.tokens.yml" }
- [ ] Manifest validé avec schéma JSON Schema
- [ ] Manifest versionné (Git)
- [ ] Manifest `core` sert de **référence** pour migration autres tenants

**Tâches techniques** :
- [ ] Lire manifest actuel `core`
- [ ] Enrichir avec structure Phase 1
- [ ] Valider avec schéma
- [ ] Commit Git

**Estimation** : 2 points

---

#### US-1.2 : Migrer manifests autres tenants

**En tant que** développeur plateforme  
**Je veux** migrer les manifests des autres tenants (dido, rozas)  
**Afin de** avoir tous les tenants conformes Phase 1

**Critères d'acceptation** :
- [ ] Manifest `dido` enrichi et validé
- [ ] Manifest `rozas` enrichi et validé
- [ ] Tous les manifests validés avec schéma
- [ ] Documentation migration

**Tâches techniques** :
- [ ] Enrichir manifest `dido`
- [ ] Enrichir manifest `rozas`
- [ ] Valider tous les manifests
- [ ] Documenter processus migration

**Estimation** : 3 points

---

#### US-1.3 : Commande `validate` fonctionnelle

**En tant que** exploitant  
**Je veux** valider un manifest avec `dorevia.sh validate <tenant>`  
**Afin de** détecter les erreurs de configuration avant déploiement

**Critères d'acceptation** :
- [ ] Commande `dorevia.sh validate <tenant>` implémentée
- [ ] Validation avec schéma JSON Schema
- [ ] Sortie lisible (erreurs détaillées)
- [ ] Code retour (0 = OK, 1 = KO)
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Implémenter `cmd_validate()` dans `dorevia.sh`
- [ ] Intégrer validateur JSON Schema
- [ ] Gestion erreurs et sortie
- [ ] Tests unitaires

**Estimation** : 3 points

---

### Backlog Sprint 1

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-1.1 | Enrichir manifest tenant "core" | 2 | P0 |
| US-1.2 | Migrer manifests autres tenants | 3 | P0 |
| US-1.3 | Commande `validate` fonctionnelle | 3 | P0 |

**Total Sprint 1** : 8 points

---

## 📦 Sprint 2 : Génération déterministe (2 semaines)

### Objectif

Implémenter le moteur de rendu pour générer Caddyfile et docker-compose.yml depuis la config.

### User Stories

#### US-2.1 : Moteur de rendu Caddyfile

**En tant que** développeur plateforme  
**Je veux** générer le Caddyfile depuis le manifest  
**Afin de** éliminer l'édition manuelle et garantir la cohérence

**Critères d'acceptation** :
- [ ] Template Caddyfile créé (`lib/render/templates/caddyfile.template`)
- [ ] Génération depuis manifest (tenant, univers, env)
- [ ] Calcul hostnames canoniques : `<univers>.<env>.<tenant>.doreviateam.com`
- [ ] Calcul hostnames services cœur : `dvig.<env>.<tenant>.doreviateam.com`, `vault.<env>.<tenant>.doreviateam.com`
- [ ] Génération idempotente (mêmes inputs ⇒ mêmes outputs)
- [ ] Sortie dans `tenants/<tenant>/rendered/<env>/caddy/Caddyfile`
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Créer template Caddyfile
- [ ] Implémenter fonction `render_caddyfile(tenant, env)`
- [ ] Calcul hostnames depuis manifest
- [ ] Génération idempotente
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-2.2 : Moteur de rendu docker-compose.yml (platform)

**En tant que** développeur plateforme  
**Je veux** générer `docker-compose.yml` pour les services platform depuis le manifest  
**Afin de** éliminer les templates manuels et garantir la cohérence

**Critères d'acceptation** :
- [ ] Template docker-compose.yml platform créé
- [ ] Génération depuis manifest (tenant, units platform)
- [ ] Variables depuis manifest (images, secrets_refs)
- [ ] Génération idempotente
- [ ] Sortie dans `tenants/<tenant>/rendered/<env>/platform/docker-compose.yml`
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Créer template docker-compose.yml platform
- [ ] Implémenter fonction `render_platform_compose(tenant, env)`
- [ ] Variables depuis manifest
- [ ] Génération idempotente
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-2.3 : Moteur de rendu docker-compose.yml (app)

**En tant que** développeur plateforme  
**Je veux** générer `docker-compose.yml` pour les applications depuis le manifest  
**Afin de** éliminer les templates manuels et garantir la cohérence

**Critères d'acceptation** :
- [ ] Template docker-compose.yml app créé
- [ ] Génération depuis manifest (tenant, univers, env, units app)
- [ ] Variables depuis manifest (images, secrets_refs)
- [ ] Génération idempotente
- [ ] Sortie dans `tenants/<tenant>/rendered/<env>/<univers>/docker-compose.yml`
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Créer template docker-compose.yml app
- [ ] Implémenter fonction `render_app_compose(tenant, univers, env)`
- [ ] Variables depuis manifest
- [ ] Génération idempotente
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-2.4 : Commande `render` fonctionnelle

**En tant que** exploitant  
**Je veux** générer tous les artefacts avec `dorevia.sh render <tenant> --env <env>`  
**Afin de** produire les fichiers déployables depuis la config

**Critères d'acceptation** :
- [ ] Commande `dorevia.sh render <tenant> --env <env>` implémentée
- [ ] Génération Caddyfile
- [ ] Génération docker-compose.yml (platform + app)
- [ ] Génération idempotente
- [ ] Sortie dans `rendered/<env>/`
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Implémenter `cmd_render()` dans `dorevia.sh`
- [ ] Orchestrer génération (Caddyfile + compose)
- [ ] Gestion erreurs
- [ ] Tests unitaires

**Estimation** : 3 points

---

### Backlog Sprint 2

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-2.1 | Moteur de rendu Caddyfile | 5 | P0 |
| US-2.2 | Moteur de rendu docker-compose.yml (platform) | 5 | P0 |
| US-2.3 | Moteur de rendu docker-compose.yml (app) | 5 | P0 |
| US-2.4 | Commande `render` fonctionnelle | 3 | P0 |

**Total Sprint 2** : 18 points

---

## 📦 Sprint 3 : Refactor CLI (2 semaines)

### Objectif

Refactorer `dorevia.sh` pour éliminer la logique implicite et normaliser les hostnames.

### User Stories

#### US-3.1 : Éliminer logique implicite dans `dorevia.sh`

**En tant que** développeur plateforme  
**Je veux** éliminer toute logique implicite dans `dorevia.sh`  
**Afin de** rendre le code déterministe et maintenable

**Critères d'acceptation** :
- [ ] Tous les noms (containers, volumes, DB) déclarés dans manifest
- [ ] Génération depuis manifest uniquement
- [ ] Pas de hardcoding de noms
- [ ] Code review validé

**Tâches techniques** :
- [ ] Audit logique implicite dans `dorevia.sh`
- [ ] Déplacer logique vers manifest
- [ ] Générer depuis manifest
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-3.2 : Normalisation hostnames DVIG/Vault (ajout ENV)

**En tant que** exploitant  
**Je veux** que les hostnames DVIG/Vault incluent l'environnement  
**Afin de** respecter le standard Phase 1

**Critères d'acceptation** :
- [ ] Hostnames DVIG : `dvig.<env>.<tenant>.doreviateam.com`
- [ ] Hostnames Vault : `vault.<env>.<tenant>.doreviateam.com`
- [ ] Caddyfile généré avec hostnames normalisés
- [ ] Documentation breaking change
- [ ] Plan de migration DNS

**Tâches techniques** :
- [ ] Mettre à jour template Caddyfile (ajout ENV)
- [ ] Générer hostnames avec ENV
- [ ] Documenter breaking change
- [ ] Plan de migration DNS

**Estimation** : 3 points

---

#### US-3.3 : Refactor commandes existantes (compatibilité)

**En tant que** exploitant  
**Je veux** que les commandes existantes (`platform up`, `app up`) fonctionnent toujours  
**Afin de** maintenir la compatibilité pendant la transition

**Critères d'acceptation** :
- [ ] Commandes existantes fonctionnelles
- [ ] Utilisation manifest enrichi
- [ ] Génération depuis `rendered/` si disponible
- [ ] Tests de régression

**Tâches techniques** :
- [ ] Refactor `cmd_platform_up()` pour utiliser manifest
- [ ] Refactor `cmd_app_up()` pour utiliser manifest
- [ ] Tests de régression
- [ ] Documentation migration

**Estimation** : 5 points

---

### Backlog Sprint 3

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-3.1 | Éliminer logique implicite dans `dorevia.sh` | 5 | P0 |
| US-3.2 | Normalisation hostnames DVIG/Vault (ajout ENV) | 3 | P0 |
| US-3.3 | Refactor commandes existantes (compatibilité) | 5 | P0 |

**Total Sprint 3** : 13 points

---

## 📦 Sprint 4 : Préflight & Apply (2 semaines)

### Objectif

Implémenter le préflight technique et la commande `apply` non interactive.

### User Stories

#### US-4.1 : Préflight technique minimal

**En tant que** exploitant  
**Je veux** vérifier les prérequis avec `dorevia.sh preflight <tenant> --env <env>`  
**Afin de** détecter les problèmes avant déploiement

**Critères d'acceptation** :
- [ ] Commande `dorevia.sh preflight <tenant> --env <env>` implémentée
- [ ] Vérifications :
  - Docker présent et accessible
  - Docker Compose présent
  - Ports 80/443 disponibles (si reverse proxy local)
  - Résolution DNS (optionnel Phase 1)
  - Accès registry (si pull requis)
- [ ] Non destructif (aucune modification système)
- [ ] Sortie lisible (liste OK/KO)
- [ ] Code retour (0 = OK, 1 = KO)
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Implémenter `cmd_preflight()` dans `dorevia.sh`
- [ ] Vérifications Docker/Compose
- [ ] Vérifications ports
- [ ] Vérifications DNS (optionnel)
- [ ] Vérifications registry
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-4.2 : Commande `apply` non interactive

**En tant que** exploitant  
**Je veux** déployer avec `dorevia.sh apply <tenant> --env <env>`  
**Afin de** exécuter le déploiement de manière déterministe

**Critères d'acceptation** :
- [ ] Commande `dorevia.sh apply <tenant> --env <env>` implémentée
- [ ] Lecture depuis `rendered/<env>/`
- [ ] Exécution `docker compose up -d` sur artefacts rendus
- [ ] Non interactive (pas de questions)
- [ ] Idempotente (relançable sans casser)
- [ ] Logs structurés
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Implémenter `cmd_apply()` dans `dorevia.sh`
- [ ] Lecture depuis `rendered/`
- [ ] Exécution docker compose
- [ ] Gestion erreurs
- [ ] Logs structurés
- [ ] Tests unitaires

**Estimation** : 5 points

---

#### US-4.3 : Journalisation standard

**En tant que** exploitant  
**Je veux** des logs structurés pour toutes les actions  
**Afin de** tracer les opérations et faciliter le debug

**Critères d'acceptation** :
- [ ] Logs structurés (format JSON ou texte structuré)
- [ ] Champs : tenant, env, unit, action, timestamp
- [ ] Niveaux : INFO, WARN, ERROR
- [ ] Sortie dans fichiers ou stdout
- [ ] Tests unitaires

**Tâches techniques** :
- [ ] Implémenter fonction `log_structured()`
- [ ] Intégrer dans toutes les commandes
- [ ] Format JSON ou texte structuré
- [ ] Tests unitaires

**Estimation** : 3 points

---

### Backlog Sprint 4

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-4.1 | Préflight technique minimal | 5 | P0 |
| US-4.2 | Commande `apply` non interactive | 5 | P0 |
| US-4.3 | Journalisation standard | 3 | P0 |

**Total Sprint 4** : 13 points

---

## 📦 Sprint 5 : Tests & Documentation (1 semaine)

### Objectif

Valider la Phase 1 avec les critères d'acceptation et documenter.

### User Stories

#### US-5.1 : Tests de conformité Scénario A (Lab — tenant "core")

**En tant que** développeur plateforme  
**Je veux** valider le scénario A sur le tenant "core" (tenant de référence) en Lab  
**Afin de** vérifier que la Phase 1 fonctionne correctement sur la baseline d'implémentation

**Critères d'acceptation** :
- [ ] `validate core` OK
- [ ] `render core --env lab` produit les artefacts attendus
- [ ] `apply core --env lab` démarre les units
- [ ] `odoo.lab.core.doreviateam.com` répond
- [ ] `dvig.lab.core.doreviateam.com` répond (health)
- [ ] `vault.lab.core.doreviateam.com` répond (health)
- [ ] Tests automatisés

**Tâches techniques** :
- [ ] Scripts de test Scénario A
- [ ] Tests automatisés
- [ ] Validation résultats

**Estimation** : 3 points

---

#### US-5.2 : Tests de conformité Scénario B (Stinger — tenant "core")

**En tant que** développeur plateforme  
**Je veux** valider le scénario B sur le tenant "core" (tenant de référence) en Stinger  
**Afin de** vérifier l'isolation des environnements sur la baseline d'implémentation

**Critères d'acceptation** :
- [ ] `render core --env stinger` produit un rendu distinct
- [ ] `apply core --env stinger` ne casse pas lab
- [ ] Hostnames stinger incluent `<env>` et sont cohérents
- [ ] Tests automatisés

**Tâches techniques** :
- [ ] Scripts de test Scénario B
- [ ] Tests automatisés
- [ ] Validation résultats

**Estimation** : 3 points

---

#### US-5.3 : Documentation Phase 1

**En tant que** exploitant  
**Je veux** une documentation complète de la Phase 1  
**Afin de** comprendre et utiliser les nouvelles fonctionnalités

**Critères d'acceptation** :
- [ ] Guide utilisation nouvelles commandes (`validate`, `render`, `preflight`, `apply`)
- [ ] Documentation breaking change hostnames
- [ ] Guide migration manifests
- [ ] Exemples d'utilisation
- [ ] FAQ

**Tâches techniques** :
- [ ] Rédiger guide utilisation
- [ ] Documenter breaking change
- [ ] Guide migration
- [ ] Exemples
- [ ] FAQ

**Estimation** : 3 points

---

### Backlog Sprint 5

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-5.1 | Tests de conformité Scénario A (Lab) | 3 | P0 |
| US-5.2 | Tests de conformité Scénario B (Stinger) | 3 | P0 |
| US-5.3 | Documentation Phase 1 | 3 | P0 |

**Total Sprint 5** : 9 points

---

## 📊 Backlog Global Phase 1

### Vue d'ensemble

| Sprint | Durée | Points | Objectif Principal |
|--------|-------|--------|-------------------|
| Sprint 0 | 1 semaine | 5 | Préparation (schéma, structure) |
| Sprint 1 | 2 semaines | 8 | Configuration déclarative |
| Sprint 2 | 2 semaines | 18 | Génération déterministe |
| Sprint 3 | 2 semaines | 13 | Refactor CLI |
| Sprint 4 | 2 semaines | 13 | Préflight & Apply |
| Sprint 5 | 1 semaine | 9 | Tests & Documentation |
| **Total** | **10 semaines** | **66 points** | |

### Backlog par Priorité

#### P0 — Must have (Phase 1)

Toutes les user stories listées ci-dessus sont **P0** (must have) pour la Phase 1.

#### P1 — Should have (Phase 1)

| ID | User Story | Points | Sprint |
|----|------------|--------|--------|
| US-P1.1 | Commande `status` : vérifier services up + health endpoints | 3 | Sprint 4 |
| US-P1.2 | Organisation des dossiers `rendered/` stable et documentée | 2 | Sprint 2 |

#### P2 — Nice to have (Phase 1)

| ID | User Story | Points | Sprint |
|----|------------|--------|--------|
| US-P2.1 | Détection "drift" (diff config vs rendered vs running) | 5 | Sprint 5 |
| US-P2.2 | Export "report" de rendu (résumé domaines, units, versions) | 3 | Sprint 5 |

---

## 🎯 Critères d'Acceptation Globaux

### Definition of Done (DoD) Phase 1

La Phase 1 est terminée si :

1. **Configuration déclarative unique** :
   - [ ] Tous les tenants ont un manifest enrichi Phase 1
   - [ ] Manifests validés avec schéma JSON Schema
   - [ ] Manifests versionnés (Git)

2. **Génération déterministe** :
   - [ ] Caddyfile généré depuis manifest
   - [ ] docker-compose.yml généré depuis manifest (platform + app)
   - [ ] Génération idempotente
   - [ ] Artefacts dans `rendered/<env>/`

3. **Exécution non interactive** :
   - [ ] Commande `apply` non interactive
   - [ ] Exécution déterministe
   - [ ] Idempotente

4. **Hostnames cohérents** :
   - [ ] Hostnames incluent `<env>` pour DVIG/Vault
   - [ ] Hostnames cohérents avec standard Phase 1
   - [ ] Breaking change documenté

5. **Préflight technique** :
   - [ ] Commande `preflight` fonctionnelle
   - [ ] Vérifications non destructives
   - [ ] Sortie lisible

6. **Tests de conformité** :
   - [ ] Scénario A validé (Lab)
   - [ ] Scénario B validé (Stinger)

7. **Documentation** :
   - [ ] Guide utilisation nouvelles commandes
   - [ ] Documentation breaking change
   - [ ] Guide migration

---

## 📅 Planning Détaillé

### Sprint 0 : Préparation (Semaine 1)

**Dates** : Semaine 1  
**Objectif** : Setup, schéma, validation

**User Stories** :
- US-0.1 : Schéma de configuration v1.0 (3 points)
- US-0.2 : Structure de projet Phase 1 (2 points)

**Livrables** :
- `schemas/manifest.schema.json`
- Structure projet documentée
- Validateur fonctionnel

---

### Sprint 1 : Configuration déclarative (Semaines 2-3)

**Dates** : Semaines 2-3  
**Objectif** : Enrichir manifests et valider

**User Stories** :
- US-1.1 : Enrichir manifest tenant "core" (2 points)
- US-1.2 : Migrer manifests autres tenants (3 points)
- US-1.3 : Commande `validate` fonctionnelle (3 points)

**Livrables** :
- Manifest `core` enrichi (tenant de référence — baseline)
- Manifests `dido` et `rozas` enrichis (basés sur `core`)
- Commande `validate` fonctionnelle
- Manifests validés

---

### Sprint 2 : Génération déterministe (Semaines 4-5)

**Dates** : Semaines 4-5  
**Objectif** : Moteur de rendu Caddyfile et docker-compose.yml

**User Stories** :
- US-2.1 : Moteur de rendu Caddyfile (5 points)
- US-2.2 : Moteur de rendu docker-compose.yml (platform) (5 points)
- US-2.3 : Moteur de rendu docker-compose.yml (app) (5 points)
- US-2.4 : Commande `render` fonctionnelle (3 points)

**Livrables** :
- Templates Caddyfile et docker-compose.yml
- Moteur de rendu fonctionnel
- Commande `render` fonctionnelle
- Artefacts générés dans `rendered/`

---

### Sprint 3 : Refactor CLI (Semaines 6-7)

**Dates** : Semaines 6-7  
**Objectif** : Éliminer logique implicite et normaliser hostnames

**User Stories** :
- US-3.1 : Éliminer logique implicite dans `dorevia.sh` (5 points)
- US-3.2 : Normalisation hostnames DVIG/Vault (ajout ENV) (3 points)
- US-3.3 : Refactor commandes existantes (compatibilité) (5 points)

**Livrables** :
- `dorevia.sh` refactoré (logique implicite éliminée)
- Hostnames normalisés (ENV pour DVIG/Vault)
- Commandes existantes compatibles
- Documentation breaking change

---

### Sprint 4 : Préflight & Apply (Semaines 8-9)

**Dates** : Semaines 8-9  
**Objectif** : Préflight technique et commande `apply`

**User Stories** :
- US-4.1 : Préflight technique minimal (5 points)
- US-4.2 : Commande `apply` non interactive (5 points)
- US-4.3 : Journalisation standard (3 points)

**Livrables** :
- Commande `preflight` fonctionnelle
- Commande `apply` fonctionnelle
- Journalisation structurée
- Tests unitaires

---

### Sprint 5 : Tests & Documentation (Semaine 10)

**Dates** : Semaine 10  
**Objectif** : Valider Phase 1 et documenter

**User Stories** :
- US-5.1 : Tests de conformité Scénario A (Lab) (3 points)
- US-5.2 : Tests de conformité Scénario B (Stinger) (3 points)
- US-5.3 : Documentation Phase 1 (3 points)

**Livrables** :
- Tests de conformité validés
- Documentation complète
- Guide migration
- Phase 1 terminée ✅

---

## 🚨 Risques & Mitigations

### Risque 1 : Refactor `dorevia.sh` trop large

**Probabilité** : Moyenne  
**Impact** : Élevé

**Mitigation** :
- Implémenter d'abord `validate` + `render`, puis `apply`
- Tests unitaires pour chaque commande
- Migration progressive (garder anciennes commandes temporairement)
- Code review à chaque étape

---

### Risque 2 : Divergence historique DVIG/Vault sans env

**Probabilité** : Élevée  
**Impact** : Moyen

**Mitigation** :
- Normaliser maintenant (Phase 1)
- Garder une compat "alias legacy" seulement si nécessaire (temporaire)
- Documentation breaking change
- Plan de migration DNS

---

### Risque 3 : Dépendance DNS (OVH) bloque les tests

**Probabilité** : Moyenne  
**Impact** : Faible

**Mitigation** :
- Tests d'abord via hosts/loopback et Caddy local
- DNS automatisé reporté
- Validation DNS optionnelle en Phase 1

---

### Risque 4 : Estimation sous-évaluée

**Probabilité** : Moyenne  
**Impact** : Élevé

**Mitigation** :
- Buffer de 20% sur estimations
- Revues de sprint régulières
- Ajustement backlog si nécessaire

---

## 📈 Métriques de Succès

### Métriques Techniques

- **Couverture tests** : ≥ 80%
- **Temps de génération** : < 5 secondes pour un tenant/env
- **Temps d'apply** : < 2 minutes pour un tenant/env
- **Taux d'erreur** : < 5% sur tests automatisés

### Métriques Fonctionnelles

- **Conformité manifests** : 100% des tenants validés
- **Génération idempotente** : 100% des cas testés
- **Hostnames cohérents** : 100% conformes standard Phase 1
- **Tests de conformité** : Scénarios A & B validés

---

## 🎬 Cérémonies Scrum

### Daily Standup (15 min)

**Quand** : Tous les jours à 9h00  
**Quoi** :
- Qu'ai-je fait hier ?
- Que vais-je faire aujourd'hui ?
- Y a-t-il des blocages ?

### Sprint Planning (2h)

**Quand** : Début de chaque sprint  
**Quoi** :
- Revue backlog
- Sélection user stories
- Estimation tâches
- Définition objectif sprint

### Sprint Review (1h)

**Quand** : Fin de chaque sprint  
**Quoi** :
- Démo fonctionnalités
- Feedback stakeholders
- Ajustements backlog

### Sprint Retrospective (1h)

**Quand** : Fin de chaque sprint  
**Quoi** :
- Ce qui a bien fonctionné
- Ce qui peut être amélioré
- Actions d'amélioration

---

## 📝 Notes d'Implémentation

### Tenant de Référence : "core"

Le tenant **`core`** est le tenant de référence interne Dorevia, utilisé comme **baseline d'implémentation et de test**. 

**Rôle du tenant `core`** :
- ✅ **Baseline d'implémentation** : Toutes les fonctionnalités Phase 1 sont d'abord implémentées sur `core`
- ✅ **Référence de test** : Tous les tests de conformité (Scénarios A & B) sont exécutés sur `core`
- ✅ **Exemple de référence** : Le manifest `core` enrichi sert de modèle pour les autres tenants
- ✅ **Validation continue** : `core` est utilisé pour valider chaque étape de la Phase 1

**Stratégie d'implémentation** :
1. Implémenter et valider sur `core` (tenant de référence)
2. Étendre aux autres tenants (`dido`, `rozas`) une fois validé sur `core`
3. Utiliser `core` comme référence pour les migrations et les tests

### Technologies Recommandées

- **Validation JSON Schema** : `ajv` (Node.js) ou `jsonschema` (Python) ou `jq` (Bash)
- **Templates** : `envsubst` (Bash) ou `jinja2` (Python) ou templates Go
- **Tests** : `bats` (Bash) ou `pytest` (Python) ou tests Go

### Structure de Code

```
/opt/dorevia-plateform/
├── bin/
│   └── dorevia.sh              # CLI principal (refactor)
├── lib/
│   ├── render/
│   │   ├── templates/          # Templates (Caddyfile, compose)
│   │   └── render.sh            # Moteur de rendu
│   └── preflight/
│       └── preflight.sh         # Préflight technique
├── schemas/
│   └── manifest.schema.json    # Schéma JSON Schema
└── tenants/
    └── <tenant>/
        ├── manifest.json        # Config déclarative
        └── rendered/            # Artefacts générés
            └── <env>/
                ├── caddy/
                ├── platform/
                └── <univers>/
```

---

## ✅ Checklist de Démarrage

Avant de commencer Sprint 0 :

- [ ] Équipe identifiée (dev plateforme, exploitation)
- [ ] Outils de développement configurés (Git, IDE, tests)
- [ ] Environnement de test disponible
- [ ] Backlog Phase 1 validé
- [ ] Planning approuvé
- [ ] Cérémonies Scrum planifiées

---

## 📚 Références

- **SPEC Phase 1** : `ZeDocs/V2/SPEC_Dorevia_Phase1_Fondations_v1.0.md`
- **SPEC de Référence** : `ZeDocs/SPEC_Dorevia_Reference_v2.0.md`
- **Analyse d'Impact** : `ZeDocs/V2/ANALYSE_IMPACT_PHASE1_FONDATIONS.md`

---

**Document généré le** : 2025-01-29  
**Version** : 1.0  
**Statut** : Prêt pour implémentation

