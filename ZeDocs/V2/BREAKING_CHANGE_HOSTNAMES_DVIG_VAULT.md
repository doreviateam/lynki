# ⚠️ Breaking Change : Normalisation Hostnames DVIG/Vault (P0.1)

**Version** : 2.0  
**Date** : 2026-01-01  
**Phase** : Corrections P0 (Code Review Phase 2)  
**Impact** : 🟡 **IMPORTANT** — Breaking change pour URLs DVIG/Vault  
**Statut** : ✅ **Migration complétée** (2026-01-01)

---

## 📋 Résumé

Les hostnames DVIG et Vault **n'incluent plus l'environnement** (`<env>`) car ces services sont **partagés par tenant** (1 DVIG + 1 Vault par tenant, pas par environnement).

### Avant (non conforme)

```
dvig.lab.core.doreviateam.com
dvig.stinger.core.doreviateam.com
dvig.prod.core.doreviateam.com

vault.lab.core.doreviateam.com
vault.stinger.core.doreviateam.com
vault.prod.core.doreviateam.com
```

### Après (conforme architecture v2.0)

```
dvig.core.doreviateam.com
vault.core.doreviateam.com
```

**Règle** : 1 DVIG + 1 Vault par tenant (l'environnement est dans la source du token : `univers.env.tenant`)

---

## 🎯 Décision d'Architecture

Cette modification est **obligatoire** pour respecter l'architecture Dorevia v2.0 qui distingue :

- **Apps** (Odoo) : `<univers>.<env>.<tenant>.<domain>` (1 par environnement)
- **Services cœur** (DVIG/Vault) : `<service>.<tenant>.<domain>` (1 par tenant)

Où :
- `service` : `dvig`, `vault`
- `tenant` : slug DNS du tenant
- `env` : présent uniquement dans la source du token DVIG (`univers.env.tenant`)

---

## 📝 Impact

### 1. Caddyfile

Le Caddyfile généré par `dorevia.sh render <tenant> --env <env>` génère maintenant DVIG/Vault **sans ENV** (1 par tenant).

**Exemple généré** :
```caddy
# Services partagés (tenant core) - 1 par tenant
dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}

vault.core.doreviateam.com {
  reverse_proxy vault-core:8080
}
```

**Note** : Le script d'agrégation gateway (`gateway aggregate`) déduplique automatiquement les hostnames DVIG/Vault (1 occurrence par tenant dans le Caddyfile global).

### 2. DNS

**✅ Migration complétée** (2026-01-01)

**Enregistrements créés** (nouveaux) :
- `dvig.<tenant>.doreviateam.com` → IP serveur (1 par tenant)
- `vault.<tenant>.doreviateam.com` → IP serveur (1 par tenant)

**Enregistrements supprimés** (anciens) :
- `dvig.lab.<tenant>.doreviateam.com`
- `dvig.stinger.<tenant>.doreviateam.com`
- `dvig.prod.<tenant>.doreviateam.com`
- `vault.lab.<tenant>.doreviateam.com`
- `vault.stinger.<tenant>.doreviateam.com`
- `vault.prod.<tenant>.doreviateam.com`

### 3. Messages CLI

Les messages dans `dorevia.sh` affichent maintenant les hostnames sans ENV pour DVIG/Vault.

**Exemple** :
```
📊 URLs:
  - DVIG: https://dvig.core.doreviateam.com (1 par tenant, sans ENV)
  - Vault: https://vault.core.doreviateam.com (1 par tenant, sans ENV)
```

---

## ✅ Migration Complétée (2026-01-01)

### Étape 1 : ✅ Génération nouveaux Caddyfiles

```bash
# Pour chaque tenant et chaque environnement
for tenant in core dido rozas; do
  for env in lab stinger prod; do
    dorevia.sh render $tenant --env $env
  done
done
```

### Étape 2 : ✅ Migration DNS

**Enregistrements créés** (6 nouveaux) :
- `dvig.core.doreviateam.com` → 85.215.206.213
- `vault.core.doreviateam.com` → 85.215.206.213
- `dvig.dido.doreviateam.com` → 85.215.206.213
- `vault.dido.doreviateam.com` → 85.215.206.213
- `dvig.rozas.doreviateam.com` → 85.215.206.213
- `vault.rozas.doreviateam.com` → 85.215.206.213

**Enregistrements supprimés** (18 anciens) :
- Tous les `dvig.<env>.<tenant>.doreviateam.com` (6 hostnames × 3 envs)
- Tous les `vault.<env>.<tenant>.doreviateam.com` (6 hostnames × 3 envs)

### Étape 3 : ✅ Correction agrégation Caddyfile

**Problème identifié** : Hostnames DVIG/Vault dupliqués (3 occurrences par tenant, une par environnement).

**Correction appliquée** :
- Déduplication automatique dans `gateway aggregate`
- 1 seule occurrence par hostname DVIG/Vault dans le Caddyfile global
- Correction en-tête global (1 seul bloc `{ email ... }`)

### Étape 4 : ✅ Rechargement Caddy

```bash
dorevia.sh gateway aggregate --reload
```

### Étape 5 : ✅ Validation

**Tests de validation** :
```bash
# Tous les tenants validés
✅ https://dvig.core.doreviateam.com/health → HTTP/2 405 (OK)
✅ https://vault.core.doreviateam.com/health → HTTP/2 200 (OK)
✅ https://dvig.dido.doreviateam.com/health → HTTP/2 200 (OK)
✅ https://vault.dido.doreviateam.com/health → HTTP/2 200 (OK)
✅ https://dvig.rozas.doreviateam.com/health → HTTP/2 200 (OK)
✅ https://vault.rozas.doreviateam.com/health → HTTP/2 200 (OK)
```

**Certificats SSL** : Tous obtenus automatiquement via Let's Encrypt.

---

## 📚 Références

- **Rapport Corrections P0** : `ZeDocs/V2/RAPPORT_CORRECTIONS_P0.md`
- **Migration DNS** : `ZeDocs/V2/MIGRATION_DNS_P0.1.md`
- **Spécification Architecture** : `ZeDocs/SPEC_Dorevia_Reference_v2.0.md`

---

## 🔧 Corrections Techniques Appliquées

### 1. Déduplication Hostnames dans Caddyfile

**Problème** : Le script `gateway aggregate` générait des hostnames DVIG/Vault dupliqués (1 par environnement).

**Solution** : Ajout d'une logique de déduplication dans `bin/dorevia.sh:cmd_gateway_aggregate()` :
- Détection des hostnames DVIG/Vault (sans env)
- Conservation de la première occurrence uniquement
- Ignorance des blocs dupliqués

### 2. Correction En-tête Global Caddyfile

**Problème** : Plusieurs blocs `{ email ... }` dans le Caddyfile global.

**Solution** : Ignorance des en-têtes dupliqués lors de l'agrégation (1 seul bloc global en premier).

---

**Dernière mise à jour** : 2026-01-01  
**Statut** : ✅ **Migration complétée et validée**

