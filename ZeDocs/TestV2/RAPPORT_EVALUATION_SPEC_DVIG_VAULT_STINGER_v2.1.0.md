# 📊 Rapport d'Évaluation — SPEC_DVIG_VAULT_STINGER_v2.1.0 (Double Stack)

**Date** : 2026-01-10  
**Document évalué** : SPEC_DVIG_VAULT_STINGER_v2.1.0 (Double Stack, sans refonte plateforme)  
**Référence** : Architecture Dorevia v2.0 (état actuel)

---

## 🎯 Résumé Exécutif

Le document v2.1.0 propose une approche **"Double Stack"** : créer un tenant `core-stinger` (comme un nouveau tenant) au lieu de modifier le tenant `core` existant. Cette approche est **ingénieuse** car elle évite les breaking changes et utilise l'architecture existante.

**Statut global** : ✅ **FAISABLE** — Approche intelligente qui respecte l'architecture v2.0

**Avantage principal** : Aucune modification de code nécessaire, utilise l'architecture multi-tenant existante.

---

## 📋 Analyse par Section

### 1. Objectif ✅

**Section 1** : Objectif clair et bien défini.

- ✅ Simuler le comportement réel de la PROD
- ✅ Tester les flux Odoo → DVIG → Vault
- ✅ Tester constats mensuels & facturation MRR
- ✅ Valider modules `dorevia_*`
- ✅ Aucune modification sur la stack PROD
- ✅ Aucune refonte plateforme

**Évaluation** : ✅ **Conforme** — Objectif clair et réaliste

---

### 2. Principe ✅

**Section 2** : Principe "Double Stack" bien expliqué.

**Approche** :
- Deux stacks indépendantes : `core` (PROD) et `core-stinger` (STINGER)
- Pas de multi-env dans un même tenant
- Pas de changement CLI
- Pas de mutualisation
- Isolation physique réelle

**Évaluation** : ✅ **Ingénieux** — Utilise l'architecture multi-tenant existante

**Avantages** :
- ✅ Aucune modification code nécessaire
- ✅ Aucun breaking change
- ✅ Isolation complète garantie
- ✅ Architecture v2.0 respectée

---

### 3. Périmètre ✅

**Section 3** : Périmètre bien défini.

**Inclus** :
- ✅ DVIG STINGER
- ✅ Vault STINGER
- ✅ DNS dédiés
- ✅ Volumes dédiés
- ✅ Tokens dédiés
- ✅ Sauvegardes STINGER

**Exclus** :
- ✅ Migration PROD
- ✅ Modification CLI
- ✅ Refonte plateforme
- ✅ HA / SSO / Paiement réel

**Évaluation** : ✅ **Conforme** — Périmètre clair et cohérent

---

### 4. URLs ⚠️

**Section 4** : URLs proposées.

**PROD (existant)** :
- ✅ `dvig.core.doreviateam.com` — Conforme architecture v2.0
- ✅ `vault.core.doreviateam.com` — Conforme architecture v2.0

**STINGER (nouveau)** :
- ⚠️ `dvig.stinger.core.doreviateam.com` — **Non conforme** architecture v2.0
- ⚠️ `vault.stinger.core.doreviateam.com` — **Non conforme** architecture v2.0

**Problème** : Si `core-stinger` est un nouveau tenant, les hostnames devraient être :
- `dvig.core-stinger.doreviateam.com` (selon architecture v2.0)
- `vault.core-stinger.doreviateam.com` (selon architecture v2.0)

**Évaluation** : ⚠️ **Incohérence** — Hostnames ne correspondent pas à un nouveau tenant

**Options** :
1. **Accepter hostnames avec `<env>`** : Nécessite modification Caddyfile (mais pas de breaking change CLI)
2. **Utiliser hostnames tenant** : `dvig.core-stinger.doreviateam.com` (conforme v2.0 mais moins explicite)

---

### 5. DNS ⚠️

**Section 5** : Enregistrements DNS proposés.

**Enregistrements à créer** :
```
dvig.stinger.core.doreviateam.com
vault.stinger.core.doreviateam.com
odoo.stinger.sarl-la-platine.doreviateam.com
odoo.stinger.sweet-manihot.doreviateam.com
```

**Si `core-stinger` est un nouveau tenant** :
- Hostnames devraient être : `dvig.core-stinger.doreviateam.com`
- Mais document propose : `dvig.stinger.core.doreviateam.com`

**Évaluation** : ⚠️ **Incohérence** — Hostnames ne correspondent pas à un nouveau tenant

---

### 6. Reverse Proxy ⚠️

**Section 6** : Configuration reverse proxy.

**Tableau proposé** :
| FQDN | Service | Cible |
|------|---------|-------|
| dvig.stinger.core | DVIG | dvig-core-stinger:8080 |
| vault.stinger.core | Vault | vault-core-stinger:8080 |

**Problème** : Hostnames avec `<env>` nécessitent modification Caddyfile manuelle ou script.

**Si tenant `core-stinger`** :
- Hostnames : `dvig.core-stinger.doreviateam.com`
- Cible : `dvig-core-stinger:8080`
- Génération automatique possible via `render_caddyfile.sh`

**Évaluation** : ⚠️ **Modification Caddyfile nécessaire** — Mais pas de breaking change CLI

---

### 7. Containers ✅

**Section 7** : Noms de containers proposés.

**PROD (inchangé)** :
- ✅ `dvig-core` — Conforme convention
- ✅ `vault-core` — Conforme convention
- ✅ `vault-db-core` — Conforme convention

**STINGER** :
- ✅ `dvig-core-stinger` — Cohérent (suffixe `-stinger`)
- ✅ `vault-core-stinger` — Cohérent
- ✅ `vault-db-core-stinger` — Cohérent

**Convention** : Si `core-stinger` est un nouveau tenant, containers devraient être :
- `dvig-core-stinger` ✅ (conforme : `dvig-<tenant>`)
- `vault-core-stinger` ✅ (conforme : `vault-<tenant>`)
- `vault-db-core-stinger` ✅ (conforme : `vault-db-<tenant>`)

**Évaluation** : ✅ **Conformes** — Noms de containers cohérents avec architecture multi-tenant

---

### 8. Volumes ✅

**Section 8** : Volumes Docker proposés.

**STINGER** :
- ✅ `vault_db_core_stinger_data`
- ✅ `vault_storage_core_stinger`
- ✅ `vault_ledger_core_stinger`
- ✅ `vault_audit_core_stinger`
- ✅ `dvig_logs_core_stinger`

**Convention** : Si `core-stinger` est un nouveau tenant, volumes devraient être :
- `vault_db_core_stinger_data` ✅ (conforme : `vault_db_<tenant>_data`)
- `vault_storage_core_stinger` ✅ (conforme : `vault_storage_<tenant>`)

**Évaluation** : ✅ **Conformes** — Volumes cohérents avec architecture multi-tenant

---

### 9. Bases de Données ✅

**Section 9** : Bases de données proposées.

**Tableau proposé** :
| Stack | Base |
|-------|------|
| PROD | `dorevia_vault` |
| STINGER | `dorevia_vault_stinger` |

**Convention** : Si `core-stinger` est un nouveau tenant, base devrait être :
- `dorevia_vault` (par tenant) — Mais document propose `dorevia_vault_stinger`

**Options** :
1. **Utiliser `dorevia_vault`** : Conforme architecture v2.0 (1 base par tenant)
2. **Utiliser `dorevia_vault_stinger`** : Plus explicite mais non conforme

**Évaluation** : ⚠️ **Choix à clarifier** — Base `dorevia_vault_stinger` non conforme (devrait être `dorevia_vault` pour tenant `core-stinger`)

---

### 10. Tokens DVIG ✅

**Section 10** : Fichiers de tokens proposés.

**Fichiers proposés** :
- `tenants/core/secrets/dvig.tokens.yml` (PROD)
- `tenants/core/secrets/dvig.stinger.tokens.yml` (STINGER)

**Si `core-stinger` est un nouveau tenant** :
- Fichier devrait être : `tenants/core-stinger/secrets/dvig.tokens.yml`
- Mais document propose : `tenants/core/secrets/dvig.stinger.tokens.yml`

**Évaluation** : ⚠️ **Incohérence** — Fichier tokens devrait être dans `tenants/core-stinger/` si nouveau tenant

---

### 11. DVIG STINGER ✅

**Section 11** : Configuration DVIG STINGER.

**Tableau proposé** :
| Élément | Valeur |
|---------|--------|
| Container | `dvig-core-stinger` |
| URL | `https://dvig.stinger.core.doreviateam.com` |
| Port | 8080 |
| Tokens | `dvig.stinger.tokens.yml` |

**Évaluation** : ✅ **Cohérent** — Configuration claire (sauf hostname et chemin tokens)

---

### 12. Vault STINGER ✅

**Section 12** : Configuration Vault STINGER.

**Tableau proposé** :
| Élément | Valeur |
|---------|--------|
| Container | `vault-core-stinger` |
| URL | `https://vault.stinger.core.doreviateam.com` |
| DB | `dorevia_vault_stinger` |
| Port | 8080 |

**Évaluation** : ✅ **Cohérent** — Configuration claire (sauf hostname et nom base)

---

### 13. Odoo STINGER ✅

**Section 13** : Configuration Odoo STINGER.

**Tableau proposé** :
| Client | URL |
|--------|-----|
| La Platine | `odoo.stinger.sarl-la-platine` |
| Sweet ManiHot | `odoo.stinger.sweet-manihot` |

**Configuration proposée** :
```
DVIG_URL=https://dvig.stinger.core.doreviateam.com
TOKEN=token_stinger_xxx
SOURCE=odoo.stinger.<tenant>
```

**Évaluation** : ✅ **Conforme** — Configuration Odoo cohérente

---

### 14. Flux ✅

**Section 14** : Flux proposé.

```
Odoo STINGER
 → DVIG STINGER
   → Vault STINGER
     → Constat
       → Odoo STINGER (facturation)
```

**Isolation** :
- ✅ Aucun accès PROD
- ✅ Tokens STINGER invalides en PROD
- ✅ DNS totalement séparés

**Évaluation** : ✅ **Cohérent** — Flux logique et isolé

---

### 15. Sécurité ✅

**Section 15** : Mesures de sécurité.

**Liste proposée** :
- ✅ TLS obligatoire
- ✅ Secrets séparés PROD / STINGER
- ✅ Volumes isolés
- ✅ Réseaux Docker distincts

**Évaluation** : ✅ **Conforme** — Sécurité bien couverte

---

### 16. Sauvegardes ✅

**Section 16** : Stratégie de sauvegarde.

**Liste proposée** :
- ✅ Dump DB quotidien
- ✅ Snapshot volumes
- ✅ Rétention 14 jours

**Bases** :
- ✅ `dorevia_vault_stinger`
- ✅ `odoo_stinger_*`

**Évaluation** : ✅ **Conforme** — Stratégie standard et cohérente

---

### 17. Commandes ⚠️

**Section 17** : Commandes proposées.

**Commandes proposées** :
```bash
# PROD (inchangé)
dorevia.sh platform up core

# STINGER
dorevia.sh platform up core-stinger
```

**Évaluation** : ✅ **Pas de breaking change** — Utilise signature existante

**Clarification nécessaire** :
- `core-stinger` est-il un nouveau tenant ou une modification de `core` ?
- Si nouveau tenant : ✅ Pas de modification CLI nécessaire
- Si modification `core` : ❌ Nécessite modification CLI

---

### 18. Décisions ✅

**Section 18** : Décisions prises.

**Liste proposée** :
- ✅ Deux stacks indépendantes
- ✅ Pas de refonte plateforme
- ✅ Pas de modification CLI
- ✅ Isolation physique réelle
- ✅ Migration future possible vers multi-env si besoin

**Évaluation** : ✅ **Cohérent** — Décisions logiques et réalistes

---

### 19. Backlog ✅

**Section 19** : Backlog proposé.

**Liste** :
1. DNS STINGER
2. Compose core-stinger
3. Volumes
4. Secrets
5. Reverse proxy
6. Déploiement
7. Tests E2E

**Évaluation** : ✅ **Cohérent** — Backlog complet et logique

---

### 20. Conclusion ✅

**Section 20** : Conclusion.

**Points mentionnés** :
- ✅ Respecte architecture v2.0
- ✅ Respecte conventions existantes
- ✅ Stabilité PROD
- ✅ Vraie pré-prod
- ✅ Zéro risque
- ✅ Montée en puissance progressive

**Évaluation** : ✅ **Cohérent** — Conclusion résume bien l'approche

---

## 🔍 Analyse de l'Approche "Double Stack"

### Concept

**Principe** : Traiter STINGER comme un **nouveau tenant** (`core-stinger`) au lieu de modifier le tenant `core` existant.

**Avantages** :
- ✅ Aucune modification code nécessaire
- ✅ Aucun breaking change
- ✅ Utilise l'architecture multi-tenant existante
- ✅ Isolation complète garantie
- ✅ PROD totalement préservée

**Inconvénients** :
- ⚠️ Hostnames non conformes (avec `<env>` au lieu de tenant)
- ⚠️ Fichiers tokens dans mauvais répertoire
- ⚠️ Nom base de données non conforme

---

### Cohérence avec Architecture v2.0

**Si `core-stinger` est un nouveau tenant** :

**Hostnames** (selon v2.0) :
- ✅ `dvig.core-stinger.doreviateam.com` (conforme)
- ✅ `vault.core-stinger.doreviateam.com` (conforme)
- ❌ `dvig.stinger.core.doreviateam.com` (non conforme)

**Containers** (selon v2.0) :
- ✅ `dvig-core-stinger` (conforme : `dvig-<tenant>`)
- ✅ `vault-core-stinger` (conforme : `vault-<tenant>`)

**Bases de données** (selon v2.0) :
- ✅ `dorevia_vault` (conforme : 1 base par tenant)
- ❌ `dorevia_vault_stinger` (non conforme)

**Tokens** (selon v2.0) :
- ✅ `tenants/core-stinger/secrets/dvig.tokens.yml` (conforme)
- ❌ `tenants/core/secrets/dvig.stinger.tokens.yml` (non conforme)

---

## ⚠️ Incohérences Détectées

### 1. Hostnames

**Document** : `dvig.stinger.core.doreviateam.com` (avec `<env>`)  
**Architecture v2.0** : `dvig.core-stinger.doreviateam.com` (tenant)

**Impact** : 🟡 **IMPORTANT** — Hostnames non conformes mais fonctionnels

**Options** :
1. **Accepter hostnames avec `<env>`** : Plus explicite mais non conforme v2.0
2. **Utiliser hostnames tenant** : Conforme v2.0 mais moins explicite

---

### 2. Fichiers Tokens

**Document** : `tenants/core/secrets/dvig.stinger.tokens.yml`  
**Architecture v2.0** : `tenants/core-stinger/secrets/dvig.tokens.yml`

**Impact** : 🟡 **IMPORTANT** — Fichier dans mauvais répertoire

**Options** :
1. **Créer tenant `core-stinger`** : Fichier dans `tenants/core-stinger/`
2. **Garder dans `core`** : Fichier dans `tenants/core/` (mais non conforme)

---

### 3. Base de Données

**Document** : `dorevia_vault_stinger`  
**Architecture v2.0** : `dorevia_vault` (par tenant)

**Impact** : 🟡 **IMPORTANT** — Nom non conforme mais fonctionnel

**Options** :
1. **Utiliser `dorevia_vault`** : Conforme v2.0 (1 base par tenant)
2. **Utiliser `dorevia_vault_stinger`** : Plus explicite mais non conforme

---

## ✅ Points Positifs

1. **Approche ingénieuse** : Utilise l'architecture multi-tenant existante
2. **Aucun breaking change** : Pas de modification CLI nécessaire
3. **Isolation complète** : Deux stacks totalement indépendantes
4. **PROD préservée** : Aucun impact sur la production
5. **Pas de refonte** : Utilise l'infrastructure existante
6. **Migration future possible** : Peut évoluer vers multi-env plus tard

---

## ⚠️ Points à Clarifier

1. **`core-stinger` est-il un nouveau tenant ?**
   - Si oui : Hostnames, tokens, base de données doivent suivre conventions tenant
   - Si non : Approche hybride (nécessite clarifications)

2. **Hostnames avec `<env>` ou tenant ?**
   - Option 1 : `dvig.stinger.core.doreviateam.com` (plus explicite, non conforme)
   - Option 2 : `dvig.core-stinger.doreviateam.com` (conforme v2.0, moins explicite)

3. **Fichiers tokens : où ?**
   - Option 1 : `tenants/core-stinger/secrets/dvig.tokens.yml` (nouveau tenant)
   - Option 2 : `tenants/core/secrets/dvig.stinger.tokens.yml` (modification core)

4. **Base de données : nom ?**
   - Option 1 : `dorevia_vault` (conforme v2.0, 1 base par tenant)
   - Option 2 : `dorevia_vault_stinger` (plus explicite, non conforme)

---

## 📊 Comparaison avec v2.0.0

| Aspect | v2.0.0 (Séparation core) | v2.1.0 (Double Stack) |
|--------|-------------------------|------------------------|
| **Modifications code** | ❌ Majeures (scripts, CLI) | ✅ Aucune (nouveau tenant) |
| **Breaking changes** | ❌ Oui (signature CLI) | ✅ Non |
| **Migration PROD** | ❌ Nécessaire (base Vault) | ✅ Aucune |
| **Hostnames** | ⚠️ Avec `<env>` (non conforme) | ⚠️ Avec `<env>` (non conforme) |
| **Isolation** | ✅ Complète | ✅ Complète |
| **Complexité** | ❌ Élevée | ✅ Faible |
| **Conformité v2.0** | ⚠️ Partielle | ⚠️ Partielle (hostnames) |

---

## 🎯 Recommandations

### Option A : Approche "Nouveau Tenant" (Conforme v2.0)

**Si `core-stinger` est un nouveau tenant** :

1. **Hostnames** : `dvig.core-stinger.doreviateam.com` (conforme v2.0)
2. **Tokens** : `tenants/core-stinger/secrets/dvig.tokens.yml`
3. **Base de données** : `dorevia_vault` (conforme v2.0)
4. **Containers** : `dvig-core-stinger` ✅ (déjà conforme)

**Avantages** :
- ✅ Conforme architecture v2.0
- ✅ Génération automatique possible
- ✅ Pas de modification code

**Inconvénients** :
- ⚠️ Hostnames moins explicites (`core-stinger` au lieu de `stinger.core`)

---

### Option B : Approche "Hybride" (Hostnames Explicites)

**Si on veut hostnames avec `<env>`** :

1. **Hostnames** : `dvig.stinger.core.doreviateam.com` (explicite, non conforme)
2. **Tokens** : `tenants/core-stinger/secrets/dvig.tokens.yml` (nouveau tenant)
3. **Base de données** : `dorevia_vault` (conforme v2.0)
4. **Modification Caddyfile** : Manuelle ou script personnalisé

**Avantages** :
- ✅ Hostnames explicites
- ✅ Isolation complète
- ✅ Pas de breaking change CLI

**Inconvénients** :
- ⚠️ Hostnames non conformes v2.0
- ⚠️ Modification Caddyfile nécessaire (manuelle ou script)

---

## 📋 Checklist de Validation

### Architecture

- [ ] `core-stinger` défini comme nouveau tenant ou modification `core` ?
- [ ] Hostnames conformes v2.0 ou explicites avec `<env>` ?
- [ ] Fichiers tokens dans bon répertoire
- [ ] Base de données nommée correctement

### Déploiement

- [ ] Créer tenant `core-stinger` (si nouveau tenant)
- [ ] Créer manifest `tenants/core-stinger/state/manifest.json`
- [ ] Générer docker-compose via `render_platform_compose.sh`
- [ ] Générer Caddyfile (manuel ou script)
- [ ] Créer enregistrements DNS
- [ ] Déployer stack STINGER

### Tests

- [ ] Isolation PROD/STINGER vérifiée
- [ ] Tokens STINGER invalides en PROD
- [ ] Flux E2E STINGER fonctionnel
- [ ] PROD inchangée et fonctionnelle

---

## ✅ Conclusion

Le document **SPEC_DVIG_VAULT_STINGER_v2.1.0** propose une approche **"Double Stack"** ingénieuse qui évite les breaking changes en traitant STINGER comme un nouveau tenant.

**Points forts** :
- ✅ Aucune modification code nécessaire
- ✅ Aucun breaking change
- ✅ Isolation complète garantie
- ✅ PROD totalement préservée

**Points à clarifier** :
- ⚠️ Hostnames : Conformes v2.0 ou explicites avec `<env>` ?
- ⚠️ Fichiers tokens : Répertoire correct ?
- ⚠️ Base de données : Nom conforme ou explicite ?

**Recommandation** : Approche **excellente** mais nécessite **clarifications** sur :
1. `core-stinger` = nouveau tenant ou modification `core` ?
2. Hostnames : Conformes v2.0 ou explicites ?
3. Fichiers tokens : Répertoire correct ?

Une fois ces points clarifiés, cette approche est **prête pour implémentation**.

**Statut recommandé** : 🟡 **À clarifier** puis ✅ **Prêt pour implémentation**

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : 📋 **Évaluation complétée**
