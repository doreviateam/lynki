# 🔍 Analyse d'Impact — Spécification v1.1 (LAB/STINGER/PROD + Mise en Production)

**Version** : 1.0  
**Date** : 2025-01-29  
**SPEC Analysée** : DOREVIA — Spécification LAB/STINGER/PROD + Mise en Production (server-driven) v1.1  
**Statut** : Analyse complète — Rapport pour implémentation

---

## 📋 Résumé Exécutif

### Verdict Global

La spécification v1.1 introduit des **concepts nouveaux** (notion de "site", PROD server-driven) qui nécessitent des **ajouts fonctionnels** sans refonte majeure. L'approche est **pragmatique** et **compatible** avec l'implémentation actuelle.

**Niveau d'impact** : 🟡 **IMPORTANT** — Ajouts fonctionnels nécessaires

### Écarts Identifiés

| Concept v1.1 | État Actuel | Conformité | Impact |
|--------------|-------------|------------|--------|
| **Notion de "site"** | Absente | ❌ **NON CONFORME** | 🟡 Important |
| **Gateway par site** | Gateway globale unique | ⚠️ **PARTIELLE** | 🟡 Important |
| **PROD serveur client** | Non géré | ❌ **NON CONFORME** | 🟡 Important |
| **Manifest minimal** | Manifest partiel | ⚠️ **PARTIELLE** | 🟢 Faible |
| **Workflow LAB→STINGER→PROD** | Déploiement direct | ⚠️ **PARTIELLE** | 🟡 Important |
| **Backup/Restore PROD** | Phase 6 en cours | ⚠️ **PARTIELLE** | 🟡 Important |
| **Domaines clients** | Non implémenté | ❌ **NON CONFORME** | 🟡 Important |

---

## 1. Analyse Notion de "Site"

### 1.1 Spécification v1.1

> Un **site** est un périmètre d'hébergement cohérent (même serveur ou même groupe de serveurs sous une même responsabilité) :
> - **Site Doreviateam** : héberge LAB + STINGER (par défaut)
> - **Site Client** : héberge la PROD quand le client veut exploiter sur son propre serveur

### 1.2 État Actuel

**Conformité** : ❌ **NON CONFORME** — Concept absent

**Implémentation actuelle** :
- Tous les environnements (LAB, STINGER, PROD) sur le même serveur
- Pas de distinction entre sites
- Pas de gestion de déploiement multi-sites

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Définir notion de site** dans `manifest.json` :
   ```json
   {
     "tenant": "rozas",
     "sites": {
       "doreviateam": {
         "server_name": "dorevia-server-1",
         "public_ip": "85.215.206.213",
         "environments": ["lab", "stinger"]
       },
       "client": {
         "server_name": "client-server-1",
         "public_ip": "xxx.xxx.xxx.xxx",
         "environments": ["prod"]
       }
     }
   }
   ```
2. **Documenter sites** dans documentation
3. **Validation** : Vérifier cohérence site/environnement avant déploiement

---

## 2. Analyse Gateway par Site

### 2.1 Spécification v1.1

> Un seul Caddy (gateway) par **site**.  
> La gateway route vers :
> - Apps : `odoo.lab.*`, `odoo.stinger.*`, `odoo.prod.*` (si le site porte la prod)
> - Platform : `dvig.<tenant>.*`, `vault.<tenant>.*`

### 2.2 État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- **Gateway globale unique** : `gateway-caddy` (un seul container)
- Routage vers tous les tenants et environnements
- Configuration : `units/gateway/Caddyfile` (manuel)

**Problème** :
- Si PROD sur serveur client, il faut une gateway séparée sur le serveur client
- Actuellement, une seule gateway gère tout

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Option A (Recommandée)** : Gateway par site
   - Site Doreviateam : `gateway-caddy-doreviateam`
   - Site Client : `gateway-caddy-client-<tenant>`
   - Chaque site a son propre Caddyfile
   
2. **Option B (Simplifiée)** : Gateway globale par serveur
   - Chaque serveur a sa propre gateway
   - Pas de notion explicite de "site" dans la gateway
   
3. **Génération Caddyfile** (optionnel v1.1) :
   - `dorevia.sh gateway render` : Génère Caddyfile depuis manifests
   - Actuellement : Caddyfile édité manuellement

**Recommandation** : **Option B** (simplifiée) pour v1.1, car :
- Plus simple à implémenter
- Pas de changement majeur d'architecture
- Compatible avec approche "server-driven"

---

## 3. Analyse PROD sur Serveur Client

### 3.1 Spécification v1.1

**S2 : PROD sur serveur client (recommandé quand client "exploite")**

**Données minimales à obtenir du client** :
- IP publique du serveur
- accès SSH (clé) + user sudo
- domaine (ou sous-domaines) + qui gère le DNS
- ports 22, 80, 443 ouverts

**Déploiement sur le site client** :
1. `gateway up`
2. `platform up <tenant>` (DVIG/Vault + volumes persistants)
3. `token issue odoo prod <tenant>`
4. `app up odoo prod <tenant>`
5. tests : healthcheck + login + persistance (force-recreate)

### 3.2 État Actuel

**Conformité** : ❌ **NON CONFORME** — Non géré

**Implémentation actuelle** :
- Tous les environnements sur le même serveur
- Pas de processus de déploiement sur serveur distant
- Pas de gestion multi-serveurs

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Documentation processus** :
   - Guide déploiement sur serveur client
   - Checklist prérequis serveur client
   - Procédure validation déploiement

2. **Scripts d'aide** (optionnel) :
   - Validation prérequis serveur (Docker, ports, DNS)
   - Script de déploiement automatisé (si accès SSH)

3. **Manifest enrichi** :
   ```json
   {
     "prod": {
       "target": "client",
       "server_name": "client-server-1",
       "public_ip": "xxx.xxx.xxx.xxx",
       "base_domain": "rozas.gp",
       "ssh_user": "deploy",
       "ssh_key_path": "/path/to/key"
     }
   }
   ```

4. **Validation** :
   - Vérifier serveur accessible avant déploiement
   - Vérifier DNS propagé
   - Vérifier ports ouverts

---

## 4. Analyse Manifest Minimal

### 4.1 Spécification v1.1

**Structure proposée** :
```json
{
  "tenant": "rozas",
  "base_domain": "doreviateam.com",
  "enabled_envs": ["lab","stinger"],
  "prod": {
    "target": "unknown",
    "server_name": null,
    "public_ip": null,
    "base_domain": null
  },
  "images": {
    "dvig": "dorevia/dvig:0.1.2-auth",
    "vault": "dorevia/vault:v1.3.0",
    "odoo": "odoo:18.0-20250819"
  }
}
```

**Valeurs possibles `prod.target`** : `doreviateam` | `client` | `hybrid` | `unknown`

### 4.2 État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Manifest actuel** (`tenants/core/state/manifest.json`) :
```json
{
  "tenant": "core",
  "created_at": "2025-01-28T00:00:00Z",
  "images": {
    "dvig": {...},
    "vault": {...}
  },
  "tokens_source": "..."
}
```

**Manque** :
- `base_domain`
- `enabled_envs`
- `prod` (target, server_name, public_ip, base_domain)

**Impact** : 🟢 **FAIBLE** — Enrichissement simple

**Actions requises** :
1. **Enrichir `manifest.json`** avec structure v1.1
2. **Migration** : Migrer tenants existants (`core`, `dido`, `rozas`)
3. **Validation** : Vérifier cohérence manifest avant déploiement

---

## 5. Analyse Workflow LAB → STINGER → PROD

### 5.1 Spécification v1.1

**Workflow nominal (chez Doreviateam) : LAB → STINGER**

1. Créer tenant (structure)
2. Tokens : `token issue odoo lab <tenant>`, `token issue odoo stinger <tenant>`
3. Démarrage : `gateway up`, `platform up <tenant>`, `app up odoo lab <tenant>`, `app up odoo stinger <tenant>`
4. DoD "STINGER Ready" : URLs OK, tokens valides, STINGER sur image taggée, Vault persistant

**Mise en production (PROD) — serveur-driven**

**Déclencheur** :
- STINGER validé (recette Go)
- version gelée/taggée
- serveur PROD choisi (S1/S2/S3)
- backup STINGER effectué

### 5.2 État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- Déploiement direct : `dorevia.sh app up odoo <env> <tenant>`
- Pas de workflow structuré LAB → STINGER → PROD
- Pas de validation "STINGER Ready"
- Pas de processus de mise en production

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Documentation workflow** :
   - Guide workflow LAB → STINGER
   - Guide mise en production PROD
   - Checklist "STINGER Ready"
   - Checklist "PROD Ready"

2. **Scripts d'aide** (optionnel) :
   - `dorevia.sh workflow stinger-ready <tenant>` : Vérifie DoD STINGER
   - `dorevia.sh workflow prod-ready <tenant>` : Vérifie prérequis PROD

3. **Validation** :
   - Vérifier image taggée en STINGER/PROD
   - Vérifier Vault persistant
   - Vérifier backup effectué avant PROD

---

## 6. Analyse Backup/Restore PROD

### 6.1 Spécification v1.1

**Exigences minimales pour PROD** :

**Vault** :
- DB PostgreSQL Vault (`pg_dump`)
- `vault_storage_<tenant>` (obligatoire)
- `vault_ledger_<tenant>` (recommandé)
- `vault_audit_<tenant>` (recommandé)

**Odoo** :
- DB PostgreSQL Odoo (par env)
- filestore / volume data

**Règle d'or** : Un backup n'est "valide" que si un **restore a déjà été testé**.

### 6.2 État Actuel

**Conformité** : ⚠️ **PARTIELLE** — Phase 6 en cours

**Implémentation actuelle** :
- ✅ Volumes Vault persistants (appliqué)
- ⚠️ Scripts backup/restore (Phase 6 en cours)
- ❌ Validation backup/restore (non implémenté)

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Finaliser Phase 6** :
   - Scripts `backup.sh` et `restore.sh`
   - Support volumes Vault dans backup
   - Validation restore testé

2. **Documentation** :
   - Guide backup PROD
   - Guide restore PROD
   - Procédure validation backup

3. **Automatisation** (optionnel) :
   - Backup automatique PROD (cron)
   - Validation restore périodique

---

## 7. Analyse Domaines Clients

### 7.1 Spécification v1.1

**Domaine client en PROD (option)** :
- `odoo.prod.rozas.rozas.gp`
- `dvig.rozas.rozas.gp`
- `vault.rozas.rozas.gp`

**Recommandation** :
- garder **un domaine fallback** `*.doreviateam.com` pour support/diagnostic
- mais **ne pas faire dépendre Odoo PROD (site client) d'un DVIG/Vault sur site Doreviateam**

### 7.2 État Actuel

**Conformité** : ❌ **NON CONFORME** — Non implémenté

**Implémentation actuelle** :
- Tous les domaines : `*.doreviateam.com`
- Pas de support domaines clients
- Pas de gestion alias

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Support domaines clients** :
   - Génération Caddyfile avec domaines clients (PROD uniquement)
   - Support alias (domaine client + fallback)

2. **Validation DNS** :
   - Vérifier DNS propagé avant déploiement
   - Script validation DNS

3. **Documentation** :
   - Guide configuration domaine client
   - Checklist DNS

**Note** : Déjà analysé dans `ANALYSE_POLITIQUE_DOMAINES_MULTI_DOMAINE.md`

---

## 8. Analyse Platform (DVIG/Vault) sans ENV dans Hostname

### 8.1 Spécification v1.1

> Décision : DVIG/Vault ne portent pas l'ENV dans le hostname. L'ENV est dans la `source` (token) : `univers.env.tenant`.

**URLs** :
- `dvig.<tenant>.<base_domain>`
- `vault.<tenant>.<base_domain>`

### 8.2 État Actuel

**Conformité** : ✅ **CONFORME**

**Implémentation actuelle** :
- Format : `dvig.<tenant>.doreviateam.com` (pas d'env)
- Format : `vault.<tenant>.doreviateam.com` (pas d'env)
- Source dans token : `univers.env.tenant`

**Impact** : ✅ Aucun changement requis

---

## 9. Analyse Persistance Vault

### 9.1 Spécification v1.1

> Vault **doit** utiliser des volumes persistants, au minimum :
> - `vault_storage_<tenant>` → `/opt/dorevia-vault/storage` (obligatoire)
> - `vault_ledger_<tenant>` → `/opt/dorevia-vault/ledger` (recommandé)
> - `vault_audit_<tenant>` → `/opt/dorevia-vault/audit` (recommandé)

### 9.2 État Actuel

**Conformité** : ✅ **CONFORME** — Déjà appliqué

**Implémentation actuelle** :
- ✅ Volumes persistants Vault appliqués (voir `PATCH_VAULT_PERSISTENCE_APPLIQUE.md`)
- ✅ Volumes : `vault_storage_<tenant>`, `vault_ledger_<tenant>`, `vault_audit_<tenant>`
- ✅ Migration effectuée

**Impact** : ✅ Aucun changement requis

---

## 10. Synthèse des Impacts par Composant

### 10.1 `bin/dorevia.sh`

**Impact** : 🟡 **IMPORTANT** — Ajouts fonctionnels

**Changements requis** :
1. **Enrichissement manifest** :
   - Lecture `manifest.json` enrichi
   - Validation cohérence site/environnement

2. **Commandes workflow** (optionnel) :
   - `dorevia.sh workflow stinger-ready <tenant>`
   - `dorevia.sh workflow prod-ready <tenant>`

3. **Validation PROD** :
   - Vérifier image taggée
   - Vérifier backup effectué
   - Vérifier serveur accessible (si site client)

**Estimation** : 2-3 jours de développement

---

### 10.2 `tenants/<tenant>/state/manifest.json`

**Impact** : 🟢 **FAIBLE** — Enrichissement simple

**Changements requis** :
1. **Structure enrichie** :
   ```json
   {
     "tenant": "rozas",
     "base_domain": "doreviateam.com",
     "enabled_envs": ["lab", "stinger"],
     "prod": {
       "target": "unknown",
       "server_name": null,
       "public_ip": null,
       "base_domain": null
     },
     "images": {...}
   }
   ```

2. **Migration** :
   - Migrer tenants existants
   - Valeurs par défaut : `prod.target = "unknown"`

**Estimation** : 1 jour de développement

---

### 10.3 `units/gateway/Caddyfile`

**Impact** : 🟡 **IMPORTANT** — Support domaines clients

**Changements requis** :
1. **Support domaines clients** (PROD uniquement) :
   - Génération Caddyfile avec alias (domaine client + fallback)
   - Exemple :
     ```caddy
     odoo.prod.rozas.doreviateam.com, odoo.prod.rozas.rozas.gp {
       reverse_proxy odoo_prod_rozas:8069
     }
     ```

2. **Génération automatique** (optionnel v1.1) :
   - `dorevia.sh gateway render` : Génère Caddyfile depuis manifests

**Estimation** : 2 jours de développement

---

### 10.4 Documentation

**Impact** : 🟡 **IMPORTANT** — Documentation complète

**Changements requis** :
1. **Guide workflow** :
   - LAB → STINGER
   - Mise en production PROD
   - Déploiement sur serveur client

2. **Checklists** :
   - "STINGER Ready"
   - "PROD Ready"
   - Prérequis serveur client

3. **Guides opérationnels** :
   - Configuration domaine client
   - Backup/Restore PROD
   - Validation déploiement

**Estimation** : 2 jours

---

## 11. Plan d'Implémentation Recommandé

### Phase 1 : Fondations (1 semaine)

1. **Enrichir `manifest.json`** :
   - Structure v1.1 complète
   - Migration tenants existants
   - Validation cohérence

2. **Documentation workflow** :
   - Guide LAB → STINGER
   - Guide mise en production PROD
   - Checklists

### Phase 2 : Support Serveur Client (1 semaine)

1. **Documentation déploiement serveur client** :
   - Guide déploiement
   - Checklist prérequis
   - Procédure validation

2. **Scripts d'aide** (optionnel) :
   - Validation prérequis serveur
   - Script déploiement automatisé

### Phase 3 : Domaines Clients (1 semaine)

1. **Support domaines clients** :
   - Génération Caddyfile avec alias
   - Validation DNS

2. **Documentation** :
   - Guide configuration domaine client
   - Checklist DNS

### Phase 4 : Finalisation Phase 6 (1 semaine)

1. **Scripts backup/restore** :
   - Support volumes Vault
   - Validation restore testé

2. **Documentation** :
   - Guide backup PROD
   - Guide restore PROD

---

## 12. Risques et Mitigation

### Risque 1 : Complexité Multi-Sites

**Risque** : Gestion de plusieurs sites peut complexifier l'architecture

**Mitigation** :
- Approche simplifiée : Gateway par serveur (pas de notion explicite de "site" dans code)
- Documentation claire
- Manifest comme source de vérité

### Risque 2 : Déploiement Serveur Client

**Risque** : Déploiement sur serveur client peut être complexe (accès, DNS, etc.)

**Mitigation** :
- Documentation complète
- Checklist prérequis
- Scripts d'aide (validation)
- Support manuel si nécessaire

### Risque 3 : Domaines Clients

**Risque** : Configuration DNS complexe, certificats SSL multiples

**Mitigation** :
- Validation DNS avant déploiement
- Caddy gère automatiquement certificats multiples
- Documentation claire

---

## 13. Recommandations

### 13.1 Décisions Architecturale

1. **Gateway par site** :
   - Recommandation : **Gateway par serveur** (simplifié)
   - Justification : Plus simple, compatible avec approche "server-driven"

2. **Manifest enrichi** :
   - Recommandation : **Enrichir progressivement** (pas de refonte)
   - Justification : Compatible avec approche "sans refonte"

3. **Workflow** :
   - Recommandation : **Documentation + scripts d'aide** (pas de refonte CLI)
   - Justification : Compatible avec approche "stabilisation v1.1"

### 13.2 Priorités

**Priorité 1 (Critique)** :
1. Enrichissement `manifest.json`
2. Documentation workflow LAB → STINGER → PROD
3. Documentation déploiement serveur client

**Priorité 2 (Important)** :
1. Support domaines clients
2. Scripts backup/restore (Phase 6)
3. Scripts d'aide workflow

**Priorité 3 (Souhaitable)** :
1. Génération automatique Caddyfile
2. Validation automatique prérequis serveur
3. Automatisation backup PROD

---

## 14. Conclusion

### Verdict Final

La spécification v1.1 introduit des **concepts nouveaux** (notion de "site", PROD server-driven) qui nécessitent des **ajouts fonctionnels** sans refonte majeure. L'approche est **pragmatique** et **compatible** avec l'implémentation actuelle.

**Niveau d'impact** : 🟡 **IMPORTANT** — Ajouts fonctionnels nécessaires

### Points Clés

1. **Notion de "site"** : Nouveau concept à documenter et gérer dans manifest
2. **PROD serveur client** : Nouveau workflow à documenter et supporter
3. **Manifest enrichi** : Enrichissement simple, compatible avec existant
4. **Workflow structuré** : Documentation + scripts d'aide
5. **Domaines clients** : Support à ajouter (déjà analysé)
6. **Backup/Restore** : Finaliser Phase 6

### Prochaines Étapes

1. **Valider spécification v1.1** avec équipe
2. **Enrichir `manifest.json`** (structure v1.1)
3. **Documenter workflow** LAB → STINGER → PROD
4. **Documenter déploiement serveur client**
5. **Implémenter support domaines clients**
6. **Finaliser Phase 6** (backup/restore)

---

**Document généré le** : 2025-01-29  
**Auteur** : Analyse automatique  
**Version** : 1.0

