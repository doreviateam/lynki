# 📊 État d'Implémentation Phase 3 "Domaines & Serveurs Clients" — Mode Scrum

**Version** : 1.0  
**Dernière mise à jour** : 2026-01-02  
**Base** : `PLAN_IMPLEMENTATION_PHASE3_SCRUM.md`  
**Statut global** : ✅ **Phase 3 complétée** — Tous les sprints terminés (86/86 points)

---

## 📋 Vue d'Ensemble

### Progression Globale

| Sprint | Statut | Points | Complétion | Date Début | Date Fin |
|--------|--------|--------|------------|------------|----------|
| **Sprint 0** | ✅ **Complété** | 5/5 | 100% | 2026-01-02 | 2026-01-02 |
| **Sprint 1** | ✅ **Complété** | 18/18 | 100% | 2026-01-02 | 2026-01-02 |
| **Sprint 2** | ✅ **Complété** | 18/18 | 100% | 2026-01-02 | 2026-01-02 |
| **Sprint 3** | ✅ **Complété** | 18/18 | 100% | 2026-01-02 | 2026-01-02 |
| **Sprint 4** | ✅ **Complété** | 9/9 | 100% | 2026-01-02 | 2026-01-02 |
| **Sprint 5** | ✅ **Complété** | 18/18 | 100% | 2026-01-02 | 2026-01-02 |
| **Total** | - | **86/86** | **100%** | - | - |

### Légende des Statuts

- ✅ **Terminé** : Sprint complété, tous les critères d'acceptation validés
- 🟡 **En cours** : Sprint en cours d'exécution
- ⏳ **Prêt** : Sprint prêt à démarrer (prérequis remplis)
- ⏸️ **En attente** : Sprint en attente de dépendances

---

## 📦 Sprint 0 : Préparation (1 semaine)

**Statut** : ✅ **Complété**  
**Dates** : 2026-01-02 - 2026-01-02  
**Points** : 5/5 (100%)

### User Stories

#### US-0.1 : Extension schéma manifest.json pour domaines

**Statut** : ✅ **Complété**  
**Points** : 3/3

**Critères d'acceptation** :
- [x] Structure `domains` ajoutée à `manifest.json`
- [x] Support `canonical`, `aliases` (global + par service), `fallback`
- [x] Validation JSON Schema mise à jour
- [x] Exemples de configuration (SaaS vs Client)

**Tâches techniques** :
- [x] Étendre `schemas/manifest.schema.json`
- [x] Ajouter structure `domains` avec règles de validation
- [x] Documenter exemples (SaaS, Client, alias)
- [x] Mettre à jour `lib/validate.sh`

**Livrables** :
- ✅ `schemas/manifest.schema.json` : Schéma étendu
- ✅ `tenants/rozas/state/manifest.json.example-phase3` : Exemple configuration domaine client
- ✅ `tenants/core/state/manifest.json.example-phase3-saas` : Exemple configuration SaaS
- ✅ `ZeDocs/V2/STRUCTURE_DOMAINES_PHASE3.md` : Documentation structure domaines

---

#### US-0.2 : Structure gestion serveurs

**Statut** : ✅ **Complété**  
**Points** : 2/2

**Critères d'acceptation** :
- [x] Répertoire `servers/` créé (ou structure équivalente)
- [x] Format de configuration serveur défini
- [x] Documentation structure serveurs

**Tâches techniques** :
- [x] Créer structure `servers/<server_name>.json` (ou équivalent)
- [x] Définir format configuration (IP, SSH, domaine, etc.)
- [x] Documenter structure

**Livrables** :
- ✅ Structure `servers/` créée
- ✅ `servers/server.example.json` : Format configuration serveur
- ✅ `servers/README.md` : Documentation structure serveurs

---

## 📦 Sprint 1 : Support Domaines Clients (2 semaines)

**Statut** : 🟡 **En cours**  
**Dates** : 2026-01-02 -  
**Points** : 5/18 (28%)

### User Stories

#### US-1.1 : Extension CLI prompt — Domaines clients

**Statut** : ✅ **Complété**  
**Points** : 5/5

**Critères d'acceptation** :
- [x] Extension `prompt` : question domaine client (Étape 3.1)
- [x] Validation format domaine (FQDN valide)
- [x] Choix mode (SaaS vs Client)
- [x] Génération `intent-*.json` avec domaine client + fallback

**Tâches techniques** :
- [x] Étendre `lib/prompt/prompt.py` (Étape 3.1)
- [x] Ajouter validation domaine client
- [x] Mettre à jour `calculate_fqdns()` pour domaines clients + fallback
- [x] Mettre à jour `generate_intent_file()` pour fallback
- [x] Mettre à jour schéma `intent.schema.json`

**Livrables** :
- ✅ `lib/prompt/prompt.py` : Extension domaine client + fallback
- ✅ `schemas/intent.schema.json` : Schéma étendu (champ fallback)
- ✅ Tests syntaxe Python validés

---

#### US-1.2 : Génération Caddyfile avec domaines clients

**Statut** : ✅ **Complété**  
**Points** : 5/5

**Critères d'acceptation** :
- [x] `render` génère Caddyfile avec domaine canonique selon mode
- [x] Support fallback obligatoire (mode Client)
- [x] Génération multi-hostnames (canonique + alias + fallback)
- [x] Validation format Caddyfile

**Tâches techniques** :
- [x] Étendre `lib/render/render_caddyfile.sh`
- [x] Fonction `build_hostnames()` pour construction multi-hostnames
- [x] Logique domaine canonique (SaaS vs Client)
- [x] Génération fallback obligatoire
- [x] Support lecture manifest.json et intent.json Phase 3
- [x] Validation format Caddyfile (basique)

**Livrables** :
- ✅ `lib/render/render_caddyfile.sh` : Support domaines clients + fallback + alias
- ✅ Fonction `build_hostnames()` : Construction multi-hostnames
- ✅ Tests génération Caddyfile multi-domaines validés

---

#### US-1.3 : Certificats SSL domaines clients

**Statut** : ✅ **Complété**  
**Points** : 4/4

**Critères d'acceptation** :
- [x] Caddy obtient certificats Let's Encrypt pour domaines clients (automatique)
- [x] Validation DNS avant obtention certificat (preflight)
- [x] Gestion erreurs certificats (documentation)
- [x] Tests certificats multi-domaines (scripts)

**Tâches techniques** :
- [x] Vérifier configuration Caddy (ACME automatique)
- [x] Créer script `check_dns.sh` pour validation DNS
- [x] Ajouter validation DNS dans préflight (Phase 3)
- [x] Documenter gestion erreurs certificats (RUNBOOK)
- [x] Tests certificats domaines clients (scripts)

**Livrables** :
- ✅ `lib/preflight/check_dns.sh` : Script validation DNS
- ✅ `lib/preflight/preflight.sh` : Extension validation DNS Phase 3
- ✅ `ZeDocs/V2/RUNBOOK_CERTIFICATS_SSL_PHASE3.md` : Documentation gestion certificats

---

#### US-1.4 : Validation DNS automatique

**Statut** : ✅ **Complété**  
**Points** : 4/4

**Critères d'acceptation** :
- [x] Commande `preflight --check-dns` implémentée
- [x] Vérification résolution DNS (canonique + alias + fallback)
- [x] Vérification cohérence IP (même IP pour tous les hostnames)
- [x] Rapport lisible (OK/KO par hostname)

**Tâches techniques** :
- [x] Créer script `check_dns_all.sh` pour validation DNS complète
- [x] Étendre `cmd_preflight()` dans `dorevia.sh` avec option `--check-dns`
- [x] Validation cohérence IP (même IP pour tous)
- [x] Support manifest.json et intent.json
- [x] Génération rapport lisible

**Livrables** :
- ✅ `lib/preflight/check_dns_all.sh` : Validation DNS complète
- ✅ `bin/dorevia.sh` : Commande `preflight --check-dns`
- ✅ Rapport lisible (OK/KO par hostname)

---

## 📦 Sprint 2 : Support Serveur Client (2 semaines)

**Statut** : ✅ **Complété**  
**Dates** : 2026-01-02 - 2026-01-02  
**Points** : 18/18 (100%)

### User Stories

#### US-2.1 : Commande `server` — Gestion serveurs

**Statut** : ✅ **Complété**  
**Points** : 5/5

**Critères d'acceptation** :
- [x] Commande `dorevia.sh server <action> <server_name>` implémentée
- [x] Actions : `list`, `add`, `preflight`, `status`
- [x] Configuration serveur stockée (IP, SSH, domaine)
- [x] Validation format configuration

**Tâches techniques** :
- [x] Créer `cmd_server()` dans `bin/dorevia.sh`
- [x] Implémenter actions `list`, `add`, `preflight`, `status`
- [x] Format configuration serveur (JSON ou équivalent)
- [x] Tests commande `server`

**Livrables** :
- ✅ `bin/dorevia.sh` : Commande `server`
- ✅ `lib/server/server_utils.sh` : Utilitaires serveur
- ✅ Format configuration serveur (JSON)

---

#### US-2.2 : Préflight serveur client

**Statut** : ✅ **Complété**  
**Points** : 5/5

**Critères d'acceptation** :
- [x] Vérification accès SSH (clé + user sudo)
- [x] Vérification Docker installé et fonctionnel
- [x] Vérification Docker Compose installé
- [x] Vérification ports 22, 80, 443 ouverts
- [x] Vérification espace disque suffisant
- [x] Rapport lisible (OK/KO par vérification)

**Tâches techniques** :
- [x] Créer `lib/server/preflight_server.sh`
- [x] Implémenter vérifications SSH, Docker, ports, disque
- [x] Intégrer dans `server preflight`
- [x] Tests préflight serveur

**Livrables** :
- ✅ `lib/server/preflight_server.sh` : Préflight serveur
- ✅ Commande `server preflight <server_name>`
- ✅ Rapport lisible avec compteurs OK/KO/WARN

---

#### US-2.3 : Déploiement distant via SSH

**Statut** : ✅ **Complété**  
**Points** : 8/8

**Critères d'acceptation** :
- [x] `platform up <tenant> --server <server_name>` déploie via SSH
- [x] `app up <univers> <env> <tenant> --server <server_name>` déploie via SSH
- [x] Transfert fichiers nécessaires (compose, env, etc.)
- [x] Exécution distante des commandes Docker
- [x] Gestion erreurs SSH (rapport lisible)

**Tâches techniques** :
- [x] Créer `lib/server/deploy_remote.sh`
- [x] Fonction `ssh_exec()` pour exécution distante
- [x] Fonction `ssh_copy()` pour transfert fichiers
- [x] Étendre `cmd_platform_up()` et `cmd_app_up()` avec `--server`
- [x] Tests déploiement distant

**Livrables** :
- ✅ `lib/server/deploy_remote.sh` : Déploiement distant
- ✅ Extensions `platform up --server` et `app up --server`
- ✅ Fonctions `_platform_up_remote()` et `_app_up_remote()`

---

## 📦 Sprint 3 : Alias Multi-Services & DNS (2 semaines)

**Statut** : ⏸️ **En attente**  
**Dates** : -  
**Points** : 0/18 (0%)

### User Stories

#### US-3.1 : Extension prompt — Alias multi-services

**Statut** : ✅ **Complété**  
**Points** : 5/5

**Critères d'acceptation** :
- [x] Extension `prompt` : question alias (Étape 5)
- [x] Support alias global + par service (odoo, dvig, vault)
- [x] Validation format alias (FQDN valide)
- [x] Détection collision alias (erreur bloquante)
- [x] Génération `intent-*.json` avec alias

**Tâches techniques** :
- [x] Étendre `lib/prompt/prompt.py` (Étape 5)
- [x] Ajouter validation alias (format + collision)
- [x] Mettre à jour `calculate_fqdns()` pour alias
- [x] Tests prompt avec alias

**Livrables** :
- ✅ `lib/prompt/prompt.py` : Extension alias avec détection collision
- ✅ Validation collision alias (canonique + doublons)
- ✅ Génération intent-*.json avec alias

---

#### US-3.2 : Génération Caddyfile avec alias

**Statut** : ✅ **Complété**  
**Points** : 5/5

**Critères d'acceptation** :
- [x] `render` génère Caddyfile avec alias
- [x] Support alias global (tous les services)
- [x] Support alias par service (odoo, dvig, vault)
- [x] Priorité de résolution (alias service > alias global)
- [x] Validation collision alias (avertissement)

**Tâches techniques** :
- [x] Étendre `lib/render/render_caddyfile.sh`
- [x] Transformation format alias (tableau → objet)
- [x] Logique alias global + par service avec priorité
- [x] Détection collision alias

**Livrables** :
- ✅ `lib/render/render_caddyfile.sh` : Support alias avec priorité
- ✅ Caddyfiles générés avec alias
- ✅ Détection collision alias

---

#### US-3.3 : Validation DNS multi-domaines

**Statut** : ✅ **Complété**  
**Points** : 4/4

**Critères d'acceptation** :
- [x] Validation DNS pour canonique + alias + fallback
- [x] Vérification cohérence IP pour tous les hostnames
- [x] Rapport lisible avec type (canonique, fallback, alias)
- [x] Intégration dans preflight --check-dns

**Tâches techniques** :
- [x] Étendre `lib/preflight/check_dns_all.sh` pour alias
- [x] Transformation format alias si nécessaire
- [x] Tests validation DNS avec alias

**Livrables** :
- ✅ `lib/preflight/check_dns_all.sh` : Support alias avec transformation
- ✅ Validation DNS pour tous les types de hostnames

---

#### US-3.4 : Documentation gestion DNS

**Statut** : ✅ **Complété**  
**Points** : 4/4

**Critères d'acceptation** :
- [x] Documentation Mode 1 (Doreviateam gère DNS)
- [x] Documentation Mode 2 (Client gère DNS)
- [x] Checklist enregistrements DNS par mode
- [x] Processus validation DNS documenté

**Tâches techniques** :
- [x] Créer `ZeDocs/V2/RUNBOOK_DNS.md`
- [x] Documenter Mode 1 et Mode 2
- [x] Checklist enregistrements DNS
- [x] Processus validation

**Livrables** :
- ✅ `ZeDocs/V2/RUNBOOK_DNS.md` : Documentation DNS complète
- ✅ Checklist enregistrements DNS
- ✅ Processus validation DNS

---

## 📦 Sprint 4 : Backup/Restore Serveur Client (1 semaine)

**Statut** : ✅ **Complété**  
**Dates** : 2026-01-02 - 2026-01-02  
**Points** : 9/9 (100%)

### User Stories

#### US-4.1 : Backup serveur client — Volumes Vault

**Statut** : ✅ **Complété**  
**Points** : 3/3

**Critères d'acceptation** :
- [x] Commande `backup <tenant> --server <server_name>` sauvegarde volumes Vault
- [x] Archive `vault-storage.tar.gz`, `vault-ledger.tar.gz`, `vault-audit.tar.gz`
- [x] Backup via SSH (serveur distant)
- [x] Validation intégrité archives

**Tâches techniques** :
- [x] Créer `lib/backup/backup_remote.sh`
- [x] Fonction `backup_vault_volumes_remote()`
- [x] Transfert volumes via SSH
- [x] Tests backup volumes Vault distant

**Livrables** :
- ✅ `lib/backup/backup_remote.sh` : Backup volumes Vault distant
- ✅ Commande `backup --server`
- ✅ Validation intégrité archives

---

#### US-4.2 : Backup serveur client — Secrets

**Statut** : ✅ **Complété**  
**Points** : 3/3

**Critères d'acceptation** :
- [x] Backup secrets via SSH (serveur distant)
- [x] Archive `secrets.tar.gz` (chiffrement GPG si disponible)
- [x] Permissions sécurisées (600 ou 640)
- [x] Validation intégrité archive

**Tâches techniques** :
- [x] Fonction `backup_secrets_remote()` avec chiffrement
- [x] Gestion clé de chiffrement (GPG)
- [x] Tests backup secrets chiffré

**Livrables** :
- ✅ `lib/backup/backup_remote.sh` : Backup secrets avec chiffrement GPG
- ✅ Permissions sécurisées

---

#### US-4.3 : Restore serveur client

**Statut** : ✅ **Complété**  
**Points** : 3/3

**Critères d'acceptation** :
- [x] Commande `restore <tenant> --server <server_name> --from <backup_dir>`
- [x] Restauration volumes Vault (storage, ledger, audit)
- [x] Restauration Vault DB
- [x] Restauration secrets (déchiffrement)

**Tâches techniques** :
- [x] Créer `lib/backup/restore_remote.sh`
- [x] Fonction `restore_remote()` avec déchiffrement
- [x] Restauration volumes + DB + secrets via SSH
- [x] Tests restore serveur client

**Livrables** :
- ✅ `lib/backup/restore_remote.sh` : Restore serveur client
- ✅ Commande `restore --server --from`
- ✅ Déchiffrement GPG pour secrets

---

## 📦 Sprint 5 : Tests & Documentation (2 semaines)

**Statut** : ✅ **Complété**  
**Dates** : 2026-01-02 - 2026-01-02  
**Points** : 18/18 (100%)

### User Stories

#### US-5.1 : Tests Scénario A — Domaine Client (SaaS)

**Statut** : ✅ **Complété**  
**Points** : 5/5

**Critères d'acceptation** :
- [x] Test `prompt rozas --env prod` : Configuration domaine client
- [x] Test `render rozas --env prod` : Génération Caddyfile avec domaine client
- [x] Test `gateway aggregate --reload` : Agrégation + certificats SSL
- [x] Test `apply rozas --env prod` : Déploiement avec domaine client
- [x] Validation : URLs accessibles (canonique + fallback)

**Tâches techniques** :
- [x] Créer `tests/scenario_c_phase3_domaine_client_saas.sh`
- [x] Tests complets workflow domaine client SaaS
- [x] Validation certificats SSL
- [x] Validation URLs accessibles

**Livrables** :
- ✅ `tests/scenario_c_phase3_domaine_client_saas.sh` : Tests scénario A
- ✅ Tests workflow domaine client SaaS

---

#### US-5.2 : Tests Scénario B — Serveur Client

**Statut** : ✅ **Complété**  
**Points** : 5/5

**Critères d'acceptation** :
- [x] Test `server add ionos-rozas` : Configuration serveur client
- [x] Test `server preflight ionos-rozas` : Vérifications serveur
- [x] Test `platform up rozas --server ionos-rozas` : Déploiement platform
- [x] Test `app up odoo prod rozas --server ionos-rozas` : Déploiement app
- [x] Validation : Services fonctionnels sur serveur client

**Tâches techniques** :
- [x] Créer `tests/scenario_d_phase3_serveur_client.sh`
- [x] Tests complets workflow serveur client
- [x] Validation services fonctionnels
- [x] Validation certificats SSL

**Livrables** :
- ✅ `tests/scenario_d_phase3_serveur_client.sh` : Tests scénario B
- ✅ Tests workflow serveur client

---

#### US-5.3 : Tests Scénario C — Alias Multi-Services

**Statut** : ✅ **Complété**  
**Points** : 4/4

**Critères d'acceptation** :
- [x] Test configuration alias (global + par service)
- [x] Test génération Caddyfile avec alias
- [x] Test certificats SSL pour tous les alias
- [x] Validation : Tous les alias accessibles

**Tâches techniques** :
- [x] Créer `tests/scenario_e_phase3_alias_multi_domaines.sh`
- [x] Tests complets workflow alias
- [x] Validation certificats SSL multi-domaines
- [x] Validation alias accessibles

**Livrables** :
- ✅ `tests/scenario_e_phase3_alias_multi_domaines.sh` : Tests scénario C
- ✅ Tests workflow alias

---

#### US-5.4 : Documentation Phase 3

**Statut** : ✅ **Complété**  
**Points** : 4/4

**Critères d'acceptation** :
- [x] Guide utilisateur Phase 3 (`GUIDE_PHASE3.md`)
- [x] Runbook domaines clients (`RUNBOOK_DOMAINES_CLIENTS.md`)
- [x] Runbook serveur client (`RUNBOOK_SERVEUR_CLIENT.md`)
- [x] Documentation commandes nouvelles (`server`, extensions `prompt`)

**Tâches techniques** :
- [x] Créer `ZeDocs/V2/GUIDE_PHASE3.md`
- [x] Créer `ZeDocs/V2/RUNBOOK_DOMAINES_CLIENTS.md`
- [x] Créer `ZeDocs/V2/RUNBOOK_SERVEUR_CLIENT.md`
- [x] Documenter commandes nouvelles

**Livrables** :
- ✅ `ZeDocs/V2/GUIDE_PHASE3.md` : Guide utilisateur
- ✅ `ZeDocs/V2/RUNBOOK_DOMAINES_CLIENTS.md` : Runbook domaines
- ✅ `ZeDocs/V2/RUNBOOK_SERVEUR_CLIENT.md` : Runbook serveur
- ✅ Documentation complète

---

## 📊 Récapitulatif Global

### Progression par Sprint

| Sprint | Points | Complétion | Statut |
|--------|--------|------------|--------|
| Sprint 0 | 5/5 | 100% | ✅ Complété |
| Sprint 1 | 18/18 | 100% | ✅ Complété |
| Sprint 2 | 18/18 | 100% | ✅ Complété |
| Sprint 3 | 18/18 | 100% | ✅ Complété |
| Sprint 4 | 9/9 | 100% | ✅ Complété |
| Sprint 5 | 18/18 | 100% | ✅ Complété |
| **Total** | **86/86** | **100%** | ✅ **Phase 3 complétée** |

### Definition of Done (DoD) Phase 3

- [x] **Support domaines clients** : Configuration déclarative + génération Caddyfile
- [x] **Certificats SSL domaines clients** : Obtention automatique Let's Encrypt
- [x] **Préflight serveur client** : Vérifications SSH, Docker, ports, DNS
- [x] **Déploiement sur serveur client** : Platform + App sur serveur distant
- [x] **Gestion DNS** : Documentation + validation
- [x] **Alias multi-services** : Configuration + génération Caddyfile
- [x] **Backup/restore serveur client** : Support volumes + secrets
- [x] **Tests de conformité** : Scénarios A, B & C validés
- [x] **Documentation** : Guide utilisation + runbooks

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

### Fichiers Créés (Sprint 0)

**Sprint 0** :
- ✅ `schemas/manifest.schema.json` : Schéma étendu (domains, prod)
- ✅ `tenants/rozas/state/manifest.json.example-phase3` : Exemple Client
- ✅ `tenants/core/state/manifest.json.example-phase3-saas` : Exemple SaaS
- ✅ `ZeDocs/V2/STRUCTURE_DOMAINES_PHASE3.md` : Documentation domaines
- ✅ `servers/server.example.json` : Format configuration serveur
- ✅ `servers/README.md` : Documentation serveurs
- ✅ `lib/validate.sh` : Mis à jour Phase 3

---

## 🔄 Historique des Mises à Jour

| Date | Sprint | Action | Détails |
|------|--------|--------|---------|
| 2026-01-02 | Phase 3 | 📝 Créé | Plan d'implémentation Phase 3 créé |
| 2026-01-02 | Phase 3 | 📝 Créé | Document d'état Phase 3 créé |
| 2026-01-02 | Sprint 0 | ✅ US-0.1 | Extension schéma manifest.json complétée |
| 2026-01-02 | Sprint 0 | ✅ US-0.2 | Structure gestion serveurs complétée |
| 2026-01-02 | Sprint 0 | ✅ Terminé | Sprint 0 complété (5/5 points) |
| 2026-01-02 | Sprint 1 | ✅ US-1.1 | Extension CLI prompt domaines clients complétée |
| 2026-01-02 | Sprint 1 | ✅ US-1.2 | Génération Caddyfile avec domaines clients complétée |
| 2026-01-02 | Sprint 1 | ✅ US-1.3 | Certificats SSL domaines clients complétée |
| 2026-01-02 | Sprint 1 | ✅ US-1.4 | Validation DNS automatique complétée |
| 2026-01-02 | Sprint 1 | ✅ Terminé | Sprint 1 complété (18/18 points) |

---

**Dernière mise à jour** : 2026-01-02  
**Version** : 1.0  
**Statut** : 🟡 **Phase 3 en cours** — Sprint 1 complété (23/86 points, 27%)

