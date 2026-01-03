# 🌐 Plan d'Implémentation Phase 3 "Domaines & Serveurs Clients" — Mode Scrum

**Version** : 1.0  
**Date** : 2026-01-02  
**Base** : `SPEC_Dorevia_Phase3_Domaines_Serveurs_Clients_v1.0.md` (v1.0-A)  
**Durée estimée** : 5 sprints (10 semaines)  
**Équipe** : Dev plateforme / Exploitation

---

## 📋 Vue d'Ensemble

### Objectif Phase 3

Permettre aux clients d'utiliser leurs propres domaines et serveurs tout en conservant la maîtrise technique et l'auditabilité de la plateforme Dorevia.

### Tenant de Référence

Le tenant **`rozas`** sera utilisé comme tenant de référence pour la Phase 3 (déjà configuré avec domaine client `rozas.gp`). Toutes les fonctionnalités Phase 3 sont d'abord implémentées et validées sur le tenant `rozas` avant d'être étendues aux autres tenants.

### Définition de "Fait" (DoD)

La Phase 3 est terminée si :
- ✅ Un tenant peut utiliser un domaine client en production (canonique ou alias)
- ✅ Un déploiement sur serveur client est possible et documenté
- ✅ Les certificats SSL sont obtenus automatiquement pour les domaines clients
- ✅ La gestion DNS est documentée (déléguée ou gérée par client)
- ✅ Les alias multi-services sont supportés et fonctionnels
- ✅ La configuration multi-domaines est déclarative et versionnable

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 0** : Préparation (1 semaine) — Schéma domaines, structure serveurs
- **Sprint 1** : Support Domaines Clients (2 semaines)
- **Sprint 2** : Support Serveur Client (2 semaines)
- **Sprint 3** : Alias Multi-Services & DNS (2 semaines)
- **Sprint 4** : Backup/Restore Serveur Client (1 semaine)
- **Sprint 5** : Tests & Documentation (2 semaines)

**Total** : 10 semaines

---

## 📦 Sprint 0 : Préparation (1 semaine)

**Points** : 5 points  
**Objectif** : Préparer les fondations Phase 3 : schéma domaines, structure serveurs, validation.

### User Stories

#### US-0.1 : Extension schéma manifest.json pour domaines

**En tant que** développeur plateforme  
**Je veux** étendre `manifest.json` pour supporter domaines clients et alias  
**Afin de** stocker la configuration multi-domaines de manière déclarative

**Points** : 3

**Critères d'acceptation** :
- [ ] Structure `domains` ajoutée à `manifest.json`
- [ ] Support `canonical`, `aliases` (global + par service), `fallback`
- [ ] Validation JSON Schema mise à jour
- [ ] Exemples de configuration (SaaS vs Client)

**Tâches techniques** :
- [ ] Étendre `schemas/manifest.schema.json`
- [ ] Ajouter structure `domains` avec règles de validation
- [ ] Documenter exemples (SaaS, Client, alias)
- [ ] Mettre à jour `lib/validate.sh`

**Livrables** :
- ✅ `schemas/manifest.schema.json` : Schéma étendu
- ✅ `tenants/rozas/state/manifest.json` : Exemple configuration domaine client
- ✅ Documentation structure domaines

---

#### US-0.2 : Structure gestion serveurs

**En tant que** exploitant  
**Je veux** une structure pour gérer les serveurs clients configurés  
**Afin de** déployer sur différents serveurs de manière déclarative

**Points** : 2

**Critères d'acceptation** :
- [ ] Répertoire `servers/` créé (ou structure équivalente)
- [ ] Format de configuration serveur défini
- [ ] Documentation structure serveurs

**Tâches techniques** :
- [ ] Créer structure `servers/<server_name>.json` (ou équivalent)
- [ ] Définir format configuration (IP, SSH, domaine, etc.)
- [ ] Documenter structure

**Livrables** :
- ✅ Structure `servers/` (ou équivalent)
- ✅ Format configuration serveur documenté
- ✅ Exemple configuration serveur client

---

## 📦 Sprint 1 : Support Domaines Clients (2 semaines)

**Points** : 18 points  
**Objectif** : Implémenter le support complet des domaines clients (canonique + alias + fallback).

### User Stories

#### US-1.1 : Extension CLI prompt — Domaines clients

**En tant que** opérateur  
**Je veux** configurer un domaine client via le CLI prompt  
**Afin de** déclarer mon intention de déploiement avec domaine client

**Points** : 5

**Critères d'acceptation** :
- [ ] Extension `prompt` : question domaine client (Étape 3.1)
- [ ] Validation format domaine (FQDN valide)
- [ ] Choix mode (SaaS vs Client)
- [ ] Génération `intent-*.json` avec domaine client

**Tâches techniques** :
- [ ] Étendre `lib/prompt/prompt.py` (Étape 3.1)
- [ ] Ajouter validation domaine client
- [ ] Mettre à jour `calculate_fqdns()` pour domaines clients
- [ ] Tester génération intent avec domaine client

**Livrables** :
- ✅ `lib/prompt/prompt.py` : Extension domaine client
- ✅ `schemas/intent.schema.json` : Schéma étendu
- ✅ Tests prompt avec domaine client

---

#### US-1.2 : Génération Caddyfile avec domaines clients

**En tant que** développeur plateforme  
**Je veux** générer un Caddyfile avec domaines clients (canonique + alias + fallback)  
**Afin de** exposer les services via les domaines clients

**Points** : 5

**Critères d'acceptation** :
- [ ] `render` génère Caddyfile avec domaine canonique selon mode
- [ ] Support fallback obligatoire (mode Client)
- [ ] Génération multi-hostnames (canonique + alias + fallback)
- [ ] Validation format Caddyfile

**Tâches techniques** :
- [ ] Étendre `lib/render/render_caddyfile.sh`
- [ ] Logique domaine canonique (SaaS vs Client)
- [ ] Génération fallback obligatoire
- [ ] Tests génération Caddyfile multi-domaines

**Livrables** :
- ✅ `lib/render/render_caddyfile.sh` : Support domaines clients
- ✅ Caddyfiles générés avec domaines clients
- ✅ Tests génération multi-domaines

---

#### US-1.3 : Certificats SSL domaines clients

**En tant que** exploitant  
**Je veux** que Caddy obtienne automatiquement les certificats SSL pour les domaines clients  
**Afin de** sécuriser les accès via domaines clients

**Points** : 4

**Critères d'acceptation** :
- [ ] Caddy obtient certificats Let's Encrypt pour domaines clients
- [ ] Validation DNS avant obtention certificat
- [ ] Gestion erreurs certificats (rapport lisible)
- [ ] Tests certificats multi-domaines

**Tâches techniques** :
- [ ] Vérifier configuration Caddy (ACME)
- [ ] Ajouter validation DNS dans préflight
- [ ] Documenter gestion erreurs certificats
- [ ] Tests certificats domaines clients

**Livrables** :
- ✅ Préflight validation DNS
- ✅ Documentation gestion certificats
- ✅ Tests certificats domaines clients

---

#### US-1.4 : Validation DNS automatique

**En tant que** exploitant  
**Je veux** valider automatiquement la résolution DNS avant déploiement  
**Afin de** éviter les erreurs de déploiement liées au DNS

**Points** : 4

**Critères d'acceptation** :
- [ ] Commande `preflight --check-dns` implémentée
- [ ] Vérification résolution DNS (canonique + alias + fallback)
- [ ] Vérification cohérence IP (même IP pour tous les hostnames)
- [ ] Rapport lisible (OK/KO par hostname)

**Tâches techniques** :
- [ ] Étendre `lib/preflight/preflight.sh`
- [ ] Ajouter fonction `check_dns()`
- [ ] Validation cohérence IP
- [ ] Tests validation DNS

**Livrables** :
- ✅ `lib/preflight/preflight.sh` : Validation DNS
- ✅ Commande `preflight --check-dns`
- ✅ Tests validation DNS

---

## 📦 Sprint 2 : Support Serveur Client (2 semaines)

**Points** : 18 points  
**Objectif** : Implémenter le déploiement sur serveur client via SSH.

### User Stories

#### US-2.1 : Commande `server` — Gestion serveurs

**En tant que** exploitant  
**Je veux** gérer les serveurs clients configurés via une commande dédiée  
**Afin de** configurer et valider les serveurs avant déploiement

**Points** : 5

**Critères d'acceptation** :
- [ ] Commande `dorevia.sh server <action> <server_name>` implémentée
- [ ] Actions : `list`, `add`, `preflight`, `status`
- [ ] Configuration serveur stockée (IP, SSH, domaine)
- [ ] Validation format configuration

**Tâches techniques** :
- [ ] Créer `cmd_server()` dans `bin/dorevia.sh`
- [ ] Implémenter actions `list`, `add`, `preflight`, `status`
- [ ] Format configuration serveur (JSON ou équivalent)
- [ ] Tests commande `server`

**Livrables** :
- ✅ `bin/dorevia.sh` : Commande `server`
- ✅ Format configuration serveur
- ✅ Tests commande `server`

---

#### US-2.2 : Préflight serveur client

**En tant que** exploitant  
**Je veux** valider automatiquement un serveur client avant déploiement  
**Afin de** détecter les problèmes avant de déployer

**Points** : 5

**Critères d'acceptation** :
- [ ] Vérification accès SSH (clé + user sudo)
- [ ] Vérification Docker installé et fonctionnel
- [ ] Vérification Docker Compose installé
- [ ] Vérification ports 22, 80, 443 ouverts
- [ ] Vérification espace disque suffisant
- [ ] Rapport lisible (OK/KO par vérification)

**Tâches techniques** :
- [ ] Créer `lib/server/preflight_server.sh`
- [ ] Implémenter vérifications SSH, Docker, ports, disque
- [ ] Intégrer dans `server preflight`
- [ ] Tests préflight serveur

**Livrables** :
- ✅ `lib/server/preflight_server.sh` : Préflight serveur
- ✅ Commande `server preflight <server_name>`
- ✅ Tests préflight serveur

---

#### US-2.3 : Déploiement distant via SSH

**En tant que** exploitant  
**Je veux** déployer platform et app sur un serveur client via SSH  
**Afin de** matérialiser la configuration sur le serveur client

**Points** : 8

**Critères d'acceptation** :
- [ ] `platform up <tenant> --server <server_name>` déploie via SSH
- [ ] `app up <univers> <env> <tenant> --server <server_name>` déploie via SSH
- [ ] Transfert fichiers nécessaires (compose, env, etc.)
- [ ] Exécution distante des commandes Docker
- [ ] Gestion erreurs SSH (rapport lisible)

**Tâches techniques** :
- [ ] Créer `lib/server/deploy_remote.sh`
- [ ] Fonction `ssh_exec()` pour exécution distante
- [ ] Fonction `ssh_copy()` pour transfert fichiers
- [ ] Étendre `cmd_platform_up()` et `cmd_app_up()` avec `--server`
- [ ] Tests déploiement distant

**Livrables** :
- ✅ `lib/server/deploy_remote.sh` : Déploiement distant
- ✅ Extensions `platform up --server` et `app up --server`
- ✅ Tests déploiement distant

---

## 📦 Sprint 3 : Alias Multi-Services & DNS (2 semaines)

**Points** : 18 points  
**Objectif** : Implémenter les alias multi-services et la gestion DNS.

### User Stories

#### US-3.1 : Extension prompt — Alias multi-services

**En tant que** opérateur  
**Je veux** configurer des alias (global + par service) via le CLI prompt  
**Afin de** déclarer mes alias DNS de manière structurée

**Points** : 5

**Critères d'acceptation** :
- [ ] Extension `prompt` : question alias (Étape 5)
- [ ] Support alias global + par service (odoo, dvig, vault)
- [ ] Validation format alias (FQDN valide)
- [ ] Détection collision alias (erreur bloquante)
- [ ] Génération `intent-*.json` avec alias

**Tâches techniques** :
- [ ] Étendre `lib/prompt/prompt.py` (Étape 5)
- [ ] Ajouter validation alias (format + collision)
- [ ] Mettre à jour `calculate_fqdns()` pour alias
- [ ] Tests prompt avec alias

**Livrables** :
- ✅ `lib/prompt/prompt.py` : Extension alias
- ✅ Validation collision alias
- ✅ Tests prompt avec alias

---

#### US-3.2 : Génération Caddyfile avec alias

**En tant que** développeur plateforme  
**Je veux** générer un Caddyfile avec alias (global + par service)  
**Afin de** exposer les services via les alias configurés

**Points** : 5

**Critères d'acceptation** :
- [ ] `render` génère Caddyfile avec alias
- [ ] Support alias global (tous les services)
- [ ] Support alias par service (odoo, dvig, vault)
- [ ] Priorité de résolution (alias service > alias global)
- [ ] Validation collision alias (erreur bloquante)

**Tâches techniques** :
- [ ] Étendre `lib/render/render_caddyfile.sh`
- [ ] Logique alias global + par service
- [ ] Détection collision alias
- [ ] Tests génération Caddyfile avec alias

**Livrables** :
- ✅ `lib/render/render_caddyfile.sh` : Support alias
- ✅ Caddyfiles générés avec alias
- ✅ Tests génération alias

---

#### US-3.3 : Documentation gestion DNS

**En tant que** exploitant  
**Je veux** une documentation claire sur la gestion DNS (Mode 1 vs Mode 2)  
**Afin de** comprendre qui fait quoi et comment

**Points** : 4

**Critères d'acceptation** :
- [ ] Documentation Mode 1 (Doreviateam gère DNS)
- [ ] Documentation Mode 2 (Client gère DNS)
- [ ] Checklist enregistrements DNS par mode
- [ ] Processus validation DNS documenté

**Tâches techniques** :
- [ ] Créer `ZeDocs/V2/RUNBOOK_DNS.md`
- [ ] Documenter Mode 1 et Mode 2
- [ ] Checklist enregistrements DNS
- [ ] Processus validation

**Livrables** :
- ✅ `ZeDocs/V2/RUNBOOK_DNS.md` : Documentation DNS
- ✅ Checklist enregistrements DNS
- ✅ Processus validation DNS

---

#### US-3.4 : Validation DNS multi-domaines

**En tant que** exploitant  
**Je veux** valider automatiquement la résolution DNS pour tous les hostnames (canonique + alias + fallback)  
**Afin de** garantir la cohérence DNS avant déploiement

**Points** : 4

**Critères d'acceptation** :
- [ ] Validation DNS pour canonique + alias + fallback
- [ ] Vérification cohérence IP (même IP pour tous)
- [ ] Vérification TTL acceptable (< 3600 secondes)
- [ ] Rapport lisible (OK/KO par hostname)

**Tâches techniques** :
- [ ] Étendre `lib/preflight/preflight.sh`
- [ ] Fonction `check_dns_multi_domains()`
- [ ] Validation cohérence IP multi-domaines
- [ ] Tests validation DNS multi-domaines

**Livrables** :
- ✅ `lib/preflight/preflight.sh` : Validation DNS multi-domaines
- ✅ Tests validation DNS multi-domaines

---

## 📦 Sprint 4 : Backup/Restore Serveur Client (1 semaine)

**Points** : 9 points  
**Objectif** : Implémenter le backup/restore pour serveur client (volumes + secrets).

### User Stories

#### US-4.1 : Backup serveur client — Volumes Vault

**En tant que** exploitant  
**Je veux** sauvegarder les volumes Vault (storage, ledger, audit) d'un serveur client  
**Afin de** garantir la récupération en cas d'incident

**Points** : 3

**Critères d'acceptation** :
- [ ] Commande `backup <tenant> --server <server_name>` sauvegarde volumes Vault
- [ ] Archive `vault-storage.tar.gz`, `vault-ledger.tar.gz`, `vault-audit.tar.gz`
- [ ] Backup via SSH (serveur distant)
- [ ] Validation intégrité archives

**Tâches techniques** :
- [ ] Étendre `lib/backup/backup.sh` (ou créer)
- [ ] Fonction `backup_vault_volumes_remote()`
- [ ] Transfert volumes via SSH
- [ ] Tests backup volumes Vault distant

**Livrables** :
- ✅ `lib/backup/backup.sh` : Backup volumes Vault distant
- ✅ Commande `backup --server`
- ✅ Tests backup volumes Vault

---

#### US-4.2 : Backup serveur client — Secrets

**En tant que** exploitant  
**Je veux** sauvegarder les secrets (tokens DVIG) d'un serveur client de manière chiffrée  
**Afin de** garantir la sécurité et la récupération

**Points** : 3

**Critères d'acceptation** :
- [ ] Backup secrets via SSH (serveur distant)
- [ ] Archive `secrets.tar.gz` chiffrée
- [ ] Permissions sécurisées (600 ou 640)
- [ ] Validation intégrité archive chiffrée

**Tâches techniques** :
- [ ] Étendre `lib/backup/backup.sh`
- [ ] Fonction `backup_secrets_remote()` avec chiffrement
- [ ] Gestion clé de chiffrement
- [ ] Tests backup secrets chiffré

**Livrables** :
- ✅ `lib/backup/backup.sh` : Backup secrets chiffré
- ✅ Tests backup secrets

---

#### US-4.3 : Restore serveur client

**En tant que** exploitant  
**Je veux** restaurer un backup (volumes + secrets) sur un serveur client  
**Afin de** récupérer un tenant après incident

**Points** : 3

**Critères d'acceptation** :
- [ ] Commande `restore <tenant> --server <server_name> --from <backup_dir>`
- [ ] Restauration volumes Vault (storage, ledger, audit)
- [ ] Restauration secrets (déchiffrement)
- [ ] Validation healthchecks après restore

**Tâches techniques** :
- [ ] Étendre `lib/restore/restore.sh` (ou créer)
- [ ] Fonction `restore_remote()`
- [ ] Restauration volumes + secrets via SSH
- [ ] Tests restore serveur client

**Livrables** :
- ✅ `lib/restore/restore.sh` : Restore serveur client
- ✅ Commande `restore --server`
- ✅ Tests restore serveur client

---

## 📦 Sprint 5 : Tests & Documentation (2 semaines)

**Points** : 18 points  
**Objectif** : Tests end-to-end, documentation complète, validation Phase 3.

### User Stories

#### US-5.1 : Tests Scénario A — Domaine Client (SaaS)

**En tant que** développeur plateforme  
**Je veux** tester le déploiement avec domaine client en mode SaaS  
**Afin de** valider le support domaines clients

**Points** : 5

**Critères d'acceptation** :
- [ ] Test `prompt rozas --env prod` : Configuration domaine client
- [ ] Test `render rozas --env prod` : Génération Caddyfile avec domaine client
- [ ] Test `gateway aggregate --reload` : Agrégation + certificats SSL
- [ ] Test `apply rozas --env prod` : Déploiement avec domaine client
- [ ] Validation : URLs accessibles (canonique + fallback)

**Tâches techniques** :
- [ ] Créer `tests/scenario_c_phase3_domaine_client_saas.sh`
- [ ] Tests complets workflow domaine client SaaS
- [ ] Validation certificats SSL
- [ ] Validation URLs accessibles

**Livrables** :
- ✅ `tests/scenario_c_phase3_domaine_client_saas.sh` : Tests scénario A
- ✅ Tests passent (100%)

---

#### US-5.2 : Tests Scénario B — Serveur Client

**En tant que** développeur plateforme  
**Je veux** tester le déploiement sur serveur client  
**Afin de** valider le support serveur client

**Points** : 5

**Critères d'acceptation** :
- [ ] Test `server add ionos-rozas` : Configuration serveur client
- [ ] Test `server preflight ionos-rozas` : Vérifications serveur
- [ ] Test `platform up rozas --server ionos-rozas` : Déploiement platform
- [ ] Test `app up odoo prod rozas --server ionos-rozas` : Déploiement app
- [ ] Validation : Services fonctionnels sur serveur client

**Tâches techniques** :
- [ ] Créer `tests/scenario_d_phase3_serveur_client.sh`
- [ ] Tests complets workflow serveur client
- [ ] Validation services fonctionnels
- [ ] Validation certificats SSL

**Livrables** :
- ✅ `tests/scenario_d_phase3_serveur_client.sh` : Tests scénario B
- ✅ Tests passent (100%)

---

#### US-5.3 : Tests Scénario C — Alias Multi-Services

**En tant que** développeur plateforme  
**Je veux** tester le déploiement avec alias multi-services  
**Afin de** valider le support alias

**Points** : 4

**Critères d'acceptation** :
- [ ] Test configuration alias (global + par service)
- [ ] Test génération Caddyfile avec alias
- [ ] Test certificats SSL pour tous les alias
- [ ] Validation : Tous les alias accessibles

**Tâches techniques** :
- [ ] Créer `tests/scenario_e_phase3_alias.sh`
- [ ] Tests complets workflow alias
- [ ] Validation certificats SSL multi-domaines
- [ ] Validation alias accessibles

**Livrables** :
- ✅ `tests/scenario_e_phase3_alias.sh` : Tests scénario C
- ✅ Tests passent (100%)

---

#### US-5.4 : Documentation Phase 3

**En tant que** utilisateur  
**Je veux** une documentation complète pour utiliser les fonctionnalités Phase 3  
**Afin de** comprendre comment utiliser domaines clients et serveurs clients

**Points** : 4

**Critères d'acceptation** :
- [ ] Guide utilisateur Phase 3 (`GUIDE_PHASE3.md`)
- [ ] Runbook domaines clients (`RUNBOOK_DOMAINES_CLIENTS.md`)
- [ ] Runbook serveur client (`RUNBOOK_SERVEUR_CLIENT.md`)
- [ ] Documentation commandes nouvelles (`server`, extensions `prompt`)

**Tâches techniques** :
- [ ] Créer `ZeDocs/V2/GUIDE_PHASE3.md`
- [ ] Créer `ZeDocs/V2/RUNBOOK_DOMAINES_CLIENTS.md`
- [ ] Créer `ZeDocs/V2/RUNBOOK_SERVEUR_CLIENT.md`
- [ ] Documenter commandes nouvelles

**Livrables** :
- ✅ `ZeDocs/V2/GUIDE_PHASE3.md` : Guide utilisateur
- ✅ `ZeDocs/V2/RUNBOOK_DOMAINES_CLIENTS.md` : Runbook domaines
- ✅ `ZeDocs/V2/RUNBOOK_SERVEUR_CLIENT.md` : Runbook serveur
- ✅ Documentation complète

---

## 📊 Récapitulatif Sprints

| Sprint | Objectif | Points | Durée |
|--------|----------|--------|-------|
| **Sprint 0** | Préparation | 5 | 1 semaine |
| **Sprint 1** | Support Domaines Clients | 18 | 2 semaines |
| **Sprint 2** | Support Serveur Client | 18 | 2 semaines |
| **Sprint 3** | Alias Multi-Services & DNS | 18 | 2 semaines |
| **Sprint 4** | Backup/Restore Serveur Client | 9 | 1 semaine |
| **Sprint 5** | Tests & Documentation | 18 | 2 semaines |
| **Total** | **Phase 3 complète** | **86** | **10 semaines** |

---

## 🎯 Critères d'Acceptation Globaux Phase 3

### Scénario A — Domaine Client (SaaS Dorevia)

**Tests** :
- [ ] `prompt <tenant> --env prod` : Configuration domaine client
- [ ] `render <tenant> --env prod` : Génération Caddyfile avec domaine client
- [ ] `gateway aggregate --reload` : Agrégation + certificats SSL
- [ ] `apply <tenant> --env prod` : Déploiement avec domaine client
- [ ] Validation : URLs accessibles (canonique + fallback)

### Scénario B — Serveur Client

**Tests** :
- [ ] `server add <server_name>` : Configuration serveur client
- [ ] `server preflight <server_name>` : Vérifications serveur
- [ ] `platform up <tenant> --server <server_name>` : Déploiement platform
- [ ] `app up odoo prod <tenant> --server <server_name>` : Déploiement app
- [ ] Validation : Services fonctionnels sur serveur client

### Scénario C — Alias Multi-Services

**Tests** :
- [ ] Configuration alias (global + par service)
- [ ] Génération Caddyfile avec alias
- [ ] Certificats SSL pour tous les alias
- [ ] Validation : Tous les alias accessibles

---

## 📝 Notes d'Implémentation

### Tenant de Référence : "rozas"

Le tenant **`rozas`** est utilisé comme tenant de référence pour la Phase 3 car :
- Déjà configuré avec domaine client (`rozas.gp`)
- Environnements lab/stinger/prod existants
- Tests Phase 1 et Phase 2 validés

### Dépendances Phase 2

La Phase 3 **nécessite** que la Phase 2 soit complétée :
- ✅ CLI interactif (`prompt`)
- ✅ Configuration déclarative (`intent-*.json`)
- ✅ Agrégation gateway automatique
- ✅ Processus de mise en production structuré
- ✅ Journalisation intentions

### Fichiers à Créer

**Sprint 0** :
- Extension `schemas/manifest.schema.json` : Structure domaines
- Structure `servers/` : Configuration serveurs

**Sprint 1** :
- Extension `lib/prompt/prompt.py` : Domaines clients
- Extension `lib/render/render_caddyfile.sh` : Domaines clients
- Extension `lib/preflight/preflight.sh` : Validation DNS

**Sprint 2** :
- `lib/server/preflight_server.sh` : Préflight serveur
- `lib/server/deploy_remote.sh` : Déploiement distant
- Extension `bin/dorevia.sh` : Commande `server`

**Sprint 3** :
- Extension `lib/prompt/prompt.py` : Alias
- Extension `lib/render/render_caddyfile.sh` : Alias
- `ZeDocs/V2/RUNBOOK_DNS.md` : Documentation DNS

**Sprint 4** :
- `lib/backup/backup.sh` : Backup serveur client
- `lib/restore/restore.sh` : Restore serveur client

**Sprint 5** :
- `tests/scenario_c_phase3_domaine_client_saas.sh`
- `tests/scenario_d_phase3_serveur_client.sh`
- `tests/scenario_e_phase3_alias.sh`
- `ZeDocs/V2/GUIDE_PHASE3.md`
- `ZeDocs/V2/RUNBOOK_DOMAINES_CLIENTS.md`
- `ZeDocs/V2/RUNBOOK_SERVEUR_CLIENT.md`

---

## 🔄 Historique des Mises à Jour

| Date | Sprint | Action | Détails |
|------|--------|--------|---------|
| 2026-01-02 | Phase 3 | 📝 Créé | Plan d'implémentation Phase 3 créé |

---

**Dernière mise à jour** : 2026-01-02  
**Version** : 1.0  
**Statut** : 📋 **Plan créé** — Prêt pour Sprint 0

