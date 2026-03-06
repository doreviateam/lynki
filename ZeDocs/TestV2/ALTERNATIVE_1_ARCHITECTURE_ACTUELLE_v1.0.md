# 🔄 Alternative 1 : Garder l'Architecture Actuelle (DVIG/Vault Partagés)

**Date** : 2026-01-08  
**Alternative à** : Séparation DVIG/Vault par environnement (tenant `core`)  
**Statut** : 📋 **À évaluer**

---

## 📌 Résumé Exécutif

**Décision** : Conserver l'architecture v2.0 actuelle où DVIG et Vault sont **partagés par tenant** (1 instance par tenant, utilisée par tous les environnements LAB/STINGER/PROD).

**Impact** : ✅ **AUCUN** — Aucune modification nécessaire

**Isolation** : Isolation assurée par **tokens DVIG** (source = `univers.env.tenant`) et **logique applicative**, pas par séparation physique des instances.

---

## 🎯 Architecture Actuelle (v2.0)

### Vue d'ensemble

```
┌─────────────────────────────────────────────────┐
│ Tenant: core                                     │
│                                                  │
│ Platform (partagé entre LAB/STINGER/PROD) :    │
│   ┌─────────────┐                               │
│   │ dvig-core   │ ← Utilisé par LAB, STINGER,   │
│   │             │   et PROD                     │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault-core  │ ← Utilisé par LAB, STINGER,   │
│   │             │   et PROD                     │
│   └─────────────┘                               │
│   ┌─────────────┐                               │
│   │ vault-db-   │ ← Base: dorevia_vault         │
│   │   core      │    (partagée)                 │
│   └─────────────┘                               │
│                                                  │
│ Hostnames :                                      │
│   - dvig.core.doreviateam.com                    │
│   - vault.core.doreviateam.com                   │
│                                                  │
│ Containers :                                     │
│   - dvig-core (1 seul)                           │
│   - vault-core (1 seul)                          │
│   - vault-db-core (1 seul)                      │
│                                                  │
│ Volumes :                                        │
│   - vault_db_core_data (1 seul, partagé)         │
│   - vault_storage_core (1 seul, partagé)        │
│   - vault_ledger_core (1 seul, partagé)         │
│   - vault_audit_core (1 seul, partagé)          │
│   - dvig_logs_core (1 seul, partagé)            │
│                                                  │
│ Tokens :                                         │
│   - tenants/core/secrets/dvig.tokens.yml         │
│     (contient tokens LAB + STINGER + PROD)       │
│                                                  │
│ Isolation :                                      │
│   - Par tokens (source = univers.env.tenant)    │
│   - Par logique applicative Vault                │
│   - Pas de séparation physique                  │
└─────────────────────────────────────────────────┘
```

### Caractéristiques

- **1 DVIG par tenant** : Instance unique partagée entre tous les environnements
- **1 Vault par tenant** : Instance unique partagée entre tous les environnements
- **1 base de données Vault par tenant** : `dorevia_vault` (partagée)
- **Hostnames sans environnement** : `dvig.core.doreviateam.com` (pas de `<env>`)
- **Tokens unifiés** : 1 fichier `dvig.tokens.yml` contenant tous les tokens

---

## 🔐 Mécanismes d'Isolation Actuels

### 1. Isolation par Tokens DVIG

**Principe** : Chaque token DVIG contient une **source** qui identifie l'environnement.

**Format source** : `<univers>.<env>.<tenant>`

**Exemples** :
- `odoo.lab.core` → Token pour Odoo LAB tenant core
- `odoo.stinger.core` → Token pour Odoo STINGER tenant core
- `odoo.prod.core` → Token pour Odoo PROD tenant core

**Validation DVIG** :
```python
# DVIG valide le token et extrait la source
source = token.source  # Ex: "odoo.stinger.core"
univers, env, tenant = source.split(".")

# DVIG vérifie que le tenant correspond
if tenant != request_tenant:
    raise Unauthorized()

# DVIG peut loguer l'environnement pour audit
log.info(f"Ingest from {env} environment")
```

**Isolation** :
- ✅ Les tokens STINGER ne fonctionnent pas en PROD (source différente)
- ✅ Les tokens PROD ne fonctionnent pas en STINGER (source différente)
- ✅ Audit possible par environnement (source contient `<env>`)

**Limitation** :
- ⚠️ Tous les tokens sont dans le même fichier
- ⚠️ Tous les tokens sont chargés par la même instance DVIG

---

### 2. Isolation par Logique Applicative Vault

**Principe** : Vault peut isoler les données par **métadonnées** (source, tenant, environnement).

**Exemple de stockage Vault** :
```json
{
  "document_id": "doc_123",
  "source": "odoo.stinger.core",
  "tenant": "core",
  "environment": "stinger",
  "data": "..."
}
```

**Requêtes Vault** :
```python
# Récupérer uniquement les documents STINGER
GET /api/v1/vault?source=odoo.stinger.core

# Récupérer uniquement les documents PROD
GET /api/v1/vault?source=odoo.prod.core
```

**Isolation** :
- ✅ Les données peuvent être filtrées par source/environnement
- ✅ Les requêtes peuvent être limitées à un environnement
- ✅ Audit possible par environnement

**Limitation** :
- ⚠️ Toutes les données sont dans la même base de données
- ⚠️ Pas de séparation physique des données
- ⚠️ Risque de confusion si requête mal formulée

---

### 3. Isolation par Configuration Odoo

**Principe** : Chaque instance Odoo est configurée pour pointer vers le bon DVIG/Vault.

**Configuration Odoo STINGER** :
```python
# Dans module dorevia_*
VAULT_URL = "https://dvig.core.doreviateam.com"  # Même URL pour tous
TOKEN = "token_stinger_core"  # Token spécifique STINGER
SOURCE = "odoo.stinger.core"  # Source identifie l'environnement
```

**Isolation** :
- ✅ Chaque Odoo utilise son propre token (source différente)
- ✅ Chaque Odoo identifie son environnement dans la source

**Limitation** :
- ⚠️ Tous pointent vers la même URL DVIG/Vault
- ⚠️ Pas de séparation physique

---

## ✅ Avantages

### 1. Simplicité

- **Aucune modification nécessaire** : Architecture déjà en place
- **Pas de migration** : Aucune migration de données requise
- **Pas de breaking change** : Aucun changement de signature CLI
- **Documentation existante** : Toute la documentation reste valide

### 2. Ressources

- **Moins de ressources** : 1 instance DVIG/Vault au lieu de 3
- **Moins de RAM** : ~3x moins de mémoire nécessaire
- **Moins de CPU** : ~3x moins de CPU nécessaire
- **Moins de disque** : 1 base de données au lieu de 3

### 3. Maintenance

- **Moins de services** : 1 DVIG + 1 Vault à maintenir au lieu de 3+3
- **Moins de sauvegardes** : 1 base de données à sauvegarder au lieu de 3
- **Moins de monitoring** : Moins de services à monitorer
- **Moins de complexité** : Architecture plus simple à comprendre

### 4. Opérations

- **Pas de downtime** : Aucune migration nécessaire
- **Pas de fenêtre de maintenance** : Aucun arrêt de service
- **Pas de risque de migration** : Aucun risque de perte de données
- **Pas de changement DNS** : Aucun changement DNS nécessaire

### 5. Isolation Logique

- **Isolation par tokens** : Les tokens isolent déjà les environnements
- **Isolation par source** : La source (`univers.env.tenant`) identifie l'environnement
- **Audit possible** : Les logs peuvent filtrer par environnement
- **Sécurité** : Les tokens STINGER ne fonctionnent pas en PROD

---

## ⚠️ Inconvénients

### 1. Isolation Physique

- **Données partagées** : Toutes les données Vault dans la même base
- **Pas de séparation physique** : Impossible de séparer complètement les données
- **Risque de confusion** : Risque de requête mal formulée qui récupère mauvaises données

### 2. Hostnames

- **Hostnames sans environnement** : `dvig.core.doreviateam.com` (pas de `<env>`)
- **Moins explicite** : Pas évident que c'est partagé entre environnements
- **Non conforme SPEC_STINGER** : Le document SPEC_STINGER demande des hostnames avec `<env>`

### 3. Tokens

- **Tous les tokens dans un fichier** : Tokens LAB, STINGER, PROD mélangés
- **Tous chargés par DVIG** : Instance DVIG charge tous les tokens
- **Pas de séparation** : Impossible de séparer complètement les tokens

### 4. Tests STINGER

- **Données partagées** : Les tests STINGER partagent la base avec PROD
- **Risque de pollution** : Risque de données STINGER mélangées avec PROD
- **Pas d'isolation complète** : Impossible d'isoler complètement STINGER

### 5. Conformité SPEC_STINGER

- **Non conforme** : Le document SPEC_STINGER demande des instances séparées
- **Vision différente** : Ne correspond pas à la vision "prod-like" isolée

---

## 🔍 Analyse du Besoin Réel

### Question : L'isolation logique suffit-elle ?

**Isolation logique actuelle** :
- ✅ Tokens isolés par source (`univers.env.tenant`)
- ✅ Données filtrables par source dans Vault
- ✅ Audit possible par environnement
- ✅ Sécurité : Tokens STINGER ne fonctionnent pas en PROD

**Isolation physique requise ?** :
- ❓ Les données doivent-elles être physiquement séparées ?
- ❓ Y a-t-il un risque réel de confusion entre environnements ?
- ❓ Les tests STINGER peuvent-ils partager la base avec PROD ?

### Cas d'usage

#### Cas 1 : Tests STINGER normaux

**Scénario** : Tests fonctionnels STINGER, validation avant PROD

**Isolation logique suffisante ?** :
- ✅ Oui, si les requêtes sont correctement filtrées
- ✅ Oui, si les tokens sont correctement utilisés
- ⚠️ Risque si requête mal formulée

#### Cas 2 : Tests STINGER destructifs

**Scénario** : Tests de charge, tests de régression, tests de migration

**Isolation logique suffisante ?** :
- ❌ Non, risque de pollution des données PROD
- ❌ Non, risque de corruption de la base partagée
- ✅ Isolation physique requise

#### Cas 3 : Simulation PROD-like complète

**Scénario** : STINGER doit être une copie exacte de PROD (isolation complète)

**Isolation logique suffisante ?** :
- ❌ Non, isolation physique requise
- ❌ Non, données doivent être complètement séparées
- ✅ Isolation physique requise

---

## 📊 Comparaison avec Alternative (Séparation Physique)

| Aspect | Alternative 1 (Actuelle) | Alternative (Séparation) |
|--------|-------------------------|--------------------------|
| **Modifications code** | ✅ Aucune | ❌ Modifications majeures |
| **Migration données** | ✅ Aucune | ❌ Migration nécessaire |
| **Ressources** | ✅ 1x (moins) | ❌ 3x (plus) |
| **Maintenance** | ✅ Simple | ❌ Complexe (3x plus) |
| **Isolation logique** | ✅ Oui (tokens) | ✅ Oui (tokens) |
| **Isolation physique** | ❌ Non | ✅ Oui |
| **Hostnames explicites** | ❌ Non (`dvig.core`) | ✅ Oui (`dvig.stinger.core`) |
| **Conformité SPEC_STINGER** | ❌ Non | ✅ Oui |
| **Risque pollution données** | ⚠️ Oui (si requête mal formulée) | ✅ Non (séparation physique) |
| **Tests destructifs possibles** | ❌ Non (risque) | ✅ Oui (isolation complète) |

---

## 🎯 Recommandations

### Quand choisir Alternative 1 (Architecture Actuelle) ?

**Choisir si** :
- ✅ Les tests STINGER sont **non destructifs**
- ✅ L'isolation logique (tokens) est **suffisante**
- ✅ Les ressources sont **limitées**
- ✅ La simplicité est **prioritaire**
- ✅ Les données STINGER peuvent **partager la base** avec PROD
- ✅ Les requêtes Vault sont **toujours correctement filtrées**

**Exemples de cas** :
- Tests fonctionnels simples
- Validation de flux métier
- Tests d'intégration non destructifs

---

### Quand ne PAS choisir Alternative 1 ?

**Ne pas choisir si** :
- ❌ Les tests STINGER sont **destructifs** (tests de charge, migration)
- ❌ L'isolation physique est **requise** (réglementation, sécurité)
- ❌ Les données STINGER ne doivent **jamais** être mélangées avec PROD
- ❌ La conformité SPEC_STINGER est **obligatoire**
- ❌ Les hostnames explicites sont **requis** (`dvig.stinger.core`)

**Exemples de cas** :
- Tests de charge (risque de surcharge base partagée)
- Tests de migration (risque de corruption)
- Simulation PROD-like complète (isolation totale requise)
- Conformité réglementaire (séparation physique obligatoire)

---

## 🔧 Implémentation (Aucune modification nécessaire)

### État actuel

L'architecture actuelle est déjà en place et fonctionnelle :

```bash
# Déploiement actuel (inchangé)
dorevia.sh platform up core
dorevia.sh app up odoo stinger core

# Configuration actuelle
# - dvig.core.doreviateam.com (partagé)
# - vault.core.doreviateam.com (partagé)
# - Tokens dans dvig.tokens.yml (tous mélangés)
```

### Bonnes pratiques pour isolation logique

1. **Tokens bien configurés** :
   ```yaml
   # tenants/core/secrets/dvig.tokens.yml
   tokens:
     - id: tok_lab_001
       source: odoo.lab.core
       secret: "..."
     - id: tok_stinger_001
       source: odoo.stinger.core
       secret: "..."
     - id: tok_prod_001
       source: odoo.prod.core
       secret: "..."
   ```

2. **Requêtes Vault filtrées** :
   ```python
   # Dans module dorevia_*
   # Toujours filtrer par source
   response = vault_client.get_documents(
       source="odoo.stinger.core"  # Filtrer par environnement
   )
   ```

3. **Audit et monitoring** :
   ```python
   # Loguer la source pour audit
   log.info(f"Vault operation: source={source}, env={env}")
   ```

---

## 📋 Checklist de Validation

### Vérifier que l'isolation logique est suffisante

- [ ] Les tests STINGER sont **non destructifs**
- [ ] Les requêtes Vault sont **toujours filtrées** par source
- [ ] Les tokens sont **correctement configurés** (source = `univers.env.tenant`)
- [ ] Les données STINGER peuvent **partager la base** avec PROD
- [ ] Aucune réglementation n'exige **séparation physique**
- [ ] Les hostnames sans `<env>` sont **acceptables**
- [ ] La conformité SPEC_STINGER n'est **pas obligatoire**

### Si toutes les cases sont cochées

✅ **Alternative 1 est appropriée** — Garder l'architecture actuelle

### Si une case n'est pas cochée

⚠️ **Évaluer Alternative (Séparation Physique)** — Voir `ANALYSE_IMPACT_DVIG_VAULT_PAR_ENV_v1.0.md`

---

## 📎 Références

- `ZeDocs/TestV2/ANALYSE_IMPACT_DVIG_VAULT_PAR_ENV_v1.0.md` — Alternative (Séparation Physique)
- `ZeDocs/TestV2/SPEC_STINGER_v1.0.md` — Spécification STINGER
- `ZeDocs/V2/BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md` — Architecture v2.0 actuelle
- `ZeDocs/SPEC_Dorevia_Reference_v2.0.md` — Architecture de référence

---

## ✅ Conclusion

**Alternative 1 (Architecture Actuelle)** est **appropriée** si :
- L'isolation logique (tokens, source) est suffisante
- Les tests STINGER sont non destructifs
- Les ressources sont limitées
- La simplicité est prioritaire

**Alternative 1 n'est PAS appropriée** si :
- L'isolation physique est requise (réglementation, sécurité)
- Les tests STINGER sont destructifs
- La conformité SPEC_STINGER est obligatoire
- Les hostnames explicites sont requis

**Recommandation** : Évaluer le besoin réel d'isolation physique avant de choisir. Si l'isolation logique suffit, Alternative 1 est la meilleure option (simplicité, pas de migration, moins de ressources).

---

**Version** : 1.0  
**Date** : 2026-01-08  
**Statut** : 📋 **À évaluer**
