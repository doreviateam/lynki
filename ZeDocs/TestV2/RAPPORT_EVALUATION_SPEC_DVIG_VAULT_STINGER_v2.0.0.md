# 📊 Rapport d'Évaluation — SPEC_DVIG_VAULT_STINGER_v2.0.0.md

**Date** : 2026-01-10  
**Document évalué** : `ZeDocs/TestV2/SPEC_DVIG_VAULT_STINGER_v2.0.0.md`  
**Référence** : Architecture Dorevia v2.0 (état actuel)

---

## 🎯 Résumé Exécutif

Le document spécifie l'ajout d'un couple **DVIG + Vault dédié à STINGER** (séparation complète par environnement). Cette spécification est **techniquement faisable** mais nécessite des **modifications importantes** de la plateforme actuelle, car elle va à l'encontre de l'architecture v2.0 qui partage DVIG/Vault par tenant.

**Statut global** : ⚠️ **Nécessite modifications plateforme** — Non conforme à l'architecture v2.0 actuelle

---

## 📋 Analyse par Section

### 1. Objectif ✅

**Section 1** : Objectif clair et bien défini.

- ✅ Simuler exactement le comportement de la PROD
- ✅ Tester sans risque pour la production
- ✅ Valider flux, sécurité, constats, MRR
- ✅ PROD existante non modifiée

**Évaluation** : ✅ **Conforme** — Objectif clair et réaliste

---

### 2. Architecture Cible ⚠️

**Section 2** : Architecture proposée avec hostnames incluant l'environnement.

**PROD (inchangée)** :
- ✅ `dvig.core.doreviateam.com` — Conforme architecture v2.0
- ✅ `vault.core.doreviateam.com` — Conforme architecture v2.0

**STINGER (nouveau)** :
- ⚠️ `dvig.stinger.core.doreviateam.com` — **Non conforme** architecture v2.0
- ⚠️ `vault.stinger.core.doreviateam.com` — **Non conforme** architecture v2.0

**Référence architecture v2.0** :
- Services cœur (DVIG/Vault) : `<service>.<tenant>.doreviateam.com` (sans `<env>`)
- L'environnement est dans la source du token : `univers.env.tenant`

**Évaluation** : ⚠️ **Non conforme** — Nécessite modification de l'architecture v2.0

---

### 3. Périmètre ✅

**Section 3** : Périmètre bien défini.

**Inclus** :
- ✅ Nouveau DVIG STINGER
- ✅ Nouveau Vault STINGER
- ✅ DNS, TLS, reverse proxy
- ✅ Secrets dédiés STINGER
- ✅ Volumes dédiés STINGER
- ✅ Sauvegardes STINGER

**Exclus** :
- ✅ Odoo core STINGER (hors périmètre)
- ✅ Migration PROD (non nécessaire)
- ✅ Haute dispo, SSO, paiement réel (hors périmètre)

**Évaluation** : ✅ **Conforme** — Périmètre clair et cohérent

---

### 4. DNS ⚠️

**Section 4** : Enregistrements DNS proposés.

**Enregistrements à créer** :
```
dvig.stinger.core.doreviateam.com
vault.stinger.core.doreviateam.com
odoo.stinger.sarl-la-platine.doreviateam.com
odoo.stinger.sweet-manihot.doreviateam.com
```

**État actuel DNS** (selon `BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md`) :
- ✅ `dvig.core.doreviateam.com` existe (sans env)
- ✅ `vault.core.doreviateam.com` existe (sans env)
- ❌ `dvig.stinger.core.doreviateam.com` n'existe pas
- ❌ `vault.stinger.core.doreviateam.com` n'existe pas

**Évaluation** : ⚠️ **Nouveaux enregistrements requis** — Non conforme à l'architecture v2.0 actuelle

---

### 5. Reverse Proxy ⚠️

**Section 5** : Configuration reverse proxy.

**Tableau proposé** :
| FQDN | Service | Port |
|------|---------|------|
| dvig.stinger.core | DVIG | 8080 |
| vault.stinger.core | Vault | 8080 |
| odoo.stinger.* | Odoo | 8069 |

**État actuel Caddyfile** :
- Hostnames DVIG/Vault : `dvig.core.doreviateam.com`, `vault.core.doreviateam.com` (sans env)
- Reverse proxy : `dvig-core:8080`, `vault-core:8080`

**Modifications nécessaires** :
- Ajouter hostnames avec environnement dans Caddyfile
- Modifier reverse proxy vers nouveaux containers (`dvig_stinger_core`, `vault_stinger_core`)

**Évaluation** : ⚠️ **Modifications Caddyfile nécessaires** — Script `render_caddyfile.sh` à modifier

---

### 6. Containers ⚠️

**Section 6** : Noms de containers proposés.

**STINGER** :
- `dvig_stinger_core`
- `vault_stinger_core`
- `vault_db_stinger_core`

**PROD (existant)** :
- `dvig_core` (document dit `dvig_core`, mais convention actuelle : `dvig-core`)
- `vault_core` (document dit `vault_core`, mais convention actuelle : `vault-core`)
- `vault_db_core` (document dit `vault_db_core`, mais convention actuelle : `vault-db-core`)

**Convention actuelle** (selon `SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md`) :
- Platform : `dvig-<tenant>`, `vault-<tenant>`, `vault-db-<tenant>` (avec tirets, sans env)
- Apps : `odoo_<env>_<tenant>`, `odoo_db_<env>_<tenant>` (avec underscores, avec env)

**Incohérence détectée** :
- Document utilise `dvig_core` (underscore) alors que convention actuelle : `dvig-core` (tiret)
- Document propose `dvig_stinger_core` (underscore + env) alors que convention Platform : tirets sans env

**Évaluation** : ⚠️ **Incohérence avec conventions** — Noms de containers PROD incorrects, convention STINGER non standard

---

### 7. Volumes ✅

**Section 7** : Volumes Docker proposés.

**STINGER** :
- ✅ `vault_db_stinger_core_data`
- ✅ `vault_storage_stinger_core`
- ✅ `vault_ledger_stinger_core`
- ✅ `vault_audit_stinger_core`
- ✅ `dvig_logs_stinger_core`

**PROD** :
- ⚠️ `vault_db_core_data` (document)
- ⚠️ `vault_storage_core` (document)
- ⚠️ `vault_ledger_core` (document)
- ⚠️ `vault_audit_core` (document)
- ⚠️ `dvig_logs_core` (document)

**Convention actuelle** :
- Platform : `vault_db_<tenant>_data`, `vault_storage_<tenant>`, etc. (avec underscore)

**Évaluation** : ✅ **Conformes** — Volumes STINGER cohérents, volumes PROD corrects

---

### 8. Bases de Données ⚠️

**Section 8** : Bases de données proposées.

**Tableau proposé** :
| Environnement | Base |
|---------------|------|
| PROD | `dorevia_vault_prod` |
| STINGER | `dorevia_vault_stinger` |

**État actuel** (selon `SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md`) :
- Base Vault : `dorevia_vault` (par tenant, partagée entre environnements)

**Incohérence détectée** :
- Document propose `dorevia_vault_prod` alors que l'actuel est `dorevia_vault` (sans env)
- Document propose séparation par environnement alors que l'architecture v2.0 partage la base

**Évaluation** : ⚠️ **Non conforme** — Nécessite migration base de données PROD

---

### 9. Tokens DVIG ⚠️

**Section 9** : Fichiers de tokens proposés.

**Fichiers proposés** :
```
tenants/core/secrets/dvig.prod.tokens.yml
tenants/core/secrets/dvig.stinger.tokens.yml
```

**État actuel** :
- 1 fichier : `tenants/core/secrets/dvig.tokens.yml` (contient tous les tokens LAB/STINGER/PROD)

**Format source** :
- ✅ `<univers>.<env>.<tenant>` — Conforme

**Évaluation** : ⚠️ **Séparation nécessaire** — Nécessite migration tokens existants

---

### 10. DVIG STINGER ✅

**Section 10** : Configuration DVIG STINGER.

**Tableau proposé** :
| Élément | Valeur |
|---------|--------|
| Container | `dvig_stinger_core` |
| Port | 8080 |
| URL | `https://dvig.stinger.core.doreviateam.com` |
| Tokens | `dvig.stinger.tokens.yml` |

**Évaluation** : ✅ **Cohérent** — Configuration claire et complète

---

### 11. Vault STINGER ✅

**Section 11** : Configuration Vault STINGER.

**Tableau proposé** :
| Élément | Valeur |
|---------|--------|
| Container | `vault_stinger_core` |
| DB | `dorevia_vault_stinger` |
| URL | `https://vault.stinger.core.doreviateam.com` |
| Port | 8080 |

**Évaluation** : ✅ **Cohérent** — Configuration claire et complète

---

### 12. Odoo STINGER ✅

**Section 12** : Configuration Odoo STINGER.

**Tableau proposé** :
| Client | URL |
|--------|-----|
| La Platine | `odoo.stinger.sarl-la-platine.doreviateam.com` |
| Sweet ManiHot | `odoo.stinger.sweet-manihot.doreviateam.com` |

**Config proposée** :
```
VAULT_URL=https://dvig.stinger.core.doreviateam.com
SOURCE=odoo.stinger.<tenant>
TOKEN=token_stinger_xxx
```

**Évaluation** : ✅ **Conforme** — Configuration Odoo cohérente avec architecture proposée

---

### 13. Flux ✅

**Section 13** : Flux proposé.

```
Odoo STINGER
 → DVIG STINGER
   → Vault STINGER
     → Constat
       → Odoo STINGER
```

**Évaluation** : ✅ **Cohérent** — Flux logique et isolé

---

### 14. Sécurité ⚠️

**Section 14** : Mesures de sécurité.

**Liste proposée** :
- ✅ TLS obligatoire
- ✅ Tokens séparés
- ✅ DVIG refuse mismatch env
- ✅ Volumes isolés

**Point à clarifier** :
- "DVIG refuse mismatch env" : Comment est-ce implémenté ? Enforcement technique ou logique ?

**Évaluation** : ⚠️ **Partiellement détaillé** — Manque détails d'implémentation

---

### 15. Sauvegardes ✅

**Section 15** : Stratégie de sauvegarde.

**Liste proposée** :
- ✅ Dump quotidien
- ✅ Snapshot volumes
- ✅ Rétention 14 jours

**Évaluation** : ✅ **Conforme** — Stratégie standard et cohérente

---

### 16. Commandes ⚠️

**Section 16** : Commandes proposées.

**Commandes proposées** :
```bash
dorevia.sh platform up core stinger
dorevia.sh token issue odoo stinger sarl-la-platine
dorevia.sh token issue odoo stinger sweet-manihot
```

**État actuel CLI** :
- `dorevia.sh platform up <tenant>` — Ne prend PAS de paramètre `env`
- `dorevia.sh token issue <univers> <env> <tenant>` — ✅ Conforme

**Modifications nécessaires** :
- Signature `platform up` doit être modifiée pour accepter `env`
- Script `render_platform_compose.sh` doit être modifié pour accepter `env`

**Évaluation** : ⚠️ **Breaking change** — Nécessite modification signature CLI

---

### 17. Décisions ✅

**Section 17** : Décisions prises.

**Liste proposée** :
- ✅ PROD inchangée
- ✅ STINGER isolé
- ✅ Pas de mutualisation
- ✅ Pas de refonte plateforme

**Contradiction détectée** :
- "Pas de refonte plateforme" mais le document nécessite des modifications importantes (scripts, CLI, Caddyfile)

**Évaluation** : ⚠️ **Contradiction** — Nécessite modifications plateforme importantes

---

### 18. Backlog ✅

**Section 18** : Backlog proposé.

**Liste** :
1. DNS
2. Proxy
3. Déploiement DVIG
4. Déploiement Vault
5. DB
6. Tokens
7. Paramétrage Odoo
8. Tests

**Évaluation** : ✅ **Cohérent** — Backlog complet et logique

---

### 19. Conclusion ✅

**Section 19** : Conclusion.

**Points mentionnés** :
- ✅ Architecture claire
- ✅ 1 couple PROD
- ✅ 1 couple STINGER
- ✅ Isolation totale
- ✅ Scalabilité future

**Évaluation** : ✅ **Cohérent** — Conclusion résume bien l'architecture

---

## 🔍 Incohérences Détectées

### 1. Hostnames DVIG/Vault

**Document** : `dvig.stinger.core.doreviateam.com` (avec `<env>`)  
**Architecture v2.0** : `dvig.core.doreviateam.com` (sans `<env>`)

**Impact** : 🔴 **CRITIQUE** — Violation de l'architecture v2.0

**Référence** : `ZeDocs/V2/BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md` — Migration complétée 2026-01-01

---

### 2. Noms de Containers PROD

**Document** : `dvig_core`, `vault_core`, `vault_db_core` (underscores)  
**Convention actuelle** : `dvig-core`, `vault-core`, `vault-db-core` (tirets)

**Impact** : 🟡 **IMPORTANT** — Incohérence avec conventions

**Référence** : `ZeDocs/SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md` section 6.1

---

### 3. Base de Données PROD

**Document** : `dorevia_vault_prod`  
**État actuel** : `dorevia_vault` (sans env, partagée)

**Impact** : 🔴 **CRITIQUE** — Nécessite migration base de données PROD

**Référence** : `ZeDocs/SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md` section 6.3

---

### 4. Signature Commande CLI

**Document** : `dorevia.sh platform up core stinger` (avec `env`)  
**État actuel** : `dorevia.sh platform up core` (sans `env`)

**Impact** : 🔴 **CRITIQUE** — Breaking change signature CLI

**Référence** : `bin/dorevia.sh` fonction `cmd_platform_up()`

---

### 5. Contradiction "Pas de refonte plateforme"

**Document** : "Pas de refonte plateforme"  
**RÉALITÉ** : Nécessite modifications importantes :
- Scripts de génération (`render_platform_compose.sh`, `render_caddyfile.sh`)
- CLI (`bin/dorevia.sh`)
- Gateway (Caddyfile)
- Migration données (base Vault, tokens)

**Impact** : 🟡 **IMPORTANT** — Contradiction avec réalité technique

---

## 📊 Impact Technique

### Modifications Code Nécessaires

#### 1. Scripts de Génération

**`lib/render/render_platform_compose.sh`** :
- ✅ Prend actuellement : `<tenant>`
- ❌ Doit prendre : `<tenant> <env>`
- ❌ Doit générer containers : `dvig_<env>_<tenant>` au lieu de `dvig-<tenant>`
- ❌ Doit générer volumes : `vault_db_<env>_<tenant>_data` au lieu de `vault_db_<tenant>_data`
- ❌ Doit générer bases : `dorevia_vault_<env>` au lieu de `dorevia_vault`

**`lib/render/render_caddyfile.sh`** :
- ❌ Doit générer hostnames : `dvig.<env>.<tenant>.doreviateam.com` au lieu de `dvig.<tenant>.doreviateam.com`
- ❌ Doit générer reverse_proxy : `dvig_<env>_<tenant>:8080` au lieu de `dvig-<tenant>:8080`

#### 2. CLI

**`bin/dorevia.sh`** :
- ❌ Fonction `cmd_platform_up()` : Ajouter paramètre `env`
- ❌ Appel `render_platform_compose.sh` : Passer `env`
- ❌ Génération dans : `tenants/<tenant>/rendered/<env>/platform/` au lieu de `tenants/<tenant>/platform/`

#### 3. Gateway

**`bin/dorevia.sh` fonction `cmd_gateway_aggregate()`** :
- ❌ Déduplication hostnames DVIG/Vault : Ne plus dédupliquer pour tenant `core` (hostnames différents par env)
- ❌ Caddyfile global : Contiendra 2 blocs DVIG/Vault pour `core` (PROD + STINGER)

---

### Migration Données Nécessaires

#### 1. Base de Données Vault PROD

**État actuel** : `dorevia_vault` (partagée)  
**Cible** : `dorevia_vault_prod` (séparée)

**Actions** :
1. Créer nouvelle base `dorevia_vault_prod`
2. Migrer données depuis `dorevia_vault` vers `dorevia_vault_prod`
3. Vérifier intégrité données

**Risque** : 🔴 **ÉLEVÉ** — Migration base de données production

---

#### 2. Tokens DVIG

**État actuel** : `tenants/core/secrets/dvig.tokens.yml` (tous mélangés)  
**Cible** : `tenants/core/secrets/dvig.prod.tokens.yml` + `dvig.stinger.tokens.yml`

**Actions** :
1. Extraire tokens PROD : `jq '.tokens[] | select(.source | contains(".prod."))'`
2. Extraire tokens STINGER : `jq '.tokens[] | select(.source | contains(".stinger."))'`
3. Créer fichiers séparés

**Risque** : 🟡 **MODÉRÉ** — Extraction manuelle ou script

---

## ✅ Points Positifs

1. **Objectif clair** : Isolation complète STINGER bien définie
2. **Architecture cohérente** : Séparation complète logique
3. **Périmètre bien défini** : Inclus/exclus clairs
4. **Configuration détaillée** : Containers, volumes, bases de données documentés
5. **Flux clair** : Flux STINGER isolé bien décrit
6. **Sécurité mentionnée** : TLS, tokens, isolation
7. **Backlog structuré** : Plan d'action clair

---

## ⚠️ Points à Améliorer

1. **Corriger noms containers PROD** : Utiliser tirets (`dvig-core`) au lieu d'underscores
2. **Clarifier "Pas de refonte"** : Documenter les modifications nécessaires
3. **Détailler migration données** : Plan de migration base Vault PROD
4. **Détailler enforcement env** : Comment DVIG refuse mismatch env (technique)
5. **Ajouter section impact** : Impact sur scripts, CLI, gateway
6. **Ajouter section risques** : Risques migration, downtime, rollback

---

## 📋 Checklist de Conformité

### Architecture v2.0

- [ ] Hostnames DVIG/Vault conformes (sans `<env>` pour v2.0, avec `<env>` pour cette spec)
- [ ] Noms de containers conformes (tirets pour Platform)
- [ ] Bases de données conformes (partagées pour v2.0, séparées pour cette spec)
- [ ] Volumes conformes
- [ ] Tokens conformes (unifiés pour v2.0, séparés pour cette spec)

### Modifications Code

- [ ] Scripts de génération modifiés
- [ ] CLI modifié (signature `platform up`)
- [ ] Gateway modifié (Caddyfile)
- [ ] Tests automatisés

### Migration

- [ ] Plan de migration base Vault PROD
- [ ] Plan de migration tokens
- [ ] Plan de rollback
- [ ] Fenêtre de maintenance planifiée

---

## 🎯 Recommandations

### Priorité 1 — Critiques (bloquant)

1. **Clarifier contradiction** : "Pas de refonte plateforme" vs modifications nécessaires
2. **Corriger noms containers PROD** : Utiliser convention actuelle (tirets)
3. **Détailler migration base Vault PROD** : Plan complet avec rollback
4. **Documenter breaking changes** : Signature CLI, hostnames, etc.

### Priorité 2 — Importantes (qualité)

5. **Détailler enforcement env** : Implémentation technique dans DVIG
6. **Ajouter section impact** : Impact détaillé sur chaque composant
7. **Ajouter section risques** : Risques migration, downtime, rollback
8. **Ajouter tests** : Tests automatisés requis

### Priorité 3 — Améliorations (bonnes pratiques)

9. **Ajouter diagrammes** : Architecture visuelle
10. **Ajouter exemples** : Exemples de commandes, configurations
11. **Ajouter monitoring** : Monitoring et alertes
12. **Ajouter documentation** : Guide opérationnel

---

## 📎 Références Utilisées

1. `ZeDocs/V2/BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md` — Architecture v2.0 hostnames
2. `ZeDocs/SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md` — Conventions de nommage
3. `ZeDocs/SPEC_Dorevia_Reference_v2.0.md` — Architecture de référence
4. `lib/render/render_platform_compose.sh` — Script de génération
5. `lib/render/render_caddyfile.sh` — Script Caddyfile
6. `bin/dorevia.sh` — CLI d'orchestration

---

## ✅ Conclusion

Le document **SPEC_DVIG_VAULT_STINGER_v2.0.0.md** décrit une architecture **techniquement faisable** mais **non conforme à l'architecture v2.0 actuelle**. 

**Points clés** :
- ✅ Objectif clair et réaliste
- ✅ Architecture cohérente (séparation complète)
- ⚠️ Nécessite modifications importantes de la plateforme
- ⚠️ Nécessite migration données (base Vault PROD, tokens)
- ⚠️ Breaking changes (signature CLI, hostnames)

**Recommandation** : Le document nécessite des **clarifications et corrections** avant implémentation, notamment sur :
1. Les modifications code nécessaires
2. Le plan de migration base Vault PROD
3. La contradiction "Pas de refonte plateforme"
4. Les noms de containers PROD (convention)

**Statut recommandé** : 🔴 **À réviser** avant validation

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : 📋 **Évaluation complétée**
