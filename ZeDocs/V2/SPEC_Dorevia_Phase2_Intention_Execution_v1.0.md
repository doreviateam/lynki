# 🎯 DOREVIA — SPEC d'implémentation Phase 2 "Intention/Exécution" (v1.0)

**Statut :** Spécification d'implémentation (phase prioritaire)  
**Dépendance :** `SPEC_Dorevia_Phase1_Fondations_v1.0.md` (Phase 1 complétée)  
**Audience :** Dev plateforme / Exploitation / AMOA technique  
**Objectif :** Séparer la capture d'intention de l'exécution, introduire un CLI interactif et automatiser l'agrégation gateway

---

## 0. Rappel du pourquoi (une phrase)

Phase 2 vise à **séparer l'intention humaine de l'exécution machine** : un CLI interactif capture les décisions opérateur dans une configuration déclarative, puis une exécution non interactive et déterministe matérialise cette configuration.

---

## 1. Portée de la Phase 2

### 1.1 Inclus (IN SCOPE)

1) **CLI interactif (prompt)** : Capture d'intention opérateur via questions structurées  
2) **Séparation intention/exécution** : Configuration déclarative générée avant exécution  
3) **Agrégation automatique gateway** : Génération et rechargement automatique du Caddyfile global  
4) **Processus de mise en production structuré** : 5 phases (Préconditions, Go/No-Go, Préflight, Config, Apply, Validation)  
5) **Journalisation intentions** : Traçabilité complète des décisions opérateur

### 1.2 Exclus (OUT OF SCOPE)

- Support complet des **domaines clients** (Phase 3)  
- Support **serveur client** (Phase 3)  
- Gestion avancée alias multi-services (Phase 3)  
- Audit bundle complet, backup/restore avancé (Phase 4)  
- Migration domain support `doreviateam.cmh-projects.fr` (hors sujet Phase 2)

---

## 2. Définition de "Fait" (Definition of Done)

La Phase 2 est considérée terminée si :

- un **CLI interactif** capture l'intention opérateur via questions structurées
- une **configuration déclarative** est générée depuis l'intention (séparée de l'exécution)
- l'**agrégation gateway** est automatique (Caddyfile global généré et rechargé)
- le **processus de mise en production** est structuré en 5 phases documentées
- les **intentions sont journalisées** (traçabilité complète)

---

## 3. Spécification — CLI Interactif (Prompt)

### 3.1 Rôle

Le CLI interactif (`dorevia.sh prompt`) est un **assistant d'intention** :
- pose des questions structurées
- **n'exécute aucun déploiement**
- génère une configuration déclarative
- journalise les intentions

### 3.2 Commande

```bash
dorevia.sh prompt <tenant> [--env <env>]
```

**Comportement** :
- Mode interactif (questions/confirmations)
- Génère configuration dans `tenants/<tenant>/state/intent-<timestamp>.json`
- Aucune action système (pas de déploiement)

### 3.3 Séquence de Questions (7 Étapes)

#### Étape 1 — Contexte

**Questions** :
1. Nom du tenant (pré-rempli si fourni en argument)
2. Environnement cible (`lab`, `stinger`, `prod`)
3. Double confirmation si `prod` (anti-erreur)

**Validation** :
- Tenant valide (slug DNS)
- Environnement dans whitelist (`lab|stinger|prod`)
- Confirmation explicite pour `prod`

#### Étape 2 — Univers (Fonctionnel)

**Question** : Pour chaque univers connu (`odoo`, etc.) :
- Activer en production ? (yes/no)

**Règle** :
- L'univers pilote les FQDN publics (`<univers>.<env>.<tenant>.<domaine>`)

#### Étape 3 — Mode de Production (SaaS vs Client)

**Question** : Choix du mode
- SaaS Dorevia (standard)
- Domaine et/ou serveur client

**Si client** :
- Nom de domaine client
- Type de DNS (CNAME / A / délégué)
- Hébergement (serveur Dorevia ou serveur client)
- Contraintes (ex: sous-domaines imposés)

#### Étape 4 — Nommage des Domaines (Affichage + Confirmation)

**Action** : Calcul et affichage des FQDN résultants

**Exemples (SaaS)** :
- `odoo.prod.<tenant>.doreviateam.com`
- `dvig.prod.<tenant>.doreviateam.com`
- `vault.prod.<tenant>.doreviateam.com`

**Exemples (Client)** :
- `odoo.prod.<tenant>.<domain_client>`
- `dvig.prod.<tenant>.<domain_client>`
- `vault.prod.<tenant>.<domain_client>`

**Confirmation** : Requise explicitement

#### Étape 5 — Alias (Optionnel)

**Question** : Ajouter des alias ? (oui/non)

**Si oui** :
- Saisie des alias par service (odoo/dvig/vault) ou global
- Validation format

**Règle** :
- Un alias implique reverse-proxy multi-host et certificats associés

#### Étape 6 — Préflight & Installation Contrôlée

**Questions** :
1. Lancer un préflight production ? (recommandé)
2. Autoriser l'installation contrôlée des pré-requis manquants ? (oui/non)

#### Étape 7 — Résumé Final (Écran de Vérité)

**Affichage** :
- Tenant
- Environnement
- Univers activés
- Domaines (canonique)
- Alias
- Mode de production
- Options préflight / install

**Question finale** :
> Confirmer la génération de la configuration ? (yes/no)

### 3.4 Sorties

**Fichier de configuration déclarative** :
- `tenants/<tenant>/state/intent-<timestamp>.json`
- Lisible et versionnable
- Aucune action système
- Support d'audit et de relecture à froid

**Journal d'intention** :
- `tenants/<tenant>/state/intent-<timestamp>.log`
- Format structuré (timestamp|step|question|answer)

---

## 4. Spécification — Séparation Intention/Exécution

### 4.1 Principe

**Intention** (humaine) :
- Capturée via CLI prompt
- Stockée dans configuration déclarative
- Versionnée (Git) avant exécution
- Relue (au moins 1 relecture opérateur)

**Exécution** (machine) :
- Non interactive
- Déterministe
- Reproductible
- Auditable

### 4.2 Workflow

```
1. prompt <tenant> [--env <env>]  → Génère intent-<timestamp>.json
2. validate <tenant>              → Valide intent (optionnel)
3. render <tenant> --env <env>    → Génère artefacts depuis intent
4. preflight <tenant> --env <env>  → Vérifie prérequis
5. apply <tenant> --env <env>      → Exécute déploiement
```

### 4.3 Format Configuration Intention

**Structure minimale** :
```json
{
  "version": "2.0",
  "tenant_id": "core",
  "environment": "prod",
  "created_at": "2025-01-29T12:00:00Z",
  "created_by": "operator@doreviateam.com",
  "intention": {
    "universes": ["odoo"],
    "mode": "saas",
    "domains": {
      "canonical": "doreviateam.com",
      "aliases": []
    },
    "preflight": {
      "enabled": true,
      "install_controlled": false
    }
  }
}
```

---

## 5. Spécification — Agrégation Automatique Gateway

### 5.1 Objectif

Automatiser la génération et le rechargement du Caddyfile global depuis les Caddyfiles générés par tenant/environnement.

### 5.2 Commande

```bash
dorevia.sh gateway aggregate [--reload]
```

**Comportement** :
1. Collecte tous les Caddyfiles dans `tenants/*/rendered/*/caddy/Caddyfile`
2. Agrège dans `units/gateway/Caddyfile`
3. Valide syntaxe Caddy
4. Recharge Caddy si `--reload` fourni

### 5.3 Format Agrégation

**Structure Caddyfile global** :
```caddy
{
  email admin@doreviateam.com
}

# Tenant: core - Environment: lab
odoo.lab.core.doreviateam.com {
  reverse_proxy odoo_lab_core:8069
}

dvig.lab.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}

vault.lab.core.doreviateam.com {
  reverse_proxy vault-core:8080
}

# Tenant: core - Environment: stinger
odoo.stinger.core.doreviateam.com {
  reverse_proxy odoo_stinger_core:8069
}

# ... (autres tenants/environnements)
```

### 5.4 Intégration dans Workflow

**Automatique** :
- Après `apply` : agrégation automatique si `--auto-gateway` fourni
- Commande dédiée : `gateway aggregate` pour contrôle manuel

**Manuel** :
- `gateway aggregate` : agrégation sans rechargement
- `gateway aggregate --reload` : agrégation + rechargement

---

## 6. Spécification — Processus de Mise en Production

### 6.1 Vue d'Ensemble

Processus structuré en **5 phases** :

1. **Phase 0 — Préconditions** : Validation préalable
2. **Phase 1 — Go/No-Go** : Décision humaine documentée
3. **Phase 2 — Préflight Production** : Vérifications automatisées
4. **Phase 3 — Génération Configuration** : Création artefact de vérité
5. **Phase 4 — Apply Prod** : Exécution non interactive
6. **Phase 5 — Validation Post-Prod** : Acceptation technique

### 6.2 Phase 0 — Préconditions

**Vérifications** :
- Tenant existe
- Environnement `stinger` opérationnel
- Tests end-to-end stinger validés
- Mode de production connu

**Action** : Aucune action technique, validation uniquement

### 6.3 Phase 1 — Go/No-Go

**Validation explicite** :
- Validation fonctionnelle (stinger OK)
- Validation technique (conforme SPEC)
- Validation contractuelle (mode prod + domaines + alias)

**Sortie** : Compte-rendu (qui, quand, sur quelle base)

### 6.4 Phase 2 — Préflight Production

**Vérifications automatisées** :
- Accès serveur cible (SSH / droits)
- Pré-requis système (Docker / Compose)
- Accès réseau (ports, registry)
- DNS (résolution attendue)
- Accès aux secrets requis

**Résultat** :
- ✅ OK → passage phase suivante
- ❌ KO → rapport lisible, aucune modification, arrêt

### 6.5 Phase 3 — Génération Configuration

**Action** : Génération configuration déclarative depuis intention

**Sortie** :
- Fichier de configuration déclaratif unique
- Versionné (Git) avant exécution
- Relu (au moins 1 relecture opérateur)

### 6.6 Phase 4 — Apply Prod

**Exécution** :
- Lecture unique de la configuration
- Création réseaux et volumes
- Déploiement des units
- Exposition reverse-proxy
- Healthchecks

**Propriétés** :
- Non interactive
- Déterministe
- Reproductible

### 6.7 Phase 5 — Validation Post-Prod

**Contrôles** :
- URLs accessibles (canonique + alias)
- Univers fonctionnels
- Services cœur (DVIG / Vault) joignables
- Rapport de mise en production

**Optionnel** :
- Smoke tests automatisés
- Export "bundle d'audit"

---

## 7. Spécification — Journalisation Intentions

### 7.1 Objectif

Traçabilité complète des décisions opérateur pour auditabilité.

### 7.2 Format

**Fichier journal** : `tenants/<tenant>/state/intent-<timestamp>.log`

**Format structuré** :
```
timestamp|step|question|answer|operator
```

**Exemple** :
```
2025-01-29T12:00:00Z|1|tenant|core|operator@doreviateam.com
2025-01-29T12:00:01Z|1|environment|prod|operator@doreviateam.com
2025-01-29T12:00:02Z|2|universe_odoo|yes|operator@doreviateam.com
2025-01-29T12:00:03Z|3|mode|saas|operator@doreviateam.com
2025-01-29T12:00:04Z|7|confirm|yes|operator@doreviateam.com
```

### 7.3 Intégration

**Automatique** :
- Toutes les questions/réponses journalisées
- Timestamp pour chaque interaction
- Identification opérateur (si disponible)

**Audit** :
- Relecture à froid possible
- Traçabilité complète
- Support d'audit externe

---

## 8. Backlog Technique Phase 2 (Priorisé)

### P0 — Must have

1. **CLI prompt interactif** : 7 étapes de questions structurées
2. **Génération configuration intention** : Format JSON déclaratif
3. **Agrégation automatique gateway** : Collecte + agrégation + rechargement
4. **Processus de mise en production** : 5 phases documentées et automatisées
5. **Journalisation intentions** : Traçabilité complète

### P1 — Should have

6. **Validation configuration intention** : Schéma JSON Schema
7. **Mode apply depuis intention** : Lecture intent-*.json au lieu de manifest.json
8. **Rapport de mise en production** : Bundle d'audit

### P2 — Nice to have

9. **Smoke tests automatisés** : Liste fixe de vérifications
10. **Export bundle d'audit** : Archive config + logs + versions

---

## 9. Critères d'Acceptation Phase 2

### Scénario A — Mise en Production Lab

**Tests** :
- [ ] `prompt core --env lab` : Questions structurées, génération intent
- [ ] `render core --env lab` : Génération depuis intent
- [ ] `gateway aggregate --reload` : Agrégation + rechargement automatique
- [ ] `apply core --env lab` : Déploiement depuis intent
- [ ] Journal intention : Traçabilité complète

### Scénario B — Mise en Production Stinger

**Tests** :
- [ ] `prompt core --env stinger` : Questions structurées
- [ ] Processus 5 phases : Validation complète
- [ ] Isolation lab/stinger : Garantie
- [ ] Journalisation : Traçabilité complète

---

## 10. Dépendances Phase 1

La Phase 2 **nécessite** que la Phase 1 soit complétée :

- ✅ Configuration déclarative (manifest.json)
- ✅ Génération déterministe (render)
- ✅ Préflight technique (preflight)
- ✅ Exécution non interactive (apply)
- ✅ Hostnames normalisés (avec `<env>`)

---

## 11. Notes d'Implémentation

### 11.1 Bibliothèque CLI Interactive

**Recommandation** : Utiliser une bibliothèque pour le prompt interactif

**Options** :
- Python : `inquirer` ou `prompt_toolkit`
- Node.js : `inquirer`
- Bash : `whiptail` ou `dialog` (basique)

**Critères** :
- Support questions structurées
- Validation en temps réel
- Formatage sortie lisible

### 11.2 Format Configuration Intention

**Structure recommandée** :
- JSON (lisible, versionnable)
- Schéma JSON Schema pour validation
- Compatible avec manifest.json (Phase 1)

### 11.3 Agrégation Gateway

**Algorithme** :
1. Parcourir `tenants/*/rendered/*/caddy/Caddyfile`
2. Collecter tous les blocs
3. Dédupliquer (même hostname)
4. Valider syntaxe Caddy
5. Écrire dans `units/gateway/Caddyfile`
6. Recharger Caddy si demandé

---

## 12. Conclusion

La Phase 2 introduit la **séparation intention/exécution** et l'**automatisation gateway**, rendant la plateforme plus maîtrisée et auditable.

**Principales innovations** :
- CLI interactif pour capture d'intention
- Configuration déclarative générée depuis intention
- Agrégation automatique gateway
- Processus de mise en production structuré
- Journalisation complète des intentions

**Prochaine étape** : Plan d'implémentation Phase 2 (mode Scrum)

---

**Dernière mise à jour** : 2025-01-29  
**Version** : 1.0  
**Statut** : Spécification d'implémentation

