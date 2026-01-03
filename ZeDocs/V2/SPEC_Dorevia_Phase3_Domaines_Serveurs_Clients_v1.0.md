# 🌐 DOREVIA — SPEC d'implémentation Phase 3 "Domaines & Serveurs Clients" (v1.0)

**Statut :** Spécification d'implémentation (phase prévue)  
**Dépendance :** `SPEC_Dorevia_Phase2_Intention_Execution_v1.0.md` (Phase 2 complétée)  
**Audience :** Dev plateforme / Exploitation / AMOA technique / Clients  
**Objectif :** Support complet des domaines clients et déploiement sur serveurs clients dédiés

---

## 0. Rappel du pourquoi (une phrase)

Phase 3 vise à **permettre aux clients d'utiliser leurs propres domaines et serveurs** tout en conservant la maîtrise technique et l'auditabilité de la plateforme Dorevia.

---

## 1. Portée de la Phase 3

### 1.1 Inclus (IN SCOPE)

1) **Support complet domaines clients** : Gestion avancée domaines clients en production  
2) **Support serveur client** : Déploiement sur serveur client (IONOS, etc.)  
3) **Gestion avancée alias multi-services** : Alias complexes multi-services  
4) **Configuration multi-domaines** : Plusieurs domaines par tenant (canonique + alias)  
5) **Gestion DNS déléguée** : Support DNS délégué ou géré par client  
6) **Certificats SSL multi-domaines** : Gestion automatique certificats pour domaines clients

### 1.2 Exclus (OUT OF SCOPE)

- Audit bundle complet, backup/restore avancé (Phase 4)  
- Migration automatique de données entre serveurs (Phase 4)  
- Gestion de clusters multi-serveurs (Phase 5)  
- Support de domaines wildcard complexes (Phase 5)

---

## 2. Définition de "Fait" (Definition of Done)

La Phase 3 est considérée terminée si :

- un **tenant peut utiliser un domaine client** en production (canonique ou alias)
- un **déploiement sur serveur client** est possible et documenté
- les **certificats SSL sont obtenus automatiquement** pour les domaines clients
- la **gestion DNS** est documentée (déléguée ou gérée par client)
- les **alias multi-services** sont supportés et fonctionnels
- la **configuration multi-domaines** est déclarative et versionnable

---

## 3. Spécification — Support Domaines Clients

### 3.1 Principe Directeur

**Règle normative** : Le **domaine canonique** dépend explicitement du **mode de déploiement PROD**.

- **Mode SaaS Dorevia** :
  - Domaine canonique = `*.doreviateam.com`
  - Le domaine client ne peut être utilisé qu'en **alias**.
- **Mode Serveur Client** :
  - Domaine canonique = domaine client déclaré (`<tenant>.<domain_client>`)
  - Le domaine Dorevia est conservé en **fallback obligatoire**.

**Format canonique** :
```
<univers>.<env>.<tenant>.<domain_canonique>
```

**Exemples (Mode Serveur Client)** :
- `odoo.prod.rozas.rozas.gp` (canonique)
- `erp.rozas.gp` (alias)
- `api.rozas.gp` (alias)
- `odoo.prod.rozas.doreviateam.com` (fallback obligatoire)

### 3.2 Domaine de Secours (Fallback)

**Règle normative** : Le domaine de secours dépend du mode de déploiement.

- **Mode SaaS Dorevia** :
  - Domaine canonique = `*.doreviateam.com`
  - Domaine client = alias uniquement
- **Mode Serveur Client** :
  - Domaine canonique = domaine client
  - Domaine Dorevia = **fallback obligatoire**

**Objectifs** :
- Support/diagnostic simple (URL stable)
- Rollback rapide si problème DNS/registrar
- Continuité de service
- Éviter toute ambiguïté contractuelle

**Format fallback** :
```
<univers>.<env>.<tenant>.doreviateam.com
```

### 3.3 Configuration Déclarative

**Fichier** : `tenants/<tenant>/state/manifest.json`

**Structure** :
```json
{
  "tenant": "rozas",
  "base_domain": "doreviateam.com",
  "domains": {
    "canonical": "rozas.gp",
    "aliases": ["erp.rozas.gp", "api.rozas.gp"],
    "fallback": true
  },
  "prod": {
    "target": "client",
    "server_name": "ionos-rozas",
    "public_ip": "192.168.1.100",
    "base_domain": "rozas.gp"
  }
}
```

### 3.4 Génération Caddyfile

**Règle** : Un même service peut être accessible via plusieurs hostnames (canonique + alias + fallback).

**Exemple Caddyfile** :
```caddy
# Canonique + alias + fallback
odoo.prod.rozas.rozas.gp, erp.rozas.gp, odoo.prod.rozas.doreviateam.com {
  reverse_proxy odoo_prod_rozas:8069
}

# Services cœur (1 par tenant, PROD uniquement, avec alias si configuré)
# Règle normative : DVIG/Vault exposés sans environnement, PROD uniquement
# lab et stinger ne sont pas exposés publiquement par défaut
dvig.rozas.rozas.gp, dvig.rozas.doreviateam.com {
  reverse_proxy dvig-rozas:8080
}

vault.rozas.rozas.gp, vault.rozas.doreviateam.com {
  reverse_proxy vault-rozas:8080
}
```

### 3.5 Certificats SSL

**Gestion automatique** : Caddy obtient automatiquement les certificats Let's Encrypt pour tous les hostnames (canonique + alias + fallback).

**Prérequis** :
- Enregistrements DNS propagés vers l'IP du serveur
- Ports 80/443 ouverts
- Accès ACME (Let's Encrypt) depuis le serveur

---

## 4. Spécification — Support Serveur Client

### 4.1 Principe Directeur

**Décision** : La PROD peut être déployée sur un **serveur choisi** (Doreviateam ou serveur client).

**Modes de déploiement** :
- **SaaS Dorevia** : PROD sur serveur Doreviateam (standard)
- **Serveur client** : PROD sur serveur client dédié (IONOS, etc.)
- **Hybride** : PROD principale sur serveur client + warm standby chez Doreviateam

### 4.2 Données Minimales Requises

**Pour déploiement sur serveur client** :
- IP publique du serveur
- Accès SSH (clé) + user sudo
- Domaine (ou sous-domaines) + qui gère le DNS
- Ports 22, 80, 443 ouverts
- Accès registry Docker (si images privées)

### 4.3 Configuration Serveur

**Fichier** : `tenants/<tenant>/state/manifest.json`

**Structure** :
```json
{
  "prod": {
    "target": "client",
    "server_name": "ionos-rozas",
    "public_ip": "192.168.1.100",
    "ssh_user": "dorevia",
    "ssh_key_path": "~/.ssh/id_rsa_rozas",
    "base_domain": "rozas.gp",
    "dns_managed_by": "client"
  }
}
```

### 4.4 Déploiement sur Serveur Client

**Décision assumée** : Le déploiement distant s'effectue via **SSH direct** en Phase 3.

**Workflow** :
```
1. Préflight serveur client (SSH, Docker, ports)
2. Configuration DNS (client ou Doreviateam)
3. Déploiement platform (DVIG/Vault + volumes) via SSH
4. Token issue (odoo prod <tenant>)
5. Déploiement app (Odoo PROD) via SSH
6. Validation (healthcheck + certificats SSL)
```

**Stratégie** :
- SSH direct est la stratégie officielle Phase 3
- Le recours à un agent, Ansible ou équivalent n'est **pas requis** en Phase 3
- Sera évalué en Phase 4 si la complexité opérationnelle dépasse le seuil acceptable

**Recommandation** : Odoo PROD, DVIG et Vault sont sur le **même site** (même serveur) pour éviter dépendances réseau.

### 4.5 Isolation et Sécurité

**Règles** :
- Isolation complète par tenant (réseaux Docker séparés)
- Secrets stockés localement (hors Git)
- Accès SSH sécurisé (clés, pas mots de passe)
- Firewall configuré (ports minimaux)

---

## 5. Spécification — Gestion DNS

### 5.1 Modes de Gestion DNS

**Mode 1 (Recommandé)** : Doreviateam gère le DNS
- Client délègue (NS) ou transfère la gestion DNS
- Doreviateam assure continuité (renouvellement/monitoring)
- Support simplifié

**Mode 2** : Client gère le DNS
- Doreviateam fournit checklist d'enregistrements
- Client applique, Doreviateam valide
- Plus de contrôle client, mais responsabilité partagée

### 5.2 Enregistrements DNS Requis

**Pour domaine client** :
```
# Apps (par environnement)
odoo.prod.<tenant>.<domain_client>  → A <IP_SERVEUR>
odoo.stinger.<tenant>.<domain_client>  → A <IP_SERVEUR> (si stinger sur serveur client)

# Services cœur (1 par tenant, sans environnement, PROD uniquement)
# Règle normative : lab et stinger ne sont pas exposés publiquement par défaut
dvig.<tenant>.<domain_client>  → A <IP_SERVEUR>
vault.<tenant>.<domain_client>  → A <IP_SERVEUR>
```

**Pour domaine fallback** :
```
# Même structure avec doreviateam.com
odoo.prod.<tenant>.doreviateam.com  → A <IP_SERVEUR>
dvig.<tenant>.doreviateam.com  → A <IP_SERVEUR>
vault.<tenant>.doreviateam.com  → A <IP_SERVEUR>
```

### 5.3 Validation DNS

**Préflight** : Vérification automatique de la résolution DNS avant déploiement.

**Commande** :
```bash
dorevia.sh preflight <tenant> --env prod --check-dns
```

**Vérifications** :
- Résolution DNS pour tous les hostnames (canonique + alias + fallback)
- Cohérence IP (même IP pour tous les hostnames d'un tenant)
- TTL acceptable (< 3600 secondes recommandé)

---

## 6. Spécification — Alias Multi-Services

### 6.1 Principe

**Règle normative** : Un **alias DNS ne peut appartenir qu'à un seul scope fonctionnel**.

**Scopes autorisés** :
- `global` : Tous les services d'un tenant
- `odoo` : Service Odoo uniquement
- `dvig` : Service DVIG uniquement
- `vault` : Service Vault uniquement

**Règles** :
- Un alias ne peut être déclaré que **dans un seul scope**.
- Priorité de résolution :
  1. Alias par service
  2. Alias global
- Toute collision détectée lors du rendu (`render`) entraîne une **erreur bloquante**.

**Objectif** :
- Éviter les collisions de routage
- Garantir la lisibilité et la maintenabilité
- Sécuriser la génération automatique des Caddyfiles

### 6.2 Configuration

**Fichier** : `tenants/<tenant>/state/manifest.json`

**Structure** :
```json
{
  "domains": {
    "canonical": "rozas.gp",
    "aliases": {
      "global": ["erp.rozas.gp"],
      "odoo": ["erp.rozas.gp", "crm.rozas.gp"],
      "dvig": ["api.rozas.gp", "auth.rozas.gp"],
      "vault": ["docs.rozas.gp"]
    }
  }
}
```

### 6.3 Génération Caddyfile

**Règle** : Tous les hostnames (canonique + alias) sont agrégés dans un même bloc Caddy.

**Exemple** :
```caddy
# Odoo avec alias
odoo.prod.rozas.rozas.gp, erp.rozas.gp, crm.rozas.gp {
  reverse_proxy odoo_prod_rozas:8069
}

# DVIG avec alias
dvig.rozas.rozas.gp, api.rozas.gp, auth.rozas.gp {
  reverse_proxy dvig-rozas:8080
}
```

### 6.4 Certificats SSL Multi-Domaines

**Gestion automatique** : Caddy obtient un certificat SAN (Subject Alternative Name) pour tous les hostnames d'un même bloc.

**Limite Let's Encrypt** : 100 domaines par certificat (suffisant pour la plupart des cas).

---

## 7. Spécification — Processus de Mise en Production Client

### 7.1 Phase 0 — Préconditions

**Vérifications** :
- Tenant existe
- Environnement `stinger` validé
- Décision serveur client prise (SaaS vs Client vs Hybride)
- Domaine client choisi (si applicable)
- Accès serveur client obtenu (si applicable)

### 7.2 Phase 1 — Configuration DNS

**Actions** :
1. Créer enregistrements DNS (canonique + alias + fallback)
2. Vérifier propagation DNS
3. Valider résolution avant déploiement

**Responsabilité** :
- Mode 1 (Doreviateam) : Doreviateam crée enregistrements
- Mode 2 (Client) : Client crée, Doreviateam valide

### 7.3 Phase 2 — Préflight Serveur Client

**Vérifications automatisées** :
- Accès SSH (clé + user sudo)
- Docker installé et fonctionnel
- Docker Compose installé
- Ports 22, 80, 443 ouverts
- Accès registry Docker (si images privées)
- Espace disque suffisant
- Résolution DNS (tous les hostnames)

**Résultat** :
- ✅ OK → passage phase suivante
- ❌ KO → rapport lisible, arrêt

### 7.4 Phase 3 — Déploiement Platform

**Actions** :
1. Créer réseaux Docker (isolés par tenant)
2. Déployer DVIG (avec volumes persistants)
3. Déployer Vault (avec volumes persistants)
4. Valider healthchecks

**Commande** :
```bash
dorevia.sh platform up <tenant> --server <server_name>
```

### 7.5 Phase 4 — Déploiement App

**Actions** :
1. Token issue (odoo prod <tenant>)
2. Déploiement Odoo PROD
3. Configuration reverse-proxy (Caddy)
4. Obtention certificats SSL

**Commande** :
```bash
dorevia.sh app up odoo prod <tenant> --server <server_name>
```

### 7.6 Phase 5 — Validation Post-Prod

**Contrôles** :
- URLs accessibles (canonique + alias + fallback)
- Certificats SSL valides
- Services fonctionnels (healthcheck)
- Isolation garantie (réseaux séparés)

---

## 8. Spécification — Backup/Restore (Serveur Client)

### 8.1 Scope Backup

**Pour un tenant sur serveur client** :
- Vault DB (PostgreSQL) + volumes :
  - `vault_storage_<tenant>` (obligatoire)
  - `vault_ledger_<tenant>` (recommandé)
  - `vault_audit_<tenant>` (recommandé)
- Odoo DB (PostgreSQL) + filestore (volume data)
- Secrets (tokens DVIG) hors Git

**Règle normative — Gestion des Secrets** :
- Les secrets ne doivent **jamais** être stockés dans Git
- Stockage local sur le serveur cible
- Permissions recommandées : propriétaire `dorevia`, permissions `600` ou `640`
- Rotation minimale requise :
  - à chaque mise en production
  - lors d'un incident de sécurité
- Les archives de secrets (backup) doivent être **chiffrées**

### 8.2 Règle d'Or

**Un backup n'existe que si un restore a déjà été testé** (au moins une fois sur une sandbox).

### 8.3 Processus Backup

**Commande** :
```bash
dorevia.sh backup <tenant> --server <server_name> --output <backup_dir>
```

**Artefacts** :
- `vault-db.dump` : Dump PostgreSQL Vault
- `vault-storage.tar.gz` : Archive volume storage
- `odoo-db.dump` : Dump PostgreSQL Odoo
- `odoo-filestore.tar.gz` : Archive filestore
- `secrets.tar.gz` : Archive secrets (chiffré)

### 8.4 Processus Restore

**Commande** :
```bash
dorevia.sh restore <tenant> --server <server_name> --from <backup_dir>
```

**Étapes** :
1. Restaurer Vault DB + volumes
2. Restaurer Odoo DB + filestore
3. Restaurer secrets
4. Valider healthchecks

---

## 9. Spécification — CLI Extensions

### 9.1 Commande `prompt` (Extension)

**Nouvelles questions** :
- Étape 3 : Mode de production (SaaS vs Client vs Hybride)
- Étape 3.1 : Si Client → Domaine client, serveur, DNS
- Étape 5 : Alias (global + par service)

### 9.2 Commande `server`

**Nouvelle commande** : `dorevia.sh server <action> <server_name>`

**Actions** :
- `list` : Lister serveurs configurés
- `add` : Ajouter serveur (SSH, IP, etc.)
- `preflight` : Préflight serveur
- `status` : État serveur (services, santé)

### 9.3 Commande `backup` / `restore`

**Extensions** :
- Support `--server <server_name>` pour backup/restore distant
- Support volumes Vault (storage, ledger, audit)
- Support secrets (chiffrement)

---

## 10. Backlog Technique Phase 3 (Priorisé)

### P0 — Must have

1. **Support domaines clients** : Configuration déclarative + génération Caddyfile
2. **Certificats SSL domaines clients** : Obtention automatique Let's Encrypt
3. **Préflight serveur client** : Vérifications SSH, Docker, ports, DNS
4. **Déploiement sur serveur client** : Platform + App sur serveur distant
5. **Gestion DNS** : Documentation + validation

### P1 — Should have

6. **Alias multi-services** : Configuration + génération Caddyfile
7. **Backup/restore serveur client** : Support volumes + secrets
8. **Commande `server`** : Gestion serveurs configurés
9. **Validation DNS** : Préflight automatique résolution DNS

### P2 — Nice to have

10. **Mode hybride** : Warm standby automatique
11. **Monitoring multi-serveurs** : Dashboard état serveurs
12. **Migration automatique** : Transfert tenant entre serveurs

---

## 11. Critères d'Acceptation Phase 3

### Scénario A — Domaine Client (SaaS Dorevia)

**Tests** :
- [ ] `prompt core --env prod` : Configuration domaine client
- [ ] `render core --env prod` : Génération Caddyfile avec domaine client
- [ ] `gateway aggregate --reload` : Agrégation + certificats SSL
- [ ] `apply core --env prod` : Déploiement avec domaine client
- [ ] Validation : URLs accessibles (canonique + fallback)

### Scénario B — Serveur Client

**Tests** :
- [ ] `server add ionos-rozas` : Configuration serveur client
- [ ] `server preflight ionos-rozas` : Vérifications serveur
- [ ] `platform up rozas --server ionos-rozas` : Déploiement platform
- [ ] `app up odoo prod rozas --server ionos-rozas` : Déploiement app
- [ ] Validation : Services fonctionnels sur serveur client

### Scénario C — Alias Multi-Services

**Tests** :
- [ ] Configuration alias (global + par service)
- [ ] Génération Caddyfile avec alias
- [ ] Certificats SSL pour tous les alias
- [ ] Validation : Tous les alias accessibles

---

## 12. Dépendances Phase 2

La Phase 3 **nécessite** que la Phase 2 soit complétée :

- ✅ CLI interactif (`prompt`)
- ✅ Configuration déclarative (`intent-*.json`)
- ✅ Agrégation gateway automatique
- ✅ Processus de mise en production structuré
- ✅ Journalisation intentions

---

## 13. Notes d'Implémentation

### 13.1 Gestion Multi-Domaines

**Recommandation** : Stocker configuration domaines dans `manifest.json` (source de vérité).

**Structure** :
```json
{
  "domains": {
    "canonical": "<domain_client>",
    "aliases": {
      "global": ["alias1", "alias2"],
      "odoo": ["alias-odoo"],
      "dvig": ["alias-dvig"],
      "vault": ["alias-vault"]
    },
    "fallback": true
  }
}
```

### 13.2 Déploiement Distant

**Approche** : Utiliser SSH pour exécution distante des commandes.

**Commande** :
```bash
ssh <user>@<server> "cd /opt/dorevia-platform && ./bin/dorevia.sh platform up <tenant>"
```

**Alternative** : Agent SSH ou Ansible (si complexité augmente).

### 13.3 Certificats SSL Multi-Domaines

**Caddy** : Gère automatiquement les certificats SAN pour tous les hostnames d'un bloc.

**Limite** : 100 domaines par certificat (Let's Encrypt).

**Recommandation** : Grouper hostnames par service pour optimiser certificats.

---

## 14. Conclusion

La Phase 3 introduit le **support complet des domaines clients et serveurs clients**, rendant la plateforme Dorevia flexible pour répondre aux besoins spécifiques des clients tout en conservant la maîtrise technique.

**Principales innovations** :
- Support domaines clients (canonique + alias + fallback)
- Déploiement sur serveur client dédié
- Gestion DNS (déléguée ou gérée par client)
- Alias multi-services
- Backup/restore serveur client

**Prochaine étape** : Plan d'implémentation Phase 3 (mode Scrum)

---

---

## 15. Appendice — Amendements Normatifs (v1.0-A)

**Date** : 2026-01-02  
**Statut** : Amendements validables  
**Objet** : Clarifications et règles normatives issues de la revue d'architecture

### 15.1 Règle Normative — Domaine Canonique

#### Principe

Le **domaine canonique** dépend explicitement du **mode de déploiement PROD**.

#### Règles

- **Mode SaaS Dorevia**
  - Domaine canonique = `*.doreviateam.com`
  - Le domaine client ne peut être utilisé qu'en **alias**.
- **Mode Serveur Client**
  - Domaine canonique = domaine client déclaré (`<tenant>.<domain_client>`)
  - Le domaine Dorevia est conservé en **fallback obligatoire**.

#### Objectifs

- Éviter toute ambiguïté contractuelle
- Garantir un point d'accès support stable
- Assurer une cohérence marketing et opérationnelle

### 15.2 Règle Normative — Services Cœur (DVIG / Vault)

#### Principe

Les services cœur **DVIG** et **Vault** sont exposés **sans environnement** dans l'URL.

#### Règles

- Les endpoints publics :
  - `dvig.<tenant>.<domain>`
  - `vault.<tenant>.<domain>`
- Correspondent **exclusivement à l'environnement PROD**.
- Les environnements `lab` et `stinger` :
  - ne sont **pas exposés publiquement par défaut**
  - peuvent être activés **explicitement** à des fins de debug contrôlé.

#### Justification

- Réduction de la surface d'attaque
- Simplification DNS
- Lisibilité produit

### 15.3 Règle Normative — Alias Multi-Services

#### Principe

Un **alias DNS ne peut appartenir qu'à un seul scope fonctionnel**.

#### Scopes autorisés

- `global`
- `odoo`
- `dvig`
- `vault`

#### Règles

- Un alias ne peut être déclaré que **dans un seul scope**.
- Priorité de résolution :
  1. Alias par service
  2. Alias global
- Toute collision détectée lors du rendu (`render`) entraîne une **erreur bloquante**.

#### Objectif

- Éviter les collisions de routage
- Garantir la lisibilité et la maintenabilité
- Sécuriser la génération automatique des Caddyfiles

### 15.4 Règle Normative — Gestion des Secrets

#### Principe

Les secrets sont **strictement séparés** du code et des manifests versionnés.

#### Règles minimales

- Les secrets :
  - ne doivent **jamais** être stockés dans Git
  - sont stockés localement sur le serveur cible
- Permissions recommandées :
  - propriétaire : `dorevia`
  - permissions : `600` ou `640`
- Une **rotation minimale** est requise :
  - à chaque mise en production
  - lors d'un incident de sécurité
- Les archives de secrets (backup) doivent être **chiffrées**.

#### Objectifs

- Conformité sécurité
- Protection contractuelle de Dorevia
- Préparation aux audits ultérieurs

### 15.5 Décision Assumée — Déploiement Distant par SSH

#### Principe

Le déploiement distant s'effectue via **SSH direct** en Phase 3.

#### Règle

- Le SSH direct est la stratégie officielle Phase 3.
- Le recours à un agent, Ansible ou équivalent :
  - n'est **pas requis** en Phase 3
  - sera évalué en Phase 4 si la complexité opérationnelle dépasse le seuil acceptable.

#### Objectif

- Simplicité
- Contrôle
- Réduction de la dette opérationnelle prématurée

### 15.6 Documents Complémentaires Recommandés

Les documents suivants sont recommandés mais **non bloquants** pour la Phase 3 :

- `Runbook_Domaines_Clients.md`
- `Runbook_Serveur_Client.md`

Ces documents doivent rester :
- courts
- actionnables
- orientés exploitation

### 15.7 Statut des Amendements

Ces amendements :
- ne remettent **aucun choix architectural** existant en cause
- clarifient les règles implicites
- sécurisent l'implémentation et l'exploitation Phase 3

---

**Dernière mise à jour** : 2026-01-02  
**Version** : 1.0-A (avec amendements normatifs)  
**Statut** : Spécification d'implémentation (prévue) — Amendements validables

