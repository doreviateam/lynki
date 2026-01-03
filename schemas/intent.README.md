# Schéma de Configuration Intention v2.0

**Version** : 2.0  
**Date** : 2025-01-29  
**Fichier** : `schemas/intent.schema.json`

---

## Vue d'Ensemble

Ce schéma JSON Schema valide les configurations intention capturées via le CLI interactif (`dorevia.sh prompt`). Une intention représente une décision opérateur capturée avant exécution, permettant la séparation intention/exécution.

---

## Structure

### Champs Obligatoires

- `version` : Version du format (actuellement "2.0")
- `tenant_id` : Identifiant du tenant (slug DNS)
- `environment` : Environnement cible (`lab`, `stinger`, `prod`)
- `created_at` : Date/heure de création (ISO 8601)
- `intention` : Configuration de l'intention

### Champs Optionnels

- `created_by` : Identifiant opérateur (email)
- `metadata` : Métadonnées additionnelles (notes, tags)

---

## Structure `intention`

### `universes` (obligatoire)

Liste des univers activés. Valeurs possibles :
- `odoo`
- `pos`
- `sylius`

**Exemple** :
```json
"universes": ["odoo"]
```

### `mode` (obligatoire)

Mode de production. Valeurs possibles :
- `saas` : SaaS Dorevia (standard)
- `client` : Domaine et/ou serveur client
- `hybrid` : Hybride (warm standby)

**Exemple** :
```json
"mode": "saas"
```

### `domains` (obligatoire)

Configuration des domaines.

**Champs** :
- `canonical` (obligatoire) : Domaine canonique (ex: `doreviateam.com`)
- `aliases` (optionnel) : Liste des alias

**Exemple** :
```json
"domains": {
  "canonical": "doreviateam.com",
  "aliases": [
    {
      "service": "odoo",
      "hostname": "erp.client.com"
    }
  ]
}
```

### `preflight` (optionnel)

Configuration du préflight.

**Champs** :
- `enabled` : Activer le préflight (défaut: `true`)
- `install_controlled` : Autoriser installation contrôlée (défaut: `false`)

**Exemple** :
```json
"preflight": {
  "enabled": true,
  "install_controlled": false
}
```

### `server` (optionnel)

Configuration serveur (si mode `client` ou `hybrid`).

**Champs** :
- `target` : Cible de déploiement (`doreviateam`, `client`, `hybrid`)
- `public_ip` : IP publique du serveur
- `ssh_user` : Utilisateur SSH

**Exemple** :
```json
"server": {
  "target": "client",
  "public_ip": "192.0.2.1",
  "ssh_user": "ubuntu"
}
```

---

## Exemple Complet

```json
{
  "version": "2.0",
  "tenant_id": "core",
  "environment": "prod",
  "created_at": "2025-01-29T12:00:00Z",
  "created_by": "operator@doreviateam.com",
  "intention": {
    "universes": ["odoo"],
    "mode": "saas",
    "domains": {
      "canonical": "doreviateam.com",
      "aliases": []
    },
    "preflight": {
      "enabled": true,
      "install_controlled": false
    }
  },
  "metadata": {
    "notes": "Déploiement initial production",
    "tags": ["production", "initial"]
  }
}
```

---

## Validation

### Avec Python

```python
import json
import jsonschema

schema = json.load(open("schemas/intent.schema.json"))
intent = json.load(open("tenants/core/state/intents/intent-20250129.json"))

jsonschema.validate(intent, schema)
```

### Avec jq

```bash
# Validation basique (structure JSON)
jq empty tenants/core/state/intents/intent-20250129.json

# Validation complète nécessite un outil externe (ajv, jsonschema)
```

### Avec ajv-cli

```bash
npm install -g ajv-cli
ajv validate -s schemas/intent.schema.json -d tenants/core/state/intents/intent-20250129.json
```

---

## Relation avec manifest.json

Une intention peut être convertie en `manifest.json` (Phase 1) pour compatibilité :

- `intention.universes` → `manifest.universes`
- `intention.mode` → `manifest.domain_mode`
- `intention.domains.canonical` → `manifest.base_domain`
- `intention.domains.aliases` → `manifest.aliases` (Phase 3)

---

**Dernière mise à jour** : 2025-01-29  
**Version** : 2.0

