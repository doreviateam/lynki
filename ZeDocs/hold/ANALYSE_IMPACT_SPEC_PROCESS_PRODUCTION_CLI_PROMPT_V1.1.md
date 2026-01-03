# 🔍 Analyse d'Impact — SPEC Process de Mise en Production & CLI Prompt v1.1

**Version** : 1.0  
**Date** : 2025-01-29  
**SPEC Analysée** : DOREVIA — SPEC Process de Mise en Production & CLI Prompt v1.1  
**Statut** : Analyse complète — Rapport pour implémentation

---

## 📋 Résumé Exécutif

### Verdict Global

La spécification "Process de Mise en Production & CLI Prompt v1.1" introduit un **processus structuré** et un **CLI interactif** pour la capture d'intention. Elle est **alignée avec la SPEC v1.3** (séparation intention/exécution) mais **plus avancée** que la SPEC v1.1 (server-driven PROD).

**Niveau d'impact** : 🔴 **CRITIQUE** — Refonte majeure du processus de mise en production requise

### Écarts Critiques Identifiés

| Concept SPEC | État Actuel | SPEC v1.1 | Conformité | Impact |
|--------------|-------------|-----------|------------|--------|
| **Processus structuré (5 phases)** | Déploiement direct | Workflow documenté | ❌ **NON CONFORME** | 🔴 Critique |
| **CLI prompt interactif** | CLI non interactive | CLI non interactive | ❌ **NON CONFORME** | 🔴 Critique |
| **Séparation intention/exécution** | Exécution directe | Pas de séparation | ❌ **NON CONFORME** | 🔴 Critique |
| **Préflight automatisé** | Vérifications manuelles | Documentation | ❌ **NON CONFORME** | 🟡 Important |
| **Configuration déclarative** | Templates partiels | Manifest minimal | ⚠️ **PARTIELLE** | 🟡 Important |
| **Auditabilité complète** | Partielle | Partielle | ⚠️ **PARTIELLE** | 🟡 Important |

---

## 1. Analyse Positionnement du Document

### 1.1 Spécification

> Ce document est une **EXTENSION** de la spécification socle :  
> **`SPEC_Dorevia_Architecture_Deploiement_v1.3.md`**  
> Il **ne remplace pas** la SPEC socle et **n'en modifie aucun invariant**.

### 1.2 État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Problème identifié** :
- La SPEC v1.3 (architecture) n'est **pas encore implémentée**
- L'implémentation actuelle suit plutôt la SPEC v1.1 (server-driven, pragmatique)
- Cette SPEC "Process Production" suppose la SPEC v1.3 comme base

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Clarifier dépendances** :
   - Cette SPEC nécessite-t-elle la SPEC v1.3 complète ?
   - Ou peut-elle être adaptée à l'implémentation actuelle (v1.1) ?
2. **Décision** : Implémenter cette SPEC en supposant v1.3, ou adapter pour v1.1 ?

---

## 2. Analyse Processus de Mise en Production (5 Phases)

### 2.1 Phase 0 — Préconditions

#### Spécification

> Avant toute mise en production :
> - le tenant existe
> - l'environnement `stinger` est **opérationnel**
> - les tests end-to-end stinger sont **validés**
> - le mode de production est connu

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ✅ Tenant existe (structure créée)
- ✅ STINGER opérationnel (déployable)
- ❌ Tests end-to-end stinger : pas de processus structuré
- ❌ Mode production : pas de décision documentée

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Documenter préconditions** :
   - Checklist préconditions PROD
   - Validation STINGER opérationnel
2. **Processus tests** :
   - Documenter tests end-to-end STINGER
   - Validation fonctionnelle structurée

---

### 2.2 Phase 1 — Décision de Mise en Production (Go/No-Go)

#### Spécification

> Validation explicite (Go/No-Go) :
> - validation fonctionnelle (stinger OK)
> - validation technique (conforme SPEC v1.3)
> - validation contractuelle (mode prod + domaines + alias)
> 
> Sortie attendue : un **compte-rendu** (même bref) indiquant :
> - qui décide
> - quand
> - sur quelle base (références tests / checks)

#### État Actuel

**Conformité** : ❌ **NON CONFORME** — Non structuré

**Implémentation actuelle** :
- Pas de processus Go/No-Go documenté
- Pas de compte-rendu de décision
- Pas de traçabilité décision

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Documenter processus Go/No-Go** :
   - Template compte-rendu
   - Checklist validation (fonctionnelle, technique, contractuelle)
2. **Traçabilité** :
   - Stocker décision dans `manifest.json` ou fichier dédié
   - Timestamp, décideur, références

---

### 2.3 Phase 2 — Préflight Production (automatisée)

#### Spécification

> Vérifications :
> - accès serveur cible (SSH / droits)
> - pré-requis système (Docker / Compose)
> - accès réseau (ports, registry)
> - DNS (résolution attendue selon le mode)
> - accès aux secrets requis
> 
> Résultat :
> - ✅ OK → passage phase suivante
> - ❌ KO → rapport lisible, **aucune modification**, arrêt

#### État Actuel

**Conformité** : ❌ **NON CONFORME** — Vérifications manuelles

**Implémentation actuelle** :
- `dorevia.sh doctor` : Vérifie Docker/Compose (basique)
- Pas de préflight automatisé production
- Pas de vérification serveur cible
- Pas de vérification DNS automatisée

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Implémenter préflight production** :
   ```bash
   dorevia.sh preflight prod <tenant> [--server <server>]
   ```
2. **Vérifications** :
   - Accès SSH serveur cible (si client)
   - Docker/Compose installés
   - Ports 22/80/443 ouverts
   - DNS propagé (validation résolution)
   - Secrets accessibles
3. **Rapport** :
   - Liste des vérifications OK/KO
   - Détails pour chaque échec
   - Aucune modification système

---

### 2.4 Phase 3 — Génération Configuration Production

#### Spécification

> À partir de l'intention opérateur :
> - environnement = `prod`
> - univers activés explicitement
> - domaines calculés (standard SaaS OU extension client)
> - alias déclarés (si requis)
> - units activées explicitement
> 
> Sortie attendue :
> - un fichier de configuration déclaratif **unique**
> - versionné (Git) avant exécution
> - relu (au moins 1 relecture opérateur)

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- Génération depuis templates (partielle)
- Pas de configuration déclarative complète
- Pas de versionnement avant exécution
- Pas de relecture structurée

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **Génération configuration déclarative** :
   - Fichier unique (ex: `tenants/<tenant>/state/prod-config.json`)
   - Contient : univers, domaines, alias, units, serveur
2. **Versionnement** :
   - Commit Git avant exécution
   - Tag ou référence version
3. **Relecture** :
   - Affichage configuration générée
   - Confirmation opérateur avant exécution

---

### 2.5 Phase 4 — Apply Prod (exécution non interactive)

#### Spécification

> Exécution non interactive :
> - lecture unique de la configuration
> - création réseaux et volumes
> - déploiement des units
> - exposition reverse-proxy (multi-host si alias)
> - healthchecks
> 
> Aucune question humaine n'est posée.  
> Toute erreur doit produire un log exploitable.

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- Exécution directe (`docker compose up -d`)
- Non interactive (✅)
- Logs Docker (⚠️ partiels)
- Pas de lecture configuration déclarative unique

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Commande apply** :
   ```bash
   dorevia.sh apply prod <tenant> [--config <config-file>]
   ```
2. **Processus** :
   - Lire configuration déclarative
   - Exécuter déploiement (non interactif)
   - Logs structurés
   - Rapport d'exécution

---

### 2.6 Phase 5 — Validation Post-Prod

#### Spécification

> Contrôles :
> - URLs accessibles (canonique + alias si présents)
> - univers fonctionnels
> - services cœur (DVIG / Vault) joignables
> - génération d'un rapport de mise en production
> 
> Optionnel :
> - smoke tests automatisés (liste fixe)
> - export d'un "bundle d'audit" (logs + config + versions)

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- Vérifications manuelles (URLs, healthchecks)
- Pas de rapport structuré
- Pas de smoke tests automatisés
- Pas de bundle d'audit

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Commande validation** :
   ```bash
   dorevia.sh validate prod <tenant>
   ```
2. **Vérifications** :
   - URLs accessibles (HTTP 200/302)
   - Healthchecks (`/health`, `/web/login`)
   - Services joignables
3. **Rapport** :
   - Liste des vérifications OK/KO
   - Bundle d'audit (logs + config + versions)

---

## 3. Analyse CLI Prompt — Capture d'Intention

### 3.1 Rôle du CLI

#### Spécification

> Le CLI est un **assistant d'intention** :
> - il pose des questions structurées
> - il n'exécute aucun déploiement
> - il génère une configuration déclarative

#### État Actuel

**Conformité** : ❌ **NON CONFORME**

**Implémentation actuelle** :
- CLI non interactive (pas de questions)
- Exécution directe (pas de séparation intention/exécution)
- Pas de génération configuration déclarative complète

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **Nouveau mode CLI interactif** :
   ```bash
   dorevia.sh prompt prod <tenant>
   ```
2. **Séquence de questions** (7 étapes) :
   - Contexte (tenant, env, confirmation)
   - Univers (activation)
   - Mode production (SaaS vs Client)
   - Nommage domaines (affichage + confirmation)
   - Alias (optionnel)
   - Préflight & installation
   - Résumé final
3. **Sortie** :
   - Configuration déclarative générée
   - Aucune action système

---

### 3.2 Séquence de Questions (7 Étapes)

#### Étape 1 — Contexte

**Spécification** :
- Nom du tenant
- Environnement cible (`prod`)
- Double confirmation en production (anti-erreur)

**Conformité** : ⚠️ **PARTIELLE** — Paramètres en ligne de commande actuellement

**Actions requises** :
- Mode interactif : demander tenant et env
- Double confirmation production (sécurité)

---

#### Étape 2 — Univers (fonctionnel)

**Spécification** :
- Pour chaque univers connu : activer en production ? (yes/no)
- L'univers pilote les FQDN publics

**Conformité** : ⚠️ **PARTIELLE** — Univers fixe (odoo) actuellement

**Actions requises** :
- Lister univers disponibles
- Demander activation pour chaque univers
- Calculer FQDN depuis univers activés

---

#### Étape 3 — Mode de Production

**Spécification** :
- Choix : SaaS Dorevia (standard) OU Domaine et/ou serveur client
- Si client : nom domaine, type DNS, hébergement, contraintes

**Conformité** : ❌ **NON CONFORME** — Non géré

**Actions requises** :
- Question choix mode
- Si client : questions supplémentaires (domaine, DNS, serveur)
- Stocker dans configuration

---

#### Étape 4 — Nommage Domaines

**Spécification** :
- Calcul et affichage FQDN résultants
- Confirmation explicite requise

**Conformité** : ⚠️ **PARTIELLE** — Calcul implicite actuellement

**Actions requises** :
- Calculer FQDN depuis univers + mode + domaines
- Afficher liste complète
- Demander confirmation explicite

---

#### Étape 5 — Alias

**Spécification** :
- Ajouter des alias ? (oui/non)
- Saisie alias par service ou global
- Validation

**Conformité** : ❌ **NON CONFORME** — Non implémenté

**Actions requises** :
- Question alias (oui/non)
- Saisie alias (par service ou global)
- Validation format alias
- Stocker dans configuration

---

#### Étape 6 — Préflight & Installation

**Spécification** :
- Lancer préflight production ? (recommandé)
- Autoriser installation contrôlée prérequis ? (oui/non)

**Conformité** : ❌ **NON CONFORME** — Non structuré

**Actions requises** :
- Question préflight (oui/non, défaut oui)
- Question installation contrôlée (oui/non)
- Stocker options dans configuration

---

#### Étape 7 — Résumé Final

**Spécification** :
- Affichage final (tenant, env, univers, domaines, alias, mode, options)
- Question finale : "Confirmer la génération de la configuration ? (yes/no)"

**Conformité** : ❌ **NON CONFORME** — Pas de résumé structuré

**Actions requises** :
- Générer résumé complet
- Afficher de manière lisible
- Demander confirmation finale
- Générer configuration si confirmé

---

## 4. Analyse Séparation Intention/Exécution

### 4.1 Spécification

> L'intention humaine est **séparée** de l'exécution machine.  
> Toute décision opérateur est **capturée, lisible et versionnée**.  
> L'exécution est **non interactive, déterministe et auditable**.

### 4.2 État Actuel

**Conformité** : ❌ **NON CONFORME**

**Implémentation actuelle** :
- Pas de séparation intention/exécution
- CLI exécute directement
- Pas de capture d'intention structurée

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **CLI prompt** (intention) :
   - Mode interactif
   - Questions structurées
   - Génération configuration déclarative
2. **CLI apply** (exécution) :
   - Mode non interactif
   - Lecture configuration
   - Exécution déterministe

---

## 5. Analyse Configuration Déclarative

### 5.1 Spécification

> Sortie attendue :
> - un fichier de configuration déclaratif **unique**
> - versionné (Git) avant exécution
> - relu (au moins 1 relecture opérateur)

### 5.2 État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- Templates partiels (docker-compose, odoo.conf)
- Manifest minimal
- Pas de configuration déclarative complète unique
- Pas de versionnement avant exécution

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Structure configuration déclarative** :
   ```json
   {
     "tenant": "rozas",
     "environment": "prod",
     "univers": ["odoo"],
     "mode": "client",
     "domains": {
       "base": "rozas.gp",
       "canonical": {
         "odoo": "odoo.prod.rozas.rozas.gp",
         "dvig": "dvig.rozas.rozas.gp",
         "vault": "vault.rozas.rozas.gp"
       },
       "aliases": {
         "odoo": ["erp.rozas.gp"],
         "dvig": ["api.rozas.gp"]
       }
     },
     "server": {
       "name": "client-server-1",
       "public_ip": "xxx.xxx.xxx.xxx"
     },
     "units": {
       "platform": ["dvig", "vault", "postgres"],
       "odoo": ["odoo", "postgres"]
     },
     "preflight": {
       "enabled": true,
       "install_controlled": false
     },
     "generated_at": "2025-01-29T10:00:00Z",
     "generated_by": "user@example.com"
   }
   ```
2. **Versionnement** :
   - Commit Git avant `apply`
   - Tag ou référence
3. **Relecture** :
   - Affichage configuration
   - Confirmation opérateur

---

## 6. Analyse Auditabilité et Traçabilité

### 6.1 Spécification

> La mise en production doit permettre :
> - reconstituer l'intention initiale (config + résumé CLI)
> - rejouer une exécution identique (apply)
> - expliquer un état prod (versions, logs, config)
> - démontrer le respect du process (Go/No-Go + préflight + validation)

### 6.2 État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- Manifest partiel
- Logs Docker (partiels)
- Pas de journal intentions
- Pas de journal exécutions
- Pas de bundle d'audit

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Journal intentions** :
   - `tenants/<tenant>/state/intentions.jsonl`
   - Chaque intention (prompt) enregistrée
2. **Journal exécutions** :
   - `tenants/<tenant>/state/executions.jsonl`
   - Chaque exécution (apply) enregistrée
3. **Bundle d'audit** :
   - Export : config + logs + versions + timestamps
   - Format : archive (tar.gz) ou répertoire

---

## 7. Comparaison avec SPEC v1.1

### 7.1 Approche v1.1 (Pragmatique)

**Caractéristiques** :
- Pas de refonte
- Documentation workflow
- Manifest minimal enrichi
- Pas de séparation intention/exécution
- CLI non interactive

### 7.2 Approche SPEC Process Production (Structurée)

**Caractéristiques** :
- Processus structuré (5 phases)
- CLI interactif (prompt)
- Séparation intention/exécution
- Configuration déclarative complète
- Auditabilité complète

### 7.3 Compatibilité

**Problème** : Les deux approches sont **incompatibles** :
- v1.1 : Pas de refonte, CLI non interactive
- SPEC Process : Refonte CLI, séparation intention/exécution

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **Décision** : Quelle approche suivre ?
   - Option A : v1.1 (pragmatique, sans refonte)
   - Option B : SPEC Process (structurée, refonte CLI)
   - Option C : Hybride (v1.1 + éléments SPEC Process progressifs)

2. **Recommandation** : **Option C (Hybride)** :
   - Implémenter v1.1 d'abord (stabilisation)
   - Ajouter éléments SPEC Process progressivement :
     - Phase 1 : Documentation processus (v1.1)
     - Phase 2 : Préflight automatisé
     - Phase 3 : Configuration déclarative enrichie
     - Phase 4 : CLI prompt (refonte)

---

## 8. Synthèse des Impacts par Composant

### 8.1 `bin/dorevia.sh`

**Impact** : 🔴 **CRITIQUE** — Refonte majeure

**Changements requis** :
1. **Nouveau mode prompt** :
   ```bash
   dorevia.sh prompt prod <tenant>
   ```
   - Mode interactif
   - 7 étapes de questions
   - Génération configuration déclarative

2. **Nouveau mode apply** :
   ```bash
   dorevia.sh apply prod <tenant> [--config <config-file>]
   ```
   - Mode non interactif
   - Lecture configuration
   - Exécution déterministe

3. **Nouveau mode preflight** :
   ```bash
   dorevia.sh preflight prod <tenant> [--server <server>]
   ```
   - Vérifications automatisées
   - Rapport OK/KO

4. **Nouveau mode validate** :
   ```bash
   dorevia.sh validate prod <tenant>
   ```
   - Validation post-prod
   - Rapport + bundle d'audit

**Estimation** : 5-7 jours de développement

---

### 8.2 Configuration Déclarative

**Impact** : 🔴 **CRITIQUE** — Nouvelle structure

**Changements requis** :
1. **Fichier configuration déclarative** :
   - `tenants/<tenant>/state/prod-config.json`
   - Structure complète (univers, domaines, alias, serveur, units)

2. **Génération depuis prompt** :
   - CLI prompt génère configuration
   - Validation format
   - Versionnement Git

3. **Lecture par apply** :
   - Apply lit configuration unique
   - Validation avant exécution

**Estimation** : 2-3 jours de développement

---

### 8.3 Documentation

**Impact** : 🟡 **IMPORTANT** — Documentation complète

**Changements requis** :
1. **Processus structuré** :
   - Guide 5 phases
   - Templates compte-rendu Go/No-Go
   - Checklist préconditions

2. **CLI prompt** :
   - Guide utilisation
   - Exemples questions/réponses
   - Format configuration générée

3. **Auditabilité** :
   - Guide relecture historique
   - Format bundle d'audit

**Estimation** : 2 jours

---

## 9. Plan d'Implémentation Recommandé

### Phase 1 : Fondations (2 semaines)

1. **Documentation processus** :
   - Guide 5 phases
   - Templates Go/No-Go
   - Checklist préconditions

2. **Préflight automatisé** :
   - `dorevia.sh preflight prod <tenant>`
   - Vérifications serveur, DNS, prérequis
   - Rapport OK/KO

3. **Validation post-prod** :
   - `dorevia.sh validate prod <tenant>`
   - Vérifications URLs, healthchecks
   - Rapport + bundle d'audit

### Phase 2 : Configuration Déclarative (1 semaine)

1. **Structure configuration** :
   - Format JSON complet
   - Validation schéma
   - Exemples

2. **Génération manuelle** :
   - Template configuration
   - Guide création manuelle
   - Validation format

### Phase 3 : CLI Prompt (2 semaines)

1. **Mode prompt interactif** :
   - 7 étapes de questions
   - Génération configuration
   - Validation

2. **Mode apply** :
   - Lecture configuration
   - Exécution non interactive
   - Logs structurés

### Phase 4 : Auditabilité (1 semaine)

1. **Journaux** :
   - Intentions (prompt)
   - Exécutions (apply)

2. **Bundle d'audit** :
   - Export config + logs + versions
   - Format archive

---

## 10. Risques et Mitigation

### Risque 1 : Incompatibilité avec v1.1

**Risque** : SPEC Process incompatible avec approche v1.1 (pragmatique)

**Mitigation** :
- Approche hybride : v1.1 d'abord, puis éléments SPEC Process progressifs
- Documentation claire des deux approches

### Risque 2 : Complexité CLI Prompt

**Risque** : CLI interactif complexe à implémenter et maintenir

**Mitigation** :
- Utiliser bibliothèque CLI interactive (ex: `inquirer` en Python, `prompt` en Node.js)
- Tests unitaires pour chaque étape
- Documentation complète

### Risque 3 : Temps de Développement

**Risque** : Refonte CLI = temps important

**Mitigation** :
- Approche progressive (phases)
- Priorisation (préflight d'abord, prompt ensuite)
- Réutilisation code existant

---

## 11. Recommandations

### 11.1 Décision Architecturale

**Question** : Implémenter SPEC Process complète ou approche hybride ?

**Recommandation** : **Approche hybride** (v1.1 + éléments SPEC Process progressifs)

**Justification** :
- v1.1 stabilise l'existant (priorité)
- SPEC Process apporte structure (long terme)
- Approche progressive réduit risques

### 11.2 Priorités

**Priorité 1 (Critique)** :
1. Documentation processus (5 phases)
2. Préflight automatisé
3. Validation post-prod

**Priorité 2 (Important)** :
1. Configuration déclarative (structure)
2. Mode apply (lecture config)
3. Auditabilité (journaux)

**Priorité 3 (Souhaitable)** :
1. CLI prompt interactif (refonte)
2. Bundle d'audit
3. Smoke tests automatisés

---

## 12. Conclusion

### Verdict Final

La spécification "Process de Mise en Production & CLI Prompt v1.1" introduit un **processus structuré** et un **CLI interactif** qui nécessitent une **refonte majeure** du processus de mise en production. Elle est **alignée avec la SPEC v1.3** mais **incompatible** avec l'approche pragmatique v1.1.

**Niveau d'impact** : 🔴 **CRITIQUE** — Refonte majeure requise

### Points Clés

1. **Processus structuré** : 5 phases (préconditions → Go/No-Go → préflight → config → apply → validation)
2. **CLI prompt** : Mode interactif pour capture d'intention (7 étapes)
3. **Séparation intention/exécution** : Aligné avec SPEC v1.3
4. **Configuration déclarative** : Fichier unique, versionné, relu
5. **Auditabilité complète** : Journaux, bundle d'audit

### Prochaines Étapes

1. **Décision** : Approche hybride (v1.1 + éléments SPEC Process) ou SPEC Process complète ?
2. **Priorisation** : Préflight et validation d'abord, CLI prompt ensuite
3. **Planification** : 4-6 semaines selon approche choisie

---

**Document généré le** : 2025-01-29  
**Auteur** : Analyse automatique  
**Version** : 1.0

