# 📘 Guide Utilisateur — `dorevia.sh`

**Version** : 1.0  
**Date** : 2025-01-28  
**Plateforme** : Dorevia Platform

---

## 🎯 Introduction

`dorevia.sh` est l'orchestrateur CLI de la plateforme Dorevia. Il permet de gérer :
- **Gateway globale** (Caddy) : routage HTTPS
- **Services partagés** (DVIG, Vault) : par tenant
- **Applications** (Odoo) : par univers, environnement et tenant
- **Tokens DVIG** : cycle de vie complet

---

## 📋 Commandes Disponibles

### Gateway (Couche 0 - Globale)

#### `gateway up`
Démarre la gateway globale (Caddy).

```bash
dorevia.sh gateway up
```

**Prérequis** :
- Réseau `dorevia-network` (créé automatiquement si absent)

**Exemple** :
```bash
$ dorevia.sh gateway up
🚀 Démarrage gateway globale (Caddy)...
✅ Gateway démarrée
```

---

#### `gateway status`
Affiche le statut de la gateway.

```bash
dorevia.sh gateway status
```

**Exemple** :
```bash
$ dorevia.sh gateway status
📊 Gateway globale - Statut:
NAME             IMAGE      STATUS
gateway-caddy   caddy:2     Up 2 minutes

🔗 Réseau:
  ✅ dorevia-network (existe)
  ✅ gateway-caddy connecté
```

---

#### `gateway down`
Arrête la gateway.

```bash
dorevia.sh gateway down
```

---

#### `gateway reload`
Recharge la configuration Caddy.

```bash
dorevia.sh gateway reload
```

---

### Platform (Couche 1 - Par Tenant)

#### `platform up <tenant>`
Démarre les services partagés (DVIG, Vault, Vault DB) pour un tenant.

```bash
dorevia.sh platform up <tenant>
```

**Prérequis** :
- Gateway opérationnelle (sauf `--no-gateway-check`)
- Réseau `dorevia-network`
- Fichier tokens : `tenants/<tenant>/secrets/dvig.tokens.yml`

**Exemple** :
```bash
$ dorevia.sh platform up core
🚀 Démarrage platform core...
✅ Platform core démarrée

📊 URLs:
  - DVIG: https://dvig.core.doreviateam.com
  - Vault: https://vault.core.doreviateam.com
```

---

#### `platform status <tenant>`
Affiche le statut des services partagés.

```bash
dorevia.sh platform status <tenant>
```

---

#### `platform down <tenant>`
Arrête les services partagés.

```bash
dorevia.sh platform down <tenant>
```

---

#### `platform destroy <tenant> [--purge]`
Détruit les services partagés.

```bash
dorevia.sh platform destroy <tenant> [--purge]
```

**Flags** :
- `--purge` : Supprime les volumes (requis pour destruction complète)

---

### App (Couche 2 - Par Univers/Env/Tenant)

#### `app up <univers> <env> <tenant>`
Démarre une application (ex: Odoo).

```bash
dorevia.sh app up <univers> <env> <tenant>
```

**Paramètres** :
- `univers` : Univers applicatif (`odoo` en v1.0)
- `env` : Environnement (`lab`, `stinger`, `prod`)
- `tenant` : Tenant DNS (ex: `core`)

**Prérequis** :
- Gateway opérationnelle
- Platform démarrée pour le tenant

**Exemple** :
```bash
$ dorevia.sh app up odoo lab core
🚀 Démarrage app odoo lab core...
✅ App odoo lab core démarrée

📊 Source: odoo.lab.core
📊 DB: odoo_lab_core
📊 URL: https://odoo.lab.core.doreviateam.com
```

---

#### `app status <univers> <env> <tenant>`
Affiche le statut d'une application.

```bash
dorevia.sh app status <univers> <env> <tenant>
```

---

#### `app down <univers> <env> <tenant>`
Arrête une application.

```bash
dorevia.sh app down <univers> <env> <tenant>
```

---

#### `app reset <univers> <env> <tenant> [--purge]`
Reset une application (supprime DB + volumes).

```bash
dorevia.sh app reset <univers> <env> <tenant> --purge
```

**⚠️ Attention** : Flag `--purge` requis (E06)

---

#### `app destroy <univers> <env> <tenant> [--purge]`
Détruit une application.

```bash
dorevia.sh app destroy <univers> <env> <tenant> [--purge]
```

---

### Token (Gestion Tokens DVIG)

#### `token issue <univers> <env> <tenant> [--force]`
Crée un nouveau token DVIG.

```bash
dorevia.sh token issue <univers> <env> <tenant> [--force]
```

**Flags** :
- `--force` : Force la création même si un token actif existe

**Exemple** :
```bash
$ dorevia.sh token issue odoo lab core
🔐 Génération token pour odoo.lab.core...
✅ Token créé: tok_lab_core_001
📋 Source: odoo.lab.core

🔑 TOKEN (à copier maintenant, ne sera plus affiché):
dvig_8q-T7U1rohcIBKqQ7ZjjOyJhaztgRMveqDgDAP9IDOM

⚠️  IMPORTANT: Ce token ne sera plus affiché. Stockez-le en sécurité.
```

**⚠️ Sécurité** : Le token clair est affiché UNE SEULE FOIS. Stockez-le immédiatement.

---

#### `token list <tenant>`
Liste tous les tokens d'un tenant.

```bash
dorevia.sh token list <tenant>
```

**Exemple** :
```bash
$ dorevia.sh token list core
📋 Tokens pour tenant core:

  ID: tok_lab_core_001
    Univers: odoo
    Status: active
    Source: LAB - odoo.lab.core (tenant DNS: core)
    Créé: 2025-01-28T00:00:00Z
```

---

#### `token revoke <tenant> <token_id>`
Révoque un token.

```bash
dorevia.sh token revoke <tenant> <token_id>
```

**Exemple** :
```bash
$ dorevia.sh token revoke core tok_lab_core_001
🔒 Révocation token tok_lab_core_001...
✅ Token tok_lab_core_001 révoqué
```

---

#### `token rotate <univers> <env> <tenant> [--revoke-old]`
Effectue une rotation de token.

```bash
dorevia.sh token rotate <univers> <env> <tenant> [--revoke-old]
```

**Flags** :
- `--revoke-old` : Révoque l'ancien token actif

**Comportement** :
- Par défaut : Crée un nouveau token, laisse l'ancien actif (overlap)
- Avec `--revoke-old` : Crée un nouveau token et révoque l'ancien

**Exemple** :
```bash
$ dorevia.sh token rotate odoo lab core
🔄 Rotation token pour odoo.lab.core...
✅ Rotation terminée
📋 Nouveau token ID: tok_lab_core_002
🔑 NOUVEAU TOKEN (à copier maintenant, ne sera plus affiché):
dvig_St2E6TkIOGIiMpBc4fSVMn6DI8MJHxNZ5SUq20FGFtg
```

---

### Utilitaires

#### `help`
Affiche l'aide complète.

```bash
dorevia.sh help
```

---

#### `version`
Affiche la version.

```bash
dorevia.sh version
```

---

#### `doctor`
Vérifie les prérequis (Docker, Docker Compose, réseau).

```bash
dorevia.sh doctor
```

---

## 🔐 Sécurité

### Tokens
- **Source de vérité unique** : `tenants/<tenant>/secrets/dvig.tokens.yml`
- **Token clair** : Affiché UNE SEULE FOIS lors de `issue` / `rotate`
- **Stockage** : Uniquement hash SHA-256 (jamais le token brut)
- **Permissions** : Fichier tokens en `0400` ou `0440`

### Validation
- **Environnements** : `lab`, `stinger`, `prod` uniquement
- **Univers** : `odoo` uniquement (v1.0)
- **Tenant** : Slug DNS valide
- **Source** : Format strict `univers.env.tenant`

---

## ⚠️ Codes d'Erreur

| Code | Description | Solution |
|------|-------------|----------|
| E01 | Paramètre invalide (env/univers/tenant) | Vérifier les valeurs autorisées |
| E02 | Invariant violé (source/token mismatch, latest en STINGER/PROD) | Utiliser version taggée |
| E03 | Dépendance manquante (docker/compose) | Installer Docker et Docker Compose |
| E04 | Platform down (tentative app up) | Démarrer platform avec `platform up <tenant>` |
| E05 | Ressource occupée (collision noms/volumes) | Arrêter/supprimer containers existants |
| E06 | Opération destructive sans flag `--purge` | Ajouter `--purge` pour confirmer |

---

## 📚 Exemples d'Utilisation

### Démarrage complet LAB

```bash
# 1. Gateway
dorevia.sh gateway up

# 2. Platform
dorevia.sh platform up core

# 3. App
dorevia.sh app up odoo lab core

# 4. Token (si nécessaire)
dorevia.sh token issue odoo lab core
```

### Rotation token PROD

```bash
# Rotation avec overlap (ancien + nouveau actifs)
dorevia.sh token rotate odoo prod core

# Rotation avec révocation ancien
dorevia.sh token rotate odoo prod core --revoke-old
```

### Reset LAB (démo)

```bash
# Reset complet (DB + volumes)
dorevia.sh app reset odoo lab core --purge

# Redémarrer
dorevia.sh app up odoo lab core
```

---

## 🏗️ Architecture

### Couches

1. **Couche 0 - Gateway** (globale) : Caddy
2. **Couche 1 - Platform** (par tenant) : DVIG, Vault
3. **Couche 2 - Apps** (par tenant + univers + env) : Odoo

### Réseau

- **Réseau global** : `dorevia-network` (externe)
- **Tous les services** connectés à ce réseau

### DNS

- Format : `<application>.<environnement>.<tenant>.doreviateam.com`
- Exemples :
  - `odoo.lab.core.doreviateam.com`
  - `dvig.core.doreviateam.com`
  - `vault.core.doreviateam.com`

---

## 📝 Notes

- Les fichiers de configuration sont générés automatiquement depuis des templates
- Les tokens sont stockés dans `tenants/<tenant>/secrets/` (hors repo Git)
- Les volumes Docker sont isolés par environnement
- Les identifiants (DB, volumes, project) sont déterministes

---

**Dernière mise à jour** : 2025-01-28

