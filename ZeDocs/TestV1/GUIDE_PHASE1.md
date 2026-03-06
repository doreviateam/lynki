# 📘 Guide Phase 1 "Fondations" — Dorevia Platform

**Version** : 1.0  
**Date** : 2025-01-29  
**Phase** : Phase 1 "Fondations"  
**Audience** : Exploitants, développeurs plateforme

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Nouvelles commandes Phase 1](#nouvelles-commandes-phase-1)
3. [Guide d'utilisation](#guide-dutilisation)
4. [Breaking Change : Hostnames DVIG/Vault](#breaking-change-hostnames-dvigvault)
5. [Guide de migration](#guide-de-migration)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [FAQ](#faq)
8. [Références](#références)

---

## Vue d'ensemble

La Phase 1 "Fondations" introduit une **configuration déclarative** et une **génération déterministe** des artefacts de déploiement. L'objectif est de garantir :

- ✅ **Configuration unique** : Un seul fichier `manifest.json` par tenant
- ✅ **Génération déterministe** : Tous les artefacts générés depuis le manifest
- ✅ **Exécution non interactive** : Déploiement automatisable et reproductible
- ✅ **Hostnames cohérents** : Normalisation avec inclusion de l'environnement (`<env>`)
- ✅ **Préflight technique** : Vérifications avant déploiement

### Workflow Phase 1

```
1. validate <tenant>          → Valide le manifest
2. render <tenant> --env <env> → Génère les artefacts
3. preflight <tenant> --env <env> → Vérifie les prérequis
4. apply <tenant> --env <env> → Déploie les services
```

---

## Nouvelles commandes Phase 1

### `validate <tenant>`

**Description** : Valide le manifest d'un tenant contre le schéma JSON Schema.

**Usage** :
```bash
dorevia.sh validate <tenant>
```

**Exemple** :
```bash
dorevia.sh validate core
```

**Sortie** :
- ✅ Succès : `✅ Manifest core valide (Phase 1)`
- ❌ Échec : Message d'erreur détaillé

**Critères de validation** :
- Structure JSON valide
- Champs obligatoires présents
- Valeurs conformes aux enums (environments, universes, etc.)
- Format tenant_id (slug DNS)

---

### `render <tenant> --env <env>`

**Description** : Génère tous les artefacts de déploiement depuis le manifest pour un environnement donné.

**Usage** :
```bash
dorevia.sh render <tenant> --env <env>
```

**Exemple** :
```bash
dorevia.sh render core --env lab
```

**Artefacts générés** :
- `tenants/<tenant>/rendered/<env>/caddy/Caddyfile`
- `tenants/<tenant>/rendered/<env>/platform/docker-compose.yml`
- `tenants/<tenant>/rendered/<env>/<univers>/docker-compose.yml` (pour chaque univers)

**Propriétés** :
- **Idempotent** : Relançable sans effet de bord (mêmes inputs → mêmes outputs)
- **Déterministe** : Génération reproductible

**Exemple de sortie** :
```
🎨 Génération des artefacts pour tenant: core, env: lab
📝 Génération Caddyfile...
✅ Caddyfile généré
📝 Génération docker-compose.yml platform...
✅ docker-compose.yml platform généré
📝 Génération docker-compose.yml app (odoo)...
✅ docker-compose.yml app (odoo) généré
✅ Génération terminée pour tenant: core, env: lab
📁 Fichiers générés dans: tenants/core/rendered/lab/
```

---

### `preflight <tenant> --env <env>`

**Description** : Vérifie les prérequis techniques avant déploiement (non destructif).

**Usage** :
```bash
dorevia.sh preflight <tenant> --env <env>
```

**Exemple** :
```bash
dorevia.sh preflight core --env lab
```

**Vérifications effectuées** :
- ✅ Manifest présent et valide
- ✅ `jq` installé
- ✅ Environnement activé dans le manifest
- ✅ Docker installé et accessible
- ✅ Docker Compose installé
- ✅ Ports 80/443 disponibles (avertissements si utilisés)
- ✅ Réseau Docker `dorevia-network` existant
- ✅ Fichiers rendered présents
- ✅ Résolution DNS (optionnel, avertissement si échec)
- ✅ Accès registry Docker (Docker Hub)

**Sortie** :
```
🔍 Préflight technique pour tenant: core, env: lab

📋 Vérification manifest...
✅ Manifest présent
✅ jq installé
✅ Environnement activé

🐳 Vérification Docker...
✅ Docker installé
✅ Docker accessible

📊 Résumé préflight:
  ✅ Vérifications OK: 11
  ⚠️  Avertissements: 2
  ❌ Erreurs: 0

✅ Préflight réussi
```

**Codes de retour** :
- `0` : Préflight réussi (avec ou sans avertissements)
- `1` : Préflight échoué (erreurs critiques)

---

### `apply <tenant> --env <env>`

**Description** : Déploie les services depuis les fichiers générés (non interactif).

**Usage** :
```bash
dorevia.sh apply <tenant> --env <env>
```

**Exemple** :
```bash
dorevia.sh apply core --env lab
```

**Prérequis** :
- Manifest validé (`validate`)
- Artefacts générés (`render`)
- Préflight réussi (`preflight`)

**Actions effectuées** :
1. Déploiement platform (DVIG, Vault, Postgres)
2. Déploiement apps (Odoo pour chaque univers)
3. Note sur Caddyfile (agrégation manuelle requise en Phase 1)

**Propriétés** :
- **Non interactif** : Aucune question posée
- **Idempotent** : Relançable sans casser l'état
- **Déterministe** : Exécution reproductible

**Exemple de sortie** :
```
🚀 Déploiement Phase 1 pour tenant: core, env: lab

📦 Déploiement platform...
✅ Platform déployée

📦 Déploiement app (odoo)...
✅ App (odoo) déployée

📝 Note: Caddyfile généré dans tenants/core/rendered/lab/caddy/Caddyfile
   Pour activer: copier/agréger dans units/gateway/Caddyfile et recharger
   (Agrégation automatique prévue Phase 2)

✅ Déploiement terminé pour tenant: core, env: lab
💡 Vérifier le statut: dorevia.sh platform status core
💡 Vérifier les apps: dorevia.sh app status <univers> lab core
```

---

## Guide d'utilisation

### Workflow complet (Lab)

```bash
# 1. Valider le manifest
dorevia.sh validate core

# 2. Générer les artefacts
dorevia.sh render core --env lab

# 3. Vérifier les prérequis
dorevia.sh preflight core --env lab

# 4. Déployer
dorevia.sh apply core --env lab
```

### Workflow multi-environnements

```bash
# Lab
dorevia.sh render core --env lab
dorevia.sh preflight core --env lab
dorevia.sh apply core --env lab

# Stinger
dorevia.sh render core --env stinger
dorevia.sh preflight core --env stinger
dorevia.sh apply core --env stinger

# Prod (quand activé)
dorevia.sh render core --env prod
dorevia.sh preflight core --env prod
dorevia.sh apply core --env prod
```

### Journalisation

Pour activer la journalisation dans un fichier :

```bash
export DOREVIA_LOG_FILE=/var/log/dorevia/dorevia.log
dorevia.sh render core --env lab
dorevia.sh apply core --env lab
```

Les logs sont au format structuré :
```
timestamp|level|tenant|env|unit|action|message
```

Exemple :
```
2025-12-31T15:04:26Z|INFO|core|lab|render|platform|docker-compose.yml platform généré
```

Voir `lib/logging/README.md` pour plus de détails.

---

## Breaking Change : Hostnames DVIG/Vault

### ⚠️ Changement obligatoire

Les hostnames DVIG et Vault incluent maintenant **l'environnement** (`<env>`) pour respecter le standard Phase 1.

**Avant (non conforme)** :
```
dvig.core.doreviateam.com
vault.core.doreviateam.com
```

**Après (conforme Phase 1)** :
```
dvig.lab.core.doreviateam.com
dvig.stinger.core.doreviateam.com
dvig.prod.core.doreviateam.com

vault.lab.core.doreviateam.com
vault.stinger.core.doreviateam.com
vault.prod.core.doreviateam.com
```

### Impact

1. **Caddyfile** : Généré automatiquement avec les nouveaux hostnames
2. **DNS** : Créer les nouveaux enregistrements DNS pour chaque environnement
3. **URLs** : Mettre à jour toutes les intégrations/clients qui utilisent les anciens hostnames

### Plan de migration

Voir le document détaillé : `ZeDocs/V2/BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md`

**Résumé** :
1. Générer nouveaux Caddyfiles : `dorevia.sh render <tenant> --env <env>`
2. Créer enregistrements DNS pour chaque environnement
3. Agréger Caddyfiles dans `units/gateway/Caddyfile`
4. Recharger Caddy : `dorevia.sh gateway reload`
5. Vérifier les nouvelles URLs
6. Supprimer anciens enregistrements DNS (après validation)

---

## Guide de migration

### Migration d'un tenant existant vers Phase 1

#### Étape 1 : Créer le manifest

Créer `tenants/<tenant>/state/manifest.json` basé sur le manifest de référence `core` :

```bash
# Copier le manifest de référence
cp tenants/core/state/manifest.json tenants/<tenant>/state/manifest.json

# Éditer et adapter
vi tenants/<tenant>/state/manifest.json
```

**Champs à adapter** :
- `tenant_id` : Identifiant du tenant (slug DNS)
- `universes` : Univers activés (ex: `["odoo"]`)
- `environments` : Environnements activés (ex: `["lab", "stinger"]`)
- `images` : Versions d'images Docker

#### Étape 2 : Valider le manifest

```bash
dorevia.sh validate <tenant>
```

#### Étape 3 : Générer les artefacts

```bash
# Pour chaque environnement
dorevia.sh render <tenant> --env lab
dorevia.sh render <tenant> --env stinger
# etc.
```

#### Étape 4 : Vérifier les prérequis

```bash
dorevia.sh preflight <tenant> --env lab
```

#### Étape 5 : Déployer

```bash
dorevia.sh apply <tenant> --env lab
```

#### Étape 6 : Mettre à jour DNS

Créer les enregistrements DNS pour les nouveaux hostnames (voir [Breaking Change](#breaking-change-hostnames-dvigvault)).

#### Étape 7 : Agréger Caddyfile

Copier/agréger les Caddyfiles générés dans `units/gateway/Caddyfile` et recharger :

```bash
dorevia.sh gateway reload
```

### Migration depuis ancien workflow

Si vous utilisiez l'ancien workflow (templates manuels) :

1. **Créer le manifest** : Extraire la configuration depuis les templates existants
2. **Valider** : `dorevia.sh validate <tenant>`
3. **Générer** : `dorevia.sh render <tenant> --env <env>`
4. **Vérifier** : Comparer les fichiers générés avec les templates existants
5. **Migrer progressivement** : Commencer par `lab`, puis `stinger`, puis `prod`

---

## Exemples d'utilisation

### Exemple 1 : Déploiement Lab complet

```bash
# Tenant: core
# Environnement: lab

# 1. Validation
dorevia.sh validate core

# 2. Génération
dorevia.sh render core --env lab

# 3. Préflight
dorevia.sh preflight core --env lab

# 4. Déploiement
dorevia.sh apply core --env lab

# 5. Vérification
dorevia.sh platform status core
dorevia.sh app status odoo lab core
```

### Exemple 2 : Déploiement multi-environnements

```bash
# Déployer Lab et Stinger pour le tenant core

# Lab
dorevia.sh render core --env lab
dorevia.sh preflight core --env lab
dorevia.sh apply core --env lab

# Stinger (isolation garantie)
dorevia.sh render core --env stinger
dorevia.sh preflight core --env stinger
dorevia.sh apply core --env stinger

# Vérifier coexistence
docker ps | grep odoo
# Devrait afficher : odoo_lab_core et odoo_stinger_core
```

### Exemple 3 : Régénération après modification manifest

```bash
# Modifier le manifest
vi tenants/core/state/manifest.json

# Valider
dorevia.sh validate core

# Régénérer (idempotent)
dorevia.sh render core --env lab

# Redéployer (idempotent)
dorevia.sh apply core --env lab
```

### Exemple 4 : Journalisation complète

```bash
# Activer logs
export DOREVIA_LOG_FILE=/var/log/dorevia/deploy.log

# Workflow complet
dorevia.sh validate core
dorevia.sh render core --env lab
dorevia.sh preflight core --env lab
dorevia.sh apply core --env lab

# Consulter les logs
tail -f /var/log/dorevia/deploy.log
```

---

## FAQ

### Q1 : Dois-je utiliser `render` avant chaque `apply` ?

**R** : Oui, `render` doit être exécuté avant `apply` pour générer les artefacts. `apply` lit depuis `rendered/<env>/`.

### Q2 : Que se passe-t-il si je relance `render` plusieurs fois ?

**R** : `render` est **idempotent** : relançable sans effet de bord. Les fichiers sont régénérés de manière identique.

### Q3 : Que se passe-t-il si je relance `apply` plusieurs fois ?

**R** : `apply` est **idempotent** : relançable sans casser l'état. Docker Compose gère l'idempotence.

### Q4 : Puis-je utiliser les anciennes commandes (`platform up`, `app up`) ?

**R** : Oui, les commandes existantes restent compatibles. Elles utilisent automatiquement les fichiers `rendered/` s'ils existent, sinon elles utilisent les templates (fallback).

### Q5 : Comment activer le Caddyfile généré ?

**R** : En Phase 1, l'agrégation est **manuelle** :
1. Copier/agréger les Caddyfiles générés dans `units/gateway/Caddyfile`
2. Recharger : `dorevia.sh gateway reload`

L'agrégation automatique est prévue en Phase 2.

### Q6 : Les hostnames DVIG/Vault doivent-ils inclure `<env>` ?

**R** : Oui, c'est **obligatoire** en Phase 1. Voir [Breaking Change](#breaking-change-hostnames-dvigvault).

### Q7 : Comment migrer un tenant existant ?

**R** : Voir [Guide de migration](#guide-de-migration).

### Q8 : Que faire si `preflight` échoue ?

**R** : Corriger les erreurs signalées :
- Installer les dépendances manquantes (Docker, Docker Compose, jq)
- Créer le réseau Docker : `docker network create dorevia-network`
- Générer les artefacts : `dorevia.sh render <tenant> --env <env>`

### Q9 : Les tests automatisés sont-ils disponibles ?

**R** : Oui, des scripts de test sont disponibles :
- `tests/scenario_a_lab_core.sh` : Tests Scénario A (Lab)
- `tests/scenario_b_stinger_core.sh` : Tests Scénario B (Stinger)

### Q10 : Comment activer la journalisation ?

**R** : Définir `DOREVIA_LOG_FILE` :
```bash
export DOREVIA_LOG_FILE=/var/log/dorevia/dorevia.log
```

Voir `lib/logging/README.md` pour plus de détails.

---

## Références

### Documents Phase 1

- **SPEC Phase 1** : `ZeDocs/V2/SPEC_Dorevia_Phase1_Fondations_v1.0.md`
- **Plan d'implémentation** : `ZeDocs/V2/PLAN_IMPLEMENTATION_PHASE1_SCRUM.md`
- **État d'implémentation** : `ZeDocs/V2/ETAT_IMPLEMENTATION_PHASE1_SCRUM.md`
- **Breaking Change** : `ZeDocs/V2/BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md`
- **Analyse d'impact** : `ZeDocs/V2/ANALYSE_IMPACT_PHASE1_FONDATIONS.md`

### Schémas et validation

- **Schéma JSON Schema** : `schemas/manifest.schema.json`
- **Documentation schéma** : `schemas/README.md`
- **Validateur** : `lib/validate.sh`

### Journalisation

- **Documentation logging** : `lib/logging/README.md`

### Tests

- **Tests Scénario A** : `tests/scenario_a_lab_core.sh`
- **Tests Scénario B** : `tests/scenario_b_stinger_core.sh`

---

**Dernière mise à jour** : 2025-01-29  
**Version** : 1.0

