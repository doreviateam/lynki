# 🔍 Analyse d'Impact — SPEC Phase 1 "Fondations" v1.0

**Version** : 1.0  
**Date** : 2025-01-29  
**SPEC Analysée** : DOREVIA — SPEC d'implémentation Phase 1 "Fondations" v1.0  
**Dépendance** : `SPEC_Dorevia_Reference_v2.0.md`  
**Statut** : Analyse complète — Rapport d'impact pour implémentation

---

## 📋 Résumé Exécutif

### Verdict Global

La spécification Phase 1 "Fondations" définit une **refonte ciblée** de l'implémentation actuelle pour aligner la plateforme sur les principes fondamentaux de la SPEC de référence v2.0. Elle se concentre sur **5 objectifs clés** sans introduire de nouvelles fonctionnalités complexes.

**Niveau d'impact** : 🔴 **CRITIQUE** — Refonte significative mais ciblée

### Objectifs Phase 1

1. ✅ **Configuration déclarative enrichie** (source de vérité)
2. ✅ **Génération déterministe** des artefacts
3. ✅ **Normalisation des hostnames** (incluant `<env>` pour DVIG/Vault)
4. ✅ **Préflight technique** minimal
5. ✅ **Refactor `dorevia.sh`** (orchestrateur thin)

### Écarts Identifiés

| Objectif Phase 1 | État Actuel | Conformité | Impact |
|------------------|-------------|------------|--------|
| **Configuration déclarative enrichie** | Manifest minimal | ❌ **NON CONFORME** | 🔴 Critique |
| **Génération déterministe** | Templates partiels | ❌ **NON CONFORME** | 🔴 Critique |
| **Normalisation hostnames** | DVIG/Vault sans ENV | ❌ **NON CONFORME** | 🟡 Important |
| **Préflight technique** | Vérifications manuelles | ❌ **NON CONFORME** | 🟡 Important |
| **Refactor dorevia.sh** | Logique implicite | ❌ **NON CONFORME** | 🔴 Critique |

---

## 1. Analyse Configuration Déclarative Enrichie

### 1.1 Spécification Phase 1

**Contenu minimal requis** pour chaque tenant :
- `tenant_id` (slug technique)
- `universes[]` : liste des univers fonctionnels (ex: odoo, pos, sylius)
- `environments[]` : `lab`, `stinger`, `prod` (actifs ou non)
- `domain_mode` : `saas` (Phase 1 uniquement)
- **hostnames canoniques** calculables depuis la config
- `units[]` : liste des units techniques à déployer
- `secrets_refs` : références vers secrets (chemins / variables)

### 1.2 État Actuel

**Conformité** : ❌ **NON CONFORME**

**Manifest actuel** (`tenants/core/state/manifest.json`) :
```json
{
  "tenant": "core",
  "created_at": "2025-01-28T00:00:00Z",
  "images": {
    "dvig": {
      "image": "dorevia/dvig:0.1.2-auth",
      "deployed_at": "2025-01-28T00:00:00Z"
    },
    "vault": {
      "image": "dorevia/vault:v1.3.0",
      "deployed_at": "2025-01-28T00:00:00Z"
    }
  },
  "tokens_source": "tenants/core/secrets/dvig.tokens.yml"
}
```

**Manque** :
- ❌ `tenant_id` (présent mais pas structuré)
- ❌ `universes[]` (non déclaré)
- ❌ `environments[]` (non déclaré)
- ❌ `domain_mode` (non déclaré)
- ❌ `units[]` (non déclaré)
- ❌ `secrets_refs` (partiel : `tokens_source` seulement)

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **Créer schéma de config v1.0** :
   - JSON Schema ou équivalent
   - Validation des champs obligatoires
   - Validation des enums (env, univers, units)
   - Validation des règles de nommage

2. **Enrichir manifest existant** :
   ```json
   {
     "tenant_id": "core",
     "universes": ["odoo"],
     "environments": ["lab", "stinger", "prod"],
     "domain_mode": "saas",
     "units": {
       "platform": ["dvig", "vault", "postgres"],
       "odoo": ["odoo", "postgres"]
     },
     "secrets_refs": {
       "dvig_tokens": "tenants/core/secrets/dvig.tokens.yml"
     },
     "images": {...}
   }
   ```

3. **Migrer tous les tenants** :
   - `core` (exemple de référence)
   - `dido`
   - `rozas`

---

## 2. Analyse Génération Déterministe

### 2.1 Spécification Phase 1

**Principe** : Toute sortie déployable doit être **générée** à partir de la config :
- Caddyfiles
- docker-compose.yml par unit/env
- env files
- variables runtime
- mapping ports si requis

**Artefacts attendus** :
- `tenants/X/manifest.(json|yml)` (source)
- `tenants/X/rendered/<env>/...` (sorties générées)
- `tenants/X/rendered/<env>/caddy/Caddyfile`
- `tenants/X/rendered/<env>/<unit>/docker-compose.yml`

### 2.2 État Actuel

**Conformité** : ❌ **NON CONFORME**

**Implémentation actuelle** :
- ✅ Templates Docker Compose (`docker-compose.yml.template`)
- ✅ Génération partielle depuis templates
- ❌ Caddyfile **manuellement édité** (`units/gateway/Caddyfile`)
- ❌ Pas de structure `rendered/`
- ❌ Logique implicite dans `dorevia.sh` (génération de noms)

**Exemple actuel** :
```bash
# Dans dorevia.sh : génération implicite
CONTAINER_NAME="odoo_${ENV}_${TENANT}"
DB_NAME="odoo_${ENV}_${TENANT}"
```

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **Créer structure `rendered/`** :
   ```
   tenants/<tenant>/rendered/
   ├── lab/
   │   ├── caddy/Caddyfile
   │   ├── dvig/docker-compose.yml
   │   ├── vault/docker-compose.yml
   │   └── odoo/docker-compose.yml
   ├── stinger/
   │   └── ...
   └── prod/
       └── ...
   ```

2. **Implémenter moteur de rendu** :
   - Templates pour Caddyfile
   - Templates pour docker-compose.yml
   - Variables depuis manifest.json
   - Génération idempotente

3. **Générer Caddyfile depuis config** :
   - Calculer hostnames depuis manifest
   - Générer règles reverse_proxy
   - Support multi-tenants

4. **Éliminer logique implicite** :
   - Déclarer tous les noms dans manifest
   - Générer depuis config uniquement

---

## 3. Analyse Normalisation Hostnames

### 3.1 Spécification Phase 1

**Standard SaaS** :
```
<univers>.<env>.<tenant>.doreviateam.com
```

**Services cœur (DVIG/Vault)** :
```
dvig.<env>.<tenant>.doreviateam.com
vault.<env>.<tenant>.doreviateam.com
```

> Objectif Phase 1 : supprimer toute ambiguïté/exception côté hostnames.  
> Les exceptions historiques (dvig/vault sans env) sont traitées comme **tech debt** à résorber.

### 3.2 État Actuel

**Conformité** : ❌ **NON CONFORME** — Hostnames sans ENV pour DVIG/Vault

**Implémentation actuelle** :
- ✅ Univers : `odoo.lab.core.doreviateam.com` (conforme)
- ❌ DVIG : `dvig.core.doreviateam.com` (sans ENV)
- ❌ Vault : `vault.core.doreviateam.com` (sans ENV)

**Exemple Caddyfile actuel** :
```caddy
dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
vault.core.doreviateam.com {
  reverse_proxy vault-core:8080
}
```

**Spécification attendue** :
```caddy
dvig.lab.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
dvig.stinger.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
dvig.prod.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
```

**Impact** : 🟡 **IMPORTANT** — Breaking change potentiel

**Actions requises** :
1. **Mettre à jour Caddyfile** :
   - Ajouter ENV dans hostnames DVIG/Vault
   - Générer depuis manifest (Phase 1)

2. **Mettre à jour DNS** :
   - Créer enregistrements `dvig.<env>.<tenant>.doreviateam.com`
   - Créer enregistrements `vault.<env>.<tenant>.doreviateam.com`
   - Supprimer anciens enregistrements (après migration)

3. **Documenter breaking change** :
   - Impact sur URLs existantes
   - Plan de migration
   - Compatibilité temporaire (alias legacy si nécessaire)

---

## 4. Analyse Préflight Technique

### 4.1 Spécification Phase 1

**Objectif** : Détecter avant apply :
- docker présent et accessible
- compose présent
- ports 80/443 disponibles (si reverse proxy local)
- résolution DNS (optionnel en Phase 1)
- accès registry si pull requis

**Propriétés** :
- non destructif
- sortie lisible
- code retour exploitable (CI)

### 4.2 État Actuel

**Conformité** : ❌ **NON CONFORME** — Vérifications manuelles

**Implémentation actuelle** :
- ✅ `dorevia.sh doctor` : Vérifie Docker/Compose (basique)
- ❌ Pas de préflight structuré
- ❌ Pas de vérification ports
- ❌ Pas de vérification DNS
- ❌ Pas de vérification registry

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. **Implémenter `dorevia.sh preflight <tenant> --env <env>`** :
   ```bash
   # Vérifications
   - Docker présent et accessible
   - Docker Compose présent
   - Ports 80/443 disponibles
   - Résolution DNS (optionnel Phase 1)
   - Accès registry (si pull requis)
   ```

2. **Sortie lisible** :
   - Liste des vérifications OK/KO
   - Détails pour chaque échec
   - Code retour (0 = OK, 1 = KO)

3. **Non destructif** :
   - Aucune modification système
   - Lecture seule

---

## 5. Analyse Refactor `dorevia.sh`

### 5.1 Spécification Phase 1

**Rôle** : `dorevia.sh` devient un orchestrateur **thin** :
- charge la config
- valide
- génère
- (optionnel) applique

**Commandes minimales Phase 1** :
- `dorevia.sh validate <tenant>`
- `dorevia.sh render <tenant> --env <env>`
- `dorevia.sh preflight <tenant> --env <env>`
- `dorevia.sh apply <tenant> --env <env>`

**Idempotence** :
- `render` est idempotent (mêmes inputs ⇒ mêmes outputs)
- `apply` doit être relançable sans casser l'état

### 5.2 État Actuel

**Conformité** : ❌ **NON CONFORME** — Logique implicite

**Implémentation actuelle** :
- ✅ Commandes existantes : `gateway`, `platform`, `app`, `token`
- ❌ Exécution directe (pas de séparation validate/render/apply)
- ❌ Logique implicite (génération de noms, volumes)
- ❌ Pas de validation config
- ❌ Pas de génération déterministe

**Exemple actuel** :
```bash
# Commande actuelle : exécution directe
dorevia.sh app up odoo lab core
# → Lance immédiatement docker compose up -d
```

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. **Refactor `dorevia.sh`** :
   - Séparer validate/render/apply
   - Charger config depuis manifest.json
   - Valider config avant génération
   - Générer artefacts dans `rendered/`
   - Appliquer depuis `rendered/`

2. **Nouvelles commandes** :
   ```bash
   # Validation
   dorevia.sh validate <tenant>
   
   # Génération
   dorevia.sh render <tenant> --env <env>
   
   # Préflight
   dorevia.sh preflight <tenant> --env <env>
   
   # Application
   dorevia.sh apply <tenant> --env <env>
   ```

3. **Éliminer logique implicite** :
   - Déclarer tous les noms dans manifest
   - Générer depuis config uniquement
   - Pas de hardcoding

---

## 6. Backlog Technique Phase 1 (Priorisé)

### P0 — Must have

1. **Schéma de config v1.0** + validateur
   - JSON Schema
   - Validation champs obligatoires
   - Validation enums
   - Validation règles de nommage

2. **Rendu (render)** : génération Caddyfile canonique depuis config
   - Templates Caddyfile
   - Calcul hostnames depuis manifest
   - Génération idempotente

3. **Rendu compose** : génération `docker-compose.yml` par unit/env
   - Templates docker-compose.yml
   - Variables depuis manifest
   - Génération idempotente

4. **Normalisation hostnames** (incluant `<env>` pour DVIG/Vault)
   - Mise à jour Caddyfile
   - Mise à jour DNS
   - Documentation breaking change

5. **`apply` non interactif** : `docker compose up -d` sur les sorties rendues
   - Lecture depuis `rendered/`
   - Exécution déterministe
   - Idempotence

6. **Préflight minimal** (docker/compose/ports)
   - Vérifications non destructives
   - Sortie lisible
   - Code retour exploitable

### P1 — Should have

7. Journalisation standard (log structuré : tenant/env/unit/action)
8. Organisation des dossiers `rendered/` stable et documentée
9. `status` : vérifier services up + health endpoints basiques

### P2 — Nice to have

10. Détection "drift" (diff config vs rendered vs running)
11. Export "report" de rendu (résumé domaines, units, versions)

---

## 7. Critères d'Acceptation Phase 1

### Scénario A — Tenant "core" en Lab

**Tests** :
- [ ] `validate core` OK
- [ ] `render core --env lab` produit les artefacts attendus
- [ ] `apply core --env lab` démarre les units
- [ ] `odoo.lab.core.doreviateam.com` répond
- [ ] `dvig.lab.core.doreviateam.com` répond (health)
- [ ] `vault.lab.core.doreviateam.com` répond (health)

### Scénario B — Passage Stinger (même tenant)

**Tests** :
- [ ] `render core --env stinger` produit un rendu distinct
- [ ] `apply core --env stinger` ne casse pas lab
- [ ] Hostnames stinger incluent `<env>` et sont cohérents

---

## 8. Risques & Mitigations

### Risque 1 : Refactor `dorevia.sh` trop large

**Mitigation** :
- Implémenter d'abord `validate` + `render`, puis `apply`
- Tests unitaires pour chaque commande
- Migration progressive (garder anciennes commandes temporairement)

### Risque 2 : Divergence historique DVIG/Vault sans env

**Mitigation** :
- Normaliser maintenant (Phase 1)
- Garder une compat "alias legacy" seulement si nécessaire (temporaire)
- Documentation breaking change

### Risque 3 : Dépendance DNS (OVH) bloque les tests

**Mitigation** :
- Tests d'abord via hosts/loopback et Caddy local
- DNS automatisé reporté
- Validation DNS optionnelle en Phase 1

---

## 9. Plan d'Implémentation Recommandé

### Sprint 1 : Fondations (1 semaine)

1. **Schéma de config v1.0** :
   - Définir structure manifest.json
   - Créer JSON Schema
   - Implémenter validateur

2. **Enrichir manifest core** :
   - Ajouter univers, environments, units
   - Valider avec schéma

### Sprint 2 : Génération (1 semaine)

3. **Moteur de rendu** :
   - Templates Caddyfile
   - Templates docker-compose.yml
   - Génération idempotente

4. **Structure `rendered/`** :
   - Organisation des dossiers
   - Génération par env/unit

### Sprint 3 : Refactor CLI (1 semaine)

5. **Commandes validate/render** :
   - `dorevia.sh validate <tenant>`
   - `dorevia.sh render <tenant> --env <env>`

6. **Normalisation hostnames** :
   - Mise à jour Caddyfile généré
   - Support ENV pour DVIG/Vault

### Sprint 4 : Préflight & Apply (1 semaine)

7. **Préflight minimal** :
   - `dorevia.sh preflight <tenant> --env <env>`
   - Vérifications non destructives

8. **Apply non interactif** :
   - `dorevia.sh apply <tenant> --env <env>`
   - Exécution depuis `rendered/`
   - Idempotence

### Sprint 5 : Tests & Documentation (1 semaine)

9. **Tests de conformité** :
   - Scénario A (Lab)
   - Scénario B (Stinger)

10. **Documentation** :
    - Guide utilisation nouvelles commandes
    - Documentation breaking change hostnames
    - Migration guide

---

## 10. Conclusion

### Verdict Final

La Phase 1 "Fondations" nécessite une **refonte significative mais ciblée** de l'implémentation actuelle. Elle se concentre sur **5 objectifs clés** sans introduire de nouvelles fonctionnalités complexes, alignant la plateforme sur les principes fondamentaux de la SPEC de référence v2.0.

**Niveau d'impact** : 🔴 **CRITIQUE** — Refonte significative mais ciblée

### Points Clés

1. **Configuration déclarative enrichie** : Schéma v1.0 + validation
2. **Génération déterministe** : Moteur de rendu + structure `rendered/`
3. **Normalisation hostnames** : Breaking change DVIG/Vault (ajout ENV)
4. **Préflight technique** : Vérifications non destructives
5. **Refactor `dorevia.sh`** : Orchestrateur thin (validate/render/preflight/apply)

### Prochaines Étapes

1. **Validation** : Valider schéma de config v1.0
2. **Implémentation** : Suivre plan d'implémentation (5 sprints)
3. **Tests** : Valider critères d'acceptation (Scénarios A & B)
4. **Documentation** : Guide utilisation + breaking change

---

**Document généré le** : 2025-01-29  
**Auteur** : Analyse automatique  
**Version** : 1.0

