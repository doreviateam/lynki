# 📋 Schémas de Validation — Dorevia Platform

Ce répertoire contient les schémas de validation pour la Phase 1.

## manifest.schema.json

Schéma JSON Schema pour valider les manifests Phase 1.

### Structure validée

- `tenant_id` : Slug technique DNS (obligatoire)
- `universes[]` : Liste des univers activés (obligatoire)
- `environments[]` : Liste des environnements activés (obligatoire)
- `domain_mode` : Mode de domaine (Phase 1: "saas" uniquement)
- `units{}` : Units techniques par catégorie (obligatoire)
- `secrets_refs{}` : Références vers secrets (optionnel)
- `images{}` : Versions d'images Docker (optionnel)
- `created_at` : Date de création ISO 8601 (optionnel)
- `version` : Version du manifest (optionnel)

### Validation

#### Validation basique (jq)

```bash
./lib/validate.sh tenants/core/state/manifest.json
```

#### Validation complète (ajv-cli)

```bash
npm install -g ajv-cli
ajv validate -s schemas/manifest.schema.json -d tenants/core/state/manifest.json
```

### Exemple de manifest valide

Voir `tenants/core/state/manifest.json` (à enrichir en Sprint 1).

