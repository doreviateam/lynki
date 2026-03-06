# ✅ Checklist — Lancer une Instance Odoo STINGER (Sans DVIG/Vault)

**Date** : 2026-01-12  
**Objectif** : Liste complète des éléments nécessaires pour lancer une instance Odoo STINGER

---

## 📋 Éléments Requis

### 1. ✅ Identifiant Tenant

**Format** : Slug DNS valide  
**Exemples** : `conceptsun97139`, `test-tenant`, `mon-client`

**Validation** :
- Format : `[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?`
- Longueur : 1-63 caractères
- Caractères autorisés : lettres minuscules, chiffres, tirets

**Exemple** : `conceptsun97139`

---

### 2. ✅ Enregistrement DNS

**Format** : `odoo.stinger.<tenant>.doreviateam.com`

**À créer chez le registrar** (OVH/Cloudflare/IONOS) :

**Enregistrement A** :
```
Type    : A
Nom     : odoo.stinger.<tenant>
Valeur  : IP_SERVEUR
TTL     : 3600 (ou défaut)
```

**Exemple** :
```
odoo.stinger.conceptsun97139.doreviateam.com → 85.215.206.213
```

**Important** :
- ✅ Un seul enregistrement DNS nécessaire (pas de `dvig.*` ni `vault.*`)
- ⚠️ Propagation DNS : 5-30 minutes généralement

---

## 🔧 Étapes de Création

### Étape 1 : Créer la Structure de Répertoires

```bash
cd /opt/dorevia-plateform

# Créer structure minimale
mkdir -p tenants/<tenant>/state
mkdir -p tenants/<tenant>/apps/odoo/stinger
mkdir -p tenants/<tenant>/secrets
```

**Exemple** :
```bash
mkdir -p tenants/conceptsun97139/state
mkdir -p tenants/conceptsun97139/apps/odoo/stinger
mkdir -p tenants/conceptsun97139/secrets
```

---

### Étape 2 : Créer le Manifest

**Fichier** : `tenants/<tenant>/state/manifest.json`

**Contenu** :
```json
{
  "version": "1.0",
  "tenant_id": "<tenant>",
  "created_at": "2026-01-12T00:00:00Z",
  "universes": ["odoo"],
  "environments": ["stinger"],
  "domain_mode": "saas",
  "units": {
    "platform": [],
    "odoo": ["odoo", "postgres"]
  },
  "images": {
    "odoo": "odoo:18.0-20250819",
    "postgres": "postgres:16"
  }
}
```

**Exemple** : `tenants/conceptsun97139/state/manifest.json`
```json
{
  "version": "1.0",
  "tenant_id": "conceptsun97139",
  "created_at": "2026-01-12T00:00:00Z",
  "universes": ["odoo"],
  "environments": ["stinger"],
  "domain_mode": "saas",
  "units": {
    "platform": [],
    "odoo": ["odoo", "postgres"]
  },
  "images": {
    "odoo": "odoo:18.0-20250819",
    "postgres": "postgres:16"
  }
}
```

**Points clés** :
- ✅ `tenant_id` : Identifiant du tenant (doit correspondre au slug DNS)
- ✅ `units.platform: []` : Tableau vide = aucun service platform requis
- ✅ `environments: ["stinger"]` : Environnement STINGER uniquement

---

### Étape 3 : Ajouter la Route dans Caddyfile

**Fichier** : `units/gateway/Caddyfile`

**Ajouter** :
```caddyfile
# Tenant: <tenant> - Environment: stinger

# odoo - Environnements (tenant <tenant>)
odoo.stinger.<tenant>.doreviateam.com {
  reverse_proxy odoo_stinger_<tenant>:8069
}
```

**Exemple** :
```caddyfile
# Tenant: conceptsun97139 - Environment: stinger

# odoo - Environnements (tenant conceptsun97139)
odoo.stinger.conceptsun97139.doreviateam.com {
  reverse_proxy odoo_stinger_conceptsun97139:8069
}
```

**Recharger Caddy** :
```bash
dorevia.sh gateway reload
```

---

### Étape 4 : Créer l'Enregistrement DNS

**Chez le registrar** (OVH/Cloudflare/IONOS) :

**Enregistrement A** :
```
Type    : A
Nom     : odoo.stinger.<tenant>
Valeur  : IP_SERVEUR
TTL     : 3600
```

**Exemple** :
```
Type    : A
Nom     : odoo.stinger.conceptsun97139
Valeur  : 85.215.206.213
TTL     : 3600
```

**Vérification** :
```bash
dig odoo.stinger.<tenant>.doreviateam.com +short
# Attendu : IP_SERVEUR
```

---

### Étape 5 : Démarrer Odoo

**Commande** :
```bash
dorevia.sh app up odoo stinger <tenant>
```

**Exemple** :
```bash
dorevia.sh app up odoo stinger conceptsun97139
```

**Comportement attendu** :
1. ✅ `check_platform_up()` lit le manifest
2. ✅ Détecte `units.platform: []` (vide)
3. ✅ Retourne success sans vérification
4. ✅ Odoo démarre avec sa base PostgreSQL

**Résultat** :
- ✅ Container `odoo_stinger_<tenant>` démarré
- ✅ Container `odoo_db_stinger_<tenant>` démarré
- ✅ Aucun container DVIG/Vault

---

### Étape 6 : Vérifier l'Accès

**URL** : `https://odoo.stinger.<tenant>.doreviateam.com`

**Premier accès** :
1. Odoo affiche l'assistant de configuration
2. Créer la base de données initiale
3. Configurer l'utilisateur admin
4. Accéder à l'interface Odoo

---

## ✅ Checklist Complète

### Prérequis
- [ ] Identifiant tenant choisi (slug DNS valide)
- [ ] IP du serveur connue
- [ ] Accès au registrar pour créer DNS
- [ ] Accès au serveur pour créer manifest et routes

### Création
- [ ] Structure répertoires créée : `tenants/<tenant>/`
- [ ] Manifest créé : `tenants/<tenant>/state/manifest.json`
- [ ] Route Caddy ajoutée : `units/gateway/Caddyfile`
- [ ] Caddy rechargé : `dorevia.sh gateway reload`
- [ ] Enregistrement DNS créé chez le registrar

### Démarrage
- [ ] Commande exécutée : `dorevia.sh app up odoo stinger <tenant>`
- [ ] Containers démarrés : `odoo_stinger_<tenant>`, `odoo_db_stinger_<tenant>`
- [ ] URL accessible : `https://odoo.stinger.<tenant>.doreviateam.com`
- [ ] Odoo fonctionnel : Assistant de configuration visible

---

## 📝 Exemple Complet

### Tenant : `conceptsun97139`

**1. Structure** :
```bash
tenants/conceptsun97139/
├── state/
│   └── manifest.json
├── apps/
│   └── odoo/
│       └── stinger/
└── secrets/
```

**2. Manifest** :
```json
{
  "version": "1.0",
  "tenant_id": "conceptsun97139",
  "universes": ["odoo"],
  "environments": ["stinger"],
  "domain_mode": "saas",
  "units": {
    "platform": [],
    "odoo": ["odoo", "postgres"]
  }
}
```

**3. Route Caddy** :
```caddyfile
odoo.stinger.conceptsun97139.doreviateam.com {
  reverse_proxy odoo_stinger_conceptsun97139:8069
}
```

**4. DNS** :
```
odoo.stinger.conceptsun97139.doreviateam.com → 85.215.206.213
```

**5. Commande** :
```bash
dorevia.sh app up odoo stinger conceptsun97139
```

**6. URL** :
```
https://odoo.stinger.conceptsun97139.doreviateam.com
```

---

## ⚠️ Points d'Attention

### 1. Format Tenant

**Valide** :
- ✅ `conceptsun97139`
- ✅ `test-tenant`
- ✅ `mon-client`

**Invalide** :
- ❌ `Conceptsun97139` (majuscules)
- ❌ `conceptsun_97139` (underscore)
- ❌ `conceptsun.97139` (point)

### 2. Propagation DNS

**Délai** : 5-30 minutes généralement

**Vérification** :
```bash
dig odoo.stinger.<tenant>.doreviateam.com +short
```

### 3. Convention de Nommage

**Container** : `odoo_stinger_<tenant>` (underscore)  
**URL** : `odoo.stinger.<tenant>.doreviateam.com` (point)

**Important** : Respecter exactement la convention dans le Caddyfile

---

## 🎯 Résumé

**Éléments à fournir** :
1. ✅ **Tenant** : Identifiant (slug DNS valide)
2. ✅ **DNS** : Enregistrement A pour `odoo.stinger.<tenant>.doreviateam.com`

**Éléments à créer** :
1. ✅ Manifest avec `units.platform: []`
2. ✅ Route dans Caddyfile
3. ✅ Structure de répertoires

**Commande finale** :
```bash
dorevia.sh app up odoo stinger <tenant>
```

---

**Références** :
- `GUIDE_CLIENT_INITIATION_ODOO_STINGER.md` : Guide détaillé
- `SPEC_DVIG_VAULT_OPTIONNELS_v1.0.md` : Spécification technique
