# 🧾 Checklist Go/No-Go — Production Client

**Version** : 1.0  
**Date** : 2026-01-03  
**Audience** : Exploitant, Chef de projet, AMOA  
**Contexte** : Validation avant déploiement PROD sur serveur client

---

## 📋 Vue d'Ensemble

Cette checklist complète le processus de production en 5 phases (`dorevia.sh production <tenant>`) et fournit une validation exhaustive avant tout déploiement PROD sur un serveur client.

**Principe** : **Tout point non validé = NO-GO** jusqu'à résolution.

---

## 🎯 Objectif

Valider que **tous les prérequis** sont réunis pour un déploiement PROD réussi sur un serveur client, en minimisant les risques opérationnels et contractuels.

---

## 📊 Structure de la Checklist

La checklist est organisée en **6 catégories** :

1. **Préconditions Générales** (Phase 0)
2. **Validation Fonctionnelle** (Phase 1)
3. **Validation Technique** (Phase 2)
4. **Validation Contractuelle** (Phase 1)
5. **Validation DNS & Réseau** (Phase 2)
6. **Validation Sécurité** (Phase 2)

Chaque catégorie contient des **points de contrôle** avec :
- ✅ **Critère d'acceptation** clair
- 🔍 **Méthode de vérification**
- ⚠️ **Impact si non validé**

---

## 1️⃣ Préconditions Générales (Phase 0)

### 1.1 Tenant et Configuration

- [ ] **Tenant existe et est configuré**
  - ✅ **Critère** : Répertoire `tenants/<tenant>/` existe avec `state/manifest.json`
  - 🔍 **Vérification** : `ls tenants/<tenant>/state/manifest.json`
  - ⚠️ **Impact** : Impossible de déployer sans tenant configuré

- [ ] **Manifest JSON valide**
  - ✅ **Critère** : `manifest.json` valide selon `schemas/manifest.schema.json`
  - 🔍 **Vérification** : `dorevia.sh validate <tenant>` ou `lib/validate.sh <tenant>`
  - ⚠️ **Impact** : Configuration incohérente, risque d'erreur de déploiement

- [ ] **Mode de production défini**
  - ✅ **Critère** : `manifest.json` contient `prod.target` (`saas`, `client`, ou `hybrid`)
  - 🔍 **Vérification** : `jq '.prod.target' tenants/<tenant>/state/manifest.json`
  - ⚠️ **Impact** : Impossible de déterminer où déployer

### 1.2 Environnement Stinger Validé

- [ ] **Environnement Stinger rendu**
  - ✅ **Critère** : Répertoire `tenants/<tenant>/rendered/stinger/` existe avec fichiers nécessaires
  - 🔍 **Vérification** : `ls tenants/<tenant>/rendered/stinger/`
  - ⚠️ **Impact** : Stinger non préparé, impossible de valider avant PROD

- [ ] **Platform Stinger déployée et opérationnelle**
  - ✅ **Critère** : Containers `dvig-<tenant>` et `vault-<tenant>` en cours d'exécution
  - 🔍 **Vérification** : `docker ps | grep -E "dvig-<tenant>|vault-<tenant>"`
  - ⚠️ **Impact** : Services platform non validés, risque de problèmes en PROD

- [ ] **App Stinger déployée et opérationnelle**
  - ✅ **Critère** : Au moins un container app stinger en cours d'exécution (ex: `odoo_stinger_<tenant>`)
  - 🔍 **Vérification** : `docker ps | grep stinger_<tenant>`
  - ⚠️ **Impact** : Application non validée, risque de dysfonctionnements en PROD

- [ ] **Stinger validé fonctionnellement**
  - ✅ **Critère** : Tests fonctionnels passent sur Stinger (smoke tests, intégration)
  - 🔍 **Vérification** : Tests manuels ou automatisés sur Stinger
  - ⚠️ **Impact** : Problèmes non détectés, risque de régression en PROD

### 1.3 Serveur Client (si mode `client` ou `hybrid`)

- [ ] **Serveur client configuré**
  - ✅ **Critère** : Fichier `servers/<server_name>.json` existe et est valide
  - 🔍 **Vérification** : `dorevia.sh server list` ou `ls servers/<server_name>.json`
  - ⚠️ **Impact** : Impossible de déployer sur serveur client

- [ ] **Configuration serveur complète**
  - ✅ **Critère** : `servers/<server_name>.json` contient `public_ip`, `ssh.user`, `ssh.key_path`
  - 🔍 **Vérification** : `jq '.' servers/<server_name>.json`
  - ⚠️ **Impact** : Informations manquantes, déploiement impossible

---

## 2️⃣ Validation Fonctionnelle (Phase 1)

### 2.1 Validation Stinger

- [ ] **Stinger opérationnel**
  - ✅ **Critère** : Tous les services Stinger répondent aux healthchecks
  - 🔍 **Vérification** : 
    - `curl https://dvig.<tenant>.doreviateam.com/health`
    - `curl https://vault.<tenant>.doreviateam.com/health`
    - `curl https://odoo.stinger.<tenant>.doreviateam.com` (ou équivalent)
  - ⚠️ **Impact** : Services non stables, risque de problèmes en PROD

- [ ] **Tests fonctionnels Stinger passent**
  - ✅ **Critère** : Tous les tests fonctionnels (smoke tests, intégration) passent sur Stinger
  - 🔍 **Vérification** : Exécution des tests automatisés ou validation manuelle
  - ⚠️ **Impact** : Fonctionnalités non validées, risque de bugs en PROD

- [ ] **Performance Stinger acceptable**
  - ✅ **Critère** : Temps de réponse Stinger < seuil acceptable (ex: < 2s pour 95e percentile)
  - 🔍 **Vérification** : Monitoring ou tests de charge
  - ⚠️ **Impact** : Performance insuffisante, risque de dégradation en PROD

### 2.2 Validation Données

- [ ] **Données Stinger cohérentes**
  - ✅ **Critère** : Données de test Stinger sont cohérentes et représentatives
  - 🔍 **Vérification** : Audit manuel des données Stinger
  - ⚠️ **Impact** : Données incohérentes, risque de problèmes de migration

- [ ] **Backup Stinger disponible**
  - ✅ **Critère** : Backup récent de Stinger disponible (si applicable)
  - 🔍 **Vérification** : `ls backups/` ou vérification système de backup
  - ⚠️ **Impact** : Pas de point de restauration en cas de problème

---

## 3️⃣ Validation Technique (Phase 2)

### 3.1 Prérequis Locaux

- [ ] **Docker installé et fonctionnel**
  - ✅ **Critère** : `docker --version` retourne une version valide
  - 🔍 **Vérification** : `docker --version` et `docker ps`
  - ⚠️ **Impact** : Impossible de déployer localement

- [ ] **Docker Compose disponible**
  - ✅ **Critère** : `docker compose version` ou `docker-compose --version` fonctionne
  - 🔍 **Vérification** : `docker compose version`
  - ⚠️ **Impact** : Impossible de déployer avec Docker Compose

- [ ] **Réseau Docker disponible**
  - ✅ **Critère** : Réseau `dorevia-network` existe ou peut être créé
  - 🔍 **Vérification** : `docker network ls | grep dorevia-network`
  - ⚠️ **Impact** : Isolation réseau impossible

### 3.2 Prérequis Serveur Client (si applicable)

- [ ] **Accès SSH au serveur client**
  - ✅ **Critère** : Connexion SSH réussie avec clé configurée
  - 🔍 **Vérification** : `dorevia.sh server preflight <server_name>` ou `ssh -i <key> <user>@<ip>`
  - ⚠️ **Impact** : Impossible de déployer sur serveur distant

- [ ] **Docker installé sur serveur client**
  - ✅ **Critère** : Docker installé et daemon accessible sur serveur client
  - 🔍 **Vérification** : `dorevia.sh server preflight <server_name>` (section Docker)
  - ⚠️ **Impact** : Impossible de déployer containers sur serveur client

- [ ] **Docker Compose disponible sur serveur client**
  - ✅ **Critère** : Docker Compose installé et fonctionnel sur serveur client
  - 🔍 **Vérification** : `dorevia.sh server preflight <server_name>` (section Docker Compose)
  - ⚠️ **Impact** : Impossible de déployer avec Docker Compose sur serveur client

- [ ] **Ports ouverts sur serveur client**
  - ✅ **Critère** : Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) accessibles
  - 🔍 **Vérification** : `dorevia.sh server preflight <server_name>` (section ports)
  - ⚠️ **Impact** : Services non accessibles depuis Internet

- [ ] **Espace disque suffisant sur serveur client**
  - ✅ **Critère** : Au moins 50GB d'espace disque disponible (configurable)
  - 🔍 **Vérification** : `dorevia.sh server preflight <server_name>` (section espace disque)
  - ⚠️ **Impact** : Déploiement impossible ou risque de saturation disque

- [ ] **User sudo disponible sur serveur client**
  - ✅ **Critère** : User SSH a les droits sudo (avec ou sans mot de passe)
  - 🔍 **Vérification** : `dorevia.sh server preflight <server_name>` (section droits sudo)
  - ⚠️ **Impact** : Impossible d'installer/configurer Docker si nécessaire

### 3.3 Configuration Technique

- [ ] **Configuration manifest conforme SPEC**
  - ✅ **Critère** : `manifest.json` conforme à `schemas/manifest.schema.json` et SPEC v2.0
  - 🔍 **Vérification** : `dorevia.sh validate <tenant>` et revue manuelle
  - ⚠️ **Impact** : Configuration incohérente, risque d'erreurs de déploiement

- [ ] **Fichiers rendus générés**
  - ✅ **Critère** : Fichiers rendus existent dans `tenants/<tenant>/rendered/prod/`
  - 🔍 **Vérification** : `ls tenants/<tenant>/rendered/prod/`
  - ⚠️ **Impact** : Fichiers de déploiement manquants

- [ ] **Images Docker disponibles**
  - ✅ **Critère** : Images Docker nécessaires sont disponibles (localement ou via registry)
  - 🔍 **Vérification** : `docker images | grep -E "dorevia|odoo"` ou accès registry
  - ⚠️ **Impact** : Déploiement impossible, images manquantes

---

## 4️⃣ Validation Contractuelle (Phase 1)

### 4.1 Mode de Production

- [ ] **Mode de production validé contractuellement**
  - ✅ **Critère** : Mode (`saas`, `client`, `hybrid`) validé avec le client
  - 🔍 **Vérification** : Documentation contractuelle ou validation AMOA
  - ⚠️ **Impact** : Déploiement non conforme au contrat

### 4.2 Domaines

- [ ] **Domaine canonique validé**
  - ✅ **Critère** : Domaine canonique (`domains.canonical`) validé avec le client
  - 🔍 **Vérification** : `jq '.domains.canonical' tenants/<tenant>/state/manifest.json`
  - ⚠️ **Impact** : Domaine non conforme au contrat

- [ ] **Alias validés**
  - ✅ **Critère** : Tous les alias (`domains.aliases`) validés avec le client
  - 🔍 **Vérification** : `jq '.domains.aliases' tenants/<tenant>/state/manifest.json`
  - ⚠️ **Impact** : Alias non conformes au contrat

- [ ] **Fallback validé (si applicable)**
  - ✅ **Critère** : Domaine fallback (`domains.fallback`) validé avec le client
  - 🔍 **Vérification** : `jq '.domains.fallback' tenants/<tenant>/state/manifest.json`
  - ⚠️ **Impact** : Fallback non conforme au contrat

### 4.3 Serveur Client (si applicable)

- [ ] **Serveur client validé contractuellement**
  - ✅ **Critère** : Serveur client validé avec le client (propriété, accès, responsabilités)
  - 🔍 **Vérification** : Documentation contractuelle
  - ⚠️ **Impact** : Déploiement sur serveur non validé

- [ ] **Responsabilités DNS clarifiées**
  - ✅ **Critère** : Qui gère DNS (Mode 1: Doreviateam, Mode 2: Client) clarifié
  - 🔍 **Vérification** : `jq '.prod.dns_managed_by' tenants/<tenant>/state/manifest.json`
  - ⚠️ **Impact** : Confusion sur responsabilités DNS

---

## 5️⃣ Validation DNS & Réseau (Phase 2)

### 5.1 Configuration DNS

- [ ] **Enregistrements DNS créés**
  - ✅ **Critère** : Tous les enregistrements DNS nécessaires sont créés
  - 🔍 **Vérification** : 
    - Mode 1 (Doreviateam) : Vérifier zone DNS
    - Mode 2 (Client) : Demander confirmation au client
  - ⚠️ **Impact** : Domaines non résolus, services inaccessibles

- [ ] **DNS propagé**
  - ✅ **Critère** : Tous les hostnames résolvent vers la bonne IP
  - 🔍 **Vérification** : `dorevia.sh preflight <tenant> --env prod --check-dns`
  - ⚠️ **Impact** : Domaines non accessibles, certificats SSL impossibles

- [ ] **IP cohérente**
  - ✅ **Critère** : Tous les hostnames résolvent vers la même IP (serveur client ou Doreviateam)
  - 🔍 **Vérification** : `dorevia.sh preflight <tenant> --env prod --check-dns`
  - ⚠️ **Impact** : Incohérence DNS, services inaccessibles

### 5.2 Hostnames à Valider

Pour chaque hostname (canonique, fallback, alias) :

- [ ] **Hostname canonique résolu**
  - ✅ **Critère** : `odoo.prod.<tenant>.<domain>` résout vers la bonne IP
  - 🔍 **Vérification** : `dig odoo.prod.<tenant>.<domain> +short`
  - ⚠️ **Impact** : Service principal inaccessible

- [ ] **Hostname fallback résolu (si applicable)**
  - ✅ **Critère** : `odoo.prod.<tenant>.doreviateam.com` résout vers la bonne IP
  - 🔍 **Vérification** : `dig odoo.prod.<tenant>.doreviateam.com +short`
  - ⚠️ **Impact** : Fallback non fonctionnel

- [ ] **Hostnames alias résolus**
  - ✅ **Critère** : Tous les alias résolvent vers la bonne IP
  - 🔍 **Vérification** : `dig <alias> +short` pour chaque alias
  - ⚠️ **Impact** : Alias non accessibles

- [ ] **Hostnames DVIG/Vault résolus**
  - ✅ **Critère** : `dvig.<tenant>.<domain>` et `vault.<tenant>.<domain>` résolvent vers la bonne IP
  - 🔍 **Vérification** : `dig dvig.<tenant>.<domain> +short` et `dig vault.<tenant>.<domain> +short`
  - ⚠️ **Impact** : Services platform inaccessibles

### 5.3 Réseau

- [ ] **Connectivité serveur client (si applicable)**
  - ✅ **Critère** : Serveur client accessible depuis Internet (ping, SSH)
  - 🔍 **Vérification** : `ping <server_ip>` et `ssh <user>@<server_ip>`
  - ⚠️ **Impact** : Serveur inaccessible, déploiement impossible

- [ ] **Ports ouverts (serveur client)**
  - ✅ **Critère** : Ports 22, 80, 443 ouverts et accessibles depuis Internet
  - 🔍 **Vérification** : `dorevia.sh server preflight <server_name>` (section ports)
  - ⚠️ **Impact** : Services non accessibles depuis Internet

---

## 6️⃣ Validation Sécurité (Phase 2)

### 6.1 Accès Serveur Client (si applicable)

- [ ] **Clé SSH sécurisée**
  - ✅ **Critère** : Clé SSH avec permissions 600 ou 400, non partagée
  - 🔍 **Vérification** : `stat -c "%a" <ssh_key_path>` et audit sécurité
  - ⚠️ **Impact** : Risque de compromission accès serveur

- [ ] **User SSH sécurisé**
  - ✅ **Critère** : User SSH avec accès minimal nécessaire, pas de root direct
  - 🔍 **Vérification** : Audit configuration serveur
  - ⚠️ **Impact** : Risque de compromission serveur

- [ ] **Firewall configuré (recommandé)**
  - ✅ **Critère** : Firewall configuré pour limiter accès (ports 22, 80, 443 uniquement)
  - 🔍 **Vérification** : Audit configuration firewall serveur
  - ⚠️ **Impact** : Risque de compromission serveur

### 6.2 Tokens et Secrets

- [ ] **Tokens PROD générés**
  - ✅ **Critère** : Tokens DVIG PROD générés et sécurisés
  - 🔍 **Vérification** : `dorevia.sh token list odoo prod <tenant>`
  - ⚠️ **Impact** : Services non authentifiés, risque de sécurité

- [ ] **Secrets non commités**
  - ✅ **Critère** : Aucun secret (tokens, clés SSH) dans Git
  - 🔍 **Vérification** : `git grep -i "password\|token\|secret"` (doit être vide)
  - ⚠️ **Impact** : Secrets exposés, risque de compromission

### 6.3 Certificats SSL

- [ ] **Certificats SSL obtenus (post-déploiement)**
  - ✅ **Critère** : Caddy obtient automatiquement certificats Let's Encrypt
  - 🔍 **Vérification** : `curl -I https://<hostname>` (doit retourner 200/301/302)
  - ⚠️ **Impact** : Services non sécurisés, risque de compromission données

- [ ] **HTTPS forcé (recommandé)**
  - ✅ **Critère** : Redirection HTTP → HTTPS configurée
  - 🔍 **Vérification** : `curl -I http://<hostname>` (doit rediriger vers HTTPS)
  - ⚠️ **Impact** : Trafic non sécurisé possible

---

## 📋 Utilisation de la Checklist

### Mode Manuel

1. **Avant Phase 1 (Go/No-Go)** :
   - Compléter sections 1 (Préconditions), 2 (Fonctionnelle), 4 (Contractuelle)
   - Tous les points doivent être ✅ avant de passer à Phase 1

2. **Avant Phase 2 (Préflight)** :
   - Compléter sections 3 (Technique), 5 (DNS & Réseau), 6 (Sécurité)
   - Tous les points doivent être ✅ avant de passer à Phase 2

3. **Avant Phase 4 (Apply Prod)** :
   - Vérifier que toutes les sections sont ✅
   - Documenter toute exception avec justification

### Mode Automatisé

La plupart des vérifications techniques peuvent être automatisées :

```bash
# Phase 0 : Préconditions
dorevia.sh production <tenant> --phase 0

# Phase 1 : Go/No-Go (questions manuelles)
dorevia.sh production <tenant> --phase 1

# Phase 2 : Préflight (vérifications techniques)
dorevia.sh production <tenant> --phase 2

# Préflight serveur client (si applicable)
dorevia.sh server preflight <server_name>

# Validation DNS
dorevia.sh preflight <tenant> --env prod --check-dns
```

---

## 🚨 Critères de NO-GO

**Un déploiement PROD est refusé (NO-GO) si** :

1. ❌ **Préconditions non remplies** : Stinger non validé, tenant non configuré
2. ❌ **Validation fonctionnelle échouée** : Tests Stinger échouent, services non stables
3. ❌ **Validation technique échouée** : Prérequis manquants, configuration incohérente
4. ❌ **Validation contractuelle échouée** : Mode/domaines non validés
5. ❌ **DNS non propagé** : Hostnames non résolus, IP incohérente
6. ❌ **Sécurité compromise** : Secrets exposés, accès non sécurisé

**Exception** : Avertissements (⚠️) peuvent être acceptés avec justification documentée.

---

## 📝 Documentation

Chaque validation doit être **documentée** :

- **Date de validation**
- **Opérateur** (qui a validé)
- **Méthode de vérification** (commande, test, audit)
- **Résultat** (✅ OK, ❌ KO, ⚠️ WARN)
- **Justification** (si exception)

**Format recommandé** : Utiliser le rapport généré par `phase1_gonogo.sh` et l'enrichir avec les validations supplémentaires.

---

## 🔄 Mise à Jour

Cette checklist doit être **mise à jour** si :

- Nouveaux prérequis techniques
- Changements dans le processus de production
- Retours d'expérience (lessons learned)
- Évolution des spécifications

**Version actuelle** : 1.0 (2026-01-03)

---

**Fin de la Checklist Go/No-Go Production Client**

